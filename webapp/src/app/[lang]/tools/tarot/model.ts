/* eslint-disable @typescript-eslint/no-explicit-any */
// The tarot reading as plain strings, ported from the app (features/tarot/TarotResult.tsx: synthesis and tarotModel).
// Every string is resolved once in the page language, so the screen and the print view show the same content.
import { dmy, pad2, type Bi, type BiFn } from "../numerology/bi";

type Loose = any;

export type Card = {id: number; rev: boolean};
export type Birth = {dob: string; time: string; tz: number; place: string};
export type Meta = {client: string; topic: string; question: string; spreadKey: string; useRev: boolean; birth: Birth | null};
export type Reading = {cards: Card[]; drawId: string | null; at: Date; meta: Meta};
type Row = [string, string];

const RANK_THEME: Bi[] = [
  ['new beginnings and fresh opportunities', 'नई शुरुआत और नए अवसर'],
  ['choices and partnerships', 'चुनाव और साझेदारी'],
  ['growth and teamwork', 'विकास और टीमवर्क'],
  ['stability and consolidation', 'स्थिरता और मज़बूती'],
  ['conflict and change', 'टकराव और परिवर्तन'],
  ['harmony and transition', 'सामंजस्य और बदलाव'],
  ['assessment and challenges', 'मूल्यांकन और चुनौतियाँ'],
  ['movement and power', 'गति और शक्ति'],
  ['nearing completion', 'पूर्णता के निकट'],
  ['endings and completion', 'अंत और समापन'],
  ['messages and learning', 'संदेश और सीखना'],
  ['movement and action', 'गति और कर्म'],
  ['nurturing and maturity', 'पालन-पोषण और परिपक्वता'],
  ['authority and mastery', 'अधिकार और निपुणता'],
];
const ELEMENT_THEME: Record<string, Bi> = {
  w: ['action, career, ambition and energy', 'कर्म, करियर, महत्वाकांक्षा और ऊर्जा'],
  c: ['emotions, relationships and feelings', 'भावनाएँ, संबंध और मन'],
  s: ['thoughts, decisions, conflict and communication', 'विचार, निर्णय, टकराव और संवाद'],
  p: ['money, work, property and practical matters', 'धन, काम, संपत्ति और व्यावहारिक विषय'],
};

export const orient = (bi: BiFn, rev: boolean) => (rev ? bi("Reversed", "उल्टा") : bi("Upright", "सीधा"));
export const cardName = (bi: BiFn, d: Loose) => bi(d.en, d.hi);

/** The page's synthesis(): the overall-reading lines. */
function synthesis(E: Loose, bi: BiFn, cards: Card[], sp: Loose, blocked: unknown): string[] {
  const {DECK, SUITS, RANKS} = E;
  const n = cards.length,
    out: string[] = [],
    suit: Record<string, number> = {w: 0, c: 0, s: 0, p: 0},
    ranks: Record<string, number> = {};
  let majors = 0,
    revs = 0,
    courts = 0;
  cards.forEach(c => {
    const d = DECK[c.id];
    if (c.rev) {
      revs++;
    }
    if (d.major) {
      majors++;
    } else {
      suit[d.suit.k]++;
      if (d.rank >= 10) {
        courts++;
      }
      ranks[d.rank] = (ranks[d.rank] || 0) + 1;
    }
  });
  const suitOf = (k: string) => SUITS.find((x: Loose) => x.k === k);
  if (n >= 3 && majors >= Math.ceil(n / 2)) {
    out.push(
      bi(
        `Major Arcana dominate (${majors} of ${n}): this is a significant, destiny-level phase — larger forces shape the matter.`,
        `मेजर आर्काना प्रबल (${n} में ${majors}): यह एक महत्वपूर्ण, भाग्य-स्तर का दौर है — बड़ी शक्तियाँ विषय को दिशा दे रही हैं।`,
      ),
    );
  } else if (n >= 3 && majors === 0) {
    out.push(
      bi(
        "No Major Arcana: the matter is in the client's own hands and can be changed through day-to-day choices.",
        'कोई मेजर आर्काना नहीं: विषय जातक के अपने हाथ में है, रोज़ के निर्णयों से बदला जा सकता है।',
      ),
    );
  }
  const keys = Object.keys(suit).sort((a, b) => suit[b] - suit[a]);
  if (n >= 3 && suit[keys[0]] >= 2 && suit[keys[0]] > suit[keys[1]]) {
    const st = suitOf(keys[0]);
    out.push(
      bi(
        `Mostly ${st.en} (${st.el[0]}): the reading centres on ${ELEMENT_THEME[keys[0]][0]}.`,
        `अधिकतर ${st.hi} (${st.el[1]}): रीडिंग का केंद्र ${ELEMENT_THEME[keys[0]][1]} है।`,
      ),
    );
  }
  if (n >= 5) {
    keys.forEach(k => {
      if (suit[k]) {
        return;
      }
      const s2 = suitOf(k);
      out.push(
        bi(
          `No ${s2.en}: ${ELEMENT_THEME[k][0]} are not the core of this matter.`,
          `कोई ${s2.hi} नहीं: ${ELEMENT_THEME[k][1]} इस विषय का मुख्य केंद्र नहीं।`,
        ),
      );
    });
  }
  if (n >= 3 && revs >= Math.ceil(n / 2)) {
    out.push(
      bi(
        `Many reversed cards (${revs}): energy is blocked or turned inward — expect delays; inner work comes first.`,
        `कई उल्टे कार्ड (${revs}): ऊर्जा रुकी हुई या भीतर की ओर — देरी संभव; पहले आंतरिक सुधार।`,
      ),
    );
  }
  if (courts >= 2) {
    out.push(
      bi(
        `Several court cards (${courts}): other people play a real part in this matter.`,
        `कई कोर्ट कार्ड (${courts}): इस विषय में दूसरे लोगों की अहम भूमिका है।`,
      ),
    );
  }
  Object.keys(ranks).forEach(r => {
    if (ranks[r] >= 2) {
      out.push(bi(`${ranks[r]} × ${RANKS[+r][0]}: a theme of ${RANK_THEME[+r][0]}.`, `${ranks[r]} × ${RANKS[+r][1]} — संकेत: ${RANK_THEME[+r][1]}।`));
    }
  });
  if (sp.outcome != null && !blocked) {
    // a withheld (minor) phal gets no outcome direction
    const oc = cards[sp.outcome],
      od = DECK[oc.id];
    out.push(
      oc.rev
        ? bi(
            `The outcome card (${od.en}) is reversed: the result is not settled yet — it needs effort or time.`,
            `परिणाम कार्ड (${od.hi}) उल्टा है: परिणाम अभी तय नहीं — प्रयास या समय चाहिए।`,
          )
        : bi(
            `The outcome card (${od.en}) is upright: the present direction leads towards ${od.up[0].toLowerCase()}.`,
            `परिणाम कार्ड (${od.hi}) सीधा है: वर्तमान दिशा ${od.up[1]} की ओर ले जाती है।`,
          ),
    );
  }
  if (!out.length) {
    out.push(
      bi(
        'A single, focused message — read the card below as the answer to the question.',
        'एक केंद्रित संदेश — नीचे दिए कार्ड को प्रश्न के उत्तर के रूप में पढ़ें।',
      ),
    );
  }
  return out;
}

/** Everything renderResult() shows, as plain strings in the app language. */
export function tarotModel(E: Loose, bi: BiFn, R: Reading) {
  const {DECK, SPREADS, TOPIC, ROMAN, RANK_SHORT, PRAMAAN, BIRTH_SRC} = E;
  const m = R.meta,
    sp = SPREADS[m.spreadKey],
    cards = R.cards,
    b = m.birth,
    at = R.at;
  const when = `${at.getDate()}/${at.getMonth() + 1}/${at.getFullYear()} ${pad2(at.getHours())}:${pad2(at.getMinutes())}`;
  const day = `${at.getFullYear()}-${pad2(at.getMonth() + 1)}-${pad2(at.getDate())}`;
  const p = E.tarotPhal({cards, spreadKey: m.spreadKey, topic: m.topic, useRev: m.useRev, date: day, dob: b ? b.dob : ''});
  const posLabel = (i: number) => `${i + 1}. ${bi(sp.pos[i])}`;

  const kv: Row[] = [];
  if (m.client) {
    kv.push([bi('Client', 'जातक'), m.client]);
  }
  kv.push(
    [bi('Area', 'क्षेत्र'), bi(TOPIC[m.topic])],
    [bi('Time', 'समय'), when],
    [bi('Cards from', 'कार्ड स्रोत'), R.drawId ? `${bi('App shuffle', 'ऐप शफ़ल')} · #${R.drawId}` : bi("Astrologer's deck", 'ज्योतिषी का डेक')],
  );
  if (b?.dob) {
    kv.push([bi('Date of birth', 'जन्म तिथि'), dmy(b.dob)]);
  }
  if (b?.time) {
    kv.push([bi('Birth time', 'जन्म समय'), `${b.time} (UTC${b.tz >= 0 ? '+' : ''}${b.tz})`]);
  }
  if (b?.place) {
    kv.push([bi('Birthplace', 'जन्म स्थान'), b.place]);
  }

  let birth: {rows: Row[]; up: string; hint: string} | null = null;
  if (b?.dob) {
    const bc = E.birthCard(b.dob);
    birth = {
      rows: bc.chain.map(
        (n: number, i: number): Row => [
          i ? bi('Partner card', 'सहयोगी कार्ड') : bi('Birth card', 'जन्म-कार्ड'),
          `${ROMAN[n]} · ${cardName(bi, DECK[n])}`,
        ],
      ),
      up: bi(DECK[bc.num].up),
      hint:
        bi(
          'Month + day + year of birth added as numbers, then digits added until 22 or less (22 = The Fool). ',
          'जन्म का माह + दिन + वर्ष संख्याओं के रूप में जोड़कर, फिर अंक जोड़ते हुए 22 या कम तक (22 = द फ़ूल)। ',
        ) + `${bi(BIRTH_SRC.granth)}, ${bi('reference: verification pending', 'संदर्भ: सत्यापन शेष')} · ${bi(PRAMAAN[BIRTH_SRC.pramaan_star])}`,
    };
  }

  let yesno: {cls: 'ok' | 'mid' | 'bad'; lean: string; text: string} | null = null;
  if (sp.yesno && !p.blocked) {
    // a withheld (minor) phal gets no yes / no either
    const sc = cards.reduce((a, c) => a + E.ynValue(c), 0),
      ln = E.ynLean(p.phal);
    yesno = {
      cls: ln > 0 ? 'ok' : ln < 0 ? 'bad' : 'mid',
      lean: ln > 0 ? bi('Leans YES', 'झुकाव: हाँ') : ln < 0 ? bi('Leans NO', 'झुकाव: ना') : bi('Unclear — not decided yet', 'अस्पष्ट — अभी तय नहीं'),
      text: bi(
        `Raw count ${sc} from three cards (upright yes-cards +1, no-cards −1; reversed cards 0, except −1 for a no-card whose reversed meaning stays hard). The lean follows the phaladesh above, after the deck-average correction.`,
        `तीन कार्डों की सीधी गिनती ${sc} (सीधे हाँ-कार्ड +1, ना-कार्ड −1; उल्टे कार्ड 0, पर जिस ना-कार्ड का उल्टा अर्थ भी कठिन है वह −1)। झुकाव ऊपर के फलादेश से है, डेक-औसत सुधार के बाद।`,
      ),
    };
  }

  return {
    p,
    title: bi(sp.en, sp.hi),
    kv,
    question: m.question,
    faces: cards.map((c, i) => {
      const d = DECK[c.id];
      return {
        pos: posLabel(i),
        cls: (d.major ? 'm' : d.suit.k) as string,
        rk: d.major ? ROMAN[d.num] : RANK_SHORT[d.rank],
        sym: d.major ? '★' : d.suit.sym,
        name: cardName(bi, d),
        rev: c.rev,
      };
    }),
    birth,
    yesno,
    byCard: cards.map((c, i) => {
      const d = DECK[c.id];
      return {
        head: `${posLabel(i)} — ${cardName(bi, d)}`,
        rev: c.rev,
        mean: bi(c.rev ? d.rv : d.up),
        kind: d.major ? bi('Major Arcana', 'मेजर आर्काना') : bi(`${d.suit.en} · ${d.suit.el[0]}`, `${d.suit.hi} · ${d.suit.el[1]}`),
      };
    }),
    overall: synthesis(E, bi, cards, sp, p.blocked),
    health:
      m.topic === 'health'
        ? bi(
            'Tarot is not a medical tool. For any health concern, ask the client to consult a qualified doctor.',
            'टैरो चिकित्सा का साधन नहीं है। स्वास्थ्य संबंधी किसी भी चिंता के लिए जातक को योग्य डॉक्टर से मिलने को कहें।',
          )
        : null,
    closing: bi(
      "Meanings follow the traditional Rider–Waite–Smith system. Read them together with the question and the client's situation; no single card decides the answer.",
      'अर्थ पारंपरिक राइडर–वेट–स्मिथ पद्धति पर आधारित हैं। इन्हें प्रश्न और जातक की स्थिति के साथ पढ़ें; कोई एक कार्ड उत्तर तय नहीं करता।',
    ),
  };
}
export type TarotModel = ReturnType<typeof tarotModel>;

