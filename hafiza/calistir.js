// Hafızayı bütün projeler için günceller. Model çağırmaz.
//   node hafiza/calistir.js            → kısa süreli kayıt (son 2 günün oturumları)
//   node hafiza/calistir.js --hafta    → geçen haftanın uzun süreli dizini
// Çıktı her projenin <git-common-dir>/hafiza/ klasörüne: commit'lenmez, push edilmez, konteynerden de görünür.
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync, execSync } = require('child_process');
const KOK = path.dirname(__dirname);
const ayar = JSON.parse(fs.readFileSync(process.env.PROJELER || path.join(KOK, 'projeler.json'), 'utf8')); // PROJELER: deneme için başka liste
const genislet = (p) => p.replace(/^~/, os.homedir());
const anahtar = (p) => p.replace(/[^A-Za-z0-9]/g, '-'); // Claude'un klasör adlandırması
const haftaModu = process.argv.includes('--hafta');
const GUN = 2;

function sh(cmd) { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1e9 }).trim(); } catch { return ''; } }

// Konteynerdeki kayıtları geçici klasöre al (çalışan: docker exec + tar; kapanmış: docker cp)
function konteynerKayitlari(klasorAdi) {
  const cikti = [];
  const kap = sh(`docker ps -a --format '{{.Names}} {{.Image}} {{.State}}'`).split('\n').filter((l) => / vsc-/.test(l));
  for (const satir of kap) {
    const [ad, , durum] = satir.split(' ');
    const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'hafiza-'));
    if (durum === 'running') {
      const dir = sh(`docker exec ${ad} sh -c 'ls -d /home/*/.claude/projects/${klasorAdi} 2>/dev/null'`);
      if (!dir) { fs.rmSync(gecici, { recursive: true }); continue; }
      sh(`docker exec ${ad} sh -c "cd '${dir}' && find . -name '*.jsonl' -mtime -${GUN + 1} | tar -cf - -T -" | tar -x -C '${gecici}'`);
    } else {
      for (const k of ['node', 'vscode']) sh(`docker cp '${ad}:/home/${k}/.claude/projects/${klasorAdi}/.' '${gecici}' 2>/dev/null`);
    }
    if (fs.readdirSync(gecici).some((f) => f.endsWith('.jsonl'))) cikti.push(gecici);
    else fs.rmSync(gecici, { recursive: true });
  }
  return cikti;
}

for (const p of ayar.projeler) {
  const repo = genislet(p.yol);
  if (!fs.existsSync(repo)) continue;
  const gitDir = sh(`git -C '${repo}' rev-parse --path-format=absolute --git-common-dir`);
  if (!gitDir) continue;
  // Deponun alt klasörüyse (ör. sirket/yonetim) kendi hafiza/<alt klasör>/'ü: aynı depodaki departmanlar karışmaz
  const alt = path.relative(sh(`git -C '${repo}' rev-parse --show-toplevel`), repo);
  const kok = path.join(gitDir, 'hafiza', alt);
  const kisa = path.join(kok, 'kisa');
  if (haftaModu) {
    const bugun = new Date(Date.now() + 3 * 36e5), gecenPzt = new Date(bugun - ((bugun.getUTCDay() + 6) % 7 + 7) * 864e5);
    const pzt = gecenPzt.toISOString().slice(0, 10);
    if (!fs.existsSync(kisa)) continue;
    const uzun = path.join(kok, 'uzun'); fs.mkdirSync(uzun, { recursive: true });
    const md = execFileSync('node', [path.join(__dirname, 'uzun-hafta.js'), kisa, repo, pzt], { encoding: 'utf8', maxBuffer: 1e8 });
    fs.writeFileSync(path.join(uzun, `${pzt}.md`), md);
    console.log(`${p.ad}: uzun ${pzt}`);
    continue;
  }
  const kaynak = [];
  const host = path.join(os.homedir(), '.claude', 'projects', anahtar(repo));
  if (fs.existsSync(host)) kaynak.push({ dir: host });
  if (p.konteyner) for (const g of konteynerKayitlari(anahtar('/workspaces/' + p.konteyner))) kaynak.push({ dir: g, gecici: true });
  for (const k of kaynak) {
    execFileSync('node', [path.join(__dirname, 'kisa-topla.js'), k.dir, repo, kisa, String(GUN)], { stdio: 'inherit' });
    if (k.gecici) fs.rmSync(k.dir, { recursive: true });
  }
  const n = fs.existsSync(path.join(kisa, 'INDEX.md')) ? fs.readFileSync(path.join(kisa, 'INDEX.md'), 'utf8').split('\n').filter((l) => l.startsWith('- ')).length : 0;
  console.log(`${p.ad}: ${kaynak.length} kaynak, dizinde ${n} oturum`);
}
