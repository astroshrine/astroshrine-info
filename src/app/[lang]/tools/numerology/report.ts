// The numerology report as plain blocks, ported from the app (features/numerology/NumerologyResult.tsx buildReport).
// Labels are already in the page language, so the screen and the print view show the same content.
import type { Bi, BiFn } from "./bi";
import { dmy } from "./bi";

/** The ported engine module (its content tables are loosely typed, as in the app). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Engine = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;
type Cls = 'ok' | 'mid' | 'bad';
export type Val = string | {pill: string; cls: Cls};
export type Block =
  | {t: 'nums'; items: {label: string; n: number; sub: string; key?: boolean}[]}
  | {t: 'kv'; rows: [string, Val][]}
  | {t: 'h3' | 'p' | 'hint' | 'note'; text: string}
  | {t: 'letters'; words: {letters: [string, number][]; total?: string}[]}
  | {t: 'verdict'; cls: Cls; title: string; body?: string; list?: string[]}
  | {t: 'loshu'; cells: {text: string; sub: string; empty: boolean}[]}
  | {t: 'rows'; rows: {main: string; sub?: string; right?: Val}[]}
  | {t: 'list'; items: string[]};
export type Sec = {title: string; blocks: Block[]};
export type Birth = {dob: string; time: string; tz: number; district: string; place: string};
export type Input = {name: string; dob: string; gender: string; year: number; mobile: string; firm: string; birth: Birth; area: string; asOf: string; today: string};

export const tagLine = (bi: BiFn) => bi('Mulank · Bhagyank · Name number · Lo Shu grid · Personal year', 'मूलांक · भाग्यांक · नामांक · लो-शू ग्रिड · व्यक्तिगत वर्ष');
export const kv = (...rows: Array<[string, Val] | false | null | undefined>): Block => ({t: 'kv', rows: rows.filter(Boolean) as [string, Val][]});
const showNum = (total: number, red: number) => (total > 9 ? `${total}/${red}` : String(red));
const letters = (words: Loose[]): Block => ({t: 'letters', words: words.map(w => ({letters: w.letters, total: showNum(w.sum, w.red)}))});
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** The report sections after the phaladesh card, in render() order. E = the page engine, r = compute(inp). */
export function buildReport(E: Engine, bi: BiFn, r: Loose, inp: Input): Sec[] {
  const relPill = (x: string): Val =>
    x === "F" ? { pill: bi("Friendly", "मित्र"), cls: "ok" } : x === "E" ? { pill: bi("Hostile", "शत्रु"), cls: "bad" } : { pill: bi("Neutral", "सम"), cls: "mid" };
  const pl = (x: number) => (E.PLANET[x] ? bi(E.PLANET[x]) : '—'); // 0 (an all-zero number) has no planet
  const targets: number[] = E.goodTargets(r.mulank, r.bhagyank);
  const b = inp.birth;
  const n = r.name;
  const c: number[] = r.loshu.counts;
  const out: Sec[] = [];

  out.push({
    title: `${inp.name} · ${r.D}/${r.M}/${r.Y}`,
    blocks: [
      {
        t: 'nums',
        items: [
          {label: bi('Mulank (Psychic)', 'मूलांक'), n: r.mulank, sub: pl(r.mulank), key: true},
          {label: bi('Bhagyank (Destiny)', 'भाग्यांक'), n: r.bhagyank, sub: `${r.dobTotal} → ${r.bhagyank} · ${pl(r.bhagyank)}`, key: true},
          {label: bi('Name number (Chaldean)', 'नामांक (कीरो)'), n: n.chaldeanRed, sub: `${n.chaldean} → ${n.chaldeanRed} · ${pl(n.chaldeanRed)}`},
          ...(r.kua ? [{label: bi('Kua number', 'कुआ अंक'), n: r.kua.k, sub: pl(r.kua.k)}] : []),
          {label: `${bi('Personal year', 'व्यक्तिगत वर्ष')} ${r.year}`, n: r.py, sub: pl(r.py)},
        ],
      },
      kv(
        [bi('Mulank → Bhagyank', 'मूलांक → भाग्यांक'), relPill(E.rel(r.mulank, r.bhagyank))],
        [bi('Life path (Pythagorean)', 'लाइफ़ पाथ (पाइथागोरस)'), r.lifePath > 9 ? `${r.lifePath}/${E.reduce(r.lifePath)}` : String(r.lifePath)],
        !!b.dob && [bi('Date of birth', 'जन्म तिथि'), dmy(b.dob)],
        !!b.time && [bi('Birth time', 'जन्म समय'), `${b.time} (UTC${b.tz >= 0 ? '+' : ''}${b.tz})`],
        !!b.place && [bi('Birthplace', 'जन्म स्थान'), b.place],
        [bi('Phaladesh as of', 'फलादेश की तिथि'), dmy(inp.asOf)],
      ),
    ],
  });

  out.push({
    title: bi('Core numbers', 'मूल अंक'),
    blocks: [
      {t: 'h3', text: `${bi('Mulank', 'मूलांक')} ${r.mulank} — ${pl(r.mulank)}`},
      {t: 'p', text: bi(E.TRAIT[r.mulank])},
      {t: 'hint', text: bi('Mulank shows the inner nature and how the person reacts day to day.', 'मूलांक स्वभाव और रोज़मर्रा की प्रतिक्रिया दिखाता है।')},
      {t: 'h3', text: `${bi('Bhagyank', 'भाग्यांक')} ${r.bhagyank} — ${pl(r.bhagyank)}`},
      {t: 'p', text: bi(E.TRAIT[r.bhagyank])},
      {t: 'hint', text: bi('Bhagyank shows the direction of life and how fortune unfolds.', 'भाग्यांक जीवन की दिशा और भाग्य के फलने का ढंग दिखाता है।')},
      {t: 'h3', text: bi('Numbers that sit well with this person', 'इस जातक के अनुकूल अंक')},
      {t: 'p', text: targets.join(', ') || '—'},
      {t: 'hint', text: bi('Friendly to the Bhagyank and not hostile to the Mulank (graha maitri).', 'भाग्यांक के मित्र और मूलांक के शत्रु नहीं (ग्रह-मैत्री के आधार पर)।')},
    ],
  });

  const name: Block[] = [
    letters(n.words),
    kv(
      [bi('Chaldean (Cheiro) total', 'कीरो (कैल्डियन) योग'), showNum(n.chaldean, n.chaldeanRed)],
      [bi('Pythagorean expression', 'पाइथागोरस एक्सप्रेशन'), showNum(n.expression, n.expressionRed)],
      [bi('Soul urge (vowels)', 'सोल अर्ज (स्वर)'), showNum(n.soul, n.soulRed)],
      [bi('Personality (consonants)', 'पर्सनैलिटी (व्यंजन)'), showNum(n.personality, n.personalityRed)],
      [bi('Name number → Mulank', 'नामांक → मूलांक'), relPill(E.rel(r.mulank, n.chaldeanRed))],
      [bi('Name number → Bhagyank', 'नामांक → भाग्यांक'), relPill(E.rel(r.bhagyank, n.chaldeanRed))],
    ),
  ];
  if (targets.includes(n.chaldeanRed)) {
    name.push({t: 'verdict', cls: 'ok', title: bi('Name number is in harmony', 'नामांक अनुकूल है'), body: bi('It is one of the numbers that sit well with this person.', 'यह जातक के अनुकूल अंकों में से एक है।')});
  } else {
    name.push(
      {
        t: 'verdict',
        cls: 'mid',
        title: bi('Name number is not among the favourable numbers', 'नामांक अनुकूल अंकों में नहीं है'),
        body: bi('If the client wants a spelling change, these options would bring the name number in line:', 'यदि जातक स्पेलिंग बदलना चाहे, तो ये विकल्प नामांक को अनुकूल बनाएँगे:'),
        list: targets
          .map(tg => [tg, (((tg - n.chaldeanRed) % 9) + 9) % 9])
          .filter(([, d]) => d)
          .map(([tg, d]) => `${bi('For', 'नामांक')} ${tg} (${pl(tg)}): ${bi('add a letter worth', 'इतने मान का अक्षर जोड़ें:')} ${d} — ${E.lettersWorth(d).join(', ')}`),
      },
      {t: 'hint', text: bi('Check every new spelling again here before suggesting it; a change in pronunciation matters too.', 'नई स्पेलिंग सुझाने से पहले उसे यहीं दोबारा जाँचें; उच्चारण का बदलना भी महत्वपूर्ण है।')},
    );
  }
  out.push({title: bi('Name analysis', 'नाम विश्लेषण'), blocks: name});

  const SRC: Record<string, string> = {
    dob: bi('date-of-birth digits (0 skipped)', 'जन्मतिथि के अंक (0 छोड़कर)'),
    bhagyank: bi('Bhagyank', 'भाग्यांक'),
    mulank: bi('Mulank (two-digit birthday)', 'मूलांक (दो अंकों की तिथि)'),
    kua: bi('Kua number', 'कुआ अंक'),
  };
  const miss = NINE.filter(d => !c[d]);
  const reps = NINE.filter(d => c[d] >= 3);
  const lo: Block[] = [
    {t: 'loshu', cells: [4, 9, 2, 3, 5, 7, 8, 1, 6].map(d => ({text: String(d).repeat(c[d]), sub: c[d] ? pl(d) : `${bi('missing', 'अनुपस्थित')} ${d}`, empty: !c[d]}))},
    {t: 'hint', text: bi('Includes: ', 'शामिल: ') + r.loshu.src.map((x: string) => SRC[x]).join(' + ')},
    {t: 'h3', text: bi('Planes and yogas', 'तल और योग')},
    {
      t: 'rows',
      rows: E.PLANES.map((p: Loose) => {
        const have = p[0].filter((d: number) => c[d]).length;
        const right: Val = have === 3 ? {pill: bi('Complete', 'पूर्ण'), cls: 'ok'} : have === 0 ? {pill: bi('Empty', 'रिक्त'), cls: 'bad'} : {pill: `${have}/3`, cls: 'mid'};
        return {main: `${bi(p[1], p[2])} · ${p[0].join('-')}`, sub: bi(p[3], p[4]), right};
      }),
    },
  ];
  if (miss.length) {lo.push({t: 'h3', text: bi('Missing numbers', 'अनुपस्थित अंक')}, {t: 'list', items: miss.map(d => `${d} (${pl(d)}): ${bi(E.MISSING[d])}`)});}
  if (reps.length) {
    lo.push(
      {t: 'h3', text: bi('Repeated numbers', 'दोहराए गए अंक')},
      {t: 'list', items: reps.map(d => `${String(d).repeat(c[d])} — ${bi(`an excess of ${E.PLANET[d][0]} energy; its strength can turn into over-drive.`, `${E.PLANET[d][1]} की ऊर्जा अधिक — इसकी शक्ति अति में बदल सकती है।`)}`)},
    );
  }
  lo.push({
    t: 'note',
    text: bi(
      'Lo Shu traditions differ on which numbers to add to the date digits. This grid adds the Bhagyank, the Mulank for two-digit birthdays and the Kua number when gender is given.',
      'लो-शू में जन्मतिथि के अंकों के साथ कौन-से अंक जोड़ें, इस पर परंपराएँ भिन्न हैं। यहाँ भाग्यांक, दो अंकों की तिथि पर मूलांक और लिंग दिया हो तो कुआ अंक जोड़ा गया है।',
    ),
  });
  out.push({title: bi('Lo Shu grid', 'लो-शू ग्रिड'), blocks: lo});

  if (r.mobile) {
    const m = r.mobile, rm = E.rel(r.mulank, m.red), rb = E.rel(r.bhagyank, m.red);
    const good = targets.includes(m.red), bad = rm === 'E' || rb === 'E';
    out.push({
      title: bi('Mobile number', 'मोबाइल नंबर'),
      blocks: [
        kv(
          [bi('Number', 'नंबर'), m.digits],
          [bi('Total', 'योग'), `${showNum(m.sum, m.red)} · ${pl(m.red)}`],
          [bi('→ Mulank', '→ मूलांक'), relPill(rm)],
          [bi('→ Bhagyank', '→ भाग्यांक'), relPill(rb)],
          [bi('Zeros', 'शून्य'), String(m.zeros)],
        ),
        {
          t: 'verdict',
          cls: good ? 'ok' : bad ? 'bad' : 'mid',
          title: good ? bi('Supportive number', 'अनुकूल नंबर') : bad ? bi('Conflicts with a core number', 'मूल अंक से टकराव') : bi('Neutral number', 'सामान्य नंबर'),
          body: good ? bi('The total is one of the favourable numbers.', 'योग अनुकूल अंकों में से है।') : bi('Favourable totals for this person: ', 'इस जातक के लिए अनुकूल योग: ') + (targets.join(', ') || '—'),
        },
      ],
    });
  }

  if (r.firm) {
    const f = r.firm, fr = E.rel(r.bhagyank, f.chaldeanRed), fg = targets.includes(f.chaldeanRed);
    out.push({
      title: bi('Business / firm name', 'व्यापार / फ़र्म का नाम'),
      blocks: [
        letters(f.words),
        kv([bi('Chaldean total', 'कीरो योग'), `${showNum(f.chaldean, f.chaldeanRed)} · ${pl(f.chaldeanRed)}`], [bi("→ Owner's Bhagyank", '→ मालिक का भाग्यांक'), relPill(fr)]),
        {
          t: 'verdict',
          cls: fg ? 'ok' : fr === 'E' ? 'bad' : 'mid',
          title: fg
            ? bi('Firm name supports the owner', 'फ़र्म का नाम मालिक के अनुकूल')
            : fr === 'E'
            ? bi("Firm name conflicts with the owner's Bhagyank", 'फ़र्म का नाम मालिक के भाग्यांक से टकराता है')
            : bi('Firm name is neutral for the owner', 'फ़र्म का नाम मालिक के लिए सामान्य'),
        },
      ],
    });
  }

  out.push({
    title: bi('Personal year', 'व्यक्तिगत वर्ष'),
    blocks: [
      {
        t: 'rows',
        rows: [0, 1, 2].map(i => {
          const yy = r.year + i, p = E.personalYear(r.D, r.M, yy);
          return {main: String(yy), sub: bi(E.PY_TXT[p]), right: String(p)};
        }),
      },
      {t: 'h3', text: `${bi('Personal months in', 'व्यक्तिगत मास —')} ${r.year}`},
      {t: 'letters', words: [{letters: E.MONTHS.map((mm: Bi, i: number) => [bi(mm), E.reduce(r.py + i + 1)])}]},
      {
        t: 'hint',
        text: bi(
          'Personal year = birth day + birth month + the year, reduced. Personal month = personal year + month number, reduced.',
          'व्यक्तिगत वर्ष = जन्म-दिन + जन्म-मास + वर्ष (एक अंक तक)। व्यक्तिगत मास = व्यक्तिगत वर्ष + मास संख्या।',
        ),
      },
    ],
  });

  out.push({
    title: bi('Traditional associations', 'पारंपरिक अनुकूलताएँ'),
    blocks: [
      {
        t: 'rows',
        rows: (
          [
            [bi('Mulank', 'मूलांक'), r.mulank],
            [bi('Bhagyank', 'भाग्यांक'), r.bhagyank],
          ] as Array<[string, number]>
        ).map(([lbl, x]) => {
          const L = E.LUCKY[x];
          return {main: `${lbl} ${x} — ${pl(x)}`, sub: `${bi('Day', 'वार')}: ${bi(L[0], L[1])} · ${bi('Colour', 'रंग')}: ${bi(L[2], L[3])} · ${bi('Gem', 'रत्न')}: ${bi(L[4], L[5])}`};
        }),
      },
      {
        t: 'note',
        text: bi(
          'Gemstones are listed as traditional associations only. Check the full birth chart before advising anyone to wear a gem.',
          'रत्न केवल पारंपरिक संबंध के रूप में दिए गए हैं। किसी को रत्न पहनने की सलाह देने से पहले पूरी जन्म-कुंडली देखें।',
        ),
      },
    ],
  });
  return out;
}

