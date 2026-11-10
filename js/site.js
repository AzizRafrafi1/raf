// Portfolio site. The page behaves like an edit: a timecode and a playhead follow the scroll, sections land with hard
// reveals, loops only run while they are on screen, and full videos load only when asked for.
(() => {
  const S = window.SITE, P = window.PROJECTS;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = () => matchMedia("(min-width: 900px)").matches;
  const url = (id, file) => `${S.media}/${id}/${file}`;
  const byId = (id) => P.find((p) => p.id === id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const mmss = (d) => `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, "0")}`;

  // ---------- owner details ----------
  $$("[data-site]").forEach((el) => { el.textContent = S[el.dataset.site]; });
  const wa = (text) => (S.whatsapp ? `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}` : "#contact");
  const ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6.5 9 7 9-7"/></svg>',
  };
  const CONTACTS = [
    S.whatsapp && { id: "whatsapp", name: "WhatsApp", value: S.phone, href: wa("Salut ! J'ai vu ton site."), hot: true },
    S.instagram && { id: "instagram", name: "Instagram", value: `@${S.instagram}`, href: `https://www.instagram.com/${S.instagram}/` },
    S.whatsapp && { id: "phone", name: "Appeler", value: S.phone, href: `tel:+${S.whatsapp}` },
    S.email && { id: "mail", name: "Mail", value: S.email, href: `mailto:${S.email}` },
  ].filter(Boolean);
  const leaves = (href) => (href.startsWith("http") ? ' target="_blank" rel="noopener"' : "");
  $("#topLinks").innerHTML = CONTACTS.map((c) => `<a class="ico${c.hot ? " ico--hot" : ""}" href="${esc(c.href)}"${leaves(c.href)} aria-label="${c.name}" title="${c.name}">${ICONS[c.id]}</a>`).join("");
  $("#endLinks").innerHTML = CONTACTS.map((c) => `<a class="reach${c.hot ? " reach--hot" : ""}" href="${esc(c.href)}"${leaves(c.href)}><span class="reach__ico">${ICONS[c.id]}</span><span class="reach__txt"><b>${c.name}</b><em>${esc(c.value)}</em></span></a>`).join("");

  // ---------- media helper: play only while visible ----------
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) { if (!v.src && v.dataset.src) v.src = v.dataset.src; v.play?.().catch(() => {}); } else v.pause?.();
    }
  }, { threshold: 0.2 });
  const loop = (id, cls = "") => `<video class="${cls}" data-src="${url(id, "loop.mp4")}" poster="${url(id, "poster.jpg")}" muted loop playsinline preload="none"></video>`;

  // ---------- hero wall ----------
  const WALL = [
    ["fadi-mhorse", "jamal-epaules", "tarek-omra-offre", "amira-thermometre"],
    ["chahir-produit-gagnant", "dhia-recovery-pulse", "vallena-lookbook", "muscle-nutrition-shilajit"],
    ["khalil-dos", "samir-leg-curls", "ecom-podcast-1", "sabrutality-isolation"],
    ["nader-melon", "assil-fashion", "fadi-iphone-duo", "chahir-produit-gagnant"],
  ];
  const wall = $("#wall");
  wall.innerHTML = WALL.map((col) => `<div class="wall__col">${col.map((id) => `<div class="wall__tile">${loop(id)}</div>`).join("")}</div>`).join("");
  $$("video", wall).forEach((v) => seen.observe(v));

  // ---------- names ----------
  const names = [...new Set(P.map((p) => p.person.toUpperCase()))];
  const namesEl = $("#names");
  namesEl.innerHTML = [...names, ...names].map((n) => `<span>${esc(n)}</span>`).join("");

  // ---------- showreel ----------
  const reel = $("#reelVideo");
  $("[data-videos]").dataset.count = P.length;
  reel.poster = url("showreel", "poster.jpg");
  reel.dataset.src = url("showreel", "showreel.mp4");
  seen.observe(reel);
  const sound = $("#reelSound");
  const toggleSound = () => {
    reel.muted = !reel.muted;
    sound.setAttribute("aria-pressed", String(!reel.muted));
    sound.textContent = reel.muted ? "Son : off" : "Son : on";
    if (!reel.muted) { reel.currentTime = 0; reel.play().catch(() => {}); }
  };
  $("#reelPhone").addEventListener("click", toggleSound);

  // ---------- case text ----------
  const pills = (p) => `<div class="pills"><span class="pills__hot">${esc(p.style)}</span><span>${esc(p.category)}</span><span>${esc(p.language)}</span></div>`;
  const blocks = (p) => `
    ${p.challenge ? `<div class="blk"><h4>Le défi</h4><p>${esc(p.challenge)}</p></div>` : ""}
    ${p.work ? `<div class="blk"><h4>Le montage</h4><ul>${p.work.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>` : ""}
    ${p.deliverable ? `<div class="blk"><h4>Le résultat</h4><p>${esc(p.deliverable)}</p></div>` : ""}`;
  const who = (p) => `<p class="case__who">${esc(p.person)}${p.handle ? ` · ${esc(p.handle)}` : ""}</p>`;

  // ---------- before / after ----------
  const CMP = ["amira-thermometre", "jamal-epaules", "fadi-mhorse", "chahir-produit-gagnant", "samir-leg-curls"];
  const before = $("#cmpBefore"), after = $("#cmpAfter"), device = $("#cmpDevice"), range = $("#cmpRange");
  const setX = (v) => { device.style.setProperty("--x", `${v}%`); };
  let cmpOn = false;
  const loadCmp = (id) => {
    const p = byId(id);
    before.src = url(id, "before.mp4"); after.src = url(id, "after.mp4");
    before.poster = after.poster = url(id, "poster.jpg");
    $("#cmpText").innerHTML = `<h3 class="case__title">${esc(p.title)}</h3>${who(p)}${pills(p)}${blocks(p)}`;
    $$("#cmpTabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.id === id)));
    if (cmpOn) { before.play().catch(() => {}); after.play().catch(() => {}); }
  };
  $("#cmpTabs").innerHTML = CMP.map((id) => `<button type="button" role="tab" data-id="${id}" aria-selected="false">${esc(byId(id).person)}</button>`).join("");
  $("#cmpTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) loadCmp(b.dataset.id); });
  range.addEventListener("input", () => setX(range.value));
  const drag = (e) => {
    const b = device.getBoundingClientRect(), v = Math.max(0, Math.min(100, ((e.clientX - b.left) / b.width) * 100));
    range.value = v; setX(v);
  };
  device.addEventListener("pointerdown", (e) => { device.setPointerCapture(e.pointerId); if (e.pointerType === "mouse") drag(e); });
  device.addEventListener("pointermove", (e) => { if (device.hasPointerCapture(e.pointerId)) drag(e); });
  setInterval(() => { if (cmpOn && Math.abs(before.currentTime - after.currentTime) > 0.3 && after.currentTime < before.duration) before.currentTime = after.currentTime; }, 1000);
  after.addEventListener("ended", () => { before.currentTime = 0; });
  new IntersectionObserver(([e]) => {
    cmpOn = e.isIntersecting;
    if (cmpOn) { if (!after.src) loadCmp(CMP[0]); before.play().catch(() => {}); after.play().catch(() => {}); } else { before.pause(); after.pause(); }
  }, { threshold: 0.25 }).observe(device);
  $("#cmpText").innerHTML = `<h3 class="case__title">${esc(byId(CMP[0]).title)}</h3>${who(byId(CMP[0]))}${pills(byId(CMP[0]))}${blocks(byId(CMP[0]))}`;
  $$("#cmpTabs button")[0].setAttribute("aria-selected", "true");

  // ---------- styles ----------
  const STYLES = [
    { name: "CRYSTAL GLASS", id: "jamal-epaules", bg: "#E9EDF7", fg: "#14161F", ac: "#3B5BFF", txt: "Un univers clair en verre, avec des cartes flottantes et des sous-titres mot à mot. Le visage reste au centre.", who: "Coachs, experts, e-commerce" },
    { name: "VIOLET EDITORIAL", id: "chahir-produit-gagnant", bg: "#761CA9", fg: "#FFFFFF", ac: "#F6F1E4", txt: "L'esprit d'un magazine en mouvement, avec du serif italique, des mots géants et des objets qui entrent dans le cadre.", who: "Podcasts, business, personal brand" },
    { name: "SLATE TECH", id: "fadi-mhorse", bg: "#1B2126", fg: "#F2F6F7", ac: "#22D3B6", txt: "Un studio sombre et un seul accent de couleur. Chaque caractéristique du produit se voit à l'écran.", who: "Téléphones, gadgets, boutiques tech" },
    { name: "RECOVERY PULSE", id: "dhia-recovery-pulse", bg: "#16082B", fg: "#FFFFFF", ac: "#FF3DAE", txt: "Duotone néon, chiffres géants et accroches fortes pour les contenus de sport.", who: "Sport, salles, énergie" },
    { name: "STUDIO LOOKBOOK", id: "vallena-lookbook", bg: "#D9D6D0", fg: "#121212", ac: "#121212", txt: "Le vêtement porté, le décor qui change, et la marque qui arrive à la fin.", who: "Mode et marques de vêtements" },
    { name: "PUB SPONSORISÉE", id: "tarek-omra-offre", bg: "#0E2A26", fg: "#FFFFFF", ac: "#E8C15A", txt: "La personne en grand, l'offre et les prix à l'écran. La vidéo mène droit à la réservation.", who: "Agences, services, boutiques" },
    { name: "PODCAST SHORTS", id: "ecom-podcast-1", bg: "#14100C", fg: "#FFF7EC", ac: "#FFB21F", txt: "Les meilleurs moments d'un long épisode, cadrés sur la personne qui parle.", who: "Podcasts et interviews" },
  ];
  $("#stylesTrack").innerHTML = STYLES.map((s, i) => `
    <article class="style" style="--bg:${s.bg};--fg:${s.fg};--ac:${s.ac}">
      <div>
        <p class="style__n">STYLE ${String(i + 1).padStart(2, "0")} / ${String(STYLES.length).padStart(2, "0")}${i < STYLES.length - 1 ? '<span class="style__swipe">Glisse ›</span>' : ""}</p>
        <h3 class="style__name">${s.name}</h3>
        <p class="style__txt">${s.txt}</p>
        <p class="style__for">Pour : ${s.who}</p>
      </div>
      <div class="phone style__phone">${loop(s.id)}</div>
    </article>`).join("");
  $$("#stylesTrack video").forEach((v) => seen.observe(v));

  const setPanelWidth = () => document.documentElement.style.setProperty("--pw", `${document.documentElement.clientWidth}px`);
  setPanelWidth();
  addEventListener("resize", setPanelWidth);

  // ---------- portfolio ----------
  const grid = $("#grid"), chips = $("#chips"), more = $("#more");
  const main = P.filter((p) => !p.group || p.id.endsWith("-1"));
  const order = [...main.filter((p) => p.featured), ...main.filter((p) => !p.featured)];
  const groupOf = (p) => (p.group ? P.filter((x) => x.group === p.group) : []);
  grid.innerHTML = order.map((p) => {
    const g = groupOf(p);
    return `<article class="card" data-cat="${esc(p.category)}">
      <button class="card__media" type="button" data-open="${p.id}" data-cursor="VOIR" aria-label="Voir ${esc(p.title)}">
        <img src="${url(p.id, "poster.jpg")}" alt="" loading="lazy" width="720" height="1280">
        <video data-loop="${url(p.id, "loop.mp4")}" muted loop playsinline preload="none"></video>
        <span class="card__play">▶ VOIR${p.hasBefore ? " + AVANT" : ""}</span>
        <span class="card__dur">${mmss(p.dur)}</span>
      </button>
      <div class="card__body">
        <h3 class="case__title">${esc(g.length ? "Podcast en 6 shorts" : p.title)}</h3>
        ${who(p)}${pills(p)}${blocks(p)}
        ${g.length ? `<div class="card__more" aria-label="Les 6 shorts">${g.map((x) => `<button type="button" data-open="${x.id}" aria-label="${esc(x.title)}"><img src="${url(x.id, "poster.jpg")}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
      </div>
    </article>`;
  }).join("");

  const cats = ["Tout", ...new Set(order.map((p) => p.category))];
  chips.innerHTML = cats.map((c, i) => `<button type="button" aria-pressed="${i === 0}">${esc(c)}</button>`).join("");
  const LIMIT = 6;
  let expanded = false, current = "Tout";
  const applyFilter = () => {
    const cards = $$(".card", grid);
    let shown = 0, total = 0;
    for (const c of cards) {
      const match = current === "Tout" || c.dataset.cat === current;
      if (match) total++;
      const visible = match && (expanded || current !== "Tout" || shown < LIMIT);
      c.hidden = !visible;
      if (visible) shown++;
    }
    more.hidden = expanded || current !== "Tout" || total <= LIMIT;
    window.ScrollTrigger?.refresh();
  };
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    current = b.textContent;
    $$("button", chips).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    applyFilter();
    if (!reduced && window.gsap) gsap.from($$(".card:not([hidden])", grid), { y: 26, opacity: 0, duration: 0.4, stagger: 0.04, ease: "power3.out" });
  });
  more.addEventListener("click", () => { expanded = true; applyFilter(); });
  applyFilter();

  // loops on the cards: on hover with a mouse, while most of the card is on screen on a phone
  const live = (card, on) => {
    const v = $("video", card);
    if (on) { if (!v.src) v.src = v.dataset.loop; card.classList.add("is-live"); v.play().catch(() => {}); } else { card.classList.remove("is-live"); v.pause(); }
  };
  if (matchMedia("(hover: hover)").matches) {
    grid.addEventListener("pointerover", (e) => { const c = e.target.closest(".card__media"); if (c) live(c.closest(".card"), true); });
    grid.addEventListener("pointerout", (e) => { const c = e.target.closest(".card__media"); if (c && !c.contains(e.relatedTarget)) live(c.closest(".card"), false); });
  } else {
    const io = new IntersectionObserver((es) => es.forEach((e) => live(e.target.closest(".card"), e.isIntersecting)), { threshold: 0.75 });
    $$(".card__media", grid).forEach((m) => io.observe(m));
  }

  // ---------- project dialog ----------
  const box = $("#box"), boxVideo = $("#boxVideo"), boxSwitch = $("#boxSwitch");
  let boxId = null;
  const setVersion = (v) => {
    const t = byId(boxId).sync ? boxVideo.currentTime : 0;
    boxVideo.src = url(boxId, `${v}.mp4`);
    boxVideo.poster = url(boxId, "poster.jpg");
    boxVideo.addEventListener("loadedmetadata", () => { if (t) boxVideo.currentTime = Math.min(t, boxVideo.duration - 0.1); }, { once: true });
    boxVideo.play().catch(() => {}); // inside the tap, so a phone lets the sound play
    $$("button", boxSwitch).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
  };
  const open = (id) => {
    const p = byId(id), lead = p.group ? byId(`${p.group}-1`) : p;
    boxId = id;
    boxSwitch.hidden = !p.hasBefore;
    boxVideo.currentTime = 0;
    setVersion("after");
    $("#boxText").innerHTML = `<h3 class="case__title">${esc(p.title)}</h3>${who(p)}${pills(p)}${blocks(lead)}
      <a class="btn btn--hot" style="margin-top:20px" href="${wa(`Salut ! J'ai vu « ${p.title} » et je veux la même chose.`)}" target="_blank" rel="noopener">Je veux ça pour ma page</a>`;
    box.showModal();
    box.scrollTop = 0;
    box.focus(); // otherwise a phone draws the focus ring on the close button
    lenis?.stop();
  };
  const close = () => { boxVideo.pause(); boxVideo.removeAttribute("src"); boxVideo.load(); lenis?.start(); };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) open(b.dataset.open); });
  boxSwitch.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setVersion(b.dataset.v); });
  $("#boxClose").addEventListener("click", () => box.close());
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
  box.addEventListener("close", close);

  // ---------- tools ----------
  const tools = S.tools || [];
  $("#toolsBlock").hidden = !tools.length;
  $("#tools").innerHTML = tools.map((t) => `<li class="tool" style="--tb:${t.bg};--tf:${t.fg}"><span class="tool__ico" aria-hidden="true">${esc(t.short)}</span><span class="tool__txt"><b>${esc(t.name)}</b><em>${esc(t.role)}</em></span></li>`).join("");

  // ---------- offers ----------
  const OFFERS = [
    { id: "pub", for: "E-commerce", name: "PUB QUI VEND", top: true, items: ["1 pub produit jusqu'à 60 s", "3 débuts différents à tester", "Bénéfices montrés comme des preuves", "Appel à la commande clair"] },
    { id: "reel-test", for: "Pour essayer", name: "REEL TEST", items: ["1 reel jusqu'à 60 s", "Voix nettoyée et sous-titres", "Motion design, sons et musique", "Carte de fin avec ta page"] },
    { id: "presence", for: "Coachs et boutiques", name: "PRÉSENCE", items: ["4 reels par mois", "Un style fixe pour ta marque", "Tes vidéos reconnaissables dans le feed"] },
    { id: "croissance", for: "Marques actives", name: "CROISSANCE", items: ["8 reels par mois", "Hooks proposés pour chaque vidéo", "Captions et 5 hashtags choisis"] },
    { id: "podcast", for: "Podcasts", name: "PODCAST EN 6 SHORTS", items: ["1 épisode complet", "Les 6 meilleurs moments", "Cadrage vertical sur la personne qui parle"] },
    { id: "signature", for: "Marques", name: "STYLE SIGNATURE", items: ["Un style créé pour ta marque", "Couleurs, typo, sons et fin de vidéo", "Réutilisable sur toutes tes vidéos"] },
  ];
  $("#offers").innerHTML = OFFERS.map((o) => `
    <article class="offer${o.top ? " offer--top" : ""}">
      <p class="offer__for">${esc(o.for)}</p>
      <h3>${esc(o.name)}</h3>
      <ul>${o.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      <div class="offer__foot">
        <p class="offer__price">${esc(S.prices[o.id] || "Prix sur demande")}</p>
        <a class="btn" data-wa="Salut ! Je suis intéressé par l'offre ${esc(o.name)}." href="#contact">Choisir</a>
      </div>
    </article>`).join("");

  // ---------- request builder ----------
  const CHOICES = {
    type: ["Reels", "Pub produit", "Podcast en shorts", "Style sur mesure"],
    count: ["1 vidéo", "4 par mois", "8 par mois", "Je ne sais pas encore"],
    sector: ["Coaching / gym", "E-commerce", "Téléphonie", "Mode", "Food", "Voyage", "Autre"],
  };
  $$(".opts").forEach((box2) => {
    const n = box2.dataset.name;
    box2.innerHTML = CHOICES[n].map((c, i) => `<label><input type="radio" name="${n}" value="${esc(c)}"${i === 0 ? " checked" : ""}><span>${esc(c)}</span></label>`).join("");
  });
  const form = $("#builder"), msg = $("#builderMsg"), send = $("#builderSend");
  const buildMsg = () => {
    const f = new FormData(form);
    const text = `Salut ! Je cherche : ${f.get("type")} (${f.get("count").toLowerCase()}). Mon secteur : ${f.get("sector").toLowerCase()}.`;
    msg.textContent = text;
    send.href = wa(text);
    send.textContent = S.whatsapp ? "Envoyer sur WhatsApp" : "Copier le message";
    send.dataset.text = text;
  };
  form.addEventListener("change", buildMsg);
  send.addEventListener("click", (e) => {
    if (S.whatsapp) return;
    e.preventDefault();
    navigator.clipboard?.writeText(send.dataset.text).then(() => { send.textContent = "Copié"; }).catch(() => {});
  });
  buildMsg();
  $$("[data-wa]").forEach((a) => { if (S.whatsapp) { a.href = wa(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; } });

  // ---------- timecode + playhead ----------
  const tcEl = $("#tc span"), head = $("#railHead"), progress = $("#progress");
  const TOTAL_FRAMES = 3 * 60 * 30;
  const p2 = (n) => String(Math.floor(n)).padStart(2, "0");
  const tracks = $$("[data-track]");
  const ticks = $("#railTicks");
  const layoutRail = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    ticks.innerHTML = tracks.map((t) => `<span data-t="${esc(t.dataset.track)}" style="top:${Math.min(100, (t.offsetTop / max) * 100)}%"><em>${esc(t.dataset.track)}</em></span>`).join("");
  };
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    const f = p * TOTAL_FRAMES;
    tcEl.textContent = `00:${p2(f / 1800)}:${p2((f / 30) % 60)}:${p2(f % 30)}`;
    head.style.top = `${p * 100}%`;
    progress.style.transform = `scaleX(${p})`;
    let cur = null;
    for (const t of tracks) if (t.offsetTop - innerHeight / 2 <= scrollY) cur = t.dataset.track;
    $$("span", ticks).forEach((s) => s.classList.toggle("on", s.dataset.t === cur));
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { layoutRail(); onScroll(); });

  // ---------- cursor ----------
  const cur = $("#cursor"), curText = $("span", cur);
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    addEventListener("pointermove", (e) => {
      cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const t = e.target.closest?.("[data-cursor]");
      cur.classList.toggle("is-on", !!t);
      if (t) curText.textContent = t.dataset.cursor;
    }, { passive: true });
  }

  // ---------- motion ----------
  let lenis = null;
  const counters = () => $$("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count), suffix = el.dataset.suffix ?? "";
    el.textContent = `${end}${suffix}`;
  });

  const start = () => {
    document.body.classList.remove("is-loading");
    layoutRail(); onScroll();
    if (reduced || !window.gsap) { counters(); return; }
    gsap.registerPlugin(ScrollTrigger);

    lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -56 }); }
    }));

    // hero lines land one by one, like the showreel
    gsap.from(".hero__title .ln > span", { yPercent: 135, duration: 0.7, stagger: 0.11, ease: "power4.out" });
    gsap.from(".hero__lead, .hero__cta, .hero .tag", { opacity: 0, y: 14, duration: 0.5, delay: 0.5, stagger: 0.06 });

    // the wall drifts in opposite directions and answers the scroll
    $$(".wall__col").forEach((col, i) => {
      const dir = i % 2 ? 1 : -1;
      gsap.fromTo(col, { yPercent: dir > 0 ? -14 : 4 }, { yPercent: dir > 0 ? 4 : -14, duration: 26 + i * 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    });

    // names: a constant crawl that speeds up with the scroll
    const half = namesEl.scrollWidth / 2;
    let x = 0, boost = 0;
    lenis.on("scroll", ({ velocity }) => { boost = Math.min(14, Math.abs(velocity) * 0.5); });
    gsap.ticker.add(() => {
      x -= 0.7 + boost; boost *= 0.92;
      if (x <= -half) x += half;
      namesEl.style.transform = `translate3d(${x}px,0,0)`;
    });

    // section headers: mask up on entry
    $$(".head .h2, .sample__title, .builder .h3").forEach((h) => {
      gsap.from(h, { y: 60, opacity: 0, duration: 0.7, ease: "power4.out", scrollTrigger: { trigger: h, start: "top 88%" } });
    });

    // counters run once
    ScrollTrigger.create({ trigger: ".stats", start: "top 85%", once: true, onEnter: () => {
      $$("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count), suffix = el.dataset.suffix ?? "", o = { v: 0 };
        gsap.to(o, { v: end, duration: 1.2, ease: "power2.out", onUpdate: () => { el.textContent = `${Math.round(o.v)}${suffix}`; } });
      });
    } });

    // the handle sweeps once so people see it moves
    ScrollTrigger.create({ trigger: device, start: "top 70%", once: true, onEnter: () => {
      const o = { v: 50 };
      gsap.timeline()
        .to(o, { v: 82, duration: 0.7, ease: "power2.inOut", onUpdate: () => { setX(o.v); range.value = o.v; } })
        .to(o, { v: 22, duration: 0.9, ease: "power2.inOut", onUpdate: () => { setX(o.v); range.value = o.v; } })
        .to(o, { v: 50, duration: 0.6, ease: "power2.inOut", onUpdate: () => { setX(o.v); range.value = o.v; } });
    } });

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1000px)", () => {
      // the phone grows to full height while the page holds still
      gsap.fromTo("#reelPhone", { scale: 0.56 }, { scale: 1, ease: "none", scrollTrigger: { trigger: "#showreel", start: "top top", end: "+=90%", pin: ".reel__stage", scrub: true } });
      gsap.from(".reel__side--l", { x: -60, opacity: 0, ease: "none", scrollTrigger: { trigger: "#showreel", start: "top 80%", end: "top top", scrub: true } });
      gsap.from(".reel__side--r", { x: 60, opacity: 0, ease: "none", scrollTrigger: { trigger: "#showreel", start: "top 80%", end: "top top", scrub: true } });
    });
    mm.add("(min-width: 900px)", () => {
      // styles scroll sideways
      const track = $("#stylesTrack"), steps = STYLES.length - 1;
      const travel = () => track.scrollWidth - document.documentElement.clientWidth;
      gsap.to(track, { x: () => -travel(), ease: "none",
        scrollTrigger: { trigger: "#styles", start: "top top", end: () => `+=${travel() * 0.6}`, pin: ".styles__pin", scrub: 0.5, invalidateOnRefresh: true,
          snap: { snapTo: 1 / steps, duration: { min: 0.2, max: 0.5 }, delay: 0.08, ease: "power2.inOut" } } });
      // the playhead crosses the four clips
      gsap.fromTo("#tlHead", { left: "0%" }, { left: "100%", ease: "none", scrollTrigger: { trigger: "#tl", start: "top 75%", end: "bottom 45%", scrub: true } });
    });

    gsap.from(".tl__clip", { y: 30, opacity: 0, duration: 0.5, stagger: 0.09, ease: "power3.out", scrollTrigger: { trigger: "#tl", start: "top 82%" } });
    gsap.from(".tool", { y: 24, opacity: 0, duration: 0.45, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: "#tools", start: "top 88%" } });
    gsap.from(".offer", { y: 30, opacity: 0, duration: 0.5, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: "#offers", start: "top 82%" } });

    // the end card plays like the end of a reel
    gsap.from("#endLine", { scaleX: 0, duration: 0.8, ease: "power3.inOut", scrollTrigger: { trigger: "#contact", start: "top 60%" } });
    gsap.from(".end__logo img", { scale: 1.12, opacity: 0, duration: 0.6, delay: 0.25, ease: "power4.out", scrollTrigger: { trigger: "#contact", start: "top 60%" } });
    gsap.from(".reach", { y: 18, opacity: 0, duration: 0.45, delay: 0.35, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: "#contact", start: "top 60%" } });

    addEventListener("load", () => { ScrollTrigger.refresh(); layoutRail(); });
    ScrollTrigger.addEventListener("refresh", () => { layoutRail(); onScroll(); });
    ScrollTrigger.refresh();
  };

  // ---------- loader ----------
  const loader = $("#loader");
  document.body.classList.add("is-loading");
  let entered = false, counting = null;
  const finish = () => { if (entered) return; entered = true; counting?.kill(); loader.remove(); start(); };
  if (reduced || !window.gsap) { finish(); return; }
  setTimeout(finish, 1500); // a tab opened in the background has no animation frames: never hold the page behind the loader
  const o = { f: 0 };
  counting = gsap.to(o, {
    f: 60, duration: 1, ease: "power2.in",
    onUpdate: () => {
      $("#loaderTc").textContent = `00:00:${p2(o.f / 30)}:${p2(o.f % 30)}`;
      $("#loaderBar").style.width = `${(o.f / 60) * 100}%`;
    },
    onComplete: finish,
  });
})();
