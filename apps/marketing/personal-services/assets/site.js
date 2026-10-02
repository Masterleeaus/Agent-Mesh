(() => {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("#primary-navigation");
  if (!toggle || !nav) return;

  const closeMenu = (restoreFocus = false) => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    toggle.querySelector(".sr-only").textContent = "Open navigation";
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    const label = open ? "Close navigation" : "Open navigation";
    toggle.setAttribute("aria-label", label);
    toggle.querySelector(".sr-only").textContent = label;
    if (open) nav.querySelector("a")?.focus();
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a") && window.matchMedia("(max-width: 820px)").matches) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") closeMenu(true);
  });

  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 820px)").matches) closeMenu();
  });
})();
