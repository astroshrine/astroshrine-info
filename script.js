// ===============================
// NAVBAR EFFECT
// ===============================

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if (window.scrollY > 40) {

        navbar.style.background = "rgba(10,10,20,.75)";
        navbar.style.backdropFilter = "blur(20px)";
        navbar.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";

    }

    else {

        navbar.style.background = "rgba(255,255,255,.05)";
        navbar.style.boxShadow = "none";

    }

});

// ===============================
// CARD ANIMATION
// ===============================

const cards = document.querySelectorAll(".card");

const observer = new IntersectionObserver((entries)=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            entry.target.style.opacity="1";
            entry.target.style.transform="translateY(0px)";

        }

    });

},{threshold:0.25});

cards.forEach(card=>{

    card.style.opacity="0";
    card.style.transform="translateY(70px)";
    card.style.transition=".8s ease";

    observer.observe(card);

});

// ===============================
// HERO ANIMATION
// ===============================

window.addEventListener("load",()=>{

    document.querySelector(".hero h1").style.opacity="1";
    document.querySelector(".hero p").style.opacity="1";

});