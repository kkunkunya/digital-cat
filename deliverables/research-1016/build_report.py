from pathlib import Path
from html import escape
import base64
import csv
import io
import json
import re

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "seo-promo-2026-10-16.html"


def load(name):
    return json.loads((ROOT / name).read_text())


def image(name, caption):
    payload = base64.b64encode((ROOT / name).read_bytes()).decode()
    return (
        '<figure><img loading="lazy" src="data:image/png;base64,'
        + payload
        + '" alt="'
        + escape(caption, quote=True)
        + '"><figcaption>'
        + escape(caption)
        + "</figcaption></figure>"
    )


trends = load("trends-data.json")
terms = ["cat bounce", "slap cat", "cat game online", "virtual cat petting", "pet the cat"]
slugs = ["cat-bounce", "slap-cat", "cat-game-online", "virtual-cat-petting", "pet-the-cat"]
average = list(map(int, trends["tables"][0].splitlines()[1].split("\t")[1:]))
weekly = []
for row in trends["tables"][1].splitlines()[1:]:
    parts = row.split("\t")
    weekly.append([re.sub(r"[\u202a-\u202e]", "", parts[0]), *map(int, parts[1:])])
assert len(weekly) == 53 and average == [5, 2, 4, 0, 45]

intent = [
    "品牌/网站导航词；联想词也混入弹跳屋、股票等意图。作为对标词观察。",
    "混合梗图、GIF、卡牌与小游戏；不作为温柔拍猫的主标题。",
    "游戏意图最清楚；免费、免下载、在线玩是可直接承接的需求。优先主词。",
    "准确描述玩法；Trends 为 0，联想词仍出现在线摸猫。作为辅助描述。",
    "平均指数最高，但联想词大量为 Pete the Cat 童书/动画。避免只追这个词。",
]
keyword_rows = ""
for i, term in enumerate(terms):
    peak = max(row[i + 1] for row in weekly)
    peak_dates = [row[0] for row in weekly if row[i + 1] == peak]
    peak_label = "全期 0" if peak == 0 else (f"{peak} · {peak_dates[0]}" + (" 等" if len(peak_dates) > 1 else ""))
    keyword_rows += (
        f"<tr><th scope='row'>{escape(term)}</th><td><b>{average[i]}</b></td>"
        f"<td>{weekly[-1][i + 1]}</td><td>{escape(peak_label)}</td><td>{intent[i]}</td></tr>"
    )
weekly_rows = "".join(
    "<tr>" + "".join(f"<td>{escape(str(value))}</td>" for value in row) + "</tr>"
    for row in weekly
)
csv_file = io.StringIO()
writer = csv.writer(csv_file)
writer.writerow(["Week", *terms])
writer.writerows(weekly)
csv_uri = "data:text/csv;base64," + base64.b64encode(csv_file.getvalue().encode()).decode()

autocomplete_cards = ""
for term, slug in zip(terms, slugs):
    data = load(f"autocomplete-{slug}.json")
    assert data["query"] == term and len(data["suggestions"]) == 10
    items = "".join("<li>" + escape(s).replace("\n", " · ") + "</li>" for s in data["suggestions"])
    autocomplete_cards += (
        f"<details class='card'><summary>{escape(term)} · 10 条可见联想词 + 截图</summary>"
        f"<ol class='suggestions'>{items}</ol>"
        + image(f"autocomplete-{slug}.png", f"Google 搜索框实测：{term}；2026-10-16 14:19–14:20 CDT；英文界面、gl=us。")
        + "</details>"
    )

drafts = [
    {
        "id": "reddit-drop-project",
        "title": "一句话介绍你正在做的项目",
        "url": "https://www.reddit.com/r/SideProject/comments/1x6tmly/what_are_you_building_right_now_drop_your_project/",
        "date": "2026-10-15 13:32 CDT（原始时间 2026-10-15T18:32:37.591Z）",
        "original": "What are you building right now? Drop your project 👇",
        "request": "原帖要求留下项目名字，再用一句话说明做什么；作者说会查看。帖内已有浏览器游戏等创作者自荐。",
        "permission": "原帖明确邀请自荐，并要求项目名 + 一句话描述；页面的社区说明也写明用于分享项目和接收建设性反馈。草稿保持一句话，不借其他作品的评论串插广告。",
        "fit": "适合测试陌生人能否一眼读懂“拍猫 → 呼噜 → 短休息”。受众是创作者，不冒称这里有人正在找撸猫小游戏。",
        "draft": "Mine is Digital Cats: a cat that purrs when you pat its butt, a tiny phone-browser toy I made for a thirty-second break with real cat sounds.",
        "followup": "Here's the little cat: https://cat.kunkunzheten.top/",
    },
    {
        "id": "reddit-free-promo",
        "title": "提交项目，征集 15–30 秒演示视频",
        "url": "https://www.reddit.com/r/SideProject/comments/1x78ino/drop_your_side_project_ill_turn_a_few_into_free/",
        "date": "2026-10-16 01:10 CDT（原始时间 2026-10-16T06:10:43.746Z）",
        "original": "Drop your side project. I'll turn a few into free promo videos.",
        "request": "原帖邀请提交网站、游戏等项目，挑选部分制作免费 15–30 秒视频，并征求结果反馈。",
        "permission": "原帖明确欢迎游戏/网站，并写了“Drop your link”。链接按批准草稿放在正文下的首条回复。没有申请、私信、注册或承诺购买视频服务。",
        "fit": "适合交流“哪一瞬间值得拍成短片”，可能取得创作反馈或素材合作；这不是已取得的推广效果，也不是解压用户求推荐帖。",
        "draft": "I'd love a clip that starts with one pat on a cat's butt and a ridiculously content purr. That's pretty much the whole experience. I made Digital Cats, a tiny phone-browser toy with real cat sounds; a fifteen-second close-up of that interaction feels right to me.",
        "followup": "This is the toy I mean: https://cat.kunkunzheten.top/",
    },
]
publication = load("reddit-published.json")
published = {item["id"]: item for item in publication["posts"]}
completed = sum(bool(item.get("link_reply", {}).get("url")) for item in published.values())
assert set(published).issubset(item["id"] for item in drafts)
assert 0 <= completed <= 2
publication_headline = (
    "获准的两条回复已按原文发布。"
    if completed == 2
    else f"获准回复已完成 {completed} 组，其余等待 Reddit 冷却后提交。"
)
draft_cards = ""
for i, item in enumerate(drafts, 1):
    record = published.get(item["id"], {})
    main = record.get("main", {})
    followup = record.get("link_reply", {})
    if main:
        assert main["text"] == item["draft"]
    if followup:
        assert followup["text"] == item["followup"]
    state = "已发布并核验" if followup.get("url") else "网址跟评待完成"
    evidence = (
        f"<p><b>正文回复：</b><a href='{escape(main['url'], quote=True)}'>"
        f"{escape(main['url'])}</a></p>"
        if main.get("url") else "<p>正文尚未发布。</p>"
    )
    if followup.get("url"):
        evidence += (
            f"<p><b>首条网址跟评：</b><a href='{escape(followup['url'], quote=True)}'>"
            f"{escape(followup['url'])}</a></p>"
        )
    if record.get("screenshot"):
        evidence += image(
            record["screenshot"],
            f"发布截图：账号 {publication['account']}；正文和首条网址跟评；{record['verified_at']}。",
        )
    draft_cards += f"""
    <section class="card post">
      <span class="badge good">回复 {i} · 原帖明确邀请自荐 · {state}</span>
      <h3>{item['title']}</h3>
      <p><a href="{item['url']}">{escape(item['original'])}</a></p>
      <p class="muted">{item['date']} · 截图核查 2026-10-16 · r/SideProject</p>
      <dl><dt>先接住原帖</dt><dd>{item['request']}</dd>
      <dt>允许自荐的依据</dt><dd>{item['permission']}</dd>
      <dt>为什么选它</dt><dd>{item['fit']}</dd></dl>
      <div class="draft"><span class="eyebrow">获准正文 · 英文 · 不含网址 · 原文保留</span><p lang="en">{escape(item['draft'])}</p></div>
      <div class="followup"><b>获准首条网址跟评 · 原文保留：</b><p lang="en">{escape(item['followup'])}</p></div>
      {evidence}
      {image(item['id'] + '.png', '原帖截图：' + item['original'] + '；正文内含征集要求与公开评论入口。')}
    </section>"""

html = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>数字猫猫 · 10月16日公开关键词与回复发布记录</title>
<style>
:root{--ink:#202820;--muted:#5d685b;--paper:#fbfaf2;--card:#fff;--line:#dce1d1;--green:#dff2ae;--coral:#f2a08b;--deep:#335142}
*{box-sizing:border-box}body{margin:0;color:var(--ink);background:radial-gradient(ellipse at 90% 0,#f8d8c8 0,transparent 27%),radial-gradient(ellipse at 0 18%,#e4f3c9 0,transparent 28%),var(--paper);font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1060px;margin:auto;padding:22px 18px 70px}header{border:1px solid var(--line);border-radius:25px;padding:30px clamp(20px,5vw,44px);background:#fffdf3ed}
h1{font-family:Georgia,"Songti SC",serif;font-size:clamp(29px,5.8vw,48px);font-weight:650;line-height:1.25;letter-spacing:-.025em;margin:18px 0}
h2{font-size:26px;line-height:1.3;margin:38px 0 12px}h3{font-size:20px;line-height:1.4;margin:13px 0 8px}p{margin:10px 0}
.stamp,.badge{display:inline-block;border-radius:20px;padding:4px 11px;font-size:13px;font-weight:700}.stamp{background:var(--green)}.badge{border:1px solid var(--line)}.lead{font-size:19px}.muted,figcaption{color:var(--muted);font-size:14px}
.note{border-left:5px solid var(--coral);background:#fff1eb;padding:13px 16px;border-radius:8px;margin:18px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:17px;padding:19px;margin:14px 0;overflow-wrap:anywhere}
nav{display:flex;gap:8px 18px;flex-wrap:wrap;margin-top:20px}a{color:#315d41;text-decoration-thickness:1px;text-underline-offset:3px;overflow-wrap:anywhere}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}.stats div{background:#edf4df;border:1px solid var(--line);padding:14px;border-radius:14px}.stats strong{display:block;font:700 31px/1.3 Georgia,serif}.stats span{font-size:13px}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:13px}table{border-collapse:collapse;width:100%;min-width:650px;background:#fff;font-size:15px}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line);vertical-align:top}thead th{background:#edf4df;white-space:nowrap}tbody th{min-width:155px}td:last-child{min-width:220px}.weekly td:last-child{min-width:0}.weekly table{font-size:13px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}.cols .card{margin:0}
figure{margin:18px 0 8px}figure img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:10px}figcaption{margin-top:7px}.image-link{display:block}
summary{cursor:pointer;font-weight:700;line-height:1.5}details[open]>summary{margin-bottom:12px}.suggestions{columns:2;column-gap:30px;padding-left:24px}.suggestions li{break-inside:avoid;margin-bottom:6px}
.priority{color:#934625;font-weight:800}.good{color:#345f40}.draft{border-left:4px solid var(--deep);background:#f2f7ea;padding:15px 18px;margin:18px 0}.draft p{font-size:18px;line-height:1.7}.eyebrow{font-size:12px;letter-spacing:.06em;color:var(--muted)}.followup{background:#f8f7ef;padding:12px 16px;border-radius:10px}dl{margin:12px 0}dt{font-weight:750;margin-top:10px}dd{margin:2px 0 0}
code{background:#f0f1e9;padding:2px 5px;border-radius:4px}ol.actions{padding:0;list-style:none;counter-reset:actions}.actions>li{counter-increment:actions}.actions h3:before{content:counter(actions,decimal-leading-zero) " / ";color:#6b7964}
@media(max-width:650px){main{padding:12px 10px 42px}header{padding:23px 18px}.cols{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr}.card{padding:16px}.suggestions{columns:1}.lead{font-size:18px}h2{font-size:24px}.draft p{font-size:17px}}
@media print{details{display:block}figure img{max-height:450px;object-fit:contain}.card{break-inside:avoid}body{background:#fff}nav{display:none}}
</style></head><body><main>
<header><span class="stamp">数字猫猫 · 第 1 轮 · 2026-10-16 · 待审核</span>
<h1>先接“在线猫咪小游戏”的需求；@@PUBLICATION_HEADLINE@@</h1>
<p class="lead">五词公开实测已完成。<b>cat game online</b> 的联想词最清楚指向“免费、在线玩、免下载”；<b>pet the cat</b> 虽然 Trends 平均指数最高，实际混入了童书、宠物用品等意图，不宜拿最高指数直接当主词。</p>
<p>当前产品：<a href="https://cat.kunkunzheten.top/">数字猫猫 / Digital Cats</a>，拍猫屁屁、听真猫呼噜的手机网页小玩具。</p>
<div class="stats"><div><strong>5</strong><span>Google Trends 对比词</span></div><div><strong>50</strong><span>可见联想词条目（5 × 10）</span></div><div><strong>2</strong><span>明确邀请自荐的真实原帖</span></div><div><strong>@@PUBLISHED_COUNT@@</strong><span>已完成发布的获准回复组</span></div></div>
<div class="note">本轮采用 Google 公开来源，Semrush 已退出要求。Kun 已在经理群说“发”；本次只执行批准的两条 r/SideProject 回复，每条正文下另有一条批准的网址跟评，文字逐字保留。使用 Kun 日常 Chrome 中已登录的 Reddit 账号 <b>@@ACCOUNT@@</b>，未重启浏览器。回复以创作者本人视角如实说明“我做的”。</div>
<nav aria-label="报告导航"><a href="#keywords">关键词数字</a><a href="#autocomplete">联想词截图</a><a href="#compare">逐站对比</a><a href="#actions">6 条改动建议</a><a href="#drafts">原帖与发布凭证</a><a href="#next">下一轮</a></nav>
</header>

<section id="keywords"><h2>01 · 五词关键词实测</h2>
<p><a href="@@TRENDS_URL@@">打开同一组 Google Trends 对比</a>。范围：<b>美国 · 过去 12 个月 · 所有类别 · 网页搜索 · 搜索字词</b>，同一比较组内的 0–100 相对热度。采样于 2026-10-16 14:19 CDT；页面周表覆盖 2025-10-12 至 2026-10-11，共 53 个周起始日期。</p>
<div class="scroll"><table><thead><tr><th>关键词</th><th>页面平均指数</th><th>最新周指数<br>10月11日起</th><th>周峰值 / 日期</th><th>判断与用途</th></tr></thead><tbody>@@KEYWORD_ROWS@@</tbody></table></div>
<p class="muted">平均值直接读取 Trends 图表可访问表格的 Average 行；不是自行四舍五入计算。最新一周可能尚未结束，不据此宣称环比升降。0 表示没有足够可展示的数据，不表示没人搜。以上指数不是月搜索量、关键词难度或排名。</p>
@@TRENDS_IMAGE@@
<details class="card"><summary>数据口径与 53 周原始数值</summary>
<p>Google 官方说明：先按地点和时间范围内的总搜索量归一化，再缩放到 0–100；小众词可能显示 0。更换比较词或时间窗口会影响尺度。搜索联想还受地点、历史及过滤策略影响，不能把联想排序当成搜索量排行。来源：<a href="https://support.google.com/trends/answer/4365533?hl=en">Google Trends 数据说明</a>。</p>
<p><a download="digital-cats-trends-US-2026-10-16.csv" href="@@CSV_URI@@">下载本报告内嵌的周表 CSV</a>。原图图表的 Average 行：<code>5 / 2 / 4 / 0 / 45</code>。</p>
<div class="scroll weekly"><table><thead><tr><th>周起始日期（UTC）</th>@@WEEKLY_HEAD@@</tr></thead><tbody>@@WEEKLY_ROWS@@</tbody></table></div></details>
<div class="card"><h3>为什么不选指数最高的词？</h3>
<p><b>这是意图判断，不是流量预测。</b>cat game online 的联想中有免费、立即玩、免下载，也有多人/好友需求；本站只能承接其中的单人短休息部分。virtual cat petting 的玩法描述很准确，即使本组热度为 0，也可以自然出现在说明中。</p>
<p>pet the cat 在 Google 联想中大量转向 Pete the Cat 童书和动画。Trends 的该词“上升相关查询”首屏又出现宠物食品、宠物友好租房和宠物床；cat bounce 的相关查询混入手表和美妆。这些都是意图噪声信号，不把混杂词的指数当作本站可获得的访问量。</p></div></section>

<section id="autocomplete"><h2>02 · Google 联想词：50 条原样留档</h2>
<p>在 Google 搜索框依次输入五个完整关键词，展开下拉预测，逐页截图。英文界面、<code>hl=en&amp;gl=us</code>；沿用 Kun 日常浏览器，未消除个性化影响。每组计数是现场可见的 <b>10 条</b>，总共 <b>50 条条目</b>，不是 50 个去重需求，也不是搜索量。</p>
<p>最可承接的组合是 <b>cat game online free / no download</b>；辅助玩法词为 <b>virtual cat petting / online cat petting</b>。以下每组可展开原词和原始截图。</p>
@@AUTOCOMPLETE@@</section>

<section id="compare"><h2>03 · 逐站对比：动作、声音和可发现性</h2>
<p class="muted">Purrli 与 Poki 在本轮重新读取了实际 HTML 元数据和页面。Cat Bounce 保留同日先前成功访问的可见观察；14:27 再访报 ERR_CONNECTION_CLOSED，不把未取得的字段补成事实。出站链接是页面自身链接，不是付费 SEO 工具中的反向链接数据库。</p>
<div class="cols">
<article class="card"><span class="badge">更近的声音解压对标</span><h3><a href="https://purrli.com/">Purrli</a></h3>
<dl><dt>实际 title</dt><dd lang="en">The Internet has a Cat! Meet Purrli, the Online Cat Purr Generator.</dd>
<dt>meta description</dt><dd>强调身边仿佛有猫、在线重建猫的声音和陪伴感，并说明免费；先讲感受，再讲声音功能。</dd>
<dt>首屏与结构</dt><dd>猫咪播放器与六组声音调节条先出现，下方再讲原理、故事与支持方式；页首可跳到说明、使用场景、故障帮助。</dd>
<dt>分享卡配置</dt><dd>OG 标题、描述、图片均存在；X 卡类型为 summary_large_image，另有 X 专用图片。这里核到的是 HTML 声明，未声称平台实际预览一定一致。</dd>
<dt>内链 / 外链</dt><dd>页内导航连接播放器与说明；外链到作者的 myNoise 和相关呼噜声音页面，以及 X、Facebook、Instagram。</dd>
<dt>本站可取</dt><dd>先让人理解声音带来的感受；保留立即开玩的入口，再补一句声音来源和开声提示。</dd></dl></article>
<article class="card"><span class="badge">搜索意图与页面结构对标</span><h3><a href="https://poki.com/en/g/cat-simulator">Poki · Cat Simulator</a></h3>
<dl><dt>实际 title</dt><dd lang="en">Cat Simulator - Play Online for Free! | Poki</dd>
<dt>meta description</dt><dd>明确免费在线玩，并列出手机、平板、电脑；强调免下载、免登录。OG 描述与之相同。</dd>
<dt>首屏与结构</dt><dd>游戏封面/iframe、名称、开发者和评价优先。下方有玩法说明、控制方式、免费/设备问题、开发者与相关类别；现场有广告准备状态。</dd>
<dt>分享卡配置</dt><dd>OG 标题、描述、1200 × 1200 PNG、图片替代文本和视频字段均存在；未实测社媒抓取预览。</dd>
<dt>内链 / 外链</dt><dd>猫咪、动物、模拟、舒适游戏等分类与同作者游戏形成内链；帮助、隐私、开发者入口在页脚。不是“越多链接越好”的证据。</dd>
<dt>本站可取</dt><dd>标题说清是什么，说明中写清手机、免费和免下载；保留小玩具的单一动作，不照搬大型游戏门户。</dd></dl></article>
</div>
<details class="card"><summary>两家页面实测截图</summary>
@@PURRLI_IMAGE@@
@@POKI_IMAGE@@
</details>
<div class="card"><h3><a href="https://cat-bounce.com/">Cat Bounce：第一秒就能玩</a></h3>
<p>同日先前成功访问时，浏览器标题为“CAT BOUNCE!”；首屏是弹跳猫互动，提供加猫动作、站内说明页，以及带短预填文案的 X 分享入口。可借鉴即时动作和短分享句。本轮再访连接被关闭，未取得 meta/OG 字段；本轮主要元数据对比采用上面两家已成功访问的站。</p></div>
<div class="card"><h3>数字猫猫当前在线基线</h3>
<p>14:28 CDT 的英文现场标题为“Digital Cats · Pat it, it purrs”；描述仍有中文“三秒回血”，与主卖点“30 秒”不一致。OG 大图已配置为 <b>1200 × 630</b>。首屏已有轻拍和横拖提示；页脚已有 FAQ、条款、隐私、开源、声音来源链接，以及免下载/免登录说明。英文页还明确说明可选一次性 <b>US$2.99</b> 小费、不是订阅。建议应复用这些已有内容。</p></div></section>

<section id="actions"><h2>04 · 页面改动清单：6 条，按优先级</h2>
<p>只交建议，本轮未改生产站。预期作用是需要后续检验的判断，不承诺排名或转化上涨。</p>
<ol class="actions">
<li class="card"><h3><span class="priority">P1</span> 标题先交代“在线猫咪小游戏”</h3><dl>
<dt>改哪里</dt><dd>首页 title 的中英文版本。</dd>
<dt>改成什么</dt><dd>中文：“在线撸猫解压小游戏｜数字猫猫”；英文：“Cat Game Online | Digital Cats · Real Purrs”。</dd>
<dt>参照哪个站</dt><dd><a href="https://poki.com/en/g/cat-simulator">Poki Cat Simulator</a> 的类别 + 在线免费意图；结合本轮 cat game online 联想。</dd>
<dt>预计作用</dt><dd>搜索结果里先认出这是能立即玩的网页小玩具；用描述补足拍猫玩法，避免多人/养成预期。</dd></dl></li>
<li class="card"><h3><span class="priority">P1</span> 搜索描述统一短休息承诺</h3><dl>
<dt>改哪里</dt><dd>meta description 与 OG description 的中英文文案。</dd>
<dt>改成什么</dt><dd>“上班累了？手机拍一下猫屁屁，听真猫呼噜，轻松休息 30 秒。免费开玩，免下载免登录。”英文对应：“A tiny cat game online: pat a cat, hear real purrs, and take a thirty-second break. Free to play, no download or sign-up.”</dd>
<dt>参照哪个站</dt><dd><a href="https://poki.com/en/g/cat-simulator">Poki</a> 的设备/门槛表达；<a href="https://purrli.com/">Purrli</a> 的声音和感受表达。</dd>
<dt>预计作用</dt><dd>把当前“三秒”与“30 秒”的冲突消掉，同时接住 free/no download 的联想需求。</dd></dl></li>
<li class="card"><h3><span class="priority">P1</span> 第一屏留一句能让人停下来的话</h3><dl>
<dt>改哪里</dt><dd>现有轻拍提示附近，保留猫和点击区域优先。</dd>
<dt>改成什么</dt><dd>“这只数字猫，拍一下屁屁就舒服地呼噜。真猫录音，点一下听听。”英文：“Pat its butt. Hear that happy little purr.” 保留现有声控入口；静音时提示开启声音。</dd>
<dt>参照哪个站</dt><dd><a href="https://cat-bounce.com/">Cat Bounce</a> 的即时动作；<a href="https://purrli.com/">Purrli</a> 的声音体验先行。</dd>
<dt>预计作用</dt><dd>把玩法和反馈接在一起，给用户第一次轻拍的理由；不增加教程步骤。</dd></dl></li>
<li class="card"><h3><span class="priority">P2</span> 分享文案接住刚才的反应</h3><dl>
<dt>改哪里</dt><dd>现有分享按钮的预填文案和 OG 文字；复用已配置的大图。</dd>
<dt>改成什么</dt><dd>“拍了一下猫屁屁，它居然舒服地呼噜了。你也试试？”英文：“One little pat, one very happy purr. Your turn.”</dd>
<dt>参照哪个站</dt><dd><a href="https://cat-bounce.com/">Cat Bounce</a> 的简短 X 预填句；<a href="https://purrli.com/">Purrli</a> 的大图卡字段。</dd>
<dt>预计作用</dt><dd>让分享内容来自用户刚做的事，容易转述；正式改动后仍须检查社媒实际预览。</dd></dl></li>
<li class="card"><h3><span class="priority">P2</span> 在已有 FAQ 中回答最短的三个问题</h3><dl>
<dt>改哪里</dt><dd>当前 about.html 的 FAQ 与首页 FAQ 入口，不另造一套介绍页。</dd>
<dt>改成什么</dt><dd>“怎么玩？点猫屁屁，横拖换视角。”“手机能玩？浏览器直接开，免下载免登录。”“要花钱？基础玩法免费，可选一次性 US$2.99 小费，非订阅。”把虚拟拍猫和真猫录音分清。</dd>
<dt>参照哪个站</dt><dd><a href="https://poki.com/en/g/cat-simulator">Poki</a> 的玩法、设备和免费问题。</dd>
<dt>预计作用</dt><dd>对齐用户进站前的疑问，也让可索引文本准确描述已有功能和收费边界。</dd></dl></li>
<li class="card"><h3><span class="priority">P3</span> 复用声音来源与帮助内链</h3><dl>
<dt>改哪里</dt><dd>现有 FAQ、声音来源、隐私链接附近的锚文本和中英文一致性。</dd>
<dt>改成什么</dt><dd>保留一个清晰的“怎么玩 / 声音来自哪里 / 隐私与小费”短链组；沿用既有 FAQ、CREDITS.txt、privacy.html、terms.html 页面，不加分类页。</dd>
<dt>参照哪个站</dt><dd><a href="https://purrli.com/">Purrli</a> 的播放器—说明—帮助页内导航；<a href="https://poki.com/en/g/cat-simulator">Poki</a> 的相关内容可发现性。</dd>
<dt>预计作用</dt><dd>访客能找到声音依据与费用说明，同时保持 30 秒玩具的轻量体验。</dd></dl></li>
</ol></section>

<section id="drafts"><h2>05 · 两条获准回复：原帖、原文与发布凭证</h2>
<p>两条均在近两周内，原帖明确邀请分享自己的项目。它们属于<b>创作者交流/反馈场景</b>，不是伪装成别人求解压推荐。正文先回应原帖要求，产品只自然提到一次；不编造“我玩了一周”“上班天天用”等经历。</p>
<div class="note"><b>发布状态：@@PUBLISHED_COUNT@@ 组已完成。</b>每组含一条不带网址的正文与其下首条网址跟评。下方保留原帖链接、批准原文、实际回复链接和账号内截图。核验时间：@@VERIFIED_AT@@。平台最终展示与后续版务处理仍以实时页面为准，不把成功提交等同于取得曝光或推广效果。</div>
@@DRAFTS@@
<details class="card"><summary>为什么没有照单全投 r/WebGames / InternetIsBeautiful / cats / X？</summary>
<p><a href="https://www.reddit.com/r/WebGames/">r/WebGames</a> 规则要求新帖是单个网页游戏的直接链接、标题以游戏名开头、免注册，并有三个月重发间隔。置顶 Find-A-Game 实际是找回忘名旧游戏；本轮近期评论没有匹配的 30 秒拍猫需求，不能因为有人贴链接就视为合适推广串。</p>
<p><a href="https://www.reddit.com/r/InternetIsBeautiful/">r/InternetIsBeautiful</a> 显示禁止网页游戏，并限制专为自荐设计的账号；<a href="https://www.reddit.com/r/cats/">r/cats</a> 显示禁止广告，本轮没有核到允许广告的日常串豁免。因此选用原帖明确征集项目的 r/SideProject。</p>
<p>X 的近两周“Fun Websites”话题已检查到公开回复入口，但公开可回复不等于作者明确邀请自荐；本轮以两条许可更清楚的 Reddit 原帖交付，不把 X 话题当作已核准入口。</p></details>
</section>

<section id="next"><h2>06 · 每 3 天一轮，下一次 10 月 19 日</h2>
<p>沿用这五个词和美国/过去 12 个月口径，保存当次截图与新数值；补看联想词的意图变化。每轮找 2–3 条近两周内、明确允许自荐或相关推荐的原帖，按帖子诉求单独写草稿，继续等 Kun 的发布指令。只在实际发布后记录回复 URL 与结果。</p>
<p>下一轮计划日期：<b>2026-10-19 CDT</b>。本 HTML 留存执行口径；未建立自动定时任务。当前 CLI 的 autopilot list 返回资源不存在，不能声称系统已排好自动执行。</p>
<p class="muted">报告采用页面现场读取的相对指数、可见联想词与规则，没有购买量/排名预测；没有网站代码改动，因此不需要代码 PR。所有图片与 CSV 都在文件内，离线可读；点外部来源才会联网。截图可以展开查看，文字表和草稿适配手机。</p>
</section>
<footer class="muted">DENE-2196 · 核查日期 2026-10-16 · Google 数据 14:19–14:20 CDT；页面/帖子研究核查至 14:29 CDT；回复发布核验 @@VERIFIED_AT@@。此版含获准回复发布凭证。</footer>
</main></body></html>
"""
replacements = {
    "@@PUBLICATION_HEADLINE@@": publication_headline,
    "@@PUBLISHED_COUNT@@": str(completed),
    "@@ACCOUNT@@": escape(publication["account"]),
    "@@VERIFIED_AT@@": escape(publication["verified_at"]),
    "@@TRENDS_URL@@": escape(trends["url"], quote=True),
    "@@KEYWORD_ROWS@@": keyword_rows,
    "@@TRENDS_IMAGE@@": image("trends-initial.png", "Google Trends 原始图：同一五词比较组，United States / Past 12 months / Web Search；平均数取自图表可访问表格。"),
    "@@CSV_URI@@": csv_uri,
    "@@WEEKLY_HEAD@@": "".join("<th>" + escape(t) + "</th>" for t in terms),
    "@@WEEKLY_ROWS@@": weekly_rows,
    "@@AUTOCOMPLETE@@": autocomplete_cards,
    "@@PURRLI_IMAGE@@": image("competitor-purrli.png", "Purrli：播放器、声音调节和说明入口；2026-10-16 实测。"),
    "@@POKI_IMAGE@@": image("competitor-poki.png", "Poki Cat Simulator：游戏入口、名称、开发者与相关游戏；2026-10-16 实测。"),
    "@@DRAFTS@@": draft_cards,
}
for old, new in replacements.items():
    html = html.replace(old, new)
assert "@@" not in html
assert all("http" not in item["draft"] for item in drafts)
OUT.write_text(html, encoding="utf-8")
print(json.dumps({"file": str(OUT), "bytes": OUT.stat().st_size, "weekly_rows": len(weekly), "drafts": len(drafts), "images": html.count("<img ")}, ensure_ascii=False))
