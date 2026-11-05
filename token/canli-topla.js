// Canlı alarm için bir projects klasöründen oturum başına dakikalık token ve adım sayısı. Salt okuma, model çağırmaz.
// Kullanım: node canli-topla.js <projects/klasoru> <kac-saat> [simdi ISO]  → stdout'a tek satır JSON
// Yalnız son <kac-saat> içinde değişen dosyalar okunur; dakikalar UTC epoch dakikası. Alt ajanlar dahil, adım yalnız ana konuşma.
// Konteynerde stdin'den çalışır (docker exec -i <ad> node - ...), bu yüzden tek dosya ve yalnız Node'un kendi modülleri.
const fs = require('fs'), path = require('path');
const [root, saatStr, simdiStr] = process.argv.slice(2);
const simdi = simdiStr ? Date.parse(simdiStr) : Date.now();
const sinirMs = simdi - Number(saatStr || 6) * 36e5;

function dosyalar(d) {
  const o = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) o.push(...dosyalar(p));
    else if (e.name.endsWith('.jsonl') && fs.statSync(p).mtimeMs >= sinirMs) o.push(p);
  }
  return o;
}
// Kişinin yazdığı istek mi (araç sonucu ya da sistemin eklediği mesaj değil)
const istekMi = (o) => {
  if (o.type !== 'user' || o.isSidechain || o.isMeta) return false;
  const c = o.message && o.message.content;
  return typeof c === 'string' || (Array.isArray(c) && c.some((x) => x && x.type === 'text'));
};

// oturum → { bas, ilk, dk: { dakika: [token, adım] }, istek: [dakika, ...] }
const oturum = {}, goruldu = new Set();
for (const f of dosyalar(root)) {
  const parca = path.relative(root, f).split(path.sep), sid = parca[0].replace(/\.jsonl$/, ''), ana = parca.length === 1;
  const s = (oturum[sid] ||= { bas: '', ilk: '', dk: {}, istek: [] });
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    let o; try { o = JSON.parse(l); } catch { continue; }
    const ts = o.timestamp, ms = ts && Date.parse(ts);
    if (!ms || ms > simdi) continue;
    if (ana && (!s.bas || ts < s.bas)) s.bas = ts;
    if (ana && istekMi(o)) {
      if (!s.ilk) {
        let c = o.message.content;
        if (Array.isArray(c)) c = c.map((x) => (x && x.text) || '').join(' ');
        s.ilk = c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
      }
      s.istek.push(Math.floor(ms / 6e4));
    }
    if (o.type !== 'assistant' || ms < sinirMs - 18 * 36e5) continue; // uzun bir cevabın başı pencereden önce olabilir
    const m = o.message || {};
    if (!m.id || goruldu.has(m.id) || m.model === '<synthetic>') continue;
    goruldu.add(m.id);
    const u = m.usage || {};
    const t = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.output_tokens || 0) + (u.cache_read_input_tokens || 0);
    const x = (s.dk[Math.floor(ms / 6e4)] ||= [0, 0]);
    x[0] += t; if (ana && !o.isSidechain) x[1] += 1;
  }
  s.istek = s.istek.filter((k) => k >= Math.floor(sinirMs / 6e4) - 18 * 60);
}
for (const k of Object.keys(oturum)) if (!Object.keys(oturum[k].dk).length) delete oturum[k];
console.log(JSON.stringify(oturum));
