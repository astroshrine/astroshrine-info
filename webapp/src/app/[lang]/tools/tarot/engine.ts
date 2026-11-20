/* eslint-disable */
// @ts-nocheck
// Ported from the AstroShrine app (tarotHtml.ts, @engine-start..@engine-end): pure maths and content tables.
import { PHAL, PRAVRITTI, PHAL_CLS, BAL, BAL_ORDER, balShift, PRAMAAN, shastra, reason, MINOR_BLOCK, HEALTH_NOTE, HEALTH_KAAL_NULL, ym, ageOn } from "../numerology/phalEngine";


/* ---------- Deck ---------- */
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const MAJ = [
 ["The Fool", "द फ़ूल (मूर्ख)", "New beginnings, spontaneity, a leap of faith", "नई शुरुआत, सहजता, विश्वास की छलांग", "Recklessness, naivety, hesitation", "लापरवाही, भोलापन, हिचकिचाहट", "Y"],
 ["The Magician", "द मैजिशियन (जादूगर)", "Willpower, skill, turning ideas into reality", "इच्छाशक्ति, कौशल, विचार को साकार करना", "Manipulation, unused talent, trickery", "छल, अप्रयुक्त प्रतिभा, धोखा", "Y"],
 ["The High Priestess", "द हाई प्रीस्टेस (महापुजारिन)", "Intuition, secrets, inner wisdom", "अंतर्ज्ञान, रहस्य, आंतरिक ज्ञान", "Hidden agendas, ignoring intuition", "छिपे इरादे, अंतर्ज्ञान की अनदेखी", "M"],
 ["The Empress", "द एम्प्रेस (साम्राज्ञी)", "Abundance, nurturing, fertility, creativity", "समृद्धि, पालन-पोषण, उर्वरता, सृजन", "Dependence, creative block, neglect", "निर्भरता, रचनात्मक रुकावट, उपेक्षा", "Y"],
 ["The Emperor", "द एम्परर (सम्राट)", "Authority, structure, stability, a father figure", "अधिकार, अनुशासन, स्थिरता, पिता-तुल्य व्यक्ति", "Rigidity, domination, lack of discipline", "कठोरता, दबदबा, अनुशासनहीनता", "Y"],
 ["The Hierophant", "द हायरोफ़ैंट (धर्मगुरु)", "Tradition, a guide or guru, rituals and institutions", "परंपरा, गुरु का मार्गदर्शन, संस्कार व संस्थाएँ", "Rebellion, an unconventional path", "विद्रोह, परंपरा से हटकर राह", "Y"],
 ["The Lovers", "द लवर्स (प्रेमी)", "Love, harmony, an important choice", "प्रेम, सामंजस्य, एक महत्वपूर्ण चुनाव", "Disharmony, imbalance, a wrong choice", "असामंजस्य, असंतुलन, गलत चुनाव", "Y"],
 ["The Chariot", "द चैरियट (रथ)", "Determination, victory, self-control", "दृढ़ संकल्प, विजय, आत्म-नियंत्रण", "Lack of direction, aggression, obstacles", "दिशाहीनता, आक्रामकता, बाधाएँ", "Y"],
 ["Strength", "स्ट्रेंथ (शक्ति)", "Courage, patience, inner strength", "साहस, धैर्य, आंतरिक शक्ति", "Self-doubt, weakness, insecurity", "आत्म-संदेह, कमज़ोरी, असुरक्षा", "Y"],
 ["The Hermit", "द हर्मिट (साधक)", "Introspection, solitude, inner guidance", "आत्मचिंतन, एकांत, भीतर का मार्गदर्शन", "Isolation, loneliness, withdrawal", "अलगाव, अकेलापन, दूरी बनाना", "M"],
 ["Wheel of Fortune", "व्हील ऑफ़ फ़ॉर्च्यून (भाग्य-चक्र)", "A turn of luck, cycles, destiny", "भाग्य का पलटना, जीवन-चक्र, नियति", "Bad luck, resisting change, setbacks", "दुर्भाग्य, बदलाव का विरोध, झटके", "Y"],
 ["Justice", "जस्टिस (न्याय)", "Fairness, truth, legal matters, cause and effect", "न्याय, सत्य, कानूनी मामले, कर्मफल", "Injustice, dishonesty, an unfair outcome", "अन्याय, बेईमानी, अनुचित परिणाम", "M"],
 ["The Hanged Man", "द हैंग्ड मैन (लटका पुरुष)", "A pause, surrender, a new perspective", "ठहराव, समर्पण, नया दृष्टिकोण", "Stalling, resistance, indecision", "अटकाव, विरोध, अनिर्णय", "M"],
 ["Death", "डेथ (परिवर्तन)", "An ending, transformation, transition (never literal death)", "किसी अध्याय का अंत, रूपांतरण, परिवर्तन (शाब्दिक मृत्यु नहीं)", "Resisting change, stagnation", "बदलाव का विरोध, ठहराव", "N"],
 ["Temperance", "टेम्परेंस (संयम)", "Balance, moderation, patience", "संतुलन, संयम, धैर्य", "Imbalance, excess, impatience", "असंतुलन, अति, अधीरता", "Y"],
 ["The Devil", "द डेविल (बंधन)", "Attachment, addiction, temptation, bondage", "आसक्ति, लत, प्रलोभन, बंधन", "Release, breaking free, detachment", "मुक्ति, बंधन तोड़ना, वैराग्य", "N"],
 ["The Tower", "द टावर (मीनार)", "Sudden upheaval, revelation, the false collapsing (never literal destruction)", "अचानक उथल-पुथल, रहस्योद्घाटन, झूठी नींव का ढहना (शाब्दिक विनाश नहीं)", "A crisis averted, fear of change", "टला हुआ संकट, बदलाव का डर", "N"],
 ["The Star", "द स्टार (तारा)", "Hope, healing, faith, renewal", "आशा, उपचार, विश्वास, नवीनीकरण", "Despair, lack of faith, discouragement", "निराशा, विश्वास की कमी, हताशा", "Y"],
 ["The Moon", "द मून (चंद्रमा)", "Illusion, fear, the subconscious, uncertainty", "भ्रम, भय, अवचेतन मन, अनिश्चितता", "Clarity returning, fear releasing", "स्पष्टता लौटना, भय से मुक्ति", "M"],
 ["The Sun", "द सन (सूर्य)", "Success, joy, vitality, positivity", "सफलता, आनंद, ऊर्जा, सकारात्मकता", "A temporary setback, over-optimism", "अस्थायी रुकावट, अति-आशावाद", "Y"],
 ["Judgement", "जजमेंट (जागृति)", "Awakening, reckoning, a second chance", "जागृति, आत्म-मूल्यांकन, दूसरा अवसर", "Self-doubt, refusing the inner call", "आत्म-संदेह, भीतर की पुकार अनसुनी करना", "Y"],
 ["The World", "द वर्ल्ड (संसार)", "Completion, achievement, travel, fulfilment", "पूर्णता, उपलब्धि, यात्रा, संतोष", "Incompletion, delays, lack of closure", "अधूरापन, देरी, समापन न होना", "Y"]];
const RANKS = [["Ace", "ऐस"], ["Two", "टू"], ["Three", "थ्री"], ["Four", "फ़ोर"], ["Five", "फ़ाइव"], ["Six", "सिक्स"], ["Seven", "सेवन"], ["Eight", "एट"], ["Nine", "नाइन"], ["Ten", "टेन"], ["Page", "पेज"], ["Knight", "नाइट"], ["Queen", "क्वीन"], ["King", "किंग"]];
const RANK_SHORT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'P', 'Kn', 'Q', 'K'];
const SUITS = [
 {k: 'w', en: 'Wands', hi: 'वैंड्स', el: ['Fire', 'अग्नि'], sym: '♣', cards: [
  ["New spark, inspiration, a bold start", "नई प्रेरणा, जोश, साहसी शुरुआत", "Delays, lack of drive, a false start", "देरी, उत्साह की कमी, अधूरी शुरुआत", "Y"],
  ["Planning, future vision, deciding a direction", "योजना, दूरदृष्टि, दिशा का निर्णय", "Fear of change, poor planning", "बदलाव का डर, कमज़ोर योजना", "M"],
  ["Expansion, progress, waiting for results, links abroad", "विस्तार, प्रगति, परिणाम की प्रतीक्षा, विदेशी संबंध", "Obstacles and delays in plans", "योजनाओं में रुकावट व देरी", "Y"],
  ["Celebration, harmony, home, stability", "उत्सव, सामंजस्य, घर-परिवार, स्थिरता", "Unsettled home, transition, lack of support", "घर में अस्थिरता, बदलाव, सहयोग की कमी", "Y"],
  ["Competition, conflict, rivalry", "प्रतिस्पर्धा, टकराव, होड़", "Avoiding conflict, tension easing", "टकराव से बचना, तनाव कम होना", "N"],
  ["Victory, recognition, success", "विजय, मान-सम्मान, सफलता", "Ego, loss of standing, no recognition", "अहंकार, प्रतिष्ठा में कमी, पहचान न मिलना", "Y"],
  ["Standing your ground, perseverance", "अपनी बात पर डटे रहना, दृढ़ता", "Overwhelmed, giving up, exhaustion", "दबाव में टूटना, हार मानना, थकान", "M"],
  ["Swift movement, news, travel", "तेज़ गति, समाचार, यात्रा", "Delays, frustration, waiting", "देरी, झुंझलाहट, इंतज़ार", "Y"],
  ["Resilience, a last stand, persistence", "सहनशीलता, अंतिम संघर्ष, धैर्य", "Fatigue, mistrust, over-defensiveness", "थकान, अविश्वास, अति-सुरक्षा", "M"],
  ["Burden, responsibility, hard work", "बोझ, ज़िम्मेदारी, कड़ी मेहनत", "Releasing burdens, delegating", "बोझ उतारना, काम बाँटना", "N"],
  ["Enthusiasm, exploration, good news", "उत्साह, खोज, शुभ समाचार", "Setbacks, no direction, impatience", "रुकावट, दिशा का अभाव, अधीरता", "Y"],
  ["Energy, adventure, impulsive action", "ऊर्जा, साहसिक कदम, जल्दबाज़ी", "Recklessness, scattered energy, delays", "लापरवाही, बिखरी ऊर्जा, देरी", "Y"],
  ["Confidence, warmth, determination", "आत्मविश्वास, गर्मजोशी, दृढ़ निश्चय", "Jealousy, insecurity, being demanding", "ईर्ष्या, असुरक्षा, हठ", "Y"],
  ["Leadership, vision, entrepreneurship", "नेतृत्व, दूरदृष्टि, उद्यमशीलता", "Impulsiveness, arrogance, unrealistic expectations", "आवेग, अहंकार, अति-अपेक्षा", "Y"]]},
 {k: 'c', en: 'Cups', hi: 'कप्स', el: ['Water', 'जल'], sym: '♥', cards: [
  ["New love, an emotional beginning, compassion", "नया प्रेम, भावनात्मक शुरुआत, करुणा", "Blocked feelings, emptiness", "दबी भावनाएँ, खालीपन", "Y"],
  ["Partnership, mutual attraction, union", "साझेदारी, आपसी आकर्षण, मिलन", "Imbalance, separation, miscommunication", "असंतुलन, अलगाव, गलतफ़हमी", "Y"],
  ["Celebration, friendship, community", "उत्सव, मित्रता, सामाजिक मेल-जोल", "Over-indulgence, gossip, isolation", "अति-भोग, चुगली, अकेलापन", "Y"],
  ["Apathy, contemplation, missed offers", "उदासीनता, आत्मचिंतन, छूटते अवसर", "New awareness, accepting what is offered", "नई जागरूकता, अवसर स्वीकारना", "N"],
  ["Loss, regret, grief", "हानि, पछतावा, दुःख", "Acceptance, moving on, healing", "स्वीकार, आगे बढ़ना, घाव भरना", "N"],
  ["Nostalgia, childhood memories, innocence", "पुरानी यादें, बचपन, मासूमियत", "Stuck in the past", "अतीत में अटके रहना", "Y"],
  ["Many choices, illusion, wishful thinking", "कई विकल्प, भ्रम, कल्पनाएँ", "Clarity, a firm choice", "स्पष्टता, ठोस निर्णय", "M"],
  ["Walking away, seeking deeper meaning", "किसी चीज़ को छोड़कर आगे बढ़ना, गहरे अर्थ की खोज", "Fear of moving on, stagnation", "आगे बढ़ने का डर, ठहराव", "N"],
  ["Wish fulfilled, contentment, satisfaction", "मनोकामना पूर्ण, संतोष, तृप्ति", "Unfulfilled wishes, smugness", "अधूरी इच्छाएँ, आत्म-मुग्धता", "Y"],
  ["Family happiness, harmony, fulfilment", "पारिवारिक सुख, सामंजस्य, पूर्णता", "Family conflict, broken harmony", "पारिवारिक कलह, बिगड़ा सामंजस्य", "Y"],
  ["A creative offer, an intuitive message, affection", "रचनात्मक प्रस्ताव, अंतर्ज्ञान का संदेश, स्नेह", "Emotional immaturity, creative block", "भावनात्मक अपरिपक्वता, रचनात्मक रुकावट", "Y"],
  ["Romance, charm, a proposal", "रोमांस, आकर्षण, प्रस्ताव", "Moodiness, unrealistic promises", "मूडी स्वभाव, अवास्तविक वादे", "Y"],
  ["Compassion, calm, emotional security", "करुणा, शांति, भावनात्मक सुरक्षा", "Insecurity, emotional dependence", "असुरक्षा, भावनात्मक निर्भरता", "Y"],
  ["Emotional balance, diplomacy, generosity", "भावनात्मक संतुलन, कूटनीति, उदारता", "Manipulation, moodiness, coldness", "छल, मनमौजीपन, रूखापन", "Y"]]},
 {k: 's', en: 'Swords', hi: 'स्वॉर्ड्स', el: ['Air', 'वायु'], sym: '♠', cards: [
  ["Clarity, a breakthrough, truth", "स्पष्टता, बड़ी सफलता, सत्य", "Confusion, misinformation", "भ्रम, गलत जानकारी", "Y"],
  ["Stalemate, a difficult choice, avoidance", "दुविधा, कठिन निर्णय, टालना", "Indecision lifting, facts coming out", "दुविधा हटना, सच सामने आना", "M"],
  ["Heartbreak, sorrow, a painful truth", "दिल टूटना, दुःख, कड़वा सच", "Recovery, forgiveness, releasing pain", "उबरना, क्षमा, पीड़ा से मुक्ति", "N"],
  ["Rest, recovery, contemplation", "विश्राम, स्वास्थ्य-लाभ, चिंतन", "Restlessness, burnout, back to action", "बेचैनी, थकावट, फिर से सक्रियता", "M"],
  ["Conflict, defeat, winning at any cost", "विवाद, हार, हर कीमत पर जीत", "Reconciliation, making amends", "सुलह, भूल सुधार", "N"],
  ["Transition, moving on, travel", "बदलाव, आगे बढ़ना, यात्रा", "Resisting change, unfinished business", "बदलाव का विरोध, अधूरा काम", "Y"],
  ["Deception, strategy, stealth", "छल, रणनीति, छुपी चाल", "Coming clean, a troubled conscience", "सच स्वीकारना, आत्म-ग्लानि", "N"],
  ["Restriction, feeling trapped, self-limiting beliefs", "बंधन, फँसा हुआ महसूस करना, स्व-सीमित सोच", "Release, a new perspective, freedom", "मुक्ति, नया दृष्टिकोण, स्वतंत्रता", "N"],
  ["Anxiety, worry, sleepless nights", "चिंता, बेचैनी, अनिद्रा", "Hope, reaching out, recovering from fear", "आशा, मदद माँगना, डर से उबरना", "N"],
  ["A painful ending, rock bottom, betrayal", "दुखद अंत, सबसे कठिन दौर, विश्वासघात", "Recovery, regeneration, the worst is over", "उबरना, पुनर्जीवन, सबसे बुरा समय बीत गया", "N"],
  ["Curiosity, new ideas, vigilance", "जिज्ञासा, नए विचार, सतर्कता", "Gossip, hasty words, deception", "अफ़वाह, जल्दबाज़ी में बोलना, छल", "M"],
  ["Ambition, fast action, assertiveness", "महत्वाकांक्षा, तेज़ कार्रवाई, दृढ़ता", "Impulsiveness, aggression, burnout", "आवेग, आक्रामकता, थकावट", "M"],
  ["Independence, clear boundaries, honesty", "स्वतंत्रता, स्पष्ट सीमाएँ, ईमानदारी", "Coldness, bitterness, harsh words", "रूखापन, कड़वाहट, कठोर वचन", "M"],
  ["Intellect, authority, truth, fair judgement", "बुद्धि, अधिकार, सत्य, निष्पक्ष निर्णय", "Misuse of power, manipulation, rigidity", "अधिकार का दुरुपयोग, छल, कठोरता", "M"]]},
 {k: 'p', en: 'Pentacles', hi: 'पेंटाकल्स', el: ['Earth', 'पृथ्वी'], sym: '♦', cards: [
  ["A new financial opportunity, prosperity", "नया आर्थिक अवसर, समृद्धि", "A missed opportunity, poor planning", "छूटा अवसर, कमज़ोर योजना", "Y"],
  ["Balancing priorities, adaptability", "कई कामों में संतुलन, अनुकूलन", "Overwhelm, disorganisation", "अत्यधिक बोझ, अव्यवस्था", "M"],
  ["Teamwork, skill, collaboration", "टीमवर्क, कौशल, सहयोग", "Poor teamwork, poor quality", "सहयोग की कमी, घटिया काम", "Y"],
  ["Saving, security, control", "बचत, सुरक्षा, नियंत्रण", "Greed, materialism, overspending", "लालच, भौतिकता, फिज़ूलखर्ची", "M"],
  ["Financial loss, hardship, isolation", "आर्थिक हानि, कठिनाई, अकेलापन", "Recovery from loss, help arrives", "हानि से उबरना, सहायता मिलना", "N"],
  ["Generosity, giving and receiving, charity", "उदारता, लेन-देन, दान", "Debt, one-sided giving, strings attached", "कर्ज़, एकतरफ़ा देना, शर्तों वाली मदद", "Y"],
  ["Patience, long-term investment, assessment", "धैर्य, दीर्घकालिक निवेश, मूल्यांकन", "Impatience, poor returns", "अधीरता, कम लाभ", "M"],
  ["Diligence, mastery, building skill", "लगन, दक्षता, कौशल निखारना", "Perfectionism, lack of focus", "अति-पूर्णतावाद, ध्यान की कमी", "Y"],
  ["Abundance, self-sufficiency, comfort", "समृद्धि, आत्मनिर्भरता, सुख-सुविधा", "Over-investment in work, financial setbacks", "काम में अति-निवेश, आर्थिक झटका", "Y"],
  ["Wealth, family legacy, lasting success", "धन, पारिवारिक विरासत, स्थायी सफलता", "Family disputes over money, instability", "धन को लेकर पारिवारिक विवाद, अस्थिरता", "Y"],
  ["Study, a new venture, making plans real", "अध्ययन, नया उद्यम, लक्ष्य साकार करना", "Lack of progress, procrastination", "प्रगति की कमी, टालमटोल", "Y"],
  ["Hard work, routine, reliability", "कड़ी मेहनत, नियमितता, विश्वसनीयता", "Boredom, stagnation, laziness", "ऊब, ठहराव, आलस्य", "Y"],
  ["Nurturing, practicality, financial security", "पालन-पोषण, व्यावहारिकता, आर्थिक सुरक्षा", "Work-home imbalance, self-neglect", "काम-घर में असंतुलन, स्वयं की उपेक्षा", "Y"],
  ["Wealth, business success, security", "धन, व्यापार में सफलता, सुरक्षा", "Greed, stubbornness, mismanaged money", "लालच, ज़िद, धन का कुप्रबंधन", "Y"]]}];
/* Deck order: 0-21 majors, then 14 cards per suit. */
const DECK = [];
MAJ.forEach(function (m: any, i: any) { DECK.push({id: i, major: true, num: i, en: m[0], hi: m[1], up: [m[2], m[3]], rv: [m[4], m[5]], yn: m[6], suit: null}); });
SUITS.forEach(function (s: any) { s.cards.forEach(function (c: any, r: any) { DECK.push({id: DECK.length, major: false, rank: r, suit: s, en: RANKS[r][0] + ' of ' + s.en, hi: RANKS[r][1] + ' ऑफ़ ' + s.hi, up: [c[0], c[1]], rv: [c[2], c[3]], yn: c[4]}); }); });

/* Celtic Cross in Waite's order (Pictorial Key §7): covers, crosses, crowns, beneath, behind, before, self, house, hopes, outcome.
   w: position weights for the phaladesh (none: 1 each, 1.5 on the outcome); time: the future-facing
   positions whose cards give the time window; advice: the position read as "what to do". */
const SPREADS = {
  one: {en: 'One card — guidance', hi: 'एक कार्ड — मार्गदर्शन', pos: [['Guidance', 'मार्गदर्शन']], w: [1], time: [0]},
  yesno: {en: 'Yes / No (3 cards)', hi: 'हाँ / ना (3 कार्ड)', pos: [['Card 1', 'कार्ड 1'], ['Card 2', 'कार्ड 2'], ['Card 3', 'कार्ड 3']], yesno: true, w: [1, 1, 1], time: [0, 1, 2]},
  ppf: {en: 'Past · Present · Future', hi: 'अतीत · वर्तमान · भविष्य', pos: [['Past', 'अतीत'], ['Present', 'वर्तमान'], ['Future', 'भविष्य']], outcome: 2, w: [0.5, 1, 1.5], time: [2]},
  sao: {en: 'Situation · Obstacle · Advice', hi: 'स्थिति · बाधा · सलाह', pos: [['Situation', 'स्थिति'], ['Obstacle', 'बाधा'], ['Advice', 'सलाह']], advice: 2, time: []},
  rel: {en: 'Relationship (5 cards)', hi: 'संबंध (5 कार्ड)', pos: [['You', 'आप'], ['Partner', 'साथी'], ['The connection', 'आपसी संबंध'], ['Challenge', 'चुनौती'], ['Outcome', 'परिणाम']], outcome: 4, w: [1, 1, 1, 0.75, 1.5], time: [4]},
  career: {en: 'Career (5 cards)', hi: 'करियर (5 कार्ड)', pos: [['Present situation', 'वर्तमान स्थिति'], ['Your strength', 'आपकी शक्ति'], ['Obstacle', 'बाधा'], ['Action to take', 'क्या करें'], ['Likely outcome', 'संभावित परिणाम']], outcome: 4, advice: 3, w: [1, 1, 0.75, 1, 1.5], time: [4]},
  celtic: {en: 'Celtic Cross (10 cards)', hi: 'सेल्टिक क्रॉस (10 कार्ड)', pos: [['Present', 'वर्तमान'], ['Challenge', 'चुनौती'], ['Best possible', 'सर्वोत्तम संभावना'], ['Foundation', 'जड़ / आधार'], ['Recent past', 'हाल का अतीत'], ['Near future', 'निकट भविष्य'], ['Self', 'स्वयं'], ['Environment', 'परिवेश'], ['Hopes & fears', 'आशाएँ व भय'], ['Outcome', 'परिणाम']], outcome: 9,
    w: [1, 0.75, 1, 0.5, 0.5, 1.25, 0.75, 0.5, 0.5, 1.5], time: [5, 9]}
};
const TOPIC = {general: ['General', 'सामान्य'], love: ['Love & relationship', 'प्रेम व संबंध'], career: ['Career & work', 'करियर व काम'], money: ['Money', 'धन'], health: ['Health & wellbeing', 'स्वास्थ्य'], spiritual: ['Spiritual growth', 'आध्यात्मिक उन्नति']};

/* ---------- Birth card (Kosh 5.2) ---------- */
function digitSum(n: any) { return String(n).split('').reduce(function (a: any, d: any) { return a + +d; }, 0); }
/** Arrien / Greer: month + day + year as whole numbers, digits added until 22 or less (22 = The Fool).
    chain = the card, then for 10-21 its reduced partners (19 -> 10 -> 1). dob 'YYYY-MM-DD'. */
function birthCard(dob: any) {
  var p = dob.split('-').map(Number), n = p[0] + p[1] + p[2];
  while (n > 22) n = digitSum(n);
  if (n === 22) n = 0;
  var chain = [n];
  while (n >= 10) { n = digitSum(n); chain.push(n); }
  return {num: chain[0], chain: chain};
}
const BIRTH_SRC = shastra('Angeles Arrien / Mary K. Greer (birth-card method)', 'एंजेल्स एरियन / मेरी के. ग्रीयर (जन्म-कार्ड विधि)', null, 'adhunik_parampara');

/* ---------- Phaladesh: Waite card polarity, position weights, deck-average correction (Kosh 2, 3.6) ---------- */
/* No-cards whose reversed meaning is the difficulty easing (Kosh 3.6: a reversed card has its own meaning):
   Devil, Five and Ten of Wands, Four and Five of Cups, Three, Five, Seven-Ten of Swords, Five of Pentacles. */
const RV_EASE = {15: 1, 26: 1, 31: 1, 39: 1, 40: 1, 52: 1, 54: 1, 56: 1, 57: 1, 58: 1, 59: 1, 68: 1};
/** Card value: upright yes +1, no −1, maybe 0; reversed yes 0, maybe 0, no −1 (0 when its reversed meaning eases). */
function ynValue(c: any) { var v = DECK[c.id].yn; if (!c.rev) return v === 'Y' ? 1 : v === 'N' ? -1 : 0; return v === 'N' && !RV_EASE[c.id] ? -1 : 0; }
/** Lean of the Yes / No card, taken from the phal so the two never disagree: 1 yes, −1 no, 0 unclear. */
function ynLean(phal: any) { return phal === 'asiddhi' ? -1 : phal === 'anirnit' ? 0 : 1; }
/** Mean card value over all 78: upright only, or a 50/50 upright/reversed mix. */
function deckMean(useRev: any) {
  return DECK.reduce(function (a: any, d: any) { return a + (useRev ? (ynValue({id: d.id}) + ynValue({id: d.id, rev: true})) / 2 : ynValue({id: d.id})); }, 0) / DECK.length;
}
function posWeights(sp: any) { return sp.w || sp.pos.map(function (_: any, i: any) { return i === sp.outcome ? 1.5 : 1; }); }
const WAITE = shastra('A.E. Waite, The Pictorial Key to the Tarot (1910)', 'ए.ई. वेट, द पिक्टोरियल की टू द टैरो (1910)', null, 'adhunik_parampara');
const BOOK_T = shastra('Golden Dawn, Book T', 'गोल्डन डॉन, Book T', null, 'adhunik_parampara');
const AS_RULE = shastra('AstroShrine rule', 'AstroShrine नियम', null, 'koi_shastra_nahin');
const LEAN = {'1': ['a yes card', 'हाँ-कार्ड'], '0': ['neutral', 'तटस्थ'], '-1': ['a no card', 'ना-कार्ड']};
function signed(x: any) { return (x < 0 ? '−' : '+') + Math.abs(x).toFixed(2); }

/* ---------- Time window: Golden Dawn Book T decan / sign, Sun transit ---------- */
const RASHI = [['Aries', 'मेष'], ['Taurus', 'वृषभ'], ['Gemini', 'मिथुन'], ['Cancer', 'कर्क'], ['Leo', 'सिंह'], ['Virgo', 'कन्या'], ['Libra', 'तुला'], ['Scorpio', 'वृश्चिक'], ['Sagittarius', 'धनु'], ['Capricorn', 'मकर'], ['Aquarius', 'कुंभ'], ['Pisces', 'मीन']];
/* Zodiacal majors (Waite numbering: VIII Strength, XI Justice) -> sign; pips 2-10 -> three signs of the suit, a decan each. */
const BOOKT_MAJ = {4: 0, 5: 1, 6: 2, 7: 3, 8: 4, 9: 5, 11: 6, 13: 7, 14: 8, 15: 9, 17: 10, 18: 11};
const BOOKT_PIP = {w: [0, 4, 8], c: [3, 7, 11], s: [6, 10, 2], p: [9, 1, 5]};
/** A card's tropical arc {sign, decan (0 = whole sign), lo, len} in degrees, or null (aces, courts, other majors). */
function bookT(id: any) {
  var d = DECK[id];
  if (d.major) return BOOKT_MAJ[d.num] == null ? null : {sign: BOOKT_MAJ[d.num], decan: 0, lo: BOOKT_MAJ[d.num] * 30, len: 30};
  if (d.rank < 1 || d.rank > 9) return null;
  var sign = BOOKT_PIP[d.suit.k][Math.floor((d.rank - 1) / 3)], dec = (d.rank - 1) % 3;
  return {sign: sign, decan: dec + 1, lo: sign * 30 + dec * 10, len: 10};
}
const DAY = 86400000;
/** Apparent tropical longitude of the Sun (deg) at a UTC time in ms; Meeus ch. 25, low precision (~0.01°). */
function sunLon(ms: any) {
  var T = (ms / DAY + 2440587.5 - 2451545) / 36525, r = Math.PI / 180;
  var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T, M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * r;
  var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  var lon = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * r);
  return ((lon % 360) + 360) % 360;
}
/** The first run of days on/after from ('YYYY-MM-DD') with the Sun (noon UTC) inside the arc: {start, end} in ms. */
function sunWindow(arc: any, from: any) {
  var p = from.split('-').map(Number), d0 = Date.UTC(p[0], p[1] - 1, p[2], 12), start = null;
  for (var i = 0; i < 800; i++) {
    var inside = (sunLon(d0 + i * DAY) - arc.lo + 360) % 360 < arc.len;
    if (inside && start === null) start = d0 + i * DAY;
    if (!inside && start !== null) return {start: start, end: d0 + (i - 1) * DAY};
  }
  return null;
}
function msYm(ms: any) { var d = new Date(ms); return ym(d.getUTCFullYear(), d.getUTCMonth() + 1); }
function msDmy(ms: any) { var d = new Date(ms); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); }
/** The month holding most days of a window (the earlier one on a tie). */
function mainMonth(w: any) {
  var cnt = {}, best = null;
  for (var x = w.start; x <= w.end; x += DAY) { var k = msYm(x); cnt[k] = (cnt[k] || 0) + 1; if (!best || cnt[k] > cnt[best]) best = k; }
  return best;
}
/** {kaal} from the timing cards, or {nul: [en, hi]} when none of them carries a date. */
function tarotKaal(cards: any, sp: any, date: any) {
  if (!sp.time.length) return {nul: ['none, since this spread has no future position to time.', 'नहीं, क्योंकि इस स्प्रेड में भविष्य का कोई स्थान नहीं है।']};
  var wins = [];
  sp.time.forEach(function (i: any) { var arc = bookT(cards[i].id), w = arc && sunWindow(arc, date); if (w) wins.push({i: i, arc: arc, w: w}); });
  if (!wins.length) return {nul: ['none of the future-position cards carries a Golden Dawn decan or sign (aces, court cards and the other majors carry no date).', 'भविष्य-स्थान के किसी भी कार्ड का गोल्डन डॉन दशांश या राशि नहीं है (ऐस, कोर्ट कार्ड और शेष मेजर कार्ड तिथि नहीं देते)।']};
  var first = wins.reduce(function (a: any, x: any) { return x.w.start < a.w.start ? x : a; });
  var last = wins.reduce(function (a: any, x: any) { return x.w.end > a.w.end ? x : a; });
  var oc = wins.filter(function (x: any) { return x.i === sp.outcome; })[0] || first;
  var part = function (x: any, L: any) {
    var d = DECK[cards[x.i].id], a = x.arc;
    return sp.pos[x.i][L] + ': ' + (L ? d.hi : d.en) + ' — ' + RASHI[a.sign][L] + (L ? ' (सायन)' : ' (tropical)') +
      (a.decan ? (L ? ', दशांश ' : ', decan ') + a.decan + ' (' + (a.decan - 1) * 10 + '°–' + a.decan * 10 + '°)' : '') +
      (L ? ', सूर्य वहाँ ' : ', Sun there ') + msDmy(x.w.start) + ' – ' + msDmy(x.w.end);
  };
  // The search for each card's window starts on the reading date, so a window already open today has start = that date.
  var d0 = (function () { var p = date.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2], 12); })();
  return {kaal: {from: msYm(first.w.start), to: msYm(last.w.end), sabse_sambhavit: mainMonth(oc.w), now: first.w.start === d0,
    aadhar: [wins.map(function (x: any) { return part(x, 0); }).join('; ') + '. Golden Dawn (Book T) correspondence.',
      wins.map(function (x: any) { return part(x, 1); }).join('; ') + '। गोल्डन डॉन (Book T) का संबंध।'],
    vidhi: 'golden_dawn_book_t'}};
}

/** The phal object for a reading. o: {cards [{id, rev}], spreadKey, topic, useRev, date 'YYYY-MM-DD', dob 'YYYY-MM-DD' or ''}. */
function tarotPhal(o: any) {
  var sp = SPREADS[o.spreadKey], cards = o.cards;
  var p = {topic: TOPIC[o.topic], phal: 'anirnit', bal: 'durbal', anirnit_reason: null, alt: null, kaal_khand: null, kaal_khand_null: null, reasons: [], kya_karen: [], note: null, blocked: null};
  if (o.dob && (o.topic === 'love' || o.topic === 'money' || o.topic === 'health') && ageOn(o.dob, o.date) < 18) { p.blocked = MINOR_BLOCK; return p; }
  var w = posWeights(sp), useRev = o.useRev || cards.some(function (c: any) { return c.rev; }), mu = deckMean(useRev), sum = 0, sw = 0;
  cards.forEach(function (c: any, i: any) {
    var d = DECK[c.id], v = ynValue(c), x = v - mu, mean = c.rev ? d.rv : d.up;
    sum += w[i] * x; sw += w[i];
    if (Math.abs(x) < 1e-9) return;
    p.reasons.push(reason('tarot_card', sp.pos[i][0] + ': ' + d.en + (c.rev ? ', reversed — in the Rider–Waite–Smith tradition a reversed card has its own meaning, not the opposite of upright: ' : ', upright — meaning in the Rider–Waite–Smith tradition: ') +
      mean[0] + '. Counts as ' + LEAN[v][0] + '; ' + signed(x) + ' after the deck-average correction, weight ' + w[i] + '.',
      sp.pos[i][1] + ': ' + d.hi + (c.rev ? ', उल्टा — राइडर–वेट–स्मिथ परंपरा में उल्टे कार्ड का अपना अलग अर्थ है, सीधे अर्थ का विपरीत नहीं: ' : ', सीधा — राइडर–वेट–स्मिथ परंपरा में अर्थ: ') +
      mean[1] + '। ' + LEAN[v][1] + ' के रूप में गिना गया; डेक-औसत सुधार के बाद ' + signed(x) + ', भार ' + w[i] + '।', x > 0 ? 1 : -1, WAITE));
  });
  var score = sum / sw, oc = sp.outcome != null ? cards[sp.outcome] : null;
  p.score = score;
  p.phal = score >= 0.45 ? 'siddhi' : score >= 0.2 ? 'siddhi_vilamb' : score >= 0.05 ? 'aanshik' : score <= -0.2 ? 'asiddhi' : 'anirnit';
  if (p.phal === 'siddhi' && oc && oc.rev) p.phal = 'siddhi_vilamb';
  if (p.phal === 'anirnit') {
    var fx = p.reasons.map(function (r: any) { return r.effect; });
    p.anirnit_reason = fx.indexOf(1) >= 0 && fx.indexOf(-1) >= 0 ? ['the supporting and opposing cards balance out.', 'समर्थक और विरोधी कार्ड लगभग बराबर हैं।']
      : ['the cards lean too weakly either way to decide.', 'कार्ड किसी भी ओर पर्याप्त झुकाव नहीं दिखाते।'];
  }
  var a = Math.abs(score);
  p.bal = a >= 0.6 ? 'prabal' : a >= 0.3 ? 'madhyam' : 'durbal';
  if ((cards.length === 1 || o.topic === 'health') && p.bal === 'prabal') p.bal = 'madhyam';
  p.reasons.push(reason('tarot_deck_mean', 'Deck-average correction: a card drawn at random scores ' + signed(mu) + (useRev ? ' (upright and reversed mixed 50/50)' : ' (upright only)') +
    ' on average, so each card counts as its value minus that and a random draw averages 0. Weighted score ' + signed(score) + '. Weights and thresholds are preliminary.',
    'डेक-औसत सुधार: यादृच्छिक कार्ड का औसत मान ' + signed(mu) + (useRev ? ' (सीधे व उल्टे 50/50)' : ' (केवल सीधे)') +
    ' है, इसलिए हर कार्ड का मान उतना घटाकर गिना गया; यादृच्छिक खिंचाई का औसत 0 रहता है। भारित अंक ' + signed(score) + '। भार एवं सीमा-मान प्रारंभिक हैं।', 0, AS_RULE));
  if (o.topic === 'health') { p.pravritti = true; p.kaal_khand_null = HEALTH_KAAL_NULL; p.note = HEALTH_NOTE; }
  else {
    p.note = ['Tarot has no Indian shastra: card meanings follow the Rider–Waite–Smith tradition (A.E. Waite, 1910) and timing the Golden Dawn Book T, both modern Western tradition.',
      'टैरो का कोई भारतीय शास्त्र नहीं है: कार्ड-अर्थ राइडर–वेट–स्मिथ परंपरा (ए.ई. वेट, 1910) और समय-निर्धारण गोल्डन डॉन की Book T पर आधारित हैं, दोनों आधुनिक पाश्चात्य परंपरा।'];
    if (p.phal === 'asiddhi') p.kaal_khand_null = ['none, since the verdict is no success in this period.', 'नहीं, क्योंकि इस अवधि में सिद्धि का योग नहीं है।'];
    else if (p.phal === 'anirnit') p.kaal_khand_null = ['none while the verdict is undecided.', 'नहीं, क्योंकि फल अनिर्णीत है।'];
    else {
      var k = tarotKaal(cards, sp, o.date);
      if (k.kaal) {
        p.kaal_khand = k.kaal;
        p.reasons.push(reason('tarot_book_t', 'Timing: Book T links each pip 2–10 to a 10° decan and each zodiacal major to a sign; the window is the next passage of the Sun through the future-position cards.',
          'समय: Book T हर 2–10 पिप कार्ड को 10° का एक दशांश और हर राशि-संबद्ध मेजर कार्ड को एक राशि देता है; कालखंड वह अवधि है जब सूर्य अगली बार भविष्य-स्थान के कार्डों से गुज़रेगा।', 0, BOOK_T));
      } else p.kaal_khand_null = k.nul;
    }
  }
  if (o.topic !== 'health') p.kya_karen.push({
    siddhi: ['Go ahead with the plan; the cards support it.', 'योजना पर आगे बढ़ें; कार्ड इसका समर्थन करते हैं।'],
    siddhi_vilamb: ['Keep at it with patience; expect delay or extra effort before the result.', 'धैर्य से प्रयास जारी रखें; परिणाम से पहले विलंब या अतिरिक्त मेहनत संभव है।'],
    aanshik: ['Expect part of what is hoped for; set a realistic first goal.', 'आशा का कुछ भाग पूरा होने की संभावना है; पहले एक व्यावहारिक लक्ष्य रखें।'],
    asiddhi: ['Do not force the matter in this period; review the plan and ask again after some time.', 'इस अवधि में विषय पर ज़ोर न दें; योजना पर पुनर्विचार करें और कुछ समय बाद फिर पूछें।'],
    anirnit: ['Ask again later with one clear, specific question.', 'कुछ समय बाद एक स्पष्ट, एक-विषयी प्रश्न के साथ फिर पूछें।']}[p.phal]);
  if (p.kaal_khand) p.kya_karen.push(['Plan the key step for the time window above.', 'मुख्य कदम ऊपर दिए कालखंड में उठाने की योजना बनाएँ।']);
  if (sp.advice != null && o.topic !== 'health') {
    var ad = DECK[cards[sp.advice].id], am = cards[sp.advice].rev ? ad.rv : ad.up;
    p.kya_karen.push(['Advice card, ' + ad.en + ': ' + am[0] + '.', 'सलाह कार्ड, ' + ad.hi + ': ' + am[1] + '।']);
  }
  if (o.topic === 'health') p.kya_karen.push(['For any health concern, see a qualified doctor; tarot is not a medical tool.', 'स्वास्थ्य की किसी भी चिंता के लिए योग्य चिकित्सक से मिलें; टैरो चिकित्सा का साधन नहीं है।']);
  return p;
}


export { ROMAN, MAJ, RANKS, RANK_SHORT, SUITS, DECK, SPREADS, TOPIC, digitSum, birthCard, BIRTH_SRC, RV_EASE, ynValue, ynLean, deckMean, posWeights, WAITE, BOOK_T, AS_RULE, LEAN, signed, RASHI, BOOKT_MAJ, BOOKT_PIP, bookT, DAY, sunLon, sunWindow, msYm, msDmy, mainMonth, tarotKaal, tarotPhal };
export { PRAMAAN };
