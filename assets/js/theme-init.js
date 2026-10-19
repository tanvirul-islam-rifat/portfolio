/* Runs synchronously in <head> so the page never flashes the wrong theme. */
(function () {
  var root = document.documentElement;
  var theme = "dark";
  try {
    var saved = localStorage.getItem("ni-theme");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch (e) {}
  root.setAttribute("data-theme", theme);

  var skipBoot = false;
  try {
    skipBoot = sessionStorage.getItem("ni-boot") === "seen";
  } catch (e) {}
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) skipBoot = true;
  if (skipBoot) root.classList.add("boot-seen");
  root.classList.add("js");
})();
