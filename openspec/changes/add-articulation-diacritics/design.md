# 設計:add-articulation-diacritics

## 資料結構

`ArticulationSubstitution` 加一個選填欄位，另外拉一個聯集型別方便之後擴充:

```ts
export type ArticulationDiacritic = 'nasalized';

export interface ArticulationSubstitution {
  // ……既有欄位不動
  errorPhonemeId?: string;
  /** Extra mark layered on the error sound, e.g. nasalization. */
  errorDiacritic?: ArticulationDiacritic;
}
```

用聯集型別而不是 `boolean nasalized`，是因為之後要加第二種附加符號時不用再開新欄位、也不用處理「兩個 boolean 同時為 true」這種無效狀態。

## 「這筆算不算錯誤」的判定

這是這次唯一有語意風險的地方。既有規則是「`errorPhonemeId` 留空 = 構音正確（✓）」，加了附加符號之後改成:

| `errorPhonemeId` | `errorDiacritic` | 意義             | 顯示     |
| ---------------- | ---------------- | ---------------- | -------- |
| 空               | 空               | 構音正確         | `ㄆ ✓`   |
| `b`              | 空               | 純替代           | `ㄆ→ㄅ`  |
| 空               | `nasalized`      | 目標音本身鼻音化 | `ㄧ→ㄧⁿ` |
| `d`              | `nasalized`      | 替代後再鼻音化   | `ㄓ→ㄉⁿ` |

也就是:**兩個欄位都空才是 ✓，其餘皆為錯誤**;顯示時的底音是 `errorPhonemeId ?? targetPhonemeId`。

只有附加符號、錯誤音留空的那一列（ㄧ→ㄧⁿ）是最容易被誤判成 ✓ 的情況，所以判定邏輯只寫在 `substitution-label.ts` 一個地方，其他元件一律呼叫它，不各自判斷 `errorPhonemeId` 有沒有值。

## 上標怎麼呈現

用 Unicode 的上標字元 `ⁿ`（U+207F），不用 `<sup>`。理由:

- 音對標籤會出現在構音表、音韻歷程總覽，未來還會進報告草稿的純文字輸出——後者沒辦法帶 HTML 標記。
- 治療師複製報告草稿貼到別的系統時，`ㄧⁿ` 是可以直接貼過去的純文字。

## 空韻 ㄭ

`ㄭ`（U+312D）是 ㄓㄔㄕㄖㄗㄘㄙ 單獨成音節時的韻，教育部標準 37 個符號裡沒有它（那 37 個是 21 聲母 + 16 韻母/介音），但實際記錄構音時寫得到。放進 `FINALS` 的最後，`category: 'final'`、不附 `features`。

因為 `order` 是由陣列位置自動編號的，插在 `FINALS` 尾端不會動到既有符號的排序。`articulation-content.spec.ts` 有符號總數的斷言要一起更新。

## 預設音韻歷程

補兩筆，一樣掛 `PLACEHOLDER_NOTE`:

- `vowelNasalization`「母音鼻音化」——母音帶上鼻音成分，如 ㄧ→ㄧⁿ
- `diphthongReduction`「複韻母簡化」——複韻母失去介音或韻尾，如 ㄞ→ㄚ

既有的 `medialDeletion`（介音省略）留著不動。
