// Bir projects klasöründeki oturum kayıtlarından gün × model token toplamı ve oturum özeti. Salt okuma.
// Kullanım: node gunluk-topla.js <projects/klasoru> <kac-gun>   → stdout'a tek satır JSON
// Gün Türkiye saatine göre (UTC+3). Mesaj kimliğine göre tekilleştirir, alt ajanlar dahil.
const fs = require('fs'), path = require('path'), readline = require('readline');
const [root, gunStr] = process.argv.slice(2);
const sinirMs = Date.now() - Number(gunStr || 8) * 864e5;

function dosyalar(d) {
  const o = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) o.push(...dosyalar(p));
    else if (e.name.endsWith('.jsonl') && fs.statSync(p).mtimeMs >= sinirMs) o.push(p);
  }
  return o;
}
const trGun = (ts) => new Date(Date.parse(ts) + 3 * 36e5).toISOString().slice(0, 10);

(async () => {
  const gun = {}, oturum = {}, goruldu = new Set();
  for (const f of dosyalar(root)) {
    const sid = path.relative(root, f).split(path.sep)[0].replace(/\.jsonl$/, '');
    const s = (oturum[sid] ||= { ilk: '', bas: '', son: '', son24: 0 });
    const rl = readline.createInterface({ input: fs.createReadStream(f), crlfDelay: Infinity });
    for await (const l of rl) {
      let o; try { o = JSON.parse(l); } catch { continue; }
      const ts = o.timestamp;
      if (!ts || Date.parse(ts) < sinirMs) continue;
      if (!s.ilk && o.type === 'user' && !o.isSidechain) {
        let c = o.message && o.message.content;
        if (Array.isArray(c)) c = c.map((x) => (x && x.text) || '').join(' ');
        if (typeof c === 'string') s.ilk = c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
      }
      if (o.type !== 'assistant') continue;
      const m = o.message || {};
      if (!m.id || goruldu.has(m.id) || m.model === '<synthetic>') continue;
      goruldu.add(m.id);
      const u = m.usage || {};
      const yeni = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.output_tokens || 0);
      const top = yeni + (u.cache_read_input_tokens || 0);
      const mod = (m.model || '?').replace('claude-', '');
      const g = ((gun[trGun(ts)] ||= {})[mod] ||= { top: 0, yeni: 0 });
      g.top += top; g.yeni += yeni;
      if (!s.bas || ts < s.bas) s.bas = ts;
      if (ts > s.son) s.son = ts;
      if (Date.now() - Date.parse(ts) < 864e5) s.son24 += top;
    }
  }
  for (const k of Object.keys(oturum)) if (!oturum[k].son) delete oturum[k];
  console.log(JSON.stringify({ gun, oturum }));
})();
