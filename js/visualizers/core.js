/* ============================================================
   AlgoTN — Visualiseurs de base (regroupés)
   Sécurité : site 100% statique et local. Aucune saisie de texte
   libre exécutée ; toutes les valeurs sont des ENTIERS (parseInt) ou
   des libellés internes (de confiance). Injection via setHTML
   (gabarit interne) et textContent pour les journaux. Aucun réseau.
   Widgets (par attribut) :
     data-viz-execution  data-viz-conditions  data-viz-loops
     data-viz-array      data-viz-calls       data-viz-record
     data-viz-stack      data-viz-queue       data-viz-search
     data-viz-sort       data-viz-complexity
   ============================================================ */
(function () {
  "use strict";
  const $  = (s, r=document) => r.querySelector(s);
  const setHTML = (el, trustedHtml) => { el.innerHTML = trustedHtml; }; // gabarit interne de confiance
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const logLine = (box, msg, hl) => { const d=document.createElement("div"); if(hl)d.className="hl"; d.textContent=msg; box.appendChild(d); box.scrollTop=box.scrollHeight; };
  const wrap = (head, body, controls) =>
    `<div class="viz"><div class="viz__head"><h4>${head.t}</h4><span class="pill">${head.p}</span></div>
     <div class="viz__body">${body}</div><div class="viz__controls">${controls}</div></div>`;

  /* ---------------- 1) Simulateur d'exécution ---------------- */
  function execution(host) {
    setHTML(host, wrap({t:"▶️ Simulateur d'exécution", p:"mémoire pas à pas"},
      `<div class="code" style="margin-top:0"><div class="code__bar"><span class="dots"><i></i><i></i><i></i></span><span class="code__title">somme.algo</span></div>
        <pre><code class="done" data-lines>1</code></pre></div>
       <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:14px">
         <div><div class="lead-chip" style="margin-bottom:8px">🧠 Mémoire (variables)</div><div class="cells" data-mem></div></div>
         <div style="flex:1;min-width:200px"><div class="lead-chip" style="margin-bottom:8px">🪵 Sortie</div><div class="viz__log" data-out></div></div>
       </div>`,
      `<label>A</label><input type="number" data-a value="7" style="width:74px">
       <label>B</label><input type="number" data-b value="5" style="width:74px">
       <button class="btn btn--primary btn--sm" data-run>▶ Exécuter</button>
       <button class="btn btn--soft btn--sm" data-reset>↺</button>`));
    const PROG = ["DEBUT","Lire(A)","Lire(B)","S ← A + B","Ecrire(S)","FIN"];
    const codeEl=$("[data-lines]",host), memEl=$("[data-mem]",host), outEl=$("[data-out]",host);
    function showCode(active){ setHTML(codeEl, PROG.map((l,i)=>`<div style="padding:2px 0;${i===active?'background:rgba(99,102,241,.25);border-radius:4px':''}">${String(i+1).padStart(2,'0')}  ${l.replace(/</g,'&lt;')}</div>`).join("")); }
    function showMem(vars){ setHTML(memEl, Object.entries(vars).map(([k,v])=>`<div class="cell is-active"><div class="cell__v">${v}</div><div class="cell__i">${k}</div></div>`).join("") || '<span class="muted">vide</span>'); }
    async function run(){
      const a=parseInt($("[data-a]",host).value,10)||0, b=parseInt($("[data-b]",host).value,10)||0;
      outEl.textContent=""; const vars={};
      showCode(0); showMem(vars); await sleep(500);
      showCode(1); vars.A=a; showMem(vars); logLine(outEl,`Lire(A) → A = ${a}`); await sleep(700);
      showCode(2); vars.B=b; showMem(vars); logLine(outEl,`Lire(B) → B = ${b}`); await sleep(700);
      showCode(3); vars.S=a+b; showMem(vars); logLine(outEl,`S ← A + B = ${a} + ${b} = ${a+b}`,true); await sleep(700);
      showCode(4); logLine(outEl,`Ecrire(S) → affiche : ${a+b}`,true); await sleep(600);
      showCode(5);
    }
    $("[data-run]",host).addEventListener("click",run);
    $("[data-reset]",host).addEventListener("click",()=>{showCode(-1);showMem({});outEl.textContent="";});
    showCode(-1); showMem({});
  }

  /* ---------------- 2) Simulateur SI / SINON / SELON ---------------- */
  function conditions(host){
    setHTML(host, wrap({t:"⑂ Simulateur de décision", p:"chemin d'exécution"},
      `<div class="code" style="margin-top:0"><div class="code__bar"><span class="dots"><i></i><i></i><i></i></span><span class="code__title">mention.algo</span></div>
        <pre><code class="done" data-cond></code></pre></div>
       <div class="note note--intui" style="margin-top:14px"><span class="note__ic">➡️</span><div class="note__body" data-verdict>Choisis une note et lance.</div></div>`,
      `<label>Note /20</label><input type="number" data-note value="13" min="0" max="20" style="width:84px">
       <button class="btn btn--primary btn--sm" data-run>▶ Évaluer</button>`));
    const codeEl=$("[data-cond]",host), vEl=$("[data-verdict]",host);
    const PROG=["Si (note >= 10) Alors","    Si (note >= 14) Alors","        Ecrire(\"Bien\")","    Sinon","        Ecrire(\"Passable\")","    FinSi","Sinon","    Ecrire(\"Insuffisant\")","FinSi"];
    function draw(hot){ setHTML(codeEl, PROG.map((l,i)=>`<div style="padding:2px 0;${hot.includes(i)?'background:rgba(16,185,129,.22);border-radius:4px':(hot.length&&!hot.includes(i)?'opacity:.4':'')}">${l.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join("")); }
    function run(){
      const n=parseInt($("[data-note]",host).value,10)||0; let hot, verdict;
      if(n>=10){ if(n>=14){hot=[0,1,2,5];verdict=`note=${n} ≥ 10 ✔ et ≥ 14 ✔ → <b>Bien</b>`;} else {hot=[0,1,3,4,5];verdict=`note=${n} ≥ 10 ✔ mais < 14 ✘ → <b>Passable</b>`;} }
      else { hot=[0,6,7,8]; verdict=`note=${n} < 10 ✘ → <b>Insuffisant</b>`; }
      draw(hot); setHTML(vEl, `Chemin pris : ${verdict}`);
    }
    $("[data-run]",host).addEventListener("click",run); draw([]);
  }

  /* ---------------- 3) Visualiseur de boucles ---------------- */
  function loops(host){
    setHTML(host, wrap({t:"↻ Loop Visualizer", p:"itérations animées"},
      `<div style="display:flex;gap:20px;flex-wrap:wrap">
         <div class="membox is-active" style="text-align:center"><div class="addr">compteur</div><div class="val" data-i>—</div></div>
         <div class="membox is-active" style="text-align:center"><div class="addr">somme</div><div class="val" data-s>0</div></div>
         <div class="membox" style="text-align:center"><div class="addr">test</div><div class="name" data-test>—</div></div>
       </div>
       <div class="cells" data-iters style="margin-top:16px"></div>
       <div class="viz__log" data-log style="margin-top:12px"></div>`,
      `<label>Type</label><select data-type><option value="pour">POUR</option><option value="tantque">TANT QUE</option><option value="repeter">RÉPÉTER</option></select>
       <label>n</label><input type="number" data-n value="5" min="1" max="12" style="width:74px">
       <button class="btn btn--primary btn--sm" data-run>▶ Lancer</button>`));
    const iEl=$("[data-i]",host),sEl=$("[data-s]",host),tEl=$("[data-test]",host),itEl=$("[data-iters]",host),logEl=$("[data-log]",host);
    let busy=false;
    async function run(){
      if(busy)return; busy=true; const n=Math.min(parseInt($("[data-n]",host).value,10)||1,12), type=$("[data-type]",host).value;
      itEl.textContent=""; logEl.textContent=""; let s=0;
      logLine(logEl,`Boucle ${type.toUpperCase()} de 1 à ${n} — on accumule la somme.`);
      for(let i=1;i<=n;i++){
        iEl.textContent=i; tEl.textContent = type==="repeter"?`i ≤ ${n} ?`:`i ≤ ${n} ? Vrai`;
        s+=i; sEl.textContent=s;
        const c=document.createElement("div"); c.className="cell is-active"; setHTML(c,`<div class="cell__v">${i}</div><div class="cell__i">tour ${i}</div>`); itEl.appendChild(c);
        logLine(logEl,`Tour ${i} : somme ← ${s-i} + ${i} = ${s}`);
        await sleep(420);
      }
      tEl.textContent = `i > ${n} → STOP`; logLine(logEl,`Condition fausse : on sort. Somme finale = ${s}.`,true); busy=false;
    }
    $("[data-run]",host).addEventListener("click",run);
  }

  /* ---------------- 4) Array Visualizer ---------------- */
  function array(host){
    setHTML(host, wrap({t:"▦ Array Visualizer", p:"indices & valeurs"},
      `<div class="cells" data-arr style="margin-top:0"></div>
       <div class="viz__log" data-log style="margin-top:14px"></div>`,
      `<label>Valeur</label><input type="number" data-val value="9" style="width:74px">
       <label>Indice</label><input type="number" data-idx value="2" min="0" style="width:74px">
       <button class="btn btn--soft btn--sm" data-acc>📍 Accéder T[i]</button>
       <button class="btn btn--soft btn--sm" data-set>✏️ T[i] ← val</button>
       <button class="btn btn--ghost btn--sm" data-find>🔎 Chercher val</button>
       <button class="btn btn--ghost btn--sm" data-trav>↻ Parcourir</button>
       <button class="btn btn--ghost btn--sm" data-rand>🎲 Aléatoire</button>`));
    const arrEl=$("[data-arr]",host), logEl=$("[data-log]",host);
    let A=[4,8,15,16,23,42], busy=false;
    function draw(st={}){ setHTML(arrEl, A.map((v,i)=>`<div class="cell ${st[i]?'is-'+st[i]:''}"><div class="cell__v">${v}</div><div class="cell__i">[${i}]</div></div>`).join("")); }
    function lock(b){busy=b;host.querySelectorAll(".viz__controls button").forEach(x=>x.disabled=b);}
    const idx=()=>parseInt($("[data-idx]",host).value,10)||0, val=()=>parseInt($("[data-val]",host).value,10)||0;
    async function access(){ if(busy)return;lock(true); const i=idx(); if(i<0||i>=A.length){logLine(logEl,`Indice ${i} hors limites (0..${A.length-1}) !`,true);lock(false);return;} draw({[i]:"active"}); logLine(logEl,`Accès direct T[${i}] = ${A[i]} (instantané, O(1)).`,true); lock(false); }
    async function setv(){ if(busy)return;lock(true); const i=idx(); if(i<0||i>=A.length){logLine(logEl,`Indice ${i} hors limites !`,true);lock(false);return;} A[i]=val(); draw({[i]:"swap"}); logLine(logEl,`T[${i}] ← ${val()}.`,true); lock(false); }
    async function find(){ if(busy)return;lock(true); const v=val(); logLine(logEl,`Recherche séquentielle de ${v}…`); let f=-1; for(let i=0;i<A.length;i++){draw({[i]:"cmp"});await sleep(330);if(A[i]===v){f=i;break;}} if(f>=0){draw({[f]:"done"});logLine(logEl,`Trouvé en [${f}].`,true);}else{draw();logLine(logEl,`${v} absent.`,true);} lock(false); }
    async function trav(){ if(busy)return;lock(true); let s=0; for(let i=0;i<A.length;i++){draw({[i]:"active"});s+=A[i];await sleep(300);logLine(logEl,`T[${i}]=${A[i]} (somme=${s})`);} draw();logLine(logEl,`Somme = ${s}.`,true); lock(false); }
    $("[data-acc]",host).addEventListener("click",access); $("[data-set]",host).addEventListener("click",setv);
    $("[data-find]",host).addEventListener("click",find); $("[data-trav]",host).addEventListener("click",trav);
    $("[data-rand]",host).addEventListener("click",()=>{if(busy)return;A=Array.from({length:6},()=>Math.floor(Math.random()*90)+1);draw();logLine(logEl,"Nouveau tableau aléatoire.");});
    draw();
  }

  /* ---------------- 5) Visualiseur d'appels (procédures/fonctions) ---------------- */
  function calls(host){
    setHTML(host, wrap({t:"ƒ Visualiseur d'appels", p:"pile + paramètres + retour"},
      `<div class="grid" style="grid-template-columns:1fr 1fr;gap:18px" data-cg>
         <div><div class="lead-chip" style="margin-bottom:8px">📚 Pile d'appels</div><div class="callstack" data-stack></div></div>
         <div><div class="lead-chip" style="margin-bottom:8px">🪵 Trace</div><div class="viz__log" data-log></div></div>
       </div><div data-res style="margin-top:14px;font-weight:800"></div>`,
      `<label>Scénario</label><select data-sc>
         <option value="carre">fonction carre(x) : retour de valeur</option>
         <option value="echange">procédure echange(var a,var b) : effet de bord</option>
         <option value="max">fonction max(a,b) appelée par principal</option>
       </select>
       <button class="btn btn--primary btn--sm" data-run>▶ Lancer</button>`));
    const stackEl=$("[data-stack]",host),logEl=$("[data-log]",host),resEl=$("[data-res]",host),cg=$("[data-cg]",host);
    if(window.matchMedia("(max-width:640px)").matches) cg.style.gridTemplateColumns="1fr";
    let stack=[];
    const draw=()=>setHTML(stackEl, stack.map((f,i)=>`<div class="frame ${i===stack.length-1?'is-top':''} ${f.ret!=null?'is-return':''}"><span>${f.l}</span><small>${f.ret!=null?'→ '+f.ret:'…'}</small></div>`).join("")||'<div class="muted" style="font-size:.85rem">Pile vide.</div>');
    async function run(){
      stack=[];logEl.textContent="";resEl.textContent=""; const sc=$("[data-sc]",host).value;
      stack.push({l:"principal()",ret:null}); draw(); logLine(logEl,"Le programme principal démarre."); await sleep(600);
      if(sc==="carre"){
        logLine(logEl,"principal appelle carre(5) : paramètre x ← 5"); stack.push({l:"carre(x=5)",ret:null}); draw(); await sleep(700);
        logLine(logEl,"carre calcule x*x = 25 et RETOURNE 25",true); stack[1].ret=25; draw(); await sleep(700);
        stack.pop(); draw(); logLine(logEl,"Retour au principal avec la valeur 25"); setHTML(resEl,'<span class="grad-text">r ← carre(5) = 25</span>');
      } else if(sc==="echange"){
        logLine(logEl,"a=1, b=2. principal appelle echange(var a, var b) : passage par ADRESSE"); stack.push({l:"echange(a,b)",ret:null}); draw(); await sleep(700);
        logLine(logEl,"echange permute via les adresses : a↔b",true); await sleep(600);
        stack[1].ret="(rien)"; draw(); await sleep(500); stack.pop(); draw();
        logLine(logEl,"Procédure : pas de valeur retournée, mais a=2 et b=1 chez l'appelant",true); setHTML(resEl,'<span class="grad-text">a = 2, b = 1 (effet de bord)</span>');
      } else {
        logLine(logEl,"principal appelle max(8, 3)"); stack.push({l:"max(a=8,b=3)",ret:null}); draw(); await sleep(700);
        logLine(logEl,"8 > 3 → RETOURNE 8",true); stack[1].ret=8; draw(); await sleep(700); stack.pop(); draw();
        setHTML(resEl,'<span class="grad-text">m ← max(8,3) = 8</span>');
      }
    }
    $("[data-run]",host).addEventListener("click",run); draw();
  }

  /* ---------------- 6) Visualiseur d'enregistrement ---------------- */
  function record(host){
    setHTML(host, wrap({t:"▤ Enregistrement (structure)", p:"champs hétérogènes"},
      `<div class="memrow" data-rec style="min-height:60px"></div>
       <div class="note note--intui" style="margin-top:14px"><span class="note__ic">🧩</span><div class="note__body" data-note>Un enregistrement regroupe des champs de types différents sous un seul nom.</div></div>`,
      `<label>Code</label><input type="number" data-c value="101" style="width:84px">
       <label>Prix</label><input type="number" data-p value="25" style="width:84px">
       <button class="btn btn--primary btn--sm" data-run>▶ Remplir le produit</button>`));
    const recEl=$("[data-rec]",host),noteEl=$("[data-note]",host);
    function draw(code,nom,prix){
      setHTML(recEl,
        `<div class="membox is-active"><div class="addr">champ : entier</div><div class="name">code</div><div class="val">${code}</div></div>
         <div class="membox is-active"><div class="addr">champ : chaine</div><div class="name">nom</div><div class="val" style="font-size:.95rem">"${nom}"</div></div>
         <div class="membox is-active"><div class="addr">champ : reel</div><div class="name">prix</div><div class="val">${prix}</div></div>`);
    }
    $("[data-run]",host).addEventListener("click",()=>{ const c=parseInt($("[data-c]",host).value,10)||0,p=parseInt($("[data-p]",host).value,10)||0; draw(c,"Clavier",p); setHTML(noteEl,`<strong>P : Produit</strong>On accède aux champs avec le point : <code>P.code = ${c}</code>, <code>P.prix = ${p}</code>.`); });
    draw(101,"Clavier",25);
  }

  /* ---------------- 7) Stack (pile) ---------------- */
  function stackViz(host){
    setHTML(host, wrap({t:"▣ Stack Visualizer (LIFO)", p:"empiler / dépiler"},
      `<div style="display:flex;gap:30px;flex-wrap:wrap;align-items:flex-end">
        <div><div class="lead-chip" style="margin-bottom:8px">Pile (sommet en haut)</div>
          <div data-stk style="display:flex;flex-direction:column-reverse;gap:6px;min-height:170px;justify-content:flex-end;border:2px dashed var(--border-strong);border-top:none;border-radius:0 0 12px 12px;padding:10px;min-width:120px"></div></div>
        <div class="viz__log" data-log style="flex:1;min-width:200px"></div>
      </div>`,
      `<label>Valeur</label><input type="number" data-val value="7" style="width:74px">
       <button class="btn btn--primary btn--sm" data-push>⬆ Push (empiler)</button>
       <button class="btn btn--soft btn--sm" data-pop>⬇ Pop (dépiler)</button>
       <button class="btn btn--ghost btn--sm" data-clear>🗑</button>`));
    const stkEl=$("[data-stk]",host),logEl=$("[data-log]",host); let S=[5,3];
    const draw=(hot)=>setHTML(stkEl, S.map((v,i)=>`<div class="cell ${i===S.length-1?'is-active':''} ${hot===i?'is-swap':''}" style="min-width:90px"><div class="cell__v">${v}</div><div class="cell__i">${i===S.length-1?'← sommet':''}</div></div>`).join("")||'<span class="muted">pile vide</span>');
    $("[data-push]",host).addEventListener("click",()=>{const v=parseInt($("[data-val]",host).value,10)||0;S.push(v);draw(S.length-1);logLine(logEl,`Push(${v}) : ajouté au sommet. Taille=${S.length}.`,true);});
    $("[data-pop]",host).addEventListener("click",()=>{if(!S.length){logLine(logEl,"Pop impossible : pile vide.",true);return;}const v=S.pop();draw();logLine(logEl,`Pop() : retire le dernier entré = ${v} (LIFO).`,true);});
    $("[data-clear]",host).addEventListener("click",()=>{S=[];draw();logLine(logEl,"Pile vidée.");});
    draw();
  }

  /* ---------------- 8) Queue (file) ---------------- */
  function queueViz(host){
    setHTML(host, wrap({t:"▤ Queue Visualizer (FIFO)", p:"enfiler / défiler"},
      `<div class="lead-chip" style="margin-bottom:8px">tête → … → queue</div>
       <div class="cells" data-q style="min-height:60px"></div>
       <div class="viz__log" data-log style="margin-top:14px"></div>`,
      `<label>Valeur</label><input type="number" data-val value="7" style="width:74px">
       <button class="btn btn--primary btn--sm" data-enq>➡ Enfiler</button>
       <button class="btn btn--soft btn--sm" data-deq>⬅ Défiler</button>
       <button class="btn btn--ghost btn--sm" data-clear>🗑</button>`));
    const qEl=$("[data-q]",host),logEl=$("[data-log]",host); let Q=[5,3,9];
    const draw=(hot)=>setHTML(qEl, Q.map((v,i)=>`<div class="cell ${i===0?'is-active':''} ${hot===i?'is-swap':''}"><div class="cell__v">${v}</div><div class="cell__i">${i===0?'tête':(i===Q.length-1?'queue':'')}</div></div>`).join("")||'<span class="muted">file vide</span>');
    $("[data-enq]",host).addEventListener("click",()=>{const v=parseInt($("[data-val]",host).value,10)||0;Q.push(v);draw(Q.length-1);logLine(logEl,`Enfiler(${v}) : ajouté en queue. Taille=${Q.length}.`,true);});
    $("[data-deq]",host).addEventListener("click",()=>{if(!Q.length){logLine(logEl,"Défiler impossible : file vide.",true);return;}const v=Q.shift();draw();logLine(logEl,`Défiler() : retire le premier entré = ${v} (FIFO).`,true);});
    $("[data-clear]",host).addEventListener("click",()=>{Q=[];draw();logLine(logEl,"File vidée.");});
    draw();
  }

  /* ---------------- 9) Recherche (séquentielle / dichotomique) ---------------- */
  function search(host){
    setHTML(host, wrap({t:"⌕ Recherche", p:"séquentielle vs dichotomique"},
      `<div class="cells" data-arr></div><div class="viz__log" data-log style="margin-top:14px"></div>`,
      `<label>Méthode</label><select data-m><option value="seq">Séquentielle</option><option value="dich">Dichotomique (trié)</option></select>
       <label>Cible</label><input type="number" data-t value="23" style="width:74px">
       <button class="btn btn--primary btn--sm" data-run>▶ Chercher</button>
       <button class="btn btn--ghost btn--sm" data-rand>🎲</button>`));
    const arrEl=$("[data-arr]",host),logEl=$("[data-log]",host); let A=[4,8,15,16,23,42,55,71]; let busy=false;
    const draw=(st={})=>setHTML(arrEl, A.map((v,i)=>`<div class="cell ${st[i]?'is-'+st[i]:''}"><div class="cell__v">${v}</div><div class="cell__i">[${i}]</div></div>`).join(""));
    function lock(b){busy=b;host.querySelectorAll(".viz__controls button,[data-m]").forEach(x=>x.disabled=b);}
    async function run(){
      if(busy)return;lock(true); const t=parseInt($("[data-t]",host).value,10)||0, m=$("[data-m]",host).value; logEl.textContent="";
      if(m==="seq"){ logLine(logEl,`Séquentielle : on teste chaque case (O(n)).`); let f=-1; for(let i=0;i<A.length;i++){draw({[i]:"cmp"});await sleep(360);logLine(logEl,`T[${i}]=${A[i]} == ${t} ?`);if(A[i]===t){f=i;break;}} if(f>=0){draw({[f]:"done"});logLine(logEl,`✅ Trouvé en [${f}] après ${f+1} test(s).`,true);}else{draw();logLine(logEl,`❌ Absent (${A.length} tests).`,true);} }
      else { A=[...A].sort((a,b)=>a-b); draw(); logLine(logEl,`Dichotomique : tableau TRIÉ, on coupe en deux (O(log n)).`); let g=0,d=A.length-1,f=-1,steps=0;
        while(g<=d){steps++;const mid=Math.floor((g+d)/2);const st={};for(let i=g;i<=d;i++)st[i]="active";st[mid]="cmp";draw(st);await sleep(650);logLine(logEl,`milieu [${mid}]=${A[mid]} vs ${t}`);
          if(A[mid]===t){f=mid;break;} else if(A[mid]<t){logLine(logEl,`${A[mid]} < ${t} → on garde la moitié DROITE`);g=mid+1;} else {logLine(logEl,`${A[mid]} > ${t} → on garde la moitié GAUCHE`);d=mid-1;}}
        if(f>=0){draw({[f]:"done"});logLine(logEl,`✅ Trouvé en [${f}] en seulement ${steps} étape(s) !`,true);}else{draw();logLine(logEl,`❌ Absent (${steps} étapes).`,true);} }
      lock(false);
    }
    $("[data-run]",host).addEventListener("click",run);
    $("[data-rand]",host).addEventListener("click",()=>{if(busy)return;A=Array.from({length:8},()=>Math.floor(Math.random()*90)+1).sort((a,b)=>a-b);draw();logLine(logEl,"Nouveau tableau (trié).");});
    draw();
  }

  /* ---------------- 10) Tri (bulle / sélection / insertion) ---------------- */
  function sort(host){
    setHTML(host, wrap({t:"⇅ Tri animé", p:"comparaisons & échanges"},
      `<div class="cells" data-arr></div><div class="viz__log" data-log style="margin-top:14px"></div>`,
      `<label>Méthode</label><select data-m><option value="bulle">À bulles</option><option value="selection">Sélection</option><option value="insertion">Insertion</option></select>
       <label>Vitesse</label><select data-sp><option value="500">Lente</option><option value="280" selected>Normale</option><option value="120">Rapide</option></select>
       <button class="btn btn--primary btn--sm" data-run>▶ Trier</button>
       <button class="btn btn--ghost btn--sm" data-rand>🎲</button>`));
    const arrEl=$("[data-arr]",host),logEl=$("[data-log]",host); let A=[5,2,8,1,9,3]; let busy=false;
    const sp=()=>parseInt($("[data-sp]",host).value,10);
    const draw=(st={})=>setHTML(arrEl, A.map((v,i)=>`<div class="cell ${st[i]?'is-'+st[i]:''}"><div class="cell__v">${v}</div><div class="cell__i">[${i}]</div></div>`).join(""));
    function lock(b){busy=b;host.querySelectorAll(".viz__controls button,[data-m],[data-sp]").forEach(x=>x.disabled=b);}
    const swap=(i,j)=>{[A[i],A[j]]=[A[j],A[i]];};
    async function bulle(){ for(let i=0;i<A.length-1;i++){for(let j=0;j<A.length-1-i;j++){draw({[j]:"cmp",[j+1]:"cmp"});await sleep(sp());if(A[j]>A[j+1]){draw({[j]:"swap",[j+1]:"swap"});await sleep(sp());swap(j,j+1);logLine(logEl,`Échange en positions ${j} et ${j+1}`);draw();}}const st={};for(let k=A.length-1-i;k<A.length;k++)st[k]="done";draw(st);} }
    async function selection(){ for(let i=0;i<A.length-1;i++){let m=i;for(let j=i+1;j<A.length;j++){draw({[m]:"active",[j]:"cmp"});await sleep(sp());if(A[j]<A[m])m=j;}if(m!==i){draw({[i]:"swap",[m]:"swap"});await sleep(sp());swap(i,m);logLine(logEl,`Min trouvé, échange en position ${i}`);}const st={};for(let k=0;k<=i;k++)st[k]="done";draw(st);} }
    async function insertion(){ for(let i=1;i<A.length;i++){let key=A[i],j=i-1;draw({[i]:"cmp"});await sleep(sp());while(j>=0&&A[j]>key){A[j+1]=A[j];draw({[j]:"swap",[j+1]:"active"});await sleep(sp());j--;}A[j+1]=key;logLine(logEl,`Insère ${key} à sa place`);draw();} }
    async function run(){ if(busy)return;lock(true);logEl.textContent=""; const m=$("[data-m]",host).value; logLine(logEl,`Tri par ${m}…`); if(m==="bulle")await bulle();else if(m==="selection")await selection();else await insertion(); const st={};A.forEach((_,i)=>st[i]="done");draw(st);logLine(logEl,`✅ Trié : [${A.join(", ")}]`,true); lock(false); }
    $("[data-run]",host).addEventListener("click",run);
    $("[data-rand]",host).addEventListener("click",()=>{if(busy)return;A=Array.from({length:6},()=>Math.floor(Math.random()*20)+1);draw();logLine(logEl,"Nouveau tableau.");});
    draw();
  }

  /* ---------------- 11) Complexité ---------------- */
  function complexity(host){
    setHTML(host, wrap({t:"𝒪 Complexité", p:"nombre d'opérations selon n"},
      `<div data-bars style="display:flex;flex-direction:column;gap:10px"></div>
       <p class="muted" style="margin-top:12px;font-size:.85rem">Nombre approximatif d'opérations pour une taille n. Regarde comme O(n²) explose vs O(log n) qui reste minuscule.</p>`,
      `<label>n =</label><input type="range" data-n min="1" max="64" value="16" style="width:160px"><b data-nv>16</b>`));
    const barsEl=$("[data-bars]",host),nvEl=$("[data-nv]",host);
    const FN=[{k:"O(1)",f:_=>1,c:"#10b981"},{k:"O(log n)",f:n=>Math.ceil(Math.log2(n)),c:"#06b6d4"},{k:"O(n)",f:n=>n,c:"#6366f1"},{k:"O(n log n)",f:n=>Math.ceil(n*Math.log2(n)),c:"#f59e0b"},{k:"O(n²)",f:n=>n*n,c:"#ef4444"}];
    function draw(n){ const max=FN[FN.length-1].f(n)||1; setHTML(barsEl, FN.map(o=>{const v=o.f(n);const w=Math.max(2,Math.round(v/max*100));return `<div style="display:flex;align-items:center;gap:10px"><span style="width:80px;font-family:var(--font-mono);font-weight:700;font-size:.82rem">${o.k}</span><div style="flex:1;background:var(--surface-3);border-radius:6px;overflow:hidden"><div style="width:${w}%;background:${o.c};height:22px;border-radius:6px;transition:width .3s"></div></div><span style="width:70px;text-align:right;font-family:var(--font-mono);font-weight:700">${v} ops</span></div>`;}).join("")); }
    const inp=$("[data-n]",host); inp.addEventListener("input",()=>{nvEl.textContent=inp.value;draw(+inp.value);}); draw(16);
  }

  /* ---------------- Bootstrap ---------------- */
  const MAP=[["[data-viz-execution]",execution],["[data-viz-conditions]",conditions],["[data-viz-loops]",loops],["[data-viz-array]",array],["[data-viz-calls]",calls],["[data-viz-record]",record],["[data-viz-stack]",stackViz],["[data-viz-queue]",queueViz],["[data-viz-search]",search],["[data-viz-sort]",sort],["[data-viz-complexity]",complexity]];
  document.addEventListener("DOMContentLoaded",()=>MAP.forEach(([sel,fn])=>document.querySelectorAll(sel).forEach(fn)));
})();
