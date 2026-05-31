/* ============================================================
   AlgoTN — Page chapitre : navigation latérale, prochain/précédent,
   favori, et table des matières auto à partir des <h2 id>.
   Sécurité : données ALGOTN_CHAPTERS rédigées dans le site (de
   confiance), injectées via setHTML. Site statique, local, sans réseau.
   ============================================================ */
(function () {
  "use strict";
  const setHTML = (el, trustedHtml) => { el.innerHTML = trustedHtml; }; // données internes de confiance

  document.addEventListener("DOMContentLoaded", () => {
    const cur = document.body.getAttribute("data-chapter");
    const chs = window.ALGOTN_CHAPTERS || [];
    const idx = chs.findIndex(c => c.id === cur);

    const navEl = document.getElementById("chap-nav");
    if (navEl) {
      setHTML(navEl, chs.map(c => {
        const active = c.id === cur ? "active" : "";
        const href = c.built ? c.slug.replace("chapters/", "") : "#";
        const lock = c.built ? "" : " 🔒";
        return `<a href="${href}" class="${active}" ${c.built?"":'style="opacity:.5"'}>
          <span style="width:22px;text-align:center">${c.icon}</span>
          <span>${c.num}. ${c.title}${lock}</span></a>`;
      }).join(""));
    }

    const tocEl = document.getElementById("toc");
    if (tocEl) {
      const hs = [...document.querySelectorAll(".article h2[id]")];
      setHTML(tocEl, hs.map(h => `<a href="#${h.id}">${h.textContent.replace(/^\s*\d+\s*/, "")}</a>`).join(""));
    }

    const nav2 = document.getElementById("prevnext");
    if (nav2 && idx >= 0) {
      const builtList = chs.filter(c => c.built);
      const pos = builtList.findIndex(c => c.id === cur);
      const prev = builtList[pos - 1], next = builtList[pos + 1];
      const link = (c, dir) => c
        ? `<a href="${c.slug.replace("chapters/","")}" class="card card--hover" style="flex:1;min-width:200px;text-decoration:none">
             <div class="muted" style="font-size:.78rem">${dir}</div>
             <div style="font-weight:800;margin-top:4px">${c.icon} ${c.title}</div></a>`
        : `<div style="flex:1;min-width:200px"></div>`;
      setHTML(nav2, link(prev, "← Chapitre précédent") + link(next, "Chapitre suivant →"));
    }

    const fav = document.getElementById("fav-btn");
    if (fav && window.AlgoTN) {
      const sync = () => { fav.textContent = window.AlgoTN.isFav(cur) ? "★ En favori" : "☆ Mettre en favori"; };
      sync();
      fav.addEventListener("click", () => { window.AlgoTN.toggleFav(cur); sync(); });
    }

    // Accordéons d'exercices
    document.addEventListener("click", e => {
      const t = e.target.closest("[data-exo-toggle]");
      if (!t) return;
      const exo = t.closest(".exo");
      exo.classList.toggle("is-open");
      t.textContent = exo.classList.contains("is-open") ? "▲ Masquer la correction" : "▼ Voir la correction détaillée";
    });
  });
})();
