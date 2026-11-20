/**
 * Jeevan Ghatna Margdarshan: the 13 life-event topics and their intake questions, as [English, Hinglish]
 * pairs per the brief (never Devanagari on this path). Answers travel to the server as {q, a} text in the
 * chosen language; the kundli rules and scoring live on the server (services/jeevan/signals.ts).
 */

export type Pair = [string, string];
export type Topic = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11' | 'T12' | 'T13';
export type Question = {id: string; text: Pair; options?: Pair[]; optional?: boolean};
export type TopicDef = {id: Topic; name: Pair; sensitive?: boolean; warning?: Pair; questions: Question[]};

export const pick = (p: Pair, hi: boolean) => (hi ? p[1] : p[0]);
const yn: Pair[] = [['Yes', 'Haan'], ['No', 'Nahi']];
const ynp = (third: Pair): Pair[] => [...yn, third];

/** PART A rule 9: a free-text answer with any of these opens the support screen; nothing is sent. */
const DISTRESS = /jeene ka mann nahi|jeena nahi|jina nahi|khud ko nuksaan|khud ko nuksan|aatmahatya|atmahatya|suicid|kill myself|end my life|self[- ]?harm|hurt myself|mar jaa?u|marna chaht/i;
export const hasDistress = (s: string) => DISTRESS.test(s);

/** Common intake (G2, G4, G5). G1 is the birth form, G3 the topic pick. */
export const COMMON: Question[] = [
  {id: 'G2', text: ['Is the birth time exact?', 'Kya janm samay pakka hai?'], options: [['Yes', 'Haan'], ['Approximate', 'Andaaza'], ["Don't know", 'Pata nahi']]},
  {id: 'G4', text: ['How long has this been going on?', 'Ye samasya kitne samay se hai?'], options: [['Under a month', '<1 mahina'], ['1-6 months', '1-6 mahine'], ['6+ months', '6+ mahine'], ['Years', 'Kai saal']]},
  {id: 'G5', text: ['What worries you most right now? (one line)', 'Aap abhi sabse zyada kis baat se pareshan hain? (ek line)'], optional: true},
];

export const TOPICS: TopicDef[] = [
  {
    id: 'T1', name: ['Repeated accidents or injuries', 'Baar-baar accident / chot lagna'],
    questions: [
      {id: 'Q1', text: ['Injuries or accidents in the last 2 years?', 'Pichhle 2 saal me kitni baar chot ya accident hua?'], options: [['0', '0'], ['1', '1'], ['2', '2'], ['3+', '3+']]},
      {id: 'Q2', text: ['Mostly what kind?', 'Zyadatar kis tarah ke?'], options: [['Vehicle', 'Vehicle'], ['Falls', 'Girna'], ['Fire/burns', 'Aag-jalna'], ['Machine', 'Machine'], ['Animal', 'Jaanwar'], ['Other', 'Anya']]},
      {id: 'Q3', text: ['Was work, driving or lack of sleep a factor?', 'Kya kaam, driving ya thakaan/neend ki kami ka asar tha?'], options: ynp(['Sometimes', 'Kabhi-kabhi'])},
      {id: 'Q4', text: ['Do you drive fast or without a helmet/seat belt?', 'Kya aap tez gati se ya bina helmet/seat belt chalate hain?'], options: ynp(['Sometimes', 'Kabhi-kabhi'])},
    ],
  },
  {
    id: 'T2', name: ['Trouble focusing on studies', 'Padhai me man nahi lagna'],
    questions: [
      {id: 'Q1', text: ['Only in studies, or in everything?', 'Man sirf padhai me nahi lagta ya har kaam me?'], options: [['Only studies', 'Sirf padhai'], ['Everything', 'Har kaam']]},
      {id: 'Q2', text: ['Hours of sleep?', 'Neend kitni ghante aati hai?'], options: [['<5', '<5'], ['5-6', '5-6'], ['7-8', '7-8'], ['8+', '8+']]},
      {id: 'Q3', text: ['Daily phone/social media/gaming?', 'Roz phone/social media/gaming kitni der?'], options: [['<1h', '<1h'], ['1-3h', '1-3h'], ['3-5h', '3-5h'], ['5h+', '5h+']]},
      {id: 'Q4', text: ['Sadness, nervousness or tiredness too?', 'Kya udaasi, ghabrahat ya thakaan bhi rehti hai?'], options: [['No', 'Nahi'], ['Sometimes', 'Kabhi-kabhi'], ['Often', 'Aksar']]},
      {id: 'Q5', text: ['Trouble reading, writing or remembering (letters flip, forgetting often)?', 'Kya padhne ya likhne-samajhne me dikkat hoti hai (shabd ulte dikhna, baar-baar bhoolna)?'], options: ynp(['Sometimes', 'Kabhi-kabhi'])},
      {id: 'Q6', text: ['Home environment for study?', 'Ghar ka mahaul padhai ke liye kaisa hai?'], options: [['Quiet', 'Shaant'], ['Some noise', 'Thoda shor'], ['A lot of tension', 'Bahut tanav']]},
    ],
  },
  {
    id: 'T3', name: ['Relationship break-up or separation', 'Relationship toot-na / partner ka chhod jaana'],
    questions: [
      {id: 'Q1', text: ['Current relationship status?', 'Abhi relationship ki sthiti?'], options: [['Together', 'Saath'], ['Distance', 'Dooriyan'], ['Ended', 'Toot gaya'], ['Never started', 'Kabhi shuru nahi hua']]},
      {id: 'Q2', text: ['How long was the relationship?', 'Kitne samay ka rishta tha?'], options: [['<6 months', '<6 mahine'], ['6-24 months', '6-24 mahine'], ['2+ years', '2+ saal']]},
      {id: 'Q3', text: ['What happened?', 'Kya hua?'], options: [['Fights', 'Jhagde'], ["Family didn't agree", 'Ghar wale maane nahi'], ['Distance', 'Doori'], ['Partner left', 'Partner ne chhoda'], ['Felt betrayed', 'Dhoka mehsoos hua']]},
      {id: 'Q4', text: ['What do you want now?', 'Aap ab kya chahte hain?'], options: [['Save it', 'Rishta bachana'], ['Move on', 'Aage badhna'], ['Understand', 'Samajhna']]},
      {id: 'Q5', text: ['Support from family or friends?', 'Kya aapko ghar wale ya dost ka support hai?'], options: [['Yes', 'Haan'], ['Some', 'Thoda'], ['No', 'Nahi']]},
    ],
  },
  {
    id: 'T4', name: ['Pregnancy loss', 'Garbhpat / abortion'], sensitive: true,
    warning: ['This topic can be emotional. Pregnancy loss has many medical causes and is nobody\'s fault. You can stop at any time.', 'Ye vishay bhaavnatmak ho sakta hai. Garbhpat bahut se medical kaarnon se hota hai aur isme kisi ki galti nahi hoti. Aap kabhi bhi rok sakte hain.'],
    questions: [
      {id: 'Q1', text: ['Do you or the family want to know about pregnancy?', 'Kya aap ya parivaar pregnancy ke baare me jaanna chahte hain?'], options: [['Yes', 'Haan'], ['Not now', 'Abhi nahi']], optional: true},
      {id: 'Q2', text: ['Any trouble in a previous pregnancy?', 'Kya pichhli pregnancy me koi dikkat hui thi?'], options: ynp(['Prefer not to say', 'Bataana nahi chahta']), optional: true},
      {id: 'Q3', text: ['Are you in touch with a doctor now?', 'Kya aap abhi doctor ke sampark me hain?'], options: yn, optional: true},
      {id: 'Q4', text: ['Is a pregnancy ongoing now?', 'Abhi pregnancy chal rahi hai?'], options: ynp(['Planning', 'Planning']), optional: true},
    ],
  },
  {
    id: 'T5', name: ['Child delay or difficulty', 'Santan samasya'], sensitive: true,
    questions: [
      {id: 'Q1', text: ['Years since marriage?', 'Vivah ko kitne saal hue?'], options: [['<2', '<2'], ['2-5', '2-5'], ['5+', '5+']]},
      {id: 'Q2', text: ['Medical check-up done for both?', 'Kya dono ki medical jaanch ho chuki hai?'], options: ynp(['Ongoing', 'Chal rahi'])},
      {id: 'Q3', text: ['Children already?', 'Pehle koi santan hai?'], options: [['None', 'Nahi'], ['1', '1'], ['2+', '2+']]},
      {id: 'Q4', text: ["Both partners' birth details available?", 'Dono partner ki janm details mil sakti hain?'], options: [['Yes', 'Haan'], ['Only mine', 'Sirf meri']]},
    ],
  },
  {
    id: 'T6', name: ['Conception timing', 'Garbh dharan ka samay'], sensitive: true,
    questions: [
      {id: 'Q1', text: ['When do you want to grow the family?', 'Aap parivar badhana kab chahte hain?'], options: [['Now', 'Abhi'], ['Within a year', '1 saal me'], ['Later', 'Baad me']]},
      {id: 'Q2', text: ['Is the cycle regular, or has a doctor advised anything?', 'Kya cycle regular hai ya doctor ne koi salah di hai?'], optional: true},
      {id: 'Q3', text: ["Both partners' birth details available?", 'Dono ki janm details?'], options: [['Yes', 'Haan'], ['Only mine', 'Sirf meri']]},
    ],
  },
  {
    id: 'T7', name: ["Child's mind and behaviour", 'Bachche ki mental health / vyavhaar'], sensitive: true,
    warning: ['This is only a tendency. If anything worries you about the child, seeing a child specialist comes first.', 'Ye sirf ek rujhaan hai. Bachche me koi dikkat lage to child specialist se milna sabse pehle zaroori hai.'],
    questions: [
      {id: 'Q1', text: ["Child's age and class?", 'Bachche ki umar aur class?']},
      {id: 'Q2', text: ['What worries you?', 'Kaun si baatein pareshan karti hain?'], options: [['Anger', 'Gussa'], ['Withdrawn', 'Akela rehna'], ['No focus', 'Dhyan na lagna'], ['Fear', 'Dar'], ['Sleep', 'Neend'], ['Stubborn', 'Zid'], ['Refuses school', 'School jaane se mana']]},
      {id: 'Q3', text: ['Since when?', 'Ye kab se hai?'], options: [['<1 month', '<1 mahina'], ['1-6 months', '1-6 mahine'], ['6+ months', '6+ mahine']]},
      {id: 'Q4', text: ['Any complaint from school or teacher?', 'School ya teacher ne koi shikayat ki?'], options: yn},
      {id: 'Q5', text: ['Any big change at home? (new school, move, fights, loss)', 'Ghar me koi bada badlaav hua? (naya school, shift, jhagde, nuksaan)'], optional: true},
      {id: 'Q6', text: ['Seen a doctor or counsellor?', 'Kya kisi doctor/counsellor ko dikhaya?'], options: yn},
    ],
  },
  {
    id: 'T8', name: ['Lent money not coming back', 'Udhaar diya hua paisa wapas nahi mil raha'],
    questions: [
      {id: 'Q1', text: ['How much?', 'Kitna paisa?'], options: [['<10k', '<10k'], ['10k-1L', '10k-1L'], ['1L-10L', '1L-10L'], ['10L+', '10L+']]},
      {id: 'Q2', text: ['Who took it?', 'Kisne liya?'], options: [['Family', 'Parivaar'], ['Friend', 'Dost'], ['Business', 'Business'], ['Stranger', 'Anjaan']]},
      {id: 'Q3', text: ['When?', 'Kab diya?'], options: [['<6 months', '<6 mahine'], ['6-24 months', '6-24 mahine'], ['2+ years', '2+ saal']]},
      {id: 'Q4', text: ['Written proof?', 'Likhit proof hai?'], options: [['Agreement', 'Agreement'], ['Bank transfer', 'Bank transfer'], ['Messages', 'Message'], ['Nothing', 'Kuch nahi']]},
      {id: 'Q5', text: ['Do they talk, or avoid you?', 'Kya wo baat karta hai ya bach raha hai?'], options: [['Talks', 'Baat karta hai'], ['Avoids', 'Bach raha hai']]},
      {id: 'Q6', text: ['Sent a notice or taken advice?', 'Kya aapne notice ya kisi se salah li?'], options: yn},
    ],
  },
  {
    id: 'T9', name: ['When will sunk money return', 'Doobe hue paise kab milenge'],
    questions: [
      {id: 'Q1', text: ['How was it lost?', 'Paisa kaise doba?'], options: [['Loan', 'Udhaar'], ['Chit fund', 'Chit fund'], ['Investment', 'Investment'], ['Business', 'Business'], ['Property', 'Property'], ['Online fraud', 'Online fraud']]},
      {id: 'Q2', text: ['How much?', 'Kitna?'], options: [['<10k', '<10k'], ['10k-1L', '10k-1L'], ['1L-10L', '1L-10L'], ['10L+', '10L+']]},
      {id: 'Q3', text: ['When?', 'Kab doba?'], options: [['<6 months', '<6 mahine'], ['6-24 months', '6-24 mahine'], ['2+ years', '2+ saal']]},
      {id: 'Q4', text: ['FIR, court case or complaint filed?', 'Kya FIR, court ya shikayat darj hai?'], options: yn},
      {id: 'Q5', text: ['Is anyone claiming to "recover" it and asking for money?', 'Kya koi agent "paisa dilwane" ka daava kar raha hai aur paise maang raha hai?'], options: yn},
    ],
  },
  {
    id: 'T10', name: ['Trouble in a partnership', 'Partnership me dhokha'],
    questions: [
      {id: 'Q1', text: ['Kind of partnership?', 'Kis tarah ki partnership?'], options: [['Business', 'Business'], ['Property', 'Jaiyadad'], ['Work with a friend', 'Dost ke saath kaam']]},
      {id: 'Q2', text: ['Written agreement?', 'Kya likhit agreement hai?'], options: yn},
      {id: 'Q3', text: ['Money involved?', 'Kitna paisa shaamil hai?'], options: [['<1L', '<1L'], ['1L-10L', '1L-10L'], ['10L+', '10L+']]},
      {id: 'Q4', text: ['What are you facing?', 'Aap kya mehsoos kar rahe hain?'], options: [['No accounts shown', 'Hisaab nahi dikhata'], ['Money withdrawn', 'Paise nikale'], ['Fights', 'Jhagda'], ['Work harmed', 'Kaam kharab kiya']]},
      {id: 'Q5', text: ['Talked to a CA or lawyer?', 'Kya aapne CA ya vakil se baat ki?'], options: yn},
    ],
  },
  {
    id: 'T11', name: ['Moving house', 'Ghar badalna / shift hona'],
    questions: [
      {id: 'Q1', text: ['Renting or own home?', 'Abhi kiraye par hain ya apne ghar me?'], options: [['Rent', 'Kiraya'], ['Own', 'Apna ghar']]},
      {id: 'Q2', text: ['Moves in the last 5 years?', 'Pichhle 5 saal me kitni baar shift hue?'], options: [['0', '0'], ['1', '1'], ['2-3', '2-3'], ['4+', '4+']]},
      {id: 'Q3', text: ['Reason for moving?', 'Shift karne ka karan?'], options: [['Job', 'Naukri'], ['Family', 'Parivaar'], ['Rent', 'Kiraya'], ['Preference', 'Pasand'], ['Compulsion', 'Majboori']]},
      {id: 'Q4', text: ['Is a move planned?', 'Kya koi shift ki yojna chal rahi hai?'], options: yn},
      {id: 'Q5', text: ['Want to change city/state/country?', 'Kya aap sheher/state/desh badalna chahte hain?'], options: [['City', 'Sheher'], ['State', 'State'], ['Country', 'Desh'], ['No', 'Nahi']]},
    ],
  },
  {
    id: 'T12', name: ['When will I have my own house', 'Apna ghar kab banega'],
    questions: [
      {id: 'Q1', text: ['Do you have land or a plot?', 'Kya zameen ya plot hai?'], options: ynp(["Family's", 'Parivaar ki'])},
      {id: 'Q2', text: ['Plan to build or buy within?', 'Kitne samay me ghar banane ya kharidne ka plan?'], options: [['1 year', '1 saal'], ['3-5 years', '3-5 saal'], ["Don't know", 'Pata nahi']]},
      {id: 'Q3', text: ['Budget estimate?', 'Budget ka andaaza?'], options: [['Low', 'Kam'], ['Medium', 'Madhyam'], ['High', 'Zyada']]},
      {id: 'Q4', text: ['Eligible for a loan?', 'Loan ke liye eligible hain?'], options: [['Yes', 'Haan'], ["Don't know", 'Pata nahi']]},
      {id: 'Q5', text: ['Shared family home?', 'Kya parivaar ke saath saajha ghar hai?'], options: yn},
    ],
  },
  {
    id: 'T13', name: ['Rats or termites at home', 'Ghar me chuhe / deemak'],
    questions: [
      {id: 'Q1', text: ['Rats or termites?', 'Chuhe ya deemak, kaun sa?'], options: [['Rats', 'Chuhe'], ['Termites', 'Deemak'], ['Both', 'Dono']]},
      {id: 'Q2', text: ['Where mostly?', 'Kahan zyada?'], options: [['Kitchen', 'Rasoi'], ['Bedroom', 'Bedroom'], ['Study room', 'Padhai ka kamra'], ['Puja room', 'Pooja ghar'], ['Wooden furniture', 'Lakdi ka furniture'], ['Roof', 'Chhat']]},
      {id: 'Q3', text: ['Since when?', 'Kab se?'], options: [['<1 month', '<1 mahina'], ['1-6 months', '1-6 mahine'], ['6+ months', '6+ mahine']]},
      {id: 'Q4', text: ['Pest control done?', 'Kya pest control karwaya?'], options: yn},
      {id: 'Q5', text: ['Rented or own?', 'Ghar kiraye ka hai ya apna?'], options: [['Rent', 'Kiraya'], ['Own', 'Apna']]},
      {id: 'Q6', text: ['Water seepage or damp?', 'Kya paani rissne ya seelan ki dikkat hai?'], options: yn},
    ],
  },
];

export const topicById = (id: Topic) => TOPICS.find(t => t.id === id)!;
export const SENSITIVE_WARNING: Pair = ['This topic can be emotional. You can stop at any time.', 'Ye sawaal bhaavnatmak ho sakte hain. Aap kabhi bhi rok sakte hain.'];

export type QA = {q: string; a: string};
/** Answers keyed by question id (common + topic) -> the {q, a} pairs the server receives, in the report language. */
export function toQA(topic: TopicDef, answers: Record<string, string | undefined>, lang: 'hinglish' | 'english'): QA[] {
  const i = lang === 'hinglish' ? 1 : 0;
  const text = (q: Question, v: string) => q.options?.find(o => o[0] === v || o[1] === v)?.[i] ?? v;
  return [...COMMON, ...topic.questions].flatMap(q => {
    const v = answers[q.id]?.trim();
    return v ? [{q: q.text[i], a: text(q, v)}] : [];
  });
}
