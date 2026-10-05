// Shared shell behaviour for the mentor / coordinator / student dashboards:
// mobile sidebar backdrop, scroll spy for the sidebar links and hiding nav
// links whose section is hidden for the current role.
(() => {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("toggleSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const links = Array.from(document.querySelectorAll(".portal-nav .menu-item"));

  const closeSidebar = () => {
    document.body.classList.remove("sidebar-open");
    if (sidebar) sidebar.classList.add("-translate-x-full");
  };

  // The page script toggles `-translate-x-full` on the sidebar itself; here we
  // only mirror that state on the body so the backdrop shows.
  if (toggle) toggle.addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
  if (backdrop) backdrop.addEventListener("click", closeSidebar);

  links.forEach(link => link.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 1024px)").matches) closeSidebar();
  }));

  const setActive = link => links.forEach(l => l.classList.toggle("active", l === link));

  // Hide nav entries for sections the current role or deadline state hides.
  links.forEach(link => {
    const section = document.querySelector(link.getAttribute("href") || "");
    if (!section) {
      link.style.display = "none";
      return;
    }
    const sync = () => {
      const hidden = section.classList.contains("hidden") || section.style.display === "none";
      link.style.display = hidden ? "none" : "";
    };
    sync();
    new MutationObserver(sync).observe(section, { attributes: true, attributeFilter: ["class", "style"] });
  });

  const sections = links
    .map(link => document.querySelector(link.getAttribute("href") || ""))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });

    const current = sections.find(section => visible.has(section));
    if (!current) return;

    const link = links.find(l => l.getAttribute("href") === `#${current.id}`);
    if (link) setActive(link);
  }, { rootMargin: "-90px 0px -60% 0px", threshold: 0 });

  sections.forEach(section => observer.observe(section));
})();