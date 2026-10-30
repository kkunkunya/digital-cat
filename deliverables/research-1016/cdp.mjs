import fs from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
const root = new URL('.', import.meta.url).pathname;
const stateFile = root + 'state.json';
const [port, socketPath] = fs.readFileSync('/Users/kunkun/Library/Application Support/Google/Chrome/DevToolsActivePort', 'utf8').trim().split('\n');
const ws = new WebSocket(`ws://127.0.0.1:${port}${socketPath}`);
const pending = new Map(); let nextId = 0;
ws.onmessage = event => { const m = JSON.parse(event.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } };
function send(method, params={}, sessionId) { return new Promise((resolve,reject) => { const id=++nextId; const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})); }); }
await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('CDP WebSocket handshake timeout after 12 seconds')),12000);ws.onopen=()=>{clearTimeout(timer);resolve();};ws.onerror=()=>{clearTimeout(timer);reject(new Error('CDP socket connection failed'));};}).catch(e=>{console.error(e.message);process.exit(2);});
try {
 const [action,arg,arg2] = process.argv.slice(2);
 let state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):null;
 if(action==='open') { if(state) throw new Error('Task tab already exists'); const t=await send('Target.createTarget',{url:arg||'about:blank',background:true}); state={targetId:t.targetId};fs.writeFileSync(stateFile,JSON.stringify(state)); await delay(2500); console.log('Background task tab opened'); }
 else if(action==='close'){ if(state){await send('Target.closeTarget',{targetId:state.targetId});fs.unlinkSync(stateFile);}console.log('Task tab closed'); }
 else {
  if(!state) throw new Error('No task tab');
  const {sessionId}=await send('Target.attachToTarget',{targetId:state.targetId,flatten:true});
  await send('Page.enable',{},sessionId);
  if(action==='nav'){console.log(await send('Page.navigate',{url:arg},sessionId));await delay(3000);}
  if(action==='read'){const r=await send('Runtime.evaluate',{expression:'JSON.stringify({url:location.href,title:document.title,text:document.body.innerText.slice(0,26000)})',returnByValue:true},sessionId);console.log(r.result.value);}
  if(action==='eval'){const r=await send('Runtime.evaluate',{expression:fs.readFileSync(arg,'utf8'),returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails)); console.log(JSON.stringify(r.result.value));}
  if(action==='shot'){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);fs.writeFileSync(arg,Buffer.from(r.data,'base64'));console.log('Screenshot saved: '+arg);}
  if(action==='download'){await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:arg,eventsEnabled:true});console.log('Download destination set');}
  await send('Target.detachFromTarget',{sessionId});
 }
} catch(e){console.error(e.message);process.exitCode=1;} finally{ws.close();}
