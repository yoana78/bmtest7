let lang = "ko";

function renderPageHero(data) {
  const root = document.getElementById("page-hero-root");
  if (data.image) root.querySelector("img.hero-bg").src = data.image;
  root.querySelector(".eyebrow span").textContent = t(data, "eyebrow", lang);
  root.querySelector("h1").textContent = t(data, "title", lang);
  root.querySelector(".hero-body").textContent = t(data, "body", lang);
}

function renderExhibitions(intro, list) {
  document.querySelector("#expo-root .section-title").textContent = t(intro, "title");
  const root = document.getElementById("expo-list");
  root.innerHTML = "";
  list.forEach((expo) => {
    root.appendChild(
      el("div", { class: "expo-block", "data-reveal": "" }, [
        el("div", { class: "expo-head" }, [
          el("h3", { text: t(expo, "title") }),
          el("span", { class: "expo-location", text: t(expo, "location") }),
        ]),
        el(
          "div",
          { class: "expo-gallery" },
          expo.photos.map((src) => el("div", { class: "expo-photo" }, [el("img", { src, alt: t(expo, "title"), loading: "lazy" })]))
        ),
      ])
    );
  });
}

function renderLogoSection(rootId, gridId, intro, list, muted) {
  const root = document.getElementById(rootId);
  root.querySelector(".section-title").textContent = t(intro, "title");
  const bodyEl = root.querySelector(".section-body");
  if (bodyEl) bodyEl.textContent = t(intro, "body");
  const grid = document.getElementById(gridId);
  grid.innerHTML = "";
  list.forEach((item) => {
    grid.appendChild(
      item.logo
        ? el("div", { class: "logo-card" + (muted ? " muted" : "") }, [el("img", { src: item.logo, alt: item.name, loading: "lazy" })])
        : el("div", { class: "logo-card placeholder" }, [el("span", { text: lang === "en" ? "Logo coming soon" : "로고 추가 예정" })])
    );
  });
}

// 수출 섹션: 스크롤 진행도를 --export-p 로 흘려보내 배경/카피/항로를 함께 움직인다.
function setupExportStory() {
  const root = document.getElementById("export-root");
  const stage = root.querySelector(".export-stage");
  let raf = 0;
  const update = () => {
    raf = 0;
    const header = innerWidth <= 760 ? 72 : 88;
    const travel = (root.offsetHeight - stage.offsetHeight) * 0.72;
    const p = Math.max(0, Math.min(1, (header - root.getBoundingClientRect().top) / travel));
    root.style.setProperty("--export-p", p);
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();
}

function renderExport(data) {
  const root = document.getElementById("export-root");
  if (data.image) root.querySelector(".export-background").src = data.image;
  root.querySelector(".story-eyebrow").textContent = t(data, "eyebrow", lang);
  root.querySelector(".export-copy h2").innerHTML = "";
  t(data, "title", lang).split(String.fromCharCode(10)).forEach((line, i, all) => {
    const h2 = root.querySelector(".export-copy h2");
    h2.appendChild(document.createTextNode(line));
    if (i < all.length - 1) h2.appendChild(document.createElement("br"));
  });
  root.querySelector(".export-copy p").textContent = t(data, "body", lang);
  root.querySelector(".export-btn").textContent = `${t(data, "button", lang)} ↗`;
}

function render(content, newLang) {
  lang = newLang;
  renderFooter(content.footer, lang);
  renderPageHero(content.hero);
  renderExhibitions(content.expoIntro, content.exhibitions);
  renderLogoSection("retail-root", "retail-grid", content.retailIntro, content.retailers, false);
  renderLogoSection("distributors-root", "distributor-grid", content.distributorIntro, content.distributors, true);
  renderExport(content.export || {});
  observeReveals();
}

(async function init() {
  setupHeaderScroll();
  const content = await loadContent("/api/network-content", "content/network.json");
  setupLangToggle((newLang) => render(content, newLang));
  setupExportStory();
})();
