#!/bin/sh
# 一键上线数字猫猫到 https://cat.kunkunzheten.top（Cloudflare Worker，09ol 账号）。不用浏览器登录。
# 用法（任意目录都行）：sh <仓库目录>/deploy.sh
# 令牌只从 Mac 钥匙串读，不落盘、不进命令行参数；服务名可用 CF_TOKEN_SERVICE 覆盖。
# 网址、关掉 workers.dev 等设置都在 wrangler.jsonc。
# 打赏收款（/api/tip，worker/index.js）要三把 Worker secret，只需设一次、部署不会覆盖：
#   WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY_BASE64（Waffo 正式 key）/ WAFFO_TEST_PRIVATE_KEY_BASE64（测试 key）
set -e
cd "$(dirname "$0")"
ACCOUNT_ID=278bffbe3f8a893f65326340ef580dba
SERVICE="${CF_TOKEN_SERVICE:-cloudflare-api-token/online-tarot-deploy}"

# 0. 钥匙串里没有令牌就先停下
security find-generic-password -s "$SERVICE" >/dev/null 2>&1 || { echo "钥匙串里没有 Cloudflare 令牌（$SERVICE），先存一个能部署 Workers 的令牌"; exit 1; }

# 1. 打包（带缓存戳）
npx --yes esbuild@0.25.10 src/main.js --bundle --minify --format=esm --target=es2020,safari15 --outfile=dist/app.js --log-level=warning
sed -i '' -E "s#dist/app\.js(\?v=[0-9a-f]+)?\"#dist/app.js?v=$(md5 -q dist/app.js | cut -c1-8)\"#" index.html

# 2. 只放页面真正加载的文件（备份 / 测试页不上公网）
rm -rf _deploy && mkdir -p _deploy/dist
cp index.html _deploy/ && cp dist/app.js _deploy/dist/ && cp -R audio _deploy/audio
cp about.html privacy.html terms.html thanks.html site.js site.css page.js page.css site.webmanifest \
   favicon.svg favicon-32.png icon-180.png icon-512.png og.png about-cat.jpg _deploy/
[ -d worker/node_modules ] || npm ci --prefix worker --silent || npm install --prefix worker --silent

# 3. 发布
CLOUDFLARE_API_TOKEN="$(security find-generic-password -s "$SERVICE" -w)" CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID \
  WRANGLER_SEND_METRICS=false CI=1 wrangler deploy
echo "--- 正式地址 ---"
echo "https://cat.kunkunzheten.top"
