/**
 * MahaVastu analyser engine, ported from the AstroShrine-MahaVastu-Tool page (the former WebView tool):
 * the 9×9 Vastu Purusha Mandala over the 16-zone chakra, room / equipment ratings, the 45-devta score
 * out of 225 with its grade cap, and the plan drawing as one SVG string (screen and print).
 * Pure: no React Native imports. Text is in the app language at call time (bi), like the page's t(en, hi).
 * The Hindi data (devtas, zones, use, codes, logo) is shared with the Vastu Chakra report (reportContent).
 */
import { lightColors, colors } from './theme';
import { bi, isHi, type Bi } from './bi';
import {ZONE_IDS, type ZoneId} from '../engine';
import {BRAND, CODES as CODES_HI, MV, ZONE_DEV, type Devta} from './mvData';

export {ZONE_DEV};
export type Zk = ZoneId | 'C';
/** g auspicious, o moderate, b dosha, x severe dosha. */
export type Rate = 'g' | 'o' | 'b' | 'x';
export type Cut = 'none' | 'cut' | 'ext';
export type Placed = {uid: string; t: string; x: number; y: number};
export type Consultant = {name: string; title: string; org: string; contact: string};
export type Project = {
  id: string;
  name: string;
  client: string;
  addr: string;
  /** 'YYYY-MM-DD' */
  date: string;
  use: string;
  type: 'res' | 'ind';
  /** Stored in Hindi like the page ('फीट' | 'मीटर'); unitL() shows it. */
  unit: string;
  /** Plot width (left → right on the plan) and depth (top → bottom), in `unit`. */
  W: number;
  D: number;
  /** Compass degree at the top of the plan. */
  up: number;
  /** Plan photo as a data URL. */
  img: string | null;
  imgOp: number;
  items: Placed[];
  cuts: Record<ZoneId, Cut>;
  slope: ZoneId | '';
  veedh: ZoneId | '';
  brahma: boolean;
  neHeavy: boolean;
  fireWater: boolean;
  notes: string;
  /** Manual devta score overrides (0–5 in steps of 0.5). */
  ov: Record<number, number | null>;
  consultant: Consultant;
  /** The chat-pane client this project was started for (reopened in that client's pane). */
  paneId?: string;
  updated?: number;
};
export type Item = {id: string; l: Bi; ab: Bi; sc: 'both' | 'res' | 'ind'; cat: string; g: string[]; b: string[]; x: string[]};
export type Issue = {pri: number; sev: Rate; title: string; zone: string; devs: number[]; detail: string; shift: string; upay: string};
export type Good = {t: string; d: string};
export type Grade = {label: string; note: string; color: string};
export type Analysis = {sc: Record<number, number>; total: number; grade: Grade; issues: Issue[]; goods: Good[]};

export const Z = ZONE_IDS;
const sp = (s: string) => (s ? s.split(' ') : []);
const IT = (id: string, l: Bi, ab: Bi, sc: Item['sc'], cat: string, g: string, b: string, x: string): Item => ({id, l, ab, sc, cat, g: sp(g), b: sp(b), x: sp(x)});

// prettier-ignore
const DEV_EN: string[][] = [
  ['Shikhi / Isha', 'Paishach • NE', 'Imagination, the third eye, seed ideas', 'NE cut, toilet, heavy storage', 'Best for puja/meditation; toilet/kitchen = mental unrest, fire risk', 'R&D room is fine; a boiler/toilet here = blocked ideas, accident risk', 'DSM heavy items; WTR+CRS amethyst; YST Shri/Vastu; PLT tulsi outside; PYR crystal'],
  ['Parjanya', 'Paishach • NE', 'Rain, fertility, wishes fulfilled', 'An entrance here is inauspicious; a dry corner', 'Children/growth; the dosha brings expenses and strain on the women of the house', 'Raw material grows; the dosha dries up orders', 'WTR daily; PLT; YST; do not dry salt here'],
  ['Jayant', 'Paishach • E/ENE', 'Victory, resourcefulness, reaching goals', 'ESE/ENE toilet, weapons stored', 'Success, enthusiasm; toilet = children turn quiet/shy', 'Marketing wins; black colour = harsh speech', 'PLT; CLR orange-green; DSM weapons; FAC face east'],
  ['Mahendra / Indra', 'Paishach • E', 'Administration, honour, high-level contacts', 'Small entrance, black wall', 'Fame, leadership; toilet = no recognition', 'Power for the CEO room/reception; black = Saturn’s weight', 'YST Ganesha at the entrance; CLR saffron/orange; NAM; PYR copper'],
  ['Surya', 'Paishach • E', 'Vitality, control, radiance', 'Blocked east windows', 'Health, male vigour; weak = lethargy', 'Power room, brand shine; too much kitchen = aggression', 'Morning light; copper Sun disc; CLR orange; RTN ruby, with care'],
  ['Satya', 'Paishach • E', 'Reputation, keeping one’s word, marital duty', 'Mirror, too much blue on the walls', 'Trust; mirror dosha = relationships break', 'Honest contracts; too much blue = broken promises', 'DSM the facing mirror; CLR cream; YST Satya/Vastu'],
  ['Bhrisha', 'Paishach • ESE', 'Energy from friction, sparking hard work', 'Blue colour, dust, sewer', 'Drive to act; dosha = anxiety, indecision', 'Grinding/machines are fine; sewage = BP/anxiety', 'SHF mixer/industrial equipment here; CLR warm; DSM garbage; Kamdhenu symbol'],
  ['Akash / Antariksh', 'Paishach • SE', 'Room to expand, where events happen', 'SE cut, water and toilet mixed', 'Recognition; entrance dosha = money leaks, fear of theft', 'Brand visibility; cut = the eldest son moves away', 'YST Shri; PYR copper; CLR red accents; keep it open'],
  ['Anil', 'Paishach • SE', 'Carries air to the fire, uplift', 'Closed SE, yellow clutter', 'Work gets started; bedroom = restlessness for the women', 'Boiler draught; too much yellow = cash crunch', 'Airflow; PYR; SHF fire equipment to SE'],
  ['Pusha', 'Paishach • SE', 'Nourishment, fuel, protection', 'Payments stuck, an entrance that invites enemies', 'Grain, oil and ghee are auspicious here', 'Fuel/packaging/raw feed for the fire', 'Ghee/grain in SE; YST Agni; CLR orange'],
  ['Vitatha', 'Paishach • S', 'Illusion, show, the unreal', 'Fake decor, a maze of mirrors', 'An entrance here shows prosperity but breeds distrust', 'Marketing hype; dosha = fear/depression', 'DSM showy items; honest pictures; proper earth weight in the south'],
  ['Grihakshat', 'Paishach • S', 'The home’s boundary, protecting the structure', 'South entrance with a heavy vedha', 'Children/boundaries; dosha = a sense of the home breaking up', 'Boundary wall, security room', 'STR at the threshold; heavy south wall; PYR'],
  ['Yama', 'Paishach • S', 'Rules, time, discipline', 'South main entrance with no remedy', 'Entrance dosha = debt, losses', 'QC, discipline, legal; too much = harshness', 'NAM+YST; CLR muted terracotta; FAC sleep with the head to the south'],
  ['Gandharva', 'Paishach • S', 'Art, joy, guarding the nectar', 'Ugly storage in the middle of the south', 'Music/beauty; entrance = feeling insulted', 'Design studio; dosha = the joy dries up', 'Art/music here; DSM ugliness; CLR warm and soft'],
  ['Bhringraj', 'Paishach • SSW', 'Cutting away the unneeded, refining talent', 'Safe/owner’s room in SSW', 'Effort goes to waste; health/digestion', 'Waste zone; the reject yard belongs here', 'Keep garbage/expenses confined here; DSM piled-up expenses; earth colours'],
  ['Mriga', 'Paishach • SW', 'Curiosity, practising skills', 'SW cut / entrance / toilet', 'Entrance = distance from family, loss of money', 'Skill centre; dosha = a cycle of poverty', 'Heavy furniture; PYR copper/lead; owner sleeps in SW; RTN emerald, with care'],
  ['Pitri', 'Paishach • SW', 'Lineage, ancestors’ protection', 'SW toilet/kitchen', 'Pitri dosha = obstacles for the family line', 'Legacy brand, old plant know-how', 'Keep the spot for ancestral tarpan clean; earth weight; DSM impure items'],
  ['Dauvarik', 'Paishach • SW', 'Gatekeeper, guardian of knowledge', 'Open, weak SW', 'Security, a guru’s knowledge', 'Gate house, security room at the SW–west junction', 'Heavy cupboard; lion/Nandi symbol, kept modest; STR'],
  ['Sugriva', 'Paishach • W', 'Receiving, gains from learning', 'Depressing black colour in WNW', 'Studies/savings; dosha = learning does not stick', 'Accounts receivable, training', 'White-silver; books in WSW; YST'],
  ['Pushpadant', 'Paishach • W', 'Blessings, beauty, gains for the family', 'Water leak in the west', 'Happy events; dosha = gains stop', 'Finished goods dispatch', 'Beautiful but not heavy; balance Varun; WTR in the west, kept limited'],
  ['Varun', 'Paishach • W', 'Water and justice, depth, control', 'Leaking tank in the west', 'Fortune’s water; too much water = drowning', 'Exports, depth in contracts', 'Controlled water; YST Varun/Vastu; white metal'],
  ['Asura', 'Paishach • W', 'Inner strength, seeing through illusion', 'Darkness, disorder', 'Dosha = misfortune, delusion', 'Competitive strength; too much = unethical pressure', 'Light; DSM demon pictures; balance it from the Mitra area'],
  ['Shosha', 'Paishach • WNW', 'Absorbing, drawing out toxins', 'Bedroom in WNW', 'Feelings dry up; the zone of depression', 'Drainage, dryer, exhaust belong here', 'SHF move the bedroom; air; SND; salt for a limited time'],
  ['Papayakshma', 'Paishach • NW', 'Shedding the load of karma', 'Puja/kitchen in NW', 'Inauspicious shadow, seeds of disease', 'Quarantine, scrap isolation', 'SLT+DSM; keep the air open; PYR; a toilet in NW is relatively tolerable'],
  ['Roga', 'Paishach • NW', 'The tug of war between illness and immunity', 'Heavy darkness in NW', 'Entrance = physical illness', 'Dispensary/PPE store, with care', 'Light + air; SLT for 7 days; CRS; a medical room in NW is fine if kept clean'],
  ['Naga', 'Paishach • NW–N', 'Hidden desires, serpent energy', 'Too many serpent images, a dark pit', 'Desire/sensitivity; dosha = secret addictions', 'Networking, underground utilities', 'Modest symbols; air; DSM frightening pictures'],
  ['Mukhya', 'Paishach • N', 'Getting things done, the gateway for money', 'Toilet/kitchen/fire in the north', 'Career flow; blocked = missed opportunities', 'Sales gate, cash coming in', 'WTR + citrine; YST Kuber; CLR blue-green; safe facing north, in the west'],
  ['Bhallat', 'Paishach • N', 'Growing abundance, money through agreements', 'Fire/furnace in the north', 'Gains from partnerships', 'Joint ventures, distribution', 'YST Kuber; white metal; DSM fire out of the north'],
  ['Soma', 'Paishach • N', 'Nourishing wealth, gentle income', 'Toilet in the north', 'Steady income, harmony', 'Regular orders, retainers', 'WTR; soft, moon-like colours; PLT'],
  ['Bhujag / Sarpa / Charak', 'Paishach • N', 'Protection, guarding Kundalini and wealth', 'Naga dosha + a cut north', 'Protects property; dosha = hidden leaks', 'Locker security, cables/pipes', 'PYR; locker at the north–SW wall junction, with care; CRS'],
  ['Aditi', 'Paishach • NNE/NE', 'Mother of the gods, a protective shield', 'A heavy stone temple here', 'Safety of women, shelter', 'Employee welfare, insurance', 'Keep NE light; Ardhanarishvara picture, kept modest; clean water'],
  ['Diti', 'Paishach • NE', 'Filtering, subtle vision, the energy of the Daityas’ mother', 'Darkness in NE', 'Wider perception; dosha = filtering the wrong things', 'Quality filters, lab insight', 'Maximum light; DSM heavy items; link it with the Aap area'],
  ['Aap / Apah', 'Manushya • inner NE', 'Water element, healing, peace', 'A toilet on Aap = health and money leak away', 'Clarity of mind, immunity', 'Water treatment, cooling tower in NE', 'WTR clean; COP water; CRS; a toilet here must get DSM/STR'],
  ['Aapvatsa', 'Manushya • inner NE', 'Carrying plans through to results, bearer of medicine', 'NE kitchen — fire and water at war', 'Treatments reach completion', 'Project closure, pharma packing', 'Remove the fire, or bound it with PYR + Agni yantra; keep water separate'],
  ['Savita', 'Manushya • inner SE', 'The spark to begin, inspiration', 'A toilet on Savita = ventures never catch fire', 'Work gets started', 'Ignition, furnace start', 'YST Agni; red pyramid; cook facing east'],
  ['Savitr / Savitri', 'Manushya • inner SE', 'Continuity, keeping up momentum', 'Too much water in SE', 'Momentum holds; entrance dosha = wrong decisions', 'Continuous process line', 'Keep fire and water apart; CLR saffron; process facing east'],
  ['Indra (inner) / Vibudhadhip', 'Manushya • SW', 'Inner authority, business growth', 'SW toilet = loss of authority', 'Stable authority', 'Plant head’s cabin in SW, facing north/east', 'Heavy cabin; PYR; lion symbol, kept modest; FAC face north'],
  ['Indrajaya / Jaya', 'Manushya • SW', 'The road to victory, a proven path', 'SW cut = the road is blocked', 'Goals achieved', 'Winning dispatches, market share', 'STR on the cut corner; complete the earth weight'],
  ['Rudra', 'Manushya • NW', 'Flow, change, breaking obstacles', 'NW kitchen — too much fire + air', 'Movement; entrance = illness spreads', 'Logistics, shift change', 'Keep the air, limit the fire; YST Rudra/Vastu'],
  ['Rajayakshma / Rudrajaya', 'Manushya • NW', 'A steady mind, keeping within limits', 'Dark NW bedroom', 'Emotional control; dosha = a wasting, TB-like tendency', 'HR/shift control', 'Light; SND; DSM; air'],
  ['Aryama', 'Deva veethi • inner east', 'Connecting; marriage, society, growth', 'East toilet = relationships break', 'Relationships, social rise', 'Vendor–client ties, CSR', 'CLR light green-yellow; open east; YST'],
  ['Vivaswan', 'Deva veethi • inner south', 'Transformation, the light of governance', 'Too much water in the south', 'Disciplined radiance', 'Governance, board, audit', 'Earth colours; balance Yama and Vivaswan; heavy south'],
  ['Mitra', 'Deva veethi • inner west', 'Support, enthusiasm, a bridge', 'West cut = gains never arrive', 'Help from friends reaches home', 'Partner gains, collections', 'Bridge picture; white metal; gains room in the west'],
  ['Prithvidhar / Bhudhar', 'Deva veethi • inner north', 'Manifesting, holding, foundation', 'North cut / wrongly placed borewell', 'Wishes come true; dosha = plans left hanging', 'Foundation, civil work, grounding the inventory', 'Still water, placed correctly in NE; open north; Kuber + Bhudhar yantra'],
  ['Brahma', 'Brahma veethi • central 9 padas', 'Creation, harmony, the navel of prana', 'Pillar, stairs, tank, heavy puja room, toilet', 'Open centre = peace and clarity; load = illness, discord, stuck decisions', 'Atrium/light well; a machine/toilet/store in the centre = an unstable plant', 'DSM the load; empty + clean; CRS clear quartz / 9-pyramid grid; light; never a toilet', 'Brahmasthan'],
];
// prettier-ignore
const USE_EN: string[][] = [
  ['NE (Ishan) / Aap–Shikhi', 'Puja, water, meditation, open space', 'Raw water inlet, lab/quality, R&D ideas room — no fire or toilet'],
  ['East / Aryama–Surya', 'Entrance, living room, exercise', 'Reception, brand wall, morning-shift gate'],
  ['SE (Agneya) / Savita–Pusha', 'Kitchen, electricals, generator', 'Boiler, furnace, panel, kitchen, hot processes'],
  ['South / Yama–Vivaswan', 'Light storage, rest', 'QC, limited finished stock, rest room'],
  ['SW (Nairitya) / Pitri–Indra', 'Master bedroom, safe, weight', 'Owner/plant head cabin, heavy machine foundations, die store'],
  ['West / Varun–Mitra', 'Dining, gains room; a toilet is acceptable', 'Dispatch, accounts, packing, profit centre'],
  ['NW (Vayavya) / Rudra–Roga', 'Guests; the best option for a toilet', 'Gate, logistics, banking wing, air handling'],
  ['North / Mukhya–Soma–Kuber', 'Safe, living room, water', 'Sales, cash, cool store, opportunities desk — no fire'],
  ['Brahmasthan', 'Open, full of light', 'Atrium / crane bay with an empty centre; no machines'],
];
// prettier-ignore
const ZH: Record<Zk, Bi> = {
  N: ['North', 'उत्तर'],
  NNE: ['North of North-East', 'उत्तर-ईशान'],
  NE: ['North-East', 'ईशान'],
  ENE: ['East of North-East', 'पूर्व-ईशान'],
  E: ['East', 'पूर्व'],
  ESE: ['East of South-East', 'पूर्व-आग्नेय'],
  SE: ['South-East', 'आग्नेय'],
  SSE: ['South of South-East', 'दक्षिण-आग्नेय'],
  S: ['South', 'दक्षिण'],
  SSW: ['South of South-West', 'दक्षिण-नैऋत्य'],
  SW: ['South-West', 'नैऋत्य'],
  WSW: ['West of South-West', 'पश्चिम-नैऋत्य'],
  W: ['West', 'पश्चिम'],
  WNW: ['West of North-West', 'पश्चिम-वायव्य'],
  NW: ['North-West', 'वायव्य'],
  NNW: ['North of North-West', 'उत्तर-वायव्य'],
  C: ['Brahmasthan', 'ब्रह्मस्थान'],
};
// prettier-ignore
const ZAREA_EN: Record<ZoneId, string> = {
  N: 'Money opportunities, cash flow',
  NNE: 'Health, immunity',
  NE: 'Ideas, knowledge, water, puja',
  ENE: 'Recreation, light creativity',
  E: 'Social ties, health, leadership',
  ESE: 'Anxiety/churning, energy for work',
  SE: 'Cash, kitchen, electricity',
  SSE: 'Strength, confidence',
  S: 'Rest, fame, discipline',
  SSW: 'Expenses, decay, waste',
  SW: 'Relationships, skills, owner’s room',
  WSW: 'Education, savings',
  W: 'Gains, results',
  WNW: 'Depression, low mood',
  NW: 'Support, banking, movement',
  NNW: 'Attraction, sensitivity',
};
// prettier-ignore
export const ITEMS: Item[] = [
  IT('door', ['Main entrance / gate', 'मुख्य द्वार / गेट'], ['Dr', 'द्वा'], 'both', 'door', '', '', ''),
  IT('toilet', ['Toilet', 'शौचालय'], ['T', 'शौ'], 'both', 'wet', 'ESE SSW WNW', 'N ENE E SE SSE NNW', 'NNE NE SW C'),
  IT('kitchen', ['Kitchen / canteen', 'रसोई / कैंटीन'], ['K', 'र'], 'both', 'fire', 'SE SSE', 'ENE SSW SW WSW WNW NNW', 'N NNE NE C'),
  IT('puja', ['Puja room', 'पूजा स्थान'], ['P', 'पू'], 'both', 'puja', 'NNE NE E', 'ESE SE SSE S SW WSW WNW', 'SSW'),
  IT('stairs', ['Staircase', 'सीढ़ी'], ['St', 'सी'], 'both', 'heavy', 'S SSW SW WSW W', 'N ENE E NNW', 'NNE NE C'),
  IT('ohtank', ['Overhead tank', 'ओवरहेड टंकी'], ['OT', 'टं'], 'both', 'heavy', 'S SSW SW WSW W', 'N ENE E ESE SE NNW', 'NNE NE C'),
  IT('ugwater', ['Underground tank / borewell', 'भूमिगत टंकी / बोरवेल'], ['UG', 'बो'], 'both', 'water', 'N NNE NE', 'ESE WSW W WNW NW', 'SE SSE S SSW SW C'),
  IT('septic', ['Septic tank', 'सेप्टिक टैंक'], ['Sp', 'से'], 'both', 'wet', 'WNW', 'N ENE E SE SSE S WSW NNW', 'NNE NE SW C'),
  IT('safe', ['Safe / cash', 'तिजोरी / कैश'], ['Sf', 'ति'], 'both', 'wealth', 'N SW', 'NNE NE ENE ESE SE SSE WNW C', 'SSW'),
  IT('dustbin', ['Dustbin', 'कूड़ादान'], ['Db', 'कू'], 'both', 'wet', 'ESE SSW WNW', 'N ENE E SE SSE SW NNW', 'NNE NE C'),
  IT('pillar', ['Heavy pillar / beam', 'भारी स्तम्भ / बीम'], ['Pl', 'स्त'], 'both', 'heavy', 'SW S W', 'NNE NE', 'C'),
  IT('masterbed', ['Master bedroom', 'मास्टर बेडरूम'], ['MB', 'मा'], 'res', 'room', 'SW S', 'NNE ESE SE SSW WNW C', 'NE'),
  IT('child', ['Children’s room', 'बच्चों का कक्ष'], ['Ch', 'ब'], 'res', 'room', 'W WSW', 'NE ESE SE SSW WNW C', ''),
  IT('living', ['Living room', 'बैठक / लिविंग'], ['L', 'बै'], 'res', 'room', 'N NE ENE E NW', 'ESE SSW WNW', ''),
  IT('guest', ['Guest room', 'अतिथि कक्ष'], ['G', 'अ'], 'res', 'room', 'NW NNW W', 'NE ESE SE SSW SW C', ''),
  IT('dining', ['Dining room', 'भोजन कक्ष'], ['Dn', 'भो'], 'res', 'room', 'E W', 'NE SSW WNW', ''),
  IT('store', ['Store room', 'भण्डार'], ['S', 'भं'], 'res', 'heavy', 'S SSW SW WSW', 'N ENE E C', 'NNE NE'),
  IT('electrical', ['Meter / inverter', 'मीटर / इन्वर्टर'], ['El', 'वि'], 'res', 'fire', 'SE SSE', 'ENE SSW SW WSW W WNW NNW C', 'N NNE NE'),
  IT('boiler', ['Boiler / furnace', 'बॉयलर / फर्नेस'], ['B', 'बॉ'], 'ind', 'fire', 'SE SSE', 'ENE E SSW SW WSW W WNW NNW', 'N NNE NE C'),
  IT('machine', ['Heavy machine', 'भारी मशीन'], ['M', 'म'], 'ind', 'heavy', 'S SSW SW WSW W', 'N ENE E NNW', 'NNE NE C'),
  IT('panel', ['Panel / transformer', 'पैनल / ट्रांसफॉर्मर'], ['Pn', 'पै'], 'ind', 'fire', 'SE SSE', 'ENE SSW SW WSW W WNW NNW', 'N NNE NE C'),
  IT('generator', ['Generator', 'जनरेटर'], ['Gn', 'ज'], 'ind', 'fire', 'SE SSE', 'ENE SSW SW WSW W WNW NNW', 'N NNE NE C'),
  IT('rawstore', ['Raw material store', 'कच्चा माल भण्डार'], ['RM', 'क'], 'ind', 'heavy', 'S SSW SW WSW', 'N ENE E NNW', 'NNE NE C'),
  IT('dispatch', ['Finished goods / dispatch', 'तैयार माल / डिस्पैच'], ['Ds', 'डि'], 'ind', 'room', 'NW WNW W', 'NE NNE SSW SW', 'C'),
  IT('owner', ['Owner / plant head cabin', 'मालिक / प्लांट हेड केबिन'], ['O', 'मा'], 'ind', 'room', 'SW', 'NNE NE ESE SE WNW', 'SSW C'),
  IT('accounts', ['Accounts / cash', 'अकाउंट्स / कैश'], ['A', 'अ'], 'ind', 'wealth', 'N W', 'NNE ESE SE SSE WNW', 'SSW C'),
  IT('sales', ['Sales / marketing', 'सेल्स / मार्केटिंग'], ['Sl', 'बि'], 'ind', 'room', 'N NNW E ENE', 'SSW SW ESE WNW C', ''),
  IT('rnd', ['R&D / lab', 'R&D / लैब'], ['R', 'R'], 'ind', 'room', 'NE NNE ENE', 'SE SSE SW WNW C', 'SSW'),
  IT('qc', ['QC room', 'QC कक्ष'], ['Q', 'Q'], 'ind', 'room', 'S', 'NE NNE SSW C', ''),
  IT('etp', ['ETP / waste yard', 'ETP / वेस्ट यार्ड'], ['E', 'E'], 'ind', 'wet', 'SSW WNW', 'ENE E SE SSE SW NNW', 'N NNE NE C'),
  IT('rest', ['Workers’ rest room', 'श्रमिक विश्राम'], ['Wr', 'श्र'], 'ind', 'room', 'S NW', 'NE SSW C', ''),
  IT('parking', ['Parking / logistics', 'पार्किंग / लॉजिस्टिक्स'], ['Pk', 'पा'], 'ind', 'room', 'NW WNW', 'NE NNE SSW SW C', ''),
];
// prettier-ignore
const CODES_EN = ['Shift furniture/activity', 'Correct the facing (sleeping/working/cooking)', 'Colour therapy', 'Dismantle / remove (broken idol, dead plant, stopped clock, wrong form of a deity)', 'Install a yantra (Vastu / Shri / Kuber / Ganesha / Agni / Mangal)', 'Pyramid (copper/crystal/brass/lead)', 'Copper pyramid strip / metal strip', 'Place gemstones (by direction and planet)', 'Crystals (quartz, citrine, amethyst, rose quartz)', 'Salt bowl', 'Water pot (kalash) / fountain / aquarium', 'Tulsi / money plant', 'Nameplate + swastik/Om/Ganesha', 'Cleansing with bell/conch/incense', 'Copper water / copper plate'];

export const ITEM: Record<string, Item> = Object.fromEntries(ITEMS.map(i => [i.id, i]));
export const itemL = (i: Item) => bi(i.l);
export const itemAb = (i: Item) => bi(i.ab);

/** English for MV.devtas, row by row: [name, veethi, karya, dosha, res, ind, upay, zone (only where it is not already Latin)]. */
const DEV_KEYS = ['name', 'veethi', 'karya', 'dosha', 'res', 'ind', 'upay', 'zone'] as const;
const DEVTAS_EN: Devta[] = MV.devtas.map((d, i) => ({...d, ...Object.fromEntries(DEV_EN[i].map((v, j) => [DEV_KEYS[j], v]))}));
/** The 45 devtas (ids 1..45 in order) in the app language. */
export const devtas = () => (isHi() ? MV.devtas : DEVTAS_EN);
export const dev = (id: number) => devtas()[id - 1];
export const short = (id: number) => dev(id).name.split(' /')[0].split(' (')[0];
export const zh = (z: string) => bi(ZH[z as Zk]);
const ZAREA_HI: Record<string, string> = Object.fromEntries(MV.zones.map(r => [r[0].split(' ')[0], r[4]]));
export const zoneArea = (z: string) => (isHi() ? ZAREA_HI[z] : ZAREA_EN[z as ZoneId]) ?? '';
/** Zone-use rules: [zone / presiding devtas, residential use, industrial use]. */
export const zoneUse = (): string[][] => (isHi() ? MV.use : USE_EN);
/** Remedy codes with their meaning. */
export const codes = (): Bi[] => CODES_HI.map(([c, hi], i) => [c, bi(CODES_EN[i], hi)]);

/** 9×9 Vastu Purusha Mandala, north-up, [row y][col x], x=0 west. */
export const GRID: number[][] = (() => {
  const g = Array.from({length: 9}, () => Array(9).fill(0));
  [25, 26, 27, 28, 29, 30, 31, 32, 1].forEach((v, x) => (g[0][x] = v));
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((v, y) => (g[y][8] = v));
  [9, 10, 11, 12, 13, 14, 15, 16, 17].forEach((v, i) => (g[8][8 - i] = v));
  [17, 18, 19, 20, 21, 22, 23, 24, 25].forEach((v, i) => (g[8 - i][0] = v));
  const put = (v: number, cells: number[][]) => cells.forEach(([y, x]) => (g[y][x] = v));
  put(33, [[1, 6], [1, 7]]);
  put(34, [[2, 6], [2, 7]]);
  put(35, [[6, 7], [7, 7]]);
  put(36, [[6, 6], [7, 6]]);
  put(37, [[7, 1], [7, 2]]);
  put(38, [[6, 1], [6, 2]]);
  put(39, [[1, 1], [2, 1]]);
  put(40, [[1, 2], [2, 2]]);
  for (let y = 3; y <= 5; y++) {
    g[y][6] = 41;
    g[y][7] = 41;
    g[y][1] = 43;
    g[y][2] = 43;
    for (let x = 3; x <= 5; x++) {g[y][x] = 45;}
  }
  for (let x = 3; x <= 5; x++) {
    g[1][x] = 44;
    g[2][x] = 44;
    g[6][x] = 42;
    g[7][x] = 42;
  }
  return g;
})();

/** Entrance pada fruit (MahaVastu 32 entrances). */
export const DOOR_GOOD = [3, 4, 11, 12, 19, 20, 27, 28, 29];
export const DOOR_MOD = [5, 21, 30, 31, 32];
export const RL: Record<Rate, Bi> = {g: ['Auspicious', 'शुभ'], o: ['Moderate', 'मध्यम'], b: ['Dosha', 'दोष'], x: ['Severe dosha', 'गम्भीर दोष']};
export const RCOL: Record<Rate, string> = {g: '#1E8A5A', o: '#C98A12', b: '#C0392B', x: '#8E1B1B'};
export const rateOf = (def: Item, zk: string): Rate => (def.x.includes(zk) ? 'x' : def.b.includes(zk) ? 'b' : def.g.includes(zk) ? 'g' : 'o');
export const scoreColor = (v: number) => (v >= 4.5 ? '#1E8A5A' : v >= 3.5 ? '#6E9A2E' : v >= 2.5 ? '#C98A12' : v >= 1.5 ? '#C0392B' : '#8E1B1B');
/** The zone a compass degree falls in. */
export const zoneOf = (deg: number) => Z[Math.floor((((deg + 11.25) % 360) + 360) % 360 / 22.5)];

export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function blank(consultant: Consultant): Project {
  const cuts = Object.fromEntries(Z.map(z => [z, 'none'])) as Record<ZoneId, Cut>;
  return {
    id: 'p' + Date.now().toString(36),
    name: '',
    client: '',
    addr: '',
    date: ymd(new Date()),
    use: '',
    type: 'res',
    unit: 'फीट',
    W: 40,
    D: 60,
    up: 0,
    img: null,
    imgOp: 0.55,
    items: [],
    cuts,
    slope: '',
    veedh: '',
    brahma: false,
    neHeavy: false,
    fireWater: false,
    notes: '',
    ov: {},
    consultant: {...consultant},
  };
}

/** The page's "Open a sample project": a G+1 house with a NE toilet and a SW cut. */
export function sampleProject(consultant: Consultant): Project {
  const p = blank(consultant);
  Object.assign(p, {
    name: bi('Sample — G+1 house', 'नमूना — G+1 निवास'),
    client: bi('Mr. Udaharan Kumar', 'श्री उदाहरण कुमार'),
    addr: bi('Raipur, Chhattisgarh', 'रायपुर, छत्तीसगढ़'),
    use: bi('Two-storey house', 'दो-मंज़िला मकान'),
    type: 'res',
    W: 40,
    D: 60,
    up: 8,
  });
  const add = (t: string, x: number, y: number) => p.items.push({uid: 's' + p.items.length, t, x, y});
  add('door', 20, 0.5);
  add('toilet', 37, 4);
  add('kitchen', 35, 56);
  add('puja', 30, 9);
  add('masterbed', 6, 54);
  add('stairs', 6, 30);
  add('ugwater', 25, 3);
  add('ohtank', 4, 57);
  add('living', 30, 20);
  add('child', 5, 15);
  add('safe', 10, 50);
  p.cuts.SW = 'cut';
  p.slope = 'NE';
  return p;
}

export const newUid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// ---------- geometry ----------
type Geo = Pick<Project, 'W' | 'D' | 'up'>;
export type Loc = {deg: number; zone: ZoneId; gx: number; gy: number; dev: number; center: boolean};

/** Zone, degree and pada devta of a plot point (x, y in plot units from the top-left). A door snaps to its nearest wall. */
export function locate(p: Geo, x: number, y: number, isDoor = false): Loc {
  if (isDoor) {
    const fx = x / p.W, fy = y / p.D, m = Math.min(fx, 1 - fx, fy, 1 - fy);
    if (m === fx) {x = 0;}
    else if (m === 1 - fx) {x = p.W;}
    else if (m === fy) {y = 0;}
    else {y = p.D;}
  }
  const dx = x - p.W / 2, dy = y - p.D / 2;
  const deg = (((p.up + (Math.atan2(dx, -dy) * 180) / Math.PI) % 360) + 360) % 360;
  const zone = Z[Math.floor(((deg + 11.25) % 360) / 22.5)];
  const gx = Math.min(8, Math.max(0, Math.floor((x / p.W) * 9)));
  const gy = Math.min(8, Math.max(0, Math.floor((y / p.D) * 9)));
  const d = cellDev(p, gx, gy);
  const center = Math.hypot(dx / p.W, dy / p.D) < 1e-9 || d === 45;
  return {deg, zone, gx, gy, dev: d, center};
}

/** Devta of a plan cell: the mandala is turned to the nearest 90° of the plan's north. */
export function cellDev(p: Pick<Project, 'up'>, gx: number, gy: number): number {
  const upR = (Math.round(p.up / 90) % 4) * 90, a = (upR * Math.PI) / 180;
  const px = gx - 4, up = -(gy - 4);
  const N = up * Math.cos(a) - px * Math.sin(a), E = up * Math.sin(a) + px * Math.cos(a);
  return GRID[4 - Math.round(N)][4 + Math.round(E)];
}

/** A placed marker's item, location and rating (null for an unknown item). */
export function rateItem(p: Geo, it: Placed): {def: Item; L: Loc; r: Rate} | null {
  const def = ITEM[it.t];
  if (!def) {return null;}
  const L = locate(p, it.x, it.y, def.cat === 'door');
  const r: Rate = def.cat === 'door' ? (DOOR_GOOD.includes(L.dev) ? 'g' : DOOR_MOD.includes(L.dev) ? 'o' : 'x') : rateOf(def, L.center ? 'C' : L.zone);
  return {def, L, r};
}

// ---------- analysis engine ----------
const GRADES: Array<[Bi, Bi, string]> = [
  [['Excellent', 'उत्तम'], ['The energy fields are balanced; only minor fixes are needed.', 'ऊर्जा-क्षेत्र सन्तुलित हैं; केवल सूक्ष्म सुधार पर्याप्त।'], '#1E8A5A'],
  [['Fair', 'ठीक'], ['The basic structure is sound; fix the marked doshas one by one.', 'मूल संरचना ठीक है; चिन्हित दोषों का क्रमवार समाधान करें।'], '#C98A12'],
  [['Needs correction', 'सुधार आवश्यक'], ['Several devta areas are affected; shift activities as a priority.', 'कई देवता-क्षेत्र प्रभावित हैं; गतिविधि-स्थानान्तरण प्राथमिकता से करें।'], '#C0392B'],
  [['Serious', 'गम्भीर'], ['The core doshas run deep; an early site visit and step-by-step remedies are essential.', 'मूल दोष गहरे हैं; शीघ्र स्थल-परामर्श व चरणबद्ध उपाय अनिवार्य।'], '#8E1B1B'],
];
const GOOD_DIR = ['N', 'NNE', 'NE', 'ENE', 'E'];
const FIRE = ['kitchen', 'boiler', 'electrical', 'panel', 'generator'];

export function analyse(p: Project): Analysis {
  const sc: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) {sc[i] = 5;}
  const issues: Issue[] = [], goods: Good[] = [];
  const pen = (ids: number[], v: number) => ids.forEach(i => (sc[i] = Math.max(0, sc[i] - v)));
  const zoneNames = (arr: string[]) => arr.filter(z => z !== 'C').map(zh).join(', ');
  const upay0 = (z: Zk) => dev(ZONE_DEV[z][0]).upay;
  p.items.forEach(it => {
    const def = ITEM[it.t];
    if (!def) {return;}
    const l = itemL(def);
    const L = locate(p, it.x, it.y, def.cat === 'door');
    if (def.cat === 'door') {
      const d = L.dev;
      if (DOOR_GOOD.includes(d)) {
        goods.push({t: bi(`${l} — ${short(d)} pada (${zh(L.zone)})`, `${l} — ${short(d)} पद (${zh(L.zone)})`), d: bi('Auspicious entrance pada; energy comes in the right way.', 'शुभ प्रवेश पद; ऊर्जा का सही आगमन।')});
        return;
      }
      const mod = DOOR_MOD.includes(d);
      pen([d], mod ? 1.5 : 3);
      issues.push({
        pri: mod ? 45 : 80,
        sev: mod ? 'o' : 'x',
        title: bi(`${l} on ${mod ? 'a moderate' : 'an inauspicious'} pada — ${short(d)}`, `${l} ${mod ? 'मध्यम' : 'अशुभ'} पद पर — ${short(d)}`),
        zone: L.zone,
        devs: [d],
        detail: dev(d).dosha,
        shift: bi(
          'If possible, move the entrance to an auspicious pada — Mukhya/Bhallat/Soma in the north, Jayant/Mahendra in the east, Vitatha/Grihakshat in the south, Sugriva/Pushpadant in the west.',
          'सम्भव हो तो प्रवेश शुभ पद पर लाएँ — उत्तर में मुख्य/भल्लाट/सोम, पूर्व में जयन्त/महेन्द्र, दक्षिण में वितथ/गृहक्षत, पश्चिम में सुग्रीव/पुष्पदन्त।',
        ),
        upay: dev(d).upay + bi('; NAM + YST Ganesha at the entrance; STR copper strip in the threshold', '; NAM + YST गणेश द्वार पर; STR ताम्र पट्टी दहलीज़ में'),
      });
      return;
    }
    const zk: Zk = L.center ? 'C' : L.zone;
    const r = rateOf(def, zk);
    const where = L.center ? bi('Brahmasthan', 'ब्रह्मस्थान') : `${zh(L.zone)} (${L.zone})`;
    if (r === 'g') {
      goods.push({t: `${l} — ${where}`, d: bi(`${short(L.dev)} pada; the right place.`, `${short(L.dev)} पद; उचित स्थान।`)});
      return;
    }
    const main = L.dev;
    const others = (ZONE_DEV[zk] || []).filter(i => i !== main);
    if (r === 'o') {pen([main], 0.5);}
    if (r === 'b') {
      pen([main], 2);
      pen(others, 0.75);
    }
    if (r === 'x') {
      pen([main], 4);
      pen(others, 1.5);
    }
    let pri = {o: 10, b: 30, x: 40}[r];
    if ((zk === 'NE' || zk === 'NNE') && ['toilet', 'kitchen', 'septic', 'boiler', 'etp', 'dustbin'].includes(def.id)) {pri = 100;}
    else if (zk === 'C' && r !== 'o') {pri = 90;}
    else if (zk === 'SE' && ['ugwater', 'toilet', 'septic'].includes(def.id)) {pri = 60;}
    else if (zk === 'N' && FIRE.includes(def.id)) {pri = 50;}
    const gz = def.g.length ? zoneNames(def.g) : '';
    issues.push({
      pri,
      sev: r,
      title: `${l} — ${where}`,
      zone: zk,
      devs: [main],
      detail: bi(`${short(main)} pada: ${dev(main).dosha}`, `${short(main)} पद: ${dev(main).dosha}`),
      shift: gz ? bi(`SHF — shift “${l}” to one of these zones: ${gz}.`, `SHF — ${l} को ${gz} जोन में स्थानान्तरित करें।`) : '',
      upay: dev(main).upay,
    });
  });
  Z.forEach(z => {
    const c = p.cuts[z];
    if (c === 'cut') {
      const v = z === 'SW' || z === 'NE' ? 3 : 2;
      pen(ZONE_DEV[z], v);
      const names = ZONE_DEV[z].map(short).join(', ');
      issues.push({
        pri: z === 'NE' ? 75 : z === 'SW' ? 70 : 35,
        sev: v === 3 ? 'x' : 'b',
        title: bi(`${zh(z)} (${z}) zone is cut`, `${zh(z)} (${z}) जोन कटा हुआ`),
        zone: z,
        devs: ZONE_DEV[z],
        detail: bi(`Affected: ${names}. Weakened: ${zoneArea(z)}.`, `प्रभावित: ${names} — ${zoneArea(z)} क्षीण।`),
        shift: bi('STR — complete the zone with a copper/brass strip along the line of the cut corner; PYR pyramid grid.', 'STR — कटे कोने की रेखा पर ताम्र/पीतल पट्टी से जोन पूरा करें; PYR पिरामिड ग्रिड।'),
        upay: upay0(z),
      });
    } else if (c === 'ext') {
      if (GOOD_DIR.includes(z)) {goods.push({t: bi(`Extension in ${zh(z)} (${z})`, `${zh(z)} (${z}) में विस्तार`), d: bi('Auspicious extension — the zone’s energy grows.', 'शुभ विस्तार — सम्बन्धित ऊर्जा बढ़ी।')});}
      else {
        const v = z === 'SW' ? 2 : 1;
        pen(ZONE_DEV[z], v);
        issues.push({
          pri: 25,
          sev: v === 2 ? 'b' : 'o',
          title: bi(`Extension in ${zh(z)} (${z})`, `${zh(z)} (${z}) में विस्तार`),
          zone: z,
          devs: ZONE_DEV[z],
          detail: bi('Unbalanced extension — too much of the element.', 'असन्तुलित विस्तार — तत्व अति।'),
          shift: bi('Separate the extended part with a wall or planters to balance the main rectangle.', 'विस्तृत भाग को दीवार/गमलों से अलग कर मुख्य आयत को सन्तुलित करें।'),
          upay: upay0(z),
        });
      }
    }
  });
  const dirPen = (z: ZoneId | '', what: string, tag: string) => {
    if (!z) {return;}
    if (GOOD_DIR.includes(z)) {
      goods.push({t: `${what} — ${zh(z)}`, d: bi('Auspicious direction.', 'शुभ दिशा।')});
      return;
    }
    const bad = ['SW', 'SSW', 'S', 'WSW', 'W', 'SE', 'SSE'].includes(z);
    pen(ZONE_DEV[z], bad ? 2 : 1);
    issues.push({pri: bad ? 30 : 15, sev: bad ? 'b' : 'o', title: `${what} — ${zh(z)} (${z})`, zone: z, devs: ZONE_DEV[z], detail: tag, shift: '', upay: upay0(z)});
  };
  dirPen(
    p.slope,
    bi('Land slope', 'भूमि ढाल'),
    bi('A slope towards the south/west weakens stability and savings. Fill the land so it slopes towards the North-East.', 'दक्षिण/पश्चिम की ओर ढाल से स्थिरता व संचय क्षीण होते हैं। भराव कर ढाल ईशान की ओर करें।'),
  );
  dirPen(
    p.veedh,
    bi('Road vedha', 'मार्ग-वेध'),
    bi(
      'A road hits the plot head-on — a sharp jolt of energy. Block it with PYR/copper pyramids, NAM and a high boundary wall or greenery.',
      'सड़क का सीधा प्रहार — ऊर्जा का तीव्र आघात। PYR/ताम्र पिरामिड, NAM व ऊँची बाउंड्री/हरियाली से अवरोध दें।',
    ),
  );
  if (p.brahma) {
    pen([45], 3);
    issues.push({pri: 90, sev: 'x', title: bi('Load on the Brahmasthan', 'ब्रह्मस्थान पर भार'), zone: 'C', devs: [45], detail: dev(45).dosha, shift: bi('DSM — take the load off the centre; keep it empty, clean and well lit.', 'DSM — केन्द्र से भार हटाकर खाली, स्वच्छ व प्रकाशित रखें।'), upay: dev(45).upay});
  }
  if (p.neHeavy) {
    pen(ZONE_DEV.NE, 2);
    pen(ZONE_DEV.SW, 1);
    issues.push({
      pri: 55,
      sev: 'b',
      title: bi('North-East heavy / high, South-West light', 'ईशान भारी / ऊँचा, नैऋत्य हल्का'),
      zone: 'NE',
      devs: ZONE_DEV.NE,
      detail: bi('The weight balance is reversed — ideas get blocked, stability weakens.', 'भार-सन्तुलन उल्टा — विचार अवरुद्ध, स्थिरता क्षीण।'),
      shift: bi('Move heavy items/tanks to SW; keep NE light and open.', 'भारी सामान/टंकी SW में ले जाएँ; NE हल्का व खुला रखें।'),
      upay: dev(1).upay,
    });
  }
  if (p.fireWater) {
    pen([8, 10, 33], 1);
    issues.push({
      pri: 35,
      sev: 'b',
      title: bi('Fire and water very close / in one line', 'अग्नि-जल अत्यन्त पास / एक सीध में'),
      zone: 'SE',
      devs: [8, 10, 33],
      detail: bi('Clash of elements — quarrels, conflicting decisions.', 'तत्व-द्वन्द्व — कलह, निर्णय में टकराव।'),
      shift: bi('FAC/SHF — put distance and a barrier between the stove and the sink.', 'FAC/SHF — चूल्हा और सिंक के बीच दूरी व अवरोध दें।'),
      upay: bi('CLR green/yellow in between; COP copper plate; SHF', 'CLR हरा/पीला बीच में; COP ताम्र प्लेट; SHF'),
    });
  }
  Object.keys(p.ov).forEach(k => {
    const v = p.ov[+k];
    if (v !== null && v !== undefined) {sc[+k] = v;}
  });
  let total = 0;
  for (let i = 1; i <= 45; i++) {total += sc[i];}
  total = Math.round(total * 2) / 2;
  let level = total >= 180 ? 0 : total >= 150 ? 1 : total >= 120 ? 2 : 3;
  let note = bi(GRADES[level][1]);
  // Critical doshas cap the grade: a high total must not hide a NE toilet or a Brahmasthan load.
  const top = issues.reduce((m, i) => Math.max(m, i.pri), 0), sevN = issues.filter(i => i.sev === 'x').length;
  const cap = top >= 90 || sevN >= 3 ? 2 : top >= 60 || sevN >= 1 ? 1 : 0;
  if (cap > level) {
    level = cap;
    const g = bi(GRADES[cap][0]);
    note = bi(
      `Despite a score of ${total}, a ${top >= 90 ? 'top-priority' : 'serious'} dosha holds the grade at “${g}” — fix the priority doshas below first.`,
      `अंक ${total} होते हुए भी ${top >= 90 ? 'प्रथम-श्रेणी' : 'गम्भीर'} दोष के कारण श्रेणी “${g}” तक सीमित — पहले नीचे के प्राथमिक दोष सुधारें।`,
    );
  }
  issues.sort((a, b) => b.pri - a.pri);
  return {sc, total, grade: {label: bi(GRADES[level][0]), note, color: GRADES[level][2]}, issues, goods};
}

// ---------- plan drawing ----------
const f = (n: number) => String(Math.round(n * 100) / 100);
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c] as string));

/** Plot scale (SVG units per plot unit), plot size in SVG units, dial radius and the half-size of the square viewBox. */
export function planGeom(p: Pick<Project, 'W' | 'D'>) {
  const s = 800 / Math.max(p.W, p.D), w = p.W * s, h = p.D * s;
  const R = Math.hypot(w, h) / 2 + 10;
  return {s, w, h, R, V: R + 60};
}
/** Marker radius in SVG units; taps within MARKER_HIT of a marker's centre select it. */
export const MARKER_R = 30;
export const MARKER_HIT = MARKER_R + 16;

export type PlanOpts = {print?: boolean; chakra?: boolean; grid?: boolean; names?: boolean; sel?: string | null};

/**
 * The plan as an SVG string, viewBox centred on the plot: the 16-zone dial, the plot, the Brahmasthan,
 * the 9×9 padas, devta names, chakra lines and the markers. On screen the plan photo sits under the SVG
 * (PlanCanvas), so the plot is veiled with its own colour at 1 − opacity; the print copy embeds the photo.
 */
export function planSvg(p: Project, o: PlanOpts = {}): string {
  const print = !!o.print;
  const {s, w, h, R, V} = planGeom(p);
  const C = print
    ? {ink: BRAND.text, gold: BRAND.gold, accent: BRAND.maroon, plot: lightColors.cream, grid: BRAND.maroon, gridOp: 0.28, ring: BRAND.cream, ringOp: 1, brahma: BRAND.gold, brahmaOp: 0.16, label: BRAND.maroon, north: BRAND.maroon}
    : {ink: colors.text, gold: colors.gold, accent: colors.gold, plot: colors.card, grid: colors.text, gridOp: 0.22, ring: colors.gold, ringOp: 0.1, brahma: colors.gold, brahmaOp: 0.18, label: colors.text, north: colors.gold};
  const pt = (bearing: number, r: number) => {
    const a = ((bearing - p.up) * Math.PI) / 180;
    return [r * Math.sin(a), -r * Math.cos(a)];
  };
  const text = (x: number, y: number, size: number, fill: string, t: string, extra = '') =>
    `<text x="${f(x)}" y="${f(y + size * 0.35)}" font-size="${f(size)}" text-anchor="middle" fill="${fill}"${extra}>${esc(t)}</text>`;
  const x0 = -w / 2, y0 = -h / 2, out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-V)} ${f(-V)} ${f(2 * V)} ${f(2 * V)}">`);
  out.push(`<defs><clipPath id="mvclip"><rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(h)}"/></clipPath></defs>`);
  // dial ring: filled around the plot only, so the photo under the screen SVG is not tinted
  const r0 = R + 54;
  out.push(`<path fill-rule="evenodd" fill="${C.ring}" fill-opacity="${C.ringOp}" d="M${f(-r0)} 0a${f(r0)} ${f(r0)} 0 1 0 ${f(2 * r0)} 0a${f(r0)} ${f(r0)} 0 1 0 ${f(-2 * r0)} 0ZM${f(x0)} ${f(y0)}h${f(w)}v${f(h)}h${f(-w)}Z"/>`);
  out.push(`<circle cx="0" cy="0" r="${f(r0)}" fill="none" stroke="${C.gold}" stroke-width="1.5"/><circle cx="0" cy="0" r="${f(R + 2)}" fill="none" stroke="${C.gold}" stroke-width="1"/>`);
  for (let i = 0; i < 16; i++) {
    const [x1, y1] = pt(11.25 + i * 22.5, R + 2), [x2, y2] = pt(11.25 + i * 22.5, R + 54);
    out.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${C.gold}" stroke-width="1"/>`);
    const [lx, ly] = pt(i * 22.5, R + 28);
    out.push(text(lx, ly, Z[i].length === 1 ? 34 : Z[i].length === 2 ? 25 : 20, Z[i] === 'N' ? C.north : C.label, Z[i], ' font-weight="bold" font-family="Eczar, serif"'));
  }
  for (let d = 0; d < 360; d += 5) {
    if (d % 22.5 === 0) {continue;}
    const [a1, b1] = pt(d, R + 2), [a2, b2] = pt(d, R + 5);
    out.push(`<line x1="${f(a1)}" y1="${f(b1)}" x2="${f(a2)}" y2="${f(b2)}" stroke="${C.gold}" stroke-width="0.6" opacity="0.7"/>`);
  }
  // plot
  const veil = !print && p.img ? 1 - p.imgOp : 1;
  out.push(`<rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(h)}" fill="${C.plot}" fill-opacity="${f(veil)}" stroke="${C.ink}" stroke-width="3"/>`);
  out.push('<g clip-path="url(#mvclip)">');
  if (print && p.img) {out.push(`<image href="${esc(p.img)}" x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(h)}" preserveAspectRatio="none" opacity="${p.imgOp}"/>`);}
  const cw = w / 9, ch = h / 9;
  out.push(`<rect x="${f(x0 + 3 * cw)}" y="${f(y0 + 3 * ch)}" width="${f(3 * cw)}" height="${f(3 * ch)}" fill="${C.brahma}" fill-opacity="${C.brahmaOp}"/>`);
  if (o.grid !== false) {
    for (let i = 1; i < 9; i++) {
      const st = `stroke="${C.grid}" stroke-opacity="${C.gridOp}" stroke-width="${i === 3 || i === 6 ? 1.4 : 0.8}"${i === 1 || i === 8 ? '' : ' stroke-dasharray="4 4"'}`;
      out.push(`<line x1="${f(x0 + i * cw)}" y1="${f(y0)}" x2="${f(x0 + i * cw)}" y2="${f(-y0)}" ${st}/><line x1="${f(x0)}" y1="${f(y0 + i * ch)}" x2="${f(-x0)}" y2="${f(y0 + i * ch)}" ${st}/>`);
    }
  }
  if (o.names) {
    const fs = Math.max(8, Math.min(cw, ch) / 4.6);
    let brahma = false;
    for (let gy = 0; gy < 9; gy++) {
      for (let gx = 0; gx < 9; gx++) {
        const d = cellDev(p, gx, gy);
        if (d === 45) {
          if (!brahma) {out.push(text(0, 0, fs * 1.6, C.label, bi('Brahma', 'ब्रह्मा'), ' opacity="0.75"'));}
          brahma = true;
          continue;
        }
        out.push(text(x0 + (gx + 0.5) * cw, y0 + (gy + 0.5) * ch, fs, C.label, short(d), ' opacity="0.7"'));
      }
    }
  }
  if (o.chakra !== false) {
    for (let i = 0; i < 16; i++) {
      const [x2, y2] = pt(11.25 + i * 22.5, R);
      out.push(`<line x1="0" y1="0" x2="${f(x2)}" y2="${f(y2)}" stroke="${C.accent}" stroke-width="1.6" opacity="0.85"/>`);
    }
    out.push(`<circle cx="0" cy="0" r="5" fill="${C.accent}"/>`);
  }
  out.push('</g>');
  // markers
  p.items.forEach(it => {
    const m = rateItem(p, it);
    if (!m) {return;}
    const ab = itemAb(m.def);
    out.push(`<g transform="translate(${f((it.x - p.W / 2) * s)},${f((it.y - p.D / 2) * s)})">`);
    if (!print && o.sel === it.uid) {out.push(`<circle r="${MARKER_R + 9}" fill="none" stroke="${colors.gold}" stroke-width="4"/>`);}
    out.push(`<circle r="${MARKER_R}" fill="${print ? lightColors.cream : colors.brand}" stroke="${RCOL[m.r]}" stroke-width="7"/>`);
    out.push(text(0, 1, ab.length > 2 ? 19 : 25, print ? BRAND.text : colors.cream, ab, ' font-weight="bold"'));
    if (print) {out.push(text(0, MARKER_R + 16, 20, BRAND.text, itemL(m.def).split(' /')[0]));}
    out.push('</g>');
  });
  out.push('</svg>');
  return out.join('');
}

/** Score dial out of 225 (viewBox 0 0 200 200). */
export function dialSvg(total: number, color: string, c: {track: string; ink: string; muted: string}): string {
  const r = 80, len = 2 * Math.PI * r;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
    `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${c.track}" stroke-width="14"/>` +
    `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${f((len * total) / 225)} ${f(len)}" transform="rotate(-90 100 100)"/>` +
    `<text x="100" y="96" text-anchor="middle" font-family="Eczar, serif" font-size="44" font-weight="bold" fill="${c.ink}">${total}</text>` +
    `<text x="100" y="126" text-anchor="middle" font-size="15" fill="${c.muted}">${esc(bi('out of 225', '225 में से'))}</text></svg>`
  );
}
