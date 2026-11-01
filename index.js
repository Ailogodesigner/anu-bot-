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

// STEP 0: Self-Healing File Structure Check
// If a zip archive was extracted on Linux with Windows backslashes ('\'),
// Linux treats them as literal filenames rather than directories.
// We auto-detect and restore the correct folder tree here.
function healBackslashedFiles(dir) {
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      if (entry.includes("\\")) {
        const normalized = entry.replace(/\\+/g, "/");
        const targetPath = path.join(dir, normalized);
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        try {
          fs.renameSync(fullPath, targetPath);
          console.log(`🔧 Restored file structure: ${entry} -> ${normalized}`);
        } catch (e) {
          // If rename fails, try copy & unlink
          fs.copyFileSync(fullPath, targetPath);
          fs.unlinkSync(fullPath);
        }
      }
    }
  } catch (err) {
    console.warn("Notice during directory structure check:", err.message);
  }
}
healBackslashedFiles(__dirname);

// STEP 1: Verify & generate Prisma Database Schema
const prismaSchemaCandidates = [
  path.join(__dirname, "prisma", "schema.prisma"),
  path.join(__dirname, "schema.prisma")
];
let resolvedSchema = prismaSchemaCandidates.find(p => fs.existsSync(p));

if (resolvedSchema) {
  console.log(`🗄️ Syncing SQLite database schema (${resolvedSchema})...`);
  try {
    execSync(`npx prisma generate --schema="${resolvedSchema}"`, { stdio: "inherit" });
    execSync(`npx prisma db push --accept-data-loss --schema="${resolvedSchema}"`, { stdio: "inherit" });
  } catch (err) {
    console.warn("Notice during Prisma DB sync:", err?.message || err);
  }
} else {
  console.warn("⚠️ Warning: schema.prisma not found. Attempting standard db push...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  } catch (e) {
    console.error("Prisma error:", e?.message || e);
  }
}

// STEP 2: Verify Next.js Production Build
// We check for .next/BUILD_ID which is required by Next.js in production mode.
const buildIdPath = path.join(__dirname, ".next", "BUILD_ID");
if (!fs.existsSync(buildIdPath)) {
  console.log("⚡ Building Next.js production app (first startup)...");
  try {
    execSync("npx next build", { stdio: "inherit" });
  } catch (err) {
    console.error("Next.js build warning:", err?.message || err);
  }
} else {
  console.log("✅ Production build (.next/BUILD_ID) verified.");
}

// STEP 3: Start Next.js production server on 0.0.0.0:${port}
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
