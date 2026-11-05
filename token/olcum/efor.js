const fs=require('fs'),path=require('path'),readline=require('readline');
const [root,since]=process.argv.slice(2);
function tum(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())o.push(...tum(p));else if(e.name.endsWith('.jsonl')&&fs.statSync(p).mtime.toISOString()>=since)o.push(p);}return o;}
(async()=>{const seen=new Set();const g={};
for(const f of tum(root)){const rl=readline.createInterface({input:fs.createReadStream(f),crlfDelay:Infinity});
for await(const l of rl){let o;try{o=JSON.parse(l)}catch{continue}
if(o.type!=='assistant'||(o.timestamp||'')<since)continue;const m=o.message||{};if(!m.id||seen.has(m.id)||m.model==='<synthetic>')continue;seen.add(m.id);
const u=m.usage||{};const k=`${(m.model||'?').replace('claude-','')} ${o.effort||'-'} ${o.isSidechain?'alt':'ana'}`;
const x=(g[k]||={n:0,ctx:0,out:0});x.n++;x.out+=u.output_tokens||0;x.ctx+=(u.input_tokens||0)+(u.cache_creation_input_tokens||0)+(u.cache_read_input_tokens||0);}}
for(const [k,x] of Object.entries(g).sort((a,b)=>b[1].n-a[1].n)) if(x.n>50) console.log(k.padEnd(26),'çağrı',String(x.n).padStart(6),'· toplam',(x.ctx/1e6).toFixed(0).padStart(5)+'M','· çıktı/çağrı',Math.round(x.out/x.n),'· bağlam/çağrı',Math.round(x.ctx/x.n/1000)+'k');})();
