// Serves the static site and one tip checkout. Waffo Pancake is the merchant of record (our existing
// merchant account, but its own "Digital Cat" store so tips never mix with another store's orders).
//   GET /api/tip/status          → { live }  (front end hides the tip until live)
//   GET /api/tip?tier=can&lang=zh[&mode=test] → 303 to the Waffo checkout
// Secrets: WAFFO_MERCHANT_ID, WAFFO_PRIVATE_KEY_BASE64 (prod), WAFFO_TEST_PRIVATE_KEY_BASE64 (test).
// Vars (wrangler.jsonc): WAFFO_PRODUCT_TIP, TIP_LIVE ("1" once Waffo approves the store for production).
import { TaxCategory, WaffoPancake } from "@waffo/pancake-ts";

const TIERS = { can: "2.99", fish: "4.99", tower: "9.99" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/tip/status") {
      return Response.json({ live: env.TIP_LIVE === "1" }, { headers: { "cache-control": "no-store" } });
    }
    if (url.pathname === "/api/tip") return tip(url, env);
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
