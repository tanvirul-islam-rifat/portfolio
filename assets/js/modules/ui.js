import { $, $$, h, burst, reducedMotion, store } from "./utils.js";
import { unlock, toast } from "./stickers.js";

/* ---------- Theme (night / day edition) ---------- */

export function initTheme() {
  const root = document.documentElement;
  const btn = $("#theme-toggle");
  const label = btn.querySelector(".sr-only");
  const meta = document.querySelector('meta[name="theme-color"]');

  const sync = () => {
    const light = root.dataset.theme === "light";
    btn.setAttribute("aria-pressed", String(light));
    label.textContent = light ? "Use night edition" : "Use day edition";
    btn.title = light ? "Switch to the night edition" : "Switch to the day edition";
    meta?.setAttribute("content", light ? "#f5ecd7" : "#15131f");
  };

  btn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem("ni-theme", root.dataset.theme);
    } catch {}
    sync();
    unlock("edition");
  });
  sync();
}

/* ---------- Masthead: solid on scroll, active section, mobile menu ---------- */

export function initNav() {
  const head = $("#masthead");
  const nav = $("#nav");
  const menuBtn = $("#menu-btn");
  const links = $$(".nav__link");

  const onScroll = () => head.classList.toggle("is-solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const closeMenu = () => {
    nav.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  };
  menuBtn.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  links.forEach((a) => a.addEventListener("click", closeMenu));
  addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

  // highlight the section in view
  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === `#${e.target.id}`)));
      }
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => io.observe(s));
}

/* ---------- Typing rotator ---------- */

export function initTyper() {
  const el = $("#typer");
  if (!el) return;
  const words = el.dataset.words.split("|");
  if (reducedMotion()) return;

  let w = 0;
  let i = words[0].length;
  let deleting = true;
  const tick = () => {
    const word = words[w];
    if (deleting) {
      i--;
      if (i <= 0) {
        deleting = false;
        w = (w + 1) % words.length;
      }
    } else {
      i++;
      if (i >= words[w].length) {
        deleting = true;
        el.textContent = words[w];
        return setTimeout(tick, 2200);
      }
    }
    el.textContent = (deleting ? word : words[w]).slice(0, Math.max(i, 0));
    setTimeout(tick, deleting ? 45 : 85);
  };
  setTimeout(tick, 2600);
}

/* ---------- Sound-effect bursts on [data-sfx] ---------- */

const COLORS = ["#ff4f6d", "#ffc93c", "#2ec4d6"];

export function sfx(word, x, y) {
  if (reducedMotion()) return;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const ink = color === "#ff4f6d" ? "#ffffff" : "#1b1726";
  const el = h("div", { class: "sfx", "aria-hidden": "true" }, burst(word, { color, ink }));
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.append(el);
  setTimeout(() => el.remove(), 800);
}

export function initSfx() {
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-sfx]");
    if (!t) return;
    const r = t.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2;
    const y = e.clientY || r.top;
    sfx(t.dataset.sfx, x, y - 30);
  });
}

/* ---------- Copy e-mail ---------- */

export function initCopyEmail() {
  const btn = $("#copy-email");
  if (!btn) return;
  const label = btn.querySelector("span");
  btn.addEventListener("click", async (e) => {
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      label.textContent = "Copied";
      sfx("Copied!", e.clientX || innerWidth / 2, (e.clientY || innerHeight / 2) - 30);
    } catch {
      // clipboard blocked: select the address so it can be copied by hand
      const range = document.createRange();
      range.selectNodeContents($("#email-link"));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      label.textContent = "Press Ctrl+C";
    }
    setTimeout(() => (label.textContent = "Copy"), 2200);
  });
}

/* ---------- The easel ---------- */

export function initEasel() {
  const canvas = $("#easel");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const swatches = $$(".swatch");
  const size = $("#brush");
  let color = "#1b1726";
  let drawing = false;
  let last = null;
  let strokes = 0;

  const paper = () => {
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(27,23,38,0.25)";
    ctx.font = "28px Bangers, Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("draw here", canvas.width / 2, canvas.height / 2);
  };

  // restore the last doodle from this browser
  const saved = store.get("ni-doodle");
  let blank = !saved;
  if (saved) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = saved;
  } else {
    document.fonts?.ready.then(paper);
    paper();
  }

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (blank) {
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      blank = false;
    }
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    last = pos(e);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(last.x, last.y, size.value / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    const pressure = e.pressure && e.pointerType === "pen" ? 0.4 + e.pressure : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = size.value * pressure;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  });
  const end = () => {
    if (!drawing) return;
    drawing = false;
    strokes++;
    store.set("ni-doodle", canvas.toDataURL("image/png"));
    if (strokes >= 3) unlock("picasso");
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  swatches.forEach((s) =>
    s.addEventListener("click", () => {
      color = s.dataset.color;
      swatches.forEach((o) => o.setAttribute("aria-pressed", String(o === s)));
    })
  );

  $("#easel-clear").addEventListener("click", () => {
    paper();
    strokes = 0;
    blank = true;
    try {
      localStorage.removeItem("ni-doodle");
    } catch {}
  });

  $("#easel-save").addEventListener("click", () => {
    const a = h("a", { href: canvas.toDataURL("image/png"), download: "doodle-for-rifat.png" });
    document.body.append(a);
    a.click();
    a.remove();
    toast("Saved", "Your doodle is in your downloads. Send it over, I'd like to see it.", "✎");
  });
}

/* ---------- Player card flip ---------- */

export function initPlayerCard() {
  const card = $("#player-card");
  if (!card) return;
  card.addEventListener("click", () => {
    const flipped = card.getAttribute("aria-pressed") === "true";
    card.setAttribute("aria-pressed", String(!flipped));
  });
}

/* ---------- Kick-off mode (Konami code) ---------- */

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

const BALL_SVG = `<svg viewBox="0 0 64 64"><defs><clipPath id="ballclip"><circle cx="32" cy="32" r="29"/></clipPath></defs><circle cx="32" cy="32" r="29" fill="#fffaf0"/><g clip-path="url(#ballclip)"><polygon points="43.8,15.8 40.1,4.6 49.6,-2.3 59.1,4.6 55.5,15.8" fill="#1b1726"/><polygon points="51.0,38.2 60.5,31.3 70.0,38.2 66.4,49.4 54.7,49.4" fill="#1b1726"/><polygon points="32.0,52.0 41.5,58.9 37.9,70.1 26.1,70.1 22.5,58.9" fill="#1b1726"/><polygon points="13.0,38.2 9.3,49.4 -2.4,49.4 -6.0,38.2 3.5,31.3" fill="#1b1726"/><polygon points="20.2,15.8 8.5,15.8 4.9,4.6 14.4,-2.3 23.9,4.6" fill="#1b1726"/><g stroke="#1b1726" stroke-width="2.2" fill="none"><path d="M32.0,22.5 L32.0,3.0"/><path d="M41.0,29.1 L59.6,23.0"/><path d="M37.6,39.7 L49.0,55.5"/><path d="M26.4,39.7 L15.0,55.5"/><path d="M23.0,29.1 L4.4,23.0"/></g></g><polygon points="32.0,22.5 41.0,29.1 37.6,39.7 26.4,39.7 23.0,29.1" fill="#1b1726"/><circle cx="32" cy="32" r="29" fill="none" stroke="#1b1726" stroke-width="4"/></svg>`;

export function initKickoff() {
  let seq = [];
  let active = false;

  addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    seq = [...seq, key].slice(-KONAMI.length);
    if (!active && seq.join() === KONAMI.join()) {
      active = true;
      kickoff(() => (active = false));
    }
  });
}

function kickoff(onEnd) {
  const ball = h("button", { class: "ball", type: "button", "aria-label": "Football. Click to kick it.", html: BALL_SVG });
  const banner = h("div", { class: "kickoff-banner", role: "status" }, "Kick-off! Click the ball. Esc ends the match.");
  document.body.append(ball, banner);

  const R = 32;
  let x = innerWidth / 2;
  let y = 120;
  let vx = (Math.random() - 0.5) * 8;
  let vy = 0;
  let rot = 0;
  let kicks = 0;
  let raf = 0;
  let idle = performance.now();

  const step = () => {
    vy += 0.45;
    x += vx;
    y += vy;
    vx *= 0.995;
    if (x < R) { x = R; vx = Math.abs(vx) * 0.8; }
    if (x > innerWidth - R) { x = innerWidth - R; vx = -Math.abs(vx) * 0.8; }
    if (y > innerHeight - R) {
      y = innerHeight - R;
      vy = -Math.abs(vy) * 0.72;
      vx *= 0.92;
      if (Math.abs(vy) < 1.2) vy = 0;
    }
    if (y < R) { y = R; vy = Math.abs(vy); }
    rot += vx * 2;
    ball.style.transform = `translate(${x - R}px, ${y - R}px) rotate(${rot}deg)`;
    if (performance.now() - idle > 30000) return end();
    raf = requestAnimationFrame(step);
  };

  ball.addEventListener("pointerdown", (e) => {
    const dx = x - e.clientX;
    vx = (dx >= 0 ? 1 : -1) * (6 + Math.random() * 6);
    vy = -14 - Math.random() * 5;
    kicks++;
    idle = performance.now();
    sfx(kicks === 3 ? "Hat-trick!" : ["Thwack!", "Boot!", "Pow!"][kicks % 3], e.clientX, e.clientY - 50);
    if (kicks === 3) unlock("hattrick");
  });

  const onKey = (e) => e.key === "Escape" && end();
  addEventListener("keydown", onKey);

  function end() {
    cancelAnimationFrame(raf);
    removeEventListener("keydown", onKey);
    ball.remove();
    banner.remove();
    onEnd();
  }

  setTimeout(() => banner.remove(), 5000);
  raf = requestAnimationFrame(step);
}
