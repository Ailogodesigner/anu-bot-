const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// On Pterodactyl panels, SERVER_PORT is passed as the allocated port (e.g. 25569)
const port = process.env.SERVER_PORT || process.env.PORT || 25569;
process.env.PORT = String(port);

console.log("==========================================================");
console.log("👑 CAVRIX CLOUD BOT & WEB CONSOLE - PTERODACTYL LAUNCHER");
console.log("==========================================================");
console.log(`📡 Allocated Port: ${port}`);
console.log(`💻 Node Runtime: ${process.version}`);
console.log(`📂 Working Directory: ${process.cwd()}`);

// 1. Install dependencies if node_modules is missing
if (!fs.existsSync(path.join(__dirname, "node_modules"))) {
  console.log("📦 Installing dependencies (npm install)...");
  try {
    execSync("npm install", { stdio: "inherit" });
  } catch (err) {
    console.error("npm install failed:", err);
  }
}

// 2. Generate Prisma Client and sync SQLite database
try {
  console.log("🗄️ Syncing SQLite database schema...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
} catch (e) {
  console.warn("Notice during Prisma DB sync:", e?.message || e);
}

// 3. Build Next.js if .next directory is missing
if (!fs.existsSync(path.join(__dirname, ".next"))) {
  console.log("⚡ Building Next.js production app (first startup)...");
  try {
    execSync("npx next build", { stdio: "inherit" });
  } catch (err) {
    console.error("Next.js build warning:", err?.message || err);
  }
}

// 4. Start Next.js production server on 0.0.0.0:${port}
console.log(`🚀 Starting Cavrix Control Panel & Discord Bot on port ${port}...`);

const nextBin = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");
const child = fs.existsSync(nextBin)
  ? spawn("node", [nextBin, "start", "-p", String(port), "-H", "0.0.0.0"], {
      stdio: "inherit",
      env: { ...process.env, PORT: String(port) },
    })
  : spawn("npx", ["next", "start", "-p", String(port), "-H", "0.0.0.0"], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, PORT: String(port) },
    });

child.on("exit", (code) => {
  console.log(`Server exited with code ${code}.`);
  process.exit(code || 0);
});

child.on("error", (err) => {
  console.error("Failed to start child process:", err);
});
