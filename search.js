/* Спільний пошук Порталу: часткові збіги, апострофи, транслітерація, неправильна розкладка. */
window.PortalSearch = (function () {
  var LAYOUT = {q:"й",w:"ц",e:"у",r:"к",t:"е",y:"н",u:"г",i:"ш",o:"щ",p:"з","[":"х","]":"ї",a:"ф",s:"і",d:"в",f:"а",g:"п",h:"р",j:"о",k:"л",l:"д",";":"ж","'":"є",z:"я",x:"ч",c:"с",v:"м",b:"и",n:"т",m:"ь",",":"б",".":"ю"};
  var MULTI = [["shch","щ"],["zgh","зг"],["zh","ж"],["kh","х"],["ts","ц"],["ch","ч"],["sh","ш"],["yu","ю"],["iu","ю"],["ya","я"],["ia","я"],["ye","є"],["ie","є"],["yi","ї"]];
  var SINGLE = {a:"а",b:"б",c:"ц",d:"д",e:"е",f:"ф",g:"г",h:"г",i:"і",j:"й",k:"к",l:"л",m:"м",n:"н",o:"о",p:"п",q:"к",r:"р",s:"с",t:"т",u:"у",v:"в",w:"в",x:"кс",y:"и",z:"з"};

  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[’ʼ'`´‘′]/g, "'").replace(/\s+/g, " ").trim();
  }
  function fromLayout(t) {
    return t.split("").map(function (c) { return LAYOUT[c] || c; }).join("");
  }
  function fromTranslit(t) {
    MULTI.forEach(function (p) { t = t.split(p[0]).join(p[1]); });
    return t.split("").map(function (c) { return SINGLE[c] || c; }).join("");
  }
  function variants(term) {
    var out = [term];
    var noApos = term.replace(/'/g, "");
    if (noApos !== term) out.push(noApos);
    if (/[a-z]/.test(term)) { var tr = fromTranslit(term); out.push(tr); out.push(tr.replace(/и/g, "і")); out.push(fromLayout(term)); }
    return out;
  }
  /* Кожне слово запиту має знайтися в тексті, хоча б в одному з варіантів написання. */
  function match(hay, query) {
    var h = norm(hay), bare = h.replace(/'/g, "");
    return norm(query).split(" ").filter(Boolean).every(function (t) {
      return variants(t).some(function (v) { return h.indexOf(v) >= 0 || bare.indexOf(v) >= 0; });
    });
  }
  return { norm: norm, variants: variants, match: match };
})();
