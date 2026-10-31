/* Moral · Dictation (2) — Module 2 Unit 3 & 4
   Practice answers live on step items. The game hides 範例／教師用
   until the student submits that item, or teacher mode is on.
   Source of truth: P6-Moral-Dictation02 content spec. */
(function () {
  const LETTERS = "ABCDEFGHIJKLMN";

  const words = [
    { letter: "A", id: "eq", word: "earthquake", syllables: "earth-quake", say: "地震", gloss: "地震", emoji: "🌍", scramble: "q-u-a-k-e-a-h-t-r-e", hint: "地震。", before: "The", after: "shook the buildings.", drill: true },
    { letter: "B", id: "exp", word: "expensive", syllables: "ex-pen-sive", say: "昂貴的", gloss: "昂貴的", emoji: "🏷️", scramble: "e-v-i-s-n-e-p-x-e", hint: "昂貴。", before: "The medicine is too", after: "for poor families.", drill: true },
    { letter: "C", id: "ty", word: "typhoon", syllables: "ty-phoon", say: "颱風", gloss: "颱風", emoji: "🌀", scramble: "n-o-o-h-p-y-t", hint: "颱風。", before: "A strong", after: "hit Hong Kong.", drill: true },
    { letter: "D", id: "dan", word: "dangerous", syllables: "dan-ger-ous", say: "危險的", gloss: "危險的", emoji: "⚠️", scramble: "s-u-o-r-e-g-n-a-d", hint: "危險。", before: "Crossing the river is", after: ".", drill: true },
    { letter: "E", id: "dr", word: "drought", syllables: "drought", say: "乾旱", gloss: "乾旱", emoji: "🏜️", scramble: "t-h-g-u-o-r-d", hint: "乾旱。", before: "During a", after: ", plants die.", drill: true },
    { letter: "F", id: "su", word: "support", syllables: "sup-port", say: "支持", gloss: "支持", emoji: "🤝", scramble: "t-r-o-p-p-u-s", hint: "支持。", before: "I hope more students will", after: "the charity.", drill: true },
    { letter: "G", id: "ts", word: "tsunami", syllables: "tsu-na-mi", say: "海嘯", gloss: "海嘯", emoji: "🌊", scramble: "i-m-a-n-u-s-t", hint: "海嘯。", before: "A", after: "is a huge sea wave.", drill: true },
    { letter: "H", id: "se", word: "search", syllables: "search", say: "搜尋／尋找", gloss: "搜尋／尋找", emoji: "🔍", scramble: "h-c-r-a-e-s", hint: "尋找。", before: "They go to the forest to", after: "for beetles.", drill: false },
    { letter: "I", id: "fl", word: "flood", syllables: "flood", say: "水災／洪水", gloss: "水災／洪水", emoji: "💧", scramble: "d-o-o-l-f", hint: "水災。", before: "Heavy rain caused a", after: ".", drill: false },
    { letter: "J", id: "flg", word: "flags", syllables: "flags", say: "旗", gloss: "旗（賣旗用）", emoji: "🚩", scramble: "s-g-a-l-f", hint: "賣旗。", before: "We sell", after: "to raise money.", drill: false },
    { letter: "K", id: "he", word: "healthy", syllables: "heal-thy", say: "健康的", gloss: "健康的", emoji: "🍎", scramble: "y-h-t-l-a-e-h", hint: "健康。", before: "Eating fruit keeps us", after: ".", drill: true },
    { letter: "L", id: "sin", word: "sincerely", syllables: "sin-cere-ly", say: "誠懇地", gloss: "誠懇地（書信結尾）", emoji: "💌", scramble: "y-l-e-r-e-c-n-i-s", hint: "書信結尾。", before: "Yours", after: ",", drill: true },
    { letter: "M", id: "br", word: "bright", syllables: "bright", say: "明亮的", gloss: "明亮的／聰明的", emoji: "☀️", scramble: "t-h-g-i-r-b", hint: "明亮。", before: "The sun is", after: "today.", drill: false },
    { letter: "N", id: "sp", word: "sponsor", syllables: "spon-sor", say: "贊助", gloss: "贊助", emoji: "💵", scramble: "r-o-s-n-o-p-s", hint: "贊助。", before: "Our school needs a", after: "for the event.", drill: true },
  ];

  if (words.length !== 14 || words.some((item, index) => item.letter !== LETTERS[index])) {
    throw new Error("vocab list must stay A–N in spec order");
  }

  const recite = [
    {
      id: "r1",
      en: "Although they often get sick, they do not have enough money to buy medicine.",
      zh: "雖然他們常常生病，但他們沒有足夠的錢買藥。",
      prompt: "默寫背誦句 1（Although…）",
      chips: ["Although", "they", "often", "get", "sick,", "they", "do", "not", "have", "enough", "money", "to", "buy", "medicine."],
    },
    {
      id: "r2",
      en: "People can't drink the water because it's too dirty.",
      zh: "人們不能喝那些水，因為它太髒了。",
      prompt: "默寫背誦句 2（People can't…）",
      chips: ["People", "can't", "drink", "the", "water", "because", "it's", "too", "dirty."],
    },
  ];

  recite.forEach((line) => {
    if (line.chips.join(" ") !== line.en) throw new Error("recite chips " + line.id);
  });

  const passage = [
    "Amy is an aid worker. She **spent two months** in Laos with Annie. The life in Laos is hard. Annie and her family only live in a **crowded small hut**. They need to go to the forest **to search for beetles**. **When there is a drought**, people may have **very little food** because a **lot of plants die**. Amy had a sore throat. She was scared because there are **very few doctors** in Laos.",
    "Peter is planning **to do some charity work to help the poor**. He suggests **organising a fundraising event**. He wants to run a second-hand stall **to sell some old clothes**. He also wants to invite his classmates to **donate money** to the poor. He thinks these are meaningful **activities** for everyone to **learn to treasure everything**. He hopes that more students **will support it**.",
  ];

  const chunks = [
    {
      id: "d1",
      prompt: "Amy 是援助工作者。她在老撾和 Annie 待了兩個月。",
      answer: "Amy is an aid worker. She spent two months in Laos with Annie.",
    },
    {
      id: "d2",
      prompt: "當有乾旱時，人們可能只有很少食物，因為很多植物會死。",
      answer: "When there is a drought, people may have very little food because a lot of plants die.",
    },
    {
      id: "d3",
      prompt: "他認為這些是有意義的活動，讓大家學習珍惜一切。",
      answer: "He thinks these are meaningful activities for everyone to learn to treasure everything.",
    },
  ];

  function normalizeAnswer(value) {
    return String(value || "")
      .replace(/organizing/gi, "organising")
      .replace(/[\u2018\u2019\u02BC\u00B4]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[,.;:!?。！？、，]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function answersMatch(input, expected) {
    const wants = Array.isArray(expected) ? expected : [expected];
    const got = normalizeAnswer(input);
    return wants.some((item) => got === normalizeAnswer(item));
  }

  function softOrganising(input, expected) {
    if (!/organizing/i.test(String(input || ""))) return false;
    return answersMatch(input, expected);
  }

  function syllableOf(word) {
    const found = words.find((item) => item.word === word);
    return found ? found.syllables : null;
  }

  function countItems(step) {
    if (!step || step.kind === "teach" || step.kind === "checklist") return 0;
    if (step.kind === "gap") {
      return (step.items || []).reduce((sum, item) => sum + (item.blanks || []).length, 0);
    }
    if (step.items) return step.items.length;
    return 0;
  }

  function syllableItems(list) {
    const answers = list.map((item) => item.syllables);
    return list.map((item, index) => {
      const options = [item.syllables];
      let hop = 1;
      while (options.length < 4 && hop <= answers.length) {
        const candidate = answers[(index + hop) % answers.length];
        if (!options.includes(candidate)) options.push(candidate);
        hop += 1;
      }
      return { word: item.word, answer: item.syllables, options: options };
    });
  }

  const icons = {};
  words.forEach((item) => {
    icons[item.word] = item.emoji;
  });

  const gloss = {
    earthquake: "地震",
    expensive: "昂貴的",
    typhoon: "颱風",
    dangerous: "危險的",
    drought: "乾旱",
    support: "支持",
    tsunami: "海嘯",
    search: "搜尋／尋找",
    flood: "水災／洪水",
    flags: "旗（賣旗用）",
    healthy: "健康的",
    sincerely: "誠懇地（書信結尾）",
    bright: "明亮的／聰明的",
    sponsor: "贊助",
    "aid worker": "援助工作者",
    "crowded small hut": "擠迫的小茅屋",
    beetles: "甲蟲",
    "sore throat": "喉嚨痛",
    "charity work": "慈善工作",
    "fundraising event": "籌款活動",
    "second-hand stall": "二手攤檔",
    "donate money": "捐錢",
    activities: "活動（不是 events）",
    "treasure everything": "珍惜一切",
    "too + adjective": "太……",
    "very few + plural noun": "很少……",
    although: "雖然",
    because: "因為",
  };

  const content = {
    title: "Moral · Dictation (2) · Module 2 U3&4",
    subtitle: "Vocabulary · Recitation · Passage · Grammar · Dictation",
    motto: "Spell carefully. Listen carefully. Write carefully!",
    hub: "五關：14 個詞彙、兩句背誦、Amy／Peter 短文、too／very few／although／because、聽寫模擬",
    date: "27th November, 2026 (Friday)",
    footer: "Moral · Dictation (2) · v1.0",
    version: "v1.0",
    storageKey: "p6-moral-dictation02-v1.0",
    student: "Moral",
    studentEn: "Lai Ho Shing",
    className: "P6C",
    icons: icons,
    gloss: gloss,
    pictures: words.map((item) => ({ id: item.letter, word: item.word, emoji: item.emoji })),
    modules: [
      {
        id: "vocab",
        zh: "詞彙",
        en: "Vocabulary",
        blurb: "14 個默書詞：拼寫、音節、意思",
        help: "題目用中文。答案是英文。留意 drought／tsunami／sincerely 的拼寫。",
        hue: "#0b5cab",
        steps: [
          {
            kind: "teach",
            title: "Dictation (2) 詞彙卡",
            body: "點卡片聽讀音。默書時留意音節拆法。特別練習 **drought**、**tsunami**、**sincerely**、**expensive**。",
            example: "A typhoon and a tsunami can be dangerous.",
            glossLine: "颱風和海嘯可能很危險。",
            cards: words.map((item) => ({
              letter: item.letter,
              word: item.word,
              syllables: item.syllables,
              gloss: item.gloss,
            })),
          },
          {
            kind: "mcq",
            title: "拼寫陷阱",
            items: [
              {
                q: "「乾旱」正確拼法是？",
                options: ["drought", "drout", "draught", "drougt"],
                answer: "drought",
                why: "乾旱的正確拼法是 drought。",
              },
              {
                q: "「海嘯」正確拼法是？",
                options: ["tsunami", "tunami", "sunami", "tsuunami"],
                answer: "tsunami",
                why: "海嘯的正確拼法是 tsunami。",
              },
              {
                q: "「誠懇地」正確拼法是？",
                options: ["sincerely", "sincerelly", "sincerly", "sincerley"],
                answer: "sincerely",
                why: "誠懇地的正確拼法是 sincerely。",
              },
              {
                q: "「昂貴的」正確拼法是？",
                options: ["expensive", "expencive", "expensivee", "ekspensive"],
                answer: "expensive",
                why: "昂貴的正確拼法是 expensive。",
              },
              {
                q: "「地震」的音節拆法是？",
                options: ["earth-quake", "ear-thquake", "earthq-uake", "e-arthquake"],
                answer: "earth-quake",
                why: "地震的音節是 earth-quake。",
              },
            ],
          },
          {
            kind: "iconHunt",
            title: "中文 → 英文",
            pool: words.map((item) => item.word),
            items: words.map((item) => ({ say: item.say, answer: item.word })),
          },
          {
            kind: "syllableMatch",
            title: "詞 → 音節",
            items: syllableItems(words.filter((item) => item.drill)),
          },
          {
            kind: "bank",
            title: "句子填詞",
            intro: "點選下面的英文，再點空格。",
            bank: words.map((item) => item.word),
            items: words.map((item) => ({
              id: item.id,
              before: item.before,
              after: item.after,
              answer: item.word,
              hint: item.hint,
            })),
          },
          {
            kind: "teach",
            title: "Spell the hard four",
            body: "抄三次：drought · tsunami · sincerely · expensive。下一關練兩句背誦。",
          },
        ],
      },
      {
        id: "recite",
        zh: "背誦",
        en: "Recitation",
        blurb: "兩句必背：although／because／too",
        help: "先排詞序，再填空，最後說出整句意思。",
        hue: "#6c4ed4",
        steps: [
          {
            kind: "teach",
            title: "兩句背誦",
            body: "默書 B1 要寫全句。留意 **Although** 開頭大寫、逗號，以及 **can't**／**it's**。",
            lines: recite.map((line) => line.en),
            glosses: recite.map((line) => line.zh),
          },
          {
            kind: "order",
            title: "排好詞序",
            intro: "按正確次序點選詞卡。",
            items: recite.map((line) => ({
              id: line.id,
              chips: line.chips.slice(),
              answer: line.en,
            })),
          },
          {
            kind: "gap",
            title: "填空",
            intro: "填入缺少的英文。",
            items: [
              {
                id: "s1",
                parts: ["", " they often get sick, they do not have enough money to buy ", "."],
                blanks: [
                  { id: "although", answer: "Although" },
                  { id: "medicine", answer: "medicine" },
                ],
              },
              {
                id: "s2",
                parts: ["People ", " drink the water ", " it's ", " dirty."],
                blanks: [
                  { id: "cant", answer: "can't" },
                  { id: "because", answer: "because" },
                  { id: "too", answer: "too" },
                ],
              },
            ],
          },
          {
            kind: "mcq",
            title: "意思",
            items: [
              {
                q: "第一句「Although they often get sick…」主要意思是？",
                options: [
                  "They often get sick but have no money for medicine.",
                  "They are healthy, so they do not need medicine.",
                  "The water is too dirty to drink.",
                  "They have a lot of money.",
                ],
                answer: "They often get sick but have no money for medicine.",
                why: "雖然他們常常生病，但他們沒有足夠的錢買藥。",
              },
              {
                q: "第二句重點是水 ______。",
                options: ["too dirty", "too clean", "too expensive", "too bright"],
                answer: "too dirty",
                why: "人們不能喝那些水，因為它太髒了。",
              },
            ],
          },
          {
            kind: "type",
            title: "默寫整句",
            intro: "看中文，默寫英文全句。",
            listen: true,
            items: recite.map((line) => ({
              id: line.id,
              prompt: line.prompt,
              answer: line.en,
            })),
          },
        ],
      },
      {
        id: "passage",
        zh: "短文",
        en: "Passage",
        blurb: "Amy in Laos + Peter's fundraising plan",
        help: "閱讀後答題。記得書上改正：meaningful activities（不是 events）。",
        hue: "#0e8f7a",
        steps: [
          {
            kind: "teach",
            title: "改正後的短文",
            body: "先讀 Amy 和 Peter 兩段。黃色是溫習紙的重點。",
            passage: passage,
            callout: "手寫改正：meaningful events → meaningful **activities**。Peter 那句用英式拼寫 **organising**。",
          },
          {
            kind: "mcq",
            title: "理解",
            items: [
              {
                q: "Amy 的工作是？",
                options: ["an aid worker", "a doctor", "a teacher", "a sponsor"],
                answer: "an aid worker",
                why: "短文第一句：Amy is an aid worker。",
              },
              {
                q: "Amy 在 Laos 待了多久？",
                options: ["two months", "two weeks", "two years", "two days"],
                answer: "two months",
                why: "She spent two months in Laos。",
              },
              {
                q: "Annie 一家住在？",
                options: ["a crowded small hut", "a big flat", "a bright school", "an expensive hotel"],
                answer: "a crowded small hut",
                why: "他們住在 a crowded small hut。",
              },
              {
                q: "乾旱時為什麼可能很少食物？",
                options: ["a lot of plants die", "there are too many doctors", "flags are expensive", "water is bright"],
                answer: "a lot of plants die",
                why: "because a lot of plants die。",
              },
              {
                q: "Amy 害怕是因為 Laos ______。",
                options: ["has very few doctors", "has too many doctors", "has no beetles", "has a tsunami every day"],
                answer: "has very few doctors",
                why: "there are very few doctors in Laos。",
              },
              {
                q: "Peter 建議？",
                options: ["organising a fundraising event", "buying an expensive phone", "sleeping in a hut", "searching for a typhoon"],
                answer: "organising a fundraising event",
                why: "書上是英式拼寫 organising。",
              },
              {
                q: "Peter 想開什麼攤？",
                options: ["a second-hand stall", "a typhoon stall", "a doctor stall", "a drought stall"],
                answer: "a second-hand stall",
                why: "He wants to run a second-hand stall。",
              },
              {
                q: "「這些是有意義的 ______」正確詞是？",
                options: ["activities", "events", "expensive", "drought"],
                answer: "activities",
                why: "溫習紙手寫改正 events → activities。",
              },
            ],
          },
          {
            kind: "bank",
            title: "短語填空",
            intro: "點選短語，再點空格。十個重點；beetles 和 very few doctors 在下一題改正。",
            bank: [
              "spent two months",
              "crowded small hut",
              "When there is a drought",
              "to do some charity work to help the poor",
              "organising a fundraising event",
              "to sell some old clothes",
              "donate money",
              "activities",
              "learn to treasure everything",
              "will support it",
            ],
            items: [
              { id: "m1", before: "Amy", after: "in Laos with Annie.", answer: "spent two months", hint: "待了兩個月。" },
              { id: "m2", before: "They live in a", after: ".", answer: "crowded small hut", hint: "擠迫的小茅屋。" },
              { id: "m4", before: "", after: ", people may have very little food.", answer: "When there is a drought", hint: "乾旱。" },
              { id: "m6", before: "Peter is planning", after: ".", answer: "to do some charity work to help the poor", hint: "慈善工作。" },
              { id: "m7", before: "He suggests", after: ".", answer: "organising a fundraising event", hint: "籌款活動。英式拼寫 organising。" },
              { id: "m8", before: "He wants to run a second-hand stall", after: ".", answer: "to sell some old clothes", hint: "二手攤檔。" },
              { id: "m9", before: "Classmates can", after: "to the poor.", answer: "donate money", hint: "捐錢。" },
              { id: "m10", before: "These are meaningful", after: ".", answer: "activities", hint: "活動（不是 events）。" },
              { id: "m11", before: "… for everyone to", after: ".", answer: "learn to treasure everything", hint: "珍惜一切。" },
              { id: "m12", before: "He hopes more students", after: ".", answer: "will support it", hint: "支持。" },
            ],
          },
          {
            kind: "fix",
            title: "改正",
            intro: "把錯的英文改成短文裏的寫法。",
            items: [
              { id: "fx1", prompt: "Fix: meaningful events", answer: "meaningful activities" },
              { id: "fx2", prompt: "Fix: very little doctors", answer: "very few doctors" },
              { id: "fx3", prompt: "Fix: search beetles (missing words)", answer: "to search for beetles" },
            ],
          },
          {
            kind: "teach",
            title: "Remember the fix",
            body: "meaningful **activities** · very **few** doctors · **too** dirty。下一關練文法。",
          },
        ],
      },
      {
        id: "grammar",
        zh: "文法診所",
        en: "Grammar",
        blurb: "too… / very few / although / because",
        help: "too + 形容詞；very few + 複數名詞；although／because 連接子句。",
        hue: "#c45c26",
        steps: [
          {
            kind: "teach",
            title: "四個句型",
            lines: [
              "**too + adj.** — too dirty / too expensive / too dangerous",
              "**very few + plural noun** — very few doctors / houses / flags",
              "**although** — Although …, …. （雖然……，……）",
              "**because** — … because …. （因為）",
            ],
            example: "People can't drink the water because it's **too** dirty. There are **very few** doctors.",
            glossLine: "人們不能喝那些水，因為它太髒了。醫生很少。",
          },
          {
            kind: "mcq",
            title: "圈一圈",
            items: [
              {
                q: "圈出正確的字：People can't drink water because it is ______ dirty.",
                options: ["too", "very few", "although", "sponsor"],
                answer: "too",
                why: "too + 形容詞：too dirty。",
              },
              {
                q: "圈出正確的字：There are ______ houses.",
                options: ["very few", "too", "although", "sincerely"],
                answer: "very few",
                why: "very few + 複數名詞。",
              },
              {
                q: "圈出正確的字：______ they often get sick, they do not have enough money.",
                options: ["Although", "Because", "Too", "Very few"],
                answer: "Although",
                why: "Although 放在句首，後面有逗號。",
              },
              {
                q: "圈出正確的字：Amy was scared ______ there are very few doctors.",
                options: ["because", "although", "too", "flags"],
                answer: "because",
                why: "because 連接原因。",
              },
              {
                q: "選正確：The water is ______.",
                options: ["too dirty", "very few dirty", "although dirty", "too dirtys"],
                answer: "too dirty",
                why: "too + 形容詞，不用 very few dirty。",
              },
              {
                q: "選正確：There are ______ doctors in Laos.",
                options: ["very few", "too", "very few doctor", "too fews"],
                answer: "very few",
                why: "very few + 複數名詞 doctors。",
              },
            ],
          },
          {
            kind: "bank",
            title: "填入句型",
            intro: "點選下面的字，再點空格。",
            bank: ["too", "very few", "Although", "because", "too", "very few"],
            items: [
              { id: "g1", before: "The medicine is", after: "expensive.", answer: "too", hint: "too + 形容詞。" },
              { id: "g2", before: "There are", after: "trees after the drought.", answer: "very few", hint: "very few + 複數名詞。" },
              { id: "g3", before: "", after: "life is hard, Annie still smiles.", answer: "Although", hint: "雖然。" },
              { id: "g4", before: "Plants die", after: "there is no rain.", answer: "because", hint: "因為。" },
              { id: "g5", before: "Crossing the bridge is", after: "dangerous.", answer: "too", hint: "too + 形容詞。" },
              { id: "g6", before: "There are", after: "sponsors this year.", answer: "very few", hint: "very few + 複數名詞。" },
            ],
          },
          {
            kind: "fix",
            title: "改錯",
            intro: "把句子改成正確英文。",
            items: [
              { id: "gf1", prompt: "Fix: The water is very few dirty.", answer: "The water is too dirty." },
              { id: "gf2", prompt: "Fix: There are too doctors.", answer: "There are very few doctors." },
              {
                id: "gf3",
                prompt: "Fix: Because they often get sick, they do not have money.",
                note: "要改成 Although 句型，像背誦句 1。",
                answer: "Although they often get sick, they do not have enough money to buy medicine.",
              },
            ],
          },
          {
            kind: "teach",
            title: "Grammar checklist",
            body: "too + adj. · very few + plural · Although…, … · … because …。最後一關：聽寫模擬。",
          },
        ],
      },
      {
        id: "dictation",
        zh: "聽寫模擬",
        en: "Dictation",
        blurb: "中文提示或打亂英文 → 輸入正確英文",
        help: "像默書：先看提示，再打出英文。可先聽（PWA TTS），再默寫。",
        hue: "#e07a2f",
        steps: [
          {
            kind: "teach",
            title: "模擬默書",
            body: "這一關包括：14 個詞彙、兩句背誦、1–2 段短文片段。提交後才顯示答案（教師模式除外）。",
          },
          {
            kind: "type",
            title: "詞彙默寫",
            intro: "看中文，打出英文。也可以改看打亂字母。",
            listen: true,
            scramble: true,
            items: words.map((item) => ({
              id: item.id,
              prompt: item.say,
              answer: item.word,
              scramble: item.scramble,
            })),
          },
          {
            kind: "type",
            title: "背誦句",
            intro: "默寫兩句背誦。可以先聽，再打。",
            listen: true,
            items: recite.map((line) => ({
              id: line.id,
              prompt: line.prompt,
              answer: line.en,
            })),
          },
          {
            kind: "type",
            title: "短文片段",
            intro: "看中文，打出英文句子。今次默兩段較長的。",
            listen: true,
            items: [chunks[1], chunks[2]],
            teacherBank: chunks,
          },
          {
            kind: "checklist",
            title: "默書自查",
            intro: "交卷前自己勾一勾。這張清單不計分。",
            items: [
              "drought / tsunami / sincerely / expensive 拼啱未？",
              "Although… medicine. 全句？",
              "People can't… too dirty. 全句？",
              "activities 唔係 events？",
              "too / very few 用啱未？",
            ],
          },
        ],
      },
    ],
    checks: {
      normalizeAnswer: normalizeAnswer,
      answersMatch: answersMatch,
      softOrganising: softOrganising,
      syllableOf: syllableOf,
      countItems: countItems,
    },
  };

  globalThis.P6_CONTENT = content;
})();
