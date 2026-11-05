// gunluk-topla.js çıktılarını birleştirip kısa Türkçe rapor yazar. Model çağırmaz.
// Girdi (stdin): her satır "<klasör adı>\t<json>". Çıktı: rapor metni; ilk satır bildirim özeti.
const satirlar = require('fs').readFileSync(0, 'utf8').split('\n').filter(Boolean);
const projeAdi = (k) => k.replace(/^-home-[^-]+-projects-/, '').replace(/^-workspaces-/, '') || k;
const mr = (n) => (n / 1e9).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const trGun = (ms) => new Date(ms + 3 * 36e5).toISOString().slice(0, 10);
const dun = trGun(Date.now() - 864e5);

const proje = {}; // ad → { gun: {g: {model: {top, yeni}}}, oturum: [] }
for (const s of satirlar) {
  const [k, j] = s.split('\t');
  let v; try { v = JSON.parse(j); } catch { continue; }
  const p = (proje[projeAdi(k)] ||= { gun: {}, oturum: [] });
  for (const [g, mods] of Object.entries(v.gun)) for (const [m, x] of Object.entries(mods)) {
    const y = ((p.gun[g] ||= {})[m] ||= { top: 0, yeni: 0 });
    y.top += x.top; y.yeni += x.yeni;
  }
  for (const [sid, o] of Object.entries(v.oturum)) p.oturum.push({ sid, ...o });
}

const gunTop = (p, g) => Object.values(p.gun[g] || {}).reduce((a, x) => a + x.top, 0);
const gunYeni = (p, g) => Object.values(p.gun[g] || {}).reduce((a, x) => a + x.yeni, 0);
const onceki7 = [...Array(7)].map((_, i) => trGun(Date.now() - (i + 2) * 864e5));

let toplam = 0, toplamYeni = 0, ort7 = 0;
const satir = [], uyari = [];
for (const [ad, p] of Object.entries(proje)) {
  const d = gunTop(p, dun), o = onceki7.reduce((a, g) => a + gunTop(p, g), 0) / 7;
  toplam += d; toplamYeni += gunYeni(p, dun); ort7 += o;
  if (d < 5e6 && o < 5e6) continue;
  const mod = Object.entries(p.gun[dun] || {}).sort((a, b) => b[1].top - a[1].top)
    .filter(([, x]) => x.top >= 1e7).map(([m, x]) => `${m} ${mr(x.top)}`).join(' · ');
  satir.push([d, `${ad.padEnd(24)} ${mr(d).padStart(6)}   ${mr(o).padStart(6)}   ${mod}`]);
  if (d > 3e8 && d > 2 * o) uyari.push(`${ad}: dün ${mr(d)} milyar, 7 günlük ortalamanın ${(d / Math.max(o, 1)).toFixed(1)} katı`);
  for (const s of p.oturum) {
    const saat = (Date.parse(s.son) - Date.parse(s.bas)) / 36e5;
    if (saat > 12 && s.son24 > 5e8 && Date.now() - Date.parse(s.son) < 864e5)
      uyari.push(`${ad}: ${Math.round(saat)} saattir süren oturum, son 24 saatte ${mr(s.son24)} milyar (${s.sid.slice(0, 8)}, "${s.ilk}")`);
  }
}
satir.sort((a, b) => b[0] - a[0]);
const ozet = `Token ${dun}: ${mr(toplam)} milyar (7 gün ort. ${mr(ort7)})${uyari.length ? ` · ⚠ ${uyari.length} uyarı` : ''}`;
console.log(ozet);
console.log(`\nToplam ${mr(toplam)} milyar; önbellekten okuma hariç ${(toplamYeni / 1e6).toFixed(0)} milyon.\n`);
console.log(`${'Proje'.padEnd(24)} ${'dün'.padStart(6)}   ${'7g ort'.padStart(6)}   model (milyar)`);
for (const [, s] of satir) console.log(s);
console.log(uyari.length ? `\nUyarılar:\n${uyari.map((u) => '⚠ ' + u).join('\n')}` : '\nUyarı yok.');
