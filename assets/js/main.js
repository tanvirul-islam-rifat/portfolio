/**
 * Neural Ink — entry point.
 * Each feature lives in its own module under ./modules; content lives in ./data.
 */
import { $ } from "./modules/utils.js";
import { runBoot } from "./modules/boot.js";
import { initNeural } from "./modules/neural.js";
import { initStickers, unlock } from "./modules/stickers.js";
import { initProjects, findProject } from "./modules/projects.js";
import { initCasefile } from "./modules/casefile.js";
import { initSkillMap } from "./modules/skillmap.js";
import {
  initTheme,
  initNav,
  initTyper,
  initSfx,
  initCopyEmail,
  initEasel,
  initPlayerCard,
  initKickoff,
} from "./modules/ui.js";

// Content first, so it is there even if an effect fails.
initProjects();
const openFromHash = initCasefile(findProject);

const safe = (name, fn) => {
  try {
    fn();
  } catch (err) {
    console.error(`[neural-ink] ${name} failed`, err);
  }
};

safe("stickers", initStickers);
safe("theme", initTheme);
safe("nav", initNav);
safe("skill map", initSkillMap);
safe("sfx", initSfx);
safe("copy email", initCopyEmail);
safe("easel", initEasel);
safe("player card", initPlayerCard);
safe("kick-off", initKickoff);

let fired = 0;
safe("neural net", () =>
  initNeural($("#hero-net"), {
    onUserFire: () => {
      fired++;
      if (fired === 10) unlock("neurons");
    },
  })
);

$("#year").textContent = new Date().getFullYear();

runBoot().then((played) => {
  const hero = $("#origin");
  if (played) {
    hero.classList.add("is-entering");
    setTimeout(() => hero.classList.remove("is-entering"), 1400);
  }
  safe("typer", initTyper);
  openFromHash();
});
