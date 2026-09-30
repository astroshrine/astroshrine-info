// Hindi / English switch for the homepage.
// English is the source text in index.html; this swaps visible text nodes
// (and a few attributes) to Hindi from the dictionary below, and back.
// The phone mock-ups (.af) are left as they are — they show the real app UI.
(() => {
    const HI = {
        "AstroShrine — Where Faith Meets Divinity": "एस्ट्रोश्राइन — जहाँ आस्था मिलती है दिव्यता से",
        "Faith • Astrology • Life Solutions": "आस्था • ज्योतिष • जीवन समाधान",
        "Home": "होम",
        "Services": "सेवाएँ",
        "The App": "ऐप",
        "Pujas": "पूजा",
        "Articles": "लेख",
        "Get the App": "ऐप डाउनलोड करें",
        "Vedic Astrology App": "वैदिक ज्योतिष ऐप",
        "Verified astrologers se chat aur call, free Kundli, daily rashifal, Mahakal Dham se puja booking aur certified gemstones — ek hi app mein, Hindi aur English dono mein.":
            "सत्यापित ज्योतिषियों से चैट और कॉल, मुफ़्त कुंडली, दैनिक राशिफल, महाकाल धाम से पूजा बुकिंग और प्रमाणित रत्न — एक ही ऐप में, हिंदी और अंग्रेज़ी दोनों में।",
        "Chat · 75 pts / 5 min": "चैट · 75 पॉइंट / 5 मिनट",
        "Call · 200 pts / 10 min": "कॉल · 200 पॉइंट / 10 मिनट",
        "Get it on": "डाउनलोड करें",
        "Coming soon on": "जल्द आ रहा है",
        "Chaliye, AstroShrine par baat karein!": "चलिए, एस्ट्रोश्राइन पर बात करें!",
        "Available right now": "अभी उपलब्ध",
        "60+ Vedic Astrologers": "60+ वैदिक ज्योतिषी",
        "Welcome bonus": "वेलकम बोनस",
        "200 points free": "200 पॉइंट मुफ़्त",
        "AstroShrine App": "एस्ट्रोश्राइन ऐप",

        // temples
        "On the banks of the sacred Kharun river": "पवित्र खारुन नदी के तट पर",
        "Shree Amleshwar": "श्री अमलेश्वर",
        "Mahakaal Dham": "महाकाल धाम",
        "The divine abode of Swayambhu Shiva — experience faith… trust the blessings!": "स्वयंभू शिव का दिव्य धाम — आस्था का अनुभव करें… आशीर्वाद पर भरोसा रखें!",
        "Vedic Puja": "वैदिक पूजा",
        "Experienced Acharyas": "अनुभवी आचार्य",
        "Puja Photos/Videos": "पूजा फ़ोटो/वीडियो",
        "Online Booking": "ऑनलाइन बुकिंग",
        "Your faith, our service": "आपकी आस्था, हमारी सेवा",
        "Book a Puja": "पूजा बुक करें",
        "Talk to Pandit Ji": "पंडित जी से बात करें",
        "“Come… give your life a new direction in the refuge of Mahakaal.”": "“आइए… महाकाल की शरण में अपने जीवन को नई दिशा दें।”",

        // wisdom
        "Monthly Jyotish Patrika · Future For You": "मासिक ज्योतिष पत्रिका · फ्यूचर फॉर यू",
        "Timeless Wisdom,": "सनातन ज्ञान,",
        "Beautifully Told": "सुंदर शब्दों में",
        "Stotrams, scriptures, festival guides and the monthly Future For You magazine — the knowledge of the rishis, curated by AstroShrine for the modern seeker.":
            "स्तोत्र, शास्त्र, त्योहार गाइड और मासिक फ्यूचर फॉर यू पत्रिका — ऋषियों का ज्ञान, आज के साधक के लिए एस्ट्रोश्राइन द्वारा संकलित।",
        "Read Articles": "लेख पढ़ें",
        "The Magazine": "पत्रिका",
        "Stotram & Mantra": "स्तोत्र और मंत्र",
        "With meaning": "अर्थ सहित",
        "Vedic Scriptures": "वैदिक शास्त्र",
        "Gita, Upanishad, Puran": "गीता, उपनिषद, पुराण",
        "Festival Guides": "त्योहार गाइड",
        "Vrat, tithi & vidhi": "व्रत, तिथि और विधि",
        "Jyotish & Upay": "ज्योतिष और उपाय",
        "Remedies that work": "असरदार उपाय",
        "Puja Vidhi": "पूजा विधि",
        "Step-by-step rituals": "क्रमवार अनुष्ठान",
        "Dharma & Karma": "धर्म और कर्म",
        "Guidance for life": "जीवन के लिए मार्गदर्शन",
        "New issue every month": "हर महीने नया अंक",
        "Print + Online": "प्रिंट + ऑनलाइन",
        "Monthly Jyotish & Karmakand Patrika": "मासिक ज्योतिष एवं कर्मकांड पत्रिका",

        // gemstones slide
        "AstroGems · Ratna & Rudraksha": "एस्ट्रोजेम्स · रत्न और रुद्राक्ष",
        "Certified Gemstones,": "प्रमाणित रत्न,",
        "Energised for You": "आपके लिए अभिमंत्रित",
        "Natural Pukhraj, Neelam, Panna, Manik, Moti and Rudraksha — chosen for your Kundli, energised at Shri Mahakal Dham and delivered insured to your door.":
            "प्राकृतिक पुखराज, नीलम, पन्ना, माणिक, मोती और रुद्राक्ष — आपकी कुंडली के अनुसार चुने गए, श्री महाकाल धाम में अभिमंत्रित और बीमा सहित आपके घर तक।",
        "Lab certified": "लैब प्रमाणित",
        "Energised at Mahakal Dham": "महाकाल धाम में अभिमंत्रित",
        "Insured delivery": "बीमित डिलीवरी",
        "7-day replacement": "7 दिन में बदलाव",
        "Shop Gemstones": "रत्न खरीदें",
        "Which stone suits me?": "मेरे लिए कौन सा रत्न?",
        "Pukhraj": "पुखराज", "Yellow Sapphire · Guru": "पीला नीलम · गुरु",
        "Neelam": "नीलम", "Blue Sapphire · Shani": "नीलम · शनि",
        "Panna": "पन्ना", "Emerald · Budh": "पन्ना · बुध",
        "Manik": "माणिक", "Ruby · Surya": "माणिक · सूर्य",
        "Moti": "मोती", "Pearl · Chandra": "मोती · चंद्र",
        "With every stone": "हर रत्न के साथ",
        "Navratna, lab certified": "नवरत्न, लैब प्रमाणित",
        "Rudraksha": "रुद्राक्ष", "1 to 14 Mukhi": "1 से 14 मुखी",
        "Malas": "मालाएँ", "Japa & Karungali": "जप और करुंगली",
        "Bracelets": "ब्रेसलेट", "Healing stones": "हीलिंग स्टोन",
        "Yantras": "यंत्र", "Siddh & energised": "सिद्ध और अभिमंत्रित",
        "Pyramids": "पिरामिड", "Vastu crystals": "वास्तु क्रिस्टल",
        "Shop by category": "श्रेणी के अनुसार खरीदें",
        "Lab certificate & origin": "लैब सर्टिफ़िकेट और मूल स्थान",

        // tabs + strip
        "Astrology": "ज्योतिष",
        "Temples": "मंदिर",
        "Wisdom": "ज्ञान",
        "Gemstones": "रत्न",
        "Live Astrologers": "लाइव ज्योतिषी",
        "Online, Busy, Scheduled — live status": "ऑनलाइन, व्यस्त, शेड्यूल्ड — लाइव स्टेटस",
        "Chat & Call": "चैट और कॉल",
        "Fixed points, har astrologer same": "तय पॉइंट, हर ज्योतिषी के लिए एक समान",
        "Free Kundli": "मुफ़्त कुंडली",
        "Chart, milan aur PDF report": "चार्ट, मिलान और PDF रिपोर्ट",
        "Puja Booking": "पूजा बुकिंग",
        "Mahakal Dham, live video": "महाकाल धाम, लाइव वीडियो",
        "Gemstone Store": "रत्न स्टोर",
        "Certified ratna, Rudraksha, mala": "प्रमाणित रत्न, रुद्राक्ष, माला",
        "AI Astrologer": "AI ज्योतिषी",
        "Turant jawab, 24×7": "तुरंत जवाब, 24×7",

        // panchang
        "• Live Celestial Clock •": "• लाइव खगोलीय घड़ी •",
        "Daily Panchang & Shubh Muhurat": "दैनिक पंचांग और शुभ मुहूर्त",
        "Tithi": "तिथि",
        "Shukla Dashami": "शुक्ल दशमी",
        "Nakshatra": "नक्षत्र",
        "Rohini (Vrishabha)": "रोहिणी (वृषभ)",
        "Abhijit Muhurat": "अभिजीत मुहूर्त",
        "Rahu Kaal": "राहु काल",
        "View Kundli Chart": "कुंडली चार्ट देखें",

        // services
        "• Everything in one app": "• सब कुछ एक ऐप में",
        "One App. Every Sacred Need.": "एक ऐप। हर धार्मिक ज़रूरत।",
        "From your first question to prasad at your door — it all lives inside AstroShrine.": "आपके पहले सवाल से लेकर घर पर प्रसाद तक — सब कुछ एस्ट्रोश्राइन में।",
        "Chat with Astrologer": "ज्योतिषी से चैट करें",
        "Type your question, get answers in minutes": "अपना सवाल लिखें, मिनटों में जवाब पाएँ",
        "Most used": "सबसे लोकप्रिय",
        "Call an Astrologer": "ज्योतिषी को कॉल करें",
        "Speak one-on-one, pay only per minute": "आमने-सामने बात करें, सिर्फ़ प्रति मिनट भुगतान",
        "Live": "लाइव",
        "Join live sessions and ask on air": "लाइव सेशन से जुड़ें और सीधे सवाल पूछें",
        "Instant Vedic insight from your chart, 24×7": "आपकी कुंडली से तुरंत वैदिक जानकारी, 24×7",
        "New": "नया",
        "Your Janam Kundli, read bhav by bhav": "आपकी जन्म कुंडली, भाव दर भाव",
        "Free": "मुफ़्त",
        "Kundli Matching": "कुंडली मिलान",
        "Guna milan for marriage, in seconds": "विवाह के लिए गुण मिलान, सेकंडों में",
        "Daily Horoscope": "दैनिक राशिफल",
        "What today holds for your rashi": "आज आपकी राशि के लिए क्या है",
        "Shubh Muhurat": "शुभ मुहूर्त",
        "Auspicious timings for every new beginning": "हर नई शुरुआत के लिए शुभ समय",
        "Book Live Puja": "लाइव पूजा बुक करें",
        "Temple priests, your sankalp, prasad home": "मंदिर के पुजारी, आपका संकल्प, प्रसाद घर तक",
        "Gemstones & Rudraksha": "रत्न और रुद्राक्ष",
        "Genuine stones and malas, delivered": "असली रत्न और मालाएँ, घर तक",
        "Vastu Chakra": "वास्तु चक्र",
        "Map your home plan to the 16 Vastu zones": "अपने घर के नक्शे को 16 वास्तु ज़ोन से मिलाएँ",
        "Khoya Paya": "खोया पाया",
        "Lost something? Ask the stars where": "कुछ खो गया? सितारों से पूछें कहाँ",

        // tour
        "• Inside the app": "• ऐप के अंदर",
        "See It for Yourself": "खुद देखें",
        "No big promises — just the screens you’ll actually use.": "बड़े वादे नहीं — बस वही स्क्रीन जो आप सच में इस्तेमाल करेंगे।",
        "Everything, one tap away": "सब कुछ, बस एक टैप दूर",
        "Astrologers online, AI guidance and your daily reading — all on the home screen.": "ऑनलाइन ज्योतिषी, AI मार्गदर्शन और आपका दैनिक राशिफल — सब होम स्क्रीन पर।",
        "Pick your astrologer": "अपना ज्योतिषी चुनें",
        "Verified Vedic experts with live status, experience and clear per-minute prices.": "लाइव स्टेटस, अनुभव और साफ़ प्रति-मिनट दरों के साथ सत्यापित वैदिक विशेषज्ञ।",
        "Your own Janam Kundli": "आपकी अपनी जन्म कुंडली",
        "Your D1 Rashi chart with lagna, nakshatra and every graha placed — free.": "लग्न, नक्षत्र और हर ग्रह की स्थिति के साथ आपका D1 राशि चार्ट — मुफ़्त।",
        "Your Kundli, explained": "आपकी कुंडली, विस्तार से",
        "Every bhav scored, with the grahas helping and challenging you.": "हर भाव का स्कोर, साथ में सहायक और चुनौती देने वाले ग्रह।",

        // pujas
        "• Sanctified Rituals": "• पवित्र अनुष्ठान",
        "Featured Sacred Pujas of the Week": "इस सप्ताह की विशेष पूजाएँ",
        "View All 45 Pujas": "सभी 45 पूजाएँ देखें",
        "Shree Mahakaal Dham, Amleshwar (CG)": "श्री महाकाल धाम, अमलेश्वर (छ.ग.)",
        "Parthiv Rudrabhishek": "पार्थिव रुद्राभिषेक",
        "Abhishek of a hand-made Parthiv Shivling for relief from afflictions, health and the eternal grace of Mahadev.": "कष्टों से मुक्ति, अच्छे स्वास्थ्य और महादेव की कृपा के लिए हाथ से बने पार्थिव शिवलिंग का अभिषेक।",
        "Book Pooja": "पूजा बुक करें",
        "Maha Mrityunjay Puja": "महामृत्युंजय पूजा",
        "Mahamrityunjaya mantra anushthan chanted by Vedic pundits for longevity, healing and protection from untimely harm.": "दीर्घायु, आरोग्य और अकाल संकट से रक्षा के लिए वैदिक पंडितों द्वारा महामृत्युंजय मंत्र अनुष्ठान।",
        "Laxmi Puja": "लक्ष्मी पूजा",
        "Invocation of Maa Mahalakshmi for abundance, stability of wealth and prosperity in home and business.": "घर और व्यापार में समृद्धि, धन की स्थिरता और सुख-शांति के लिए माँ महालक्ष्मी का आवाहन।",
        "Kaal Sarp Dosh Shanti Pujan": "काल सर्प दोष शांति पूजन",
        "Naga shanti vidhi to dissolve the Kaal Sarp affliction blocking progress, marriage and peace of mind.": "प्रगति, विवाह और मानसिक शांति में बाधा बनने वाले काल सर्प दोष के निवारण हेतु नाग शांति विधि।",
        "Manglik Dosh Nivaran Puja": "मांगलिक दोष निवारण पूजा",
        "Mangal dosha remedy performed for seekers facing delays and discord in marital prospects.": "विवाह में देरी और अनबन का सामना कर रहे लोगों के लिए मंगल दोष का उपाय।",
        "Narayan Nag Bali Puja": "नारायण नागबली पूजा",
        "Three-day ancestral rite for pitru dosha, unfulfilled desires of departed souls and lineage peace.": "पितृ दोष, दिवंगत आत्माओं की अधूरी इच्छाओं और वंश की शांति के लिए तीन दिवसीय अनुष्ठान।",
        "Shani Shanti Puja": "शनि शांति पूजा",
        "Shani grah shanti with tail abhishek and mantra japa to soften Sade Sati and Dhaiya periods.": "साढ़ेसाती और ढैय्या के प्रभाव को कम करने के लिए तेल अभिषेक और मंत्र जाप के साथ शनि ग्रह शांति।",
        "Rahu Puja": "राहु पूजा",
        "Rahu shanti anushthan for sudden obstacles, confusion and instability caused by the shadow planet.": "छाया ग्रह राहु से होने वाली अचानक बाधाओं, भ्रम और अस्थिरता के लिए राहु शांति अनुष्ठान।",
        "Mangal Shanti Puja": "मंगल शांति पूजा",
        "Mangal grah shanti for control over anger, disputes, accidents and blocked property matters.": "क्रोध, विवाद, दुर्घटना और अटके संपत्ति मामलों पर नियंत्रण के लिए मंगल ग्रह शांति।",

        // testimonials
        "Anubhav • Living Grace": "अनुभव • जीवंत कृपा",
        "Testimonials & Darshan Stories": "श्रद्धालुओं के अनुभव",
        "“Witnessing the live Mahakaleshwar Bhasma Aarti with my family’s gotra read out clearly on stream felt as though we were sitting directly in the garbhagriha. Holy prasad arrived fresh within 4 days.”":
            "“स्ट्रीम पर अपने परिवार का गोत्र साफ़ सुनते हुए लाइव महाकालेश्वर भस्म आरती देखना ऐसा लगा मानो हम सीधे गर्भगृह में बैठे हों। पवित्र प्रसाद 4 दिनों में ताज़ा पहुँच गया।”",
        "“The Kundli transit prediction regarding my Sade Sati period was remarkably accurate. The suggested Shani Tailabhishekam ritual brought tremendous peace and career stability.”":
            "“मेरी साढ़ेसाती को लेकर कुंडली गोचर की भविष्यवाणी बिल्कुल सटीक निकली। सुझाए गए शनि तैलाभिषेक से बहुत शांति और करियर में स्थिरता आई।”",
        "“AstroShrine treats Hindu traditions with absolute respect and architectural beauty. The articles on Upanishadic philosophy are gold dust for youngsters looking for depth.”":
            "“एस्ट्रोश्राइन हिंदू परंपराओं को पूरे सम्मान और सुंदरता के साथ प्रस्तुत करता है। उपनिषद दर्शन पर लेख गहराई चाहने वाले युवाओं के लिए अनमोल हैं।”",

        // steps + download
        "• Start in a minute": "• एक मिनट में शुरू करें",
        "Three Steps to Clarity": "स्पष्टता के तीन कदम",
        "Install AstroShrine": "एस्ट्रोश्राइन इंस्टॉल करें",
        "Free on Google Play.": "Google Play पर मुफ़्त।",
        "Add your birth details": "अपनी जन्म जानकारी जोड़ें",
        "Date, time and place — your Kundli is ready instantly.": "तारीख, समय और स्थान — आपकी कुंडली तुरंत तैयार।",
        "Ask, book, explore": "पूछें, बुक करें, जानें",
        "Chat with an astrologer, ask the AI or book a puja.": "ज्योतिषी से चैट करें, AI से पूछें या पूजा बुक करें।",
        "• AstroShrine for Android": "• Android के लिए एस्ट्रोश्राइन",
        "Your astrologer is already online.": "आपके ज्योतिषी अभी ऑनलाइन हैं।",
        "Open the app and ask your first question today.": "ऐप खोलें और आज ही अपना पहला सवाल पूछें।",
        "See all services": "सभी सेवाएँ देखें",

        // footer
        "Faith • Wisdom • Guidance": "आस्था • ज्ञान • मार्गदर्शन",
        "Dedicated to preserving and illuminating timeless Vedic sciences, holy temple sanctuaries, and celestial wisdom for modern seekers around the world.":
            "दुनिया भर के आधुनिक साधकों के लिए सनातन वैदिक विज्ञान, पवित्र मंदिरों और ज्योतिष ज्ञान को संजोने और प्रकाशित करने के लिए समर्पित।",
        "In the App": "ऐप में",
        "Chat & Call Astrologers": "ज्योतिषियों से चैट और कॉल",
        "Free Kundli & Matching": "मुफ़्त कुंडली और मिलान",
        "Vedic Wisdom": "वैदिक ज्ञान",
        "Daily Panchangam": "दैनिक पंचांग",
        "Sacred Scriptures": "पवित्र शास्त्र",
        "Mantra & Stotram": "मंत्र और स्तोत्र",
        "Yantra Mysticism": "यंत्र रहस्य",
        "Vedic Philosophy": "वैदिक दर्शन",
        "Celestial Insights": "ज्योतिषीय जानकारी",
        "Receive daily astrological guidance, auspicious Muhurat timings, and sacred festival notifications straight to your sanctuary inbox.":
            "दैनिक ज्योतिषीय मार्गदर्शन, शुभ मुहूर्त और त्योहारों की सूचनाएँ सीधे अपने इनबॉक्स में पाएँ।",
        "Enter your sacred email": "अपना ईमेल दर्ज करें",
        "Subscribe": "सब्सक्राइब करें",
        "We honor your privacy and spiritual sanctity. Unsubscribe anytime.": "हम आपकी निजता का सम्मान करते हैं। कभी भी अनसब्सक्राइब करें।",
        "© 2026 AstroShrine Portal. Timeless Vedic Heritage Preserved.": "© 2026 एस्ट्रोश्राइन पोर्टल। सनातन वैदिक विरासत संरक्षित।",
        "Terms of Sanctity": "नियम और शर्तें",
        "Privacy Architecture": "गोपनीयता नीति",
        "Support": "सहायता",
        "Delete Account": "अकाउंट हटाएँ"
    };

    const KEY = "as-lang";
    const SKIP = "script,style,svg,.af,.lang-toggle,[data-no-i18n]";
    const norm = s => s.replace(/\s+/g, " ").trim();
    const nodes = [];   // [textNode, englishText]
    const attrs = [];   // [element, attrName, englishValue]

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: n => (n.parentElement && !n.parentElement.closest(SKIP) && HI[norm(n.nodeValue)])
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    for (let n; (n = walker.nextNode());) nodes.push([n, n.nodeValue]);
    document.querySelectorAll("[placeholder],[aria-label]").forEach(el => {
        if (el.closest(SKIP)) return;
        ["placeholder", "aria-label"].forEach(a => {
            const v = el.getAttribute(a);
            if (v && HI[norm(v)]) attrs.push([el, a, v]);
        });
    });
    const title = document.title;

    const apply = (lang) => {
        const hi = lang === "hi";
        nodes.forEach(([n, en]) => {
            if (!hi) { n.nodeValue = en; return; }
            const lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0];
            n.nodeValue = lead + HI[norm(en)] + trail;
        });
        attrs.forEach(([el, a, en]) => el.setAttribute(a, hi ? HI[norm(en)] : en));
        document.title = hi ? (HI[norm(title)] || title) : title;
        document.documentElement.lang = hi ? "hi" : "en";
        document.documentElement.classList.toggle("is-hi", hi);
        document.querySelectorAll(".lang-toggle").forEach(b => {
            b.setAttribute("aria-pressed", hi ? "true" : "false");
            b.title = hi ? "Switch to English" : "हिंदी में देखें";
        });
    };

    let lang = "en";
    try { lang = localStorage.getItem(KEY) === "hi" ? "hi" : "en"; } catch (e) {}
    apply(lang);

    document.querySelectorAll(".lang-toggle").forEach(b => b.addEventListener("click", () => {
        lang = lang === "hi" ? "en" : "hi";
        try { localStorage.setItem(KEY, lang); } catch (e) {}
        apply(lang);
    }));
})();
