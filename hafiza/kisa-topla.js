// Kısa süreli hafıza: her Claude oturumunu özetlemeden, model çağırmadan bir Markdown kaydına çevirir.
// Kayıtta: başlık, tarih, dal, model ve token, bağlam (CLAUDE.md'nin boyutu ve adım başına token), kullanıcının bütün istekleri, Claude'un yazdığı metinler
// (düşünme ve araç çıktıları hariç), oturum sırasında atılan commit'ler. Sır ve kişisel veri maskelenir,
// <private>…</private> arası hiç yazılmaz.
// Kullanım: node kisa-topla.js <transkript-klasoru> <repo-yolu|-> <cikti-klasoru> [kac-gun=2]
// Aynı oturum yeniden işlenirse dosyası üzerine yazılır; INDEX.md her seferinde baştan kurulur.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const [kayitDir, repo, cikti, gunStr] = process.argv.slice(2);
const sinirMs = Date.now() - Number(gunStr || 2) * 864e5;

const MASKE = [
  [/<private>[\s\S]*?<\/private>/gi, '[özel]'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[özel anahtar]'],
  [/\b(sk-(ant-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[abpr]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g, '[sır]'],
  [/((?:pass(?:word)?|parola|şifre|sifre|secret|token|api[_-]?key)\s*[:=]\s*)\S+/gi, '$1[sır]'],
  [/\bTR\d{2}[ ]?(?:\d{4}[ ]?){5}\d{2}\b/g, '[IBAN]'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[e-posta]'],
  [/(?:\+?90[ -]?)?\(?0?5\d{2}\)?[ -]?\d{3}[ -]?\d{2}[ -]?\d{2}\b/g, '[telefon]'],
  [/\b[1-9]\d{10}\b/g, '[11 haneli no]'],
];
const maskele = (s) => MASKE.reduce((a, [r, y]) => a.replace(r, y), s);
const temizle = (s) => s.replace(/<(system-reminder|ide_selection|ide_opened_file|command-message|local-command-stdout|local-command-caveat)>[\s\S]*?<\/\1>/g, '')
  .replace(/<command-name>([^<]*)<\/command-name>/g, '$1').replace(/<command-args>([^<]*)<\/command-args>/g, ' $1')
  .replace(/<\/?[a-z-]+>/g, '').trim();
const saat = (ts) => new Date(Date.parse(ts) + 3 * 36e5).toISOString().replace('T', ' ').slice(0, 16);

function oturumOku(f) {
  const s = { id: path.basename(f, '.jsonl'), baslik: '', bas: '', son: '', dal: '', model: {}, token: 0, anaToken: 0, adim: 0, olay: [] };
  const goruldu = new Set();
  const isle = (o, ana) => {
    if (o.type === 'ai-title' && o.aiTitle) s.baslik = o.aiTitle;
    if (o.type === 'custom-title' && o.customTitle) s.ozelBaslik = o.customTitle;
    const ts = o.timestamp; if (!ts) return;
    if (!s.bas || ts < s.bas) s.bas = ts;
    if (ts > s.son) s.son = ts;
    if (o.gitBranch) s.dal = o.gitBranch;
    const m = o.message || {};
    if (o.type === 'assistant' && m.id && !goruldu.has(m.id)) {
      goruldu.add(m.id);
      const u = m.usage || {};
      const t = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.output_tokens || 0);
      s.token += t;
      if (ana) { s.anaToken += t; s.adim++; }
      const md = (m.model || '').replace('claude-', ''); if (md && md !== '<synthetic>') s.model[md] = 1;
    }
    if (!ana) return;
    let metin = '';
    if (o.type === 'user' && !o.isMeta) {
      const c = m.content;
      if (typeof c === 'string') metin = c;
      else if (Array.isArray(c)) metin = c.filter((x) => x.type === 'text').map((x) => x.text).join('\n');
      metin = temizle(metin);
      if (metin && !/^\[?(SYSTEM NOTIFICATION|Request interrupted)/.test(metin)) s.olay.push({ ts, kim: 'Kıvanç', metin });
    } else if (o.type === 'assistant' && Array.isArray(m.content)) {
      metin = m.content.filter((x) => x.type === 'text').map((x) => x.text).join('\n').trim();
      if (metin) s.olay.push({ ts, kim: 'Claude', metin });
    }
  };
  const satirlar = (p) => fs.readFileSync(p, 'utf8').split('\n');
  for (const l of satirlar(f)) { try { isle(JSON.parse(l), true); } catch {} }
  const altDir = path.join(path.dirname(f), s.id, 'subagents');
  if (fs.existsSync(altDir)) for (const a of fs.readdirSync(altDir)) if (a.endsWith('.jsonl'))
    for (const l of satirlar(path.join(altDir, a))) { try { isle(JSON.parse(l), false); } catch {} }
  return s;
}

function commitler(bas, son) {
  if (!repo || repo === '-' || !bas) return [];
  try {
    const out = execFileSync('git', ['-C', repo, 'log', '--all', `--since=${bas}`, `--until=${new Date(Date.parse(son) + 5 * 6e4).toISOString()}`,
      '--format=%x00%h %ad %s', '--date=format:%H:%M', '--name-only'], { encoding: 'utf8', maxBuffer: 64e6 });
    return out.split('\x00').filter((x) => x.trim()).map((b) => { const [b1, ...d] = b.trim().split('\n'); return { bas: b1, dosya: d.filter(Boolean) }; });
  } catch { return []; }
}

// CLAUDE.md'nin parmak izi: oturum başladığında commit'li hâlinin boyutu ve onu son değiştiren commit ("kısalınca token düştü mü")
function claudeMd(bas) {
  if (!repo || repo === '-' || !bas) return '-';
  try {
    const g = (a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const h = g(['log', '-1', `--before=${bas}`, '--format=%h %ad', '--date=format:%d.%m', '--', 'CLAUDE.md']);
    if (!h) return 'yok';
    const [kim, tarih] = h.split(' ');
    return `CLAUDE.md ${(Number(g(['cat-file', '-s', `${kim}:./CLAUDE.md`])) / 1024).toFixed(1)} KB (${kim}, ${tarih})`;
  } catch { return '?'; }
}

const slug = (t) => (t || 'oturum').toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
fs.mkdirSync(cikti, { recursive: true });
for (const e of fs.readdirSync(kayitDir)) {
  if (!e.endsWith('.jsonl')) continue;
  const f = path.join(kayitDir, e);
  if (fs.statSync(f).mtimeMs < sinirMs) continue;
  const s = oturumOku(f);
  if (!s.olay.some((x) => x.kim === 'Kıvanç')) continue;
  const baslik = s.ozelBaslik || s.baslik || s.olay[0].metin.split('\n')[0].slice(0, 60);
  const ay = saat(s.bas).slice(0, 7), ad = `${saat(s.bas).replace(' ', '_').replace(':', '')}_${slug(baslik)}_${s.id.slice(0, 8)}.md`;
  const cm = commitler(s.bas, s.son);
  const yaz = [
    `# ${maskele(baslik)}`, '',
    `- Tarih: ${saat(s.bas)} → ${saat(s.son)}`,
    `- Oturum: ${s.id} · dal: ${s.dal || '-'} · model: ${Object.keys(s.model).join(', ') || '-'} · token: ${(s.token / 1e6).toFixed(1)}M (alt ajanlar dahil)`,
    `- Bağlam: ${claudeMd(s.bas)} · adım başına ort. ${s.adim ? Math.round(s.anaToken / s.adim / 1e3) : '-'} bin token (ana oturum, ${s.adim} adım)`,
    `- Bu aralıktaki commit'ler: ${cm.length} (paralel oturumlarınkiler de olabilir)`, '',
    '## Konuşma', '',
    ...s.olay.map((x) => `### ${saat(x.ts)} · ${x.kim}\n\n${maskele(x.metin)}\n`),
    '## Commit\'ler', '',
    ...(cm.length ? cm.map((c) => `- ${maskele(c.bas)}${c.dosya.length ? `\n  - ${c.dosya.slice(0, 30).join('\n  - ')}${c.dosya.length > 30 ? `\n  - … +${c.dosya.length - 30}` : ''}` : ''}`) : ['- yok']),
  ].join('\n');
  fs.mkdirSync(path.join(cikti, ay), { recursive: true });
  for (const eski of fs.readdirSync(path.join(cikti, ay))) if (eski.includes(s.id.slice(0, 8)) && eski !== ad) fs.unlinkSync(path.join(cikti, ay, eski));
  fs.writeFileSync(path.join(cikti, ay, ad), yaz + '\n');
}

// Dizin: oturum başına bir satır; ayrıntıya ancak gerekince inilir
const satir = [];
for (const ay of fs.readdirSync(cikti).filter((x) => /^\d{4}-\d{2}$/.test(x)).sort())
  for (const d of fs.readdirSync(path.join(cikti, ay)).sort()) {
    const ilk = fs.readFileSync(path.join(cikti, ay, d), 'utf8').split('\n', 4);
    const tarih = (ilk[2] || '').replace('- Tarih: ', '');
    satir.push(`- ${tarih} · ${ilk[0].replace(/^# /, '')} · \`${ay}/${d}\``);
  }
fs.writeFileSync(path.join(cikti, 'INDEX.md'), `# Oturum dizini (kısa süreli hafıza)\n\nEn yeni altta. Ayrıntı için satırdaki dosyayı oku; bütün klasörü okuma.\n\n${satir.join('\n')}\n`);
