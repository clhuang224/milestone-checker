# milestone-checker

給**台灣語言治療師**用的臨床規則輔助工具，同時是一個開發流程的實驗專案。

> ⚠️ **僅供臨床參考，不取代治療師的專業判斷。** 規則與警示是治療師自己編寫的臨床經驗歸納，不是通過審核的診斷標準。

> ⚠️ **請不要輸入真實個案資料。** 個案名稱請使用化名或代號。詳見下方「資料放在哪裡」。

## 這個工具在做什麼

治療師把「哪些觀察組合起來代表什麼」寫成規則——條件成立時跳出警示，並給出一段可以放進報告的文字。系統依照個案身上實際記錄的內容自動比對。

目前手上有的是**構音評估**：記錄目標音與實際聽到的音，系統比對兩者的辨異徵性（distinctive feature）差異，推導出可能的音韻歷程。吞嚥的核心邏輯（IDDSI 質地、成功率）已經有了，畫面還沒接上。其他評估表（SOAP 治療紀錄、成人／兒童語言、語暢等）是設計上預留的擴充位置，還沒實作。

使用方式見 [`docs/使用說明.md`](docs/使用說明.md)。

## 目標使用者

台灣的語言治療師。因此：

- 介面文字一律**繁體中文（台灣用語）**。
- 語音資料以**台灣華語**為準，用注音符號標記。像「不捲舌」這種在台灣屬於方言性變異、不算構音異常的現象，資料裡就不會被列成錯誤。

## 資料放在哪裡

**全部留在你自己的瀏覽器裡。** 這是一個純前端應用，沒有後端、沒有帳號、沒有任何對外連線。所有內容存在瀏覽器的 `localStorage`。

這代表：

- 資料**不會**傳給開發者、不會傳給 Anthropic、不會傳給任何第三方。
- 資料也**不會**跟著你換裝置或換瀏覽器，清除瀏覽器資料就沒了，而且沒有備份機制。
- 這個專案還在 PoC 階段，資料格式改版時是**直接丟棄舊資料重來**，不做遷移。

換句話說，隱私上它是安全的，可靠性上它完全不是——所以**不要輸入真實個資**。要試就用化名或代號。

## 臨床內容的來源

臨床知識（辨異徵性、音韻歷程、吞嚥質地等）**一律由治療師本人提供，不是模型生成的**。專案早期吃過這個虧，詳見 [`docs/開發方式紀錄.md`](docs/開發方式紀錄.md)。

這些內容放在 [`references/`](references/) 的 markdown 表格裡，跟程式碼分開，方便查閱、也方便交給另一位治療師校對。程式碼讀的是同一組值，`scripts/check-references.mjs` 會在 commit 前檢查兩邊有沒有走鐘。

沒有收錄任何標準化測驗的內容——那些有版權。IDDSI 的部分只使用等級數字與短標籤，完整描述詞連結回原始出處（IDDSI 採 CC BY-SA 4.0，且明文禁止翻譯以外的改作）。細節見 [`references/README.md`](references/README.md)。

## 實驗性質

這個 repo 有兩個實驗目的，應用本身的完成度不是重點：

1. **[Claude Code](https://claude.com/product/claude-code) 的開發方式**——OpenSpec 規格驅動，以及用 subagents 分工（文獻查證、質疑辯論、UI/UX、Angular/TS），由主 agent 統一跟開發者對話。開發者不做逐行 code review，改由小顆粒 commit + 測試把關。這部分的實際狀況、踩到的坑、以及模型出過的錯，都記在 [`docs/開發方式紀錄.md`](docs/開發方式紀錄.md)。
2. **Angular 本身**——standalone components + Signals、zoneless。

## 授權

**目前沒有訂授權條款。** 依照著作權法的預設，這代表著作權全部保留：你可以閱讀這份公開原始碼，但沒有被授權重製、修改或散布。想使用請先來詢問。

`references/` 底下引用的外部素材各自有自己的授權（例如 IDDSI 為 CC BY-SA 4.0），不受這一段影響。

## 資料夾結構

```
milestone-checker/
├── README.md                   本檔
├── CLAUDE.md                   給 Claude Code 看的專案規則
├── docs/
│   ├── 使用說明.md              給治療師的操作說明
│   ├── 開發方式紀錄.md           subagent 分工、踩過的坑
│   ├── ARCHITECTURE.md         架構與資料流
│   └── CONTRIBUTING.md         環境設定與開發慣例
├── references/                 臨床參考資料（markdown 表格，程式碼的真實來源）
├── openspec/changes/           規格：proposal / design / tasks / specs
├── scripts/check-references.mjs  比對 references/ 與 src/app/data/
├── e2e/                        Playwright smoke test
└── src/app/
    ├── models/                 型別定義
    ├── data/                   內建資料：注音表、音韻歷程、示範個案、內建評估表
    ├── core/                   無 UI 的邏輯
    │   ├── articulation/       辨異徵性比對、音韻歷程推導
    │   ├── rule-engine/        JsonLogic 條件轉換、事實組裝、報告草稿
    │   ├── swallowing/         吞嚥試驗計算
    │   └── storage/            localStorage 的唯一入口
    ├── features/               各畫面
    └── shared/                 共用元件（免責聲明橫幅等）
```

## 開發

需要 Node 24 與 pnpm 11（`volta` 已釘好版本）。

```sh
pnpm install
pnpm start          # http://localhost:4200
```

品質關卡是這四個全過：

```sh
pnpm lint
pnpm test
pnpm build
pnpm check:references
```

架構說明見 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)，開發慣例見 [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)。

## 技術棧

- **Angular 21**——standalone components + Signals，zoneless，不用 NgModule
- **Tailwind CSS 4**
- **Vitest**
- **[JsonLogic](https://jsonlogic.com/)**（`json-logic-js`）儲存與評估規則條件；規則編輯器 UI 是手刻的（條件列 + AND/OR 群組），沒有依賴第三方 query builder 套件
