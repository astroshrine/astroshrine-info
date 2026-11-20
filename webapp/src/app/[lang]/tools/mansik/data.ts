/**
 * Mansik Pravritti (mental wellness self-reflection) questionnaire: 0–3 scale over the last two weeks,
 * nine scored categories, a flag-only block (R psychosis-type, E eating) that is never scored or named,
 * and one safety item (S1). Original items written in the spirit of GAD-7 / PHQ-9 / OCI-R / PC-PTSD-5;
 * not a clinical instrument. Text pairs are [English, Hinglish] per the brief (never Devanagari here);
 * the surrounding page text comes from defineMessages.
 */

export type Cat = 'chinta' | 'udaasi' | 'mood_swing' | 'overthinking_ocd' | 'shak' | 'dar' | 'detachment' | 'purane_dard_ka_asar' | 'child_behaviour';
export type Level = 'halka' | 'madhyam' | 'zyada';
/** [English, Hinglish] */
export type Pair = [string, string];
export type QKind = Cat | 'R' | 'E' | 'S';
export type Question = {id: string; cat: QKind; text: Pair};

export const CATS: Cat[] = ['chinta', 'udaasi', 'mood_swing', 'overthinking_ocd', 'shak', 'dar', 'detachment', 'purane_dard_ka_asar', 'child_behaviour'];

export const CAT_NAME: Record<Cat, Pair> = {
  chinta: ['Worry', 'Chinta'],
  udaasi: ['Low mood', 'Udaasi'],
  mood_swing: ['Mood ups and downs', 'Mood ka utaar-chadhaav'],
  overthinking_ocd: ['Repeating thoughts or habits', 'Baar-baar ki soch ya aadat'],
  shak: ['Mistrust', 'Shak'],
  dar: ['Fear', 'Dar'],
  detachment: ['Feeling detached', 'Khoya-khoya mehsoos karna'],
  purane_dard_ka_asar: ['Effect of past pain', 'Purane dard ka asar'],
  child_behaviour: ["Child's behaviour", 'Bachche ka vyavhaar'],
};

/** Index is the answer value 0–3. */
export const SCALE: Pair[] = [
  ['Not at all', 'Bilkul nahi'],
  ['Sometimes', 'Kabhi-kabhi'],
  ['Often', 'Aksar'],
  ['Almost every day', 'Lagbhag roz'],
];

/** The final, neutrally titled block that holds R/E/S. */
export const EXTRA_TITLE: Pair = ['A few more questions', 'Kuch aur sawaal'];

export const QUESTIONS: Question[] = [
  {id: 'A1', cat: 'chinta', text: ['I feel nervous or restless without a clear reason.', 'Mujhe bina wajah ghabrahat ya bechaini mehsoos hoti hai.']},
  {id: 'A2', cat: 'chinta', text: ['I worry too much about small things.', 'Main chhoti baaton ki bhi zyada chinta karta/karti hoon.']},
  {id: 'A3', cat: 'chinta', text: ['I find it hard to relax.', 'Mujhe aaram karna mushkil lagta hai.']},
  {id: 'A4', cat: 'chinta', text: ['I feel something bad is about to happen.', 'Mujhe lagta hai kuch bura hone wala hai.']},
  {id: 'D1', cat: 'udaasi', text: ['I feel sad or empty.', 'Mera mann udaas ya khaali rehta hai.']},
  {id: 'D2', cat: 'udaasi', text: ["I've lost interest in things I used to enjoy.", 'Pehle jo cheezein pasand thi, ab unme dil nahi lagta.']},
  {id: 'D3', cat: 'udaasi', text: ['My sleep or appetite has changed a lot.', 'Neend ya bhook me kaafi badlaav aaya hai.']},
  {id: 'D4', cat: 'udaasi', text: ['I feel very tired or low on energy.', 'Main bahut thakaan ya energy ki kami mehsoos karta/karti hoon.']},
  {id: 'M1', cat: 'mood_swing', text: ['I swing between very high energy and very low moods.', 'Kabhi main bahut josh me hota/hoti hoon aur kabhi bilkul gir jata/jati hoon.']},
  {id: 'M2', cat: 'mood_swing', text: ["When I'm high, I feel energetic even with little sleep.", 'Josh ke samay mujhe kam neend me bhi kaafi energy lagti hai.']},
  {id: 'M3', cat: 'mood_swing', text: ["When I'm high, I make rushed decisions or overspend.", 'Josh ke samay main jaldi me bade faisle ya kharcha kar deta/deti hoon.']},
  {id: 'M4', cat: 'mood_swing', text: ['Others notice my mood changes.', 'Mere mood ka badlaav doosre log bhi notice karte hain.']},
  {id: 'O1', cat: 'overthinking_ocd', text: ['The same thought keeps coming back and bothers me.', 'Ek hi soch baar-baar dimaag me aati hai jo mujhe pareshan karti hai.']},
  {id: 'O2', cat: 'overthinking_ocd', text: ['I check things again and again (lock, gas, switch).', 'Main cheezein baar-baar check karta/karti hoon (tala, gas, switch).']},
  {id: 'O3', cat: 'overthinking_ocd', text: ['I feel very uneasy about cleanliness or order.', 'Safai ya order ko lekar mujhe bahut zyada bechaini hoti hai.']},
  {id: 'O4', cat: 'overthinking_ocd', text: ['These habits take up a lot of my time.', 'Ye aadatein mera kaafi samay le leti hain.']},
  {id: 'P1', cat: 'shak', text: ['I feel people talk about me behind my back.', 'Mujhe lagta hai log meri peeth peeche meri baatein karte hain.']},
  {id: 'P2', cat: 'shak', text: ['I find it very hard to trust others.', 'Main doosron par bharosa karne me kaafi mushkil mehsoos karta/karti hoon.']},
  {id: 'P3', cat: 'shak', text: ['I feel someone wants to harm me.', 'Mujhe lagta hai koi mujhe nuksaan pahunchana chahta hai.']},
  {id: 'F1', cat: 'dar', text: ['I have an intense fear of a specific thing or place.', 'Kisi khaas cheez ya jagah ka mujhe zaroorat se zyada dar lagta hai.']},
  {id: 'F2', cat: 'dar', text: ['I avoid certain places or activities because of that fear.', 'Us dar ki wajah se main kuch jagah ya kaam avoid karta/karti hoon.']},
  {id: 'F3', cat: 'dar', text: ["My heartbeat or sweating increases when I'm afraid.", 'Dar ke samay dil ki dhadkan ya paseena badh jata hai.']},
  {id: 'X1', cat: 'detachment', text: ['At times I feel detached from myself or my surroundings.', 'Kabhi-kabhi lagta hai main apne aap se ya apne aas-paas se alag hoon.']},
  {id: 'X2', cat: 'detachment', text: ["I can't remember some stretches of time.", 'Mujhe kuch samay ki baatein yaad nahi rehti.']},
  {id: 'X3', cat: 'detachment', text: ['Things feel foggy or unreal.', 'Sab kuch dhundhla ya anjaana sa lagta hai.']},
  {id: 'T1', cat: 'purane_dard_ka_asar', text: ['Memories of a painful past event come back suddenly.', 'Kisi purani dukhad ghatna ki yaadein achanak aa jaati hain.']},
  {id: 'T2', cat: 'purane_dard_ka_asar', text: ['I avoid places, people or topics that remind me of it.', 'Un yaadon se bachne ke liye main kuch jagah, log ya baatein avoid karta/karti hoon.']},
  {id: 'T3', cat: 'purane_dard_ka_asar', text: ['I get startled or on edge easily.', 'Mujhe aksar chaunk jaane ya ghabra jaane ki aadat ho gayi hai.']},
  {id: 'T4', cat: 'purane_dard_ka_asar', text: ['This affects my sleep or daily life.', 'Is wajah se meri neend ya rozmarra ki zindagi prabhavit hoti hai.']},
  {id: 'C1', cat: 'child_behaviour', text: ['The child shows a lot of anger or stubbornness.', 'Bachcha bahut zyada gussa ya zidd dikhata hai.']},
  {id: 'C2', cat: 'child_behaviour', text: ['The child is often sad, irritable or withdrawn.', 'Bachcha aksar udaas, chidchida ya akela rehta hai.']},
  {id: 'C3', cat: 'child_behaviour', text: ['The child finds it hard to focus or sit still.', 'Bachche ko dhyan lagane ya ek jagah baithne me mushkil hoti hai.']},
  {id: 'C4', cat: 'child_behaviour', text: ['The child has trouble making friends or going to school.', 'Bachche ke dost banane ya school jaane me dikkat aati hai.']},
  // Flag-only: never scored, never named.
  {id: 'R1', cat: 'R', text: ["I hear or see things others don't.", 'Mujhe aisi awaazein sunayi deti hain ya cheezein dikhti hain jo doosron ko nahi.']},
  {id: 'R2', cat: 'R', text: ['I feel my thoughts or actions are controlled from outside.', 'Mujhe lagta hai meri soch ya harkaton ko koi bahar se control kar raha hai.']},
  {id: 'R3', cat: 'R', text: ["My thoughts feel jumbled and I can't connect them.", 'Mere vichar uljhe hue lagte hain aur main baat ko jod nahi paata/paati.']},
  {id: 'E1', cat: 'E', text: ['I worry a great deal about food or my weight.', 'Main khaane ya apne vajan ko lekar bahut zyada chintit rehta/rehti hoon.']},
  {id: 'E2', cat: 'E', text: ['I eat very little or make myself vomit.', 'Main khaana bahut kam kar deta/deti hoon ya apne aap ko zabardasti ulti karwata/karwati hoon.']},
  {id: 'E3', cat: 'E', text: ['I lose control over eating and feel ashamed afterwards.', 'Khaane par mera control chhoot jata hai aur baad me sharm mehsoos hoti hai.']},
  // Safety.
  {id: 'S1', cat: 'S', text: ['Have you felt like harming yourself or ending your life?', 'Kya aapko aisa laga ki aap khud ko nuksaan pahunchayein ya zindagi khatam kar lein?']},
];

export const SAFETY_TEXT: {title: Pair; body: Pair; emergency: Pair} = {
  title: ['You are not alone.', 'Aap akele nahi hain.'],
  body: [
    'What you shared matters a great deal. Please talk to someone close to you right now, or call Tele-MANAS (India, 24x7, free).',
    'Aapne jo share kiya, wo bahut zaroori hai. Kripya abhi kisi apne se baat karein ya Tele-MANAS (India, 24x7, free) par call karein.',
  ],
  emergency: ['If you are in immediate danger, contact your nearest emergency service.', 'Agar aap turant khatre me hain to apne nazdiki emergency service se sampark karein.'],
};
/** Verify the Tele-MANAS numbers on the official site before release (brief's own note). */
export const HELPLINES: {label: Pair; tel: string}[] = [
  {label: ['Tele-MANAS 14416', 'Tele-MANAS 14416'], tel: '14416'},
  {label: ['Tele-MANAS 1800-891-4416', 'Tele-MANAS 1800-891-4416'], tel: '18008914416'},
  {label: ['Emergency 112', 'Emergency 112'], tel: '112'},
];

/** [English, Hinglish]: Hinglish is Latin script, so it is the Hindi page's text here. */
export const pick = (p: Pair, hi: boolean) => (hi ? p[1] : p[0]);

/** C1–C4 only when the report is about a child (under 18 by date of birth). */
export const questionsFor = (isChild: boolean) => QUESTIONS.filter(q => isChild || q.cat !== 'child_behaviour');

export function isChildOn(dob: string, now = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return false;
  const years = now.getFullYear() - +m[1] - (now.getMonth() + 1 < +m[2] || (now.getMonth() + 1 === +m[2] && now.getDate() < +m[3]) ? 1 : 0);
  return years < 18;
}

export const levelOf = (pct: number): Level => (pct <= 33 ? 'halka' : pct <= 66 ? 'madhyam' : 'zyada');

export type Scores = Partial<Record<Cat, {pct: number; level: Level}>>;
export type Scored = {scores: Scores; flag_only_triggered: boolean; safety_triggered: boolean; complete: boolean};

/** Pure. Flag-only (R/E) and safety (S1) never enter `scores`. */
export function score(answers: Record<string, number | undefined>, isChild: boolean): Scored {
  const qs = questionsFor(isChild);
  const scores: Scores = {};
  for (const cat of CATS) {
    const items = qs.filter(q => q.cat === cat);
    if (!items.length) continue;
    const sum = items.reduce((a, q) => a + (answers[q.id] ?? 0), 0);
    const pct = Math.round((sum / (3 * items.length)) * 100);
    scores[cat] = {pct, level: levelOf(pct)};
  }
  const flag_only_triggered = qs.some(q => (q.cat === 'R' || q.cat === 'E') && (answers[q.id] ?? 0) >= 2);
  const safety_triggered = (answers.S1 ?? 0) >= 1;
  const complete = qs.every(q => typeof answers[q.id] === 'number');
  return {scores, flag_only_triggered, safety_triggered, complete};
}
