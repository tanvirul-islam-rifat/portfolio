import { $, h } from "./utils.js";
import { LAYERS, SPOKEN } from "../data/skills.js";
import { PROJECTS } from "../data/projects.js";
import { openCase } from "./casefile.js";

/**
 * Three-layer skill network. Edges are derived from projects:
 * language—tool when a project uses both, tool—domain when a project
 * uses the tool and belongs to that domain. Selecting a node lights up
 * every project that uses it and the paths those projects take.
 */
export function initSkillMap() {
  const net = $("#net");
  const svg = $("#net-edges");
  const layersEl = $("#net-layers");
  const readout = $("#readout");
  if (!net) return;

  const [LANG, TOOL, DOMAIN] = LAYERS;
  const ids = (layer) => new Set(layer.nodes.map((n) => n.id));
  const langIds = ids(LANG);
  const toolIds = ids(TOOL);
  const domainIds = ids(DOMAIN);
  const labelOf = Object.fromEntries(LAYERS.flatMap((l) => l.nodes.map((n) => [n.id, n.label])));

  // which projects light up each node
  const projectsOf = (id) =>
    PROJECTS.filter((p) => (domainIds.has(id) ? p.categories.includes(id) : (p.skills || []).includes(id)));

  // edges with the projects that justify them
  const edges = new Map();
  const addEdge = (a, b, pid) => {
    const key = `${a}|${b}`;
    if (!edges.has(key)) edges.set(key, { a, b, projects: new Set() });
    edges.get(key).projects.add(pid);
  };
  for (const p of PROJECTS) {
    const sk = p.skills || [];
    const L = sk.filter((s) => langIds.has(s));
    const T = sk.filter((s) => toolIds.has(s));
    const D = p.categories.filter((c) => domainIds.has(c));
    L.forEach((l) => T.forEach((t) => addEdge(l, t, p.id)));
    T.forEach((t) => D.forEach((d) => addEdge(t, d, p.id)));
  }

  // build the layers
  const btns = new Map();
  layersEl.replaceChildren(
    ...LAYERS.map((layer) =>
      h(
        "div",
        { class: "net__layer", role: "group", "aria-label": layer.label },
        h("span", { class: "net__layer-label" }, layer.label),
        layer.nodes.map((n) => {
          const count = projectsOf(n.id).length;
          const b = h(
            "button",
            { class: "neuron", type: "button", "data-node": n.id, "aria-pressed": "false" },
            n.label,
            h("span", { class: "n-count", "aria-label": `${count} projects` }, count)
          );
          btns.set(n.id, b);
          return b;
        })
      )
    )
  );

  // draw edges as curves between node centres
  const paths = new Map();
  function layout() {
    const box = net.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const horizontal = btns.get("pytorch").getBoundingClientRect().left > btns.get("python").getBoundingClientRect().right;
    const frag = document.createDocumentFragment();
    paths.clear();
    for (const [key, e] of edges) {
      const ra = btns.get(e.a).getBoundingClientRect();
      const rb = btns.get(e.b).getBoundingClientRect();
      let d;
      if (horizontal) {
        const x1 = ra.right - box.left;
        const y1 = ra.top + ra.height / 2 - box.top;
        const x2 = rb.left - box.left;
        const y2 = rb.top + rb.height / 2 - box.top;
        const mx = (x1 + x2) / 2;
        d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      } else {
        const x1 = ra.left + ra.width / 2 - box.left;
        const y1 = ra.bottom - box.top;
        const x2 = rb.left + rb.width / 2 - box.left;
        const y2 = rb.top - box.top;
        const my = (y1 + y2) / 2;
        d = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
      }
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      paths.set(key, path);
      frag.append(path);
    }
    svg.replaceChildren(frag);
    if (current) focus(current, pinned);
  }

  // focus logic
  let current = null;
  let pinned = false;

  function focus(id, pin = false) {
    current = id;
    pinned = pin;
    const projects = projectsOf(id);
    const pids = new Set(projects.map((p) => p.id));
    const lit = new Set([id]);
    for (const p of projects) {
      (p.skills || []).forEach((s) => lit.add(s));
      p.categories.forEach((c) => lit.add(c));
    }
    net.classList.add("is-focused");
    for (const [nid, b] of btns) {
      b.classList.toggle("is-lit", lit.has(nid));
      b.classList.toggle("is-active", nid === id);
      b.setAttribute("aria-pressed", String(nid === id && pin));
    }
    for (const [key, e] of edges) {
      const on = [...e.projects].some((p) => pids.has(p)) && lit.has(e.a) && lit.has(e.b);
      paths.get(key)?.classList.toggle("is-lit", on);
    }
    renderReadout(id, projects);
  }

  function clear() {
    current = null;
    pinned = false;
    net.classList.remove("is-focused");
    btns.forEach((b) => {
      b.classList.remove("is-lit", "is-active");
      b.setAttribute("aria-pressed", "false");
    });
    paths.forEach((p) => p.classList.remove("is-lit"));
    readout.replaceChildren(
      h("h3", { class: "readout__title" }, "Pick a neuron"),
      h("p", {}, "Hover or tap any skill to light up its connections and the projects that use it.")
    );
  }

  function renderReadout(id, projects) {
    const shown = projects.filter((p) => p.tier !== "archive");
    const extra = projects.length - shown.length;
    readout.replaceChildren(
      h("h3", { class: "readout__title" }, labelOf[id]),
      h("p", {}, `${projects.length} project${projects.length === 1 ? "" : "s"} use${projects.length === 1 ? "s" : ""} this.${extra ? ` Includes ${extra} first-year project${extra === 1 ? "" : "s"}.` : ""}`),
      h(
        "ul",
        {},
        shown.slice(0, 8).map((p) =>
          h("li", {}, h("button", { type: "button", onclick: () => openCase(p) }, p.title, h("small", {}, p.course)))
        )
      )
    );
  }

  for (const [id, b] of btns) {
    b.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse" && !pinned) focus(id);
    });
    b.addEventListener("focus", () => {
      if (!pinned) focus(id);
    });
    b.addEventListener("click", () => {
      if (pinned && current === id) clear();
      else focus(id, true);
    });
  }
  net.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse" && !pinned) clear();
  });
  net.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clear();
  });

  // spoken languages line
  $("#spoken").replaceChildren(
    h("li", {}, h("b", {}, "Spoken:")),
    ...SPOKEN.map((s) => h("li", {}, h("b", {}, s.label), ` ${s.level}`))
  );

  new ResizeObserver(() => requestAnimationFrame(layout)).observe(net);
  document.fonts?.ready.then(layout);
  layout();
}
