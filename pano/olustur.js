// Pano: aktif projelerin iş listeleri, son commit, son oturum ve dünkü token tek sayfada. Model çağırmaz.
// Kullanım: node pano/olustur.js  → ~/pano/index.html (tarayıcıda aç: file:///home/<kullanıcı>/pano/index.html)
const fs = require('fs'), os = require('os'), path = require('path'), { execSync } = require('child_process');
const KOK = path.dirname(__dirname);
const ayar = JSON.parse(fs.readFileSync(process.env.PROJELER || path.join(KOK, 'projeler.json'), 'utf8'));
const genislet = (p) => p.replace(/^~/, os.homedir());
const sh = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const kac = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (s) => kac(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

// Dünkü token raporu (token/gunluk-rapor.sh yazar)
const raporDir = path.join(os.homedir(), 'token-rapor');
const raporlar = fs.existsSync(raporDir) ? fs.readdirSync(raporDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.txt$/.test(f)).sort() : [];
const rapor = raporlar.length ? fs.readFileSync(path.join(raporDir, raporlar.at(-1)), 'utf8') : '';
// Son 24 saatin canlı alarmları (token/canli-alarm.sh yazar: "YYYY-MM-DD HH:MM  metin", TR saati); pano.json'da token.uyarilar'a eklenir
const alarmDosya = path.join(raporDir, 'canli-alarm.log');
const alarmlar = (fs.existsSync(alarmDosya) ? fs.readFileSync(alarmDosya, 'utf8').split('\n') : [])
  .map((l) => l.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})  (.*)/)).filter(Boolean)
  .filter((m) => Date.now() - Date.parse(`${m[1]}T${m[2]}:00+03:00`) < 864e5)
  .map((m) => `${m[2]} · ${m[3]}`).reverse();

function isListesi(dosya) {
  if (!fs.existsSync(dosya)) return null;
  const bolum = []; let b = null;
  for (const l of fs.readFileSync(dosya, 'utf8').split('\n')) {
    const h = l.match(/^##\s+(.*)/);
    if (h) { b = { ad: h[1].trim(), acik: [], yapildi: [] }; bolum.push(b); continue; }
    if (!b) continue;
    const m = l.match(/^\s*- \[( |x|X)\]\s+(.*)/);
    if (m) { (m[1] === ' ' ? b.acik : b.yapildi).push(m[2]); continue; }
    // İşaretsiz madde ("- **…**", "1. **…**"; Bunker OS): yalnız girintisiz satır, devamı sayılmaz
    const d = l.match(/^(?:-|\d+\.)\s+(.*)/);
    if (d) (/^bitti|^kapand/i.test(b.ad) ? b.yapildi : b.acik).push(d[1]);
  }
  return bolum;
}

// Yol haritası: tablo satırları ya da madde işaretleri (ilk sütun = ne, son iki sütun = hedef ve durum)
function yolHaritasi(dosya) {
  if (!fs.existsSync(dosya)) return null;
  const madde = [];
  for (const l of fs.readFileSync(dosya, 'utf8').split('\n')) {
    if (/^\|/.test(l) && !/^\|\s*-/.test(l)) {
      const h = l.split('|').slice(1, -1).map((x) => x.trim());
      if (!h[0] || /^(ne|iş|is|sürüm|surum)$/i.test(h[0])) continue;
      madde.push(h.length > 2 ? `${h[0]} — ${h.slice(-2).filter(Boolean).join(' · ')}` : h.join(' — '));
    } else if (/^\s*[-*] /.test(l)) madde.push(l.replace(/^\s*[-*] (\[[ xX]\] )?/, ''));
  }
  return madde;
}
const liste = (b, n) => `<ul>${b.slice(0, n).map((x) => `<li>${md(x.slice(0, 200))}</li>`).join('')}${b.length > n ? `<li class="soluk">… +${b.length - n}</li>` : ''}</ul>`;
const bag = (f, ad) => fs.existsSync(f) ? ` <a href="file://${encodeURI(f)}">${ad}</a>` : '';

// Proje uyarıları ve CI (izle/izle.js --json; yalnız "Şimdi"si olan projeler)
let izle = {}; try { izle = JSON.parse(sh(`node '${path.join(KOK, 'izle', 'izle.js')}' --json`) || '{}'); } catch {}

const veri = { olusturma: new Date().toISOString(), projeler: [] };
const kart = ayar.projeler.map((p) => {
  const yol = genislet(p.yol);
  if (!fs.existsSync(yol)) return '';
  const son = sh(`git -C '${yol}' log -1 --format='%ad · %s' --date=format:'%d.%m %H:%M' -- .`).slice(0, 110); // alt klasörse yalnız onun commit'i
  const dal = sh(`git -C '${yol}' branch --show-current`);
  const gitDir = sh(`git -C '${yol}' rev-parse --path-format=absolute --git-common-dir`);
  const idx = path.join(gitDir, 'hafiza', path.relative(sh(`git -C '${yol}' rev-parse --show-toplevel`), yol), 'kisa', 'INDEX.md');
  const sonOturum = fs.existsSync(idx) ? (fs.readFileSync(idx, 'utf8').trim().split('\n').filter((l) => l.startsWith('- ')).at(-1) || '').replace(/ · `.*`$/, '').slice(2) : '';
  const tokSatir = rapor.split('\n').find((l) => l.startsWith(path.relative(path.join(os.homedir(), 'projects'), yol).replace(/[^A-Za-z0-9]/g, '-') + ' '));
  const tok = tokSatir ? tokSatir.trim().split(/\s{2,}/) : null;
  const isDosya = path.join(yol, p.yapilacaklar || 'YAPILACAKLAR.md');
  // Yol haritası yerine başka bir dosya ve başlık (ör. Yönetim'in HEDEFLER.md'si): projeler.json → yolHaritasi, yolHaritasiAdi
  const yhDosya = path.join(yol, p.yolHaritasi || 'docs/YOL-HARITASI.md'), yhAd = p.yolHaritasiAdi || 'Yol haritası';
  const yh = yolHaritasi(yhDosya), bolum = isListesi(isDosya);
  let govde = '';
  govde += `<h3>${kac(yhAd)}${bag(yhDosya, 'tamamı')}</h3>` + (yh && yh.length ? liste(yh, 6) : `<p class="soluk">${kac(path.relative(yol, yhDosya))} yok</p>`);
  if (!bolum) govde += '<p class="soluk">İş listesi yok</p>';
  else {
    const acik = bolum.filter((b) => b.acik.length && !/^bitti|^kapand/i.test(b.ad));
    govde += acik.map((b, k) => `<h3>${kac(b.ad)} <span class="sayi">${b.acik.length}</span>${k === 0 ? bag(isDosya, 'liste') : ''}</h3>${liste(b.acik, /^şimdi/i.test(b.ad) ? 1 : 4)}`).join('') || '<p class="soluk">Açık iş yok</p>';
  }
  // Son yapılanlar: listenin "Bitti"si varsa o, yoksa son 7 günün ürün commit'leri (docs/chore hariç)
  const bitti = bolum && bolum.find((b) => /^bitti/i.test(b.ad));
  const sonIs = bitti && bitti.yapildi.length ? bitti.yapildi.slice(-5).reverse()
    : sh(`git -C '${yol}' log --since='7 days ago' --no-merges --format='%ad %s' --date=format:'%d.%m'`).split('\n').filter((l) => /^\S+ (feat|fix|perf|refactor)/.test(l)).slice(0, 5).map((l) => l.length > 120 ? l.slice(0, 117) + '…' : l);
  if (sonIs.length) govde += `<h3>Son yapılanlar</h3>${liste(sonIs, 5)}`;
  const iz = izle[p.ad];
  if (iz && iz.uyarilar.length) govde = `<h3 class="uyari">Uyarılar <span class="sayi">${iz.uyarilar.length}</span></h3>${liste(iz.uyarilar, 5)}` + govde;
  veri.projeler.push({ ad: p.ad, ...(p.yolHaritasiAdi ? { yolHaritasiAdi: p.yolHaritasiAdi } : {}), ...(iz ? { uyarilar: iz.uyarilar, ci: iz.ci } : {}), dal, sonCommit: son, sonOturum,
    token: tok ? { dun: tok[1], ort7: tok[2], modeller: tok[4] || '' } : null, // tok[3] ağırlıklı
    yolHaritasi: yh || [], bolumler: (bolum || []).map((b) => ({ ad: b.ad, acik: b.acik, bitti: b.yapildi })), sonYapilanlar: sonIs });
  return `<section class="kart"><header><h2>${kac(p.ad)}</h2><span class="dal">${kac(dal)}</span></header>
  <dl><dt>Son commit</dt><dd>${kac(son || '-')}</dd><dt>Son oturum</dt><dd>${kac(sonOturum || '-')}</dd>
  ${iz && iz.ci.durum !== '-' ? `<dt>CI</dt><dd>${kac(iz.ci.durum)}</dd>` : ''}<dt>Dün token</dt><dd>${tok ? `${kac(tok[1])} milyar · 7 gün ort. ${kac(tok[2])}${tok[3] ? ` · ${kac(tok[3])}` : ''}` : '-'}</dd></dl>${govde}</section>`;
}).join('\n');

// Günlük token geçmişi (token/gecmis.js yazar): son 155 gün, milyar; proje adları projeler.json'dakiler
const gecmisDosya = path.join(raporDir, 'gecmis.json');
let gecmisHam = {}; try { gecmisHam = JSON.parse(fs.readFileSync(gecmisDosya, 'utf8')); } catch {}
const kisaAd = Object.fromEntries(ayar.projeler.map((p) => [path.relative(path.join(os.homedir(), 'projects'), genislet(p.yol)).replace(/[^A-Za-z0-9]/g, '-'), p.ad]));
const mr3 = (n) => Math.round(n / 1e6) / 1e3;
// Klasör → kart adı: tam eşleşme, aynı klasörün kopyası ya da worktree'si ("<klasör>-…", ör. Bunker-OS-crm), projeler.json'daki tokenKlasorleri; gerisi "Diğer"
const kartAdi = (k) => kisaAd[k] || (Object.entries(kisaAd).find(([a]) => k.startsWith(a + '-')) || [])[1]
  || (ayar.projeler.find((p) => (p.tokenKlasorleri || []).includes(k)) || {}).ad || 'Diğer';
const gecmis = Object.keys(gecmisHam).sort().filter((g) => Date.now() - Date.parse(g) < 155 * 864e5).map((g) => {
  const pr = {};
  for (const [k, t] of Object.entries(gecmisHam[g])) pr[kartAdi(k)] = (pr[kartAdi(k)] || 0) + t;
  const en = Object.entries(pr).sort((a, b) => b[1] - a[1]).slice(0, 40);
  return { gun: g, toplam: mr3(Object.values(pr).reduce((a, b) => a + b, 0)), projeler: Object.fromEntries(en.map(([k, t]) => [k, mr3(t)])) };
});
const ozet = rapor.split('\n')[0] || 'Token raporu henüz yok';
const uyari = (rapor.split('Uyarılar:')[1] || '').trim();
const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Çalışma Panosu</title><style>
:root{--zemin:#f6f7f9;--kart:#fff;--yazi:#1d2330;--soluk:#6b7280;--cizgi:#e5e7eb;--vurgu:#2563eb;--uyari:#b45309}
@media (prefers-color-scheme:dark){:root{--zemin:#111418;--kart:#1a1f26;--yazi:#e6e9ee;--soluk:#9aa3af;--cizgi:#2b323c;--vurgu:#60a5fa;--uyari:#fbbf24}}
*{box-sizing:border-box}body{margin:0;background:var(--zemin);color:var(--yazi);font:15px/1.45 system-ui,sans-serif;padding:16px}
h1{font-size:20px;margin:0 0 4px}.ust{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.ozet{color:var(--soluk)}.uyari{color:var(--uyari);white-space:pre-wrap}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
.kart{background:var(--kart);border:1px solid var(--cizgi);border-radius:10px;padding:14px 16px}
.kart header{display:flex;justify-content:space-between;align-items:baseline}.kart h2{font-size:17px;margin:0}
.dal{font:12px ui-monospace,monospace;color:var(--soluk)}dl{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:13px;margin:10px 0}
dt{color:var(--soluk)}dd{margin:0;overflow-wrap:anywhere}h3{font-size:14px;margin:12px 0 4px}.sayi{color:var(--soluk);font-weight:normal}
ul{margin:0;padding-left:18px}a{color:var(--vurgu);font-size:12px;font-weight:normal;margin-left:6px}li{margin:2px 0;overflow-wrap:anywhere}code{font-size:12px}.soluk{color:var(--soluk)}
details{margin-top:20px}pre{background:var(--kart);border:1px solid var(--cizgi);border-radius:8px;padding:12px;overflow-x:auto;font-size:12px}
</style></head><body>
<div class="ust"><div><h1>Çalışma Panosu</h1><div class="ozet">${kac(ozet)}</div>${uyari ? `<div class="uyari">${kac(uyari)}</div>` : ''}
${alarmlar.length ? `<h3 class="uyari">Canlı alarmlar, son 24 saat <span class="sayi">${alarmlar.length}</span>${bag(alarmDosya, 'kayıt')}</h3><ul>${alarmlar.slice(0, 10).map((x) => `<li>${kac(x)}</li>`).join('')}${alarmlar.length > 10 ? `<li class="soluk">… +${alarmlar.length - 10}</li>` : ''}</ul>` : '<div class="soluk">Son 24 saatte canlı alarm yok</div>'}</div>
<div class="soluk">Güncellendi: ${new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 16).replace('T', ' ')}</div></div>
<main>${kart}</main>
<details><summary>Token raporunun tamamı</summary><pre>${kac(rapor || '-')}</pre></details>
</body></html>`;
const cikti = path.join(os.homedir(), 'pano'); fs.mkdirSync(cikti, { recursive: true });
fs.writeFileSync(path.join(cikti, 'index.html'), html);
veri.token = { ozet, gecmis, uyarilar: [...alarmlar.map((x) => `Canlı alarm ${x}`), ...(uyari ? uyari.split('\n').map((x) => x.replace(/^⚠ /, '')) : [])], rapor };
fs.writeFileSync(path.join(cikti, 'pano.json'), JSON.stringify(veri, null, 1));
console.log(path.join(cikti, 'index.html'));
