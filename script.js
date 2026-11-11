const data = window.PORTFOLIO;
const projectsNode = document.querySelector("#projects");
const filtersNode = document.querySelector("#filters");
const dialog = document.querySelector("#project-dialog");
const lightbox = document.querySelector("#image-lightbox");
const lightboxImage = lightbox.querySelector(".lightbox-image");
const lightboxScale = lightbox.querySelector(".lightbox-scale");
const lightboxNav = lightbox.querySelector(".lightbox-nav");
let lightboxGallery = [];
let lightboxIndex = 0;
let lightboxTitle = "";
let suppressLightboxImageClick = false;

function showLightboxImage(index) {
  lightboxIndex = (index + lightboxGallery.length) % lightboxGallery.length;
  lightboxImage.src = lightboxGallery[lightboxIndex];
  lightboxImage.alt = `${lightboxTitle} — изображение ${lightboxIndex + 1}`;
  lightbox.querySelector(".lightbox-caption").textContent = lightboxTitle;
  lightbox.querySelector(".lightbox-count").textContent = `${lightboxIndex + 1} / ${lightboxGallery.length}`;
  lightboxNav.hidden = lightboxGallery.length < 2;
  lightboxImage.classList.remove("actual-size");
  lightboxScale.textContent = "100%";
}

function openImageLightbox(image, gallery = [], index = 0, title = "") {
  lightboxGallery = gallery.length ? gallery : [image.currentSrc || image.src];
  lightboxTitle = title || image.alt.replace(/\s+[—-]\s+превью проекта$/i, "");
  showLightboxImage(index);
  lightbox.showModal();
}

document.querySelector("#dialog-content").addEventListener("click", event => {
  const image = event.target.closest(".gallery-image");
  if (!image) return;
  const frame = image.closest(".gallery-frame");
  const gallery = frame._gallery || [image.currentSrc || image.src];
  openImageLightbox(image, gallery, frame._galleryIndex || 0, frame._galleryTitle || image.alt);
});
document.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", event => { if (event.target === lightbox) lightbox.close(); });
lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showLightboxImage(lightboxIndex - 1));
lightbox.querySelector(".lightbox-next").addEventListener("click", () => showLightboxImage(lightboxIndex + 1));
lightbox.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" && lightboxGallery.length > 1) { event.preventDefault(); showLightboxImage(lightboxIndex - 1); }
  if (event.key === "ArrowRight" && lightboxGallery.length > 1) { event.preventDefault(); showLightboxImage(lightboxIndex + 1); }
});
const lightboxStage = lightbox.querySelector(".lightbox-stage");
let swipeStart = null;
lightboxStage.addEventListener("pointerdown", event => {
  swipeStart = event.pointerType === "touch" && !lightboxImage.classList.contains("actual-size") ? event.clientX : null;
});
lightboxStage.addEventListener("pointerup", event => {
  if (swipeStart === null || lightboxGallery.length < 2) return;
  const distance = event.clientX - swipeStart;
  if (Math.abs(distance) > 55) {
    suppressLightboxImageClick = true;
    showLightboxImage(lightboxIndex + (distance < 0 ? 1 : -1));
    setTimeout(() => { suppressLightboxImageClick = false; }, 0);
  }
  swipeStart = null;
});
function toggleLightboxScale() {
  const actualSize = lightboxImage.classList.toggle("actual-size");
  lightboxScale.textContent = actualSize ? "Вписать" : "100%";
}
lightboxScale.addEventListener("click", toggleLightboxScale);
lightboxImage.addEventListener("click", () => {
  if (suppressLightboxImageClick) return;
  toggleLightboxScale();
});

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
    card.addEventListener("click", event => {
      const image = event.target.closest(".project-visual img");
      if (image) {
        const gallery = project.images || (project.image ? [project.image] : [cover]);
        const index = Math.max(0, gallery.indexOf(cover));
        openImageLightbox(image, gallery, index, project.title);
      }
      else openProject(project);
    });
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
  let index = 0;
  const frame = dialog.querySelector(".gallery-frame");
  if (frame) {
    frame._gallery = gallery;
    frame._galleryIndex = index;
    frame._galleryTitle = p.title;
  }
  if (gallery.length > 1) {
    const counter = dialog.querySelector(".gallery-count");
    const show = next => {
      index = (next + gallery.length) % gallery.length;
      const img = document.createElement("img");
      img.className = "gallery-image";
      img.src = gallery[index];
      img.alt = `${p.title} — изображение ${index + 1}`;
      img.fetchPriority = "high";
      frame.replaceChildren(img);
      frame._galleryIndex = index;
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
