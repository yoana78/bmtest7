// 자사 브랜드와 수입 브랜드를 한 페이지에서 보여준다.
// 두 목록 모두 brands-content 문서 하나에 들어 있고(brands / importedBrands),
// 히어로 아래에 떠 있는 탭 바로 전체 / 자사 / 수입을 걸러본다.
let filter = "all";
let productCounts = {};

const GROUP_COPY = {
  own: {
    title: "부명 자사 프리미엄 브랜드",
    titleEn: "In-House Premium Brands",
    desc: "자체 R&D 연구소와 직영 제조 공장에서 원칙을 지켜 생산하는 대한민국 펫 케어 브랜드입니다.",
    descEn: "Korean pet care brands developed in our own R&D lab and produced in our own plants.",
  },
  imported: {
    title: "해외 엄선 수입 브랜드",
    titleEn: "Global Partner Brands",
    desc: "스웨덴, 미국 등 전 세계에서 품질과 전문성을 인정받아 부명이 공식 수입·공급하는 글로벌 파트너 브랜드입니다.",
    descEn: "Globally renowned pet brands officially imported and distributed with strict quality verification.",
  },
};

// short: 모바일에서 탭 3개가 한 줄에 들어가도록 쓰는 짧은 라벨
const FILTER_LABELS = {
  all: { ko: "전체 브랜드", en: "All Brands", shortKo: "전체", shortEn: "All" },
  own: { ko: "자사 프리미엄 브랜드", en: "In-House Brands", shortKo: "자사", shortEn: "In-House" },
  imported: { ko: "해외 수입 브랜드", en: "Imported Brands", shortKo: "수입", shortEn: "Imported" },
};

// 수입 브랜드 원산지 표기 (윈도우에서 국기 이모지가 글자로 깨져 국가명만 쓴다)
const ORIGINS = {
  ninaottosson: { ko: "스웨덴", en: "Sweden" },
  dono: { ko: "중국", en: "China" },
  reflex: { ko: "터키", en: "Turkey" },
  sulfodene: { ko: "미국", en: "USA" },
  petstage: { ko: "미국", en: "USA" },
};

function renderPageHero(data, lang) {
  const root = document.getElementById("page-hero-root");
  if (data.image) root.querySelector("img.hero-bg").src = data.image;
  root.querySelector(".eyebrow span").textContent = t(data, "eyebrow", lang);
  root.querySelector("h1").textContent = t(data, "title", lang);
  root.querySelector(".hero-body").textContent = t(data, "body", lang);
}

function renderFilterBar(lang, ownCount, importedCount) {
  const counts = { all: ownCount + importedCount, own: ownCount, imported: importedCount };
  document.querySelectorAll(".brand-filter-btn").forEach((btn) => {
    const key = btn.dataset.filter;
    const labels = FILTER_LABELS[key];
    btn.querySelector(".label").textContent = lang === "en" ? labels.en : labels.ko;
    btn.querySelector(".label-short").textContent = lang === "en" ? labels.shortEn : labels.shortKo;
    btn.querySelector(".count").textContent = counts[key];
    btn.classList.toggle("active", key === filter);
  });
}

function groupHead(groupId, copy, lang) {
  const group = document.getElementById(groupId);
  group.querySelector(".brand-group-title").textContent = lang === "en" ? copy.titleEn : copy.title;
  group.querySelector(".brand-group-desc").textContent = lang === "en" ? copy.descEn : copy.desc;
}

function logoBox(b, name, cls) {
  return el("div", { class: cls }, b.logo ? [el("img", { src: b.logo, alt: name })] : [el("span", { class: "logo-text", text: name })]);
}

function cardFooter(count, lang, fallbackKo, fallbackEn, linkKo, linkEn) {
  const countText = count > 0
    ? (lang === "en" ? `${count} Products` : `등록 제품 ${count}개`)
    : (lang === "en" ? fallbackEn : fallbackKo);
  return el("div", { class: "brand-card-foot" }, [
    el("span", { class: "brand-count", text: countText }),
    el("span", { class: "brand-arrow", text: `${lang === "en" ? linkEn : linkKo} →` }),
  ]);
}

// 자사 브랜드: 2열 쇼케이스 카드
function renderOwn(list, lang) {
  const grid = document.getElementById("own-grid");
  grid.innerHTML = "";
  list.forEach((b) => {
    const name = lang === "en" ? b.nameEn || b.nameKo : b.nameKo;
    const sub = lang === "en" ? b.nameKo : b.nameEn;
    const tagline = (lang === "en" ? b.taglineEn : b.tagline) || b.tagline;
    const desc = lang === "en" ? b.descriptionEn || b.descriptionKo : b.descriptionKo;
    grid.appendChild(
      el("a", {
        class: "brand-own-card", id: `own-${b.id}`, href: `catalog.html?brand=${b.id}`,
        style: `--accent:${b.color || "#1B3A91"}`, "data-reveal": "",
      }, [
        el("div", {}, [
          logoBox(b, name, "brand-own-logo"),
          el("h3", { class: "brand-own-name" }, [
            el("span", { text: name }),
            sub ? el("small", { text: sub }) : null,
          ]),
          tagline ? el("span", { class: "brand-own-tagline", text: tagline }) : null,
          el("p", { class: "brand-own-desc", text: desc }),
        ]),
        cardFooter(productCounts[b.id] || 0, lang, "품질 인증", "Verified Quality", "제품 라인업 보기", "View Products"),
      ])
    );
  });
}

// 수입 브랜드: 3열 카드 + 원산지 칩
function renderImported(list, lang) {
  const grid = document.getElementById("imported-grid");
  grid.innerHTML = "";
  list.forEach((b) => {
    const name = lang === "en" ? b.nameEn || b.nameKo : b.nameKo;
    const tagline = (lang === "en" ? b.taglineEn : b.tagline) || b.tagline;
    const desc = lang === "en" ? b.descriptionEn || b.descriptionKo : b.descriptionKo;
    const origin = ORIGINS[b.id];
    grid.appendChild(
      el("a", {
        class: "brand-imported-card", id: `imported-${b.id}`, href: `catalog.html?brand=${b.id}`,
        "data-reveal": "",
      }, [
        el("div", {}, [
          el("div", { class: "brand-imported-top" }, [
            logoBox(b, name, "brand-imported-logo"),
            origin ? el("span", { class: "brand-origin", text: lang === "en" ? origin.en : origin.ko }) : null,
          ]),
          el("h3", { class: "brand-imported-name", text: name }),
          tagline ? el("span", { class: "brand-imported-tagline", text: tagline }) : null,
          el("p", { class: "brand-imported-desc", text: desc }),
        ]),
        cardFooter(productCounts[b.id] || 0, lang, "글로벌 정품", "Global Partner", "자세히 보기", "Explore"),
      ])
    );
  });
}

function applyFilter() {
  document.getElementById("own-group").hidden = filter === "imported";
  document.getElementById("imported-group").hidden = filter === "own";
}

function render(content, lang) {
  renderFooter(content.footer, lang);
  renderPageHero(content.intro, lang);

  const own = content.brands || [];
  const imported = content.importedBrands || [];

  renderFilterBar(lang, own.length, imported.length);
  groupHead("own-group", GROUP_COPY.own, lang);
  groupHead("imported-group", GROUP_COPY.imported, lang);
  renderOwn(own, lang);
  renderImported(imported, lang);
  applyFilter();
  observeReveals();
}

(async function init() {
  setupHeaderScroll();
  const content = await loadContent("/api/brands-content", "content/brands.json");

  document.getElementById("brand-filter").addEventListener("click", (e) => {
    const btn = e.target.closest(".brand-filter-btn");
    if (!btn) return;
    filter = btn.dataset.filter;
    document.querySelectorAll(".brand-filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
    applyFilter();
  });

  let activeLang = currentLang();
  setupLangToggle((lang) => {
    activeLang = lang;
    render(content, lang);
  });

  // 카드에 표시할 브랜드별 제품 수는 카탈로그 문서에서 따로 세어 채운다.
  try {
    const catalog = await loadContent("/api/catalog-content", "content/catalog.json");
    (catalog.products || []).forEach((p) => {
      productCounts[p.brandId] = (productCounts[p.brandId] || 0) + 1;
    });
    render(content, activeLang);
  } catch (e) {
    /* 제품 수는 없어도 카드가 그려지므로 무시한다 */
  }

  // 헤더 메뉴에서 특정 브랜드를 눌러 들어온 경우 해당 카드로 스크롤한다.
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ block: "center" });
  }
})();
