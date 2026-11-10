/* Типова сторінка Ради ВПО: одна сторінка-шаблон, дані обираються за параметром ?id=. */
(function () {
  var D = window.RADY;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var NA = "Дані відсутні";

  function plural(n, one, few, many) {
    var a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  }

  var back = $("back");
  back.addEventListener("click", function (e) {
    try {
      if (document.referrer && new URL(document.referrer).pathname.indexOf("mapa") >= 0 && history.length > 1) {
        e.preventDefault(); history.back();
      }
    } catch (err) {}
  });

  var id = new URLSearchParams(location.search).get("id");
  var r = D.items.find(function (i) { return i.id === id; });
  if (!r) {
    $("layout").hidden = true; $("pubs-sec").hidden = true; $("notfound").hidden = false;
    $("r-title").textContent = "Сторінку не знайдено";
    document.title = "Сторінку не знайдено — Портал Рад ВПО";
    return;
  }

  document.title = r.t + " — Портал Рад ВПО";
  $("r-title").textContent = r.t;
  $("r-eyebrow").textContent = D.regions[r.r] + " · " + D.levels[r.l].name + " рівень";

  var facts = [
    ["Область", D.regions[r.r]], ["Район", r.dist], ["Громада", r.h], ["Населений пункт", r.np],
    ["Рівень органу влади, при якому створено Раду ВПО", D.levels[r.l].name],
    ["Дата створення Ради", r.cr], ["Дата оновлення інформації", r.up]
  ];
  $("facts").innerHTML = facts.map(function (f) {
    return "<div><dt>" + esc(f[0]) + "</dt><dd" + (f[1] ? "" : ' class="na"') + ">" + esc(f[1] || NA) + "</dd></div>";
  }).join("");

  /* Контакти: пункти без даних не показуються */
  var rows = [];
  if (r.em) rows.push(["Електронна адреса", '<a href="mailto:' + esc(r.em) + '">' + esc(r.em) + '</a><br><button class="copy" type="button" id="copy">Скопіювати адресу</button>']);
  if (r.addr) rows.push(["Адреса розташування Ради ВПО", esc(r.addr)]);
  if (r.rel) rows.push(["Адреса розташування (для Рад ВПО, що працюють в релокації)", esc(r.rel)]);
  if (r.sched) rows.push(["Графік роботи", esc(r.sched)]);
  var ext = ' target="_blank" rel="noopener"';
  var newTab = '<span class="sr-only"> (відкриється в новій вкладці)</span>';
  if (r.web) rows.push(["Вебсторінка", '<a href="' + esc(r.web) + '"' + ext + ">" + esc(r.web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + newTab + "</a>"]);
  var soc = r.soc || {};
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
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(r.em).then(done, fallback); else fallback();
    function fallback() {
      var t = document.createElement("textarea"); t.value = r.em; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(t);
    }
  });

  /* Склад */
  var m = r.m, comp = "";
  if (m && m[0]) {
    var verb = plural(m[0], "входить", "входять", "входять");
    comp += "<p>Рада ВПО — це орган, створений для представництва та захисту інтересів внутрішньо переміщених осіб. До складу Ради " + verb + " " + m[0] + " " + plural(m[0], "член", "члени", "членів") +
      ", які забезпечують координацію діяльності, вирішення актуальних питань та взаємодію з органами влади.</p>";
    var tiles = [[m[0], "усього членів"]];
    if (m[1] != null) tiles.push([m[1], "жінок"]);
    if (m[2] != null) tiles.push([m[2], "чоловіків"]);
    if (m[3] != null) tiles.push([m[3], "з них ВПО"]);
    comp += '<ul class="nums">' + tiles.map(function (t) { return "<li><b>" + t[0] + "</b><span>" + t[1] + "</span></li>"; }).join("") + "</ul>";
  } else {
    comp += '<p class="small-note">' + NA + "</p>";
  }
  function people(list, title) {
    var ok = (list || []).filter(function (p) { return p.n; });
    if (!ok.length) return "";
    return "<h3>" + title + '</h3><ul class="people">' + ok.map(function (p) {
      return "<li><b>" + esc(p.n) + "</b>" + (p.p ? "<span>" + esc(p.p) + "</span>" : "") + "</li>";
    }).join("") + "</ul>";
  }
  comp += people(r.lead, "Керівництво Ради") + people(r.members, "Члени Ради");
  $("comp").innerHTML = comp;

  /* Рекомендовані публікації */
  var short = D.regions[r.r].replace(" область", "");
  var key = r.r === "UA80" ? "Київська" : short;
  var regional = (D.news.regions[key] || []);
  var list = regional.length ? regional : D.news.latest;
  $("pubs").innerHTML = list.slice(0, 3).map(function (p) {
    return '<li><article class="pub"><h3><a href="' + esc(p.u) + '"' + ext + ">" + esc(p.t) + newTab + "</a></h3>" +
      '<div class="m"><span>' + esc(p.d) + "</span><b>Новини</b></div></article></li>";
  }).join("");
  $("all-pubs").href = "novyny.html?region=" + encodeURIComponent(key) + "#rady";
})();
