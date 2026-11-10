/* Доступність Порталу Рад ВПО: посилання «до вмісту», панель налаштувань, контраст не менше 4,5:1.
   Підключається одним рядком на кожній сторінці: <script src="a11y.js" defer></script> */
(function () {
  var KEY = "portal-a11y";
  var SIZES = [100, 115, 130, 150];
  var state = { size: 0, contrast: false, links: false, motion: false };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}

  var css = [
    /* Кольори, що дають контраст тексту щонайменше 4,5:1 */
    ":root{--coral:#cf3339!important;--coral-ink:#c22f35!important;--opp:#1c7a50!important;--law:#2a64bd!important}",
    "@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--coral-ink:#ff9a9c!important;--opp:#1c7a50!important;--law:#2a64bd!important}}",
    ":root[data-theme=dark]{--coral-ink:#ff9a9c!important}",
    ".hero h1 em,.page-head h1 em{color:#ff9a9c}",
    ".pill .opp,.pill .law,.pill .rady{color:#fff}",
    "body{font-size:1rem!important}",
    "@media (max-width:767px){.top .nav{display:flex!important;width:100%;margin-inline:-12px}.top .nav a{padding:10px 12px}}",
    ".skip-link{position:absolute;left:12px;top:-200px;z-index:1000;background:#fff;color:#00254a;font-weight:700;padding:12px 18px;border-radius:0 0 10px 10px;box-shadow:0 4px 18px rgba(0,0,0,.3)}",
    ".skip-link:focus{top:0;outline:3px solid #cf3339;outline-offset:0}",
    ":focus-visible{outline:3px solid #cf3339!important;outline-offset:2px}",
    ".hero :focus-visible,.foot :focus-visible,.page-head :focus-visible{outline-color:#fff!important}",

    /* Панель */
    ".a11y-btn{position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(env(safe-area-inset-bottom,0px) + 16px);z-index:900;width:52px;height:52px;border-radius:50%;border:2px solid #fff;background:#00254a;color:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 6px 20px rgba(0,37,74,.4)}",
    ".a11y-btn svg{width:28px;height:28px}",
    ".a11y-panel{position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(env(safe-area-inset-bottom,0px) + 80px);z-index:901;width:min(340px,calc(100vw - 32px));max-height:calc(100vh - 110px);overflow:auto;background:#fff;color:#0b1b2e;border:1px solid #00254a;border-radius:14px;padding:18px;box-shadow:0 14px 40px rgba(0,37,74,.35);font-family:inherit}",
    ".a11y-panel h2{font-size:1.1rem;margin:0 0 12px;color:#0b1b2e}",
    ".a11y-panel p.lbl{font-weight:700;font-size:.92rem;margin:0 0 8px}",
    ".a11y-sizes{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px}",
    ".a11y-panel button.opt{font:inherit;font-weight:700;min-height:44px;background:#fff;color:#00254a;border:1.5px solid #00254a;border-radius:9px;cursor:pointer}",
    ".a11y-panel button.opt[aria-pressed=true]{background:#00254a;color:#fff}",
    ".a11y-toggles{display:grid;gap:6px;margin-bottom:12px}",
    ".a11y-toggles button.opt{text-align:left;padding:10px 12px}",
    ".a11y-panel button.lnk{font:inherit;font-weight:700;background:none;border:0;padding:8px 0;color:#00254a;text-decoration:underline;cursor:pointer}",

    /* Режими */
    "html[data-a11y-links] a{text-decoration:underline!important;text-underline-offset:3px}",
    "html[data-a11y-motion] *,html[data-a11y-motion] *::before,html[data-a11y-motion] *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}",
    "html[data-a11y-contrast]{--bg:#fff!important;--card:#fff!important;--ink:#000!important;--muted:#000!important;--line:#000!important;--tint:#fff!important;--navy:#000!important;--navy-2:#000!important;--on-navy:#fff!important;--on-navy-muted:#fff!important;--coral:#000!important;--coral-ink:#000!important;--rady:#000!important;--law:#000!important;--events:#000!important;--opp:#000!important;--shadow:none!important}",
    "html[data-a11y-contrast] a{text-decoration:underline!important}",
    "html[data-a11y-contrast] .pill .events{color:#fff!important}",
    "html[data-a11y-contrast] .hero h1 em,html[data-a11y-contrast] .page-head h1 em{color:#fff!important;text-decoration:underline}"
  ].join("\n");

  var st = document.createElement("style");
  st.id = "a11y-css";
  st.textContent = css;
  document.head.appendChild(st);

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function apply() {
    var r = document.documentElement;
    r.style.fontSize = state.size ? SIZES[state.size] + "%" : "";
    r.toggleAttribute("data-a11y-contrast", !!state.contrast);
    r.toggleAttribute("data-a11y-links", !!state.links);
    r.toggleAttribute("data-a11y-motion", !!state.motion);
  }
  apply();

  function init() {
    var main = document.querySelector("main");
    if (main) {
      if (!main.id) main.id = "main";
      main.setAttribute("tabindex", "-1");
      var skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = "#" + main.id;
      skip.textContent = "Перейти до основного вмісту";
      document.body.insertBefore(skip, document.body.firstChild);
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "a11y-btn";
    btn.setAttribute("aria-label", "Налаштування доступності");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "a11y-panel");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="1.8"/><path d="M4.5 9c5 1.2 10 1.2 15 0M12 10.5V15m0 0-3.2 6M12 15l3.2 6"/></svg>';

    var panel = document.createElement("div");
    panel.id = "a11y-panel";
    panel.className = "a11y-panel";
    panel.hidden = true;
    panel.setAttribute("role", "group");
    panel.setAttribute("aria-label", "Налаштування доступності");
    panel.innerHTML =
      '<h2>Доступність</h2><p class="lbl" id="a11y-size-l">Розмір тексту</p>' +
      '<div class="a11y-sizes" role="group" aria-labelledby="a11y-size-l">' +
      SIZES.map(function (s, i) { return '<button type="button" class="opt" data-size="' + i + '" aria-label="Розмір тексту ' + s + ' відсотків">' + s + "%</button>"; }).join("") +
      '</div><div class="a11y-toggles">' +
      '<button type="button" class="opt" data-t="contrast">Висока контрастність</button>' +
      '<button type="button" class="opt" data-t="links">Підкреслити посилання</button>' +
      '<button type="button" class="opt" data-t="motion">Вимкнути анімацію</button>' +
      '</div><button type="button" class="lnk" data-reset>Скинути налаштування</button>';

    function paint() {
      panel.querySelectorAll("[data-size]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.size === +state.size)); });
      panel.querySelectorAll("[data-t]").forEach(function (b) { b.setAttribute("aria-pressed", String(!!state[b.dataset.t])); });
    }
    function toggle(open) {
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) { var first = panel.querySelector("button"); if (first) first.focus(); }
    }
    btn.addEventListener("click", function () { toggle(panel.hidden); });
    panel.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.size !== undefined) state.size = +b.dataset.size;
      else if (b.dataset.t) state[b.dataset.t] = !state[b.dataset.t];
      else if (b.hasAttribute("data-reset")) state = { size: 0, contrast: false, links: false, motion: false };
      save(); apply(); paint();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { toggle(false); btn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) toggle(false);
    });
    paint();
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
