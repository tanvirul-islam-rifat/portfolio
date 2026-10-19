import { $ } from "./utils.js";

/**
 * Boot intro: a fake training log, a POW!, then the page tears open.
 * Shown once per browser session. Any key or click skips it.
 * Resolves when the page is visible.
 */
const LINES = [
  ["$ python train.py --model rifat --data ./28_repos", ""],
  ["loading weights ........ thesis, 2 papers, 1 file system", ""],
  ["epoch 1/4   loss 2.304   acc 0.31", ""],
  ["epoch 2/4   loss 0.918   acc 0.74", ""],
  ["epoch 3/4   loss 0.211   acc 0.93", ""],
  ["epoch 4/4   loss 0.031   acc 0.98", ""],
  ["✓ converged. 40/40 checks passed.", "ok"],
  ["printing issue #01 ...", "hi"],
];

export function runBoot() {
  const boot = $("#boot");
  const root = document.documentElement;

  if (!boot || root.classList.contains("boot-seen")) {
    boot?.remove();
    return Promise.resolve(false);
  }

  const log = $("#boot-log");
  const bar = $("#boot-bar");
  document.body.classList.add("is-locked");

  return new Promise((resolve) => {
    let done = false;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      try {
        sessionStorage.setItem("ni-boot", "seen");
      } catch {}
      boot.classList.add("is-pow");
      setTimeout(() => {
        boot.classList.add("is-opening");
        document.body.classList.remove("is-locked");
        resolve(true);
        setTimeout(() => boot.remove(), 900);
      }, 520);
      removeEventListener("keydown", finish);
      boot.removeEventListener("click", finish);
    };

    addEventListener("keydown", finish);
    boot.addEventListener("click", finish);
    $("#boot-skip").addEventListener("click", finish);

    let t = 120;
    LINES.forEach(([text, cls], i) => {
      later(() => {
        const span = document.createElement("span");
        if (cls) span.className = cls;
        span.textContent = text + "\n";
        log.append(span);
        bar.style.width = `${Math.round(((i + 1) / LINES.length) * 100)}%`;
      }, t);
      t += i === 0 ? 380 : 230;
    });
    later(finish, t + 260);
  });
}
