/* Логіка мапи Рад ВПО. Дані: rady-data.js (RADY), контури областей: rady-map.js (UA_MAP). */
(function () {
  var D = window.RADY, M = window.UA_MAP;
  var LEVELS = D.levels;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var FIRST = 6, STEP = 3;

  function plural(n, one, few, many) {
    var a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  }
  var radWord = function (n) { return plural(n, "Рада ВПО", "Ради ВПО", "Рад ВПО"); };
  var regionEntries = Object.keys(D.regions).map(function (k) { return [k, D.regions[k]]; })
    .sort(function (a, b) { return a[1].localeCompare(b[1], "uk"); });

  /* ===== Стан ===== */
  var applied = { y: D.layers[0].y, region: "", gromadas: [], levels: [] };
  var shown = FIRST;
  var byLayer = {};
  D.layers.forEach(function (l) { byLayer[l.y] = D.items.filter(function (i) { return i.y === l.y; }); });

  function layerItems() { return byLayer[applied.y]; }

  /* ===== Мультивибір ===== */
  function MultiSelect(root, labelId) {
    var placeholder = root.dataset.placeholder, disabledText = root.dataset.disabledText, hasSearch = !!root.dataset.search;
    root.innerHTML = '<button type="button" class="ms-btn" aria-expanded="false" aria-haspopup="true"></button>' +
      '<div class="ms-panel" hidden role="group" aria-labelledby="' + labelId + '">' +
      (hasSearch ? '<input class="ms-search" type="search" placeholder="Пошук громади" aria-label="Пошук громади" autocomplete="off">' : "") +
      '<div class="ms-list"></div></div>';
    var btn = root.querySelector(".ms-btn"), panel = root.querySelector(".ms-panel"), list = root.querySelector(".ms-list"), search = root.querySelector(".ms-search");
    btn.setAttribute("aria-labelledby", labelId + " " + (root.id + "-val"));
    btn.id = root.id + "-val";
    var values = new Set(), options = [], disabled = false, onchange = function () {};

    function text() {
      if (disabled) return disabledText;
      if (!values.size) return placeholder;
      if (values.size === 1) { var v = Array.from(values)[0]; var o = options.find(function (x) { return x.v === v; }); return o ? o.label : placeholder; }
      return "Обрано: " + values.size;
    }
    function paintBtn() { btn.textContent = text(); btn.classList.toggle("has", values.size > 0); }
    function paintList() {
      var q = search ? search.value : "";
      var vis = options.filter(function (o) { return !q || window.PortalSearch.match(o.label, q); });
      list.innerHTML = vis.length ? vis.map(function (o) {
        return '<label><input type="checkbox" value="' + esc(o.v) + '"' + (values.has(o.v) ? " checked" : "") + '><span>' + esc(o.label) + "</span></label>";
      }).join("") : '<div class="ms-none">Нічого не знайдено</div>';
    }
    function open(s) {
      panel.hidden = !s;
      btn.setAttribute("aria-expanded", String(s));
      if (s) { if (search) { search.value = ""; } paintList(); (search || list.querySelector("input") || btn).focus(); }
    }
    btn.addEventListener("click", function () { open(panel.hidden); });
    if (search) search.addEventListener("input", paintList);
    list.addEventListener("change", function (e) {
      if (e.target.checked) values.add(e.target.value); else values.delete(e.target.value);
      paintBtn(); onchange();
    });
    root.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { e.stopPropagation(); open(false); btn.focus(); } });
    document.addEventListener("click", function (e) { if (!root.contains(e.target) && !panel.hidden) open(false); });
    root.addEventListener("focusout", function (e) { if (e.relatedTarget && !root.contains(e.relatedTarget) && !panel.hidden) open(false); });

    return {
      set: function (opts, sel, dis) {
        options = opts; disabled = !!dis; btn.disabled = disabled; if (disabled) open(false);
        values = new Set((sel || []).filter(function (v) { return opts.some(function (o) { return o.v === v; }); }));
        paintBtn();
      },
      values: function () { return Array.from(values); },
      onchange: function (f) { onchange = f; }
    };
  }

  var regionSel = $("f-region");
  regionEntries.forEach(function (e) { regionSel.add(new Option(e[1], e[0])); });
  var msGromada = new MultiSelect($("ms-gromada"), "l-gromada");
  var msLevel = new MultiSelect($("ms-level"), "l-level");
  var LEVEL_OPTS = LEVELS.map(function (l, i) { return { v: String(i), label: l.plural }; });
  msLevel.set(LEVEL_OPTS, []);

  function gromadaOptions(region, y) {
    var seen = {};
    byLayer[y].forEach(function (i) { if (i.r === region && i.hc) seen[i.hc] = i.h; });
    return Object.keys(seen).map(function (k) { return { v: k, label: seen[k] }; })
      .sort(function (a, b) { return a.label.localeCompare(b.label, "uk"); });
  }
  function fillGromadas(sel) {
    var r = regionSel.value;
    msGromada.set(r ? gromadaOptions(r, applied.y) : [], sel || [], !r);
  }

  /* ===== Шари ===== */
  $("layer-seg").innerHTML = D.layers.map(function (l, i) {
    return '<label><input type="radio" name="layer" value="' + l.y + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(l.label) + "</span></label>";
  }).join("");

  /* ===== Мапа ===== */
  var svg = $("ua"), NS = "http://www.w3.org/2000/svg", tip = $("tip"), mapBox = $("map");
  var regEls = {}, labEls = {};
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    parent.appendChild(e); return e;
  }
  var NO_DATA = { UA43: "Автономна Республіка Крим", UA40: "Севастополь" };
  var gReg = el("g", {}, svg), gLab = el("g", { "aria-hidden": "true" }, svg);
  var ORDER = Object.keys(M.paths).sort(function (a, b) { return (a === "UA80") - (b === "UA80"); });
  ORDER.forEach(function (id) {
    var nd = !!NO_DATA[id];
    var p = el("path", { d: M.paths[id], "class": "reg" + (nd ? " nodata" : ""), "data-id": id }, gReg);
    regEls[id] = p;
    if (!nd) {
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      var pt = M.pts[id];
      if (pt) { labEls[id] = el("text", { x: pt[0], y: pt[1], "class": "lab" + (id === "UA80" ? " kyiv" : "") }, gLab); }
    }
  });
  var hlSel = el("path", { id: "hl-sel", d: "" }, gLab), hlHover = el("path", { id: "hl-hover", d: "" }, gLab);
  // Підсвічування має бути під підписами
  gLab.insertBefore(hlSel, gLab.firstChild); gLab.insertBefore(hlHover, hlSel.nextSibling);

  function countsFor(filterLevels) {
    var out = {}; regionEntries.forEach(function (e) { out[e[0]] = 0; });
    layerItems().forEach(function (i) {
      if (!filterLevels.length || filterLevels.indexOf(String(i.l)) >= 0) out[i.r] = (out[i.r] || 0) + 1;
    });
    return out;
  }
  var totals = {}, current = {}, step = 1;
  function binOf(n) { return n <= 0 ? 0 : Math.min(4, Math.floor((n - 1) / step)); }

  function paintMap() {
    totals = countsFor([]); current = countsFor(applied.levels);
    var max = Math.max.apply(null, Object.keys(current).map(function (k) { return current[k]; }).concat([1]));
    step = Math.max(1, Math.ceil(max / 5));
    Object.keys(regEls).forEach(function (id) {
      if (NO_DATA[id]) return;
      var p = regEls[id], l = labEls[id], n = current[id] || 0, b = binOf(n), sel = applied.region === id, dim = applied.region && !sel;
      var cls = sel ? "sel" : dim ? "dimmed" : "b" + b;
      p.setAttribute("class", "reg " + cls);
      p.setAttribute("aria-pressed", String(sel));
      p.setAttribute("aria-label", D.regions[id] + ": " + totals[id] + " " + radWord(totals[id]) + (applied.levels.length ? ", за обраними рівнями " + n : ""));
      if (l) { l.setAttribute("class", "lab " + cls + (id === "UA80" ? " kyiv" : "")); l.textContent = n; }
    });
    hlSel.setAttribute("d", applied.region ? M.paths[applied.region] : "");
    var bins = [];
    for (var i = 0; i < 5; i++) {
      var from = i * step + 1, to = (i + 1) * step;
      bins.push('<li><i style="background:var(--b' + i + ')"></i>' + (step === 1 ? from : from + "–" + to) + "</li>");
    }
    $("scale").innerHTML = bins.join("");
    $("legend-title").textContent = applied.levels.length ? "Кількість рад обраних рівнів" : "Кількість рад в області";
  }

  function showTip(id, x, y) {
    var name, html;
    if (NO_DATA[id]) html = "<b>" + esc(NO_DATA[id]) + "</b><small>Дані відсутні</small>";
    else {
      var t = totals[id] || 0;
      html = "<b>" + esc(D.regions[id]) + "</b>" + t + " " + radWord(t);
      if (applied.levels.length) html += "<small>За обраними рівнями: " + (current[id] || 0) + "</small>";
    }
    tip.innerHTML = html; tip.hidden = false;
    var w = mapBox.clientWidth, half = tip.offsetWidth / 2;
    tip.style.left = Math.max(half, Math.min(w - half, x)) + "px";
    tip.style.top = Math.max(tip.offsetHeight + 16, y) + "px";
    if (!NO_DATA[id]) hlHover.setAttribute("d", M.paths[id]);
  }
  function hideTip() { tip.hidden = true; hlHover.setAttribute("d", ""); }

  svg.addEventListener("mousemove", function (e) {
    var p = e.target.closest && e.target.closest(".reg");
    if (!p) { hideTip(); return; }
    var r = mapBox.getBoundingClientRect();
    showTip(p.dataset.id, e.clientX - r.left, e.clientY - r.top);
  });
  svg.addEventListener("mouseleave", hideTip);
  svg.addEventListener("focusin", function (e) {
    var id = e.target.dataset && e.target.dataset.id;
    if (!id || !M.pts[id]) return;
    var k = mapBox.clientWidth / 1000;
    showTip(id, M.pts[id][0] * k, M.pts[id][1] * k);
  });
  svg.addEventListener("focusout", hideTip);

  function pickRegion(id) {
    if (NO_DATA[id]) return;
    regionSel.value = applied.region === id ? "" : id;
    fillGromadas([]);
    apply();
  }
  svg.addEventListener("click", function (e) {
    var p = e.target.closest && e.target.closest(".reg");
    if (p) { pickRegion(p.dataset.id); hideTip(); }
  });
  svg.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.id) { e.preventDefault(); pickRegion(e.target.dataset.id); }
  });

  /* ===== Статистика ===== */
  function renderStats() {
    var pool = layerItems().filter(function (i) { return !applied.region || i.r === applied.region; });
    var counts = LEVELS.map(function () { return 0; });
    pool.forEach(function (i) { counts[i.l]++; });
    var r = applied.region;
    $("stats").innerHTML =
      '<h2 id="stats-title">' + (r ? esc(D.regions[r]) : "Загальна статистика") + "</h2>" +
      '<div class="big"><b>' + pool.length + "</b><span>" + radWord(pool.length) + (r ? "" : " по всій Україні") + "</span></div>" +
      '<ul class="stat-list">' + LEVELS.map(function (l, i) {
        return "<li><span>" + esc(l.plural) + "</span><b>" + counts[i] + "</b></li>";
      }).join("") + "</ul>" +
      '<a class="link to-res" href="#results">До результатів пошуку ↓</a>';
  }

  /* ===== Результати ===== */
  var result = [];
  function dateKey(s) { var p = String(s).split("."); return p.length === 3 ? p[2] + p[1] + p[0] : ""; }
  function compute() {
    result = layerItems().filter(function (i) {
      return (!applied.region || i.r === applied.region) &&
        (!applied.gromadas.length || applied.gromadas.indexOf(i.hc) >= 0) &&
        (!applied.levels.length || applied.levels.indexOf(String(i.l)) >= 0);
    }).sort(function (a, b) {
      var d = dateKey(b.up).localeCompare(dateKey(a.up));
      return d || a.t.localeCompare(b.t, "uk");
    });
  }
  function cardHtml(i, n) {
    var rows = [["Район", i.dist || "Дані відсутні"], ["Населений пункт", i.np || "Дані відсутні"]];
    var mail = i.em ? '<a href="mailto:' + esc(i.em) + '">' + esc(i.em) + "</a>" : "відсутня";
    return '<li><article class="rcard" tabindex="-1" data-n="' + n + '">' +
      '<span class="tag">' + esc(D.regions[i.r]) + " · " + esc(LEVELS[i.l].adj) + "</span>" +
      "<h3>" + esc(i.t) + "</h3><dl>" +
      rows.map(function (r) { return "<div><dt>" + r[0] + ":</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") +
      "<div><dt>Електронна адреса:</dt><dd>" + mail + "</dd></div>" +
      "<div><dt>Дата оновлення:</dt><dd>" + esc(i.up || "Дані відсутні") + "</dd></div></dl>" +
      '<div class="det"><a class="btn" href="rada.html?id=' + encodeURIComponent(i.id) + '" aria-label="Детальніше: ' + esc(i.t) + '">Детальніше</a></div>' +
      "</article></li>";
  }
  function renderResults(focusFrom) {
    var vis = result.slice(0, shown);
    $("res-grid").innerHTML = vis.map(cardHtml).join("");
    $("res-grid").hidden = !vis.length;
    $("res-empty").hidden = !!vis.length;
    $("more-wrap").hidden = result.length <= shown;
    var bits = [];
    if (applied.region) bits.push(D.regions[applied.region]);
    if (applied.gromadas.length) bits.push(applied.gromadas.length + " " + plural(applied.gromadas.length, "громада", "громади", "громад"));
    if (applied.levels.length) bits.push(applied.levels.map(function (l) { return LEVELS[+l].short; }).join(", "));
    $("res-sum").textContent = "Знайдено: " + result.length + " " + radWord(result.length) + (bits.length ? " · " + bits.join(" · ") : "") +
      (vis.length ? " · показано " + vis.length : "");
    if (focusFrom != null) {
      var c = document.querySelector('.rcard[data-n="' + focusFrom + '"]');
      if (c) c.focus({ preventScroll: true });
    }
  }

  /* ===== Застосування й адреса сторінки ===== */
  function writeUrl() {
    var q = new URLSearchParams();
    if (applied.y !== D.layers[0].y) q.set("y", applied.y);
    if (applied.region) q.set("region", applied.region);
    if (applied.gromadas.length) q.set("hromada", applied.gromadas.join(","));
    if (applied.levels.length) q.set("level", applied.levels.join(","));
    if (shown > FIRST) q.set("n", shown);
    var s = q.toString();
    try { history.replaceState(null, "", location.pathname + (s ? "?" + s : "")); } catch (e) {}
  }
  function setDirty(v) { $("filters").classList.toggle("dirty", !!v); }
  function render() { paintMap(); renderStats(); compute(); renderResults(); writeUrl(); }
  function apply() {
    applied.region = regionSel.value;
    applied.gromadas = msGromada.values();
    applied.levels = msLevel.values();
    shown = FIRST;
    setDirty(false);
    render();
  }

  $("filters").addEventListener("submit", function (e) { e.preventDefault(); apply(); });
  regionSel.addEventListener("change", function () { fillGromadas([]); setDirty(true); });
  msGromada.onchange(function () { setDirty(true); });
  msLevel.onchange(function () { setDirty(true); });
  $("reset").addEventListener("click", function () {
    regionSel.value = ""; applied.y = D.layers[0].y;
    var first = document.querySelector('[name="layer"][value="' + applied.y + '"]'); if (first) first.checked = true;
    fillGromadas([]); msLevel.set(LEVEL_OPTS, []);
    apply();
  });
  $("layer-seg").addEventListener("change", function (e) {
    applied.y = e.target.value;
    fillGromadas([]);
    apply();
  });
  $("more").addEventListener("click", function () {
    var from = shown;
    shown = Math.min(shown + STEP, result.length);
    renderResults(from);
    writeUrl();
  });

  /* ===== Старт із параметрів адреси ===== */
  (function init() {
    var q = new URLSearchParams(location.search);
    var y = q.get("y");
    if (y && byLayer[y]) { applied.y = y; var r = document.querySelector('[name="layer"][value="' + y + '"]'); if (r) r.checked = true; }
    var reg = q.get("region");
    if (reg && D.regions[reg]) regionSel.value = reg;
    fillGromadas((q.get("hromada") || "").split(",").filter(Boolean));
    msLevel.set(LEVEL_OPTS, (q.get("level") || "").split(",").filter(Boolean));
    applied.region = regionSel.value;
    applied.gromadas = msGromada.values();
    applied.levels = msLevel.values();
    var n = parseInt(q.get("n"), 10);
    if (n > FIRST) shown = n;
    render();
  })();
})();
