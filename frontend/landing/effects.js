export function initEffects({ reduced }) {
  const nav = document.querySelector("[data-nav]");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // mobile menu
  const btn = document.querySelector("[data-menu-btn]");
  const menu = document.getElementById("menu");
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    btn.textContent = open ? "Menu" : "Close";
    menu.classList.toggle("is-open", !open);
  });
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) { btn.setAttribute("aria-expanded", "false"); btn.textContent = "Menu"; menu.classList.remove("is-open"); }
  });

  // reveal on scroll (staggered by sibling order); visible immediately under reduced motion
  const items = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) items.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const sibs = [...e.target.parentElement.children].filter((c) => c.classList.contains("reveal"));
        e.target.style.transitionDelay = `${Math.max(0, sibs.indexOf(e.target)) * 90}ms`;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  }

  // pathway line draws as it enters view
  const path = document.querySelector("[data-path]");
  if (path) {
    if (reduced) path.classList.add("drawn");
    else new IntersectionObserver(([e], o) => { if (e.isIntersecting) { path.classList.add("drawn"); o.disconnect(); } }, { threshold: 0.3 }).observe(path);
  }

  // cursor spotlight on cards
  document.querySelectorAll("[data-spot]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  document.querySelector("[data-year]").textContent = new Date().getFullYear();
}
