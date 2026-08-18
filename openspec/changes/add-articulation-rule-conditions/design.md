# 設計:add-articulation-rule-conditions

## 為什麼存生日而不是月齡

治療師填的是「8 歲 0 個月」，但存的應該是生日:

- 月齡存下來當天就開始過期，三個月後同一筆資料會讓「四歲以上」這種規則給出錯的答案。
- 生日只填一次，之後不用維護。

所以 `Case` 加的是 `birthDateISO?: string`（`YYYY-MM-DD`），月齡變成**推導值**:

```ts
export function ageInMonthsOn(birthDateISO: string, onDateISO: string): number;
```

表單仍然用日期輸入，旁邊即時顯示推算出來的「8 歲 0 個月」當回饋，治療師看得到系統算出來的跟他心裡想的一不一樣。

年齡以**今天**為基準。之後若要改成「評估當日年齡」，因為是推導值，只要換基準日的來源，資料結構不動。

## 事實物件的形狀

`evaluateCondition()` 目前直接把 `CaseProfile.values` 當成 JsonLogic 的 data。改成組一個更大的事實物件:

```
{
  ...profile.values,            // 觀察項目維持平鋪在頂層
  case: { ageInMonths },
  articulation: { errors: [ { targetPhonemeId, targetCategory, errorPhonemeId, diacritic, processIds } ] }
}
```

觀察項目**維持平鋪在頂層**是關鍵——既有規則寫的是 `{"var": "drooling"}`，形狀不變就不用遷移，舊規則也不會壞。新的事實放在 `case.` 跟 `articulation.` 兩個命名空間底下，跟觀察項目 id 不會撞名。

`errors` 只收真正的錯誤（用 Change A 建立的 `isArticulationError()` 判定），構音正確的 ✓ 不進去。

## 適用條件怎麼表示

新的條件列節點:

```ts
export interface ConditionSetRow {
  type: 'set';
  subject: 'articulationTarget' | 'articulationProcess';
  mode: 'includes' | 'excludes';
  values: string[];
}
```

對應到 JsonLogic 時用原生的 `some`／`in`／`!`，不自訂 operator，匯出的 JSON 對其他 JsonLogic 實作才通用:

```jsonc
// 「有 ㄓㄔㄕㄖ 以外的構音錯誤」
{
  "some": [
    { "var": "articulation.errors" },
    { "!": { "in": [{ "var": "targetPhonemeId" }, ["zh", "ch", "sh", "r"]] } },
  ],
}
```

`articulationProcess` 因為每筆錯誤的 `processIds` 本身是陣列，內層要再包一層 `some`。

### 「排除」是存在型，不是全稱型

這是最容易誤解的一點，UI 文案要寫清楚:

- **排除 ㄓㄔㄕㄖ** ＝ 把這幾個音扣掉之後，**仍然有**其他構音錯誤（存在型）
- 不是「完全沒有 ㄓㄔㄕㄖ 的錯誤」（全稱型）

治療師要的是前者:ㄓㄔㄕㄖ 是晚發展的音，那幾個音有錯可以先不算數，但**除此之外**還有錯就該處置。所以下拉選單旁邊直接寫出白話語意，不要只放「包含／排除」兩個詞。

## 未填欄位的守門要怎麼調整

`evaluateCondition()` 現在會先檢查條件用到的每個欄位都有值，避免 `null < 40` 這種 JS 型別強制轉換造成的誤觸發。加了新事實之後:

- 只有 `type === 'row'` 的節點需要這個檢查，`set` 節點不需要（空陣列 `some` 本來就是 `false`，語意正確）
- 欄位存在性檢查要支援 `case.ageInMonths` 這種點路徑

生日沒填時 `case.ageInMonths` 是 `undefined`，「四歲以上」那條規則就不會觸發——這是對的，不知道年齡時不應該亂給建議。

## 條件欄位的來源

`RuleEditor`／`ConditionEditor` 目前的 `fields` 型別是 `FindingDefinition[]`，但月齡不是觀察項目。改成一個只描述「可以拿來比大小的欄位」的介面:

```ts
export interface RuleField {
  id: string; // 'case.ageInMonths' 或觀察項目 id
  label: string;
  kind: 'boolean' | 'number';
}
```

`FindingDefinition` 結構上已經相容，所以清單就是「月齡 ＋ 所有觀察項目」。

## 為什麼拿掉錯誤音數

`articulationErrorCount`（構音錯誤音數）跟用它寫的 `> 3` 規則是最早的示範內容，但方向是錯的:嚴重度看的是錯誤的**形式**（哪一類歷程、是不是晚發展的音），不是**數量**。留著它會誤導後面照抄的人，而且現在構音表已經有真正的錯誤資料，用不到一個要手動維護的計數欄位。

`rule-speech-intelligibility` 原本是「錯誤音數 > 3 **或** 不熟悉的人難以理解」，拆掉前半支之後只剩後者，訊息文字一起改。
