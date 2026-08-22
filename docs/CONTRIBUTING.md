# 開發指南

專案規則在 `CLAUDE.md`，架構決策在 [`ARCHITECTURE.md`](ARCHITECTURE.md)，subagent 分工與踩過的坑在 [`開發方式紀錄.md`](開發方式紀錄.md)。這份文件只寫**怎麼動手**。

## 跑起來

```bash
pnpm install
pnpm start --port 4287     # 開發伺服器
```

> `pnpm start -- --port 4287` 在這個版本的 Angular CLI **不會生效**，參數傳不進去。直接寫 `pnpm start --port 4287`。

其餘指令：

```bash
pnpm test              # Vitest
pnpm lint              # ESLint（含 .html 模板）
pnpm typecheck         # ngc + tsc，兩份 tsconfig 都檢查
pnpm build             # production build
pnpm check:references  # references/ 與 src/app/data/ 的一致性檢查
```

## 品質關卡

這個 repo 沒有逐行 code review（見 `CLAUDE.md` 的 vibe coding 段落），所以**指令全過才算做完**，不是「跑起來看起來對」：

```bash
pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm check:references
```

CI（`.github/workflows/ci.yml`）只跑 lint／typecheck／test／build，**沒有跑 `check:references`**——那條是 `.husky/pre-commit` 在擋的。所以繞過 hook 提交（`--no-verify`）就沒有任何東西會發現臨床資料漂移了。

### e2e 冒煙測試

`e2e/articulation-smoke.mjs` 用 Playwright 驅動真的瀏覽器，走一遍「建個案 → 填格子表 → 看推導 → 重新整理確認持久化 → 規則觸發」。**它需要一個已經跑起來的開發伺服器**：

```bash
pnpm start --port 4287      # 另一個終端機
node e2e/articulation-smoke.mjs
```

它不在 CI 裡、也不是 `pnpm test` 的一部分——是手動確認用的。它讀取狀態的時機緊接在點擊之後，會跟 zoneless 變更偵測搶時間，所以腳本裡到處是短暫的 `waitForTimeout`;那是這個測試手法的限制，不是 bug。

> 目前這支腳本跟畫面對不上（它找的是「＋ 新增評估」按鈕與個案頁上的警示區塊，但按鈕已改名「＋ 新增課節紀錄」、警示與報告已經移進課節紀錄頁的頁籤）。動它之前先確認選擇器還在。

## Commit

- **Conventional Commits**：`feat:`／`fix:`／`refactor:`／`docs:`／`test:`／`chore:`，訊息用英文。
- **小顆粒、單一邏輯改動**。這裡沒有 review 擋在前面，出事時要靠 bisect 追回一個小 commit;`tasks.md` 一項一個 commit 是好的粒度。
- 每一則訊息結尾都要有這行 trailer:

  ```
  Co-authored-by: Claude Code [model] ([context size]) <noreply@anthropic.com>
  ```

  **`[model]` 寫實際在跑的那個模型**，不要從 `git log` 複製上一則——上一則是上一個模型寫的。

## OpenSpec 流程

工作單位是 change，不是 issue:

```
openspec/changes/<change-name>/
├── proposal.md          為什麼要做、要做什麼、這次不做什麼
├── design.md            資料結構與取捨（比較過哪些做法、為什麼選這個）
├── tasks.md             可勾選的實作步驟
└── specs/<capability>/spec.md
```

- **照 `tasks.md` 的順序做**，不要跳著挑。
- **做完一項就勾一項**，而且是真的做完才勾。（`add-demo-case-seeds/tasks.md` 目前全部沒勾，但程式碼已經實作了——就是這個習慣沒守住的樣子。）
- 文件用**繁體中文散文**，但 OpenSpec 的結構關鍵字（`ADDED Requirements`、`Requirement:`、`Scenario:`、`WHEN`／`THEN`／`AND`、`SHALL`）保持英文，工具是靠它們解析的。
- 要推翻先前 change 已定案的需求，用 `MODIFIED` 明寫出來，不要默默改掉。

## 臨床內容：不要自己編

語音／構音／吞嚥的內容——辨異徵性、音韻歷程、吞嚥判準、年齡門檻、嚴重度分級——**一律由開發者提供**。不確定就拆成小的具體問題逐項問，不要生一張看起來很像真的表格。

這條規則是踩過坑才訂的（實際擋下了什麼，記在 [`開發方式紀錄.md`](開發方式紀錄.md)）。早期的緩衝是把可疑內容標成「佔位待審核」，**那個慣例已經退休**——審核的人就是開發者本人，標記只是噪音，被標記的內容照樣是編的。

流程：

1. **先改 `references/` 的 markdown 表格**（給人看的那份，可以貼給另一位治療師挑錯）。
2. 再同步 `src/app/data/` 的對應檔案。
3. `pnpm check:references` 要綠燈。

對應關係列在 `references/README.md`。只改 `.ts` 會讓文件過期，而過期的文件比沒有文件更糟。

### 別無條件相信那個檢查

`check-references.mjs` 是用 regex 讀 `.ts` 的。改動資料檔的**寫法**（換成巢狀物件、改變欄位順序、加一層 wrapper 函式）就可能讓 regex 抓不到任何東西——而「抓到 0 筆」在部分檢查裡會安靜地通過。

所以動了資料檔的形狀之後，**先確認這個檢查抓得到漂移再相信它**：故意把 `references/` 裡的一格改錯（例如把 ㄍ 的 `velar` 改成 `alveolar`），跑 `pnpm check:references`，確認它紅燈、exit code 是 1，再把改動還原。

檢查本身的範圍也有限：聲母比四個徵性欄，韻母只比 id 與符號——它們的徵性值由 `src/app/data/articulation-content.spec.ts` 的單元測試守。改韻母相關的東西時，記得那條路是走測試不是走 script。
