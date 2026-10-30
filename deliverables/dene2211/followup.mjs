import { chromium, devices } from '../../_tools/node_modules/playwright/index.mjs';
import {writeFileSync} from 'node:fs';
const b=await chromium.launch({channel:'chrome',args:['--enable-unsafe-swiftshader']});const out=[];
for(const [name,opts] of [['desktop',{viewport:{width:1440,height:1000}}],['mobile',{...devices['iPhone 13']}]] ){
 const c=await b.newContext(opts);const p=await c.newPage();await p.goto('https://cat.kunkunzheten.top/?lang=zh',{waitUntil:'networkidle'});
 await p.mouse.move(5,(await p.evaluate(()=>innerHeight))-5);await p.mouse.wheel(0,900);await p.waitForTimeout(600);
 const d={name,scroll:await p.evaluate(()=>({y:scrollY,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,footer:document.querySelector('#sitefoot').getBoundingClientRect().toJSON(),text:document.querySelector('#sitefoot').innerText})),links:await p.locator('a').evaluateAll(es=>es.map(e=>({text:e.innerText,href:e.href})))};
 await p.screenshot({path:`deliverables/dene2211/${name}-scrolled.png`,fullPage:true});
 await p.evaluate(()=>scrollTo(0,0));await p.locator('#sharebtn').click();await p.waitForTimeout(500);
 await p.evaluate(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async args=>{window.__shareArgs={text:args.text,url:args.url,title:args.title,files:args.files?.map(f=>({name:f.name,type:f.type,size:f.size}))}}});});
 await p.locator('#savebtn').click();await p.waitForTimeout(500);d.share=await p.evaluate(()=>window.__shareArgs);
 await p.goto('https://cat.kunkunzheten.top/about?lang=zh#faq',{waitUntil:'networkidle'});await p.locator('details').evaluateAll(es=>es.forEach(e=>e.open=true));d.faq=await p.locator('#faq').innerText();await p.screenshot({path:`deliverables/dene2211/${name}-faq-expanded.png`,fullPage:true});out.push(d);await c.close();
}await b.close();writeFileSync('deliverables/dene2211/followup.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
