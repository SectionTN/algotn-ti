/* ============================================================
   AlgoTN — Visualiseur mémoire & pointeurs
   Sécurité : site statique local, aucune entrée libre. Tous les
   libellés/adresses proviennent du tableau interne SCEN (de confiance)
   et sont injectés via setHTML ; le texte simple via textContent.
   Cible : <div data-viz-pointers></div>
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r=document) => r.querySelector(s);
  const setHTML = (el, trustedHtml) => { el.innerHTML = trustedHtml; }; // gabarit + données SCEN internes de confiance

  const SCEN = {
    base: {
      titre: "Pointeur de base : adresse & déréférencement",
      steps: [
        { code:"Var n : entier ; p : ^entier", note:"On déclare un entier n et un pointeur p vers un entier. Pour l'instant p ne pointe sur rien.",
          mem:[{name:"n",addr:"0x100",val:"?"},{name:"p",addr:"0x200",val:"Nil",isPtr:true}], ptr:null, active:["p"] },
        { code:"n ← 25", note:"On range 25 dans la case mémoire de n (adresse 0x100).",
          mem:[{name:"n",addr:"0x100",val:"25"},{name:"p",addr:"0x200",val:"Nil",isPtr:true}], ptr:null, active:["n"] },
        { code:"p ← &n", note:"&n = « l'adresse de n » = 0x100. p contient donc 0x100 : p pointe sur n.",
          mem:[{name:"n",addr:"0x100",val:"25"},{name:"p",addr:"0x200",val:"0x100",isPtr:true}], ptr:{from:"p",to:"0x100"}, active:["p"] },
        { code:"Ecrire(p^)", note:"p^ = « la valeur pointée par p » = ce qu'il y a à l'adresse 0x100 = 25. On suit la flèche.",
          mem:[{name:"n",addr:"0x100",val:"25"},{name:"p",addr:"0x200",val:"0x100",isPtr:true}], ptr:{from:"p",to:"0x100"}, active:["n"], out:"Affiche : 25" },
        { code:"p^ ← 99", note:"On modifie la valeur pointée. Comme p pointe sur n, c'est n qui change : n vaut maintenant 99 !",
          mem:[{name:"n",addr:"0x100",val:"99"},{name:"p",addr:"0x200",val:"0x100",isPtr:true}], ptr:{from:"p",to:"0x100"}, active:["n"], out:"n vaut maintenant 99" },
      ]
    },
    alloc: {
      titre: "Allocation dynamique : Allouer / Liberer",
      steps: [
        { code:"Var p : ^entier", note:"Un pointeur p, qui ne pointe sur aucune case valide au départ.",
          mem:[{name:"p",addr:"0x200",val:"Nil",isPtr:true}], ptr:null, active:["p"] },
        { code:"Allouer(p)", note:"Allouer réserve une NOUVELLE case en mémoire (le tas) et met son adresse dans p. p pointe maintenant sur une case anonyme.",
          mem:[{name:"p",addr:"0x200",val:"0x350",isPtr:true},{name:"(anonyme)",addr:"0x350",val:"?",heap:true}], ptr:{from:"p",to:"0x350"}, active:["p"] },
        { code:"p^ ← 10", note:"On écrit 10 dans la case fraîchement allouée, via p^.",
          mem:[{name:"p",addr:"0x200",val:"0x350",isPtr:true},{name:"(anonyme)",addr:"0x350",val:"10",heap:true}], ptr:{from:"p",to:"0x350"}, active:["(anonyme)"] },
        { code:"Liberer(p)", note:"Liberer rend la case au système. La case 0x350 n'existe plus. ⚠️ p contient encore 0x350 : il devient un POINTEUR PENDANT (dangling).",
          mem:[{name:"p",addr:"0x200",val:"0x350 ⚠️",isPtr:true,danger:true}], ptr:null, active:["p"], warn:"p pointe vers une case libérée : ne plus utiliser p^ !" },
        { code:"p^ ← 4   // ERREUR", note:"Écrire via un pointeur pendant = accès à une zone non autorisée. C'est exactement le piège de l'examen : le résultat est une ERREUR, pas 4 ni 10.",
          mem:[{name:"p",addr:"0x200",val:"0x350 ⚠️",isPtr:true,danger:true}], ptr:null, active:["p"], warn:"Comportement indéfini / Erreur d'exécution." },
      ]
    },
    swap: {
      titre: "Échanger deux variables via pointeurs",
      steps: [
        { code:"a ← 1 ; b ← 2", note:"Deux entiers a et b.",
          mem:[{name:"a",addr:"0x10",val:"1"},{name:"b",addr:"0x14",val:"2"}], ptr:null, active:["a","b"] },
        { code:"p1 ← &a ; p2 ← &b", note:"p1 pointe sur a, p2 pointe sur b.",
          mem:[{name:"a",addr:"0x10",val:"1"},{name:"b",addr:"0x14",val:"2"},{name:"p1",addr:"0x30",val:"0x10",isPtr:true},{name:"p2",addr:"0x34",val:"0x14",isPtr:true}], ptr:{from:"p1",to:"0x10"}, active:["p1"] },
        { code:"aux ← p1^", note:"On sauvegarde la valeur pointée par p1 (=1) dans aux.",
          mem:[{name:"a",addr:"0x10",val:"1"},{name:"b",addr:"0x14",val:"2"},{name:"aux",addr:"0x40",val:"1"}], ptr:{from:"p1",to:"0x10"}, active:["aux"] },
        { code:"p1^ ← p2^", note:"On copie la valeur pointée par p2 (=2) dans la case pointée par p1 : a devient 2.",
          mem:[{name:"a",addr:"0x10",val:"2"},{name:"b",addr:"0x14",val:"2"},{name:"aux",addr:"0x40",val:"1"}], ptr:{from:"p1",to:"0x10"}, active:["a"] },
        { code:"p2^ ← aux", note:"On met aux (=1) dans la case pointée par p2 : b devient 1. Échange terminé sans copier les variables elles-mêmes !",
          mem:[{name:"a",addr:"0x10",val:"2"},{name:"b",addr:"0x14",val:"1"},{name:"aux",addr:"0x40",val:"1"}], ptr:{from:"p2",to:"0x14"}, active:["b"], out:"a = 2, b = 1 ✅" },
      ]
    }
  };

  function init(host) {
    const keys = Object.keys(SCEN);
    setHTML(host, `
      <div class="viz">
        <div class="viz__head">
          <h4>🧠 Visualiseur mémoire & pointeurs</h4>
          <span class="pill">Adresse → Valeur</span>
        </div>
        <div class="viz__body">
          <div class="memrow" data-mem style="min-height:96px"></div>
          <div class="note note--intui" data-note style="margin-top:18px"><span class="note__ic">💬</span><div class="note__body" data-notetext></div></div>
          <div data-out style="margin-top:10px;font-weight:800"></div>
        </div>
        <div class="viz__controls">
          <label>Scénario</label>
          <select data-scen>${keys.map(k=>`<option value="${k}">${SCEN[k].titre}</option>`).join("")}</select>
          <button class="btn btn--soft btn--sm" data-prev>◀ Précédent</button>
          <span class="pill" data-stepn>1 / 1</span>
          <button class="btn btn--primary btn--sm" data-next>Suivant ▶</button>
          <button class="btn btn--ghost btn--sm" data-restart>↺</button>
        </div>
      </div>`);

    const memEl = $("[data-mem]", host), noteEl = $("[data-notetext]", host), outEl = $("[data-out]", host), stepnEl = $("[data-stepn]", host);
    let scen = keys[0], i = 0;

    function draw() {
      const s = SCEN[scen].steps[i];
      setHTML(memEl, s.mem.map(m => {
        const cls = (s.active||[]).includes(m.name) ? "is-active" : "";
        const style = m.danger ? "border-color:var(--bad)" : (m.heap ? "border-style:dashed" : "");
        return `<div class="membox ${cls}" style="${style}">
          <div class="addr">${m.addr}${m.heap?" · tas":""}</div>
          <div class="name">${m.name}</div>
          <div class="val">${m.val}</div>
          ${m.isPtr?'<div class="ptr-link">pointeur ^</div>':''}
        </div>`;
      }).join("") + (s.ptr ? `<div class="arrow">⟶</div><div class="ptr-link">${s.ptr.from} pointe sur ${s.ptr.to}</div>` : ""));
      setHTML(noteEl, `<strong>${s.code}</strong>${s.note}`);
      // Sortie : message interne du scénario (de confiance), passé par esc()
      const E = (window.AlgoTN && window.AlgoTN.esc) || (x=>x);
      if (s.warn) setHTML(outEl, `<span style="color:var(--bad)">⚠️ ${E(s.warn)}</span>`);
      else if (s.out) setHTML(outEl, `<span class="grad-text">${E(s.out)}</span>`);
      else outEl.textContent = "";
      stepnEl.textContent = `${i+1} / ${SCEN[scen].steps.length}`;
    }
    $("[data-scen]", host).addEventListener("change", e => { scen = e.target.value; i = 0; draw(); });
    $("[data-next]", host).addEventListener("click", () => { i = Math.min(i+1, SCEN[scen].steps.length-1); draw(); });
    $("[data-prev]", host).addEventListener("click", () => { i = Math.max(i-1, 0); draw(); });
    $("[data-restart]", host).addEventListener("click", () => { i = 0; draw(); });
    draw();
  }

  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-viz-pointers]").forEach(init));
})();
