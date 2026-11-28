// Language menu for the homepage: the same 12 languages as the web app (app.astroshrine.in).
// English is the source text in index.html; this swaps visible text nodes (and a few attributes) to the
// chosen language from i18n/<code>.json (keys are the English text), and back. A string missing from a
// language stays English. The phone mock-ups (.af) are left as they are: they show the real app UI.
// Links to the web app follow the chosen language (app.astroshrine.in/<code>/…).
(() => {
    const LANGS = [
        ["hi", "हिन्दी", "हिं"], ["en", "English", "EN"], ["bn", "বাংলা", "বাং"], ["mr", "मराठी", "मरा"],
        ["gu", "ગુજરાતી", "ગુજ"], ["pa", "ਪੰਜਾਬੀ", "ਪੰਜ"], ["or", "ଓଡ଼ିଆ", "ଓଡ଼"], ["as", "অসমীয়া", "অস"],
        ["ta", "தமிழ்", "தமி"], ["te", "తెలుగు", "తెలు"], ["kn", "ಕನ್ನಡ", "ಕನ್ನ"], ["ml", "മലയാളം", "മല"]
    ];
    const CODES = LANGS.map(l => l[0]);
    const KEY = "as-lang";
    const SKIP = "script,style,svg,.af,.lang-menu,[data-no-i18n]";
    const APP = /^https:\/\/app\.astroshrine\.in\/[a-z]{2}(?=\/|$)/;
    const norm = s => s.replace(/\s+/g, " ").trim();
    const dicts = { en: {} };

    // Signed in to the web app (app.astroshrine.in shares the first name in a .astroshrine.in cookie): the header
    // greets the visitor by name and opens their web app home, instead of "Login / Sign up".
    const signedName = (() => {
        try { const m = document.cookie.match(/(?:^|;\s*)as_name=([^;]*)/); return m ? decodeURIComponent(m[1]).trim().slice(0, 30) : ""; }
        catch (e) { return ""; }
    })();
    if (signedName) {
        document.querySelectorAll('.nav-cta a.btn-gold[href*="/login"]').forEach(a => {
            a.setAttribute("href", a.getAttribute("href").replace(/\/login$/, "/home"));
            a.classList.add("nav-me");
            a.textContent = "";
            const icon = document.createElement("i"); icon.className = "ph-fill ph-user-circle"; icon.setAttribute("aria-hidden", "true");
            const label = document.createElement("span"); label.setAttribute("data-no-i18n", ""); label.textContent = "Namaste, " + signedName;
            a.append(icon, " ", label);
        });
    }

    const nodes = [];   // [textNode, englishText]
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: n => (n.parentElement && !n.parentElement.closest(SKIP) && norm(n.nodeValue))
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    for (let n; (n = walker.nextNode());) nodes.push([n, n.nodeValue]);
    const attrs = [];   // [element, attrName, englishValue]
    document.querySelectorAll("[placeholder],[aria-label]").forEach(el => {
        if (el.closest(SKIP)) return;
        ["placeholder", "aria-label"].forEach(a => { const v = el.getAttribute(a); if (v) attrs.push([el, a, v]); });
    });
    // Hindi-first text (the hero headline, a few labels) is marked lang="hi"; once translated it is re-marked.
    const hiEls = [...document.querySelectorAll('[lang="hi"]')].filter(el => !el.closest(SKIP)).map(el => [el, el.textContent]);
    const links = [...document.querySelectorAll('a[href^="https://app.astroshrine.in/"]')];
    const title = document.title;

    const load = code => dicts[code] ? Promise.resolve(dicts[code])
        : fetch(`i18n/${code}.json`).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(d => (dicts[code] = d));

    const menus = [...document.querySelectorAll(".lang-menu")];
    const apply = (code) => {
        const d = dicts[code] || {};
        const tr = en => d[norm(en)];
        nodes.forEach(([n, en]) => {
            const t = tr(en);
            if (!t) { n.nodeValue = en; return; }
            n.nodeValue = en.match(/^\s*/)[0] + t + en.match(/\s*$/)[0];
        });
        attrs.forEach(([el, a, en]) => el.setAttribute(a, tr(en) || en));
        hiEls.forEach(([el, hi]) => el.setAttribute("lang", el.textContent === hi ? "hi" : code));
        links.forEach(a => a.setAttribute("href", a.getAttribute("href").replace(APP, `https://app.astroshrine.in/${code}`)));
        document.title = tr(title) || title;
        const root = document.documentElement;
        root.lang = code;
        // every Indian-language view uses the "is-hi" layout (no English echo line, the plain hero)
        root.classList.toggle("is-hi", code !== "en");
        const [, name, short] = LANGS.find(l => l[0] === code);
        menus.forEach(m => {
            m.querySelector(".lm-cur").textContent = short;
            m.querySelector(".lm-btn").setAttribute("aria-label", `${tr("Choose language") || "Choose language"}: ${name}`);
            m.querySelectorAll("[data-lang]").forEach(o => o.setAttribute("aria-selected", o.dataset.lang === code ? "true" : "false"));
        });
    };
    const choose = code => load(code).then(() => apply(code));

    // build each menu's list
    menus.forEach(m => {
        const btn = m.querySelector(".lm-btn");
        const list = m.querySelector(".lm-list");
        list.innerHTML = LANGS.map(([c, name]) =>
            `<li role="option" tabindex="-1" data-lang="${c}" lang="${c}" aria-selected="false">${name}</li>`).join("");
        const close = () => { m.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
        btn.addEventListener("click", e => {
            e.stopPropagation();
            const open = !m.classList.contains("open");
            menus.forEach(x => x !== m && x.classList.remove("open"));
            m.classList.toggle("open", open);
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            if (open) (list.querySelector('[aria-selected="true"]') || list.firstElementChild).focus();
        });
        list.addEventListener("click", e => {
            const o = e.target.closest("[data-lang]");
            if (!o) return;
            try { localStorage.setItem(KEY, o.dataset.lang); } catch (err) {}
            choose(o.dataset.lang);
            close();
            btn.focus();
        });
        list.addEventListener("keydown", e => {
            const items = [...list.children], i = items.indexOf(document.activeElement);
            if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
            else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
            else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.activeElement.click(); }
            else if (e.key === "Escape") { close(); btn.focus(); }
        });
        document.addEventListener("click", e => { if (!m.contains(e.target)) close(); });
    });

    let lang = "en";
    try { const s = localStorage.getItem(KEY); if (CODES.includes(s)) lang = s; } catch (e) {}
    choose(lang);
})();
