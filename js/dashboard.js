/* ============================================================
   AlgoTN — Tableau de bord (accueil) : cartes chapitres, progression
   Sécurité : données issues de window.ALGOTN_CHAPTERS (rédigées dans
   le site, de confiance), injectées via setHTML. Site statique local,
   sans réseau ni saisie de texte libre.
   ============================================================ */
(function () {
  "use strict";
  const setHTML = (el, trustedHtml) => { el.innerHTML = trustedHtml; }; // données chapitres internes de confiance

  function chapterCard(c) {
    const A = window.AlgoTN;
    const pct = A ? A.chapPct(c.id) : 0;
    const href = c.built ? c.slug : "#";
    const tags = c.tags.map(t => `<span class="chip-mini">${t}</span>`).join("");
    const lock = c.built ? "" : `<span class="chip-mini" style="background:var(--surface);border:1px dashed var(--border-strong)">🔒 bientôt</span>`;
    const star = (c.important ? `<span title="Chapitre clé d'examen" style="position:absolute;top:14px;right:16px;font-size:1rem">⭐</span>` : "");
    return `<a href="${href}" class="card card--hover chcard reveal" style="--grad:${c.grad}${c.built?"":";opacity:.62"}" ${c.built?"":'aria-disabled="true"'}>
      ${star}
      <div class="chcard__icon" style="background:${c.grad};color:#fff">${c.icon}</div>
      <div class="chcard__num">CHAPITRE ${c.num}</div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="chcard__tags">${tags} ${lock}</div>
      <div class="progress progress--thin" style="margin-top:6px"><i style="width:${pct}%"></i></div>
      <div class="chcard__foot">
        <span class="muted" style="font-size:.78rem">${pct>0?pct+"% complété":"Pas encore commencé"}</span>
        <span style="font-weight:800;color:var(--brand-1)">${c.built?"Ouvrir →":""}</span>
      </div>
    </a>`;
  }

  function render() {
    const grid = document.getElementById("chapters-grid");
    const chs = window.ALGOTN_CHAPTERS || [];
    if (grid) setHTML(grid, chs.map(chapterCard).join(""));

    const A = window.AlgoTN;
    if (A) {
      const g = A.globalPct();
      const ring = document.getElementById("global-ring");
      if (ring) { ring.style.setProperty("--p", g); const v = ring.querySelector(".ring__val b"); if (v) v.textContent = g + "%"; }
      const done = chs.filter(c => A.chapPct(c.id) >= 60).length;
      const built = chs.filter(c => c.built).length;
      const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
      set("stat-done", done);
      set("stat-built", built);
      set("stat-total", chs.length);
    }
    const io = new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target);} }),{threshold:.08});
    document.querySelectorAll("#chapters-grid .reveal").forEach((el,i)=>{ el.style.transitionDelay = (i%6*40)+"ms"; io.observe(el); });
  }

  document.addEventListener("DOMContentLoaded", render);
})();
