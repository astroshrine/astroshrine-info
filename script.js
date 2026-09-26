// navbar solidifies on scroll
const navbar = document.querySelector(".navbar");
addEventListener("scroll", () => navbar.classList.toggle("scrolled", scrollY > 40), { passive: true });

// mobile menu
const links = document.querySelector(".nav-links");
const toggle = document.querySelector(".nav-toggle");
toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
});
links.addEventListener("click", () => links.classList.remove("open"));

// reveal on scroll
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("shown");
        io.unobserve(e.target);
    });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// live celestial clock
const clock = document.querySelector("#clock");
const tick = () => clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
tick();
setInterval(tick, 1000);

// hero slider — Astrology · Temples · Wisdom, advances every 10 s.
// The active tab's progress bar IS the timer: when its CSS fill animation
// ends we move on, so pausing the animation (hover, focus, hidden tab)
// pauses the slider with the remaining time intact.
(() => {
    const hs = document.querySelector(".hs");
    if (!hs) return;
    const slides = [...hs.querySelectorAll(".hs-slide")];
    const tabs = [...hs.querySelectorAll(".hs-tab")];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;

    const go = (n) => {
        i = (n + slides.length) % slides.length;
        slides.forEach((s, k) => {
            const on = k === i;
            s.classList.toggle("is-active", on);
            s.setAttribute("aria-hidden", on ? "false" : "true");
            s.querySelectorAll("a,button").forEach(el => (el.tabIndex = on ? 0 : -1));
        });
        tabs.forEach((t, k) => {
            t.classList.remove("is-active");
            t.classList.toggle("is-done", k < i);
            t.setAttribute("aria-selected", k === i ? "true" : "false");
        });
        // restart the fill (and the slide's entrance animations) from zero
        void tabs[i].offsetWidth;
        tabs[i].classList.add("is-active");
    };

    tabs.forEach((t, k) => {
        t.addEventListener("click", () => go(k));
        t.querySelector(".hs-bar i").addEventListener("animationend", () => {
            if (t.classList.contains("is-active")) go(i + 1);
        });
    });
    hs.querySelectorAll(".hs-arrow").forEach(b =>
        b.addEventListener("click", () => go(i + Number(b.dataset.dir))));

    // pause while the visitor is reading / interacting, or the tab is hidden
    const pause = (on) => hs.classList.toggle("is-paused", on);
    // only while hovering the text/controls — resting the mouse on the big
    // background must not freeze the slider
    hs.querySelectorAll(".hs-copy,.hs-controls").forEach(el => {
        el.addEventListener("mouseenter", () => pause(true));
        el.addEventListener("mouseleave", () => pause(false));
    });
    // keyboard users tabbing through a slide get time to read it
    hs.addEventListener("focusin", (e) => { if (e.target.matches(":focus-visible")) pause(true); });
    hs.addEventListener("focusout", () => pause(false));
    document.addEventListener("visibilitychange", () => pause(document.hidden));
    if (reduced) pause(true);

    // keyboard + swipe
    hs.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
    });
    let x0 = null;
    hs.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    hs.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
        x0 = null;
    });

    go(0);
})();

// rising golden embers in the hero (decor)
(() => {
    const box = document.querySelector(".hs-embers");
    if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const n = innerWidth < 700 ? 14 : 28;
    for (let k = 0; k < n; k++) {
        const s = document.createElement("span");
        s.style.left = Math.random() * 100 + "%";
        s.style.setProperty("--s", (2 + Math.random() * 4).toFixed(1) + "px");
        s.style.setProperty("--d", (9 + Math.random() * 10).toFixed(1) + "s");
        s.style.setProperty("--delay", (-Math.random() * 18).toFixed(1) + "s");
        s.style.setProperty("--dx", (Math.random() * 120 - 60).toFixed(0) + "px");
        box.appendChild(s);
    }
})();

// app tour — tabs swap the phone screen; auto-advances every 5 s (bar = timer)
(() => {
    const tour = document.querySelector(".tour");
    if (!tour) return;
    const tabs = [...tour.querySelectorAll(".tour-tab")];
    const shots = [...tour.querySelectorAll(".tour-phone img")];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    const go = (n) => {
        i = (n + tabs.length) % tabs.length;
        tabs.forEach((t, k) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", k === i); });
        shots.forEach((s, k) => s.classList.toggle("is-active", k === i));
        void tabs[i].offsetWidth;
        tabs[i].classList.add("is-active");
    };
    tabs.forEach((t, k) => {
        t.addEventListener("click", () => go(k));
        t.querySelector(".tour-bar i").addEventListener("animationend", () => { if (!reduced) go(i + 1); });
    });
    tour.addEventListener("mouseenter", () => tour.classList.add("is-paused"));
    tour.addEventListener("mouseleave", () => tour.classList.remove("is-paused"));
    // only run the timer while the section is on screen
    new IntersectionObserver(([e]) => tour.classList.toggle("is-paused", !e.isIntersecting), { threshold: 0.3 }).observe(tour);
})();
