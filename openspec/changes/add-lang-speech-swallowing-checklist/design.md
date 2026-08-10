# 設計:add-lang-speech-swallowing-checklist

## 架構

Angular,最新版,**standalone components + Signals**(不用 NgModule)。大致結構:

```
src/app/
├── core/
│   └── storage/              StorageService — 唯一會碰 localStorage 的地方
├── features/
│   └── checklist/
│       ├── checklist-page/           最上層路由元件
│       ├── category-list/            渲染大項目
│       ├── milestone-item/           單一子項目:打勾、日期、活動建議
│       └── observation-log/          每個小孩的自由文字筆記
├── models/
│   └── milestone.model.ts    Category、Milestone、AchievementRecord、ObservationEntry 型別
└── shared/
    └── disclaimer-banner/    常駐的「僅供參考」警語
```

狀態放在 `StorageService`(或它上面一層小的 store service)裡用 Signals 管理,而不是讓元件各自維護本地狀態、跟實際存的資料不同步。

## 資料結構(草案)

```ts
interface Milestone {
  id: string;
  categoryId: 'language' | 'speech' | 'swallowing';
  title: string;                 // 繁體中文,給使用者看
  description?: string;
  typicalAgeRangeMonths?: [number, number];
  suggestedActivities?: string[]; // 繁體中文
  sourceNote?: string;            // 這條里程碑的資料來源——真正(非範例)的內容一定要填
}

interface AchievementRecord {
  milestoneId: string;
  achievedOnISODate: string;      // 小孩達成的日期
  note?: string;
}

interface ObservationEntry {
  id: string;
  dateISODate: string;
  text: string;                   // 家長的自由文字筆記,繁體中文
}
```

`sourceNote` 存在的目的,就是不讓任何一條里程碑內容沒有可追溯的來源——對應專案 `CLAUDE.md` 裡的健康內容注意事項。

## 資料儲存

一個 `StorageService`,`localStorage` 用單一有命名空間的 key(例如 `dev-milestones:v1`),存 JSON 序列化後的資料。這個規模不需要 IndexedDB。key 有版號,之後如果要改資料結構,不會悄悄把舊資料弄壞——真的需要的話,v2 遷移可以是之後另一個 change 再做。

## 樣式

Tailwind CSS。理由:不用自己從零刻一套設計系統就能快速做出「明亮活潑」的效果,而且參考專案也是用這個做出類似效果。

## 測試

單元測試用 Vitest(型別、`StorageService` 邏輯)。元件測試先求有就好(幾個 smoke test),不追求完整涵蓋率——這是實驗專案,不是以涵蓋率為目標的專案。

## 這次明確不做的事

沒有後端、沒有驗證機制、沒有跨裝置同步、沒有多語言介面框架(整個 App 的內容就是繁體中文,這是刻意的設計,對應專案 `CLAUDE.md`:程式碼用英文、畫面內容用中文)。
