/* Office Pick 'Em — front end. Vanilla JS, same-origin PocketBase routes. */
(() => {
  "use strict";
  const API = (window.PICKS_API || "/api/pool").replace(/\/$/, "");
  const ET = "America/New_York";
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    }
    for (const kid of kids) if (kid !== null && kid !== undefined) n.append(kid);
    return n;
  };
  const F = {
    dayLong: new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: ET }),
    dayShort: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: ET }),
    time: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: ET }),
    clock: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: ET }),
  };
  const fmtLock = (iso) => { const d = new Date(iso); return F.dayShort.format(d) + ", " + F.time.format(d) + " ET"; };
  const pad = (n) => String(n).padStart(2, "0");
  const countdown = (ms) => {
    if (ms <= 0) return "0m";
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (d > 0) return d + "d " + h + "h " + pad(m) + "m";
    if (h > 0) return h + "h " + pad(m) + "m";
    return m + "m " + pad(sec) + "s";
  };
  const ICON = {
    lock: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10.5" width="16" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    info: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>',
    trophy: '<svg class="icon trophy" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4"/><path d="M12 14v3M8.5 20h7M10 17h4"/></svg>',
    users: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 19.5a6.5 6.5 0 0 1 13 0"/><path d="M16 5.5a3.5 3.5 0 0 1 0 6.5M18.5 13.5a6 6 0 0 1 3 6"/></svg>',
    arrow: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    clock: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>',
  };
  const lum = (hex) => {
    const c = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => { let v = parseInt(c.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const inkFor = (hex) => ((1.05) / (lum(hex) + 0.05) >= 4.5 ? "#FFFFFF" : "#0C1017");
  const teamVars = (t) => `--c1:${t.c1};--c2:${t.c2};--ink:${inkFor(t.c1)}`;
  const store = {
    get me() { try { return JSON.parse(localStorage.getItem("pickem.me") || "null"); } catch (_) { return null; } },
    set me(v) { try { localStorage.setItem("pickem.me", JSON.stringify(v)); } catch (_) {} },
  };
  async function api(path, opts) {
    const r = await fetch(API + path, Object.assign({ headers: { "Content-Type": "application/json" } }, opts || {}));
    let j = {};
    try { j = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(j.message || "Something went wrong (" + r.status + ").");
    return j;
  }
  const money = (n) => { n = Number(n) || 0; return "$" + (Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); };
  const pctTag = (e) => (e && e.pct !== null && e.pct !== undefined) ? ' <span class="pct" title="Season pick accuracy, ' + e.graded + ' graded">' + e.pct + '%</span>' : "";
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());
  const groupBySlot = (games) => {
    const map = new Map();
    for (const g of games) {
      const d = new Date(g.kickoff);
      const key = g.kickoff;
      if (!map.has(key)) map.set(key, { key, day: F.dayLong.format(d), time: F.time.format(d) + " ET", games: [] });
      map.get(key).games.push(g);
    }
    return [...map.values()];
  };
  const notice = (kind, html) => el("div", { class: "notice " + (kind || ""), role: kind === "error" ? "alert" : "status", html: (kind === "error" ? ICON.x : kind === "warn" ? ICON.lock : ICON.info) + "<div>" + html + "</div>" });

  // -------------------------------------------------------------- team btn
  function teamButton(game, side, opts) {
    const name = side === "home" ? game.home : game.away;
    const t = window.teamInfo(name);
    const score = side === "home" ? game.homeScore : game.awayScore;
    const btn = el("button", {
      type: "button", class: "team " + side, style: teamVars(t), "aria-pressed": "false",
      "aria-label": (side === "home" ? "Home: " : "Away: ") + name,
      "data-game": game.id, "data-side": side,
    },
      el("span", { class: "badge", "aria-hidden": "true" }, t.abbr),
      el("span", { class: "names" }, el("span", { class: "city" }, t.city),
        el("span", { class: "nick" }, el("span", { class: "txt" }, t.nick, el("span", { class: "strike", "aria-hidden": "true", html: '<svg viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M3 15 C 18 8, 30 19, 45 12 S 72 6, 84 14 S 94 12, 97 9" /></svg>' })))),
    );
    if (game.completed && score !== null) btn.append(el("span", { class: "score", "aria-label": name + " " + score }, String(score)));
    if (game.winner === side) btn.classList.add("winner");
    if (opts && opts.locked) btn.setAttribute("aria-disabled", "true");
    return btn;
  }
  function gameRow(game, opts) {
    const row = el("div", { class: "game" + (opts && opts.locked ? " locked" : "") + (game.completed ? " final" : ""), role: "group", "aria-label": game.away + " at " + game.home, "data-game": game.id },
      teamButton(game, "away", opts), el("span", { class: "at", "aria-hidden": "true" }, "@"), teamButton(game, "home", opts));
    return row;
  }
  function applyPick(row, side, game, mark) {
    row.classList.toggle("picked", !!side);
    for (const b of row.querySelectorAll(".team")) {
      const on = b.dataset.side === side;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      const old = b.querySelector(".mark"); if (old) old.remove();
      if (on && mark && game.completed) {
        const win = game.winner === side;
        const tie = game.winner === "tie";
        if (!tie) b.append(el("span", { class: "mark " + (win ? "win" : "loss"), html: win ? ICON.check : ICON.x, "aria-label": win ? "Correct" : "Missed" }));
      }
    }
  }

  // ================================================================= SHEET
  async function sheet() {
    const root = $("#app");
    const bar = $("#bar");
    const state = { data: null, picks: {}, total: 0, ready: false, submitted: false, editing: false, timer: null,
      sheets: [], sheetId: null, newSheet: false, sheetName: "", activeLabel: "" };

    root.replaceChildren(el("div", { class: "week-head" }, el("div", { class: "week-title" }, el("h1", {}, "Week"), el("span", { class: "sub" }, "Loading the slate…"))),
      el("div", { class: "games", "aria-hidden": "true" }, ...Array.from({ length: 5 }, () => el("div", { class: "skeleton" }))));

    try { state.data = await api("/state"); }
    catch (err) { root.replaceChildren(notice("error", "Couldn't reach the pool. Refresh in a minute.<br><small>" + err.message + "</small>")); return; }
    render();
    if (state.data.locked) bar.classList.add("away"); else document.body.classList.add("has-bar");
    const me = store.me;
    if (me && me.email) { $("#firstName") && ($("#firstName").value = me.firstName || ""); $("#email") && ($("#email").value = me.email); loadEntry(me.email, true); }

    function render() {
      const d = state.data;
      state.total = d.games.length;
      const locksAt = d.locksAt ? new Date(d.locksAt) : null;
      const head = el("section", { class: "week-head" },
        el("div", { class: "week-title" }, el("h1", {}, "Week " + d.week), el("span", { class: "sub" }, d.games.length ? d.games.length + " games · straight up" : "")),
        el("div", { class: "pills" }));
      const pills = $(".pills", head);
      if (locksAt && !d.locked) pills.append(el("span", { class: "pill live", id: "lockPill", html: ICON.lock + "<span>Locks in <b id=\"cd\">" + countdown(locksAt - Date.now()) + "</b> · " + fmtLock(d.locksAt) + "</span>" }));
      if (locksAt && d.locked) pills.append(el("span", { class: "pill locked", html: ICON.lock + "<span>Locked · kicked off " + fmtLock(d.locksAt) + "</span>" }));
      pills.append(el("span", { class: "pill quiet", html: ICON.users + "<span>" + (d.entries === 1 ? "1 sheet in" : d.entries + " sheets in") + (d.buyIn ? " · <b>" + money(d.pot) + "</b> pot" : "") + "</span>" }));

      if (d.entrants && d.entrants.length) {
        head.append(el("p", { class: "whos-in", html: "<b>In so far:</b> " + d.entrants.map((e) => escapeHtml(e.label) + pctTag(e)).join(", ") }));
      }

      const parts = [head];
      if (!d.games.length) {
        parts.push(el("div", { class: "card empty" }, el("h2", {}, "Slate not posted yet"), el("p", {}, "Week " + d.week + " games haven't been published. Check back soon.")));
        root.replaceChildren(...parts); return;
      }

      if (d.locked) {
        parts.push(notice("warn", "<b>Week " + d.week + " is locked.</b> Picks are in. See everyone's sheet and the standings on the <a href=\"/results.html?week=" + d.week + "\">Results page</a>."));
      } else {
        const who = el("section", { class: "card who", "aria-labelledby": "whoTitle" },
          el("div", { class: "fields" },
            el("div", { class: "field" }, el("label", { for: "firstName" }, "First name"), el("input", { id: "firstName", name: "firstName", autocomplete: "given-name", placeholder: "Eric", maxlength: "40", required: "", oninput: updateBar })),
            el("div", { class: "field" }, el("label", { for: "email" }, "Email"), el("input", { id: "email", name: "email", type: "email", autocomplete: "email", inputmode: "email", placeholder: "you@work.com", required: "", oninput: onEmailInput, onblur: onEmailBlur }))),
          el("p", { class: "hint", html: ICON.info + "<span>Your email is your ticket: no password, we just use it to keep your stats. You can enter more than one sheet; come back with the same email to change or add one before lock.</span>" }),
          el("div", { class: "chooser", id: "chooser", hidden: "" }),
          el("div", { class: "field sheetname", id: "sheetNameField", hidden: "" }, el("label", { for: "sheetName" }, "Sheet name (optional)"), el("input", { id: "sheetName", name: "sheetName", placeholder: "Upset special", maxlength: "40", oninput: () => { state.sheetName = $("#sheetName").value; } })),
          el("p", { class: "welcome", id: "welcome", hidden: "" }));
        parts.push(who);
      }

      const slate = el("section", { id: "slate", "aria-label": "Week " + d.week + " games" });
      for (const slot of groupBySlot(d.games)) {
        const s = el("section", { class: "slot" },
          el("div", { class: "slot-head" }, el("h2", { html: slot.day + "<small>" + slot.time + "</small>" }), el("span", { class: "n" }, slot.games.length === 1 ? "1 game" : slot.games.length + " games")),
          el("div", { class: "games" }, ...slot.games.map((g) => gameRow(g, { locked: d.locked }))));
        slate.append(s);
      }
      slate.addEventListener("click", onTeamClick);
      parts.push(slate);
      parts.push(el("p", { class: "rules" }, (d.buyIn ? money(d.buyIn) + " a sheet, as many sheets as you like. " : "") + "Pick the winner of every game, straight up. Most correct picks takes the week's pot; if people tie, they split it. No spreads, no tiebreaker."));
      root.replaceChildren(...parts);
      for (const id in state.picks) { const row = slate.querySelector('.game[data-game="' + id + '"]'); if (row) applyPick(row, state.picks[id], d.games.find((g) => g.id === id), d.locked); }
      updateBar();
      tick();
    }

    function tick() {
      clearInterval(state.timer);
      const d = state.data;
      if (!d.locksAt || d.locked) return;
      state.timer = setInterval(async () => {
        const left = new Date(d.locksAt) - Date.now();
        const cd = $("#cd"); if (cd) cd.textContent = countdown(left);
        if (left <= 0) { clearInterval(state.timer); try { state.data = await api("/state"); } catch (_) { d.locked = true; } bar.classList.add("away"); document.body.classList.remove("has-bar"); render(); }
      }, 1000);
    }

    function onTeamClick(e) {
      const b = e.target.closest(".team"); if (!b || state.data.locked) return;
      const row = b.closest(".game"); const id = row.dataset.game;
      state.picks[id] = b.dataset.side;
      applyPick(row, b.dataset.side, state.data.games.find((g) => g.id === id), false);
      if (state.submitted) { state.submitted = false; showDone(false); }
      updateBar();
    }

    function updateBar() {
      const n = Object.keys(state.picks).length, total = state.total;
      $("#count").textContent = n; $("#total").textContent = total;
      $("#fill").style.width = total ? (100 * n / total) + "%" : "0%";
      const name = ($("#firstName") || {}).value || "", email = ($("#email") || {}).value || "";
      const msg = $("#barMsg");
      const submit = $("#submit");
      let reason = "";
      if (n < total) reason = total - n === 1 ? "1 game left" : (total - n) + " games left";
      else if (!name.trim()) reason = "Add your first name";
      else if (!validEmail(email)) reason = "Add your email";
      msg.textContent = reason ? " · " + reason : "";
      msg.classList.toggle("msg", n === total && !!reason);
      submit.disabled = !!reason;
      submit.textContent = state.sheetId ? "Update " + shortLabel(activeSheet()) : state.newSheet ? "Submit new sheet" : "Submit picks";
      if (!reason && !state.ready) { state.ready = true; submit.classList.add("ready"); setTimeout(() => submit.classList.remove("ready"), 800); }
      if (reason) state.ready = false;
    }

    let emailTimer = null;
    function onEmailInput() { clearTimeout(emailTimer); updateBar(); const v = $("#email").value; if (validEmail(v)) emailTimer = setTimeout(() => loadEntry(v, false), 600); }
    function onEmailBlur() { const v = $("#email").value; $("#email").setAttribute("aria-invalid", v && !validEmail(v) ? "true" : "false"); }
    async function loadEntry(email, fromStorage) {
      if (!validEmail(email)) return;
      try {
        const r = await api("/entry?email=" + encodeURIComponent(email.trim().toLowerCase()));
        if (!r.found || r.week !== state.data.week || !r.sheets.length) { state.sheets = []; renderChooser(null); if (!fromStorage) hideWelcome(); return; }
        state.sheets = r.sheets;
        const fn = $("#firstName"); if (fn && !fn.value && r.firstName) fn.value = r.firstName;
        if (state.data.locked) { chooseSheet(r.sheets[0]); return; }
        renderChooser(r.firstName, "You already have " + (r.sheets.length === 1 ? "a sheet" : r.sheets.length + " sheets") + " in for Week " + r.week + ". Edit one, or start another:");
        updateBar();
      } catch (_) { /* silent: entry lookup is a convenience */ }
    }
    // The choice Eric asked for: replace an existing sheet or add a new one.
    function renderChooser(firstName, message, opts) {
      const c = $("#chooser"); if (!c) return;
      if (!state.sheets.length) { c.hidden = true; c.replaceChildren(); return; }
      const resubmit = !!(opts && opts.resubmit);
      const btns = state.sheets.map((sh) => el("button", { type: "button", class: "btn btn-ghost" + (state.sheetId === sh.id ? " on" : ""), onclick: () => {
        if (resubmit) { state.sheetId = sh.id; state.newSheet = false; state.activeLabel = sh.label; updateBar(); $("#submit").click(); } else chooseSheet(sh);
      } }, (resubmit ? "Replace " : "Edit ") + shortLabel(sh)));
      btns.push(el("button", { type: "button", class: "btn " + (state.newSheet ? "btn-primary" : "btn-ghost"), onclick: () => {
        if (resubmit) { state.sheetId = null; state.newSheet = true; state.activeLabel = ""; updateBar(); $("#submit").click(); } else chooseNew();
      } }, "+ New sheet"));
      c.replaceChildren(el("p", { class: "chooser-msg", html: (opts && opts.urgent ? ICON.info : ICON.check) + "<span>" + escapeHtml(message) + "</span>" }), el("div", { class: "chooser-btns" }, ...btns));
      c.classList.toggle("urgent", !!(opts && opts.urgent));
      c.hidden = false;
    }
    function chooseSheet(sh) {
      state.sheetId = sh.id; state.newSheet = false; state.activeLabel = sh.label; state.editing = true;
      state.picks = Object.assign({}, sh.picks);
      for (const row of document.querySelectorAll(".game")) applyPick(row, state.picks[row.dataset.game], state.data.games.find((g) => g.id === row.dataset.game), state.data.locked);
      const f = $("#sheetNameField"); if (f) { f.hidden = false; $("#sheetName").value = sh.name || ""; state.sheetName = sh.name || ""; }
      const w = $("#welcome"); if (w) { w.innerHTML = ICON.check + "<span>Editing " + escapeHtml(sh.label) + ". Change any pick and hit Update.</span>"; w.hidden = false; }
      renderChooser(null, "You already have " + (state.sheets.length === 1 ? "a sheet" : state.sheets.length + " sheets") + " in for Week " + state.data.week + ". Edit one, or start another:");
      renderSheetTabs();
      updateBar();
    }
    function chooseNew() {
      state.sheetId = null; state.newSheet = true; state.activeLabel = ""; state.editing = false;
      state.picks = {};
      for (const row of document.querySelectorAll(".game")) applyPick(row, null, null, false);
      const f = $("#sheetNameField"); if (f) { f.hidden = false; $("#sheetName").value = ""; state.sheetName = ""; }
      const w = $("#welcome"); if (w) { w.innerHTML = ICON.check + "<span>New sheet #" + (state.sheets.length + 1) + " — pick all " + state.total + " games, then submit.</span>"; w.hidden = false; }
      renderChooser(null, "Starting a new sheet. Your other " + (state.sheets.length === 1 ? "sheet stays" : state.sheets.length + " sheets stay") + " as they are.");
      updateBar();
    }
    // Locked week with several sheets: chips to switch which one is highlighted.
    function renderSheetTabs() {
      const old = $("#sheetTabs"); if (old) old.remove();
      if (!state.data.locked || state.sheets.length < 2) return;
      const tabs = el("div", { class: "chips", id: "sheetTabs", role: "group", "aria-label": "Your sheets" }, ...state.sheets.map((sh) => el("button", { type: "button", class: "chip", "aria-pressed": sh.id === state.sheetId ? "true" : "false", onclick: () => chooseSheet(sh) }, sh.label)));
      const slate = $("#slate"); if (slate) slate.parentNode.insertBefore(tabs, slate);
    }
    const shortLabel = (sh) => (sh && sh.name) ? sh.name : "sheet #" + (sh ? sh.num : 1);
    const activeSheet = () => state.sheets.find((sh) => sh.id === state.sheetId) || null;
    function hideWelcome() { const w = $("#welcome"); if (w) w.hidden = true; }

    $("#submit").addEventListener("click", async () => {
      const submit = $("#submit");
      const firstName = $("#firstName").value.trim(), email = $("#email").value.trim().toLowerCase();
      submit.classList.add("busy"); submit.textContent = "Saving…";
      try {
        const payload = { firstName, email, week: state.data.week, picks: state.picks };
        if (state.sheetId) payload.sheetId = state.sheetId;
        if (state.newSheet) payload.newSheet = true;
        if (state.sheetId || state.newSheet) payload.sheetName = state.sheetName || "";
        const res = await fetch(API + "/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const r = await res.json().catch(() => ({}));
        if (res.status === 409 && r.needsChoice) {
          state.sheets = r.sheets;
          renderChooser(firstName, r.message + " Replace one, or add a new sheet?", { urgent: true, resubmit: true });
          $(".who").hidden = false;
          $("#chooser").scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        if (!res.ok) throw new Error(r.message || "Something went wrong (" + res.status + ").");
        store.me = { firstName, email };
        state.submitted = true; state.editing = true;
        state.sheetId = r.sheet.id; state.newSheet = false; state.activeLabel = r.sheet.label;
        const idx = state.sheets.findIndex((sh) => sh.id === r.sheet.id);
        const saved = Object.assign({}, r.sheet, { picks: Object.assign({}, state.picks) });
        if (idx >= 0) state.sheets[idx] = saved; else state.sheets.push(saved);
        showDone(true, firstName, r);
      } catch (err) {
        const n = $("#submitError") || root.insertBefore(notice("error", ""), root.firstChild.nextSibling);
        n.id = "submitError"; n.querySelector("div").innerHTML = escapeHtml(err.message);
        n.scrollIntoView({ behavior: "smooth", block: "center" });
      } finally { submit.classList.remove("busy"); updateBar(); }
    });

    function showDone(show, firstName, r) {
      const old = $("#done"); if (old) old.remove();
      const slate = $("#slate"), who = $(".who");
      if (!show) { bar.classList.remove("away"); document.body.classList.add("has-bar"); if (who) who.hidden = false; return; }
      const d = state.data;
      const done = el("section", { id: "done", class: "card done", role: "status", tabindex: "-1" },
        el("div", { class: "check", html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.5l5 5L19.5 7"/></svg>' }),
        el("div", {},
          el("h2", {}, "You're in, " + firstName + "."),
          el("p", {}, (r.sheet && r.sheet.num > 1 ? shortLabel(r.sheet).replace(/^sheet/, "Sheet") + " saved: " : "") + r.count + " picks saved for Week " + d.week + (r.sheetsCount > 1 ? " (you have " + r.sheetsCount + " sheets in)" : "") + ". You can change them until " + fmtLock(d.locksAt) + " — just come back with the same email. Everyone's picks and the standings unlock on the Results page at kickoff; finals post after each game window."),
          el("div", { class: "actions" },
            el("button", { type: "button", class: "btn btn-ghost", onclick: () => { state.submitted = false; showDone(false); $("#slate").scrollIntoView({ behavior: "smooth" }); } }, "Edit picks"),
            el("button", { type: "button", class: "btn btn-ghost", onclick: () => { state.submitted = false; showDone(false); chooseNew(); window.scrollTo({ top: 0, behavior: "smooth" }); } }, "+ Another sheet"),
            el("a", { class: "btn btn-ghost", href: "/results.html", html: "Results " + ICON.arrow }))));
      if (who) who.hidden = true;
      root.insertBefore(done, slate);
      bar.classList.add("away"); document.body.classList.remove("has-bar");
      window.scrollTo({ top: 0, behavior: "smooth" });
      done.focus({ preventScroll: true });
    }
  }
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // =============================================================== RESULTS
  async function results() {
    const root = $("#app");
    const params = new URLSearchParams(location.search);
    let week = parseInt(params.get("week"), 10) || 0;
    root.replaceChildren(el("div", { class: "week-head" }, el("div", { class: "week-title" }, el("h1", {}, "Results"), el("span", { class: "sub" }, "Loading…"))), el("div", { class: "games", "aria-hidden": "true" }, ...Array.from({ length: 3 }, () => el("div", { class: "skeleton" }))));
    let r, season;
    try { [r, season] = await Promise.all([api("/results" + (week ? "?week=" + week : "")), api("/season")]); }
    catch (err) { root.replaceChildren(notice("error", "Couldn't reach the pool. Refresh in a minute.<br><small>" + escapeHtml(err.message) + "</small>")); return; }
    week = r.week;
    document.title = "Week " + week + " results · Office Pick 'Em";

    const head = el("section", { class: "week-head" },
      el("div", { class: "week-title" }, el("h1", {}, "Week " + week), el("span", { class: "sub" }, r.games.length ? r.games.length + " games" : "")),
      el("div", { class: "pills" }),
      el("div", { class: "chips", role: "group", "aria-label": "Choose a week" }));
    const pills = $(".pills", head);
    const chips = $(".chips", head);
    for (const w of r.weeks) {
      chips.append(el("button", { type: "button", class: "chip", "aria-pressed": w === week ? "true" : "false", disabled: w > r.currentWeek ? "" : null, title: w > r.currentWeek ? "Week " + w + " isn't open yet" : null, "aria-label": "Week " + w + (w > r.currentWeek ? " (not yet open)" : ""), onclick: () => { location.search = "?week=" + w; } }, "Wk " + w));
    }
    setTimeout(() => { const c = chips.querySelector('[aria-pressed="true"]'); if (c) c.scrollIntoView({ inline: "center", block: "nearest" }); }, 0);

    const parts = [head];
    if (!r.locked) {
      pills.append(el("span", { class: "pill live", html: ICON.lock + "<span>Locks " + (r.locksAt ? fmtLock(r.locksAt) : "soon") + "</span>" }));
      pills.append(el("span", { class: "pill locked", html: ICON.trophy + "<span><b>" + money(r.pot) + "</b> in the pot so far</span>" }));
      pills.append(el("span", { class: "pill quiet", html: ICON.users + "<span>" + (r.entries === 1 ? "1 sheet in" : r.entries + " sheets in") + "</span>" }));
      parts.push(notice("", "<b>Picks are hidden until kickoff.</b> Everyone's sheet and the standings appear here once Week " + week + " locks" + (r.locksAt ? " (" + fmtLock(r.locksAt) + ")" : "") + ". Haven't picked yet? <a href=\"/\">Make your picks</a>."));
      if (r.entrants && r.entrants.length) {
        parts.push(el("section", { class: "card section", "aria-labelledby": "whosInTitle" },
          el("div", { class: "card-head" }, el("h2", { id: "whosInTitle" }, "Who's in"), el("span", { class: "meta" }, (r.entries === 1 ? "1 sheet" : r.entries + " sheets") + " · " + money(r.pot))),
          el("ul", { class: "entrants" }, ...r.entrants.map((e) => el("li", { html: escapeHtml(e.label) + pctTag(e) })))));
      } else {
        parts.push(el("div", { class: "card empty" }, el("h2", {}, "Nobody's in yet"), el("p", {}, "Be the first — it takes two minutes.")));
      }
    } else {
      if (r.final) {
        const names = r.leaders || [];
        const pot = money(r.pot);
        const list = names.length <= 2 ? names.join(" & ") : names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
        const who = names.length === 0 ? "" : names.length === 1 ? names[0] + " takes " + pot : list + " split " + pot + " (" + money(r.share) + " each)";
        pills.append(el("span", { class: "pill locked", html: ICON.trophy + "<span>Final · <b>" + escapeHtml(who) + "</b>" + (r.topScore !== undefined ? " · " + r.topScore + "/" + r.games.length : "") + "</span>" }));
      } else {
        pills.append(el("span", { class: "pill live", html: ICON.clock + "<span><b>" + r.completedGames + "</b> of " + r.games.length + " final</span>" }));
        pills.append(el("span", { class: "pill locked", html: ICON.trophy + "<span><b>" + money(r.pot) + "</b> pot</span>" }));
      }
      pills.append(el("span", { class: "pill quiet", html: ICON.users + "<span>" + (r.entries === 1 ? "1 sheet" : r.entries + " sheets") + " × " + money(r.buyIn) + "</span>" }));

      if (!r.players.length) {
        parts.push(el("div", { class: "card empty" }, el("h2", {}, "Nobody picked"), el("p", {}, "No sheets came in for Week " + week + ".")));
      } else {
        // standings
        const tb = el("tbody");
        let rank = 0, prev = null;
        r.players.forEach((p, i) => { if (p.correct !== prev) { rank = i + 1; prev = p.correct; }
          const leader = r.final && p.correct === r.topScore;
          tb.append(el("tr", { class: leader ? "leader" : "" },
            el("td", { class: "rank" }, String(rank)),
            el("td", { class: "name", html: escapeHtml(p.name) + pctTag({ pct: p.seasonPct, graded: p.seasonGraded }) + (leader ? ICON.trophy : "") }),
            el("td", { class: "num big" }, String(p.correct)),
            el("td", { class: "num dim col-wrong" }, String(p.wrong)),
            el("td", { class: "num dim" }, String(p.pending)),
            r.final ? null : el("td", { class: "num" }, String(p.correct + p.pending))));
        });
        parts.push(el("section", { class: "card section", "aria-labelledby": "standingsTitle" },
          el("div", { class: "card-head" }, el("h2", { id: "standingsTitle" }, "Week " + week + " standings"), el("span", { class: "meta" }, r.final ? "Final" : r.completedGames + "/" + r.games.length + " games final")),
          el("div", { class: "table-wrap" }, el("table", { class: r.final ? "" : "has-max" }, el("thead", {}, el("tr", {}, el("th", {}, "#"), el("th", {}, "Player"), el("th", { class: "num" }, "Correct"), el("th", { class: "num col-wrong" }, "Wrong"), el("th", { class: "num" }, "Left"), r.final ? null : el("th", { class: "num", title: "Correct plus games still to play" }, "Max"))), tb))));

        // grid
        const winnerOf = {}; for (const g of r.games) winnerOf[g.id] = g.winner;
        const thead = el("thead", {}, el("tr", {}, el("th", { class: "name-col" }, "Player"), ...r.games.map((g) => {
          const a = window.teamInfo(g.away), h = window.teamInfo(g.home);
          const cls = (side) => !g.winner ? "" : g.winner === "tie" ? "" : g.winner === side ? "w" : "l";
          return el("th", { class: "game-col", scope: "col", "aria-label": g.away + " at " + g.home + (g.completed ? ", final " + g.awayScore + "–" + g.homeScore : "") },
            el("span", { class: "vs" }, el("span", { class: cls("away") }, a.abbr), el("span", { class: cls("home") }, h.abbr)));
        })));
        const gb = el("tbody");
        for (const p of r.players) {
          gb.append(el("tr", {}, el("td", { class: "name" }, p.name), ...r.games.map((g) => {
            const pk = p.picks[g.id];
            if (!pk) return el("td", { class: "cell" }, el("span", { class: "cell-pick pending", "aria-label": "no pick" }, "—"));
            const t = window.teamInfo(pk.pick === "home" ? g.home : g.away);
            const w = winnerOf[g.id];
            const st = !w ? "pending" : w === "tie" ? "push" : w === pk.pick ? "win" : "loss";
            return el("td", { class: "cell" }, el("span", { class: "cell-pick " + st, style: st === "win" ? teamVars(t) : "", "aria-label": t.abbr + " " + st }, t.abbr));
          })));
        }
        parts.push(el("section", { class: "card section breakout", "aria-labelledby": "gridTitle" },
          el("div", { class: "card-head" }, el("h2", { id: "gridTitle" }, "Everyone's picks")),
          el("div", { class: "table-wrap" }, el("table", { class: "grid-table" }, thead, gb)),
          el("div", { class: "legend" }, el("span", { html: "<i class=\"w\"></i> correct (team color)" }), el("span", { html: "<i class=\"l\"></i> missed" }), el("span", { html: "<i class=\"p\"></i> not final" }))));
      }
    }

    // season
    if (season.anyLocked && season.table.length) {
      const sb = el("tbody");
      let rank = 0, prev = null;
      season.table.forEach((p, i) => { const key = p.correct + "/" + p.weeksWon; if (key !== prev) { rank = i + 1; prev = key; }
        sb.append(el("tr", { class: i === 0 ? "leader" : "" }, el("td", { class: "rank" }, String(rank)), el("td", { class: "name" }, p.name), el("td", { class: "num big" }, String(p.correct)), el("td", { class: "num" + (p.pct === null ? " dim" : "") }, p.pct === null ? "—" : p.pct + "%"), el("td", { class: "num col-wks" }, String(p.weeksWon)), el("td", { class: "num" + (p.winnings ? " won" : " dim") }, p.winnings ? money(p.winnings) : "—")));
      });
      const weeksFinal = season.weeks.filter((w) => w.final).length;
      parts.push(el("section", { class: "card section", "aria-labelledby": "seasonTitle" },
        el("div", { class: "card-head" }, el("h2", { id: "seasonTitle" }, "Season"), el("span", { class: "meta" }, (weeksFinal === 1 ? "1 week final" : weeksFinal + " weeks final") + " · " + money(season.paidOut) + " paid out")),
        el("div", { class: "table-wrap" }, el("table", {}, el("thead", {}, el("tr", {}, el("th", {}, "#"), el("th", {}, "Player"), el("th", { class: "num" }, "Correct"), el("th", { class: "num", title: "Correct ÷ graded picks, season to date", html: '<span class="hide-sm">Correct </span>%' }), el("th", { class: "num col-wks" }, "Wks won"), el("th", { class: "num" }, "Won"))), sb))));
    } else {
      parts.push(el("p", { class: "rules" }, "Season standings start once Week 1 locks."));
    }
    root.replaceChildren(...parts);
  }

  document.addEventListener("DOMContentLoaded", () => { if (document.body.dataset.page === "sheet") sheet(); else if (document.body.dataset.page === "results") results(); });
})();
