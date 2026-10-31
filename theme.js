/* رد ذكي — UI shell: theme toggle (light/dark, remembered) + mobile menu.
   The initial theme is applied by a tiny inline script in <head> to avoid a flash. */
(() => {
  const root = document.documentElement;
  const KEY = "radd_theme";
  const meta = document.querySelector('meta[name="theme-color"]');
  const paint = (t) => {
    root.setAttribute("data-theme", t);
    if (meta) meta.setAttribute("content", t === "dark" ? "#09090b" : "#fafafa");
    document.querySelectorAll(".theme-toggle").forEach((b) => {
      b.setAttribute("aria-pressed", String(t === "dark"));
      b.setAttribute("aria-label", t === "dark" ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي");
    });
  };
  paint(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

  document.querySelectorAll(".theme-toggle").forEach((btn) => btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.classList.add("theme-anim");
    paint(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    setTimeout(() => root.classList.remove("theme-anim"), 320);
  }));

  // Follow the OS setting until the visitor picks a theme themselves.
  const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  if (mq && mq.addEventListener) mq.addEventListener("change", (e) => {
    let saved = null; try { saved = localStorage.getItem(KEY); } catch (err) {}
    if (!saved) paint(e.matches ? "dark" : "light");
  });

  // Mobile menu
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    const set = (open) => {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    };
    toggle.addEventListener("click", () => set(!document.body.classList.contains("menu-open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    window.addEventListener("resize", () => { if (window.innerWidth >= 900) set(false); });
  }
})();
