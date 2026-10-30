import { chromium, devices } from '../../_tools/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const base='https://cat.kunkunzheten.top';
const report={at:new Date().toISOString(),main:execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim(),assets:[],devices:[]};
for(const path of ['index.html','dist/app.js','site.js','site.css','about.html','page.js','page.css','privacy.html','terms.html','thanks.html','robots.txt','sitemap.xml','og.png','worker/index.js']){
 if(path.startsWith('worker/'))continue;
 const r=await fetch(base+'/'+(path==='index.html'?'':path),{headers:{'Cache-Control':'no-cache'}});const online=Buffer.from(await r.arrayBuffer());const main=execFileSync('git',['show','origin/main:'+path]);
 report.assets.push({path,status:r.status,equal:online.equals(main),onlineHash:createHash('sha256').update(online).digest('hex'),mainHash:createHash('sha256').update(main).digest('hex')});
 if(path==='dist/app.js')report.shareCopy={zh:online.toString().includes('拍了一下猫屁屁'),en:online.toString().includes('One little pat, one very happy purr.')};
}
report.tipStatus=await (await fetch(base+'/api/tip/status')).json();
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-swiftshader','--use-gl=angle']});
for(const [name,options] of [['desktop',{viewport:{width:1440,height:1000}}],['mobile',{...devices['iPhone 13']}]] ){
 const context=await browser.newContext(options);const p=await context.newPage();const d={name,errors:[],badResponses:[]};p.on('pageerror',e=>d.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)d.badResponses.push({url:r.url(),status:r.status()});});
 await p.goto(base+'/?lang=zh',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 d.initial=await p.evaluate(()=>({title:document.title,hint:document.querySelector('#hint')?.innerText,body:document.body.innerText,scroll:{height:document.documentElement.scrollHeight,viewport:innerHeight,overflow:getComputedStyle(document.body).overflow}}));
 await p.screenshot({path:`deliverables/dene2211/${name}-home.png`});
 const box=await p.locator('#gl').boundingBox();
 for(let i=0;i<24;i++){await p.mouse.click(box.x+box.width*.5,box.y+box.height*.56);await p.waitForTimeout(110);}
 d.interaction=await p.evaluate(()=>({count:document.querySelector('#num').textContent,buttUp:document.body.dataset.buttUp,done:document.querySelector('#done').className}));
 await p.screenshot({path:`deliverables/dene2211/${name}-played.png`});
 await p.locator('#bar .chip').nth(1).click();await p.waitForTimeout(500);d.switchCat=await p.locator('#bar .chip.on').innerText();
 await p.locator('#mute').click();d.mute=await p.locator('#mute').getAttribute('class');
 await p.locator('#sharebtn').click();await p.waitForTimeout(800);d.tipVisible=await p.locator('.cat-tip').isVisible();d.cardImage=await p.locator('#cardimg').evaluate(e=>({loaded:e.complete,width:e.naturalWidth,height:e.naturalHeight}));
 await p.screenshot({path:`deliverables/dene2211/${name}-card-tip.png`});
 await p.locator('.cat-tip').click();await p.waitForLoadState('domcontentloaded');await p.waitForTimeout(3500);d.checkout={url:p.url(),text:(await p.locator('body').innerText()).slice(0,9000)};
 await p.screenshot({path:`deliverables/dene2211/${name}-checkout.png`,fullPage:true});
 await p.goto(base+'/about?lang=zh#faq',{waitUntil:'networkidle'});d.about=await p.locator('body').innerText();await p.screenshot({path:`deliverables/dene2211/${name}-faq.png`,fullPage:true});
 await p.goto(base+'/?lang=en',{waitUntil:'networkidle'});d.english={title:await p.title(),hint:await p.locator('#hint').innerText()};await p.mouse.wheel(0,900);d.afterScroll=await p.evaluate(()=>({y:scrollY,text:document.body.innerText}));
 report.devices.push(d);await context.close();
}
await browser.close();writeFileSync('deliverables/dene2211/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
