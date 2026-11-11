const data = window.PORTFOLIO;
const projectsNode = document.querySelector("#projects");
const filtersNode = document.querySelector("#filters");
const dialog = document.querySelector("#project-dialog");

document.querySelectorAll("[data-profile]").forEach((node) => {
  const key = node.dataset.profile;
  const value = data.profile[key];
  if (!value) return;
  if (key.endsWith("-link")) {
    const profileKey = key.replace("-link", "");
    node.href = profileKey === "email" ? `mailto:${data.profile.email}` : data.profile[profileKey];
  } else if (key === "education") node.innerHTML = escapeHtml(value).replace(/; /g, "<br>");
  else if (node.tagName === "A") node.textContent = value;
  else node.textContent = value;
});
document.querySelector("#year").textContent = new Date().getFullYear();

const categories = data.categories || ["Все работы", ...new Set(data.projects.map(p => p.category))];
let active = "Все работы";
categories.forEach((category, i) => {
  const button = document.createElement("button");
  button.className = `filter${i === 0 ? " active" : ""}`;
  button.textContent = category;
  button.setAttribute("aria-pressed", String(i === 0));
  button.addEventListener("click", () => { active = category; filtersNode.querySelectorAll("button").forEach(b => { const selected = b === button; b.classList.toggle("active", selected); b.setAttribute("aria-pressed", String(selected)); }); render(); });
  filtersNode.append(button);
});

function render() {
  projectsNode.replaceChildren();
  const shown = data.projects.filter(p => active === "Все работы" || p.category === active);
  shown.forEach(project => {
    const card = document.createElement("button");
    card.className = "project-card";
    card.type = "button";
    const visual = document.createElement("span");
    visual.className = `project-visual ${project.color || "sage"}`;
    const cover = project.cover || project.images?.[0] || project.image;
    if (cover) {
      visual.classList.add("has-image");
      const img = document.createElement("img");
      img.src = cover;
      img.alt = `${project.title} — превью проекта`;
      img.loading = "lazy";
      const fitArtwork = () => {
        if (img.naturalWidth && img.naturalHeight) visual.style.setProperty("--project-ratio", `${img.naturalWidth} / ${img.naturalHeight}`);
      };
      img.addEventListener("load", fitArtwork, { once: true });
      if (img.complete) fitArtwork();
      visual.append(img);
    } else visual.innerHTML = `<span class="visual-mark">${project.number || "✳"}</span><span class="visual-caption">${project.category}</span>`;
    const info = document.createElement("span"); info.className = "project-info";
    info.innerHTML = `<span><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.category)}</small></span><span class="project-year" aria-hidden="true">↗</span>`;
    card.append(visual, info);
    card.addEventListener("click", () => openProject(project));
    projectsNode.append(card);
  });
  document.querySelector("#demo-note").hidden = !data.projects.some(p => p.demo);
}
function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c])); }
function openProject(p) {
  const gallery = p.images || (p.image ? [p.image] : []);
  const first = gallery[0] || p.cover;
  const galleryMarkup = first ? `<div class="project-gallery" data-index="0"><div class="gallery-frame"><img class="gallery-image" src="${escapeHtml(first)}" alt="${escapeHtml(p.title)}" fetchpriority="high"></div>${gallery.length > 1 ? `<button class="gallery-control gallery-prev" type="button" aria-label="Предыдущее изображение">←</button><button class="gallery-control gallery-next" type="button" aria-label="Следующее изображение">→</button><span class="gallery-count">1 / ${gallery.length}</span>` : ""}</div>` : `<div class="dialog-visual ${escapeHtml(p.color || "sage")}"><span>${escapeHtml(p.number || "✳")}</span></div>`;
  const sources = (p.sourceFiles || []).map(file => `<a href="${escapeHtml(encodeURI(file.path))}" target="_blank" rel="noreferrer">${escapeHtml(file.label)} ↗</a>`).join("");
  document.querySelector("#dialog-content").innerHTML = `${galleryMarkup}<p class="eyebrow">${escapeHtml(p.category)}</p><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.description || "")}</p>${sources ? `<div class="project-source-links"><span class="meta-label">Материалы проекта</span>${sources}</div>` : ""}`;
  if (gallery.length > 1) {
    let index = 0;
    const frame = dialog.querySelector(".gallery-frame");
    const counter = dialog.querySelector(".gallery-count");
    const show = next => {
      index = (next + gallery.length) % gallery.length;
      const img = document.createElement("img");
      img.className = "gallery-image";
      img.src = gallery[index];
      img.alt = `${p.title} — изображение ${index + 1}`;
      img.fetchPriority = "high";
      frame.replaceChildren(img);
      counter.textContent = `${index + 1} / ${gallery.length}`;
    };
    dialog.querySelector(".gallery-prev").addEventListener("click", () => show(index - 1));
    dialog.querySelector(".gallery-next").addEventListener("click", () => show(index + 1));
    dialog.onkeydown = event => {
      if (event.key === "ArrowLeft") show(index - 1);
      if (event.key === "ArrowRight") show(index + 1);
    };
  } else dialog.onkeydown = null;
  dialog.showModal();
}
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
render();
