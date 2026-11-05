// Oturum başına model ve token özeti. Salt okuma.
// Kullanım: node oturum.js <projects/klasoru> <since ISO> <son24 ISO>
const fs = require('fs'), path = require('path'), readline = require('readline');
const [root, since, son24] = process.argv.slice(2);

function altDosyalar(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...altDosyalar(p));
    else if (e.name.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

async function oku(f, s, ana) {
  const rl = readline.createInterface({ input: fs.createReadStream(f), crlfDelay: Infinity });
  for await (const line of rl) {
    let o; try { o = JSON.parse(line); } catch { continue; }
    const ts = o.timestamp || '';
    if (ana && o.type === 'user' && !s.ilk) {
      let c = o.message && o.message.content;
      if (Array.isArray(c)) c = c.map((x) => x && x.text || '').join(' ');
      if (typeof c === 'string' && c.trim()) s.ilk = c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);
    }
    if (ts && (!s.bas || ts < s.bas)) s.bas = ts;
    if (ts && (!s.son || ts > s.son)) s.son = ts;
    if (o.type !== 'assistant') continue;
    const m = o.message || {}, id = m.id;
    if (!id || s.goruldu.has(id)) continue;
    s.goruldu.add(id);
    const u = m.usage || {};
    const yeni = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    const onb = u.cache_read_input_tokens || 0, cik = u.output_tokens || 0;
    const mod = (m.model || '?').replace('claude-', '');
    if (mod === '<synthetic>') continue;
    const k = (s.model[mod] ||= { yeni: 0, onb: 0, cik: 0, son24: 0 });
    k.yeni += yeni; k.onb += onb; k.cik += cik;
    if (ts >= son24) k.son24 += yeni + onb + cik;
  }
}

(async () => {
  const sonuc = [];
  for (const e of fs.readdirSync(root)) {
    if (!e.endsWith('.jsonl')) continue;
    const ana = path.join(root, e), sid = e.slice(0, -6);
    if (fs.statSync(ana).mtime.toISOString() < since) continue;
    const s = { sid, goruldu: new Set(), model: {}, ilk: '', alt: 0 };
    await oku(ana, s, true);
    const alt = altDosyalar(path.join(root, sid));
    s.alt = alt.length;
    for (const f of alt) await oku(f, s, false);
    delete s.goruldu;
    sonuc.push(s);
  }
  console.log(JSON.stringify(sonuc));
})();
