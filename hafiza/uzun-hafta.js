// Uzun süreli hafıza: bir haftanın kısa süreli kayıtlarından ve git geçmişinden model çağırmadan özet çıkarır.
// Anlam çıkarmaz; ayıklar ve sayar: Kıvanç'ın kural/düzeltme cümleleri olduğu gibi, commit'ler türlerine göre,
// en çok değişen dosyalar, geri alınanlar, oturumlar ve tokenları.
// Kullanım: node uzun-hafta.js <kisa-klasoru> <repo-yolu|-> <pazartesi YYYY-MM-DD> > hafta.md
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const [kisa, repo, pzt] = process.argv.slice(2);
const bas = new Date(pzt + 'T00:00:00+03:00'), son = new Date(bas.getTime() + 7 * 864e5);
const gun = (d) => new Date(d.getTime() + 3 * 36e5).toISOString().slice(0, 10);

// 1. Haftanın oturumları (dosya adı tarihle başlar)
const oturum = [];
for (const ay of fs.readdirSync(kisa).filter((x) => /^\d{4}-\d{2}$/.test(x)))
  for (const d of fs.readdirSync(path.join(kisa, ay))) {
    const m = fs.readFileSync(path.join(kisa, ay, d), 'utf8').match(/- Tarih: (\S+) \S+ → (\S+)/);
    if (m && m[2] >= gun(bas) && m[1] < gun(son)) oturum.push(path.join(kisa, ay, d)); // haftayla kesişen oturum
  }
oturum.sort();

// 2. Kıvanç'ın kural, düzeltme ve karar cümleleri (olduğu gibi)
// Kıvanç çoğu zaman Türkçe karaktersiz yazıyor: iki yazım da aranır
const ISARET = /(bundan sonra|her zaman|hi[çc]bir zaman|asla|unutma|kural|yanl[ıi][şs]|hatal[ıi]|hay[ıi]r|olmaz|yapma|dikkat|[öo]nemli|karar|istemiyorum|istiyorum|tercih)/i;
const cumle = [], otSatir = [];
for (const f of oturum) {
  const m = fs.readFileSync(f, 'utf8');
  const baslik = m.split('\n')[0].replace(/^# /, ''), tarih = (m.match(/- Tarih: (.*)/) || [])[1] || '';
  const tok = (m.match(/token: ([\d.]+)M/) || [])[1] || '?';
  otSatir.push(`- ${tarih} · ${baslik} · ${tok}M token · \`${path.relative(kisa, f)}\``);
  for (const blok of m.split(/^### /m).slice(1)) {
    const bt = blok.match(/^(\d{4}-\d{2}-\d{2}) \d\d:\d\d · Kıvanç/);
    if (!bt || bt[1] < gun(bas) || bt[1] >= gun(son)) continue;
    if (blok.length > 1500) continue; // uzun metin yapıştırmadır, Kıvanç'ın cümlesi değil
    for (const c of blok.split('\n').slice(1).join(' ').split(/(?<=[.!?])\s+/))
      if (ISARET.test(c) && c.length > 15 && c.length < 400) cumle.push(`- ${bt[1]}: ${c.trim()}`);
  }
}

// 3. Commit'ler türlerine göre, en çok değişen dosyalar, geri alınanlar
const tur = {}, dosya = {}, geri = [];
if (repo && repo !== '-') {
  const out = execFileSync('git', ['-C', repo, 'log', '--all', '--no-merges', `--since=${bas.toISOString()}`, `--until=${son.toISOString()}`,
    '--format=%x00%h %s', '--name-only'], { encoding: 'utf8', maxBuffer: 64e6 });
  for (const b of out.split('\x00').filter((x) => x.trim())) {
    const [ilk, ...d] = b.trim().split('\n');
    const t = (ilk.match(/^\w+ (\w+)[(:!]/) || [])[1] || 'diğer';
    (tur[t] ||= []).push(ilk);
    if (/^\w+ (revert|Revert)\b|\brevert(ed)?\b/i.test(ilk)) geri.push(ilk);
    for (const x of d.filter(Boolean)) dosya[x] = (dosya[x] || 0) + 1;
  }
}
const sirali = Object.entries(dosya).sort((a, b) => b[1] - a[1]).slice(0, 15);

console.log(`# Hafta ${gun(bas)} – ${gun(new Date(son - 864e5))}\n`);
console.log(`Model kullanılmadan çıkarıldı. Ayrıntı için kısa süreli kayda bak; bu dosya dizindir.\n`);
console.log(`## Kıvanç'ın kural, düzeltme ve karar cümleleri\n\n${cumle.join('\n') || '- yok'}\n`);
console.log(`## Commit'ler (${Object.values(tur).flat().length})\n`);
for (const [t, l] of Object.entries(tur).sort((a, b) => b[1].length - a[1].length))
  console.log(`### ${t} (${l.length})\n\n${l.slice(0, 25).map((x) => '- ' + x.slice(0, 140)).join('\n')}${l.length > 25 ? `\n- … +${l.length - 25}` : ''}\n`);
console.log(`## Geri alınanlar\n\n${geri.map((x) => '- ' + x).join('\n') || '- yok'}\n`);
console.log(`## En çok değişen dosyalar\n\n${sirali.map(([f, n]) => `- ${n} × ${f}`).join('\n') || '- yok'}\n`);
console.log(`## Oturumlar (${otSatir.length})\n\n${otSatir.join('\n') || '- yok'}`);
