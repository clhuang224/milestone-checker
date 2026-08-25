# 設計:add-assessment-sessions

## 為什麼是「場次」而不是「每筆記錄各自帶日期」

比較過三種做法:

| 做法                       | 問題                                                         |
| -------------------------- | ------------------------------------------------------------ |
| 個案層級一個「本次評估日」 | 下次評估會蓋掉上次，沒有歷史                                 |
| 每筆記錄各自帶日期         | 「這一次評估包含哪些項目」要靠日期反推，同一天做兩次就分不開 |
| **評估場次實體**           | 工程最大，但「一次評估」是治療師本來就有的概念               |

選第三種。報告是按「這一次評估」寫的，資料結構跟這個概念對齊，之後要做進步追蹤也才有東西可比。

## 資料結構

```ts
export interface Assessment {
  id: string;
  caseId: string;
  /** YYYY-MM-DD — 實際評估當天，不是建立這筆紀錄的那天 */
  assessedOnISODate: string;
  note?: string;
}
```

`CaseProfile` 改名 `AssessmentProfile`，key 從 `caseId` 換成 `assessmentId`。`ArticulationSubstitution` 新增 `assessmentId`。

### caseId 的反正規化

音對同時帶 `caseId` 與 `assessmentId`。前者在正規化的角度是多餘的（可以從 `assessmentId` 查到），但現有程式碼到處都是 `r.caseId === id`，全部改成 join 沒有好處。代價是兩個欄位可能不一致，所以:

- 型別註解寫明「必須與所屬 assessment 的 caseId 相同」
- 寫入一律走 storage 的方法，由它負責填 `caseId`，不讓元件自己組

## 矯正年齡

矯正月齡 ＝ 實齡 −（40 − 出生週數）週。

兩個要標成佔位待審核的數字:

- **足月定義 40 週**——也有用 37 週當足月下限的算法
- **適用期上限 24 個月矯正齡**——不同單位有用 2 歲也有用 3 歲

超過上限就回實齡，因為矯正年齡的意義在追趕期，追上之後再扣就失真了。

沒填出生週數時，矯正齡直接等於實齡——不是 `undefined`。這樣規則寫 `case.correctedAgeInMonths` 對足月兒也照常運作，規則作者不必為了「有沒有填週數」寫兩套條件。

## 事實與評估日

`buildFacts()` 現在收 `onDateISO: string`，改成收整個 `Assessment`，日期一律取 `assessedOnISODate`。

事實裡的年齡變成兩個:

```
case: { ageInMonths, correctedAgeInMonths }
```

**不自動幫使用者選**用哪一個。系統挑錯年齡基準是無聲的錯誤——規則照樣觸發，只是結論建立在錯的年齡上;讓規則作者明確選擇，錯了至少看得出來。

## 報告草稿

新增 `{{assessment.date}}` 佔位符，比照既有的 `{{case.label}}`／`{{value:id}}`。報告會寫「評估日期:2026-03-02」，而不是產生報告的那天。

## 場次刪除的連動

`removeCase` 已經連動刪除 profile 與音對，再加上場次。另外新增 `removeAssessment`，要連動刪掉該場次的 profile 與音對——比照既有 `removeArticulationProcess` 會把標籤從音對上拔掉的做法，不留孤兒資料。
