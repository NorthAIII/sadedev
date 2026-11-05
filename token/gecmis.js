// Günlük token geçmişi: gunluk-topla.js çıktılarını ~/token-rapor/gecmis.json'a işler. Model çağırmaz.
// Girdi (stdin): her satır "<klasör adı>\t<json>". Dosya: { "<gün>": { "<proje>": token } }, gün TR saatiyle.
// Aynı gün ve proje için büyük olan kalır: oturum kayıtları silinse de (Claude 30 günden eskisini siler, konteyner
// yeniden kurulunca içindeki kayıtlar gider) geçmiş kaybolmaz. Aynı projenin birkaç klasörü (ana makine, konteyner) toplanır.
const fs = require('fs'), os = require('os'), path = require('path');
const DOSYA = process.env.TOKEN_GECMIS || path.join(os.homedir(), 'token-rapor', 'gecmis.json');
const projeAdi = (k) => k.replace(/^-home-[^-]+-projects-/, '').replace(/^-workspaces-/, '') || k;

// Aynı klasör adı birden çok kaynaktan gelirse (bağlı klasör + konteyner, arşiv + konteyner) aynı kayıtların kopyasıdır:
// gün başına büyüğü alınır. Farklı klasörler (ana makine ve konteyner) aynı projede toplanır.
const klasor = {}; // klasör → gün → token
for (const s of fs.readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
  const [k, j] = s.split('\t');
  let v; try { v = JSON.parse(j); } catch { continue; }
  for (const [g, mods] of Object.entries(v.gun || {})) {
    const t = Object.values(mods).reduce((a, x) => a + x.top, 0), kg = (klasor[k] ||= {});
    kg[g] = Math.max(kg[g] || 0, t);
  }
}
const bu = {}; // gün → proje → token (bu çalıştırmada görülen)
for (const [k, gunler] of Object.entries(klasor)) for (const [g, t] of Object.entries(gunler)) {
  const p = projeAdi(k);
  (bu[g] ||= {})[p] = (bu[g][p] || 0) + t;
}
let gecmis = {}; try { gecmis = JSON.parse(fs.readFileSync(DOSYA, 'utf8')); } catch {}
let degisen = 0;
for (const [g, pr] of Object.entries(bu)) for (const [p, t] of Object.entries(pr)) {
  const eski = (gecmis[g] ||= {})[p] || 0;
  if (t > eski) { gecmis[g][p] = t; degisen++; }
}
const sirali = Object.fromEntries(Object.keys(gecmis).sort().map((g) => [g, gecmis[g]]));
fs.mkdirSync(path.dirname(DOSYA), { recursive: true });
fs.writeFileSync(DOSYA, JSON.stringify(sirali, null, 1));
const gunler = Object.keys(sirali);
console.log(`gecmis.json: ${gunler.length} gün (${gunler[0] || '-'} → ${gunler.at(-1) || '-'}), ${degisen} değer güncellendi`);
