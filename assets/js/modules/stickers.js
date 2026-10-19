import { $, h, burst, store } from "./utils.js";

/**
 * Six collectible stickers hidden around the site.
 * Unlocked ones are saved in localStorage so they survive a reload.
 */
const STICKERS = [
  { id: "edition", glyph: "☾", title: "Both editions", hint: "Switch between night and day." },
  { id: "casefile", glyph: "?!", title: "Fact checker", hint: "Open a project's case file." },
  { id: "neurons", glyph: "ZAP", title: "Neuron whisperer", hint: "Fire 10 neurons on the cover." },
  { id: "picasso", glyph: "✎", title: "Picasso", hint: "Paint something on the easel." },
  { id: "hattrick", glyph: "⚽", title: "Hat-trick", hint: "Find the kick-off code, then kick the ball 3 times." },
  { id: "cover", glyph: "END", title: "Cover to cover", hint: "Read all the way to the last page." },
];

let got = new Set(store.get("ni-stickers", []));

function updateCount() {
  $("#sticker-n").textContent = got.size;
  $("#sticker-total").textContent = STICKERS.length;
}

function renderAlbum() {
  const grid = $("#album-grid");
  grid.replaceChildren(
    ...STICKERS.map((s) => {
      const has = got.has(s.id);
      return h(
        "li",
        { class: `album__item${has ? " is-got" : ""}` },
        burst(has ? s.glyph : "?"),
        h("b", {}, has ? s.title : "Not found yet"),
        h("span", {}, s.hint)
      );
    })
  );
}

export function toast(title, text, glyph = "★") {
  const box = $("#toasts");
  const iconWrap = burst(glyph);
  iconWrap.querySelector(".burst").classList.add("toast__icon");
  const t = h(
    "div",
    { class: "toast", role: "status" },
    iconWrap,
    h("div", {}, h("div", { class: "toast__title" }, title), h("p", { class: "toast__text" }, text))
  );
  box.append(t);
  setTimeout(() => {
    t.classList.add("is-leaving");
    t.addEventListener("animationend", () => t.remove(), { once: true });
  }, 3600);
}

export function unlock(id) {
  if (got.has(id)) return;
  const s = STICKERS.find((x) => x.id === id);
  if (!s) return;
  got.add(id);
  store.set("ni-stickers", [...got]);
  updateCount();
  toast(`Sticker: ${s.title}`, `${got.size} of ${STICKERS.length} collected. Open the album from the star.`, s.glyph);
  if (got.size === STICKERS.length) {
    setTimeout(() => toast("Full album!", "You found every sticker. You'd make a good code reviewer.", "★"), 900);
  }
}

export function initStickers() {
  updateCount();
  const album = $("#album");
  $("#album-open").addEventListener("click", () => {
    renderAlbum();
    album.showModal();
  });
  $("#album-close").addEventListener("click", () => album.close());
  album.addEventListener("click", (e) => {
    if (e.target === album) album.close();
  });

  // "Cover to cover": the footer comes into view
  const footer = document.querySelector(".footer");
  if (footer && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        unlock("cover");
        io.disconnect();
      }
    });
    io.observe(footer);
  }
}
