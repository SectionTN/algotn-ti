/* ============================================================
   AlgoTN — Moteur de QCM (score, minuterie, mode examen, correction)
   Sécurité : tout le contenu vient de window.ALGOTN_QUIZ (rédigé dans
   le site, donc de confiance) et CHAQUE valeur dynamique est passée par
   esc() (échappement HTML) avant insertion. Site statique, sans réseau.
   ============================================================ */
(function () {
  "use strict";
  const esc = (window.AlgoTN && window.AlgoTN.esc) || (s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])));
  // Affecte du HTML de confiance (gabarit interne, valeurs déjà échappées par esc)
  const setHTML = (el, trustedHtml) => { el.innerHTML = trustedHtml; };

  function build(container) {
    const bank = (window.ALGOTN_QUIZ || []).slice();
    if (!bank.length) return;
    const chapId = container.getAttribute("data-quiz");
    const totalTime = parseInt(container.getAttribute("data-time") || "0", 10);

    let mode = "libre";
    let order = bank.map((_, i) => i);
    const answers = {};
    let timer = null, left = totalTime;

    const root = document.createElement("div");
    container.appendChild(root);

    function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
    function fmt(s){ const m=Math.floor(s/60), x=s%60; return `${m}:${String(x).padStart(2,"0")}`; }

    function header() {
      return `<div class="quiz__head">
        <span class="pill pill--examen">🎯 QCM — ${bank.length} questions</span>
        <button class="btn btn--soft btn--sm" data-mode="libre">📖 Mode libre</button>
        <button class="btn btn--soft btn--sm" data-mode="examen">⏱️ Mode examen</button>
        <button class="btn btn--ghost btn--sm" data-shuffle>🔀 Mélanger</button>
        ${mode==="examen" ? `<span class="quiz__timer" id="qtimer">${fmt(left)}</span>` : ""}
        <span class="muted" style="margin-left:auto;font-size:.84rem" id="qprog"></span>
      </div>`;
    }

    function questionHTML(qi, pos) {
      const item = bank[qi];
      const opts = item.options.map((o, oi) =>
        `<div class="opt" data-q="${qi}" data-o="${oi}"><span class="mark"></span><span>${esc(o)}</span></div>`).join("");
      return `<div class="q" data-qi="${qi}">
        <div class="q__txt"><span class="qn">Q${pos+1}.</span>${esc(item.q)}</div>
        ${opts}
        <div class="q__exp"><strong>💡 Explication.</strong> ${esc(item.exp || "")}</div>
      </div>`;
    }

    function render() {
      setHTML(root, header() +
        `<div id="qlist">${order.map((qi, p) => questionHTML(qi, p)).join("")}</div>
         <div style="margin-top:22px;display:flex;gap:12px;flex-wrap:wrap">
           <button class="btn btn--primary" data-submit>✅ Corriger & voir mon score</button>
           <button class="btn btn--ghost" data-reset>↺ Recommencer</button>
         </div>
         <div id="qresult"></div>`);
      updateProg();
      restoreSelection();
    }

    function restoreSelection() {
      Object.entries(answers).forEach(([qi, oi]) => {
        const el = root.querySelector(`.opt[data-q="${qi}"][data-o="${oi}"]`);
        el && el.classList.add("is-sel");
      });
    }
    function updateProg() {
      const done = Object.keys(answers).length;
      const p = root.querySelector("#qprog");
      if (p) p.textContent = `${done}/${bank.length} répondues`;
    }

    function correct() {
      let score = 0;
      order.forEach(qi => {
        const item = bank[qi];
        const chosen = answers[qi];
        const qEl = root.querySelector(`.q[data-qi="${qi}"]`);
        qEl.classList.add("is-corrected");
        qEl.querySelectorAll(".opt").forEach(opt => {
          const oi = +opt.getAttribute("data-o");
          opt.classList.remove("is-sel");
          if (oi === item.answer) { opt.classList.add("is-correct"); opt.querySelector(".mark").textContent = "✓"; }
          if (oi === chosen && chosen !== item.answer) { opt.classList.add("is-wrong"); opt.querySelector(".mark").textContent = "✗"; }
        });
        if (chosen === item.answer) score++;
      });
      const pct = Math.round(score / bank.length * 100);
      window.AlgoTN && chapId && window.AlgoTN.setQuizScore(chapId, pct);
      stopTimer();
      const msg = pct>=80 ? "🏆 Excellent ! Tu maîtrises." : pct>=50 ? "💪 Bien, encore un effort sur les pièges." : "📚 À revoir : relis le cours puis réessaie.";
      const res = root.querySelector("#qresult");
      // Gabarit interne + valeurs numériques calculées : contenu de confiance
      setHTML(res, `<div class="card quiz__result" style="margin-top:22px">
          <div class="quiz__score grad-text">${score}/${bank.length}</div>
          <div class="progress" style="max-width:320px;margin:14px auto"><i style="width:${pct}%"></i></div>
          <p style="font-weight:700">${pct}% — ${esc(msg)}</p>
        </div>`);
      res.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function startTimer() {
      if (mode !== "examen" || !totalTime) return;
      stopTimer(); left = totalTime;
      const t = root.querySelector("#qtimer");
      timer = setInterval(() => {
        left--; if (t){ t.textContent = fmt(left); t.classList.toggle("is-low", left <= 60); }
        if (left <= 0) { stopTimer(); correct(); }
      }, 1000);
    }
    function stopTimer(){ if (timer){ clearInterval(timer); timer = null; } }

    root.addEventListener("click", e => {
      const opt = e.target.closest(".opt");
      if (opt && !opt.closest(".q").classList.contains("is-corrected")) {
        const qi = +opt.getAttribute("data-q"), oi = +opt.getAttribute("data-o");
        opt.closest(".q").querySelectorAll(".opt").forEach(o => o.classList.remove("is-sel"));
        opt.classList.add("is-sel"); answers[qi] = oi; updateProg();
        if (mode === "libre") {
          const item = bank[qi], qEl = opt.closest(".q");
          qEl.classList.add("is-corrected");
          qEl.querySelectorAll(".opt").forEach(o2 => {
            const j = +o2.getAttribute("data-o");
            if (j === item.answer){ o2.classList.add("is-correct"); o2.querySelector(".mark").textContent="✓"; }
            if (j === oi && oi !== item.answer){ o2.classList.add("is-wrong"); o2.querySelector(".mark").textContent="✗"; }
          });
        }
        return;
      }
      const m = e.target.closest("[data-mode]");
      if (m) { mode = m.getAttribute("data-mode"); Object.keys(answers).forEach(k=>delete answers[k]); render(); startTimer(); return; }
      if (e.target.closest("[data-shuffle]")) { shuffle(order); Object.keys(answers).forEach(k=>delete answers[k]); render(); startTimer(); return; }
      if (e.target.closest("[data-submit]")) { correct(); return; }
      if (e.target.closest("[data-reset]")) { Object.keys(answers).forEach(k=>delete answers[k]); render(); startTimer(); return; }
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quiz[data-quiz]").forEach(build);
  });
})();
