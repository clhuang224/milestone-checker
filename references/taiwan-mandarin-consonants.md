# 聲母辨異徵性

21 個注音聲母的部位、方式、送氣、清濁。程式碼對應 `src/app/data/zhuyin-inventory.ts`，有測試比對兩邊一致。

`id` 欄是程式裡用的值，中文欄位是畫面顯示用的。

## 辨異徵性值

| 項目 | id               | 顯示   |
| ---- | ---------------- | ------ |
| 部位 | `bilabial`       | 雙唇   |
| 部位 | `labiodental`    | 唇齒   |
| 部位 | `alveolar`       | 齒槽   |
| 部位 | `velar`          | 舌根   |
| 部位 | `alveolopalatal` | 舌面   |
| 部位 | `retroflex`      | 舌尖後 |
| 部位 | `dentalAlveolar` | 舌尖前 |
| 方式 | `stop`           | 塞音   |
| 方式 | `affricate`      | 塞擦音 |
| 方式 | `fricative`      | 擦音   |
| 方式 | `nasal`          | 鼻音   |
| 方式 | `lateral`        | 邊音   |
| 送氣 | `aspirated`      | 送氣   |
| 送氣 | `unaspirated`    | 不送氣 |
| 送氣 | `notApplicable`  | 不適用 |
| 清濁 | `voiced`         | 濁音   |
| 清濁 | `voiceless`      | 清音   |

## 部位由前到後的排序

這是國語語音學的標準分類順序，多份台灣來源一致。**但它不用來判斷前置化／後置化**，理由見下方。

1. 雙唇 `bilabial`
2. 唇齒 `labiodental`
3. 舌尖前 `dentalAlveolar`
4. 齒槽 `alveolar`
5. 舌尖後 `retroflex`
6. 舌面 `alveolopalatal`
7. 舌根 `velar`

> **不要拿這個排序去推導前置化／後置化。** 查過的每一份文獻——鄭靜宜的測驗手冊與 2011 論文、童寶娟／台北榮總、碩論、以及英語系的臨床定義——都是列舉「目標音集合 → 錯誤音集合」的查找表，沒有任何一份先定義座標再算差值。前置化的目標音只有 ㄍㄎㄏㄐㄑㄒ 六個、後置化有十一個，兩者不對稱，本來就不是同一條軸的正負兩向。
>
> 最前面三層（唇齒／舌尖前／齒槽）的相對前後在臨床上根本不做區分，語音學來源之間也互相矛盾（舌尖抵上齒背 vs 下齒背;分欄 vs 同欄），儀器資料甚至指向相反方向。ㄗㄘㄙ 是舌葉音、ㄉㄊㄋㄌ 是舌尖音，差別在「用舌頭哪個部位」多過「口腔前後」。
>
> 所以程式碼裡沒有 `PLACE_ORDER` 這個常數;這個排序只用在構音表的欄位排列，讓同部位的音排在一起。

構音表的六欄就照這個順序排（`INITIAL_COLUMNS`）:

| 欄  | 注音     | 部位       |
| --- | -------- | ---------- |
| 1   | ㄅㄆㄇㄈ | 雙唇／唇齒 |
| 2   | ㄗㄘㄙ   | 舌尖前     |
| 3   | ㄉㄊㄋㄌ | 齒槽       |
| 4   | ㄓㄔㄕㄖ | 舌尖後     |
| 5   | ㄐㄑㄒ   | 舌面       |
| 6   | ㄍㄎㄏ   | 舌根       |

ㄈ 跟 ㄅㄆㄇ 同欄，雖然它是唇齒而不是雙唇——拆開就要第七欄，而六欄才塞得進畫面而不必橫向捲動。這是版面上的取捨，不影響它的辨異徵性。

## 聲母表

| 注音 | id   | 部位             | 方式        | 送氣            | 清濁        |
| ---- | ---- | ---------------- | ----------- | --------------- | ----------- |
| ㄅ   | `b`  | `bilabial`       | `stop`      | `unaspirated`   | `voiceless` |
| ㄆ   | `p`  | `bilabial`       | `stop`      | `aspirated`     | `voiceless` |
| ㄇ   | `m`  | `bilabial`       | `nasal`     | `notApplicable` | `voiced`    |
| ㄈ   | `f`  | `labiodental`    | `fricative` | `notApplicable` | `voiceless` |
| ㄉ   | `d`  | `alveolar`       | `stop`      | `unaspirated`   | `voiceless` |
| ㄊ   | `t`  | `alveolar`       | `stop`      | `aspirated`     | `voiceless` |
| ㄋ   | `n`  | `alveolar`       | `nasal`     | `notApplicable` | `voiced`    |
| ㄌ   | `l`  | `alveolar`       | `lateral`   | `notApplicable` | `voiceless` |
| ㄍ   | `g`  | `velar`          | `stop`      | `unaspirated`   | `voiceless` |
| ㄎ   | `k`  | `velar`          | `stop`      | `aspirated`     | `voiceless` |
| ㄏ   | `h`  | `velar`          | `fricative` | `notApplicable` | `voiceless` |
| ㄐ   | `j`  | `alveolopalatal` | `affricate` | `unaspirated`   | `voiceless` |
| ㄑ   | `q`  | `alveolopalatal` | `affricate` | `aspirated`     | `voiceless` |
| ㄒ   | `x`  | `alveolopalatal` | `fricative` | `notApplicable` | `voiceless` |
| ㄓ   | `zh` | `retroflex`      | `affricate` | `unaspirated`   | `voiceless` |
| ㄔ   | `ch` | `retroflex`      | `affricate` | `aspirated`     | `voiceless` |
| ㄕ   | `sh` | `retroflex`      | `fricative` | `notApplicable` | `voiceless` |
| ㄖ   | `r`  | `retroflex`      | `fricative` | `notApplicable` | `voiced`    |
| ㄗ   | `z`  | `dentalAlveolar` | `affricate` | `unaspirated`   | `voiceless` |
| ㄘ   | `c`  | `dentalAlveolar` | `affricate` | `aspirated`     | `voiceless` |
| ㄙ   | `s`  | `dentalAlveolar` | `fricative` | `notApplicable` | `voiceless` |

## 註記

**清濁只有 ㄇ、ㄋ、ㄖ 是濁音**，其餘 18 個都是清音。

最容易搞錯的是塞音那一組:中文的 ㄉ **不是**英語的 /d/，比較接近英語 stop 裡的 /t/——也就是**不送氣的清音**。ㄅ、ㄍ 同理。中文塞音與塞擦音的對立在**送氣與否**，不在清濁，所以 ㄅ／ㄆ、ㄉ／ㄊ、ㄍ／ㄎ 三組都是清音，差別在送氣欄。

ㄕ 與 ㄖ 的部位、方式、送氣完全相同，**唯一的區別就是清濁**。加上清濁這一欄之前，系統無法區分這兩個音。

**「舌尖後」不使用「捲舌」這個說法。** 程式碼裡的 id 沿用語音學慣例寫成 `retroflex`，但畫面一律顯示「舌尖後」。

`dentalAlveolar` 對應的是 dental-alveolar，依 repo 的識別字慣例寫成 camelCase。
