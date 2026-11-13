export function initEffects({ reduced }) {
  const nav = document.querySelector("[data-nav]");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // mobile menu (animated by CSS via .is-open; the button morphs into a close icon)
  const btn = document.querySelector("[data-menu-btn]");
  const menu = document.getElementById("menu");
  const dd = document.querySelector("[data-dd]");
  const ddBtn = dd.querySelector("[data-dd-btn]");

  const setDropdown = (open, { focus = false } = {}) => {
    ddBtn.setAttribute("aria-expanded", String(open));
    dd.classList.toggle("is-open", open);
    if (!open && focus) ddBtn.focus();
  };
  const setMenu = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    if (!open) setDropdown(false);
  };
  btn.addEventListener("click", () => setMenu(btn.getAttribute("aria-expanded") !== "true"));
  let hoverOpened = false; // opened by hovering: the click that follows should pin it open, not close it
  ddBtn.addEventListener("click", () => {
    if (hoverOpened) { hoverOpened = false; return; }
    setDropdown(ddBtn.getAttribute("aria-expanded") !== "true");
  });
  // desktop: open on hover too (mouse only), close when the pointer leaves
  const mouse = window.matchMedia("(hover: hover) and (min-width: 821px)");
  let leaveTimer = 0;
  dd.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && mouse.matches) { clearTimeout(leaveTimer); if (!dd.classList.contains("is-open")) hoverOpened = true; setDropdown(true); } });
  dd.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && mouse.matches) leaveTimer = setTimeout(() => { hoverOpened = false; setDropdown(false); }, 160); });
  document.addEventListener("pointerdown", (e) => { if (!dd.contains(e.target)) setDropdown(false); });
  dd.addEventListener("focusout", (e) => { if (!dd.contains(e.relatedTarget)) setDropdown(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (dd.classList.contains("is-open")) setDropdown(false, { focus: true });
    else if (menu.classList.contains("is-open")) { setMenu(false); btn.focus(); }
  });
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

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

  document.querySelector("[data-year]").textContent = new Date().getFullYear();
}
