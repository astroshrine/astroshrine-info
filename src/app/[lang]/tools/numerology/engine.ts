/* eslint-disable */
// @ts-nocheck
// Ported from the AstroShrine app (numerologyHtml.ts, @engine-start..@engine-end): pure maths and content tables.
import { PHAL, PRAVRITTI, PHAL_CLS, BAL, BAL_ORDER, balShift, PRAMAAN, shastra, reason, MINOR_BLOCK, HEALTH_NOTE, HEALTH_KAAL_NULL, ym, ageOn } from "./phalEngine";
const pad2 = (n) => (n < 10 ? "0" : "") + n;


/* ---------- Numerology engine (pure) ---------- */
const CHALDEAN = {A:1,I:1,J:1,Q:1,Y:1,B:2,K:2,R:2,C:3,G:3,L:3,S:3,D:4,M:4,T:4,E:5,H:5,N:5,X:5,U:6,V:6,W:6,O:7,Z:7,F:8,P:8};
function pyth(ch: any) { return ((ch.charCodeAt(0) - 65) % 9) + 1; }
function digitSum(n: any) { return String(Math.abs(n)).split('').reduce(function (a: any, d: any) { return a + (+d || 0); }, 0); }
function reduce(n: any) { while (n > 9) n = digitSum(n); return n; }
function reduceMaster(n: any) { while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = digitSum(n); return n; }
const PLANET = [null, ['Sun', 'सूर्य'], ['Moon', 'चंद्र'], ['Jupiter', 'गुरु'], ['Rahu', 'राहु'], ['Mercury', 'बुध'], ['Venus', 'शुक्र'], ['Ketu', 'केतु'], ['Saturn', 'शनि'], ['Mars', 'मंगल']];
/* Graha maitri, from the first number's point of view (traditional; nodes follow the common Rahu/Ketu convention). */
const MAITRI = {
  1: {F: [1, 2, 3, 9], N: [5], E: [4, 6, 7, 8]},
  2: {F: [1, 2, 5], N: [3, 4, 6, 7, 8, 9], E: []},
  3: {F: [1, 2, 3, 9], N: [4, 7, 8], E: [5, 6]},
  4: {F: [4, 5, 6, 8], N: [3], E: [1, 2, 7, 9]},
  5: {F: [1, 4, 5, 6], N: [3, 7, 8, 9], E: [2]},
  6: {F: [4, 5, 6, 7, 8], N: [3, 9], E: [1, 2]},
  7: {F: [6, 7, 8, 9], N: [3, 5], E: [1, 2, 4]},
  8: {F: [4, 5, 6, 7, 8], N: [3], E: [1, 2, 9]},
  9: {F: [1, 2, 3, 7, 9], N: [6, 8], E: [4, 5]}
};
function rel(a: any, b: any) { var m = MAITRI[a]; return m.F.indexOf(b) >= 0 ? 'F' : m.E.indexOf(b) >= 0 ? 'E' : 'N'; }
function kua(year: any, month: any, day: any, gender: any) {
  if (!gender) return null;
  var y = (month < 2 || (month === 2 && day < 4)) ? year - 1 : year; // Chinese solar year starts ~4 Feb
  var s = reduce(digitSum(y)), k;
  if (gender === 'M') { k = reduce(11 - s); if (k === 5) k = 2; }
  else { k = reduce(4 + s); if (k === 5) k = 8; }
  return {k: k, solarYear: y};
}
/* Accents off, so "José" counts as JOSE instead of dropping the É. */
function latin(s: any) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
/* A name numerology can read: at least one A-Z letter once accents are off. */
function hasLatin(s: any) { return /[A-Za-z]/.test(latin(s)); }
/* Indian mobile as its 10 digits: drops a leading +91 / 91 / 0; '' when that leaves anything but 10. */
function mobileDigits(raw: any) {
  var d = String(raw).replace(/\D/g, '');
  if (d.length === 12 && d.slice(0, 2) === '91') d = d.slice(2);
  else if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
  return d.length === 10 ? d : '';
}
/* Pythagorean vowel rule: A E I O U always; Y is a vowel when it has no vowel next to it in the word
   (LYNN, MARY, AIRY -> vowel sound) and a consonant beside a vowel (YOGESH, MAYA, VIJAY). */
function isVowelAt(w: any, i: any) {
  var c = w.charAt(i), V = /^[AEIOU]$/;
  if (V.test(c)) return true;
  if (c !== 'Y') return false;
  return !V.test(w.charAt(i - 1)) && !V.test(w.charAt(i + 1));
}
function nameAnalysis(name: any) {
  var words = latin(name).toUpperCase().replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(Boolean);
  var total = 0, pt = 0, vow = 0, con = 0, perWord = [];
  words.forEach(function (w: any) {
    var s = 0, letters = [];
    for (var i = 0; i < w.length; i++) {
      var c = w[i], v = CHALDEAN[c];
      s += v; letters.push([c, v]);
      var p = pyth(c); pt += p;
      if (isVowelAt(w, i)) vow += p; else con += p;
    }
    total += s; perWord.push({word: w, letters: letters, sum: s, red: reduce(s)});
  });
  return {words: perWord, chaldean: total, chaldeanRed: reduce(total), expression: pt, expressionRed: reduceMaster(pt), soul: vow, soulRed: reduceMaster(vow), personality: con, personalityRed: reduceMaster(con)};
}
function loShu(day: any, month: any, year: any, mulank: any, bhagyank: any, kuaNum: any) {
  var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], src = [];
  (pad2(day) + pad2(month) + year).split('').forEach(function (d: any) { if (+d) counts[+d]++; });
  src.push('dob');
  counts[bhagyank]++; src.push('bhagyank');
  if (day > 9 && day % 10 !== 0) { counts[mulank]++; src.push('mulank'); }
  if (kuaNum) { counts[kuaNum]++; src.push('kua'); }
  return {counts: counts, src: src};
}
function compute(inp: any) {
  var p = inp.dob.split('-').map(Number), Y = p[0], M = p[1], D = p[2];
  var mulank = reduce(D);
  var dobTotal = digitSum(pad2(D) + pad2(M) + Y);
  var bhagyank = reduce(dobTotal);
  var lifePath = reduceMaster(dobTotal);
  var k = kua(Y, M, D, inp.gender);
  var name = nameAnalysis(inp.name);
  var ls = loShu(D, M, Y, mulank, bhagyank, k && k.k);
  var fy = inp.year;
  var py = personalYear(D, M, fy);
  var mob = null;
  if (inp.mobile) { var ms = digitSum(inp.mobile); mob = {digits: inp.mobile, sum: ms, red: reduce(ms), zeros: (inp.mobile.match(/0/g) || []).length}; }
  var firm = inp.firm ? nameAnalysis(inp.firm) : null;
  return {Y: Y, M: M, D: D, mulank: mulank, dobTotal: dobTotal, bhagyank: bhagyank, lifePath: lifePath, kua: k, name: name, loshu: ls, year: fy, py: py, mobile: mob, firm: firm};
}
/* Numbers that sit well with both core numbers: friendly to the bhagyank and not hostile to the mulank. */
function goodTargets(mulank: any, bhagyank: any) {
  var out = [];
  for (var n = 1; n <= 9; n++) if (rel(bhagyank, n) === 'F' && rel(mulank, n) !== 'E') out.push(n);
  return out;
}
function lettersWorth(v: any) { return Object.keys(CHALDEAN).filter(function (c: any) { return CHALDEAN[c] === v; }); }
/* Personal year (varshank) = birth day + birth month + the year, each reduced. */
function personalYear(D: any, M: any, y: any) { return reduce(reduce(D) + reduce(M) + reduce(digitSum(y))); }

/* ---------- Phaladesh (Kosh v2.0: part 2 numerology row, 3.4) ---------- */
/* Weights and cut-offs are preliminary (Kosh part 6); retune from follow-up data. */
const NUM_W = {r1: {F: 1.5, E: -1.5}, r2: {F: 1, E: -1}, r3: {have: 0.5, miss: -0.5}, r4: {F: 0.5, E: -0.5}, r5: {F: 0.5, E: -0.5},
  anirnit: 0.25, siddhi: 2, vilamb: 0.75, prabal: 2.5, madhyam: 1};
/* Life area -> karaka number (traditional karakas; 1 Sun ... 9 Mars). */
const AREAS = {
  career: {k: 1, topic: ['Career / job', 'करियर / नौकरी']},
  business: {k: 5, topic: ['Business', 'व्यापार']},
  money: {k: 3, topic: ['Money / wealth', 'धन'], pending: [' The verse naming Jupiter as the wealth karaka is pending verification.', ' गुरु को धन-कारक कहने वाले श्लोक का सत्यापन शेष है।']},
  marriage: {k: 6, topic: ['Marriage (for the unmarried)', 'विवाह (अविवाहित के लिए)']},
  education: {k: 5, topic: ['Education / exams', 'शिक्षा / परीक्षा']},
  property: {k: 9, topic: ['Property / vehicle', 'संपत्ति / वाहन']},
  foreign: {k: 4, topic: ['Foreign travel / settling abroad', 'विदेश यात्रा / विदेश में बसना']},
  children: {k: 3, topic: ['Children', 'संतान']},
  health: {k: 1, topic: ['Health (tendency only)', 'स्वास्थ्य (केवल प्रवृत्ति)']}
};
const MINOR_AREAS = ['marriage', 'money', 'business', 'property', 'children', 'health']; // health: a poor tendency is a misfortune phal (Kosh 1.5)
const SRC_KARAKA = shastra('Brihat Parashara Hora Shastra (karakas)', 'बृहत् पाराशर होरा शास्त्र (कारक)', null, 'teeka_parampara');
const SRC_NUMPLANET = shastra('Cheiro (1926) and Indian practice', 'कीरो (1926) एवं भारतीय प्रथा', null, 'adhunik_parampara');
const SRC_LOSHU = shastra('Lo Shu (Chinese tradition)', 'लो-शू (चीनी परंपरा)', null, 'koi_shastra_nahin');
const SRC_CHALDEAN = shastra('Cheiro (1926), Chaldean name number', 'कीरो (1926), कैल्डियन नामांक', null, 'adhunik_parampara');
const SRC_FIRM = shastra('Cheiro (1926), Chaldean firm-name number', 'कीरो (1926), कैल्डियन फ़र्म-नामांक', null, 'adhunik_parampara');
const SRC_SELF = shastra('AstroShrine rule', 'AstroShrine नियम', null, 'koi_shastra_nahin');
/* Natural friendship: BPHS 3.55; with Rahu (4) or Ketu (7) involved, Phaladeepika 2.35. */
function srcMaitri(a: any, b: any) {
  return a === 4 || a === 7 || b === 4 || b === 7 ? shastra('Phaladeepika', 'फलदीपिका', '2.35', 'teeka_parampara')
    : shastra('Brihat Parashara Hora Shastra', 'बृहत् पाराशर होरा शास्त्र', '3.55', 'mool_granth');
}
const REL_WORD = {F: ['a friend', 'मित्र'], N: ['neutral', 'सम'], E: ['an enemy', 'शत्रु']};
/* Time window (vidhi varshank_masank): from asOf's month over one 9-year cycle, the first run of
   months whose personal year favours the karaka (and is not hostile to the Bhagyank) and whose
   personal month is the karaka or its friend; the run stays inside that one (calendar) personal
   year. null when the cycle has none. */
function numWindow(D: any, M: any, bhagyank: any, k: any, asOf: any) {
  var y = +asOf.slice(0, 4), m = +asOf.slice(5, 7), asOfYm = ym(y, m), from = null, to = null, best = null, runY = 0, years = [], pms = [];
  for (var i = 0; i < 108; i++) {
    var py = personalYear(D, M, y), pm = reduce(py + m);
    if ((py === k || rel(k, py) === 'F') && rel(bhagyank, py) !== 'E' && (pm === k || rel(k, pm) === 'F')) {
      if (from && y !== runY) break; // window = months of the first favourable year only
      to = ym(y, m); if (!from) { from = to; runY = y; }
      if (!best && pm === k) best = to;
      if (years.indexOf(y + ' = ' + py) < 0) years.push(y + ' = ' + py);
      pms.push(pm);
    } else if (from) break;
    if (++m > 12) { m = 1; y++; }
  }
  if (!from) return null;
  return {from: from, to: to, sabse_sambhavit: best || from, vidhi: 'varshank_masank', now: from === asOfYm,
    aadhar: ['Personal year ' + years.join(', ') + '; personal months ' + pms.join(', ') + '; karaka ' + PLANET[k][0] + ' (' + k + ')',
      'वर्षांक ' + years.join(', ') + '; मासांक ' + pms.join(', ') + '; कारक ' + PLANET[k][1] + ' (' + k + ')']};
}
/* The phal object for a life area. r = compute(...), asOf 'YYYY-MM-DD' (start of the window scan),
   today 'YYYY-MM-DD' = the reading date (defaults to asOf); the minor rule uses the earlier of the two.
   When asOf is a chosen forecast year rather than today, kaal_khand_ab is the window from today instead
   (kaal_khand_ab.now: that window is already running), so a future forecast never hides the present. */
function phaladesh(r: any, area: any, asOf: any, today: any) {
  var A = AREAS[area], k = A.k, KPL = PLANET[k], W = NUM_W, score = 0, R = [];
  var p = {topic: A.topic, phal: null, bal: null, anirnit_reason: null, alt: null, kaal_khand: null, kaal_khand_null: null,
    kaal_khand_ab: null, reasons: R, kya_karen: [], note: null, blocked: null};
  var minor = ageOn(r.Y + '-' + r.M + '-' + r.D, today && today < asOf ? today : asOf) < 18;
  if (minor && MINOR_AREAS.indexOf(area) >= 0) { p.blocked = MINOR_BLOCK; return p; }
  R.push(reason('num.karaka', 'Karaka of this area: ' + KPL[0] + ' (number ' + k + ').' + (A.pending ? A.pending[0] : ''),
    'इस क्षेत्र का कारक: ' + KPL[1] + ' (अंक ' + k + ')।' + (A.pending ? A.pending[1] : ''), 0, SRC_KARAKA));
  R.push(reason('num.planet', 'Number to planet: 1 Sun … 9 Mars, with 4 Rahu and 7 Ketu (Cheiro had Uranus/Neptune; Indian practice uses the nodes).',
    'अंक से ग्रह: 1 सूर्य … 9 मंगल, 4 राहु एवं 7 केतु (कीरो ने यूरेनस/नेपच्यून रखे थे; भारतीय प्रथा में राहु-केतु रखे गए)।', 0, SRC_NUMPLANET));
  /* Maitri from the karaka's side, rel(k, n): the same direction as the time window's rel(k, PY). */
  function maitri(id: any, lbl: any, n: any, w: any, src: any) {
    var rl = rel(k, n), d = w[rl] || 0;
    score += d;
    R.push(reason(id, n === k ? lbl[0] + ' ' + n + ' is the karaka number itself (counts as friendly).' : 'For ' + KPL[0] + ' (karaka), ' + lbl[0] + ' ' + n + ' (' + PLANET[n][0] + ') is ' + REL_WORD[rl][0] + '.',
      n === k ? lbl[1] + ' ' + n + ' स्वयं कारक अंक है (मित्र माना गया)।' : KPL[1] + ' (कारक) के लिए ' + lbl[1] + ' ' + n + ' (' + PLANET[n][1] + ') ' + REL_WORD[rl][1] + ' है।',
      d > 0 ? 1 : d < 0 ? -1 : 0, n === k ? SRC_SELF : src || srcMaitri(n, k)));
  }
  maitri('num.r1', ['Bhagyank', 'भाग्यांक'], r.bhagyank, W.r1);
  maitri('num.r2', ['Mulank', 'मूलांक'], r.mulank, W.r2);
  var have = r.loshu.counts[k] - (r.kua && r.kua.k === k ? 1 : 0) > 0; // Kua has zero weight (Kosh 3.4)
  score += have ? W.r3.have : W.r3.miss;
  R.push(reason('num.r3', have ? 'Karaka number ' + k + ' is present in the Lo Shu grid (a pointer only).' : 'Karaka number ' + k + ' is missing from the Lo Shu grid (a pointer only).',
    have ? 'कारक अंक ' + k + ' लो-शू ग्रिड में उपस्थित है (संकेत मात्र)।' : 'कारक अंक ' + k + ' लो-शू ग्रिड में अनुपस्थित है (संकेत मात्र)।', have ? 1 : -1, SRC_LOSHU));
  if (MAITRI[r.name.chaldeanRed]) maitri('num.r4', ['Name number', 'नामांक'], r.name.chaldeanRed, W.r4, SRC_CHALDEAN);
  // Kosh part 4 (business): the firm-name number, read against the owner's Bhagyank as the firm card does.
  if (area === 'business' && r.firm && MAITRI[r.firm.chaldeanRed]) {
    var fn = r.firm.chaldeanRed, fr = rel(r.bhagyank, fn), fd = W.r5[fr] || 0;
    score += fd;
    R.push(reason('num.r5', 'For the owner\'s Bhagyank ' + r.bhagyank + ' (' + PLANET[r.bhagyank][0] + '), firm-name number ' + fn + ' (' + PLANET[fn][0] + ') is ' + REL_WORD[fr][0] + '.',
      'मालिक के भाग्यांक ' + r.bhagyank + ' (' + PLANET[r.bhagyank][1] + ') के लिए फ़र्म-नामांक ' + fn + ' (' + PLANET[fn][1] + ') ' + REL_WORD[fr][1] + ' है।',
      fd > 0 ? 1 : fd < 0 ? -1 : 0, SRC_FIRM));
  }
  var pos = R.some(function (x: any) { return x.effect > 0; }), neg = R.some(function (x: any) { return x.effect < 0; }), a = Math.abs(score);
  p.phal = pos && neg && a < W.anirnit ? 'anirnit' : score >= W.siddhi ? 'siddhi' : score >= W.vilamb ? 'siddhi_vilamb' : score >= 0 ? 'aanshik' : 'asiddhi';
  p.bal = a >= W.prabal ? 'prabal' : a >= W.madhyam ? 'madhyam' : 'durbal';
  p.score = score;
  if (p.phal === 'anirnit') p.anirnit_reason = ['the supporting and opposing indications are equal', 'समर्थक एवं विरोधी संकेत बराबर हैं'];
  if (area === 'health') {
    // Health is a tendency, not an outcome (Kosh part 4): the card words it as a tendency (pravritti).
    p.pravritti = true;
    if (p.bal === 'prabal') p.bal = 'madhyam';
    p.kaal_khand_null = HEALTH_KAAL_NULL; p.note = HEALTH_NOTE;
    p.kya_karen.push(['Keep a regular routine and routine check-ups; numerology does not diagnose or cure.', 'नियमित दिनचर्या एवं समय-समय पर जाँच रखें; अंक ज्योतिष न रोग पहचानता है, न ठीक करता है।']);
    return p;
  }
  if (p.phal === 'asiddhi') {
    p.kaal_khand_null = ['none, because the verdict for this period is negative.', 'नहीं, क्योंकि इस अवधि का फल नकारात्मक है।'];
    p.kya_karen.push(['Do not force a major step on this indication. It comes from the birth numbers and name, not from the year, so decide the question from the birth chart (KP).', 'इस संकेत पर बड़ा कदम ज़बरदस्ती न उठाएँ। यह जन्म-अंकों और नाम से आता है, वर्ष से नहीं; इसलिए प्रश्न जन्म-कुंडली (KP) से तय करें।']);
  } else if (p.phal === 'anirnit') {
    p.kaal_khand_null = ['none, because the verdict is undecided.', 'नहीं, क्योंकि फल अनिर्णीत है।'];
    p.kya_karen.push(['Decide this question from the birth chart (KP) first.', 'यह प्रश्न पहले जन्म-कुंडली (KP) से तय करें।']);
  } else {
    p.kaal_khand = numWindow(r.D, r.M, r.bhagyank, k, asOf);
    if (!p.kaal_khand) p.kaal_khand_null = ['none: no favourable personal year and month for this karaka within the next 9-year cycle.', 'नहीं: अगले 9-वर्षीय चक्र में इस कारक के अनुकूल वर्षांक-मासांक नहीं मिला।'];
    else p.kya_karen.push(['Plan the main step inside the time window, best in the most likely month.', 'मुख्य कदम कालखंड के भीतर रखें, हो सके तो सबसे संभावित मास में।']);
    // A forecast year other than the reading date's own hides the present; show it alongside the requested window.
    var todayEff = today || asOf;
    if (asOf !== todayEff) p.kaal_khand_ab = numWindow(r.D, r.M, r.bhagyank, k, todayEff);
    if (p.phal === 'siddhi_vilamb') p.kya_karen.push(['Expect some delay; keep the effort steady.', 'कुछ विलंब संभव है; प्रयास निरंतर रखें।']);
    if (p.phal === 'aanshik') p.kya_karen.push(['Expect partial results; set a realistic target.', 'आंशिक सफलता की अपेक्षा रखें; लक्ष्य व्यावहारिक रखें।']);
  }
  if (area === 'business' && r.firm) p.kya_karen.push(['See the firm-name card below for the business name number.', 'फ़र्म-नामांक के लिए नीचे फ़र्म के नाम का कार्ड देखें।']);
  // Kosh part 4: numerology confirms; KP is the primary method for these questions.
  p.kya_karen.push(['Numerology is a supporting method here; confirm the main verdict from the birth chart (KP).', 'यहाँ अंक ज्योतिष सहायक पद्धति है; मुख्य फल जन्म-कुंडली (KP) से पुष्ट करें।']);
  return p;
}

/* ---------- Texts ---------- */
const TRAIT = [null,
  ['Leadership, independence, ambition and originality; watch for ego and impatience.', 'नेतृत्व, स्वतंत्रता, महत्वाकांक्षा और मौलिकता; अहं और अधीरता से बचें।'],
  ['Sensitive, cooperative, intuitive and diplomatic; watch for mood swings and indecision.', 'संवेदनशील, सहयोगी, अंतर्ज्ञानी और कूटनीतिक; मन की चंचलता और अनिर्णय से बचें।'],
  ['Wise, optimistic, expressive — a natural guide and teacher; can over-commit.', 'ज्ञानी, आशावादी, अभिव्यक्तिशील — स्वाभाविक मार्गदर्शक; अति-व्यस्तता से बचें।'],
  ['Hard-working, systematic, thinks differently; sudden ups and downs, a rebellious streak.', 'परिश्रमी, व्यवस्थित, लीक से हटकर सोच; अचानक उतार-चढ़ाव और विद्रोही स्वभाव।'],
  ['Quick-witted, communicative, business-minded and adaptable; restlessness.', 'तीव्र बुद्धि, वाक्-पटु, व्यापारिक सोच, लचीलापन; बेचैनी से बचें।'],
  ['Loving, artistic, family-oriented, fond of comfort; watch for over-indulgence.', 'प्रेमपूर्ण, कलात्मक, परिवार-प्रिय, सुख-सुविधा प्रिय; अति-भोग से बचें।'],
  ['Spiritual, analytical, intuitive, a researcher; tends towards detachment and isolation.', 'आध्यात्मिक, विश्लेषक, अंतर्ज्ञानी, शोध-प्रिय; अलगाव और वैराग्य की प्रवृत्ति।'],
  ['Disciplined, patient and just; success is slow but lasting; delays and burdens.', 'अनुशासित, धैर्यवान, न्यायप्रिय; सफलता धीमी पर स्थायी; देरी और बोझ।'],
  ['Energetic, courageous, protective and humanitarian; watch for anger and impulsiveness.', 'ऊर्जावान, साहसी, रक्षक, परोपकारी; क्रोध और आवेग से बचें।']];
const PY_TXT = [null,
  ['New beginnings — a year to start projects and take the lead.', 'नई शुरुआत का वर्ष — नए काम शुरू करें, पहल करें।'],
  ['Patience and partnership — progress is slow, cooperation pays.', 'धैर्य और साझेदारी का वर्ष — प्रगति धीमी, सहयोग से लाभ।'],
  ['Expression and growth — social circle, creativity and communication expand.', 'अभिव्यक्ति और विस्तार का वर्ष — मेल-जोल, रचनात्मकता, संवाद बढ़ते हैं।'],
  ['Hard work and foundations — discipline now builds long-term security.', 'परिश्रम और नींव का वर्ष — अनुशासन से दीर्घकालिक सुरक्षा।'],
  ['Change and movement — travel, new contacts, freedom; avoid rash moves.', 'परिवर्तन और गति का वर्ष — यात्रा, नए संपर्क; जल्दबाज़ी से बचें।'],
  ['Family and responsibility — home, relationships, care for others.', 'परिवार और ज़िम्मेदारी का वर्ष — घर, संबंध, दूसरों की देखभाल।'],
  ['Introspection — study, research and spiritual growth; keep plans flexible.', 'आत्मचिंतन का वर्ष — अध्ययन, शोध, आध्यात्मिक उन्नति; योजनाएँ लचीली रखें।'],
  ['Money and authority — effort turns into results, career responsibility grows.', 'धन और अधिकार का वर्ष — परिश्रम का फल, करियर में ज़िम्मेदारी बढ़ती है।'],
  ['Completion — close old chapters, let go, serve; prepare for a new cycle.', 'समापन का वर्ष — पुराने अध्याय बंद करें, त्याग और सेवा; नए चक्र की तैयारी।']];
const MISSING = [null,
  ['Expressing feelings takes effort; communication needs work.', 'भावनाएँ व्यक्त करने में कठिनाई; संवाद पर मेहनत करनी पड़ती है।'],
  ['Less sensitivity and intuition; patience in partnerships needs care.', 'संवेदनशीलता व अंतर्ज्ञान कम; साझेदारी में धैर्य रखें।'],
  ['Imagination and planning need support; memory may be weak.', 'कल्पना व योजना में सहायता चाहिए; स्मरण-शक्ति कमज़ोर हो सकती है।'],
  ['Order and discipline need conscious effort.', 'व्यवस्था और अनुशासन के लिए सचेत प्रयास ज़रूरी।'],
  ['Emotional balance and stability need attention.', 'भावनात्मक संतुलन और स्थिरता पर ध्यान दें।'],
  ['Home and family duties may feel heavy.', 'घर-परिवार की ज़िम्मेदारियाँ भारी लग सकती हैं।'],
  ['Lessons come through disappointment; spiritual growth needs effort.', 'निराशाओं से सीख मिलती है; आध्यात्मिक उन्नति हेतु प्रयास चाहिए।'],
  ['Money management and attention to detail need care.', 'धन-प्रबंधन और बारीकियों पर ध्यान देना ज़रूरी।'],
  ['Ambition and drive may need a push.', 'महत्वाकांक्षा और ऊर्जा को प्रेरणा चाहिए।']];
const PLANES = [
  [[4, 9, 2], 'Mental plane', 'मानसिक तल', 'thinking, intellect, memory', 'विचार, बुद्धि, स्मरण'],
  [[3, 5, 7], 'Emotional plane', 'भावनात्मक तल', 'emotions, spirituality, balance', 'भावना, आध्यात्मिकता, संतुलन'],
  [[8, 1, 6], 'Practical plane', 'व्यावहारिक तल', 'material success, practicality', 'भौतिक सफलता, व्यावहारिकता'],
  [[4, 3, 8], 'Thought plane', 'विचार तल', 'planning, ideas', 'योजना, विचार'],
  [[9, 5, 1], 'Will plane', 'इच्छाशक्ति तल', 'determination, persistence', 'दृढ़ता, संकल्प'],
  [[2, 7, 6], 'Action plane', 'कर्म तल', 'action, execution', 'कर्म, क्रियान्वयन'],
  [[4, 5, 6], 'Golden yoga', 'स्वर्ण राजयोग', 'growth in status and property', 'पद व संपत्ति में उन्नति'],
  [[2, 5, 8], 'Silver yoga', 'रजत राजयोग', 'wealth and property', 'धन व संपत्ति']];
const LUCKY = [null,
  ['Sunday', 'रविवार', 'gold, orange', 'सुनहरा, नारंगी', 'Ruby', 'माणिक्य'],
  ['Monday', 'सोमवार', 'white, cream', 'सफ़ेद, क्रीम', 'Pearl', 'मोती'],
  ['Thursday', 'गुरुवार', 'yellow', 'पीला', 'Yellow sapphire', 'पुखराज'],
  ['Saturday', 'शनिवार', 'grey, blue', 'स्लेटी, नीला', 'Hessonite', 'गोमेद'],
  ['Wednesday', 'बुधवार', 'green', 'हरा', 'Emerald', 'पन्ना'],
  ['Friday', 'शुक्रवार', 'white, pink', 'सफ़ेद, गुलाबी', 'Diamond / opal', 'हीरा / ओपल'],
  ['Monday', 'सोमवार', 'smoky grey, multicolour', 'धूसर, बहुरंगी', "Cat's eye", 'लहसुनिया'],
  ['Saturday', 'शनिवार', 'dark blue, black', 'गहरा नीला, काला', 'Blue sapphire', 'नीलम'],
  ['Tuesday', 'मंगलवार', 'red', 'लाल', 'Red coral', 'मूंगा']];
const MONTHS = [['Jan', 'जन'], ['Feb', 'फ़र'], ['Mar', 'मार्च'], ['Apr', 'अप्रै'], ['May', 'मई'], ['Jun', 'जून'], ['Jul', 'जुला'], ['Aug', 'अग'], ['Sep', 'सित'], ['Oct', 'अक्टू'], ['Nov', 'नवं'], ['Dec', 'दिसं']];

export { CHALDEAN, pyth, digitSum, reduce, reduceMaster, PLANET, MAITRI, rel, kua, latin, hasLatin, mobileDigits, isVowelAt, nameAnalysis, loShu, compute, goodTargets, lettersWorth, personalYear, NUM_W, AREAS, MINOR_AREAS, SRC_KARAKA, SRC_NUMPLANET, SRC_LOSHU, SRC_CHALDEAN, SRC_FIRM, SRC_SELF, srcMaitri, REL_WORD, numWindow, phaladesh, TRAIT, PY_TXT, MISSING, PLANES, LUCKY, MONTHS };
