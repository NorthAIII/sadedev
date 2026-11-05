// Canlı token alarmı: canli-topla.js çıktılarına üç kural uygular. Model çağırmaz.
// Girdi (stdin): her satır "<klasör adı>\t<json>". Çıktı: yeni alarmlar, her satır bir alarm; varsa çıkış kodu 1.
// Kullanım: node canli-alarm.js                         → şimdi (SADE_SIMDI ile başka an), aynı alarm 3 saatte bir
//           node canli-alarm.js --benzet <bas> <bitis>  → geçmişte 15 dakikada bir çalışsaydı ne derdi (durum dosyası kullanılmaz)
const fs = require('fs'), os = require('os'), path = require('path');

// Eşikler: 22 Ekim – 5 Kasım ölçümünden (token/olcum/OKUBENI.md → Canlı alarm). Toplam = önbellekten okuma dahil.
const HIZ = 200e6;   // bir proje, son 60 dakika
const KOSU = 500e6;  // tek oturum, son 6 saat (alt ajanlar dahil)
const ADIM = 100;    // tek cevapta ana konuşmanın adımı (istekten bu yana model çağrısı)
// Aynı alarm en erken kaç dakika sonra yinelenir: proje hızı 3 saat, uzun oturum 24 saat, tek cevap hiç

const projeAdi = (k) => k.replace(/^-home-[^-]+-projects-/, '').replace(/^-workspaces-/, '') || k;
const mn = (n) => Math.round(n / 1e6).toLocaleString('tr-TR');
const trSaat = (dk) => new Date(dk * 6e4 + 3 * 36e5).toISOString().slice(5, 16).replace('T', ' ').replace(/^(\d\d)-(\d\d)/, '$2.$1');

const oturum = {}; // sid → { proje, ilk, bas, dk, istek }; aynı oturum iki yoldan gelirse bir kez sayılır
for (const s of fs.readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
  const [k, j] = s.split('\t');
  let v; try { v = JSON.parse(j); } catch { continue; }
  for (const [sid, o] of Object.entries(v)) if (!oturum[sid]) oturum[sid] = { proje: projeAdi(k), ...o };
}
const toplam = (o, bas, bit, i = 0) => { let t = 0; for (const [d, x] of Object.entries(o.dk)) if (d > bas && d <= bit) t += x[i]; return t; };

// T dakikasında geçerli alarmlar: [{ anahtar, tekrar (dakika, 0 = yinelenmez), metin }]
function degerlendir(T) {
  const out = [], proje = {};
  for (const [sid, o] of Object.entries(oturum)) {
    proje[o.proje] = (proje[o.proje] || 0) + toplam(o, T - 60, T);
    const kim = `oturum (başlangıç ${o.bas ? trSaat(Math.floor(Date.parse(o.bas) / 6e4)) : '?'}, ilk istek "${o.ilk}")`;
    const k6 = toplam(o, T - 360, T);
    if (k6 > KOSU) out.push({ anahtar: `kosu|${sid}`, tekrar: 24 * 60,
      metin: `${o.proje}: ${kim} son 6 saatte ${mn(k6)} milyon token harcadı. Gerekmiyorsa o oturumda "dur" yaz.` });
    const r = Math.max(-1, ...o.istek.filter((d) => d <= T));
    if (r < 0 || !toplam(o, T - 15, T, 1)) continue; // son 15 dakikada ana konuşmada adım yoksa cevap sürmüyor
    const adim = toplam(o, r - 1, T, 1);
    if (adim > ADIM) out.push({ anahtar: `cevap|${sid}|${r}`, tekrar: 0,
      metin: `${o.proje}: ${kim} tek bir cevapta ${adim} adımdır çalışıyor (istek ${trSaat(r)}, ${mn(toplam(o, r - 1, T))} milyon token). İş bitince yeni sohbet aç.` });
  }
  for (const [p, t] of Object.entries(proje)) if (t > HIZ) out.push({ anahtar: `hiz|${p}`, tekrar: 3 * 60,
    metin: `${p}: son 1 saatte ${mn(t)} milyon token (eşik ${mn(HIZ)} milyon).` });
  return out;
}
// Yeni mi: hiç görülmedi ya da yinelenen alarmsa süresi doldu
const yeniMi = (durum, a, T) => !(a.anahtar in durum) || (a.tekrar > 0 && T - durum[a.anahtar] >= a.tekrar);

if (process.argv[2] === '--benzet') {
  const bas = Math.floor(Date.parse(process.argv[3]) / 6e4), bit = Math.floor(Date.parse(process.argv[4]) / 6e4), durum = {};
  let n = 0;
  for (let T = bas; T <= bit; T += 15) for (const a of degerlendir(T)) if (yeniMi(durum, a, T)) {
    durum[a.anahtar] = T; n++; console.log(`${trSaat(T)}  ${a.metin}`);
  }
  console.log(`— ${n} alarm`);
  process.exit(0);
}

const T = Math.floor((process.env.SADE_SIMDI ? Date.parse(process.env.SADE_SIMDI) : Date.now()) / 6e4);
const DOSYA = process.env.SADE_ALARM_DURUM || path.join(os.homedir(), '.local/state/sadedev/canli-alarm.json');
let durum = {}; try { durum = JSON.parse(fs.readFileSync(DOSYA, 'utf8')); } catch {}
for (const k of Object.keys(durum)) if (T - durum[k] > 2 * 24 * 60) delete durum[k];
const yeni = degerlendir(T).filter((a) => yeniMi(durum, a, T));
for (const a of yeni) { durum[a.anahtar] = T; console.log(a.metin); }
fs.mkdirSync(path.dirname(DOSYA), { recursive: true });
fs.writeFileSync(DOSYA, JSON.stringify(durum));
process.exit(yeni.length ? 1 : 0);
