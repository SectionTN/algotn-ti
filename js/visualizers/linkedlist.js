/* ============================================================
   AlgoTN — Visualiseur de liste chaînée
   Sécurité : site statique local. Les valeurs des nœuds sont des
   ENTIERS (parseInt) ; tout est injecté via setHTML (gabarit interne
   de confiance). Aucune saisie de texte libre, aucun réseau.
   Cible : <div data-viz-linkedlist></div>
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r=document) => r.querySelector(s);
  const setHTML = (el, trustedHtml) => { el.innerHTML = trustedHtml; }; // gabarit + entiers internes de confiance

  function init(host) {
    setHTML(host, `
      <div class="viz">
        <div class="viz__head">
          <h4>⛓️ Visualiseur de liste chaînée</h4>
          <span class="pill">tête → … → Nil</span>
        </div>
        <div class="viz__body">
          <div class="llist" data-list></div>
          <div class="viz__log" data-log style="margin-top:14px"></div>
        </div>
        <div class="viz__controls">
          <label>Valeur</label><input type="number" data-val value="7" style="width:74px">
          <button class="btn btn--primary btn--sm" data-head>↰ Insérer en tête</button>
          <button class="btn btn--soft btn--sm" data-tail>Insérer en queue ↳</button>
          <button class="btn btn--soft btn--sm" data-del>✕ Supprimer 1ʳᵉ occ.</button>
          <button class="btn btn--ghost btn--sm" data-search>🔎 Rechercher</button>
          <button class="btn btn--ghost btn--sm" data-trav>↻ Parcourir</button>
          <button class="btn btn--ghost btn--sm" data-clear>🗑 Vider</button>
        </div>
      </div>`);

    const listEl = $("[data-list]", host), logEl = $("[data-log]", host);
    let list = [3, 8, 5];
    const sleep = ms => new Promise(r=>setTimeout(r,ms));
    let busy = false;

    function draw(states = {}) {
      let html = "";
      if (!list.length) html = `<span class="nullbox">tête = Nil (liste vide)</span>`;
      else {
        html = `<span class="ptr-link" style="margin-right:6px">tête</span><span class="arrow">→</span>`;
        list.forEach((v, idx) => {
          const st = states[idx] ? "is-" + states[idx] : "";
          html += `<div class="node ${st}"><div class="node__data">${v}</div><div class="node__next">${idx < list.length-1 ? "•" : "⊘"}</div></div>`;
          html += idx < list.length-1 ? `<span class="arrow">→</span>` : `<span class="arrow">→</span><span class="nullbox">Nil</span>`;
        });
      }
      setHTML(listEl, html);
    }
    function log(msg, hl) { const d = document.createElement("div"); if (hl) d.className="hl"; d.textContent = msg; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; }
    function getVal() { const v = parseInt($("[data-val]", host).value, 10); return Number.isFinite(v) ? v : 0; }
    function lock(b){ busy=b; host.querySelectorAll(".viz__controls button").forEach(x=>x.disabled=b); }

    async function insertHead() {
      if (busy) return; lock(true);
      const v = getVal();
      log(`Insertion en tête de ${v} : nouveau nœud → ancienne tête, puis tête ← nouveau nœud.`);
      list.unshift(v); draw({0:"new"}); await sleep(550); draw(); lock(false);
    }
    async function insertTail() {
      if (busy) return; lock(true);
      const v = getVal();
      log(`Insertion en queue de ${v} : on parcourt jusqu'au dernier nœud (suivant = Nil).`);
      for (let i=0;i<list.length;i++){ draw({[i]:"active"}); await sleep(330); }
      list.push(v); draw({[list.length-1]:"new"}); await sleep(550); draw(); lock(false);
    }
    async function del() {
      if (busy) return; lock(true);
      const v = getVal();
      log(`Suppression de la 1ʳᵉ occurrence de ${v}…`);
      let found = -1;
      for (let i=0;i<list.length;i++){ draw({[i]:"active"}); await sleep(330); if (list[i]===v){ found=i; break; } }
      if (found>=0){ draw({[found]:"del"}); await sleep(520); log(`Trouvé en position ${found+1} : on relie le précédent au suivant, puis on libère le nœud.`, true); list.splice(found,1); draw(); }
      else log(`${v} introuvable : rien à supprimer.`, true);
      lock(false);
    }
    async function search() {
      if (busy) return; lock(true);
      const v = getVal(); log(`Recherche de ${v} (parcours séquentiel)…`);
      let found=-1;
      for (let i=0;i<list.length;i++){ draw({[i]:"active"}); await sleep(360); if (list[i]===v){ found=i; break; } }
      if (found>=0){ draw({[found]:"new"}); log(`✅ Trouvé en position ${found+1}.`, true); }
      else { draw(); log(`❌ ${v} n'est pas dans la liste.`, true); }
      lock(false);
    }
    async function traverse() {
      if (busy) return; lock(true);
      log(`Parcours : p ← tête, puis p ← p^.suivant tant que p ≠ Nil.`);
      let sum=0;
      for (let i=0;i<list.length;i++){ draw({[i]:"active"}); sum+=list[i]; await sleep(360); log(`  Nœud ${i+1} = ${list[i]}`); }
      draw(); log(`Fin (p = Nil). Somme des éléments = ${sum}.`, true); lock(false);
    }

    $("[data-head]", host).addEventListener("click", insertHead);
    $("[data-tail]", host).addEventListener("click", insertTail);
    $("[data-del]", host).addEventListener("click", del);
    $("[data-search]", host).addEventListener("click", search);
    $("[data-trav]", host).addEventListener("click", traverse);
    $("[data-clear]", host).addEventListener("click", () => { if (busy) return; list=[]; logEl.textContent=""; log("Liste vidée."); draw(); });
    draw();
  }

  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-viz-linkedlist]").forEach(init));
})();
