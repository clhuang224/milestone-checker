# 設計:add-articulation-grid

## 記錄單位改成「一個目標音一筆、固定三組」

```ts
export interface ProbeItem {
  /** 目標詞的國字，例如「包」 */
  word: string;
  /** 實際聽到的音，例如「ㄆㄠ」;留白代表構音正確 */
  heard: string;
}

export interface ArticulationProbe {
  id: string;
  caseId: string;
  assessmentId: string;
  targetPhonemeId: string;
  items: ProbeItem[];
}
```

取代原本的 `ArticulationSubstitution`。差別在:

- 一個目標音**一筆**紀錄，不是多筆音對——格子表一列就是一筆
- 歷程標籤**不在這裡**，改成整份評估一份歸納
- 錯誤音從「注音符號 id」變成**自由文字的整個音節**

自由文字是為了讓治療師照聽到的寫。代價是系統要解析，而解析可能失敗;失敗時就當作沒有可推導的錯誤音，不是報錯——治療師寫的東西不該被系統拒絕。

## 解析聽到的音

```ts
export function parseHeard(text: string): { symbolId?: string; diacritic?: ArticulationDiacritic };
```

規則:

- 取**第一個**注音符號當錯誤音（「ㄆㄠ」→ ㄆ）
- 上標 `ⁿ` 只有**緊接在第一個符號後面**才算在它頭上（「ㄧⁿ」→ ㄧ＋鼻音化;「ㄉㄭⁿ」→ ㄉ，那個 ⁿ 是 ㄭ 的）
- 解析不出注音符號就回空的結果

## 推導

`deriveProcessIds(targetPhonemeId, heard)` 依 `references/phonological-processes.md` 的判準比對辨異徵性，回傳所有命中的歷程 id。

**一筆錯誤可以中多條**:ㄙ→ㄉ 同時改了部位與方式，後置化與塞音化都算。

前置化／後置化靠 `PLACE_ORDER` 的索引比大小。其餘靠方式、送氣、韻尾、附加符號直接比對。

介音省略推導不出來（音節層次現象），不列入。

## 歸納結果存不存？

**推導結果不存。** 它是資料的函數，存下來只會跟資料不同步。存的只有覆寫:

```ts
export interface PhonologicalSummary {
  assessmentId: string;
  useDerived: boolean;
  /** 只在 useDerived 為 false 時有意義 */
  manual: { processId: string; targetPhonemeIds: string[] }[];
}
```

沒有這筆紀錄就等於「使用推導結果」——不必為了每次評估先寫一筆預設值。

## 哪些歷程該出現在手動清單裡

手動挑選時不列出對該目標音不可能的歷程。判準跟推導同一套:**某個歷程對目標音 T 適用，等同於存在某個錯誤音會讓 T 命中這條歷程**。

實作上直接拿 T 去跟所有注音符號配對跑一次推導，看得出哪些歷程可能出現。這樣「ㄅ 不該出現塞音化」不用另外維護一張對照表，規則只有一份。

## 格子表排版

依標準注音表分欄:

```
ㄅ ㄉ ㄍ ㄐ ㄓ ㄗ
ㄆ ㄊ ㄎ ㄑ ㄔ ㄘ
ㄇ ㄋ ㄏ ㄒ ㄕ ㄙ
ㄈ ㄌ       ㄖ
```

三組輸入在格子內**直向堆疊**。六欄乘上每格六個輸入框會寬到必須橫向捲動，那就失去一眼掃完的意義了。

韻母、介音、聲調各自成區，用同樣的格子，但不分欄（它們沒有對應的部位排列）。
