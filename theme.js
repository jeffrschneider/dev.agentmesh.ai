/* Light by default; dark only when the reader presses the switch in the menu.
   The choice is remembered in this browser. #dark or #light in the address
   forces one (for links and screenshots). Also opens the menu on a phone. */
(function () {
  var d = document, r = d.documentElement, KEY = "dev-theme", t = null;
  try { t = localStorage.getItem(KEY); } catch (e) {}
  if (location.hash === "#dark") t = "dark";
  if (location.hash === "#light") t = "light";
  if (t === "dark") r.setAttribute("data-theme", "dark");
  function ready() {
    var b = d.getElementById("theme-toggle");
    if (b) {
      b.setAttribute("aria-pressed", r.getAttribute("data-theme") === "dark" ? "true" : "false");
      b.addEventListener("click", function () {
        var dark = r.getAttribute("data-theme") !== "dark";
        if (dark) r.setAttribute("data-theme", "dark"); else r.removeAttribute("data-theme");
        try { localStorage.setItem(KEY, dark ? "dark" : "light"); } catch (e) {}
        b.setAttribute("aria-pressed", dark ? "true" : "false");
      });
    }
    var nav = d.getElementById("sidenav"), m = d.getElementById("menu-toggle");
    if (nav && m) m.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      m.setAttribute("aria-expanded", open ? "true" : "false");
    });
    var on = d.querySelector(".sidenav a.on");
    if (on) on.setAttribute("aria-current", "page");
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", ready); else ready();
})();
