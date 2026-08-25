# 設計:add-session-records

## 「評估還是治療」不是欄位

先前設計時假設紀錄上要有一個 `kind: 'assessment' | 'treatment'`。開發者的說法推翻了這個假設:

> 每個單子都是一筆「課節紀錄」，裡面可以選擇要用 SOAP 還是其他評估表，多選，但至少要有一種。

所以那個區分**由掛了哪些表表達**。掛 SOAP 就是治療紀錄，掛構音評估表就是評估，兩個都掛就是同一次回診做了兩件事。少一個欄位、少一組必須維持同步的規則，而且同一次同時做兩件事這個常見情境不用特別處理。

## 資料結構

```ts
export interface SessionRecord {
  id: string;
  caseId: string;
  /** YYYY-MM-DD — 實際上課／評估那天，不是建立紀錄那天 */
  onISODate: string;
  /** 掛在這一筆底下的表，至少一張 */
  formIds: string[];
  note?: string;
}

export interface AssessmentFormDefinition {
  id: string;
  name: string;
  /** 表的內容形態，決定用哪個畫面與貢獻哪些事實 */
  body: FormBody;
  builtin: boolean;
}

export type FormBody =
  | { kind: 'articulationGrid' }
  | { kind: 'soapNote' }
  | { kind: 'swallowTrials' }
  | { kind: 'itemList' };
```

`Assessment` 改名 `SessionRecord`;`assessedOnISODate` 改名 `onISODate`（它不再只是評估日）。各表的內容仍存在自己的集合裡，用 `recordId` 當外鍵，不折進紀錄本身——構音音對跟 SOAP 段落沒有共同形狀。

## 表是目錄，但不是全部可編

三種「可擴充」是不同的東西，值得寫清楚免得誤會:

| body.kind          | 誰做的            | 治療師可以設定什麼           |
| ------------------ | ----------------- | ---------------------------- |
| `itemList`         | 治療師，在 app 裡 | 整份項目清單                 |
| `articulationGrid` | 程式碼            | 音韻歷程目錄                 |
| `swallowTrials`    | 程式碼            | 質地／質性標記／計次單位目錄 |
| `soapNote`         | 程式碼            | （待該 change 決定）         |

新增一張打勾／分數形態的表是**資料**，治療師自己就能加。新增一個有自己輸入方式與推導邏輯的儀器是**程式碼**，每次都是。

## 事實的命名空間不能動

項目 id 維持**全域唯一且在事實物件最上層平鋪**。已儲存與已匯出的規則寫的是 `{"var": "drooling"}`;如果項目變成表限定的路徑（`forms.swallowing.drooling`），所有既有規則與治療師之間分享的規則檔全部失效，而 `condition-mapper` 沒有遷移路徑。

歸屬是編輯與顯示層的事，不是事實層的事。守住這一點，整個改版對規則引擎幾乎零成本。

## 規則歸誰

規則維持全域。理由是跨表規則本來就存在——「四歲以上仍有捲舌音以外的構音錯誤」同時讀 `case.ageInMonths`（不屬於任何表）與 `articulation.errors`。而且規則的匯出／匯入是既有功能，格式是扁平的 `Rule[]`，把規則塞進表底下會破壞這個格式與分享情境。

評估表一覽的最上面釘一列**跨表規則**，跟各張表並列但視覺上分開。之後各表的設定畫面顯示「引用到這張表項目的規則」這個過濾後的切片，讓治療師感覺像是表擁有它們。

## 畫面

**個案頁**——基本資料預設收起（生日與出生週數是建檔時填一次的東西，不該常駐佔掉第一屏），底下是課節紀錄表格:

```
日期        內容              當時年齡      重點
2026-03-02  構音 · 吞嚥       4歲11月      ⚠2
2026-01-15  SOAP              4歲10月
```

「當時年齡」用該筆紀錄的日期算，不是今天——這是 `add-assessment-sessions` 整個 change 的理由，也順便讓日期打錯當場看得出來。

**紀錄頁**——頁首放個案／日期／當時年齡，底下是路由式頁籤，一張表一條路由:

```
/cases/:caseId/records/:recordId/forms/:formId
```

用路由而不是元件內狀態，因為瀏覽器返回鍵要能在表之間走，而不是一次跳出整筆紀錄。所有輸入都是即時存檔，切頁籤不會掉資料。

**構音格子表不能被擠窄。** 六欄剛好塞滿 `max-w-6xl`，欄位由左至右是構音部位由前到後，wrap 掉就失去意義。新的頁首與頁籤列只能佔垂直空間，不能有側欄。
