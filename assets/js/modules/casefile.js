import { $, h, icon } from "./utils.js";
import { unlock } from "./stickers.js";

/**
 * The "case file": a full write-up of one project in a <dialog>.
 * Deep-linkable: /#case-hymacnet opens HyMaC-Net directly.
 */
let lastFocus = null;

function section(title, items) {
  if (!items || !items.length) return null;
  return [h("h3", {}, title), h("ul", { class: "points" }, items.map((t) => h("li", {}, t)))];
}

function figure(src, alt, isVideo = false, poster) {
  if (isVideo) {
    const v = h("video", { controls: true, muted: true, loop: true, playsinline: true, preload: "metadata", poster });
    v.append(h("source", { src: src.replace(/\.mp4$/, ".webm"), type: "video/webm" }), h("source", { src, type: "video/mp4" }));
    return h("figure", {}, v, h("figcaption", {}, alt));
  }
  return h("figure", {}, h("img", { src, alt, loading: "lazy", decoding: "async" }), h("figcaption", {}, alt));
}

export function openCase(p) {
  const dlg = $("#casefile");
  const body = $("#casefile-body");
  lastFocus = document.activeElement;

  $("#casefile-label").textContent = `Case file: ${p.course}`;

  const media = [];
  if (p.media) media.push(figure(p.media.src, p.media.alt, p.media.type === "video", p.media.poster));
  (p.gallery || []).forEach((g) => media.push(figure(g.src, g.alt)));

  const parts = [
    p.status ? h("span", { class: "stamp", style: "float:right;margin:0 0 1rem 1rem" }, p.status) : null,
    h("h2", { class: "casefile__title", id: "casefile-title" }, p.title),
    h("p", { class: "casefile__subtitle" }, p.subtitle),
    h("p", {}, p.summary),
    p.team ? h("p", { class: "casefile__team" }, p.team) : null,
    p.metrics?.length ? h("div", { class: "casefile__grid" }, p.metrics.map((m) =>
      h("div", { class: "metric" }, h("span", { class: "metric__value" }, m.value), h("span", { class: "metric__label" }, m.label))
    )) : null,
    p.problem ? [h("h3", {}, "The problem"), h("p", {}, p.problem)] : null,
    section("How it works", p.approach),
    section("What came out of it", p.results),
    media.length ? [h("h3", {}, "Figures"), ...media] : null,
    h("ul", { class: "tags", style: "margin-top:2rem", "aria-label": "Built with" }, (p.stack || []).map((s) => h("li", {}, s))),
    h(
      "div",
      { class: "casefile__links" },
      (p.links || []).map((l, i) =>
        h("a", { class: `btn btn--small${i === 0 ? " btn--primary" : ""}`, href: l.href, target: "_blank", rel: "noopener" }, icon("i-github"), l.label)
      )
    ),
  ];
  // replaceChildren does not skip nulls or flatten arrays, so do it here
  body.replaceChildren(...parts.flat(2).filter(Boolean));

  body.scrollTop = 0;
  dlg.showModal();
  document.body.classList.add("is-locked");
  $("#casefile-close").focus();
  history.replaceState(null, "", `#case-${p.id}`);
  unlock("casefile");
}

export function initCasefile(findProject) {
  const dlg = $("#casefile");
  $("#casefile-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close(); // backdrop click
  });
  dlg.addEventListener("close", () => {
    document.body.classList.remove("is-locked");
    dlg.querySelectorAll("video").forEach((v) => v.pause());
    if (location.hash.startsWith("#case-")) history.replaceState(null, "", "#projects");
    lastFocus?.focus?.({ preventScroll: true });
  });

  const openFromHash = () => {
    const m = location.hash.match(/^#case-([\w-]+)$/);
    if (!m) return;
    const p = findProject(m[1]);
    if (p) openCase(p);
  };
  addEventListener("hashchange", openFromHash);
  return openFromHash;
}
