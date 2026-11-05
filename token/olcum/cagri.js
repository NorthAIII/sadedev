const fs=require('fs'),path=require('path'),readline=require('readline');
const [root,since]=process.argv.slice(2);
function tum(d){let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())o.push(...tum(p));else if(e.name.endsWith('.jsonl')&&fs.statSync(p).mtime.toISOString()>=since)o.push(p);}return o;}
(async()=>{const seen=new Set();let n=0,ctx=0,big=0,out=0;const hist={};
for(const f of tum(root)){const rl=readline.createInterface({input:fs.createReadStream(f),crlfDelay:Infinity});
for await(const l of rl){let o;try{o=JSON.parse(l)}catch{continue}
if(o.type!=='assistant'||(o.timestamp||'')<since)continue;const m=o.message||{};if(!m.id||seen.has(m.id)||m.model==='<synthetic>')continue;seen.add(m.id);
const u=m.usage||{};const c=(u.input_tokens||0)+(u.cache_creation_input_tokens||0)+(u.cache_read_input_tokens||0);n++;ctx+=c;out+=u.output_tokens||0;
const b=c<50e3?'<50k':c<150e3?'50-150k':c<300e3?'150-300k':c<500e3?'300-500k':'>500k';hist[b]=(hist[b]||0)+1;}}
console.log(JSON.stringify({cagri:n,ortalama_baglam:Math.round(ctx/n),cikti_ort:Math.round(out/n),hist}));})();
