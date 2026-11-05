// Sade düzen izlemesi: her proje için tek satır ve uyarılar. Model çağırmaz, dosyalara ve git'e bakar.
// Kullanım: node izle/izle.js  (ana makinede; konteynerde ~/projects yoksa /workspaces/<klasör> denenir)
// Uyarı varsa çıkış kodu 1. --json: tablo yerine { <proje>: { uyarilar, ci: { durum, dal } } } (pano bunu Bunker'a gönderir). Oturum süresi hafıza dizininden: ilk ve son mesaj arası, boş bekleme dahil.
const fs = require('fs'), os = require('os'), path = require('path'), { execSync } = require('child_process');
const KOK = path.dirname(__dirname);
const ayar = JSON.parse(fs.readFileSync(process.env.PROJELER || path.join(KOK, 'projeler.json'), 'utf8'));
const genislet = (p) => p.replace(/^~/, os.homedir());
const sh = (c, cwd) => { try { return execSync(c, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000 }).trim(); } catch { return ''; } };
const q = (s) => `'${s.replace(/'/g, `'\\''`)}'`;
const SIMDI = Date.now();
const trGun = (ms) => new Date(ms + 3 * 36e5).toISOString().slice(0, 10); // TR saati (UTC+3)
const bugun = trGun(SIMDI);
const saatOnce = (ms) => Math.round((SIMDI - ms) / 36e5);
const kisalt = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// Token raporu (token/gunluk-rapor.sh yazar): "<proje> <dün> <7g ort> <modeller>", sayılar milyar, tr-TR
const raporDir = process.env.TOKEN_RAPOR || path.join(os.homedir(), 'token-rapor');
const raporlar = fs.existsSync(raporDir) ? fs.readdirSync(raporDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.txt$/.test(f)).sort() : [];
const rapor = raporlar.length ? fs.readFileSync(path.join(raporDir, raporlar.at(-1)), 'utf8') : null;
const sayi = (s) => Number(String(s).replace(',', '.'));

// "## Şimdi" bölümünün metni ve ilk maddesinin başlığı
function bolum(metin, ad) {
  const m = metin.split('\n'), i = m.findIndex((l) => new RegExp(`^##\\s+${ad}`, 'i').test(l));
  if (i < 0) return null;
  const j = m.findIndex((l, k) => k > i && /^##\s/.test(l));
  return m.slice(i + 1, j < 0 ? undefined : j);
}
const simdiMetni = (metin) => { const b = bolum(metin, 'Şimdi'); return b && b.join('\n').trim(); };
const simdiBasligi = (b) => {
  const l = (b || '').split('\n').find((x) => /^\s*- /.test(x)) || '';
  return (l.match(/\*\*([^*]+)\*\*/) || [, l.replace(/^\s*- (\[[ xX]\] )?/, '')])[1].trim();
};

// "Şimdi" en son ne zaman değişti: çalışma kopyası HEAD'den farklıysa dosyanın mtime'ı, değilse geriye doğru commit'ler
function simdiDegisim(yol, dosya, simdiki) {
  const rel = path.relative(yol, dosya);
  const head = sh(`git show HEAD:${q(rel)}`, yol);
  if (simdiMetni(head) !== simdiki) return fs.statSync(dosya).mtimeMs;
  const commitler = sh(`git log -50 --format='%H %ct' -- ${q(rel)}`, yol).split('\n').filter(Boolean).map((l) => l.split(' '));
  let zaman = null;
  for (const [h, t] of commitler) {
    if (simdiMetni(sh(`git show ${h}:${q(rel)}`, yol)) !== simdiki) break;
    zaman = Number(t) * 1000;
  }
  return zaman;
}

// Bitti'ye bugün inenler: "05.11 — …" ya da "2026-11-05 · …"
function bugunBitti(metin) {
  const b = bolum(metin, 'Bitti') || [], [y, a, g] = bugun.split('-');
  return b.filter((l) => /^\s*- /.test(l) && (l.includes(bugun) || new RegExp(`^\\s*- (\\[[xX ]\\] )?${g}\\.${a}(\\.${y})?\\b`).test(l))).length;
}

// Hafıza dizini: "- 2026-11-04 13:09 → 2026-11-05 09:50 · başlık · `dosya`" (TR saati)
function oturumlar(gitDir) {
  const idx = path.join(gitDir, 'hafiza', 'kisa', 'INDEX.md');
  if (!fs.existsSync(idx)) return null;
  const tr = (s) => Date.parse(s.replace(' ', 'T') + ':00+03:00');
  return fs.readFileSync(idx, 'utf8').split('\n').map((l) => l.match(/^- (\S+ \S+) → (\S+ \S+) · (.*?)(?: · `(.*)`)?$/)).filter(Boolean)
    .map(([, b, s, ad, f]) => ({ bas: tr(b), son: tr(s), ad, dosya: f && path.join(path.dirname(idx), f) })).map((o) => ({ ...o, saat: (o.son - o.bas) / 36e5 }));
}
// Oturum kaydının başlığındaki token ("token: 148.0M"); dosyanın yalnız ilk 1 KB'ı okunur
function oturumTokeni(dosya) {
  try { const fd = fs.openSync(dosya, 'r'), b = Buffer.alloc(1024); fs.readSync(fd, b, 0, 1024, 0); fs.closeSync(fd); return (b.toString().match(/token: (\S+)/) || [])[1]; } catch { return undefined; }
}

// CI: çalışma dalının son tamamlanmış koşusu (upstream'in deposunda)
function ci(yol, dal) {
  const up = sh('git rev-parse --abbrev-ref @{u}', yol).split('/')[0];
  const url = up && sh(`git remote get-url ${q(up)}`, yol);
  const repo = (url.match(/github\.com[/:](.+?)(\.git)?$/) || [])[1];
  if (!repo || !dal) return { metin: '-' };
  const j = sh(`gh run list -R ${q(repo)} --branch ${q(dal)} --limit 10 --json status,conclusion,createdAt,workflowName`, yol);
  if (!j) return { metin: '?' };
  const k = JSON.parse(j).find((r) => r.status === 'completed');
  return k ? { durum: k.conclusion === 'success' ? 'yeşil' : !['skipped', 'cancelled'].includes(k.conclusion) ? 'kırmızı' : '-', metin: k.conclusion === 'success' ? 'yeşil' : k.conclusion, kirmizi: !['success', 'skipped', 'cancelled'].includes(k.conclusion), is: k.workflowName } : { metin: 'koşu yok' };
}

const satirlar = [], uyari = [], kart = {};
for (const p of ayar.projeler) {
  let yol = genislet(p.yol);
  if (!fs.existsSync(yol)) yol = path.join('/workspaces', p.konteyner || path.basename(yol));
  const isDosya = path.join(yol, p.yapilacaklar || 'YAPILACAKLAR.md');
  if (!fs.existsSync(isDosya)) continue;
  const metin = fs.readFileSync(isDosya, 'utf8'), simdi = simdiMetni(metin);
  if (simdi === null) continue; // "Şimdi"si olmayan liste sade düzende değil (ör. IT'nin ISLER.md'si)
  const kp = (kart[p.ad] = { uyarilar: [], ci: { durum: '-', dal: '' } });
  const u = (s) => { uyari.push(`${p.ad}: ${s}`); kp.uyarilar.push(s); };

  const dal = sh('git branch --show-current', yol);
  const gitDir = sh('git rev-parse --path-format=absolute --git-common-dir', yol);
  const commit24 = Number(sh(`git rev-list --count --branches --since='24 hours ago'`, yol) || 0);
  const son = sh(`git log -1 --format='%h %ad %s' --date=format:'%d.%m %H:%M'`, yol);
  const baslik = simdiBasligi(simdi), degisim = simdiDegisim(yol, isDosya, simdi);
  const simdiSaat = degisim === null ? null : saatOnce(degisim);
  const bitti = bugunBitti(metin);
  const kirli = sh('git status --porcelain --untracked-files=all', yol).split('\n').filter(Boolean).length;

  const tokSatir = rapor && rapor.split('\n').find((l) => l.startsWith(path.basename(yol).replace(/[^A-Za-z0-9]/g, '-') + ' '));
  const tok = tokSatir ? tokSatir.trim().split(/\s{2,}/) : null;
  const tokMetin = !rapor ? 'rapor yok' : tok ? `${tok[1]} / ort ${tok[2]}` : '~0';

  const ot = oturumlar(gitDir), hafta = ot && ot.filter((o) => SIMDI - o.son < 7 * 864e5);
  const enUzun = hafta && hafta.length ? hafta.reduce((a, b) => (b.saat > a.saat ? b : a)) : null;
  const c = ci(yol, dal);
  kp.ci = { durum: c.durum || '-', dal: dal || '' };

  satirlar.push([p.ad, `${commit24} · ${kisalt(son, 48)}`, `${kisalt(baslik, 40) || '(boş)'} · ${simdiSaat === null ? '?' : simdiSaat + ' sa'}`,
    String(bitti), String(kirli), tokMetin, enUzun ? `${enUzun.saat.toFixed(1)} sa · ${kisalt(enUzun.ad, 28)}` : '-', c.metin]);

  // Uyarılar
  if (fs.existsSync(path.join(yol, '_dev'))) u('_dev/ yeniden oluştu');
  if (fs.existsSync(path.join(yol, '.claude', 'commands', 'devflow'))) u('.claude/commands/devflow yeniden oluştu');
  const ayarDosya = path.join(yol, '.claude', 'settings.json');
  if (fs.existsSync(ayarDosya) && /kayit-kapisi/.test(fs.readFileSync(ayarDosya, 'utf8'))) u('.claude/settings.json\'da kayit-kapisi var');
  if (c.kirmizi) u(`CI son koşusu kırmızı (${c.is}, ${c.metin}, dal ${dal})`);
  for (const o of (ot || []).filter((o) => o.saat > 12 && SIMDI - o.son < 864e5)) u(`${o.saat.toFixed(1)} saatlik oturum: "${o.ad}" (${oturumTokeni(o.dosya) || '?'} token)`);
  if (tok && sayi(tok[1]) >= 0.1 && sayi(tok[1]) > 2 * sayi(tok[2])) u(`dünkü token ${tok[1]} milyar, 7 günlük ortalamanın (${tok[2]}) iki katından fazla`);
  if (simdiSaat !== null && simdiSaat >= 24) u(`"Şimdi" ${simdiSaat} saattir değişmedi`);
  if (kirli > 300) u(`${kirli} commit edilmemiş dosya`);
}

if (process.argv.includes('--json')) { console.log(JSON.stringify(kart)); process.exit(0); }

const bas = ['Proje', '24s commit · son', 'Şimdi · değişmeyen', 'Bitti bugün', 'Kirli', 'Token dün/7g (milyar)', 'En uzun oturum (7g)', 'CI'];
const gen = bas.map((b, i) => Math.max(b.length, ...satirlar.map((s) => s[i].length)));
const yaz = (s) => s.map((x, i) => x.padEnd(gen[i])).join(' | ');
console.log(`Sade düzen izlemesi · ${new Date(SIMDI + 3 * 36e5).toISOString().slice(0, 16).replace('T', ' ')} TR · token raporu: ${rapor ? raporlar.at(-1) : 'yok (' + raporDir + ')'}\n`);
console.log(yaz(bas)); console.log(gen.map((n) => '-'.repeat(n)).join('-|-'));
for (const s of satirlar) console.log(yaz(s));
console.log(uyari.length ? `\nUyarılar:\n${uyari.map((x) => '⚠ ' + x).join('\n')}` : '\nUyarı yok.');
process.exitCode = uyari.length ? 1 : 0;
