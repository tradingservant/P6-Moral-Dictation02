const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.join(__dirname, "..");
const code = fs.readFileSync(path.join(root, "js/content.js"), "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const content = sandbox.P6_CONTENT;
const checks = content.checks;

const failures = [];
function assert(cond, message) {
  if (!cond) failures.push(message);
}

assert(content.title === "Moral · Dictation (2) · Module 2 U3&4", "title");
assert(content.subtitle === "Vocabulary · Recitation · Passage · Grammar · Dictation", "subtitle");
assert(content.motto === "Spell carefully. Listen carefully. Write carefully!", "motto");
assert(content.hub === "五關：14 個詞彙、兩句背誦、Amy／Peter 短文、too／very few／although／because、聽寫模擬", "hub");
assert(content.footer === "Moral · Dictation (2) · v1.0", "footer");
assert(content.version === "v1.0", "version");
assert(content.storageKey === "p6-moral-dictation02-v1.0", "storage");
assert(content.student === "Moral" && content.studentEn === "Lai Ho Shing" && content.className === "P6C", "student");
assert(content.date === "27th November, 2026 (Friday)", "date");

const ids = content.modules.map((mod) => mod.id);
assert(ids.join() === "vocab,recite,passage,grammar,dictation", "module ids");

const hues = {
  vocab: "#0b5cab",
  recite: "#6c4ed4",
  passage: "#0e8f7a",
  grammar: "#c45c26",
  dictation: "#e07a2f",
};
const names = {
  vocab: ["詞彙", "Vocabulary"],
  recite: ["背誦", "Recitation"],
  passage: ["短文", "Passage"],
  grammar: ["文法診所", "Grammar"],
  dictation: ["聽寫模擬", "Dictation"],
};
content.modules.forEach((mod) => {
  assert(mod.hue === hues[mod.id], `${mod.id} hue ${mod.hue}`);
  assert(mod.zh === names[mod.id][0] && mod.en === names[mod.id][1], `${mod.id} name`);
  assert(/[\u4e00-\u9fff]/.test(mod.help), `${mod.id} help Chinese`);
  assert(mod.blurb && mod.blurb.trim(), `${mod.id} blurb`);
});

const glossKeys = [
  "earthquake", "expensive", "typhoon", "dangerous", "drought", "support", "tsunami",
  "search", "flood", "flags", "healthy", "sincerely", "bright", "sponsor",
  "aid worker", "crowded small hut", "beetles", "sore throat", "charity work",
  "fundraising event", "second-hand stall", "donate money", "activities",
  "treasure everything", "too + adjective", "very few + plural noun", "although", "because",
];
glossKeys.forEach((key) => assert(content.gloss[key], `gloss ${key}`));
assert(content.gloss.activities === "活動（不是 events）", "activities gloss");
assert(content.gloss.search === "搜尋／尋找", "search gloss");
assert(content.gloss.flags === "旗（賣旗用）", "flags gloss");
assert(content.gloss.bright === "明亮的／聰明的", "bright gloss");
assert(content.gloss.sincerely === "誠懇地（書信結尾）", "sincerely gloss");

assert(content.pictures.length === 14, "14 pictures");
assert(content.pictures.map((pic) => pic.id).join("") === "ABCDEFGHIJKLMN", "picture letters");
assert(content.pictures[0].word === "earthquake" && content.pictures[13].word === "sponsor", "A and N");
const emojiSet = new Set(content.pictures.map((pic) => pic.emoji));
assert(emojiSet.size === 14, "distinct emoji");

const expectedCounts = { vocab: 43, recite: 11, passage: 21, grammar: 15, dictation: 18 };
let total = 0;
content.modules.forEach((mod) => {
  const n = mod.steps.reduce((sum, step) => sum + checks.countItems(step), 0);
  total += n;
  assert(n === expectedCounts[mod.id], `${mod.id} graded ${n} !== ${expectedCounts[mod.id]}`);
});
assert(total === 108, `total graded ${total}`);

function findStep(modId, kind, title) {
  const mod = content.modules.find((item) => item.id === modId);
  return mod.steps.find((step) => step.kind === kind && (!title || step.title === title));
}

content.modules.forEach((mod) => {
  mod.steps.forEach((step) => {
    if (step.kind === "mcq") {
      step.items.forEach((item) => {
        assert(/[\u4e00-\u9fff]/.test(item.q), `mcq Chinese q: ${item.q}`);
        assert(!/[\u4e00-\u9fff]/.test(item.answer), `mcq English answer: ${item.answer}`);
        assert(item.options.includes(item.answer), `mcq option has answer: ${item.q}`);
        assert(new Set(item.options).size === item.options.length, `mcq unique options: ${item.q}`);
      });
    }
    if (step.kind === "bank") {
      const need = {};
      step.items.forEach((item) => {
        (item.accept || [item.answer]).forEach((word) => {
          need[word] = (need[word] || 0) + 1;
        });
        assert(item.hint && item.hint.trim(), `bank hint ${item.id}`);
        assert(!/[\u4e00-\u9fff]/.test(item.answer), `bank answer English ${item.id}`);
      });
      const have = {};
      step.bank.forEach((word) => { have[word] = (have[word] || 0) + 1; });
      Object.entries(need).forEach(([word, count]) => {
        assert((have[word] || 0) >= count, `${mod.id} bank needs ${count} × ${word}, has ${have[word] || 0}`);
      });
    }
  });
});

const vocab = content.modules.find((mod) => mod.id === "vocab");
const spelling = findStep("vocab", "mcq").items.map((item) => item.answer);
assert(spelling.join("|") === ["drought", "tsunami", "sincerely", "expensive", "earth-quake"].join("|"), "spelling mcq");
assert(findStep("vocab", "mcq").items[0].options.join("|") === "drought|drout|draught|drougt", "drought traps");

const hunt = findStep("vocab", "iconHunt");
assert(hunt.items.length === 14, "icon hunt 14");
const huntPairs = [
  ["地震", "earthquake"],
  ["昂貴的", "expensive"],
  ["颱風", "typhoon"],
  ["危險的", "dangerous"],
  ["乾旱", "drought"],
  ["支持", "support"],
  ["海嘯", "tsunami"],
  ["搜尋／尋找", "search"],
  ["水災／洪水", "flood"],
  ["旗", "flags"],
  ["健康的", "healthy"],
  ["誠懇地", "sincerely"],
  ["明亮的", "bright"],
  ["贊助", "sponsor"],
];
hunt.items.forEach((item, index) => {
  assert(item.say === huntPairs[index][0] && item.answer === huntPairs[index][1], `hunt ${index} ${item.say}`);
  assert(content.icons[item.answer], `icon ${item.answer}`);
});

const syllables = findStep("vocab", "syllableMatch");
assert(syllables.items.length === 10, "syllable drill 10");
const syllableAnswers = ["earth-quake", "ex-pen-sive", "ty-phoon", "dan-ger-ous", "drought", "sup-port", "tsu-na-mi", "heal-thy", "sin-cere-ly", "spon-sor"];
assert(syllables.items.map((item) => item.answer).join("|") === syllableAnswers.join("|"), "syllable answers");
syllables.items.forEach((item) => {
  assert(item.options.includes(item.answer), `syllable option ${item.word}`);
  assert(item.options.length === 4, `four choices ${item.word}`);
  assert(new Set(item.options).size === 4, `unique syllables ${item.word}`);
  item.options.forEach((option) => assert(syllableAnswers.includes(option), `real split only ${option}`));
  assert(checks.syllableOf(item.word) === item.answer, `syllableOf ${item.word}`);
});
["search", "flood", "flags", "bright"].forEach((word) => {
  assert(checks.syllableOf(word) === word, `self syllable ${word}`);
  assert(!syllables.items.some((item) => item.word === word), `${word} stays out of the 10`);
});

const vocabBank = findStep("vocab", "bank");
assert(vocabBank.items.length === 14, "vocab bank 14");
const bankMap = Object.fromEntries(vocabBank.items.map((item) => [item.id, item.answer]));
assert(bankMap.eq === "earthquake" && bankMap.sin === "sincerely" && bankMap.sp === "sponsor", "bank ids");
assert(vocabBank.items.find((item) => item.id === "sp").after === "for the event.", "sponsor sentence keeps event");

const reciteMod = content.modules.find((mod) => mod.id === "recite");
const order = findStep("recite", "order");
assert(order.items.length === 2, "two recite orders");
order.items.forEach((item) => {
  assert(item.chips.join(" ") === item.answer, `chips join ${item.id}`);
});
assert(order.items[0].answer === "Although they often get sick, they do not have enough money to buy medicine.", "recite 1");
assert(order.items[1].answer === "People can't drink the water because it's too dirty.", "recite 2");
assert(order.items[0].chips.filter((chip) => chip === "they").length === 2, "two they chips");

const gap = findStep("recite", "gap");
const blanks = gap.items.flatMap((item) => item.blanks.map((blank) => blank.answer));
assert(blanks.join("|") === "Although|medicine|can't|because|too", "gap blanks");
assert(checks.countItems(gap) === 5, "gap scores five");

const meaning = findStep("recite", "mcq").items;
assert(meaning[0].answer === "They often get sick but have no money for medicine.", "meaning English");
assert(meaning[1].answer === "too dirty", "water meaning");
assert(!/[\u4e00-\u9fff]/.test(meaning[0].options.join(" ")), "meaning options English");

const reciteType = findStep("recite", "type");
assert(reciteType.items.map((item) => item.answer).join(" || ") === order.items.map((item) => item.answer).join(" || "), "type matches recite");

const passage = findStep("passage", "teach", "改正後的短文");
const passageText = passage.passage.join("\n");
const plain = passageText.replace(/\*\*/g, "");
const expectedPlain = [
  "Amy is an aid worker. She spent two months in Laos with Annie. The life in Laos is hard. Annie and her family only live in a crowded small hut. They need to go to the forest to search for beetles. When there is a drought, people may have very little food because a lot of plants die. Amy had a sore throat. She was scared because there are very few doctors in Laos.",
  "Peter is planning to do some charity work to help the poor. He suggests organising a fundraising event. He wants to run a second-hand stall to sell some old clothes. He also wants to invite his classmates to donate money to the poor. He thinks these are meaningful activities for everyone to learn to treasure everything. He hopes that more students will support it.",
].join("\n");
assert(plain === expectedPlain, "passage plain text");
[
  "spent two months",
  "crowded small hut",
  "to search for beetles",
  "When there is a drought",
  "very little food",
  "lot of plants die",
  "very few doctors",
  "to do some charity work to help the poor",
  "organising a fundraising event",
  "to sell some old clothes",
  "donate money",
  "activities",
  "learn to treasure everything",
  "will support it",
].forEach((phrase) => assert(passageText.includes(`**${phrase}**`), `bold ${phrase}`));
assert(!passageText.includes("events"), "passage body has no events");
assert(!/organizing/i.test(passageText), "passage uses organising");
assert(passage.callout.includes("events") && passage.callout.includes("activities"), "callout names the fix");
assert(passage.callout.includes("organising"), "callout names organising");

const passageMcq = findStep("passage", "mcq").items.map((item) => item.answer);
assert(passageMcq.join("|") === [
  "an aid worker",
  "two months",
  "a crowded small hut",
  "a lot of plants die",
  "has very few doctors",
  "organising a fundraising event",
  "a second-hand stall",
  "activities",
].join("|"), "passage mcq");
assert(findStep("passage", "mcq").items[7].why.includes("events → activities"), "activities why");

const phraseBank = findStep("passage", "bank");
assert(phraseBank.items.length === 10, "passage bank 10");
assert(phraseBank.items.some((item) => item.answer === "activities"), "bank activities");
assert(phraseBank.items.some((item) => item.answer === "organising a fundraising event"), "bank organising");
assert(!phraseBank.bank.includes("events"), "bank does not offer events");
assert(!phraseBank.items.some((item) => item.answer === "to search for beetles"), "beetles phrase is the fix step");

const passageFix = findStep("passage", "fix");
assert(passageFix.items.map((item) => item.answer).join("|") === "meaningful activities|very few doctors|to search for beetles", "passage fixes");
assert(passageFix.items[0].prompt.includes("meaningful events"), "events prompt");

const grammarMcq = findStep("grammar", "mcq").items.map((item) => item.answer);
assert(grammarMcq.join("|") === "too|very few|Although|because|too dirty|very few", "grammar mcq");
const grammarBank = findStep("grammar", "bank");
assert(grammarBank.bank.filter((word) => word === "too").length === 2, "two too chips");
assert(grammarBank.bank.filter((word) => word === "very few").length === 2, "two very few chips");
const grammarFix = findStep("grammar", "fix");
assert(grammarFix.items[0].answer === "The water is too dirty.", "too dirty fix");
assert(grammarFix.items[1].answer === "There are very few doctors.", "very few doctors fix");
assert(grammarFix.items[2].answer === order.items[0].answer, "although pattern fix");

const dictation = content.modules.find((mod) => mod.id === "dictation");
const typeSteps = dictation.steps.filter((step) => step.kind === "type");
assert(typeSteps.length === 3, "three dictation type steps");
assert(typeSteps[0].items.length === 14 && typeSteps[0].scramble === true, "vocab dictation");
assert(typeSteps[0].items.map((item) => `${item.prompt}→${item.answer}`).join("|") === hunt.items.map((item) => `${item.say}→${item.answer}`).join("|"), "dictation cues match hunt");
function letters(value) {
  return String(value).toLowerCase().replace(/[^a-z]/g, "").split("").sort().join("");
}
typeSteps[0].items.forEach((item) => {
  assert(letters(item.scramble) === letters(item.answer), `anagram ${item.answer}`);
  assert(item.scramble !== item.answer.split("").join("-"), `shuffled ${item.answer}`);
});
assert(typeSteps[1].items.length === 2, "two recite dictations");
assert(typeSteps[2].items.length === 2, "two graded chunks");
assert(typeSteps[2].teacherBank.length === 3, "teacher bank has three chunks");
assert(typeSteps[2].items.some((item) => item.answer.includes("meaningful activities")), "graded activities chunk");
assert(typeSteps[2].items.some((item) => item.answer.includes("very little food")), "graded drought chunk");
assert(typeSteps[2].teacherBank.some((item) => item.answer.startsWith("Amy is an aid worker")), "teacher bank keeps Amy");
assert(typeSteps[2].teacherBank[0].prompt === "Amy 是援助工作者。她在老撾和 Annie 待了兩個月。", "d1 cue");
const list = dictation.steps.find((step) => step.kind === "checklist");
assert(list.items.length === 5, "five checks");
assert(list.items[3] === "activities 唔係 events？", "checklist activities");
assert(checks.countItems(list) === 0, "checklist ungraded");

const r1 = order.items[0].answer;
const r2 = order.items[1].answer;
assert(checks.answersMatch("  Although they often get sick they do not have enough money to buy medicine. ", r1), "comma optional");
assert(checks.answersMatch("although they often get sick, they do not have enough money to buy medicine", r1), "case fold");
assert(!checks.answersMatch("Although they often get sick, they do not have enough money to buy medicin.", r1), "medicine spelling");
assert(checks.answersMatch("People can’t drink the water because it’s too dirty!", r2), "curly apostrophe");
assert(!checks.answersMatch("People cant drink the water because its too dirty.", r2), "apostrophe required");
assert(!checks.answersMatch("People cannot drink the water because it is too dirty.", r2), "can't stays can't");
assert(checks.answersMatch("He suggests organizing a fundraising event", "He suggests organising a fundraising event."), "soft organising");
assert(checks.softOrganising("organizing a fundraising event", "organising a fundraising event"), "soft flag");
assert(!checks.softOrganising("organising a fundraising event", "organising a fundraising event"), "british is not the soft path");
assert(!checks.answersMatch("meaningful events", "meaningful activities"), "events is not activities");
assert(!checks.answersMatch("There are very little doctors.", "There are very few doctors."), "very little doctors fails");
assert(checks.answersMatch("The water is too dirty", "The water is too dirty."), "fix period optional");
assert(checks.answersMatch("meaningful activities", "meaningful activities"), "activities exact");

const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const manifest = fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
assert(game.includes("content.storageKey"), "game stores progress");
assert(game.includes("function showModel"), "reveal gate");
assert(game.includes("hiddenNote"), "hidden until submit or teacher");
assert(game.includes("範例／教師用"), "teacher samples are labelled");
assert(game.includes("教師模式"), "teacher toggle");
assert(!game.includes("enough money to buy medicine"), "recite answer stays in content");
assert(!game.includes("meaningful activities"), "activities answer stays in content");
assert(!game.includes("very little food because"), "chunk answer stays in content");
assert(!html.includes("tsunami") && !html.includes("organising") && !html.includes("activities"), "html has no answer key");
assert(!html.includes("Although they often"), "html has no recite sentence");
assert(!html.includes(".pdf"), "no worksheet PDF link");
assert(html.includes("manifest.webmanifest"), "manifest link");
assert(html.includes("js/content.js") && html.includes("js/game.js"), "scripts");
assert(html.includes('lang="zh-Hant"'), "page language");
assert(sw.includes("p6-moral-dictation02-v1.0"), "service worker cache");
assert(sw.includes("./index.html") && sw.includes("./js/content.js") && sw.includes("fetch"), "service worker assets");
assert(manifest.includes("Moral · Dictation (2)") && manifest.includes("standalone"), "manifest");
assert(manifest.includes("192x192") && manifest.includes("512x512"), "manifest icons");
assert(fs.existsSync(path.join(root, ".nojekyll")), "nojekyll for Pages later");
assert(fs.existsSync(path.join(root, "icons/favicon.svg")), "favicon");
const png192 = fs.readFileSync(path.join(root, "icons/icon-192.png"));
const png512 = fs.readFileSync(path.join(root, "icons/icon-512.png"));
assert(png192[0] === 0x89 && png192[1] === 0x50, "192 png");
assert(png512[0] === 0x89 && png512[1] === 0x50, "512 png");
assert(/[\u4e00-\u9fff]/.test(readme) && /Open locally/.test(readme), "readme bilingual");
assert(readme.includes("python3 -m http.server"), "local server");
assert(readme.includes("main") && readme.includes("root"), "pages main/root");
assert(/pull request/i.test(readme), "pr workflow");
assert(/secrets|密鑰/.test(readme), "no secrets note");
assert(readme.includes("activities") && readme.includes("organising"), "locked decisions");

function walk(dir, out) {
  fs.readdirSync(dir).forEach((name) => {
    if (name === ".git" || name === "node_modules") return;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  });
  return out;
}
const files = walk(root, []);
assert(!files.some((file) => file.toLowerCase().endsWith(".pdf")), "no PDF scans");
const banned = [/AKIA[0-9A-Z]{16}/, /ghp_[A-Za-z0-9]{20,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /xox[baprs]-/];
files.forEach((file) => {
  if (file.endsWith(".png")) return;
  const text = fs.readFileSync(file, "utf8");
  banned.forEach((pattern) => assert(!pattern.test(text), `secret-like pattern in ${path.relative(root, file)}`));
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`ok · ${content.footer} · graded ${total}`);
