(function () {
  const content = globalThis.P6_CONTENT;
  const checks = content.checks;
  const app = document.getElementById("app");
  const STORE = content.storageKey;

  const BRAND = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0b5cab"/><rect x="14" y="12" width="28" height="40" rx="4" fill="#fff"/><path d="M20 24h16M20 32h16M20 40h10" stroke="#0b5cab" stroke-width="3" stroke-linecap="round"/><path d="M36 40l12-16 6 4-12 16z" fill="#ffd15c"/><path d="M48 24l6 4-3 2-6-4z" fill="#e07a2f"/></svg>`;

  const state = {
    screen: "home",
    moduleId: null,
    step: 0,
    score: 0,
    perfect: 0,
    answered: 0,
    total: 0,
    misses: [],
    sound: true,
    teacher: false,
    showHelp: false,
    confirmReset: false,
    play: {},
    progress: {},
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
      state.progress = saved.progress || {};
      state.sound = saved.sound !== false;
      state.teacher = saved.teacher === true;
    } catch (err) {
      state.progress = {};
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        progress: state.progress,
        sound: state.sound,
        teacher: state.teacher,
      }));
    } catch (err) {
      /* private mode can block storage */
    }
  }

  function hasZh(text) {
    return /[\u4e00-\u9fff]/.test(String(text || ""));
  }

  function langAttr(text) {
    if (!text) return "";
    return hasZh(text) ? ` lang="zh-Hant"` : ` lang="en"`;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function rich(text) {
    return esc(text || "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  function emojiHtml(name) {
    const icon = content.icons[name] || "📘";
    return `<span class="emoji" aria-hidden="true">${icon}</span>`;
  }

  function onBrand(hex) {
    return hex === "#c45c26" || hex === "#e07a2f" ? "#1b140c" : "#ffffff";
  }

  function paintHue() {
    const mod = currentModule();
    const hue = state.screen === "home" || !mod ? "#0b5cab" : mod.hue;
    document.documentElement.style.setProperty("--brand", hue);
    document.documentElement.style.setProperty("--on-brand", onBrand(hue));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", hue);
  }

  function moduleById(id) {
    return content.modules.find((mod) => mod.id === id);
  }

  function currentModule() {
    return moduleById(state.moduleId);
  }

  function currentStep() {
    const mod = currentModule();
    return mod ? mod.steps[state.step] : null;
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function stars(n) {
    return [1, 2, 3].map((i) => `<span class="${i <= n ? "" : "off"}">★</span>`).join("");
  }

  function beep(freq, dur, type) {
    if (!state.sound) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!beep.ctx) beep.ctx = new AudioCtx();
    const ctx = beep.ctx;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.stop(ctx.currentTime + dur);
  }

  function cheer() {
    beep(523, 0.12);
    setTimeout(() => beep(659, 0.12), 90);
    setTimeout(() => beep(784, 0.16), 180);
  }

  function buzz() {
    beep(196, 0.18, "triangle");
  }

  function speak(text) {
    if (!window.speechSynthesis || !text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-GB";
    utter.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function confetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = document.createElement("div");
    layer.className = "confetti";
    const colors = ["#0b5cab", "#6c4ed4", "#0e8f7a", "#c45c26", "#e07a2f", "#ffd15c"];
    for (let i = 0; i < 28; i += 1) {
      const bit = document.createElement("i");
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = `${Math.random() * 0.2}s`;
      layer.appendChild(bit);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1000);
  }

  function showModel() {
    return !!(state.play.revealed || state.teacher);
  }

  function hiddenNote() {
    return `<p class="gloss" lang="zh-Hant">範例／教師用會在你交卷之後，或開啟教師模式才顯示。</p>`;
  }

function answerHold() {
  return showModel() ? "" : hiddenNote();
}

  function seriesItem(step) {
    return step.items ? step.items[state.play.i || 0] : step;
  }

  function initPlay(step) {
    const play = {
      forStep: state.step,
      tries: {},
      disabled: {},
      i: 0,
      selected: null,
      slots: {},
      done: {},
      drafts: {},
      ticks: {},
      wrong: {},
      usedChips: {},
      picked: [],
      clean: true,
      message: null,
      draft: "",
      revealed: false,
      scramble: false,
      locked: false,
      flash: null,
    };
    if ((step.kind === "mcq" || step.kind === "syllableMatch") && step.items && step.items[0]) {
      play.options = shuffle(step.items[0].options.slice());
    }
    if (step.kind === "iconHunt") {
      play.order = shuffle(step.items.map((_, index) => index));
    }
    if (step.kind === "bank") {
      play.chips = shuffle(step.bank.map((word, index) => ({ id: `c${index}`, word: word })));
    }
    if (step.kind === "order") {
      play.chips = shuffle(step.items[0].chips.map((text, index) => ({ id: `o${index}`, text: text })));
    }
    state.play = play;
  }

  function startModule(id) {
    const mod = moduleById(id);
    state.screen = "play";
    state.moduleId = id;
    state.step = 0;
    state.score = 0;
    state.perfect = 0;
    state.answered = 0;
    state.misses = [];
    state.total = mod.steps.reduce((sum, step) => sum + checks.countItems(step), 0);
    state.play = {};
    state.showHelp = false;
    render(true);
  }

  function finishModule() {
    const ratio = state.total ? state.perfect / state.total : 1;
    const earned = ratio >= 0.9 ? 3 : ratio >= 0.65 ? 2 : 1;
    const prev = state.progress[state.moduleId] || { stars: 0, score: 0 };
    state.progress[state.moduleId] = {
      stars: Math.max(prev.stars, earned),
      score: Math.max(prev.score, state.score),
    };
    save();
    state.screen = "result";
    state.earned = earned;
    if (earned >= 2) confetti();
    cheer();
    render(true);
  }

  function nextStep() {
    const mod = currentModule();
    if (state.step + 1 >= mod.steps.length) {
      finishModule();
      return;
    }
    state.step += 1;
    state.play = {};
    render(true);
  }

  function record(okFirst, question, answer, why) {
    state.answered += 1;
    if (okFirst) {
      state.perfect += 1;
      state.score += 10;
      cheer();
    } else {
      state.score += 4;
      state.misses.push({ q: question, a: answer, why: why || "" });
      buzz();
    }
  }

  function feedback(ok, text) {
    if (state.play) state.play.message = { ok: ok, text: text };
    const node = document.getElementById("feedback");
    if (!node) return;
    node.className = `feedback ${ok ? "good" : "bad"}`;
    node.lang = hasZh(text) ? "zh-Hant" : "en";
    node.textContent = text;
  }

  let suppressClick = false;

  function render(scroll) {
    const step = state.screen === "play" ? currentStep() : null;
    if (step && state.play.forStep !== state.step) initPlay(step);
    paintHue();
    app.innerHTML = shell(step);
    if (scroll) {
      window.scrollTo(0, 0);
      const field = document.querySelector("[data-focus]");
      if (field) field.focus();
    }
    wireDrag();
  }

  function shell(step) {
    return `${topbar()}${state.screen === "home" ? home() : ""}${state.screen === "play" ? play(step) : ""}${state.screen === "result" ? result() : ""}`;
  }

  function topbar() {
    const mod = currentModule();
    const title = mod && state.screen !== "home"
      ? `<h1>${esc(mod.zh)} · ${esc(mod.en)}</h1><p>${state.answered}/${state.total} · ${state.score} 分</p>`
      : `<h1>Moral</h1><p>Dictation (2)</p>`;
    const homeBtn = state.screen === "home"
      ? ""
      : `<button type="button" class="icon-btn" data-action="home" aria-label="回主頁">主頁</button>`;
    return `<header class="topbar"><div class="brand"><div class="brand-mark" aria-hidden="true">${BRAND}</div><div>${title}</div></div><div class="spacer"></div>${homeBtn}<button type="button" class="icon-btn" data-action="sound" aria-pressed="${state.sound ? "true" : "false"}" aria-label="${state.sound ? "音效開" : "音效關"}">音效</button></header>`;
  }

  function teacherButton() {
    return `<button type="button" class="text-btn" data-action="teacher" aria-pressed="${state.teacher ? "true" : "false"}">${state.teacher ? "關閉教師模式" : "教師模式"}</button>`;
  }

  function teacherNote() {
    if (!state.teacher) return "";
    return `<p class="help" lang="zh-Hant">教師模式已開。範例／教師用答案會顯示。學生平常請關閉。</p>`;
  }

  function home() {
    const cards = content.modules.map((mod, index) => {
      const saved = state.progress[mod.id];
      const n = saved ? saved.stars : 0;
      const ink = onBrand(mod.hue);
      return `<button type="button" class="quest" data-action="open" data-module="${esc(mod.id)}">
        <span class="quest-index" style="background:${esc(mod.hue)};color:${ink}">${index + 1}</span>
        <span>
          <h3>${esc(mod.zh)} <span class="en">${esc(mod.en)}</span></h3>
          <p class="blurb">${esc(mod.blurb)}</p>
          <div class="stars" aria-label="${n} stars">${stars(n)} ${n ? "" : `<span class="gloss">未玩過</span>`}</div>
        </span>
      </button>`;
    }).join("");
    const minis = ["earthquake", "typhoon", "tsunami", "flags", "bright"].map((name) => `<span class="mini-ico">${emojiHtml(name)}</span>`).join("");
    const reset = state.confirmReset
      ? `<button type="button" class="text-btn" data-action="reset-yes">確定清除</button>`
      : `<button type="button" class="text-btn" data-action="reset">清除星星</button>`;
    return `<div class="main"><section class="hero">
      <p class="kicker">${esc(content.className)} · ${esc(content.studentEn)}</p>
      <h2>${esc(content.title)}</h2>
      <p>${esc(content.subtitle)}</p>
      <p class="motto" lang="en">${esc(content.motto)}</p>
      <p class="hero-note" lang="zh-Hant">${esc(content.hub)}</p>
      <p class="gloss" lang="en">Dictation day: ${esc(content.date)}</p>
      <div class="mascot-row">${minis}</div>
    </section>
    ${teacherNote()}
    <div class="map">${cards}</div>
    <div class="row">${teacherButton()}${reset}</div>
    <p class="footer-note">${esc(content.footer)} · school practice</p>
    </div>`;
  }

  function play(step) {
    const mod = currentModule();
    const pct = state.total ? Math.round((state.answered / state.total) * 100) : 0;
    const help = state.showHelp ? `<div class="help" lang="zh-Hant">${rich(mod.help)}</div>` : "";
    const note = state.play.message;
    const banked = step.kind === "bank";
    return `<div class="main${banked ? " has-bank" : ""}">
      <div class="progress" aria-hidden="true"><div style="width:${pct}%"></div></div>
      <div class="row" style="margin-top:0"><button type="button" class="text-btn" data-action="help">${state.showHelp ? "收起提示" : "提示"}</button>
      ${teacherButton()}</div>
      ${teacherNote()}${help}
      ${renderStep(step)}
      ${teacherBox(step)}
      <p id="feedback" class="feedback ${note ? (note.ok ? "good" : "bad") : ""}"${note ? langAttr(note.text) : ""} aria-live="polite">${note ? esc(note.text) : ""}</p>
    </div>${banked ? bankHtml(step) : ""}`;
  }

  function teacherBox(step) {
    if (!state.teacher || !step || step.kind === "teach" || step.kind === "checklist") return "";
    let text = "";
    if (step.kind === "mcq" || step.kind === "syllableMatch") {
      const item = seriesItem(step);
      text = item ? item.answer : "";
    } else if (step.kind === "iconHunt") {
      const item = step.items[state.play.order[state.play.i]];
      text = item ? `${item.say} → ${item.answer}` : "";
    } else if (step.kind === "bank") {
      text = step.items.map((item) => `${item.before} ${item.answer} ${item.after}`.replace(/\s+/g, " ").trim()).join("\n");
    } else if (step.kind === "order" || step.kind === "fix") {
      const item = step.items[state.play.i];
      text = item ? item.answer : "";
    } else if (step.kind === "gap") {
      const item = step.items[state.play.i];
      text = item ? item.blanks.map((blank) => blank.answer).join(" · ") : "";
    } else if (step.kind === "type") {
      const item = step.items[state.play.i];
      const lines = [];
      if (item) lines.push(item.answer);
      if (step.teacherBank && step.teacherBank.length) {
        lines.push("");
        lines.push("教師庫");
        step.teacherBank.forEach((row) => {
          lines.push(row.prompt);
          lines.push(row.answer);
        });
      }
      text = lines.join("\n");
    }
    if (!text) return "";
    return `<div class="why teacher-key"><p class="kicker">範例／教師用</p><p class="sample">${esc(text)}</p></div>`;
  }

  function renderStep(step) {
    if (step.kind === "teach") return teachHtml(step);
    if (step.kind === "mcq" || step.kind === "syllableMatch") return mcqHtml(step);
    if (step.kind === "iconHunt") return iconHuntHtml(step);
    if (step.kind === "bank") return bankStoryHtml(step);
    if (step.kind === "order") return orderHtml(step);
    if (step.kind === "gap") return gapHtml(step);
    if (step.kind === "fix") return fixHtml(step);
    if (step.kind === "type") return typeHtml(step);
    if (step.kind === "checklist") return checklistHtml(step);
    return "";
  }

  function teachHtml(step) {
    let body = "";
    if (step.body) body += `<p${langAttr(step.body)}>${rich(step.body)}</p>`;
    if (step.lines) {
      body += step.lines.map((line, index) => {
        const gloss = (step.glosses || [])[index];
        return `<p class="sentence"${langAttr(line)}>${rich(line)}</p>${gloss ? `<p class="gloss" lang="zh-Hant">${esc(gloss)}</p>` : ""}`;
      }).join("");
    }
    if (step.passage) {
      body += `<div class="passage">${step.passage.map((para) => `<p lang="en">${rich(para)}</p>`).join("")}</div>`;
    }
    if (step.callout) body += `<div class="callout" lang="zh-Hant">${rich(step.callout)}</div>`;
    if (step.glossLine) body += `<p class="gloss-line" lang="zh-Hant">${esc(step.glossLine)}</p>`;
    if (step.example) body += `<p class="why" lang="en">${rich(step.example)}</p>`;
    if (step.cards) {
      body += `<div class="card-grid">${step.cards.map((card) => `<button type="button" class="word-card" data-action="speak" data-word="${esc(card.word)}"><span class="letter">${esc(card.letter || "")}</span>${emojiHtml(card.word)}<strong lang="en">${esc(card.word)}</strong><span class="syllable" lang="en">${esc(card.syllables || "")}</span><span class="gloss" lang="zh-Hant">${esc(card.gloss || "")}</span><span class="gloss">讀音</span></button>`).join("")}</div>`;
    }
    const last = state.step + 1 >= currentModule().steps.length;
    return `<section class="panel"><p class="kicker">學一學</p><h2 class="step-title"${langAttr(step.title)}>${esc(step.title || "學一學")}</h2>${body}<button type="button" class="big-go" data-action="next">${last ? "完成" : "開始"}</button></section>`;
  }

  function mcqHtml(step) {
    const item = seriesItem(step);
    const total = step.items.length;
    const options = state.play.options || item.options;
    const buttons = (state.play.revealed ? [] : options).map((option) => {
      const off = state.play.disabled[option] ? "disabled" : "";
      const flash = state.play.flash === option ? " is-wrong" : "";
      return `<button type="button" class="choice${flash}" data-action="mcq" data-option="${esc(option)}" ${langAttr(option)} ${off}>${esc(option)}</button>`;
    }).join("");
    const heading = step.kind === "syllableMatch"
      ? `<p class="prompt-word" lang="en">${esc(item.word)}</p><p lang="zh-Hant">選正確音節。</p>`
      : `<h2 class="step-title"${langAttr(item.q)}>${esc(item.q)}</h2>`;
    const extra = state.play.revealed
      ? `<div class="why teacher-key"><p class="kicker">範例／教師用</p><p class="sample" lang="en">${esc(item.answer)}</p>${item.why ? `<p${langAttr(item.why)}>${esc(item.why)}</p>` : ""}</div><button type="button" class="big-go" data-action="next-inner">${state.play.i + 1 >= total ? "繼續" : "下一題"}</button>`
      : "";
    return `<section class="panel"><p class="kicker">${esc(step.title)} · ${state.play.i + 1}/${total}</p>${heading}<div class="choices">${buttons}</div>${extra}</section>`;
  }

  function iconHuntHtml(step) {
    const item = step.items[state.play.order[state.play.i]];
    const buttons = step.pool.map((name) => `<button type="button" class="icon-pick" data-action="hunt" data-id="${esc(name)}">${emojiHtml(name)}<strong lang="en">${esc(name)}</strong></button>`).join("");
    return `<section class="panel"><p class="kicker">${esc(step.title)} · ${state.play.i + 1}/${step.items.length}</p><p class="prompt-word" lang="zh-Hant">${esc(item.say)}</p><div class="icon-grid">${buttons}</div></section>`;
  }

  function blankButton(item) {
    const filled = state.play.slots[item.id];
    const locked = state.play.done[item.id];
    const cls = locked ? "blank is-locked" : state.play.selected ? "blank is-armed" : "blank";
    const label = filled || "______";
    const before = item.before || "";
    const after = item.after || "";
    const left = /[\s\u201C\u2018「]$/.test(before) || before === "" ? "" : " ";
    const right = /^[\s.,!?;:\u201D\u2019」]/.test(after) || after === "" ? "" : " ";
    return `<p class="story-bit">${esc(before)}${left}<button type="button" class="${cls}" data-action="blank" data-id="${esc(item.id)}" ${locked ? "disabled" : ""}>${esc(label)}</button>${right}${esc(after)}</p>`;
  }

  function bankStoryHtml(step) {
    const bits = step.items.map((item) => blankButton(item)).join("");
    const done = step.items.every((item) => state.play.done[item.id]);
    const next = done ? `<button type="button" class="big-go" data-action="next">繼續</button>` : `<p class="gloss" lang="zh-Hant">點選下面的字，再點空格。也可以拖過去。</p>`;
    return `<section class="panel"><p class="kicker">${esc(step.title)}</p><p lang="zh-Hant">${esc(step.intro || "")}</p>${bits}${next}</section>`;
  }

  function bankHtml(step) {
    const chips = (state.play.chips || []).map((chip) => {
      const used = !!state.play.usedChips[chip.id];
      const selected = state.play.selected === chip.id ? "is-selected" : "";
      return `<button type="button" class="chip ${selected}" data-action="chip" data-chip="${esc(chip.id)}" data-word="${esc(chip.word)}" ${used ? "disabled" : ""}>${esc(chip.word)}</button>`;
    }).join("");
    return `<div class="bank"><div class="bank-tray">${chips}</div></div>`;
  }

  function orderHtml(step) {
    const item = step.items[state.play.i];
    const picked = state.play.picked || [];
    const built = picked.map((id) => {
      const chip = (state.play.chips || []).find((entry) => entry.id === id);
      return chip ? chip.text : "";
    }).join(" ");
    const remain = (state.play.chips || []).filter((chip) => !picked.includes(chip.id)).map((chip) => {
      const flash = state.play.flash === chip.id ? " is-wrong" : "";
      return `<button type="button" class="chip${flash}" data-action="order-chip" data-id="${esc(chip.id)}">${esc(chip.text)}</button>`;
    }).join("");
    const tail = state.play.revealed
      ? `<div class="why teacher-key"><p class="kicker">範例／教師用</p><p class="sample" lang="en">${esc(item.answer)}</p></div><button type="button" class="big-go" data-action="next-order">${state.play.i + 1 >= step.items.length ? "繼續" : "下一句"}</button>`
      : `<div class="bank-tray order-tray">${remain}</div>`;
    return `<section class="panel"><p class="kicker">${esc(step.title)} · ${state.play.i + 1}/${step.items.length}</p><p lang="zh-Hant">${esc(step.intro || "")}</p><p class="built" lang="en">${esc(built || "……")}</p>${state.play.revealed ? "" : answerHold()}${tail}</section>`;
  }

  function gapHtml(step) {
    const item = step.items[state.play.i];
    const bits = [];
    item.blanks.forEach((blank, index) => {
      bits.push(esc(item.parts[index] || ""));
      if (state.play.done[blank.id] || state.play.revealed) {
        bits.push(`<span class="gap-lock" lang="en">${esc(blank.answer)}</span>`);
      } else {
        const wrong = state.play.wrong[blank.id] ? " is-wrong" : "";
        const value = state.play.drafts[blank.id] || "";
        bits.push(`<input class="gap-input${wrong}" data-gap-input="${esc(blank.id)}" ${index === 0 ? "data-focus" : ""} lang="en" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" enterkeyhint="done" value="${esc(value)}" aria-label="填空">`);
      }
    });
    bits.push(esc(item.parts[item.blanks.length] || ""));
    const tail = state.play.revealed
      ? `<div class="why teacher-key"><p class="kicker">範例／教師用</p><p class="sample" lang="en">${esc(item.blanks.map((blank) => blank.answer).join(" · "))}</p></div><button type="button" class="big-go" data-action="next-gap">${state.play.i + 1 >= step.items.length ? "繼續" : "下一句"}</button>`
      : `<button type="button" class="big-go" data-action="check-gap">檢查</button>`;
    return `<section class="panel"><p class="kicker">${esc(step.title)} · ${state.play.i + 1}/${step.items.length}</p><p lang="zh-Hant">${esc(step.intro || "")}</p><p class="gap-sentence">${bits.join("")}</p>${answerHold()}${tail}</section>`;
  }

  function fixHtml(step) {
    const item = step.items[state.play.i];
    const revealed = !!state.play.revealed;
    const field = revealed
      ? ""
      : `<textarea class="type-box" data-fix-input data-focus rows="3" lang="en" spellcheck="false" autocapitalize="sentences" autocomplete="off" autocorrect="off">${esc(state.play.draft || "")}</textarea>`;
    const note = item.note ? `<p lang="zh-Hant">${esc(item.note)}</p>` : "";
    const shown = revealed ? `<div class="why teacher-key"><p class="kicker">範例／教師用</p><p class="sample" lang="en">${esc(item.answer)}</p></div>` : "";
    const action = revealed
      ? `<button type="button" class="big-go" data-action="next-fix">${state.play.i + 1 >= step.items.length ? "繼續" : "下一句"}</button>`
      : `<button type="button" class="big-go" data-action="check-fix">檢查</button>`;
    return `<section class="panel"><p class="kicker">${esc(step.title)} · ${state.play.i + 1}/${step.items.length}</p><p lang="zh-Hant">${esc(step.intro || "")}</p><h2 class="step-title" lang="en">${esc(item.prompt)}</h2>${note}${answerHold()}${field}${shown}${action}</section>`;
  }

  function typeHtml(step) {
    const item = step.items[state.play.i];
    const revealed = !!state.play.revealed;
    const scrambleOn = !!(state.play.scramble && item.scramble);
    const cue = scrambleOn ? item.scramble : item.prompt;
    const mode = step.scramble && !revealed
      ? `<div class="row mode-row"><button type="button" class="text-btn" data-action="cue-zh" aria-pressed="${scrambleOn ? "false" : "true"}">中文</button><button type="button" class="text-btn" data-action="cue-scramble" aria-pressed="${scrambleOn ? "true" : "false"}">打亂字母</button></div>`
      : "";
    const listen = step.listen ? `<button type="button" class="text-btn" data-action="listen">聽老師讀</button>` : "";
    const long = String(item.answer || "").length > 28;
    const field = revealed
      ? ""
      : (long
        ? `<textarea class="type-box" data-type-input data-focus rows="4" lang="en" spellcheck="false" autocapitalize="sentences" autocomplete="off" autocorrect="off">${esc(state.play.draft || "")}</textarea>`
        : `<input class="type-box" data-type-input data-focus lang="en" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" enterkeyhint="done" value="${esc(state.play.draft || "")}" aria-label="英文答案">`);
    const soft = revealed && checks.softOrganising(state.play.draft, item.answer)
      ? `<p lang="zh-Hant">書上是英式拼寫 organising。</p>`
      : "";
    const shown = revealed
      ? `<div class="why teacher-key"><p class="kicker">範例／教師用</p><p class="sample" lang="en">${esc(item.answer)}</p>${soft}</div>`
      : "";
    const action = revealed
      ? `<button type="button" class="big-go" data-action="next-type">${state.play.i + 1 >= step.items.length ? "繼續" : "下一題"}</button>`
      : `<button type="button" class="big-go" data-action="check-type">檢查</button>`;
    return `<section class="panel"><p class="kicker">${esc(step.title)} · ${state.play.i + 1}/${step.items.length}</p><p lang="zh-Hant">${esc(step.intro || "")}</p>${mode}<p class="prompt-word${scrambleOn ? " scramble" : ""}"${langAttr(cue)}>${esc(cue)}</p><div class="row">${listen}</div>${answerHold()}${field}${shown}${action}</section>`;
  }

  function checklistHtml(step) {
    const buttons = step.items.map((label, index) => {
      const on = !!state.play.ticks[index];
      return `<button type="button" class="tick${on ? " is-on" : ""}" data-action="tick" data-id="${index}" aria-pressed="${on ? "true" : "false"}"><span class="tick-box" aria-hidden="true">${on ? "✓" : ""}</span><span>${esc(label)}</span></button>`;
    }).join("");
    const all = step.items.every((_, index) => state.play.ticks[index]);
    const next = all
      ? `<button type="button" class="big-go" data-action="next">完成自查</button>`
      : `<p class="gloss" lang="zh-Hant">逐項勾選。這張清單不計分。</p>`;
    return `<section class="panel"><p class="kicker">自查</p><h2 class="step-title">${esc(step.title)}</h2><p lang="zh-Hant">${esc(step.intro || "")}</p><div class="tick-list">${buttons}</div>${next}</section>`;
  }

  function result() {
    const mod = currentModule();
    const ids = content.modules.map((item) => item.id);
    const nextId = ids[ids.indexOf(mod.id) + 1];
    const shown = state.misses.slice(0, 12);
    const extra = state.misses.length > shown.length
      ? `<p class="gloss" lang="zh-Hant">還有 ${state.misses.length - shown.length} 題。再玩一次可以看完整遍。</p>`
      : "";
    const misses = state.misses.length
      ? `<h3>再看一眼</h3><p class="kicker">範例／教師用</p><ul class="miss-list">${shown.map((miss) => `<li><strong${langAttr(miss.q)}>${esc(miss.q)}</strong><br><span lang="en">答案：${esc(miss.a)}</span>${miss.why ? `<br><span class="gloss"${langAttr(miss.why)}>${esc(miss.why)}</span>` : ""}</li>`).join("")}</ul>${extra}`
      : `<p lang="zh-Hant">全部一次過！太棒了！</p>`;
    const all = content.modules.every((item) => (state.progress[item.id] || {}).stars > 0);
    const headline = state.earned === 3 ? "三星！" : state.earned === 2 ? "兩星，好厲害！" : "過關！再玩可以拿更多星。";
    return `<div class="main"><section class="panel">
      <p class="kicker">${esc(mod.zh)}完成</p>
      <h2 class="step-title">${headline}</h2>
      <div class="score-stars" aria-label="${state.earned} stars">${stars(state.earned)}</div>
      <p lang="zh-Hant">${state.perfect}/${state.total} 題第一次就對 · ${state.score} 分</p>
      ${misses}
      ${all ? `<div class="why"><strong lang="en">${esc(content.motto)}</strong><p lang="zh-Hant">五關都練過了。默書當日記住這句話。</p></div>` : ""}
      <div class="row">
        <button type="button" class="big-go" data-action="replay">再玩一次</button>
        ${nextId ? `<button type="button" class="text-btn" data-action="open" data-module="${esc(nextId)}">下一關</button>` : ""}
        <button type="button" class="text-btn" data-action="home">回主頁</button>
      </div>
      <p class="footer-note">${esc(content.footer)}</p>
    </section></div>`;
  }

  function onMcq(option) {
    const step = currentStep();
    if (!step || state.play.revealed) return;
    const item = seriesItem(step);
    const prompt = item.q || item.word;
    if (option === item.answer) {
      const first = Object.keys(state.play.disabled).length === 0;
      record(first, prompt, item.answer, item.why || "");
      state.play.revealed = true;
      state.play.flash = null;
      state.play.message = { ok: true, text: first ? "太棒了！" : "今次對了！" };
      render(false);
      return;
    }
    state.play.disabled[option] = true;
    state.play.flash = option;
    buzz();
    state.play.message = { ok: false, text: "再試一次。" };
    render(false);
  }

  function nextInner() {
    const step = currentStep();
    if (step.items && state.play.i + 1 < step.items.length) {
      state.play.i += 1;
      state.play.revealed = false;
      state.play.disabled = {};
      state.play.flash = null;
      state.play.message = null;
      const item = step.items[state.play.i];
      if (item.options) state.play.options = shuffle(item.options.slice());
      render(true);
      return;
    }
    nextStep();
  }

  function onHunt(id) {
    const step = currentStep();
    if (state.play.locked) return;
    const index = state.play.order[state.play.i];
    const item = step.items[index];
    if (id === item.answer) {
      state.play.locked = true;
      const key = `icon:${index}`;
      const first = !state.play.tries[key];
      record(first, item.say, item.answer, "");
      const gloss = content.gloss[item.answer] ? ` ${content.gloss[item.answer]}` : "";
      state.play.message = { ok: true, text: `好眼力！ ${item.answer}${gloss}` };
      render(false);
      const token = state.play;
      setTimeout(() => {
        if (state.screen !== "play" || state.play !== token) return;
        state.play.locked = false;
        state.play.message = null;
        if (state.play.i + 1 >= step.items.length) nextStep();
        else {
          state.play.i += 1;
          render(false);
        }
      }, 560);
      return;
    }
    const key = `icon:${index}`;
    state.play.tries[key] = (state.play.tries[key] || 0) + 1;
    buzz();
    feedback(false, "再看看。");
  }

  function onOrderChip(id) {
    const step = currentStep();
    if (!step || state.play.revealed) return;
    const item = step.items[state.play.i];
    const chip = (state.play.chips || []).find((entry) => entry.id === id);
    if (!chip || state.play.picked.includes(id)) return;
    const expect = item.chips[state.play.picked.length];
    if (chip.text === expect) {
      state.play.picked.push(id);
      state.play.flash = null;
      if (state.play.picked.length === item.chips.length) {
        const first = state.play.clean !== false;
        record(first, "排好詞序", item.answer, "");
        state.play.revealed = true;
        state.play.message = { ok: true, text: first ? "次序排好了！" : "排好了。記住正確句子。" };
      } else {
        state.play.message = { ok: true, text: "對，下一個。" };
      }
      render(false);
      return;
    }
    state.play.clean = false;
    state.play.flash = id;
    buzz();
    state.play.message = { ok: false, text: "還不是這個詞。" };
    render(false);
  }

  function nextOrder() {
    const step = currentStep();
    if (state.play.i + 1 >= step.items.length) {
      nextStep();
      return;
    }
    state.play.i += 1;
    const item = step.items[state.play.i];
    state.play.chips = shuffle(item.chips.map((text, index) => ({ id: `o${state.play.i}-${index}`, text: text })));
    state.play.picked = [];
    state.play.clean = true;
    state.play.revealed = false;
    state.play.flash = null;
    state.play.message = null;
    render(true);
  }

  function syncGap() {
    document.querySelectorAll("[data-gap-input]").forEach((el) => {
      state.play.drafts[el.dataset.gapInput] = el.value;
    });
  }

  function gapLabel(item) {
    let text = "";
    item.blanks.forEach((blank, index) => {
      text += `${item.parts[index] || ""}______`;
    });
    text += item.parts[item.blanks.length] || "";
    return text.replace(/\s+/g, " ").trim();
  }

  function onCheckGap() {
    const step = currentStep();
    if (!step || step.kind !== "gap" || state.play.revealed) return;
    syncGap();
    const item = step.items[state.play.i];
    const pending = item.blanks.filter((blank) => !state.play.done[blank.id]);
    if (pending.some((blank) => !String(state.play.drafts[blank.id] || "").trim())) {
      feedback(false, "請填好所有空格。");
      return;
    }
    const label = gapLabel(item);
    pending.forEach((blank) => {
      if (checks.answersMatch(state.play.drafts[blank.id], blank.answer)) {
        const first = !state.play.tries[blank.id];
        state.play.done[blank.id] = true;
        state.play.wrong[blank.id] = false;
        record(first, label, blank.answer, "");
      } else {
        state.play.wrong[blank.id] = true;
        state.play.tries[blank.id] = (state.play.tries[blank.id] || 0) + 1;
      }
    });
    const still = item.blanks.filter((blank) => !state.play.done[blank.id]);
    if (!still.length) {
      state.play.revealed = true;
      state.play.message = { ok: true, text: "填對了！" };
      render(false);
      return;
    }
    if (still.every((blank) => (state.play.tries[blank.id] || 0) >= 3)) {
      still.forEach((blank) => {
        record(false, label, blank.answer, "");
        state.play.done[blank.id] = true;
      });
      state.play.revealed = true;
      state.play.message = { ok: false, text: "看看正確答案。" };
      render(false);
      return;
    }
    buzz();
    state.play.message = { ok: false, text: "有空格還未對。再試一次。" };
    render(false);
  }

  function nextGap() {
    const step = currentStep();
    if (state.play.i + 1 >= step.items.length) {
      nextStep();
      return;
    }
    state.play.i += 1;
    state.play.revealed = false;
    state.play.message = null;
    render(true);
  }

  function readField(selector) {
    const box = document.querySelector(selector);
    if (box) state.play.draft = box.value;
    return state.play.draft || "";
  }

  function finishTyped(item, prompt, okText) {
    const first = !state.play.tries[item.id];
    record(first, prompt, item.answer, "");
    state.play.revealed = true;
    const soft = checks.softOrganising(state.play.draft, item.answer);
    state.play.message = {
      ok: true,
      text: soft ? "接受了。書上是英式拼寫 organising。" : (first ? okText : "今次對了！"),
    };
    render(false);
  }

  function missTyped(item, prompt) {
    state.play.tries[item.id] = (state.play.tries[item.id] || 0) + 1;
    if (state.play.tries[item.id] >= 3) {
      record(false, prompt, item.answer, "");
      state.play.revealed = true;
      state.play.message = { ok: false, text: "看看正確答案。" };
      render(false);
      return;
    }
    buzz();
    state.play.message = { ok: false, text: "還未對。再試一次。" };
    render(false);
  }

  function onCheckFix() {
    const step = currentStep();
    if (!step || step.kind !== "fix" || state.play.revealed) return;
    const item = step.items[state.play.i];
    const typed = readField("[data-fix-input]").trim();
    if (!typed) {
      feedback(false, "請先輸入改好的英文。");
      return;
    }
    if (checks.answersMatch(typed, item.answer)) {
      finishTyped(item, item.prompt, "改對了！");
      return;
    }
    missTyped(item, item.prompt);
  }

  function nextIndexed() {
    const step = currentStep();
    if (state.play.i + 1 >= step.items.length) {
      nextStep();
      return;
    }
    state.play.i += 1;
    state.play.draft = "";
    state.play.revealed = false;
    state.play.message = null;
    render(true);
  }

  function onCheckType() {
    const step = currentStep();
    if (!step || step.kind !== "type" || state.play.revealed) return;
    const item = step.items[state.play.i];
    const typed = readField("[data-type-input]").trim();
    if (!typed) {
      feedback(false, "請先輸入英文。");
      return;
    }
    if (checks.answersMatch(typed, item.answer)) {
      finishTyped(item, item.prompt || item.answer, "寫對了！");
      return;
    }
    missTyped(item, item.prompt || item.answer);
  }

  function placeBank(chipId, blankId) {
    const step = currentStep();
    const chip = (state.play.chips || []).find((entry) => entry.id === chipId);
    if (!chip || state.play.usedChips[chipId]) return;
    const item = step.items.find((entry) => entry.id === blankId);
    if (!item || state.play.done[item.id]) return;
    const accept = item.accept || [item.answer];
    const prompt = `${item.before} ______ ${item.after}`.replace(/\s+/g, " ").trim();
    if (accept.includes(chip.word)) {
      const first = !state.play.tries[item.id];
      state.play.usedChips[chipId] = blankId;
      state.play.slots[item.id] = chip.word;
      state.play.done[item.id] = true;
      state.play.selected = null;
      record(first, prompt, accept.join(" / "), item.hint || "");
      state.play.message = { ok: true, text: first ? "放對了！" : "今次對了！" };
      render(false);
      return;
    }
    state.play.tries[item.id] = (state.play.tries[item.id] || 0) + 1;
    if (state.play.tries[item.id] >= 3) {
      const match = (state.play.chips || []).find((entry) => entry.word === item.answer && !state.play.usedChips[entry.id]);
      if (match) state.play.usedChips[match.id] = item.id;
      state.play.slots[item.id] = item.answer;
      state.play.done[item.id] = true;
      state.play.selected = null;
      record(false, prompt, accept.join(" / "), item.hint || "");
      state.play.message = { ok: false, text: `範例／教師用：${item.answer}` };
      render(false);
      return;
    }
    const blank = document.querySelector(`[data-action="blank"][data-id="${cssEscape(item.id)}"]`);
    if (blank) {
      blank.classList.add("is-wrong");
      setTimeout(() => blank.classList.remove("is-wrong"), 350);
    }
    buzz();
    feedback(false, state.play.tries[item.id] >= 2 && item.hint ? item.hint : "再試一次。這個字不是這裡。");
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/"/g, "");
  }

  function wireDrag() {
    document.querySelectorAll(".chip[data-chip]").forEach((chip) => {
      chip.addEventListener("pointerdown", (event) => {
        if (chip.disabled) return;
        chip.setPointerCapture(event.pointerId);
        const word = chip.dataset.word;
        const chipId = chip.dataset.chip;
        let moved = false;
        const ghost = document.createElement("div");
        ghost.className = "ghost-chip";
        ghost.textContent = word;
        const move = (ev) => {
          if (Math.abs(ev.clientX - event.clientX) + Math.abs(ev.clientY - event.clientY) > 12) {
            moved = true;
            if (!ghost.parentNode) document.body.appendChild(ghost);
          }
          ghost.style.left = `${ev.clientX}px`;
          ghost.style.top = `${ev.clientY}px`;
        };
        const up = (ev) => {
          ghost.remove();
          chip.removeEventListener("pointermove", move);
          chip.removeEventListener("pointerup", up);
          if (!moved) return;
          suppressClick = true;
          setTimeout(() => { suppressClick = false; }, 400);
          const el = document.elementFromPoint(ev.clientX, ev.clientY);
          const blank = el && el.closest("[data-action='blank']");
          if (blank && chipId) placeBank(chipId, blank.dataset.id);
        };
        chip.addEventListener("pointermove", move);
        chip.addEventListener("pointerup", up);
      });
    });
  }

  app.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === "sound") {
      state.sound = !state.sound;
      save();
      if (state.sound) beep(660, 0.08);
      render(false);
      return;
    }
    if (action === "teacher") {
      state.teacher = !state.teacher;
      save();
      render(false);
      return;
    }
    if (action === "home") {
      state.screen = "home";
      state.moduleId = null;
      render(true);
      return;
    }
    if (action === "open") {
      startModule(button.dataset.module);
      return;
    }
    if (action === "help") {
      state.showHelp = !state.showHelp;
      render(false);
      return;
    }
    if (action === "speak") {
      speak(button.dataset.word);
      return;
    }
    if (action === "listen") {
      const step = currentStep();
      const item = step && step.items ? step.items[state.play.i] : null;
      if (item) speak(item.answer);
      return;
    }
    if (action === "next") {
      nextStep();
      return;
    }
    if (action === "replay") {
      startModule(state.moduleId);
      return;
    }
    if (action === "reset") {
      state.confirmReset = true;
      render(false);
      return;
    }
    if (action === "reset-yes") {
      state.progress = {};
      state.confirmReset = false;
      save();
      render(false);
      return;
    }
    if (action === "mcq") {
      onMcq(button.dataset.option);
      return;
    }
    if (action === "next-inner") {
      nextInner();
      return;
    }
    if (action === "hunt") {
      onHunt(button.dataset.id);
      return;
    }
    if (action === "order-chip") {
      onOrderChip(button.dataset.id);
      return;
    }
    if (action === "next-order") {
      nextOrder();
      return;
    }
    if (action === "chip") {
      const token = button.dataset.chip;
      state.play.selected = state.play.selected === token ? null : token;
      render(false);
      return;
    }
    if (action === "blank") {
      if (!state.play.selected) {
        feedback(false, "先點下面的字。");
        return;
      }
      placeBank(state.play.selected, button.dataset.id);
      return;
    }
    if (action === "check-gap") {
      onCheckGap();
      return;
    }
    if (action === "next-gap") {
      nextGap();
      return;
    }
    if (action === "check-fix") {
      onCheckFix();
      return;
    }
    if (action === "next-fix") {
      nextIndexed();
      return;
    }
    if (action === "check-type") {
      onCheckType();
      return;
    }
    if (action === "next-type") {
      nextIndexed();
      return;
    }
    if (action === "cue-zh" || action === "cue-scramble") {
      readField("[data-type-input]");
      state.play.scramble = action === "cue-scramble";
      render(false);
      return;
    }
    if (action === "tick") {
      const id = button.dataset.id;
      state.play.ticks[id] = !state.play.ticks[id];
      render(false);
    }
  });

  app.addEventListener("input", (event) => {
    if (!state.play) return;
    const gap = event.target.closest("[data-gap-input]");
    if (gap) state.play.drafts[gap.dataset.gapInput] = gap.value;
    const fix = event.target.closest("[data-fix-input]");
    if (fix) state.play.draft = fix.value;
    const typed = event.target.closest("[data-type-input]");
    if (typed) state.play.draft = typed.value;
  });

  app.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (event.target.closest("textarea")) return;
    if (event.target.closest("[data-fix-input]")) {
      event.preventDefault();
      onCheckFix();
    } else if (event.target.closest("[data-type-input]")) {
      event.preventDefault();
      onCheckType();
    } else if (event.target.closest("[data-gap-input]")) {
      event.preventDefault();
      onCheckGap();
    }
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  load();
  render(true);
})();
