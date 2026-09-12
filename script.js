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
