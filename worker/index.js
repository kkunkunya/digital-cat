// Serves the static site and one tip checkout. Waffo Pancake is the merchant of record (our existing
// merchant account, but its own "Digital Cat" store so tips never mix with another store's orders).
//   GET /api/tip/status          → { live }  (front end hides the tip until live)
//   GET /api/tip?tier=can&lang=zh[&mode=test] → 303 to the Waffo checkout
// Secrets: WAFFO_MERCHANT_ID, WAFFO_PRIVATE_KEY_BASE64 (prod), WAFFO_TEST_PRIVATE_KEY_BASE64 (test).
// Vars (wrangler.jsonc): WAFFO_PRODUCT_TIP, TIP_LIVE ("1" once Waffo approves the store for production).
import { DurableObject } from "cloudflare:workers";
import { TaxCategory, WaffoPancake } from "@waffo/pancake-ts";

// Anonymous event counters (DENE-2239): only (day, event, price group, first-time flag) -> count. No IDs, IPs or cookies.
//   POST /api/e  { e, g?, o? }       count one event
//   GET  /api/e/stats?key=...        JSON counts per day (key = STATS_KEY secret)
const EVENTS = new Set(["pack_entry_shown", "pack_open", "pack_interest", "pack_pick", "mood_shown", "mood_dismiss", "mood_open", "memo_claim", "return_visit"]);
export class Counter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS c (day TEXT, e TEXT, g TEXT, o INTEGER, n INTEGER, PRIMARY KEY (day, e, g, o))");
  }
  add(e, g, o) {
    const day = new Date().toISOString().slice(0, 10);
    this.ctx.storage.sql.exec("INSERT INTO c VALUES (?, ?, ?, ?, 1) ON CONFLICT(day, e, g, o) DO UPDATE SET n = n + 1", day, e, g, o);
  }
  stats() { return this.ctx.storage.sql.exec("SELECT day, e, g, o, n FROM c ORDER BY day, e, g, o").toArray(); }
}

const TIERS = { can: "2.99", fish: "4.99", tower: "9.99" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/tip/status") {
      return Response.json({ live: env.TIP_LIVE === "1" }, { headers: { "cache-control": "no-store" } });
    }
    if (url.pathname === "/api/tip") return tip(url, env);
    if (url.pathname === "/api/e") return event(request, env);
    if (url.pathname === "/api/e/stats") return stats(url, env);
    return env.ASSETS.fetch(request);
  },
};

async function tip(url, env) {
  const test = url.searchParams.get("mode") === "test";
  const lang = url.searchParams.get("lang") === "en" ? "en" : "zh";
  const tier = Object.hasOwn(TIERS, url.searchParams.get("tier")) ? url.searchParams.get("tier") : "can";
  const back = `${url.origin}/about.html?lang=${lang}`;
  if (!test && env.TIP_LIVE !== "1") return Response.redirect(back, 303);
  const key = test ? env.WAFFO_TEST_PRIVATE_KEY_BASE64 : env.WAFFO_PRIVATE_KEY_BASE64;
  try {
    const client = new WaffoPancake({ merchantId: env.WAFFO_MERCHANT_ID, privateKey: Buffer.from(key, "base64").toString("utf8") });
    const session = await client.checkout.createSession({
      productId: env.WAFFO_PRODUCT_TIP,
      currency: "USD",
      priceSnapshot: { amount: TIERS[tier], taxCategory: TaxCategory.DigitalGoods },
      successUrl: `${url.origin}/thanks.html?lang=${lang}`,
      language: lang === "en" ? "en" : "zh-Hans",
      metadata: { site: "digital-cat", tier, lang },
    });
    return Response.redirect(session.checkoutUrl, 303);
  } catch (error) {
    console.error("tip checkout failed", test ? "test" : "live", tier, String(error?.message ?? error));
    return Response.redirect(back, 303);
  }
}

const counter = (env) => env.COUNTER.get(env.COUNTER.idFromName("main"));

async function event(request, env) {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  let b = null;
  try { b = JSON.parse((await request.text()).slice(0, 200)); } catch { /* ignore */ }
  if (b && EVENTS.has(b.e)) {
    const g = ["199", "299"].includes(String(b.g)) ? String(b.g) : "";
    await counter(env).add(b.e, g, b.o ? 1 : 0);
  }
  return new Response(null, { status: 204 });
}

async function stats(url, env) {
  if (!env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) return new Response("no", { status: 403 });
  return Response.json(await counter(env).stats(), { headers: { "cache-control": "no-store" } });
}
