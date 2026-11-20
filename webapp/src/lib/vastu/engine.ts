/**
 * 16-zone Vastu Chakra geometry — pure, no React Native imports, unit-tested in
 * __tests__/vastu/engine.test.ts.
 *
 * Coordinates are plan-image pixels, screen style: x right, y down.
 * Bearings are degrees clockwise from magnetic north (0 = N, 90 = E).
 * northOffset is where magnetic north lies on the plan, clockwise from the plan's
 * "up": angleFromCentre = (atan2(dx, -dy) - northOffset) mod 360. A plan whose up
 * edge faces bearing H therefore has northOffset = 360 - H (see bearingToOffset).
 * All geometry is deterministic here; the backend LLM only interprets the result.
 */

export type Pt = {x: number; y: number};
export type Lang = 'en' | 'hi';
type Pair = [string, string]; // [en, hi]

export const ZONE_IDS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'] as const;
export type ZoneId = (typeof ZONE_IDS)[number];
export const ZONE_SPAN = 22.5;
export const PADA_SPAN = 11.25;

export type Element = 'water' | 'air' | 'fire' | 'earth' | 'space';
export const ELEMENTS: Record<Element, Pair> = {
  water: ['Water', 'जल'],
  air: ['Air', 'वायु'],
  fire: ['Fire', 'अग्नि'],
  earth: ['Earth', 'पृथ्वी'],
  space: ['Space', 'आकाश'],
};

type ZoneInfo = {name: Pair; short: Pair; purpose: Pair; element: Element};
// needs Vastu expert review: elements and purposes carried over from the earlier MahaVastu page.
// Elements follow MahaVastu (Khushdeep Bansal): N/NNE/NE/NNW water; ENE/E/ESE/NW air; SE/SSE/S fire; SSW/SW earth;
// WSW/W/WNW space. vastuCheck/data/AstroShrine_Vastu_Master.json zones16[].tattva must match (WSW was पृथ्वी there).
// prettier-ignore
export const ZONES: Record<ZoneId, ZoneInfo> = {
  N:   {name: ['North', 'उत्तर'], short: ['Money', 'धन'], purpose: ['Money & opportunities', 'धन और अवसर'], element: 'water'},
  NNE: {name: ['North-North-East', 'उत्तर-उत्तर-पूर्व'], short: ['Health', 'स्वास्थ्य'], purpose: ['Health & immunity', 'स्वास्थ्य और रोग-प्रतिरोधक क्षमता'], element: 'water'},
  NE:  {name: ['North-East', 'उत्तर-पूर्व (ईशान)'], short: ['Clarity', 'स्पष्टता'], purpose: ['Mind & clarity', 'मन और स्पष्टता'], element: 'water'},
  ENE: {name: ['East-North-East', 'पूर्व-उत्तर-पूर्व'], short: ['Fun', 'आनंद'], purpose: ['Fun & recreation', 'आनंद और मनोरंजन'], element: 'air'},
  E:   {name: ['East', 'पूर्व'], short: ['Social', 'संबंध'], purpose: ['Social associations', 'सामाजिक संबंध'], element: 'air'},
  ESE: {name: ['East-South-East', 'पूर्व-दक्षिण-पूर्व'], short: ['Churning', 'मंथन'], purpose: ['Analysis & churning (anxiety)', 'मंथन और विश्लेषण (चिंता)'], element: 'air'},
  SE:  {name: ['South-East', 'दक्षिण-पूर्व (आग्नेय)'], short: ['Cash', 'नकदी'], purpose: ['Cash & liquidity', 'नकदी और तरलता'], element: 'fire'},
  SSE: {name: ['South-South-East', 'दक्षिण-दक्षिण-पूर्व'], short: ['Power', 'शक्ति'], purpose: ['Power & confidence', 'शक्ति और आत्मविश्वास'], element: 'fire'},
  S:   {name: ['South', 'दक्षिण'], short: ['Fame', 'यश'], purpose: ['Relaxation & fame', 'विश्राम और यश'], element: 'fire'},
  SSW: {name: ['South-South-West', 'दक्षिण-दक्षिण-पश्चिम'], short: ['Disposal', 'निकास'], purpose: ['Disposal & expenditure', 'निकास और व्यय'], element: 'earth'},
  SW:  {name: ['South-West', 'दक्षिण-पश्चिम (नैऋत्य)'], short: ['Skills', 'कौशल'], purpose: ['Skills & relationships', 'कौशल और संबंध'], element: 'earth'},
  WSW: {name: ['West-South-West', 'पश्चिम-दक्षिण-पश्चिम'], short: ['Savings', 'बचत'], purpose: ['Education & savings', 'शिक्षा और बचत'], element: 'space'},
  W:   {name: ['West', 'पश्चिम'], short: ['Gains', 'लाभ'], purpose: ['Gains & profits', 'लाभ और मुनाफ़ा'], element: 'space'},
  WNW: {name: ['West-North-West', 'पश्चिम-उत्तर-पश्चिम'], short: ['Detox', 'विषहरण'], purpose: ['Depression & detox', 'अवसाद और विषहरण'], element: 'space'},
  NW:  {name: ['North-West', 'उत्तर-पश्चिम (वायव्य)'], short: ['Support', 'सहयोग'], purpose: ['Support & banking', 'सहयोग और बैंकिंग'], element: 'air'},
  NNW: {name: ['North-North-West', 'उत्तर-उत्तर-पश्चिम'], short: ['Attraction', 'आकर्षण'], purpose: ['Attraction & sex', 'आकर्षण और दांपत्य सुख'], element: 'water'},
};

/** Planet ruling each of the eight main directions (bearing = the direction's centre). */
export const PLANETS: Array<{dir: ZoneId; bearing: number; name: Pair}> = [
  {dir: 'N', bearing: 0, name: ['Mercury', 'बुध']},
  {dir: 'NE', bearing: 45, name: ['Jupiter', 'गुरु']},
  {dir: 'E', bearing: 90, name: ['Sun', 'सूर्य']},
  {dir: 'SE', bearing: 135, name: ['Venus', 'शुक्र']},
  {dir: 'S', bearing: 180, name: ['Mars', 'मंगल']},
  {dir: 'SW', bearing: 225, name: ['Rahu', 'राहु']},
  {dir: 'W', bearing: 270, name: ['Saturn', 'शनि']},
  {dir: 'NW', bearing: 315, name: ['Moon', 'चंद्र']},
];

export type PadaVerdict = 'best' | 'good' | 'avoid';
// needs Vastu expert review: traditional Vastu Purusha pada devtas and indications, N1 at the NW corner (315°), clockwise.
// prettier-ignore
const PADA_DATA: Array<[Pair, PadaVerdict, Pair]> = [
  [['Roga', 'रोग'], 'avoid', ['illness and weakness in the family', 'परिवार में रोग और कमज़ोरी']],
  [['Naag', 'नाग'], 'avoid', ['enmity and jealousy from others', 'दूसरों से शत्रुता और ईर्ष्या']],
  [['Mukhya', 'मुख्य'], 'best', ['wealth and prosperity', 'धन और समृद्धि']],
  [['Bhallat', 'भल्लाट'], 'best', ['abundance and large gains', 'प्रचुरता और बड़े लाभ']],
  [['Soma', 'सोम'], 'good', ['wealth with a religious bent of mind', 'धन के साथ धार्मिक प्रवृत्ति']],
  [['Bhujag', 'भुजग'], 'avoid', ['disputes, especially with children', 'विवाद, विशेषकर संतान से']],
  [['Aditi', 'अदिति'], 'avoid', ['discord and disobedience in the family', 'परिवार में कलह और अवज्ञा']],
  [['Diti', 'दिति'], 'avoid', ['obstacles and loss of wealth', 'बाधाएँ और धन-हानि']],
  [['Shikhi', 'शिखी'], 'avoid', ['risk of fire and accidental losses', 'आग और आकस्मिक हानि का भय']],
  [['Parjanya', 'पर्जन्य'], 'avoid', ['rising expenses and irregular income', 'बढ़ते खर्च और अनियमित आय']],
  [['Jayant', 'जयंत'], 'best', ['success and victory in efforts', 'सफलता और प्रयासों में विजय']],
  [['Mahendra', 'महेंद्र'], 'best', ['authority and favour from the government', 'अधिकार और सरकार से अनुकूलता']],
  [['Surya', 'सूर्य'], 'avoid', ['short temper and arrogance', 'क्रोध और अहंकार']],
  [['Satya', 'सत्य'], 'avoid', ['unreliability and broken promises', 'अविश्वसनीयता और टूटे वादे']],
  [['Bhrisha', 'भृश'], 'avoid', ['harshness and insensitivity', 'कठोरता और संवेदनहीनता']],
  [['Antariksh', 'अंतरिक्ष'], 'avoid', ['theft and losses', 'चोरी और हानि']],
  [['Anil', 'अनिल'], 'avoid', ['weak support from the family', 'परिवार से सहयोग में कमी']],
  [['Pusha', 'पूषा'], 'avoid', ['dependence and servitude', 'पराधीनता और दासता']],
  [['Vitath', 'वितथ'], 'good', ['gains, though with a tendency to cut corners', 'लाभ, परंतु अनुचित तरीकों की प्रवृत्ति के साथ']],
  [['Grihakshat', 'गृहक्षत'], 'best', ['prosperity and rising income', 'समृद्धि और बढ़ती आय']],
  [['Yama', 'यम'], 'avoid', ['heavy expenses and fear', 'भारी खर्च और भय']],
  [['Gandharva', 'गंधर्व'], 'avoid', ['poverty and ingratitude', 'निर्धनता और कृतघ्नता']],
  [['Bhringraj', 'भृंगराज'], 'avoid', ['poverty and loss of skills', 'निर्धनता और कौशल का ह्रास']],
  [['Mrigha', 'मृग'], 'avoid', ['blocked progress for the children', 'संतान की प्रगति में बाधा']],
  [['Pitra', 'पितृ'], 'avoid', ['financial strain and ill-health for the head of the family', 'परिवार के मुखिया के लिए आर्थिक तंगी और अस्वास्थ्य']],
  [['Dauvarik', 'दौवारिक'], 'avoid', ['an unstable career', 'अस्थिर करियर']],
  [['Sugreev', 'सुग्रीव'], 'best', ['growth and gains', 'उन्नति और लाभ']],
  [['Pushpdant', 'पुष्पदंत'], 'best', ['fulfilment of wishes and prosperity', 'मनोकामना-पूर्ति और समृद्धि']],
  [['Varun', 'वरुण'], 'good', ['wealth, with over-ambition', 'धन, पर अति-महत्वाकांक्षा के साथ']],
  [['Asura', 'असुर'], 'avoid', ['isolation and hostility', 'अकेलापन और शत्रुता']],
  [['Shosha', 'शोष'], 'avoid', ['sorrow and addictions', 'दुःख और व्यसन']],
  [['Papyakshma', 'पापयक्ष्मा'], 'avoid', ['illness and addictions', 'रोग और व्यसन']],
];
export const PADAS = PADA_DATA.map(([devta, verdict, effect], i) => ({
  id: 'NESW'[Math.floor(i / 8)] + ((i % 8) + 1),
  devta,
  verdict,
  effect,
}));
export type PadaId = string;

// ===== Property type =====
export const PROPERTY_TYPES = ['home', 'commercial', 'industrial'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export const PROPERTY_LABELS: Record<PropertyType, Pair> = {
  home: ['Home', 'घर'],
  commercial: ['Shop / Office', 'दुकान / कार्यालय'],
  industrial: ['Factory / Industry', 'फ़ैक्टरी / उद्योग'],
};

/** Business picked for an industrial property; tailors the interpretation. */
export const INDUSTRIES = [
  ['manufacturing', 'Manufacturing / engineering', 'विनिर्माण / इंजीनियरिंग'],
  ['warehouse', 'Warehouse / logistics', 'गोदाम / लॉजिस्टिक्स'],
  ['pharma', 'Pharma / chemicals', 'फ़ार्मा / रसायन'],
  ['food', 'Food processing', 'खाद्य प्रसंस्करण'],
  ['textile', 'Textile / garments', 'कपड़ा / परिधान'],
  ['plastics', 'Plastics / packaging', 'प्लास्टिक / पैकेजिंग'],
  ['steel', 'Steel / metal / foundry', 'स्टील / धातु / ढलाई'],
  ['electronics', 'Electronics', 'इलेक्ट्रॉनिक्स'],
  ['automobile', 'Automobile / workshop', 'ऑटोमोबाइल / वर्कशॉप'],
  ['printing', 'Printing / paper', 'प्रिंटिंग / कागज़'],
  ['construction', 'Bricks / cement / tiles', 'ईंट / सीमेंट / टाइल'],
  ['hotel', 'Hotel / restaurant', 'होटल / रेस्टोरेंट'],
  ['hospital', 'Hospital / clinic', 'अस्पताल / क्लिनिक'],
  ['school', 'School / institute', 'स्कूल / संस्थान'],
  ['other', 'Other', 'अन्य'],
] as const;
export type Industry = (typeof INDUSTRIES)[number][0];
export const industryLabel = (id: Industry, lang: Lang) => {
  const row = INDUSTRIES.find(r => r[0] === id);
  return row ? row[lang === 'hi' ? 2 : 1] : id;
};

// needs Vastu expert review: shop/office and factory meanings of the 16 zones (homes use ZONES[z].purpose).
// prettier-ignore
const PURPOSE_BY_TYPE: Record<Exclude<PropertyType, 'home'>, Record<ZoneId, Pair>> = {
  commercial: {
    N:   ['New opportunities & sales', 'नए अवसर और बिक्री'],
    NNE: ['Health of staff & business', 'कर्मचारियों व व्यापार का स्वास्थ्य'],
    NE:  ['Clarity, planning & ideas', 'स्पष्टता, योजना और विचार'],
    ENE: ['Refreshment & staff morale', 'ताज़गी और कर्मचारियों का मनोबल'],
    E:   ['Clients, networking & government ties', 'ग्राहक, नेटवर्किंग और सरकारी संबंध'],
    ESE: ['Analysis & decisions', 'विश्लेषण और निर्णय'],
    SE:  ['Cash flow & liquidity', 'नकदी प्रवाह और तरलता'],
    SSE: ['Market strength & confidence', 'बाज़ार में शक्ति और आत्मविश्वास'],
    S:   ['Brand & reputation', 'ब्रांड और प्रतिष्ठा'],
    SSW: ['Waste & unwanted expenses', 'कचरा और अनावश्यक व्यय'],
    SW:  ["Owner's control & stability", 'मालिक का नियंत्रण और स्थिरता'],
    WSW: ['Accounts, savings & training', 'लेखा, बचत और प्रशिक्षण'],
    W:   ['Profits & gains', 'मुनाफ़ा और लाभ'],
    WNW: ['Letting go of losses & disputes', 'घाटे और विवादों से मुक्ति'],
    NW:  ['Support, loans & banking', 'सहयोग, ऋण और बैंकिंग'],
    NNW: ['Customer attraction & deals', 'ग्राहक आकर्षण और सौदे'],
  },
  industrial: {
    N:   ['New orders & opportunities', 'नए ऑर्डर और अवसर'],
    NNE: ['Worker health & machine upkeep', 'श्रमिक स्वास्थ्य और मशीनों का रखरखाव'],
    NE:  ['Planning, R&D & clarity', 'योजना, अनुसंधान और स्पष्टता'],
    ENE: ['Staff refreshment & morale', 'कर्मचारियों की ताज़गी और मनोबल'],
    E:   ['Licences & government ties', 'लाइसेंस और सरकारी संबंध'],
    ESE: ['Quality control & testing', 'गुणवत्ता नियंत्रण और परीक्षण'],
    SE:  ['Boiler, furnace, power & cash flow', 'बॉयलर, भट्टी, विद्युत और नकदी प्रवाह'],
    SSE: ['Production strength & capacity', 'उत्पादन शक्ति और क्षमता'],
    S:   ['Market reputation & brand', 'बाज़ार प्रतिष्ठा और ब्रांड'],
    SSW: ['Scrap, waste & expense control', 'कबाड़, अपशिष्ट और व्यय नियंत्रण'],
    SW:  ["Owner's control, heavy machines & raw material", 'मालिक का नियंत्रण, भारी मशीनें और कच्चा माल'],
    WSW: ['Accounts, savings & skilled staff', 'लेखा, बचत और कुशल कर्मचारी'],
    W:   ['Profits & finished goods', 'मुनाफ़ा और तैयार माल'],
    WNW: ['Stock clearing & disposal', 'स्टॉक निकासी और निपटान'],
    NW:  ['Dispatch, payments & banking', 'डिस्पैच, भुगतान और बैंकिंग'],
    NNW: ['Buyers, dealers & deals', 'खरीदार, डीलर और सौदे'],
  },
};
/** What a zone governs for this kind of property. */
export const zonePurpose = (zone: ZoneId, type: PropertyType = 'home'): Pair =>
  type === 'home' ? ZONES[zone].purpose : PURPOSE_BY_TYPE[type][zone];

// Last column: property types that offer the tag (h home, c shop/office, i factory).
export const ITEM_TYPES = [
  ['main_door', 'Main door / gate', 'मुख्य द्वार / गेट', 'hci'],
  ['kitchen', 'Kitchen', 'रसोई', 'h'],
  ['toilet', 'Toilet', 'शौचालय', 'hci'],
  ['master_bedroom', 'Master bedroom', 'मुख्य शयनकक्ष', 'h'],
  ['kids_bedroom', "Kids' bedroom", 'बच्चों का कमरा', 'h'],
  ['puja_room', 'Puja room / temple', 'पूजा घर / मंदिर', 'hci'],
  ['staircase', 'Staircase', 'सीढ़ी', 'hci'],
  ['water_tank', 'Water tank', 'पानी की टंकी', 'hci'],
  ['borewell', 'Borewell', 'बोरवेल', 'hci'],
  ['septic_tank', 'Septic tank', 'सेप्टिक टैंक', 'hci'],
  ['study', 'Study', 'अध्ययन कक्ष', 'h'],
  ['cash_locker', 'Cash locker', 'तिजोरी', 'hci'],
  ['store', 'Store', 'भंडार', 'hc'],
  ['balcony', 'Balcony', 'बालकनी', 'h'],
  ['heavy_furniture', 'Heavy furniture', 'भारी फ़र्नीचर', 'hc'],
  ['owner_cabin', 'Owner / MD cabin', 'मालिक / एमडी केबिन', 'ci'],
  ['reception', 'Reception', 'रिसेप्शन', 'c'],
  ['cash_counter', 'Cash counter', 'कैश काउंटर', 'c'],
  ['staff_area', 'Staff seating', 'कर्मचारी बैठक', 'c'],
  ['display', 'Display / showroom', 'डिस्प्ले / शोरूम', 'c'],
  ['conference', 'Conference room', 'कॉन्फ़्रेंस रूम', 'c'],
  ['accounts', 'Accounts', 'लेखा विभाग', 'ci'],
  ['server_room', 'Server / electrical room', 'सर्वर / विद्युत कक्ष', 'ci'],
  ['pantry', 'Pantry', 'पैंट्री', 'c'],
  ['parking', 'Parking', 'पार्किंग', 'ci'],
  ['production', 'Production floor', 'उत्पादन क्षेत्र', 'i'],
  ['machinery', 'Heavy machinery', 'भारी मशीनरी', 'i'],
  ['boiler', 'Boiler / furnace', 'बॉयलर / भट्टी', 'i'],
  ['transformer', 'Transformer / DG set', 'ट्रांसफ़ॉर्मर / जनरेटर', 'i'],
  ['raw_material', 'Raw material store', 'कच्चा माल भंडार', 'i'],
  ['finished_goods', 'Finished goods', 'तैयार माल', 'i'],
  ['admin_office', 'Admin office', 'प्रशासनिक कार्यालय', 'i'],
  ['labour_quarters', 'Labour quarters', 'श्रमिक आवास', 'i'],
  ['security_cabin', 'Security cabin', 'सुरक्षा केबिन', 'i'],
  ['canteen', 'Canteen', 'कैंटीन', 'i'],
  ['loading_dock', 'Loading / dispatch', 'लोडिंग / डिस्पैच', 'i'],
  ['weighbridge', 'Weighbridge', 'धर्मकांटा', 'i'],
  ['etp', 'Effluent / waste treatment', 'अपशिष्ट उपचार (ETP)', 'i'],
  ['scrap_yard', 'Scrap yard', 'कबाड़ क्षेत्र', 'i'],
] as const;
export type ItemType = (typeof ITEM_TYPES)[number][0];
export const itemLabel = (type: ItemType, lang: Lang) => {
  const row = ITEM_TYPES.find(r => r[0] === type);
  return row ? row[lang === 'hi' ? 2 : 1] : type;
};
/** Tags offered for a property type, in list order. */
export const itemTypesFor = (type: PropertyType): ItemType[] =>
  ITEM_TYPES.filter(r => r[3].includes(type[0])).map(r => r[0]);

// ===== Remedy types (the professional remedy list; Claude picks from these) =====
export const REMEDY_CATEGORIES = ['placement', 'removal', 'element', 'cleansing', 'orientation'] as const;
export type RemedyCategory = (typeof REMEDY_CATEGORIES)[number];
export const REMEDY_CATEGORY_LABELS: Record<RemedyCategory, Pair> = {
  placement: ['Placement / installation', 'स्थापना / प्लेसमेंट'],
  removal: ['Removal / correction', 'निष्कासन / सुधार'],
  element: ['Element balancing', 'तत्व संतुलन'],
  cleansing: ['Energy cleansing', 'ऊर्जा शुद्धि'],
  orientation: ['Sitting / facing direction', 'आसन / दिशा सुधार'],
};
// prettier-ignore
export const REMEDY_TYPES = [
  ['yantra', 'placement', 'Yantra (Vastu, Shri, Kuber, Ganesh, Agni, Mangal)', 'यंत्र स्थापना (वास्तु, श्री, कुबेर, गणेश, अग्नि, मंगल यंत्र)'],
  ['pyramid', 'placement', 'Pyramid (copper / crystal / brass / lead)', 'पिरामिड स्थापना (कॉपर / क्रिस्टल / ब्रास / लेड)'],
  ['pyramid_strip', 'placement', 'Pyramid strip', 'पिरामिड स्ट्रिप / पट्टी स्थापना'],
  ['gemstone', 'placement', 'Gemstone by direction', 'रत्न स्थापना (दिशा अनुसार)'],
  ['crystal', 'placement', 'Crystal (quartz, citrine, amethyst, rose quartz)', 'क्रिस्टल स्थापना (क्वार्ट्ज, सिट्रिन, एमेथिस्ट, रोज क्वार्ट्ज)'],
  ['water_feature', 'placement', 'Water source (fountain, aquarium, water kalash)', 'जल स्रोत स्थापना (फव्वारा, एक्वेरियम, जल कलश)'],
  ['plants', 'placement', 'Tulsi / plants', 'तुलसी / पौधे स्थापना'],
  ['nameplate', 'placement', 'Nameplate with Swastik / Om / Ganesh', 'नेमप्लेट + स्वस्तिक / ॐ / गणेश स्थापना'],
  ['wind_chime', 'placement', 'Wind chime', 'विंड चाइम स्थापना'],
  ['salt_bowl', 'placement', 'Salt bowl', 'नमक कटोरा स्थापना'],
  ['dismantle', 'removal', 'Remove wrong idols, broken items, dead plants, stopped clocks', 'डिस्मंटल / हटाना (गलत मूर्ति, टूटा सामान, मृत पौधे, बंद घड़ी)'],
  ['declutter', 'removal', 'Clutter clearing (keep the Brahmasthan open)', 'क्लटर क्लीयरिंग (ब्रह्मस्थान खाली करना)'],
  ['furniture_shift', 'removal', 'Shift furniture out of the wrong direction', 'गलत दिशा का फर्नीचर शिफ्ट'],
  ['mirror', 'removal', 'Remove or re-angle a mirror', 'आईना हटाना / दिशा बदलना'],
  ['beam', 'removal', 'Neutralise a beam (pyramid)', 'बीम प्रभाव काटना (पिरामिड से)'],
  ['colour', 'element', 'Colour therapy by direction', 'रंग चिकित्सा (दिशा-रंग)'],
  ['metal_strip', 'element', 'Metal / copper strip', 'धातु पट्टी / कॉपर स्ट्रिप'],
  ['fire_balance', 'element', 'Fire balance (red pyramid / Agni yantra)', 'अग्नि संतुलन (लाल पिरामिड / अग्नि यंत्र)'],
  ['water_balance', 'element', 'Water balance (water in the NE)', 'जल संतुलन (NE जल)'],
  ['earth_weight', 'element', 'Earth weight (heavy items in the SW)', 'पृथ्वी भार (SW भारी वस्तु)'],
  ['salt_cleanse', 'cleansing', 'Salt cleansing', 'नमक शुद्धि'],
  ['sound_incense', 'cleansing', 'Incense / bell / conch', 'धूप / घंटी / शंख नाद'],
  ['copper_water', 'cleansing', 'Water in a copper vessel', 'तांबे के बर्तन में जल'],
  ['sleep_direction', 'orientation', 'Sleeping direction (head south / east)', 'शयन दिशा सुधार (सिर दक्षिण/पूर्व)'],
  ['work_facing', 'orientation', 'Work / study facing direction', 'कार्य/पढ़ाई मुख दिशा सुधार'],
  ['kitchen_facing', 'orientation', 'Cook facing east', 'रसोई मुख पूर्व सुधार'],
] as const;
export type RemedyType = (typeof REMEDY_TYPES)[number][0];
export const remedyInfo = (id: RemedyType | undefined) => {
  const row = REMEDY_TYPES.find(r => r[0] === id);
  return row ? {id: row[0], category: row[1] as RemedyCategory, label: [row[2], row[3]] as Pair} : undefined;
};

export type TaggedItem =
  | {id: string; type: ItemType; label?: string; kind: 'point'; p: Pt}
  | {id: string; type: ItemType; label?: string; kind: 'rect'; a: Pt; b: Pt};

export const DISCLAIMERS: Pair[] = [
  [
    'Results depend on an accurate plan and a correct compass reading. Keep phones away from metal and electronics while taking the reading.',
    'परिणाम सही नक्शे और सही कम्पास रीडिंग पर निर्भर करते हैं। रीडिंग लेते समय फ़ोन को धातु और इलेक्ट्रॉनिक उपकरणों से दूर रखें।',
  ],
  [
    'This is traditional Vastu guidance, not engineering, legal or medical advice. Do not make structural changes without a professional.',
    'यह पारंपरिक वास्तु मार्गदर्शन है, इंजीनियरिंग, क़ानूनी या चिकित्सीय सलाह नहीं। किसी विशेषज्ञ के बिना कोई संरचनात्मक बदलाव न करें।',
  ],
];

// ===== Angles =====

export const norm360 = (a: number) => ((a % 360) + 360) % 360;

/** northOffset for a plan whose "up" edge faces bearing H (what a compass reads with the phone's top along that edge). */
export const bearingToOffset = (upBearing: number) => norm360(360 - upBearing);
/** The inverse: the plan-up bearing shown to the user for a stored northOffset. */
export const offsetToBearing = bearingToOffset;

/**
 * Low-pass filter for compass headings. Averages the unit vector, not the angle,
 * so readings either side of north (359°, 1°) settle on 0° instead of 180°.
 */
export function makeHeadingFilter(k = 0.15) {
  let sx = 0;
  let cy = 0;
  let primed = false;
  return (heading: number) => {
    const r = (heading * Math.PI) / 180;
    if (!primed) {
      sx = Math.sin(r);
      cy = Math.cos(r);
      primed = true;
    } else {
      sx += k * (Math.sin(r) - sx);
      cy += k * (Math.cos(r) - cy);
    }
    return norm360((Math.atan2(sx, cy) * 180) / Math.PI);
  };
}

export function angleFromCentre(p: Pt, centre: Pt, northOffset: number): number {
  const dx = p.x - centre.x;
  const dy = p.y - centre.y;
  return norm360((Math.atan2(dx, -dy) * 180) / Math.PI - northOffset);
}

export const zoneIndex = (angle: number) => Math.floor(norm360(angle + ZONE_SPAN / 2) / ZONE_SPAN) % 16;
export const zoneOf = (angle: number): ZoneId => ZONE_IDS[zoneIndex(angle)];

/** N1 starts at 315° (the NW corner) and padas run clockwise: N1..N8, E1..E8, S1..S8, W1..W8. */
export const padaOf = (angle: number): PadaId => PADAS[Math.floor(norm360(angle - 315) / PADA_SPAN) % 32].id;
export const padaInfo = (id: PadaId) => PADAS.find(p => p.id === id);

// ===== Areas =====

const signedArea = (p: Pt[]) => {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[i];
    const r = p[(i + 1) % p.length];
    a += q.x * r.y - r.x * q.y;
  }
  return a / 2;
};
export const polygonArea = (p: Pt[]) => Math.abs(signedArea(p));

/** Area-weighted centroid (shoelace), not the mean of the vertices. Degenerate input falls back to the mean. */
export function polygonCentroid(p: Pt[]): Pt {
  const a = signedArea(p);
  if (p.length < 3 || Math.abs(a) < 1e-9) {
    const n = Math.max(p.length, 1);
    return {x: p.reduce((s, q) => s + q.x, 0) / n, y: p.reduce((s, q) => s + q.y, 0) / n};
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[i];
    const r = p[(i + 1) % p.length];
    const c = q.x * r.y - r.x * q.y;
    cx += (q.x + r.x) * c;
    cy += (q.y + r.y) * c;
  }
  return {x: cx / (6 * a), y: cy / (6 * a)};
}

/** Screen direction of a bearing: rotated by northOffset, y down. */
const dirOf = (bearing: number, northOffset: number): Pt => {
  const s = ((bearing + northOffset) * Math.PI) / 180;
  return {x: Math.sin(s), y: -Math.cos(s)};
};
// With y down, cross(a, b) > 0 means b lies clockwise of a.
const cross = (a: Pt, b: Pt) => a.x * b.y - a.y * b.x;

/** Sutherland–Hodgman against one half-plane (keep f >= 0); fine for a concave subject and a convex clip. */
function clipHalf(poly: Pt[], f: (p: Pt) => number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = f(a);
    const fb = f(b);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fb >= 0) {
      const t = fa / (fa - fb);
      out.push({x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y)});
    }
  }
  return out;
}

/** The part of a polygon inside the zone's 22.5° wedge around the centre. */
function clipToZone(poly: Pt[], zone: number, centre: Pt, northOffset: number): Pt[] {
  const b0 = zone * ZONE_SPAN - ZONE_SPAN / 2;
  const d0 = dirOf(b0, northOffset);
  const d1 = dirOf(b0 + ZONE_SPAN, northOffset);
  const rel = (p: Pt) => ({x: p.x - centre.x, y: p.y - centre.y});
  const first = clipHalf(poly, p => cross(d0, rel(p)));
  return first.length ? clipHalf(first, p => cross(rel(p), d1)) : first;
}

/** Area of the polygon in each of the 16 zones, in ZONE_IDS order. Sums to the polygon's area. */
export const zoneAreas = (poly: Pt[], centre: Pt, northOffset: number) =>
  ZONE_IDS.map((_, z) => polygonArea(clipToZone(poly, z, centre, northOffset)));

export const rectToPoly = (a: Pt, b: Pt): Pt[] => {
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const y1 = Math.max(a.y, b.y);
  return [{x: x0, y: y0}, {x: x1, y: y0}, {x: x1, y: y1}, {x: x0, y: y1}];
};

/** Share of a rectangle in each zone, percent to one decimal; zones it does not touch are left out. */
export function rectZoneSplit(a: Pt, b: Pt, centre: Pt, northOffset: number): Partial<Record<ZoneId, number>> {
  const poly = rectToPoly(a, b);
  const total = polygonArea(poly);
  const out: Partial<Record<ZoneId, number>> = {};
  if (!total) return out;
  zoneAreas(poly, centre, northOffset).forEach((area, z) => {
    const pct = Math.round((area / total) * 1000) / 10;
    if (pct > 0) out[ZONE_IDS[z]] = pct;
  });
  return out;
}

export type ZoneStatus = 'ok' | 'cut' | 'extended';
export type Thresholds = {cutBelow: number; extendedAbove: number};
export const DEFAULT_THRESHOLDS: Thresholds = {cutBelow: 70, extendedAbove: 100};

export type ZoneCoverage = {zone: ZoneId; area: number; refArea: number; coveragePct: number; status: ZoneStatus; element: Element};

/**
 * How much of each zone the plot actually fills, against a reference rectangle.
 *
 * ponytail: the reference is the plot's bounding-box shape scaled to the plot's own area
 * and centred on the Brahmasthan. Against the bounding box itself a zone can never pass
 * 100%, so extensions would never show; an equal-area box leaves a plain rectangle at
 * exactly 100% everywhere while a missing corner reads as cut and a protrusion as
 * extended. Swap in a user-drawn reference if experts want a different base.
 */
export function zoneCoverage(
  polygon: Pt[],
  centre: Pt,
  northOffset: number,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): ZoneCoverage[] {
  const area = polygonArea(polygon);
  const xs = polygon.map(p => p.x);
  const ys = polygon.map(p => p.y);
  const bw = Math.max(...xs) - Math.min(...xs);
  const bh = Math.max(...ys) - Math.min(...ys);
  const k = bw && bh ? Math.sqrt(area / (bw * bh)) : 1;
  const hw = (bw * k) / 2;
  const hh = (bh * k) / 2;
  const ref = rectToPoly({x: centre.x - hw, y: centre.y - hh}, {x: centre.x + hw, y: centre.y + hh});
  const actual = zoneAreas(polygon, centre, northOffset);
  const reference = zoneAreas(ref, centre, northOffset);
  return ZONE_IDS.map((zone, z) => {
    const refArea = reference[z];
    const coveragePct = refArea ? Math.round((actual[z] / refArea) * 1000) / 10 : actual[z] ? 999 : 0;
    const status: ZoneStatus =
      coveragePct < thresholds.cutBelow ? 'cut' : coveragePct > thresholds.extendedAbove ? 'extended' : 'ok';
    return {zone, area: actual[z], refArea, coveragePct, status, element: ZONES[zone].element};
  });
}

// ===== Tagged items and the analysis request =====

const rectCentre = (a: Pt, b: Pt): Pt => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2});
export const itemPoint = (it: TaggedItem): Pt => (it.kind === 'point' ? it.p : rectCentre(it.a, it.b));

export type PlacedItem = {type: ItemType; label?: string; zone: ZoneId; pada?: PadaId; zoneSplit?: Partial<Record<ZoneId, number>>};

/** Zone (and pada for doors) of a marker; for a rectangle, the zone holding most of it plus the full split. */
export function placeItem(it: TaggedItem, centre: Pt, northOffset: number): PlacedItem {
  const angle = angleFromCentre(itemPoint(it), centre, northOffset);
  const base: PlacedItem = {type: it.type, zone: zoneOf(angle), ...(it.label ? {label: it.label} : {})};
  if (it.type === 'main_door') base.pada = padaOf(angle);
  if (it.kind === 'rect') {
    const split = rectZoneSplit(it.a, it.b, centre, northOffset);
    const top = (Object.entries(split) as Array<[ZoneId, number]>).sort((x, y) => y[1] - x[1])[0];
    if (top) base.zone = top[0];
    base.zoneSplit = split;
  }
  return base;
}

export type AnalysisRequest = {
  lang: Lang;
  propertyType: PropertyType;
  /** Only for an industrial property. */
  industry?: Industry;
  northOffset: number;
  polygon: Pt[];
  centre: Pt;
  centreAuto: Pt;
  zones: Array<{zone: ZoneId; coveragePct: number; status: ZoneStatus; element: Element}>;
  items: PlacedItem[];
  entrances: Array<{pada: PadaId; zone: ZoneId}>;
  planImageUrl?: string;
};

export function buildAnalysisRequest(input: {
  lang: Lang;
  propertyType?: PropertyType;
  industry?: Industry;
  northOffset: number;
  polygon: Pt[];
  centre: Pt;
  items: TaggedItem[];
  thresholds?: Thresholds;
  planImageUrl?: string;
}): AnalysisRequest {
  const {lang, propertyType = 'home', industry, northOffset, polygon, centre, items, thresholds, planImageUrl} = input;
  const placed = items.map(it => placeItem(it, centre, northOffset));
  return {
    lang,
    propertyType,
    ...(propertyType === 'industrial' && industry ? {industry} : {}),
    northOffset,
    polygon,
    centre,
    centreAuto: polygonCentroid(polygon),
    zones: zoneCoverage(polygon, centre, northOffset, thresholds).map(({zone, coveragePct, status, element}) => ({
      zone,
      coveragePct,
      status,
      element,
    })),
    items: placed,
    entrances: placed.filter(p => p.type === 'main_door' && p.pada).map(p => ({pada: p.pada as PadaId, zone: p.zone})),
    ...(planImageUrl ? {planImageUrl} : {}),
  };
}
