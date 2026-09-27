// =====================================================================
// BOOMYUNG motion layer (siteG)
//
// 모든 공개 페이지가 common.js 다음, 각 페이지 스크립트 앞에서 불러온다.
// 페이지 콘텐츠는 API 에서 받아 비동기로 그려지고 언어 전환 때 다시
// 그려지므로, 페이지마다 렌더 끝에 호출하는 observeReveals() 를 감싸서
// 그 시점마다 새로 생긴 요소에 모션을 붙인다.
//
// 사용 라이브러리: GSAP + ScrollTrigger (js/vendor), Lenis (js/vendor)
// =====================================================================
(function () {
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const DESKTOP = () => innerWidth > 900;
  const root = document.documentElement;

  const clearIntroFlags = () => root.classList.remove("mx-intro", "mx-enter");

  // 라이브러리가 없거나 모션을 줄이도록 설정한 기기면 원래 사이트 그대로 둔다.
  if (REDUCE || !window.gsap || !window.ScrollTrigger) {
    clearIntroFlags();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("motion");

  const EASE = "expo.out";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // 인트로/전환 커튼이 걷힌 뒤에야 히어로 연출을 시작한다.
  let readyResolve;
  const ready = new Promise((r) => (readyResolve = r));

  // -------------------------------------------------------------------
  // 1. 부드러운 스크롤 (데스크톱)
  // -------------------------------------------------------------------
  let lenis = null;
  function setupSmoothScroll() {
    if (!FINE || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // 라이트박스/모바일 메뉴가 body 스크롤을 잠그면 Lenis 도 멈춘다.
    new MutationObserver(() => {
      if (document.body.style.overflow === "hidden") lenis.stop();
      else lenis.start();
    }).observe(document.body, { attributes: true, attributeFilter: ["style"] });

    // 페이지 안 앵커(#...)는 Lenis 로 부드럽게 이동
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute("href").length < 2) return;
      const target = document.getElementById(a.getAttribute("href").slice(1));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -100 });
    });
  }

  // -------------------------------------------------------------------
  // 2. 첫 방문 인트로 / 페이지 전환
  // -------------------------------------------------------------------
  function playIntro() {
    const loader = document.createElement("div");
    loader.className = "mx-loader";
    loader.innerHTML = `
      <div class="mx-loader-panels">${"<div class='mx-loader-panel'></div>".repeat(5)}</div>
      <div class="mx-loader-inner">
        <img class="mx-loader-mark" src="./assets/boomyung_ci_logo.png" alt="" />
        <div class="mx-loader-word">${"BOOMYUNG".split("").map((c) => `<span>${c}</span>`).join("")}</div>
        <div class="mx-loader-sub">PET CARE MANUFACTURER</div>
        <div class="mx-loader-bar"><i></i></div>
      </div>
      <div class="mx-loader-count">000</div>`;
    document.body.appendChild(loader);

    const counter = { v: 0 };
    const countEl = $(".mx-loader-count", loader);
    const tl = gsap.timeline({
      onComplete: () => {
        loader.remove();
        readyResolve();
      },
    });
    tl.to(".mx-loader-mark", { opacity: 1, scale: 1, duration: 0.8, ease: EASE, startAt: { scale: 0.6 } })
      .to(".mx-loader-word span", { y: 0, duration: 1, stagger: 0.05, ease: EASE }, "-=0.5")
      .to(".mx-loader-sub", { opacity: 1, duration: 0.6 }, "-=0.6")
      .to(".mx-loader-bar i", { scaleX: 1, duration: 1.3, ease: "power2.inOut" }, 0.2)
      .to(counter, {
        v: 100,
        duration: 1.3,
        ease: "power2.inOut",
        onUpdate: () => (countEl.textContent = String(Math.round(counter.v)).padStart(3, "0")),
      }, 0.2)
      .add(() => clearIntroFlags())
      .to(".mx-loader-inner, .mx-loader-count", { opacity: 0, y: -30, duration: 0.5, ease: "power2.in" })
      .to(".mx-loader-panel", { yPercent: -101, duration: 0.9, stagger: 0.07, ease: "expo.inOut" }, "-=0.2");
  }

  function playEnter() {
    // CSS(html.mx-enter::before)가 이미 화면을 덮고 있다 — 위로 걷어낸다.
    requestAnimationFrame(() => {
      root.classList.add("mx-entered");
      setTimeout(() => {
        root.classList.remove("mx-enter", "mx-entered");
      }, 950);
      setTimeout(readyResolve, 350);
    });
  }

  function setupPageTransitions() {
    const curtain = document.createElement("div");
    curtain.className = "mx-curtain";
    document.body.appendChild(curtain);

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return; // 같은 페이지 앵커
      if (/admin/.test(url.pathname)) return;
      e.preventDefault();
      try { sessionStorage.setItem("bm-transit", "1"); } catch {}
      gsap.to(curtain, {
        y: 0,
        yPercent: 0,
        duration: 0.6,
        ease: "expo.inOut",
        startAt: { yPercent: 101 },
        onComplete: () => (location.href = url.href),
      });
    });

    // 뒤로가기로 bfcache 에서 복원되면 커튼이 덮인 채로 남지 않게 한다.
    addEventListener("pageshow", (e) => {
      if (e.persisted) gsap.set(curtain, { yPercent: 101 });
    });
  }

  // -------------------------------------------------------------------
  // 3. 스크롤 진행 막대 + 헤더 숨김
  // -------------------------------------------------------------------
  function setupChrome() {
    const bar = document.createElement("div");
    bar.className = "mx-progress";
    document.body.appendChild(bar);
    gsap.to(bar, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
    });

    const header = $("#site-header");
    if (!header) return;
    let last = scrollY;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        const menuOpen = document.body.style.overflow === "hidden" || header.matches(":hover");
        header.classList.toggle("mx-hide", !menuOpen && y > 240 && y > last);
        last = y;
      },
    });
  }

  // -------------------------------------------------------------------
  // 4. 커스텀 커서 + 마그네틱 버튼
  // -------------------------------------------------------------------
  const VIEW_TARGETS = ".mfg-gallery-item, .patent-card.clickable, .bm-cert-card.clickable, .phi-media, .product-card, .brand-own-card, .brand-imported-card, .brand-card";
  const DARK_ZONES = ".hero, .page-hero, .mx-band, .mx-showcase, .export-band, .export-story, .site-footer.dark";

  function setupCursor() {
    if (!FINE) return;
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    // 첫 마우스 움직임 전에는 화면 가운데 떠 있지 않도록 숨겨 둔다
    dot.className = "mx-cursor-dot is-hidden";
    ring.className = "mx-cursor-ring is-hidden";
    ring.innerHTML = "<span>VIEW</span>";
    document.body.append(dot, ring);
    root.classList.add("mx-cursor-on");

    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { ...pos };
    const moveDot = { x: gsap.quickSetter(dot, "x", "px"), y: gsap.quickSetter(dot, "y", "px") };
    const moveRing = { x: gsap.quickSetter(ring, "x", "px"), y: gsap.quickSetter(ring, "y", "px") };

    addEventListener("pointermove", (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      moveDot.x(pos.x);
      moveDot.y(pos.y);
      dot.classList.remove("is-hidden");
      ring.classList.remove("is-hidden");
    }, { passive: true });
    document.addEventListener("pointerleave", () => {
      dot.classList.add("is-hidden");
      ring.classList.add("is-hidden");
    });
    gsap.ticker.add(() => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      moveRing.x(ringPos.x);
      moveRing.y(ringPos.y);
    });

    document.addEventListener("pointerover", (e) => {
      const t = e.target;
      const view = t.closest(VIEW_TARGETS);
      const link = !view && t.closest("a, button, [role=button], .clickable, label, summary");
      const lang = root.lang === "en" || localStorage.getItem("lang") === "en";
      ring.querySelector("span").textContent = lang ? "VIEW" : "보기";
      ring.classList.toggle("is-view", !!view);
      ring.classList.toggle("is-link", !!link);
      const dark = !!t.closest(DARK_ZONES);
      ring.classList.toggle("is-dark", dark);
      dot.classList.toggle("is-dark", dark);
    });
  }

  const MAGNETIC = ".hero-cta, .btn-outline, .export-btn, .mx-showcase-cta, .lang-btn, .brand-filter-btn, .pd-buy-btn, .brand-mark";
  function bindMagnetic(scope) {
    if (!FINE) return;
    $$(MAGNETIC, scope).forEach((el) => {
      if (el._mxMag) return;
      el._mxMag = true;
      const strength = el.classList.contains("brand-mark") ? 0.15 : 0.32;
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * strength);
        yTo((e.clientY - r.top - r.height / 2) * strength);
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" });
      });
    });
  }

  // -------------------------------------------------------------------
  // 5. 제목 단어 리빌 (언어 전환으로 텍스트가 바뀌면 다시 쪼갠다)
  // -------------------------------------------------------------------
  const HEADINGS = [
    "main h1",
    "main .section-title",
    "main .brand-group-title",
    "main .bm-trust-title",
    "main .export-copy h2",
    "main .export-band h2",
    "main .phi-title",
    "main .mx-showcase-title",
    "main .product-detail h2",
  ].join(",");

  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) {
              frag.appendChild(document.createTextNode(p));
              return;
            }
            const w = document.createElement("span");
            w.className = "mx-w";
            const wi = document.createElement("span");
            wi.className = "mx-wi";
            wi.textContent = p;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains("mx-w") && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
    el.dataset.mxText = el.textContent;
  }

  function bindHeadings(scope, delay) {
    $$(HEADINGS, scope).forEach((el) => {
      if (!el.textContent.trim()) return;
      const fresh = el.dataset.mxText !== el.textContent || !el.querySelector(".mx-w");
      if (!fresh) return;
      if (el._mxST) el._mxST.kill();
      splitWords(el);
      const words = $$(".mx-wi", el);
      gsap.set(words, { yPercent: 115, rotate: 3 });
      const play = () =>
        gsap.to(words, {
          yPercent: 0,
          rotate: 0,
          duration: 1.15,
          stagger: 0.055,
          ease: EASE,
          delay: delay || 0,
        });
      el._mxST = ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: play });
    });
  }

  // -------------------------------------------------------------------
  // 6. 요소 등장 (기존 data-reveal 을 GSAP 로 교체)
  // -------------------------------------------------------------------
  // el() 헬퍼는 빈 문자열 속성을 버려서 JS 로 만든 카드엔 data-reveal 이 붙지 않는다.
  // 그래서 카드 종류를 직접 지정한다.
  const REVEAL = [
    "[data-reveal]",
    ".phi-item", ".brand-card", ".imported-strip", ".distributor-grid .logo-card",
    ".brand-own-card", ".brand-imported-card", ".brand-group-head", ".brand-filter-wrap",
    ".mfg-capability", ".mfg-step", ".mfg-gallery-item", ".bm-cert-card", ".patent-card",
    ".product-card", ".catalog-toolbar", ".timeline > *", ".infra-card", ".ci-grid > *",
    ".ceo-body", ".ceo-side", ".expo-year", ".logo-flow-grid .logo-card", ".contact-info", ".contact-form",
    "main .section-body", "main .eyebrow",
  ].map((sel) => `main ${sel.replace(/^main /, "")}:not(.mx-rv)`).join(",");

  function bindReveals() {
    const items = $$(REVEAL).filter((el) => !el.closest(".marquee, .hero, .mx-band"));
    if (!items.length) return;
    items.forEach((i) => i.classList.add("mx-rv"));
    gsap.set(items, { y: 70, opacity: 0 });
    ScrollTrigger.batch(items, {
      start: "top 92%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          y: 0,
          opacity: 1,
          duration: 1.1,
          stagger: 0.09,
          ease: EASE,
          // 인라인 transform 이 남으면 카드의 CSS :hover 이동이 막힌다
          clearProps: "transform,opacity",
        }),
    });
    // 이미 지나간 위치에 있는 요소는 바로 보이게 한다
    items.filter((el) => el.getBoundingClientRect().bottom < 0).forEach((el) => gsap.set(el, { clearProps: "transform,opacity" }));
  }

  // 안전장치: 스크롤이 멈췄을 때 화면 안(또는 위)에 있는데 아직 투명한 요소가 있으면 드러낸다.
  function revealStragglers() {
    $$(".mx-rv").forEach((el) => {
      if (el.style.opacity !== "0") return;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && (r.width || r.height)) {
        gsap.to(el, { y: 0, opacity: 1, duration: 0.8, ease: EASE, clearProps: "transform,opacity" });
      }
    });
  }

  // 이미지 틀이 마스크처럼 열리며 사진이 줌아웃된다.
  const MEDIA = ".phi-media, .mfg-media, .ceo-side img, .infra-card .infra-media, .pd-media, .ci-mark";
  function bindMedia(scope) {
    $$(MEDIA, scope).forEach((el) => {
      if (el._mxMedia) return;
      el._mxMedia = true;
      const inner = el.querySelector("img, video") || el;
      gsap.fromTo(el,
        { clipPath: "inset(14% 8% 14% 8% round 18px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 14px)",
          duration: 1.5,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          clearProps: "clipPath",
        });
      if (inner !== el && !el.classList.contains("phi-media")) {
        gsap.fromTo(inner, { scale: 1.25 }, {
          scale: 1,
          duration: 1.8,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          clearProps: "transform",
        });
      }
    });

    // 제조 페이지 대표 영상: 스크롤에 맞춰 화면 폭으로 커진다
    $$(".mfg-media", scope).forEach((el) => {
      if (el._mxGrow || !DESKTOP()) return;
      el._mxGrow = true;
      gsap.fromTo(el, { scale: 0.86 }, {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "center center", scrub: true },
      });
    });
  }

  // -------------------------------------------------------------------
  // 7. 카드 3D 틸트
  // -------------------------------------------------------------------
  const TILT = ".brand-own-card, .brand-imported-card, .brand-card, .mfg-capability, .mfg-step, .mfg-gallery-item, .product-card, .bm-cert-card, .patent-card";
  function bindTilt(scope) {
    if (!FINE) return;
    $$(TILT, scope).forEach((card) => {
      if (card._mxTilt) return;
      card._mxTilt = true;
      card.classList.add("mx-tilt");
      if (getComputedStyle(card).position === "static") card.style.position = "relative";
      const glare = document.createElement("span");
      glare.className = "mx-glare";
      card.appendChild(glare);
      const max = card.matches(".mfg-gallery-item, .patent-card") ? 5 : 7;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--gx", `${px * 100}%`);
        card.style.setProperty("--gy", `${py * 100}%`);
        gsap.to(card, {
          rotateY: (px - 0.5) * max * 2,
          rotateX: (0.5 - py) * max * 2,
          y: -8,
          transformPerspective: 900,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
      card.addEventListener("pointerleave", () => {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          y: 0,
          duration: 0.8,
          ease: "elastic.out(1, 0.5)",
          clearProps: "transform",
          overwrite: "auto",
        });
      });
    });
  }

  // -------------------------------------------------------------------
  // 8. 배경 패럴랙스
  // -------------------------------------------------------------------
  function bindParallax() {
    $$(".page-hero img.hero-bg, .page-hero video.hero-bg, .export-band .export-bg").forEach((img) => {
      if (img._mxPar) return;
      img._mxPar = true;
      const host = img.closest("section");
      gsap.fromTo(img, { yPercent: -6, scale: 1.16 }, {
        yPercent: 8,
        scale: 1.16,
        ease: "none",
        scrollTrigger: { trigger: host, start: "top top", end: "bottom top", scrub: true },
      });
    });
    // 서브 페이지 히어로 문구는 스크롤하면 위로 흩어진다
    $$(".page-hero .wrap").forEach((w) => {
      if (w._mxPar) return;
      w._mxPar = true;
      gsap.to(w, {
        y: -80,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: w.closest("section"), start: "top top", end: "bottom top", scrub: true },
      });
    });
  }

  // -------------------------------------------------------------------
  // 9. 스크롤 속도에 반응하는 키네틱 밴드 / 로고 마키
  // -------------------------------------------------------------------
  let velocity = 0;
  function setupVelocity() {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        velocity = gsap.utils.clamp(-3000, 3000, self.getVelocity());
      },
    });
  }

  function bindBands() {
    $$(".mx-band").forEach((band) => {
      if (band._mxBand) return;
      band._mxBand = true;
      const rows = $$(".mx-band-row", band);
      rows.forEach((row) => {
        // 끊김 없이 돌도록 내용을 한 번 더 붙인다
        row.innerHTML += row.innerHTML;
      });
      const state = rows.map((row, i) => ({ row, x: 0, dir: i % 2 ? 1 : -1 }));
      let skew = 0;
      gsap.ticker.add((time, dt) => {
        const boost = 1 + Math.abs(velocity) / 350;
        skew += ((velocity / 180) - skew) * 0.08;
        state.forEach((s) => {
          const half = s.row.scrollWidth / 2;
          s.x += s.dir * 0.045 * dt * boost * (velocity < 0 ? -1 : 1);
          if (s.x <= -half) s.x += half;
          if (s.x > 0) s.x -= half;
          gsap.set(s.row, { x: s.x, skewX: gsap.utils.clamp(-12, 12, -skew) });
        });
      });
    });

    // 홈의 유통사 로고 마키(CSS 애니메이션)도 스크롤 속도만큼 빨라진다
    const track = $("#marquee-track");
    if (track && !track._mxVel) {
      track._mxVel = true;
      gsap.ticker.add(() => {
        const anim = track.getAnimations()[0];
        if (anim) anim.playbackRate += ((1 + Math.abs(velocity) / 500) - anim.playbackRate) * 0.1;
      });
    }
  }

  // -------------------------------------------------------------------
  // 10. 홈 히어로: 영상 + 네트워크 파티클 + 거대 워드마크
  // -------------------------------------------------------------------
  function setupHomeHero() {
    const hero = $(".hero");
    if (!hero || hero._mx) return;
    hero._mx = true;

    // 거대 아웃라인 워드마크 (스크롤하면 옆으로 흐른다)
    const word = document.createElement("div");
    word.className = "mx-hero-word";
    word.setAttribute("aria-hidden", "true");
    word.textContent = "BOOMYUNG  PET CARE  BOOMYUNG";
    hero.appendChild(word);
    gsap.fromTo(word, { xPercent: 0 }, {
      xPercent: -28,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });

    // 스크롤 안내 선
    const hint = $(".scroll-hint", hero);
    if (hint && !hint.querySelector(".mx-scroll-line")) {
      const line = document.createElement("span");
      line.className = "mx-scroll-line";
      hint.appendChild(line);
    }

    // 배경은 줌아웃, 문구는 위로 떠오르며 사라진다
    const bg = () => $(".hero-bg:not([hidden])", hero);
    gsap.to(hero, {
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const b = bg();
          if (b) gsap.set(b, { scale: 1.12 - self.progress * 0.12, yPercent: self.progress * 10 });
        },
      },
    });
    gsap.to(".hero-content", {
      y: -120,
      opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });

    // 입장 연출
    gsap.set([".hero-eyebrow", ".hero p.lead", ".hero-cta", ".scroll-hint"], { opacity: 0, y: 30 });
    ready.then(() => {
      const b = bg();
      if (b) gsap.fromTo(b, { scale: 1.3, filter: "blur(8px)" }, { scale: 1.12, filter: "blur(0px)", duration: 2.2, ease: EASE, clearProps: "filter" });
      gsap.fromTo(word, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.8, ease: EASE, delay: 0.2 });
      gsap.to([".hero-eyebrow", ".hero p.lead", ".hero-cta", ".scroll-hint"], {
        opacity: 1, y: 0, duration: 1.2, ease: EASE, stagger: 0.12, delay: 0.55,
      });
    });

    setupHeroParticles(hero);
  }

  // 마우스에 반응하는 연결망 파티클 — "국내외 유통 네트워크" 은유
  function setupHeroParticles(hero) {
    if (!DESKTOP()) return;
    const canvas = document.createElement("canvas");
    canvas.className = "mx-hero-canvas";
    hero.insertBefore(canvas, hero.querySelector(".hero-content"));
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    const pts = [];
    const COUNT = 70;

    const resize = () => {
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);
    for (let i = 0; i < COUNT; i++) {
      pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.6 + 0.6 });
    }
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

    let visible = true;
    new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(hero);

    gsap.ticker.add(() => {
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 160) {
          p.vx += (dx / d) * 0.04;
          p.vy += (dy / d) * 0.04;
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx + 0.05;
        p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(169, 214, 255, ${(1 - d / 130) * 0.35})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const md = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
        if (md < 200) {
          ctx.strokeStyle = `rgba(214, 180, 120, ${(1 - md / 200) * 0.6})`;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      for (const p of pts) {
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // -------------------------------------------------------------------
  // 11. 홈 제조 쇼케이스: 스크롤하면 작은 영상 창이 전체 화면으로 열린다
  // -------------------------------------------------------------------
  function setupShowcase() {
    const sec = $(".mx-showcase");
    if (!sec || sec._mx) return;
    sec._mx = true;
    const media = $(".mx-showcase-media", sec);
    const video = $("video", sec);
    const copy = $$(".mx-showcase-eyebrow, .mx-showcase-body, .mx-showcase-cta", sec);

    const mm = gsap.matchMedia();
    mm.add("(min-width: 761px)", () => {
      gsap.set(copy, { opacity: 0, y: 30 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: "top top", end: "+=130%", scrub: 0.6, pin: $(".mx-showcase-stage", sec), anticipatePin: 1 },
      });
      // 브라우저가 계산값을 inset(18% 26%) 처럼 줄여 버리면 GSAP 가 숫자 짝을
      // 잘못 맞추므로, 시작값을 네 변 모두 명시한다.
      tl.fromTo(media,
        { clipPath: "inset(18% 26% 18% 26% round 28px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 })
        .to(video, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
        .to(copy, { opacity: 1, y: 0, stagger: 0.12, duration: 0.4 }, 0.55);
      return () => gsap.set(copy, { clearProps: "all" });
    });
  }

  // -------------------------------------------------------------------
  // 12. 브랜드 필터 전환 시 카드가 다시 쏟아져 들어온다
  // -------------------------------------------------------------------
  function setupBrandFilter() {
    const bar = $("#brand-filter");
    if (!bar || bar._mx) return;
    bar._mx = true;
    bar.addEventListener("click", (e) => {
      if (!e.target.closest(".brand-filter-btn")) return;
      requestAnimationFrame(() => {
        const cards = $$(".brand-group:not([hidden]) .brand-own-card, .brand-group:not([hidden]) .brand-imported-card");
        gsap.fromTo(cards, { y: 50, opacity: 0, scale: 0.96 }, {
          y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.06, ease: EASE, clearProps: "transform,opacity",
        });
        ScrollTrigger.refresh();
      });
    });
  }

  // -------------------------------------------------------------------
  // 13. 푸터 워드마크
  // -------------------------------------------------------------------
  function setupFooter() {
    const foot = $(".site-footer .wrap");
    if (!foot || foot._mx) return;
    foot._mx = true;
    const word = document.createElement("div");
    word.className = "mx-footer-word";
    word.setAttribute("aria-hidden", "true");
    word.innerHTML = "BOOMYUNG".split("").map((c) => `<span>${c}</span>`).join("");
    foot.appendChild(word);
    gsap.fromTo($$("span", word), { yPercent: 100 }, {
      yPercent: 0,
      duration: 1.3,
      stagger: 0.06,
      ease: EASE,
      scrollTrigger: { trigger: word, start: "top 98%", once: true },
    });
  }

  // -------------------------------------------------------------------
  // 렌더가 끝날 때마다 호출되는 연결 지점
  // -------------------------------------------------------------------
  let bindQueued = false;
  function bindAll() {
    bindQueued = false;
    const heroH1 = $(".hero h1");
    // 홈 히어로 제목은 인트로가 끝난 뒤에 펼쳐진다
    if (heroH1 && heroH1.dataset.mxText !== heroH1.textContent) {
      if (heroH1._mxST) heroH1._mxST.kill();
      splitWords(heroH1);
      const words = $$(".mx-wi", heroH1);
      gsap.set(words, { yPercent: 115, rotate: 3 });
      ready.then(() => gsap.to(words, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.07, ease: EASE, delay: 0.35 }));
      heroH1._mxST = { kill() {} };
    }
    bindHeadings(document);
    bindReveals();
    bindMedia(document);
    bindTilt(document);
    bindMagnetic(document);
    bindParallax();
    bindBands();
    setupHomeHero();
    setupShowcase();
    setupBrandFilter();
    // 이미지가 늦게 로드되며 높이가 바뀌므로 위치를 다시 잰다
    ScrollTrigger.refresh();
  }
  function queueBind() {
    if (bindQueued) return;
    bindQueued = true;
    requestAnimationFrame(() => requestAnimationFrame(bindAll));
  }

  const originalObserve = window.observeReveals;
  window.observeReveals = function () {
    if (typeof originalObserve === "function") originalObserve.apply(this, arguments);
    queueBind();
  };

  // -------------------------------------------------------------------
  // 시작
  // -------------------------------------------------------------------
  let introPlayed = false;
  try {
    introPlayed = !!sessionStorage.getItem("bm-intro");
    sessionStorage.setItem("bm-intro", "1");
  } catch {}
  let transit = false;
  try {
    transit = !!sessionStorage.getItem("bm-transit");
    sessionStorage.removeItem("bm-transit");
  } catch {}

  const start = () => {
    setupSmoothScroll();
    setupPageTransitions();
    setupChrome();
    setupVelocity();
    setupCursor();
    setupFooter();
    bindMagnetic(document);
    bindHeadings(document);
    queueBind();

    if (root.classList.contains("mx-intro") && !introPlayed) playIntro();
    else if (root.classList.contains("mx-enter") || transit) playEnter();
    else {
      clearIntroFlags();
      readyResolve();
    }
    addEventListener("load", () => ScrollTrigger.refresh());
    ScrollTrigger.addEventListener("scrollEnd", revealStragglers);
    setTimeout(revealStragglers, 3500);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
