# milestone-checker

一個給語言治療師用的臨床規則輔助工具實驗專案。

> **這個專案有兩個實驗目的**:一是實驗 [Claude Code](https://claude.com/product/claude-code) 的開發流程與能力（OpenSpec 規格驅動、subagents 等），二是實驗 Angular(standalone + Signals、zoneless)本身。應用本身的完成度/正確性不是重點，不是正式產品。
>
> 這個 repo 走**「vibe coding」**:程式碼不會被認真逐行 review，主要靠 Claude Code 自主開發、跑測試自我把關。相對地，commit 會刻意切得**小顆粒**（一個邏輯改動一個 commit），方便事後追查是哪一步出的問題，而不是靠 review 擋在前面。

## 這是什麼

給**語言治療師**用的規則輔助工具:治療師依照自己的臨床經驗，把「哪些觀察項目/評估數值組合在一起代表什麼」寫成規則（條件 → 警示/歸納文字），系統依照個案身上實際勾選的觀察項目跟評估數值，自動比對規則、跳出警示，並協助組出報告用的文字草稿。**第一版先做「語言 / 言語 / 吞嚥」**這三個領域。

> 這個方向取代了專案最早的構想(給家長/照顧者用的兒童發展打勾清單，概念參考自 [AgendaLu/piaget-based-child-checklist](https://github.com/AgendaLu/piaget-based-child-checklist));那個構想目前擱置，細節見下方「開發方式」。

> ⚠️ **僅供臨床參考使用，不取代治療師的專業判斷。** 規則與警示是治療師自己編輯的臨床經驗歸納，不是通過審核的診斷標準。

## 技術棧

- **Angular**（最新版，standalone components + Signals，不用 NgModule）
- **Vitest** 做測試
- 純前端，資料存在瀏覽器 `localStorage`，沒有後端、沒有帳號系統
- 規則儲存/評估用 [JsonLogic](https://jsonlogic.com/)(`json-logic-js`)，規則編輯器 UI 是自己刻的簡單版本，不依賴第三方 query builder 套件

## 開發方式:OpenSpec

用 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 的規格慣例:先寫 proposal/design/spec，再依 `tasks.md` 逐項實作。

```
milestone-checker/
├── README.md                本檔
├── CLAUDE.md                給 Claude Code 看的專案規則（Angular 細節，通用習慣在全域 CLAUDE.md）
├── openspec/
│   ├── specs/                已定案規格（第一輪 change 被 archive 後才會有內容）
│   └── changes/
│       └── add-therapist-rule-engine/
│           ├── proposal.md
│           ├── design.md
│           ├── tasks.md
│           └── specs/rule-engine/spec.md
└── （Angular 專案本體，scaffold 完成後會出現在這裡）
```

## 目前狀態

`add-therapist-rule-engine` 這個 change 的 `tasks.md` 第 1–6 節都做完了:資料模型、規則引擎（JsonLogic 儲存/評估 + 條件列/群組編輯器）、一小批示意用的觀察項目跟規則、還有完整的畫面（個案管理、觀察表單、規則清單/編輯器/匯出匯入、警示清單、報告草稿），`pnpm lint`/`pnpm test`/`pnpm build` 都過，也在瀏覽器裡手動測過一輪完整流程。

範例規則內容(`src/app/data/starter-*.ts`)**還沒經過治療師審核**，只是示意用的佔位資料，正式使用前要由治療師本人確認或整批替換（對應 `tasks.md` 4.3，故意留著沒打勾）。第 7 節（收尾/archive）也還沒做。

`add-articulation-process-tracker`（構音記錄/音韻歷程）進行中:資料模型、注音參考表、儲存、三個畫面（構音記錄表格 `cases/:id/articulation`、音韻歷程目錄 `/articulation-processes`、音韻歷程總覽）跟 smoke test 都做完了，`pnpm lint`/`pnpm test`（82 個測試）/`pnpm build` 都過。還沒做的是瀏覽器手動實測、治療師審核注音構音特徵跟預設音韻歷程清單、以及 archive。

注音表上的構音特徵（部位/方式/送氣）跟預設的音韻歷程清單同樣是**未經審核的佔位內容**，系統不會拿它們自動判斷音韻歷程——歸類完全靠治療師手動貼標籤。
