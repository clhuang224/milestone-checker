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
