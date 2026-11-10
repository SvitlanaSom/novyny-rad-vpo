/* Лендінг Ради ВПО: одна сторінка-шаблон, дані обираються за параметром ?id=.
   Показує лише реальні дані: якщо чогось немає, блок ховається або пропонує це додати. */
(function () {
  var D = window.RADY, M = window.UA_MAP;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var NA = "Дані відсутні";
  var FORM = "https://ee-eu.kobotoolbox.org/x/Hy017RXj";
  var ext = ' target="_blank" rel="noopener"';
  var newTab = '<span class="sr-only"> (відкриється в новій вкладці)</span>';

  function plural(n, one, few, many) {
    var a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  }
  var radWord = function (n) { return plural(n, "рада", "ради", "рад"); };

  $("back").addEventListener("click", function (e) {
    try {
      if (document.referrer && new URL(document.referrer).pathname.indexOf("mapa") >= 0 && history.length > 1) { e.preventDefault(); history.back(); }
    } catch (err) {}
  });

  var id = new URLSearchParams(location.search).get("id");
  var r = D.items.find(function (i) { return i.id === id; });
  if (!r) {
    ["about", "people", "years", "news", "materials", "near", "rl-nav", "strip-wrap"].forEach(function (x) { $(x).hidden = true; });
    document.querySelectorAll("main>section").forEach(function (s) { s.hidden = true; });
    $("notfound").hidden = false;
    $("r-title").textContent = "Сторінку не знайдено";
    document.title = "Сторінку не знайдено — Портал Рад ВПО";
    return;
  }

  var regionName = D.regions[r.r];
  var level = D.levels[r.l];
  var mapHref = "mapa.html?region=" + r.r;
  var sameLayer = D.items.filter(function (i) { return i.y === r.y && i.r === r.r; });
  var m = r.m && r.m[0] ? r.m : null;

  /* ===== Шапка ===== */
  document.title = r.t + " — Портал Рад ВПО";
  $("r-title").textContent = r.t;
  $("r-eyebrow").textContent = regionName + " · " + level.name + " рівень";
  var place = r.l === 0 ? regionName : r.h ? r.h + " громада" : r.np || regionName;
  $("r-lead").textContent = m
    ? "Рада об’єднує " + m[0] + " " + plural(m[0], "людину", "людей", "людей") + ", щоб представляти інтереси внутрішньо переміщених осіб у взаємодії з місцевою владою. " + place + "."
    : "Рада представляє інтереси внутрішньо переміщених осіб у взаємодії з місцевою владою. " + place + ".";

  var soc = r.soc || {};
  var acts = [];
  if (r.em) acts.push('<a class="btn" href="mailto:' + esc(r.em) + '">Написати раді</a>');
  acts.push('<a class="btn hero-ghost" href="#people">Хто в раді</a>');
  acts.push('<a class="btn hero-ghost" href="#years">Історія ради</a>');
  $("r-actions").innerHTML = acts.join("");

  /* Мінімапа області */
  $("r-map").href = mapHref;
  $("r-map").innerHTML = '<svg viewBox="0 0 1000 669" aria-hidden="true">' + Object.keys(M.paths).map(function (k) {
    return '<path d="' + M.paths[k] + '" class="' + (k === r.r ? "on" : "") + '"/>';
  }).join("") + '</svg><span class="rl-map-cap"><b>' + esc(regionName) + "</b>" + sameLayer.length + " " + radWord(sameLayer.length) + " ВПО в області →</span>";

  /* Цифри */
  var strip = [];
  var yearCr = r.cr ? r.cr.split(".")[2] : "";
  if (yearCr) strip.push([yearCr, "рік створення ради"]);
  if (m) strip.push([m[0], plural(m[0], "член ради", "члени ради", "членів ради")]);
  if (m && m[3] != null) strip.push([m[3], "з них ВПО"]);
  if (r.up) strip.push([r.up, "дата оновлення"]);
  $("strip").innerHTML = strip.map(function (s) { return "<li><b>" + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></li>"; }).join("");
  $("strip-wrap").hidden = !strip.length;

  /* ===== Про раду ===== */
  var facts = [
    ["Область", regionName], ["Район", r.dist], ["Громада", r.h], ["Населений пункт", r.np],
    ["Рівень органу влади, при якому створено Раду ВПО", level.name],
    ["Дата створення Ради", r.cr], ["Дата оновлення інформації", r.up]
  ];
  $("facts").innerHTML = facts.map(function (f) {
    return "<div><dt>" + esc(f[0]) + "</dt><dd" + (f[1] ? "" : ' class="na"') + ">" + esc(f[1] || NA) + "</dd></div>";
  }).join("");

  var rows = [];
  if (r.em) rows.push(["Електронна адреса", '<a href="mailto:' + esc(r.em) + '">' + esc(r.em) + '</a><br><button class="copy" type="button" id="copy">Скопіювати адресу</button>']);
  if (r.addr) rows.push(["Адреса розташування Ради ВПО", esc(r.addr)]);
  if (r.rel) rows.push(["Адреса розташування (для Рад ВПО, що працюють в релокації)", esc(r.rel)]);
  if (r.sched) rows.push(["Графік роботи", esc(r.sched)]);
  if (r.web) rows.push(["Вебсторінка", '<a href="' + esc(r.web) + '"' + ext + ">" + esc(r.web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + newTab + "</a>"]);
  var socials = [["fb", "Facebook"], ["tg", "Telegram"], ["vb", "Viber"]].filter(function (s) { return soc[s[0]]; });
  if (socials.length) rows.push(["Соціальні мережі", '<div class="socials">' + socials.map(function (s) {
    return '<a href="' + esc(soc[s[0]]) + '"' + ext + ">" + s[1] + newTab + "</a>";
  }).join("") + "</div>"]);
  $("contact").innerHTML = rows.length
    ? '<dl class="contact">' + rows.map(function (x) { return "<div><dt>" + esc(x[0]) + "</dt><dd>" + x[1] + "</dd></div>"; }).join("") + "</dl>"
    : '<p class="small-note">' + NA + "</p>";

  var copyBtn = $("copy");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    function done() { copyBtn.textContent = "Скопійовано ✓"; $("copy-status").textContent = "Електронну адресу скопійовано"; setTimeout(function () { copyBtn.textContent = "Скопіювати адресу"; }, 2200); }
    function fallback() {
      var t = document.createElement("textarea"); t.value = r.em; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(t);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(r.em).then(done, fallback); else fallback();
  });

  /* ===== Люди ===== */
  function people(list, title) {
    var ok = (list || []).filter(function (p) { return p.n; });
    if (!ok.length) return "";
    return "<h3>" + title + '</h3><ul class="rl-people">' + ok.map(function (p) {
      var ini = p.n.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("");
      return '<li><span class="ava" aria-hidden="true">' + esc(ini) + "</span><div><b>" + esc(p.n) + "</b>" + (p.p ? "<span>" + esc(p.p) + "</span>" : "") + "</div></li>";
    }).join("") + "</ul>";
  }
  var comp = "";
  if (m) {
    var w = m[1], men = m[2], idp = m[3];
    var hasSplit = w != null && men != null && w + men > 0;
    var wp = hasSplit ? Math.round(w / (w + men) * 100) : 0;
    var idpp = idp != null ? Math.min(100, Math.round(idp / m[0] * 100)) : null;
    comp += '<p class="rl-intro">Рада ВПО — це орган, створений для представництва та захисту інтересів внутрішньо переміщених осіб. До складу Ради ' +
      plural(m[0], "входить", "входять", "входять") + " " + m[0] + " " + plural(m[0], "член", "члени", "членів") + ", які забезпечують координацію діяльності, вирішення актуальних питань та взаємодію з органами влади.</p>";
    comp += '<div class="rl-comp">';
    comp += '<div class="rl-tile big"><b>' + m[0] + "</b><span>" + plural(m[0], "людина в раді", "людини в раді", "людей у раді") + "</span></div>";
    if (hasSplit) comp += '<div class="rl-tile"><span class="t">Жінки та чоловіки</span><div class="rl-split" role="img" aria-label="Жінок ' + w + ", чоловіків " + men + '"><i style="width:' + wp + '%"></i></div><div class="rl-split-l"><span><b>' + w + "</b> " + plural(w, "жінка", "жінки", "жінок") + "</span><span><b>" + men + "</b> " + plural(men, "чоловік", "чоловіки", "чоловіків") + "</span></div></div>";
    if (idpp != null) comp += '<div class="rl-tile"><span class="t">Голос переселенців</span><div class="rl-pct"><b>' + idpp + "%</b><span>членів ради — внутрішньо переміщені особи (" + idp + " з " + m[0] + ")</span></div></div>";
    if (r.cg) comp += '<div class="rl-tile"><span class="t">Керівництво</span><div class="rl-pct"><b class="sm">' + (r.cg === "Ж" ? "Жінка" : "Чоловік") + "</b><span>очолює раду</span></div></div>";
    comp += "</div>";
  } else {
    comp += '<p class="rl-intro">Рада ще не передала дані про склад. ' + NA + ".</p>";
  }
  var pp = people(r.lead, "Керівництво Ради") + people(r.members, "Члени Ради");
  comp += pp || '<div class="rl-invite"><p><b>Покажіть людей, які роблять цю роботу</b>Імена й посади голови, секретаря та членів ради з’являться тут після того, як рада їх надасть.</p><a class="btn" href="' + FORM + '"' + ext + ">Додати склад ради" + newTab + " ↗</a></div>";
  $("comp").innerHTML = comp;

  /* ===== Новини, хронологія, матеріали ===== */
  var norm = function (s) { return String(s || "").toLowerCase().replace(/[’ʼ'`]/g, ""); };
  var shortReg = regionName.replace(" область", "");
  var regKey = r.r === "UA80" ? "Київська" : shortReg;
  var fmtD = function (d) { var p = d.split("-"); return p[2] + "." + p[1] + "." + p[0]; };

  function classify(news) {
    var stems = [];
    if (r.l === 0) stems = [];
    else {
      if (r.h && r.h.length > 4) stems.push(norm(r.h).slice(0, -2));
      if (r.np && r.np.length > 4) stems.push(norm(r.np).slice(0, -1));
    }
    var own = [], region = [];
    news.forEach(function (n) {
      if (n.r.indexOf(regKey) < 0) return;
      var hay = norm(n.t + " " + n.x + " " + (n.pl || ""));
      var hit = r.l === 0 ? /обласн/.test(hay) && /рад[аиіу]? впо|рад[аиіу]? з питань/.test(hay) : stems.some(function (s) { return hay.indexOf(s) >= 0; });
      (hit ? own : region).push(n);
    });
    return { own: own, region: region };
  }

  function newsCard(n, kind, big) {
    var img = n.img ? '<img src="' + n.img + '" alt="" loading="lazy">' : '<span class="noimg" aria-hidden="true">#</span>';
    return '<article class="rl-n' + (big ? " big" : "") + '"><div class="ph">' + img + "</div><div class=\"b\">" +
      '<div class="m"><span class="k">' + esc(kind) + "</span><time>" + fmtD(n.d) + "</time></div>" +
      '<h3><a href="' + esc(n.u) + '"' + ext + ">" + esc(n.t) + newTab + "</a></h3>" +
      (big && n.x ? "<p>" + esc(n.x) + "</p>" : "") + "</div></article>";
  }

  function renderTimeline(own) {
    var ev = [];
    function push(date, title, text, link) {
      var p = String(date).split(".");
      if (p.length !== 3) return;
      ev.push({ y: p[2], k: p[2] + p[1] + p[0], date: date, title: title, text: text, link: link });
    }
    if (r.cr) push(r.cr, "Раду створено", level.name + " рівень · " + place);
    var seen = {};
    D.items.filter(function (i) { return i.r === r.r && i.np === r.np && i.l === r.l && i.hc === r.hc; })
      .sort(function (a, b) { return (a.t === r.t ? 0 : 1) - (b.t === r.t ? 0 : 1); })
      .forEach(function (i) {
        if (seen[i.y] || !i.up) return; seen[i.y] = 1;
        var cur = i.id === r.id;
        var lay = D.layers.find(function (l) { return l.y === i.y; });
        push(i.up, "Оновлено дані ради", (lay ? lay.label : "Мапування"),
          cur ? null : { href: "rada.html?id=" + encodeURIComponent(i.id), label: "Відкрити запис " + i.y + " року" });
      });
    (own || []).forEach(function (n) { push(fmtD(n.d), n.t, "Публікація про громаду", { href: n.u, label: "Читати", ext: 1 }); });
    ev.sort(function (a, b) { return b.k.localeCompare(a.k); });
    var years = [], by = {};
    ev.forEach(function (e) { if (!by[e.y]) { by[e.y] = []; years.push(e.y); } by[e.y].push(e); });
    $("timeline").innerHTML = years.map(function (y) {
      return '<li class="tl-y"><h3>' + y + '</h3><ul>' + by[y].map(function (e) {
        return "<li><time>" + e.date + "</time><b>" + esc(e.title) + "</b>" + (e.text ? "<span>" + esc(e.text) + "</span>" : "") +
          (e.link ? '<a href="' + esc(e.link.href) + '"' + (e.link.ext ? ext : "") + ">" + esc(e.link.label) + (e.link.ext ? newTab : "") + " →</a>" : "") + "</li>";
      }).join("") + "</ul></li>";
    }).join("");
    $("years").hidden = !years.length;
    buildNav();
  }

  function renderNews(all) {
    var c = classify(all);
    var byImg = function (a) { return a.filter(function (n) { return n.img; }).concat(a.filter(function (n) { return !n.img; })); };
    var cards = byImg(c.own).slice(0, 3).map(function (n) { return [n, "Про громаду"]; })
      .concat(byImg(c.region).slice(0, 6).map(function (n) { return [n, regKey + " обл."]; }));
    if (!cards.length) cards = byImg(all).slice(0, 4).map(function (n) { return [n, "Новини рад ВПО"]; });
    var ordered = cards.slice(0, 4);
    $("news-list").innerHTML = ordered.map(function (x, i) { return newsCard(x[0], x[1], i === 0); }).join("");
    $("news").hidden = !ordered.length;
    $("all-pubs").href = "novyny.html?region=" + encodeURIComponent(regKey) + "#rady";
    renderTimeline(c.own);
  }

  function renderMats(list) {
    $("mats").innerHTML = list.map(function (m) {
      return '<article class="rl-m"><img src="' + m.img + '" alt="" loading="lazy"><div class="b">' +
        '<p class="doctype">' + esc(m.dt) + "</p>" +
        '<h3><a href="' + esc(m.u) + '"' + ext + ">" + esc(m.t) + newTab + "</a></h3></div></article>";
    }).join("");
    $("materials").hidden = !list.length;
  }

  /* Інші ради */
  var near = sameLayer.filter(function (i) { return i.id !== r.id; })
    .sort(function (a, b) {
      return (a.dist === r.dist ? 0 : 1) - (b.dist === r.dist ? 0 : 1) || (a.l === r.l ? 0 : 1) - (b.l === r.l ? 0 : 1) || a.t.localeCompare(b.t, "uk");
    }).slice(0, 3);
  $("near-list").innerHTML = near.map(function (i) {
    return '<li><a href="rada.html?id=' + encodeURIComponent(i.id) + '"><span class="k">' + esc(D.levels[i.l].adj) + (i.dist ? " · " + esc(i.dist) + " район" : "") + "</span><b>" + esc(i.t) + "</b></a></li>";
  }).join("");
  $("near").hidden = !near.length;
  $("near-all").href = mapHref;

  /* ===== Меню сторінки ===== */
  var NAV = [["about", "Про раду"], ["people", "Люди"], ["years", "Рік за роком"], ["news", "Новини"], ["materials", "Матеріали"], ["near", "Інші ради"]];
  var io;
  function buildNav() {
    var list = NAV.filter(function (n) { return !$(n[0]).hidden; });
    $("rl-nav-list").innerHTML = list.map(function (n) { return '<li><a href="#' + n[0] + '">' + n[1] + "</a></li>"; }).join("");
    if (io) io.disconnect();
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        document.querySelectorAll("#rl-nav-list a").forEach(function (a) {
          if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    list.forEach(function (n) { io.observe($(n[0])); });
  }

  /* Спершу показуємо сторінку, потім догружаємо новини й обкладинки */
  $("materials").hidden = true; $("news").hidden = true;
  renderTimeline([]);
  var s = document.createElement("script");
  s.src = "rady-news.js";
  s.onload = function () {
    renderNews(window.RADY_NEWS.news);
    renderMats(window.RADY_NEWS.mats);
    buildNav();
  };
  document.body.appendChild(s);
})();
