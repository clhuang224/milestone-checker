# development-milestones

一個兒童發展里程碑追蹤工具的實驗專案。

> **這個專案是為了實驗 [Claude Code](https://claude.com/product/claude-code) 搭配 Angular 開發而做的**,重點在體驗 Claude Code 的開發流程(OpenSpec 規格驅動、subagents 等),不是正式產品。

## 這是什麼

家長/照顧者用的兒童發展打勾清單,長期目標是涵蓋多個發展面向,**第一版先做「語言 / 言語 / 吞嚥」**這三個領域。設計上參考(不是照搬)[AgendaLu/piaget-based-child-checklist](https://github.com/AgendaLu/piaget-based-child-checklist) 的概念,但用自己的風格跟技術重新做。

> ⚠️ **僅供家長自行參考記錄使用,不是醫療診斷工具,不能取代專業評估。** 如果對孩子的發展有疑慮,請諮詢小兒科醫師、語言治療師等專業人員。

## 技術棧

- **Angular**(最新版,standalone components + Signals,不用 NgModule)
- **Vitest** 做測試
- 純前端,資料存在瀏覽器 `localStorage`,沒有後端、沒有帳號系統
- 畫面走明亮活潑風格

## 開發方式:OpenSpec

跟 [claude-code-zh-tw](../claude-code-zh-tw) 那個專案一樣,這裡也用 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 的規格慣例:先寫 proposal/design/spec,再依 `tasks.md` 逐項實作。

```
development-milestones/
├── README.md                本檔
├── CLAUDE.md                給 Claude Code 看的專案規則(Angular 細節,通用習慣在全域 CLAUDE.md)
├── openspec/
│   ├── specs/                已定案規格(第一輪 change 被 archive 後才會有內容)
│   └── changes/
│       └── add-lang-speech-swallowing-checklist/
│           ├── proposal.md
│           ├── design.md
│           ├── tasks.md
│           └── specs/development-checklist/spec.md
└── (Angular 專案本體,scaffold 完成後會出現在這裡)
```

跟 `claude-code-zh-tw` 一樣,這個環境裝不了真正的 `openspec` npm CLI,`openspec/` 資料夾是照官方慣例手動搭的,格式相容,之後可以用 `npm install -g @fission-ai/openspec@latest && openspec init` 接上真正的 CLI。

## 目前狀態

第一個 change(`add-lang-speech-swallowing-checklist`)的規格文件已經寫好,`tasks.md` 還沒開始執行。實際的發展里程碑內容(幾個月大該有什麼能力)**需要引用可信來源並經過審核**,目前規格裡只放了示意用的範例資料,不是最終內容。
