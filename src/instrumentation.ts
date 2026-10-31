export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Automatically initialize Discord Bot Gateway if configured
    try {
      if (
        process.env.DISCORD_BOT_TOKEN &&
        process.env.DISCORD_BOT_TOKEN !== "your_discord_bot_token_here"
      ) {
        console.log("[Instrumentation] Initializing Discord Bot Gateway for Server 1528401268354056293...");
        await import("./bot/index");
      }
    } catch (err: any) {
      console.warn("[Instrumentation] Bot Gateway notice:", err?.message || err);
    }

    // Automatically detect Render's public URL or configured application URL
    const targetUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL;

    if (targetUrl && !targetUrl.includes("localhost")) {
      const pingInterval = 8 * 60 * 1000; // Ping every 8 minutes
      console.log(`[KeepAlive] 24/7 background worker active: pinging ${targetUrl}/api/health every 8 minutes.`);

      setInterval(async () => {
        try {
          const healthUrl = `${targetUrl.replace(/\/$/, "")}/api/health`;
          const res = await fetch(healthUrl, {
            headers: { "User-Agent": "Render-24-7-KeepAlive" },
          });
          if (res.ok) {
            console.log(`[KeepAlive] Self-ping successful at ${new Date().toISOString()}`);
          }
        } catch (err: any) {
          console.warn(`[KeepAlive] Self-ping error:`, err?.message || err);
        }
      }, pingInterval);
    }
  }
}
