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

function isListesi(dosya) {
  if (!fs.existsSync(dosya)) return null;
  const bolum = []; let b = null;
  for (const l of fs.readFileSync(dosya, 'utf8').split('\n')) {
    const h = l.match(/^##\s+(.*)/);
    if (h) { b = { ad: h[1].trim(), acik: [], bitti: 0 }; bolum.push(b); continue; }
    if (!b) continue;
    const m = l.match(/^\s*- \[( |x|X)\]\s+(.*)/);
    if (m) m[1] === ' ' ? b.acik.push(m[2]) : b.bitti++;
  }
  return bolum;
}

const kart = ayar.projeler.map((p) => {
  const yol = genislet(p.yol);
  if (!fs.existsSync(yol)) return '';
  const son = sh(`git -C '${yol}' log -1 --format='%ad · %s' --date=format:'%d.%m %H:%M'`).slice(0, 110);
  const dal = sh(`git -C '${yol}' branch --show-current`);
  const gitDir = sh(`git -C '${yol}' rev-parse --path-format=absolute --git-common-dir`);
  const idx = path.join(gitDir, 'hafiza', 'kisa', 'INDEX.md');
  const sonOturum = fs.existsSync(idx) ? (fs.readFileSync(idx, 'utf8').trim().split('\n').filter((l) => l.startsWith('- ')).at(-1) || '').replace(/ · `.*`$/, '').slice(2) : '';
  const tokSatir = rapor.split('\n').find((l) => l.startsWith(path.basename(yol).replace(/[^A-Za-z0-9]/g, '-') + ' '));
  const tok = tokSatir ? tokSatir.trim().split(/\s{2,}/) : null;
  const liste = isListesi(path.join(yol, p.yapilacaklar || 'YAPILACAKLAR.md'));
  const govde = !liste ? '<p class="soluk">İş listesi yok</p>' : liste.filter((b) => b.acik.length && !/^bitti|^kapand/i.test(b.ad))
    .map((b) => `<h3>${kac(b.ad)} <span class="sayi">${b.acik.length}</span></h3><ul>${b.acik.slice(0, 5).map((x) => `<li>${md(x.slice(0, 220))}</li>`).join('')}${b.acik.length > 5 ? `<li class="soluk">… +${b.acik.length - 5}</li>` : ''}</ul>`).join('') || '<p class="soluk">Açık iş yok</p>';
  return `<section class="kart"><header><h2>${kac(p.ad)}</h2><span class="dal">${kac(dal)}</span></header>
  <dl><dt>Son commit</dt><dd>${kac(son || '-')}</dd><dt>Son oturum</dt><dd>${kac(sonOturum || '-')}</dd>
  <dt>Dün token</dt><dd>${tok ? `${kac(tok[1])} milyar · 7 gün ort. ${kac(tok[2])}${tok[3] ? ` · ${kac(tok[3])}` : ''}` : '-'}</dd></dl>${govde}</section>`;
}).join('\n');

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
ul{margin:0;padding-left:18px}li{margin:2px 0;overflow-wrap:anywhere}code{font-size:12px}.soluk{color:var(--soluk)}
details{margin-top:20px}pre{background:var(--kart);border:1px solid var(--cizgi);border-radius:8px;padding:12px;overflow-x:auto;font-size:12px}
</style></head><body>
<div class="ust"><div><h1>Çalışma Panosu</h1><div class="ozet">${kac(ozet)}</div>${uyari ? `<div class="uyari">${kac(uyari)}</div>` : ''}</div>
<div class="soluk">Güncellendi: ${new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 16).replace('T', ' ')}</div></div>
<main>${kart}</main>
<details><summary>Token raporunun tamamı</summary><pre>${kac(rapor || '-')}</pre></details>
</body></html>`;
const cikti = path.join(os.homedir(), 'pano'); fs.mkdirSync(cikti, { recursive: true });
fs.writeFileSync(path.join(cikti, 'index.html'), html);
console.log(path.join(cikti, 'index.html'));
