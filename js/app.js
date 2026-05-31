/* ============================================================
   AlgoTN — Cœur applicatif (thème, progression, recherche,
   coloration pseudo-code, UI partagée). Aucune dépendance.
   Site 100% statique et local : aucune donnée distante.
   ============================================================ */
(function () {
  "use strict";
  const LS = window.localStorage;
  const KEY_THEME = "algotn:theme";
  const KEY_PROG  = "algotn:progress";   // { chapId: {read:bool, quiz:0-100} }
  const KEY_NOTES = "algotn:notes";
  const KEY_FAV   = "algotn:fav";

  /* ---------- Stockage ---------- */
  const store = {
    get(k, def) { try { return JSON.parse(LS.getItem(k)) ?? def; } catch { return def; } },
    set(k, v) { try { LS.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const progress = () => store.get(KEY_PROG, {});
  const setProgress = (p) => store.set(KEY_PROG, p);

  /* Échappement HTML — appliqué à toute valeur dynamique avant insertion */
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

  window.AlgoTN = {
    store, esc, KEY_PROG, KEY_NOTES, KEY_FAV,
    progress, setProgress,
    markRead(id) { const p = progress(); p[id] = Object.assign({ read:false, quiz:0 }, p[id], { read:true }); setProgress(p); },
    setQuizScore(id, score) { const p = progress(); p[id] = Object.assign({ read:false, quiz:0 }, p[id]); p[id].quiz = Math.max(p[id].quiz, score); setProgress(p); },
    chapPct(id) { const c = progress()[id]; if (!c) return 0; return Math.round(((c.read?60:0) + (c.quiz*0.4))); },
    globalPct() {
      const chs = window.ALGOTN_CHAPTERS || [];
      if (!chs.length) return 0;
      const sum = chs.reduce((a,c)=> a + this.chapPct(c.id), 0);
      return Math.round(sum / chs.length);
    },
    toggleFav(id) { const f = new Set(store.get(KEY_FAV, [])); f.has(id) ? f.delete(id) : f.add(id); store.set(KEY_FAV, [...f]); return f.has(id); },
    isFav(id) { return new Set(store.get(KEY_FAV, [])).has(id); },
  };

  /* ---------- Thème clair/sombre ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    store.set(KEY_THEME, t);
    document.querySelectorAll("[data-theme-icon]").forEach(el => el.textContent = t === "dark" ? "☀️" : "🌙");
  }
  function initTheme() {
    const saved = store.get(KEY_THEME, null);
    const sys = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(saved || sys);
    document.addEventListener("click", e => {
      if (!e.target.closest("[data-theme-toggle]")) return;
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---------- Coloration syntaxique du pseudo-code FR ---------- */
  const KW = ["Algorithme","Programme","Var","Type","Const","Début","Debut","Fin","Si","Alors","Sinon","FinSi","Selon","Cas","FinSelon","Pour","De","À","Faire","FinPour","Pas","TantQue","Tant","que","Que","FinTantQue","Répéter","Repeter","Jusqu'à","Jusqua","Fonction","Procédure","Procedure","Retourner","Retour","Allouer","Liberer","Libérer","Nil","NULL","Vrai","Faux","et","ou","non","mod","div","Lire","Ecrire","Écrire","FinFonction","FinProcédure","FinProcedure","Tableau","Enregistrement","FinEnregistrement","Liste"];
  const TYPES = ["entier","réel","reel","caractère","caractere","chaîne","chaine","booléen","booleen","logique"];
  function escapeHtml(s){ return s.replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
  function highlight(src) {
    return src.split("\n").map(line => {
      const cmt = line.match(/(\/\/.*$|\{[^}]*\}$)/);
      let comment = "";
      if (cmt) { comment = `<span class="tok-com">${escapeHtml(cmt[0])}</span>`; line = line.slice(0, cmt.index); }
      let out = escapeHtml(line);
      out = out.replace(/(&quot;[^&]*&quot;|'[^']*'|«[^»]*»)/g, m => `<span class="tok-str">${m}</span>`);
      out = out.replace(/(←|⟵|&lt;-|-&gt;|\^|&amp;|≠|≤|≥|\+\+|--)/g, m => `<span class="tok-op">${m}</span>`);
      out = out.replace(/\b(\d+(\.\d+)?)\b/g, m => `<span class="tok-num">${m}</span>`);
      out = out.replace(new RegExp("\\b(" + TYPES.join("|") + ")\\b","g"), m => `<span class="tok-type">${m}</span>`);
      out = out.replace(new RegExp("\\b(" + KW.join("|").replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + ")\\b","g"), m => `<span class="tok-kw">${m}</span>`);
      return out + comment;
    }).join("\n");
  }
  window.AlgoTN.highlight = highlight;
  function initCode() {
    document.querySelectorAll(".code code[data-raw], .code pre code:not(.done)").forEach(code => {
      const raw = code.getAttribute("data-raw") ?? code.textContent;
      code.innerHTML = highlight(raw); // contenu de confiance (rédigé dans le site), échappé par highlight()
      code.classList.add("done");
    });
    document.addEventListener("click", e => {
      const b = e.target.closest(".code__copy"); if (!b) return;
      const code = b.closest(".code").querySelector("code");
      const raw = code.getAttribute("data-raw") ?? code.textContent;
      navigator.clipboard?.writeText(raw).then(() => { const t = b.textContent; b.textContent = "✓ Copié"; setTimeout(()=>b.textContent=t, 1400); });
    });
  }

  /* ---------- Barre de lecture + bouton haut ---------- */
  function initReadbar() {
    const bar = document.querySelector(".readbar");
    const top = document.querySelector(".totop");
    if (!bar && !top) return;
    const onScroll = () => {
      const h = document.documentElement;
      const sc = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      if (bar) bar.style.width = (sc * 100) + "%";
      if (top) top.classList.toggle("show", h.scrollTop > 600);
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    top?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------- Apparition au scroll ---------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: .12 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Section active dans la table des matières ---------- */
  function initTocSpy() {
    const links = [...document.querySelectorAll(".toc a, .sidebar a[data-spy]")];
    if (!links.length) return;
    const map = new Map();
    links.forEach(a => { const id = a.getAttribute("href")?.replace("#",""); const t = id && document.getElementById(id); if (t) map.set(t, a); });
    const io = new IntersectionObserver(es => {
      es.forEach(en => { if (en.isIntersecting) { links.forEach(l => l.classList.remove("active")); map.get(en.target)?.classList.add("active"); } });
    }, { rootMargin: "-20% 0px -70% 0px" });
    map.forEach((_a, t) => io.observe(t));
  }

  /* ---------- Menu latéral mobile ---------- */
  function initMenu() {
    document.addEventListener("click", e => {
      if (e.target.closest(".menu-toggle")) document.querySelector(".sidebar")?.classList.toggle("open");
      else if (!e.target.closest(".sidebar") && !e.target.closest(".menu-toggle")) document.querySelector(".sidebar")?.classList.remove("open");
    });
  }

  /* ---------- Recherche globale (Ctrl/Cmd+K) ---------- */
  function initSearch() {
    const modal = document.querySelector(".search-modal");
    if (!modal) return;
    const input = modal.querySelector("input");
    const results = modal.querySelector(".search-results");
    const base = location.pathname.includes("/chapters/") ? "../" : "";
    const data = (window.ALGOTN_CHAPTERS || []).map(c => ({ t: c.title, d: c.desc, u: base + c.slug, built: c.built }));
    const open = () => { modal.classList.add("show"); input.value=""; render(""); input.focus(); };
    const close = () => modal.classList.remove("show");
    function render(q) {
      const ql = q.trim().toLowerCase();
      const found = data.filter(d => !ql || (d.t + " " + d.d).toLowerCase().includes(ql));
      // Données de chapitres = contenu de confiance ; la requête utilisateur est échappée via esc().
      results.innerHTML = found.length ? found.map((d,i)=>
        `<a href="${d.built ? esc(d.u) : '#'}" class="${i===0?'active':''}" ${d.built?'':'style="opacity:.55"'}>
           <div class="t">${esc(d.t)} ${d.built?'':'<span class="chip-mini">bientôt</span>'}</div><div class="d">${esc(d.d)}</div></a>`).join("")
        : `<a><div class="d">Aucun résultat pour « ${esc(q)} »</div></a>`;
    }
    input.addEventListener("input", () => render(input.value));
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); modal.classList.contains("show") ? close() : open(); }
      else if (e.key === "Escape") close();
    });
    document.querySelectorAll("[data-search-open]").forEach(b => b.addEventListener("click", open));
  }

  /* ---------- Init global ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme(); initCode(); initReadbar(); initReveal(); initTocSpy(); initMenu(); initSearch();
    const cur = document.body.getAttribute("data-chapter");
    if (cur) {
      const t = setTimeout(() => window.AlgoTN.markRead(cur), 12000);
      window.addEventListener("beforeunload", () => clearTimeout(t));
    }
  });
})();
