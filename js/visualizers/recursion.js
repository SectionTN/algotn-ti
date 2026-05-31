/* ============================================================
   AlgoTN — Visualiseur de récursivité (pile d'appels animée)
   Sécurité : site 100% statique et local. Aucune entrée libre :
   seules des valeurs NUMÉRIQUES (parseInt) et des libellés internes
   sont injectés via setHTML (gabarit de confiance). Aucun réseau.
   Cible : <div data-viz-recursion></div>
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r=document) => r.querySelector(s);
  const setHTML = (el, trustedHtml) => { el.innerHTML = trustedHtml; }; // gabarit interne de confiance

  function init(host) {
    setHTML(host, `
      <div class="viz">
        <div class="viz__head">
          <h4>🧬 Visualiseur de récursivité</h4>
          <span class="pill">Pile d'appels en direct</span>
        </div>
        <div class="viz__body">
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:18px" data-rgrid>
            <div>
              <div class="lead-chip" style="margin-bottom:8px">📚 Pile d'appels (call stack)</div>
              <div class="callstack" data-stack></div>
            </div>
            <div>
              <div class="lead-chip" style="margin-bottom:8px">🪵 Trace d'exécution</div>
              <div class="viz__log" data-log></div>
            </div>
          </div>
          <div data-result style="margin-top:16px;font-weight:800"></div>
        </div>
        <div class="viz__controls">
          <label>Fonction</label>
          <select data-fn>
            <option value="fact">factorielle(n)</option>
            <option value="fib">fibonacci(n)</option>
            <option value="pgcd">pgcd(a, b)</option>
          </select>
          <label>n</label><input type="number" data-n value="4" min="0" max="9" style="width:70px">
          <span data-b2wrap style="display:none"><label>b</label><input type="number" data-b value="18" min="0" max="99" style="width:70px"></span>
          <label>Vitesse</label>
          <select data-speed><option value="650">Lente</option><option value="380" selected>Normale</option><option value="160">Rapide</option></select>
          <button class="btn btn--primary btn--sm" data-run>▶ Lancer</button>
          <button class="btn btn--soft btn--sm" data-clear>↺ Effacer</button>
        </div>
      </div>`);

    const stackEl = $("[data-stack]", host), logEl = $("[data-log]", host), resEl = $("[data-result]", host);
    const fnSel = $("[data-fn]", host);
    const grid = $("[data-rgrid]", host);
    if (window.matchMedia("(max-width:640px)").matches) grid.style.gridTemplateColumns = "1fr";

    let stack = [], steps = [], playing = false;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const speed = () => +$("[data-speed]", host).value;

    function drawStack() {
      // libellés purement internes (numériques) → contenu de confiance
      setHTML(stackEl, stack.map((f, i) =>
        `<div class="frame ${i===stack.length-1?'is-top':''} ${f.ret!=null?'is-return':''}">
           <span>${f.label}</span><small>${f.ret!=null ? "→ "+f.ret : "…"}</small>
         </div>`).join("") || `<div class="muted" style="font-size:.85rem">Pile vide.</div>`);
    }
    function log(msg, hl) {
      const d = document.createElement("div");
      d.className = hl ? "hl" : "";
      d.textContent = msg;                 // textContent : aucune injection HTML
      logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight;
    }

    function factSteps(n) {
      let id = 0;
      (function rec(n) {
        const fid = id++;
        steps.push({ t:"push", label:`factorielle(${n})`, fid });
        if (n <= 1) { steps.push({ t:"base", fid, msg:`Cas de base : factorielle(${n}) = 1` }); steps.push({ t:"pop", fid, val:1 }); return 1; }
        steps.push({ t:"call", fid, msg:`factorielle(${n}) attend factorielle(${n-1})` });
        const sub = rec(n-1), v = n * sub;
        steps.push({ t:"compute", fid, val:v, msg:`factorielle(${n}) = ${n} × ${sub} = ${v}` });
        steps.push({ t:"pop", fid, val:v }); return v;
      })(n);
      return steps.length ? factResult(n) : 1;
    }
    function factResult(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
    function fibSteps(n) {
      let id = 0;
      (function rec(n) {
        const fid = id++;
        steps.push({ t:"push", label:`fib(${n})`, fid });
        if (n < 2) { steps.push({ t:"base", fid, msg:`Cas de base : fib(${n}) = ${n}` }); steps.push({ t:"pop", fid, val:n }); return n; }
        steps.push({ t:"call", fid, msg:`fib(${n}) = fib(${n-1}) + fib(${n-2})` });
        const a = rec(n-1), b = rec(n-2), v = a+b;
        steps.push({ t:"compute", fid, val:v, msg:`fib(${n}) = ${a} + ${b} = ${v}` });
        steps.push({ t:"pop", fid, val:v }); return v;
      })(n);
      return fibResult(n);
    }
    function fibResult(n){ let a=0,b=1; if(n<2)return n; for(let i=2;i<=n;i++){[a,b]=[b,a+b];} return b; }
    function pgcdSteps(a, b) {
      let id = 0;
      const result = (function rec(a, b) {
        const fid = id++;
        steps.push({ t:"push", label:`pgcd(${a}, ${b})`, fid });
        if (b === 0) { steps.push({ t:"base", fid, msg:`Cas de base : b = 0 ⟹ pgcd = ${a}` }); steps.push({ t:"pop", fid, val:a }); return a; }
        steps.push({ t:"call", fid, msg:`pgcd(${a}, ${b}) → pgcd(${b}, ${a%b})` });
        const v = rec(b, a % b);
        steps.push({ t:"compute", fid, val:v, msg:`pgcd(${a}, ${b}) renvoie ${v}` });
        steps.push({ t:"pop", fid, val:v }); return v;
      })(a, b);
      return result;
    }

    async function play(finalLabel, finalVal) {
      playing = true;
      for (const s of steps) {
        if (!playing) return;
        if (s.t === "push") { stack.push({ label:s.label, fid:s.fid, ret:null }); log("⬇ Empile " + s.label); }
        else if (s.t === "call") log("   " + s.msg);
        else if (s.t === "base") log("✔ " + s.msg, true);
        else if (s.t === "compute") { const f = stack.find(x=>x.fid===s.fid); if (f) f.ret = s.val; log("   " + s.msg, true); }
        else if (s.t === "pop") { const f = stack.find(x=>x.fid===s.fid); if (f) f.ret = s.val; drawStack(); await sleep(speed()); stack = stack.filter(x=>x.fid!==s.fid); log("⬆ Dépile → renvoie " + s.val); }
        drawStack();
        await sleep(speed());
      }
      // finalLabel/finalVal : valeurs internes calculées → de confiance
      setHTML(resEl, `<span class="grad-text">✅ Résultat : ${finalLabel} = ${finalVal}</span>`);
      playing = false;
    }

    function run() {
      playing = false;
      setTimeout(() => {
        stack = []; steps = []; logEl.textContent = ""; resEl.textContent = "";
        const fn = fnSel.value, n = Math.min(+$("[data-n]", host).value || 0, 9);
        let label, val;
        if (fn === "fact") { val = fibOrFact("fact", n); label = `factorielle(${n})`; }
        else if (fn === "fib") { val = fibOrFact("fib", n); label = `fib(${n})`; }
        else { const b = Math.max(0, +$("[data-b]", host).value || 0); val = pgcdSteps(Math.max(0,n), b); label = `pgcd(${n}, ${b})`; }
        play(label, val);
      }, 60);
    }
    function fibOrFact(which, n){ return which==="fact" ? fibFactGen(()=>factSteps(n)) : fibFactGen(()=>fibSteps(n)); }
    function fibFactGen(gen){ return gen(); }

    fnSel.addEventListener("change", () => {
      const isPgcd = fnSel.value === "pgcd";
      $("[data-b2wrap]", host).style.display = isPgcd ? "inline" : "none";
      $("[data-n]", host).previousElementSibling.textContent = isPgcd ? "a" : "n";
    });
    $("[data-run]", host).addEventListener("click", run);
    $("[data-clear]", host).addEventListener("click", () => { playing=false; stack=[]; steps=[]; logEl.textContent=""; resEl.textContent=""; drawStack(); });
    drawStack();
  }

  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-viz-recursion]").forEach(init));
})();
