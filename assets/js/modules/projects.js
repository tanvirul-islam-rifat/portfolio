import { $, h, icon, burst } from "./utils.js";
import { PROJECTS, CATEGORIES, NEXT_ISSUE } from "../data/projects.js";
import { openCase } from "./casefile.js";

const COVER_COLORS = {
  systems: "#ffc93c",
  algorithms: "#2ec4d6",
  web: "#ff8fa3",
  networks: "#8fd694",
  ai: "#b9a8ff",
};

/* ---------- small renderers ---------- */

function metricEl(m) {
  return h(
    "div",
    { class: "metric" },
    h("span", { class: "metric__value" }, m.value),
    h("span", { class: "metric__label" }, m.label)
  );
}

function mediaEl(p, { eager = false } = {}) {
  const m = p.media;
  if (!m) {
    const color = COVER_COLORS[p.categories[0]] || "#ffc93c";
    const cover = h(
      "div",
      { class: "frame__cover", "aria-hidden": "true" },
      h("span", { class: "glyph" }, p.cover?.glyph || "#"),
      p.cover?.text ? h("pre", {}, p.cover.text) : null
    );
    cover.style.setProperty("--cover-bg", color);
    return h("div", { class: "frame__media" }, cover);
  }
  if (m.type === "video") {
    // autoplay muted loops only while visible; poster otherwise
    const v = h("video", {
      muted: true,
      loop: true,
      playsinline: true,
      preload: "none",
      poster: m.poster,
      "aria-label": m.alt,
      "data-autoplay": true,
    });
    v.muted = true;
    v.append(
      h("source", { src: m.src.replace(/\.mp4$/, ".webm"), type: "video/webm" }),
      h("source", { src: m.src, type: "video/mp4" })
    );
    return h("div", { class: "frame__media" }, v);
  }
  return h(
    "div",
    { class: `frame__media${m.contain ? " is-contain" : ""}` },
    h("img", { src: m.src, alt: m.alt, loading: eager ? "eager" : "lazy", decoding: "async" })
  );
}

function frameEl(p, small = false) {
  const shadows = ["", "panel--pop-yellow", "", "panel--pop-cyan", "", "panel--pop-red"];
  const idx = PROJECTS.indexOf(p);
  const cls = [
    "frame",
    "panel",
    small ? "frame--small" : "",
    p.layout === "wide" ? "frame--wide" : "",
    p.layout === "banner" ? "frame--banner" : "",
    shadows[idx % shadows.length],
  ]
    .filter(Boolean)
    .join(" ");

  const el = h(
    "article",
    { class: cls, "data-id": p.id, "data-cats": p.categories.join(" ") },
    mediaEl(p),
    h(
      "div",
      { class: "frame__body" },
      h("span", { class: "frame__course" }, p.course),
      h("h3", { class: "frame__title" }, p.title),
      h("p", { class: "frame__subtitle" }, p.subtitle),
      small ? null : h("p", { class: "frame__summary" }, p.summary),
      p.metrics?.length
        ? h("div", { class: "frame__metrics" }, p.metrics.slice(0, small ? 1 : 3).map(metricEl))
        : null,
      h("ul", { class: "tags", "aria-label": "Built with" }, (p.stack || []).slice(0, small ? 3 : 5).map((s) => h("li", {}, s))),
      h("span", { class: "frame__open", "aria-hidden": "true" }, "Open case file", icon("i-arrow"))
    ),
    h("button", {
      class: "frame__hit",
      type: "button",
      "aria-label": `Open case file: ${p.title}`,
      onclick: () => openCase(p),
    })
  );
  return el;
}

function paperEl(p, side) {
  return h(
    "article",
    { class: `paper panel ${side ? "paper--side panel--pop-cyan" : "panel--pop-yellow"}`, "data-id": p.id },
    h(
      "div",
      { class: "paper__top" },
      h("div", {}, h("span", { class: "paper__course" }, p.course), h("h3", { class: "paper__title" }, p.title)),
      h("span", { class: `stamp${side ? " stamp--quiet" : ""}` }, p.status)
    ),
    h("p", { class: "paper__subtitle" }, p.subtitle),
    h(
      "figure",
      { class: "paper__figure" },
      h("img", { src: p.media.src, alt: p.media.alt, loading: "lazy", decoding: "async" })
    ),
    h("p", {}, p.summary),
    h("div", { class: "paper__metrics" }, p.metrics.map(metricEl)),
    h("p", { class: "paper__team" }, p.team),
    h(
      "div",
      { class: "paper__actions" },
      h("button", { class: "btn btn--small btn--primary", type: "button", onclick: () => openCase(p) }, "Read the case file"),
      h(
        "a",
        { class: "btn btn--small", href: p.links[0].href, target: "_blank", rel: "noopener" },
        icon("i-github"),
        "Code"
      )
    )
  );
}

/* ---------- sections ---------- */

function renderResearch() {
  const list = $("#research-list");
  const papers = PROJECTS.filter((p) => p.tier === "research");
  list.replaceChildren(...papers.map((p, i) => paperEl(p, i > 0)));
}

function renderProjects() {
  const feature = PROJECTS.filter((p) => p.tier === "feature");
  const more = PROJECTS.filter((p) => p.tier === "more");
  $("#feature-grid").replaceChildren(...feature.map((p) => frameEl(p)));
  $("#more-grid").replaceChildren(...more.map((p) => frameEl(p, true)));
}

function renderNextIssue() {
  const n = NEXT_ISSUE;
  $("#next-issue").replaceChildren(
    burst("Coming soon!"),
    h(
      "div",
      {},
      h("h3", {}, n.title),
      h("p", {}, n.text),
      h("ul", { class: "tags", "aria-label": "Planned stack" }, n.stack.map((s) => h("li", {}, s)))
    )
  );
}

function renderBackIssues() {
  const items = PROJECTS.filter((p) => p.tier === "archive");
  $("#back-issues-count").textContent = `${items.length} first-year projects`;
  $("#back-list").replaceChildren(
    ...items.map((p) =>
      h(
        "li",
        {},
        h("span", { class: "bi-course" }, p.course),
        h("span", { class: "bi-title" }, p.title),
        h("span", { class: "bi-sub" }, p.subtitle),
        h("a", { class: "text-link", href: p.links[0].href, target: "_blank", rel: "noopener" }, "Code")
      )
    )
  );
}

/* ---------- filters ---------- */

function renderFilters() {
  const pool = PROJECTS.filter((p) => p.tier === "feature" || p.tier === "more");
  const ul = $("#filters");
  const cats = CATEGORIES.filter(
    (c) => c.id === "all" || pool.some((p) => p.categories.includes(c.id))
  );

  ul.replaceChildren(
    ...cats.map((c) => {
      const count = c.id === "all" ? pool.length : pool.filter((p) => p.categories.includes(c.id)).length;
      return h(
        "li",
        {},
        h(
          "button",
          {
            class: "chip",
            type: "button",
            "aria-pressed": c.id === "all" ? "true" : "false",
            "data-cat": c.id,
            onclick: (e) => applyFilter(c.id, e.currentTarget),
          },
          c.label,
          h("span", { class: "count" }, count)
        )
      );
    })
  );
}

function applyFilter(cat, btn) {
  document.querySelectorAll("#filters .chip").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  let shown = 0;
  let moreShown = 0;
  document.querySelectorAll("#feature-grid .frame, #more-grid .frame").forEach((f) => {
    const ok = cat === "all" || f.dataset.cats.split(" ").includes(cat);
    f.hidden = !ok;
    if (ok) {
      shown++;
      if (f.parentElement.id === "more-grid") moreShown++;
    }
  });
  $("#more-head").hidden = moreShown === 0;
  $("#filter-status").textContent = `${shown} projects shown`;
}

/* ---------- video autoplay while visible ---------- */

function wireVideos() {
  const vids = document.querySelectorAll("video[data-autoplay]");
  if (!("IntersectionObserver" in window)) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) {
          v.preload = "auto";
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      }
    },
    { threshold: 0.35 }
  );
  vids.forEach((v) => io.observe(v));
}

export function initProjects() {
  renderResearch();
  renderFilters();
  renderProjects();
  renderNextIssue();
  renderBackIssues();
  wireVideos();
}

export function findProject(id) {
  return PROJECTS.find((p) => p.id === id);
}
