# P6-Moral-Dictation02

Moral（Lai Ho Shing · P6C）嘅小六英文默書溫習。五關：詞彙、背誦、短文、文法診所、聽寫模擬。

**Moral · Dictation (2) · Module 2 U3&4**  
Vocabulary · Recitation · Passage · Grammar · Dictation

Motto: **Spell carefully. Listen carefully. Write carefully!**

題目用繁體中文，答案用英文。學校練習／示範：冇登入、冇伺服器、冇密鑰。範例／教師用要交卷之後，或者開教師模式，先會顯示。

## 自己部電腦點開 / Open locally

喺呢個資料夾：

```bash
python3 -m http.server 8080
```

然後開 http://localhost:8080

進度（星星）存在呢部裝置嘅瀏覽器（`localStorage`：`p6-moral-dictation02-v1.0`）。iPhone 用 Safari，可以加入主畫面。

檢查題目同答案結構：

```bash
node tests/answers.test.js
```

## GitHub Pages

而家未開 Pages。呢個流程係 pull request only：合併之後，先用 branch **main**、folder **/**（root）開 Pages。網址會係：

https://tradingservant.github.io/P6-Moral-Dictation02/

## PR-only

改動用 pull request 交。倉庫唔放 secrets、API key，亦唔放學校 worksheet PDF。

## 鎖定 / Locked

- 短文用 meaningful **activities**。溫習紙把 events 改成 activities。
- 英式拼寫 **organising**。學生打 organizing 會 soft-accept，教師答案仍然係 organising。
- 五關 id：`vocab` · `recite` · `passage` · `grammar` · `dictation`

Version: **v1.0**（頁尾 `Moral · Dictation (2) · v1.0`）
