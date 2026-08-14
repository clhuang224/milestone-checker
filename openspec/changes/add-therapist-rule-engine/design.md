# 設計:add-therapist-rule-engine

## 架構

Angular，最新版，**standalone components + Signals**（不用 NgModule）。大致結構:

```
src/app/
├── core/
│   ├── storage/                    StorageService — 唯一會碰 localStorage 的地方（沿用既有的殼，型別重寫）
│   └── rule-engine/
│       ├── json-logic.ts           包一層 json-logic-js 的評估函式
│       └── condition-mapper.ts     規則編輯器的「條件列/群組」模型 ⇄ JsonLogic JSON 互轉
├── features/
│   ├── cases/                      個案清單、建立/切換個案
│   ├── findings/                   單一個案的觀察/評估項目填寫表單（勾選 + 數值）
│   ├── rules/
│   │   ├── rule-list/              規則清單（可啟用/停用、編輯、刪除）
│   │   ├── rule-editor/            條件列 + AND/OR 群組編輯器
│   │   └── rule-import-export/     匯出/匯入 JsonLogic 規則集 JSON 檔
│   ├── warnings/                   目前個案被觸發的規則清單（警示/歸納）
│   └── report-draft/               根據觸發規則組出的文字草稿 + 複製按鈕
├── models/
│   ├── finding.model.ts            FindingDefinition
│   ├── case.model.ts                Case、CaseProfile
│   └── rule.model.ts                 Rule、RuleAction、JsonLogicRule
└── shared/
    └── disclaimer-banner/          常駐的「僅供臨床參考，不取代專業判斷」警語
```

狀態放在各自的 store service（用 Signals），包在 `StorageService` 之上，不讓元件各自維護本地狀態、跟實際存的資料不同步。

## 資料結構（草案）

```ts
type CategoryId = 'language' | 'speech' | 'swallowing';
type FindingKind = 'boolean' | 'number';

interface FindingDefinition {
  id: string;
  categoryId: CategoryId;
  label: string; // 繁體中文，給治療師看
  kind: FindingKind;
  unit?: string; // kind === 'number' 時的單位，例如「分」
  sourceNote?: string; // 這個項目的資料來源;真正（非範例）的內容一定要填
}

interface Case {
  id: string;
  label: string; // 暱稱/代號，不強制真實姓名
  createdOnISODate: string;
  note?: string;
}

interface CaseProfile {
  caseId: string;
  values: Record<string, boolean | number>; // key 是 FindingDefinition.id
  updatedOnISODate: string;
}

interface JsonLogicRule {
  [operator: string]: unknown; // 直接存 json-logic-js 看得懂的 JsonLogic 結構
}

interface RuleAction {
  message: string; // 觸發時顯示的警示/歸納文字
  severity: 'info' | 'warning' | 'critical';
  reportTemplate?: string; // 選填，併入報告草稿的文字片段（支援 {{case.label}} 這類簡單替換）
}

interface Rule {
  id: string;
  name: string; // 治療師自己取的規則名稱
  condition: JsonLogicRule;
  action: RuleAction;
  enabled: boolean;
  sourceNote?: string; // 這條規則背後的臨床依據/理由（治療師自填）
}
```

`sourceNote` 沿用既有的「內容一定要能追溯來源」慣例，對應 `CLAUDE.md` 的健康內容注意事項——這次的來源是**治療師本人的臨床判斷**，不是文獻，所以用來記「為什麼定這條規則」而不是引用外部文獻。

## 規則引擎

評估用 **JsonLogic**（`json-logic-js`，需要的話之後可以換成效能更好、API 相容的 `json-logic-engine`）。評估時把 `CaseProfile.values` 攤平成 JsonLogic 的 facts 物件，例如:

```json
{ "drooling": true, "articulationError": true, "oralMotorScore": 42 }
```

規則的 `condition` 就是一段 JsonLogic，例如:

```json
{ "and": [{ "==": [{ "var": "drooling" }, true] }, { ">": [{ "var": "oralMotorScore" }, 40] }] }
```

`json-logic-js` 沒有框架依賴，在 Angular service 裡直接呼叫 `jsonLogic.apply(rule.condition, facts)` 即可，不用額外包裝太多。

## 規則編輯器 UI

不引入現成的 Angular query builder 套件（調查後發現主要選項如 `ngx-query-builder`/`ngx-angular-query-builder` 都兩年以上沒更新，跟 Angular 21 standalone/zoneless 的相容性有風險）。自己刻一個簡單版本:

- 編輯器內部用一個好操作的「條件列/群組」模型(`ConditionGroup { combinator: 'and' | 'or'; children: (ConditionRow | ConditionGroup)[] }`，`ConditionRow { fieldId; operator; value }`)。
- `condition-mapper.ts` 負責把這個內部模型跟 `JsonLogicRule` 互轉（存檔時轉成 JsonLogic，載入編輯器時轉回內部模型）。
- 畫面上就是巢狀的條件列 + AND/OR 群組，操作模式借用 react-querybuilder 這類工具的互動慣例，但沒有套件依賴。
- 「匯出/匯入 JsonLogic JSON」走的是同一份 `Rule[]` 資料的序列化/反序列化，不經過內部模型，給想直接編輯檔案或分享規則集的人用。

## 報告草稿產生

個案的觀察項目跑過所有 `enabled` 規則後，把「有 `reportTemplate` 的觸發規則」依規則清單順序串接文字，做簡單的 `{{case.label}}` 之類的字串替換，組成一段可編輯的 `<textarea>` 內容，治療師可以直接修改後複製走。這次先求「堪用的草稿」，不做進階範本語法或條件式文字。

## 資料儲存

沿用既有的 `StorageService` 殼(`core/storage/storage.ts`)，`localStorage` 用有命名空間 + 版號的 key，例如:

- `therapist-rule-engine:findings:v1`
- `therapist-rule-engine:cases:v1`
- `therapist-rule-engine:rules:v1`

分開存，避免一次讀寫整包大 JSON。key 有版號，之後改資料結構不會悄悄把舊資料弄壞。規則另外支援「匯出成單一 JSON 檔」，格式就是 `Rule[]` 直接序列化，方便備份或分享給其他治療師;匯入時做基本的結構檢查（型別、必要欄位），失敗要有清楚的錯誤訊息，不能靜默吃掉壞資料。

## 樣式

Tailwind CSS，沿用既有設定。這次的視覺基調可以比家長版清單更「工具/專業」一點（治療師是熟練使用者，不需要刻意童趣化），但沒有強制要求——先求好用。

## 測試

單元測試用 Vitest，重點放在:

- `condition-mapper.ts` 的內部模型 ⇄ JsonLogic 互轉（round-trip 測試）
- 規則評估邏輯（給定 `CaseProfile` + 一組 `Rule[]`，確認哪些被觸發）
- `StorageService` 邏輯（沿用既有測試，型別改掉）

元件測試先求有就好（幾個 smoke test），不追求完整涵蓋率——這是實驗專案，不是以涵蓋率為目標的專案。

## 既有程式碼的處理

既有的 `models/milestone.model.ts`(`Milestone`/`AchievementRecord`/`ObservationEntry`)是舊的家長打勾清單構想留下的，這次會被新的 `finding.model.ts`/`case.model.ts`/`rule.model.ts` 取代並移除。`StorageService` 的殼（namespaced key、JSON 序列化、壞資料 fallback 的機制）保留沿用，只是換掉它包裝的型別跟 key。

## 這次明確不做的事

沒有後端、沒有帳號系統、沒有多治療師協作/跨裝置同步、沒有多語言介面框架（整個 App 的內容就是繁體中文，對應專案 `CLAUDE.md`:程式碼用英文、畫面內容用中文）、沒有報告匯出成 PDF/Word（先只做畫面上可編輯、可複製的文字）。
