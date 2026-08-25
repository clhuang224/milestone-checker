# 設計:add-articulation-process-tracker

## 架構

延伸既有結構，新增一個獨立的 feature 區塊跟 model 檔，不動 `rule-engine`/`rules`/`findings` 既有程式碼:

```
src/app/
├── core/
│   └── storage/                          StorageService 加兩個新 key(articulation processes / records)
├── data/
│   └── zhuyin-inventory.ts               靜態注音參考表（37 符號 + 5 聲調 + 聲母辨異徵性）
│   └── starter-articulation-processes.ts 音韻歷程預設清單（佔位，待審核）
├── features/
│   └── articulation/
│       ├── articulation-table/           單一個案的構音記錄表格（依注音順序列出，列內可新增音對）
│       ├── process-list/                 音韻歷程目錄管理（新增/編輯/刪除）
│       └── process-overview/             依音韻歷程分組的總覽畫面
└── models/
    ├── zhuyin.model.ts                   ZhuyinSymbol、ZhuyinCategory、DistinctiveFeatures
    ├── phonological-process.model.ts     PhonologicalProcessDefinition
    └── articulation-record.model.ts      ArticulationSubstitution、WordExample
```

## 資料結構（草案）

```ts
// zhuyin.model.ts
type ZhuyinCategory = 'initial' | 'medial' | 'final' | 'tone';
//                     聲母        介音        韻母       聲調

interface DistinctiveFeatures {
  place?: string; // 部位，例如「雙唇」「舌尖」「舌根」「舌面」「舌尖前」「舌尖後（捲舌）」「唇齒」
  manner?: string; // 方式，例如「塞音」「鼻音」「邊音」「擦音」「塞擦音」
  aspiration?: '送氣' | '不送氣' | '不適用';
}

interface ZhuyinSymbol {
  id: string; // 例如 'b'、'p'、'a'、'tone2'
  symbol: string; // 顯示用符號，例如 'ㄅ'、'ㄚ'、'ˊ'
  category: ZhuyinCategory;
  order: number; // 表格排序（教育部標準順序）
  features?: DistinctiveFeatures; // 目前只有 category === 'initial' 會填
}

// phonological-process.model.ts
interface PhonologicalProcessDefinition {
  id: string;
  name: string; // 例如「不送氣化」
  description?: string;
  builtin: boolean; // true = 隨系統附的預設項目，false = 治療師自建
  sourceNote?: string; // 佔位內容一律要標「待審核」;治療師自建項目記自己的臨床依據
}

// articulation-record.model.ts
interface WordExample {
  word: string; // 例如「包」
  note?: string; // 選填補充，例如實際聽到的音「ㄆㄠ」
}

interface ArticulationSubstitution {
  id: string;
  caseId: string;
  targetPhonemeId: string; // 對應 ZhuyinSymbol.id，決定在表格哪一列
  errorPhonemeId?: string; // 留空 = 這個音正確(✓);有值 = 錯誤音
  processIds: string[]; // 掛的音韻歷程標籤，可以是 0 個或多個
  examples: WordExample[];
  updatedOnISODate: string;
}
```

`sourceNote` 沿用既有慣例:`starter-articulation-processes.ts` 裡的預設音韻歷程全部標「佔位，待治療師審核」，不能當真的臨床分類使用（對應 `CLAUDE.md` 健康內容注意事項）。

## 注音參考表（草案，教育部標準順序）

- **聲母(21)**:ㄅ ㄆ ㄇ ㄈ ㄉ ㄊ ㄋ ㄌ ㄍ ㄎ ㄏ ㄐ ㄑ ㄒ ㄓ ㄔ ㄕ ㄖ ㄗ ㄘ ㄙ
- **介音(3)**:ㄧ ㄨ ㄩ
- **韻母(13)**:ㄚ ㄛ ㄜ ㄝ ㄞ ㄟ ㄠ ㄡ ㄢ ㄣ ㄤ ㄥ ㄦ
- **聲調(5)**:一聲（陰平，通常不標符號）、ˊ 二聲、ˇ 三聲、ˋ 四聲、˙ 輕聲

聲母的辨異徵性草案（部位/方式/送氣），供你審核調整:

| 聲母  | 部位           | 方式   | 送氣        |
| ----- | -------------- | ------ | ----------- |
| ㄅ ㄆ | 雙唇           | 塞音   | 不送氣/送氣 |
| ㄇ    | 雙唇           | 鼻音   | 不適用      |
| ㄈ    | 唇齒           | 擦音   | 不適用      |
| ㄉ ㄊ | 舌尖           | 塞音   | 不送氣/送氣 |
| ㄋ    | 舌尖           | 鼻音   | 不適用      |
| ㄌ    | 舌尖           | 邊音   | 不適用      |
| ㄍ ㄎ | 舌根           | 塞音   | 不送氣/送氣 |
| ㄏ    | 舌根           | 擦音   | 不適用      |
| ㄐ ㄑ | 舌面           | 塞擦音 | 不送氣/送氣 |
| ㄒ    | 舌面           | 擦音   | 不適用      |
| ㄓ ㄔ | 舌尖後（捲舌） | 塞擦音 | 不送氣/送氣 |
| ㄕ ㄖ | 舌尖後（捲舌） | 擦音   | 不適用      |
| ㄗ ㄘ | 舌尖前         | 塞擦音 | 不送氣/送氣 |
| ㄙ    | 舌尖前         | 擦音   | 不適用      |

## 音韻歷程預設清單（草案，佔位待審核）

不送氣化、前置化、後置化、塞音化、塞擦音化、捲舌音舌尖化、邊音化（ㄋ/ㄌ混淆）、聲隨韻母簡化、介音省略、聲調混淆。每一項的 `description` 用一句話說明典型音對方向（例如「後置化:舌尖音被替代成舌根音，如 ㄉ→ㄍ」），但**不**內建「這個音對自動屬於哪個歷程」的判斷邏輯——純粹給治療師貼標籤時當參考說明。

## 跟規則引擎的關係（這次不做，但設計時保留空間）

`ArticulationSubstitution` 的欄位（`processIds`、`errorPhonemeId` 是否有值）設計成容易在未來衍生統計值（例如「某音韻歷程出現次數」「是否有任一後置化音對」），方便之後的 change 把這些統計值攤平成 JsonLogic facts、串進現有 `Rule` 系統。這次不做這個串接，也不會現在就幫 `Case` 加月齡/母語欄位——等真的要做那個 change 時再一併設計。

## 儲存

比照現有模式，`StorageService` 新增兩個獨立 key:

- `therapist-rule-engine:articulation-processes:v1` — `PhonologicalProcessDefinition[]`，有 upsert/delete，啟動時用 `starter-articulation-processes.ts` 做初始 seed（比照 findings 目錄的做法）。
- `therapist-rule-engine:articulation-records:v1` — `ArticulationSubstitution[]`，依 `caseId` 篩選使用。

注音參考表(`zhuyin-inventory.ts`)是純靜態常數，不進 localStorage、不可編輯。
