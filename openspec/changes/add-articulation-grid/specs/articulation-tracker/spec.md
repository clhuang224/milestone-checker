# Delta for articulation-tracker

## ADDED Requirements

### Requirement: 注音格子表

系統 SHALL 用格子表呈現構音記錄，聲母依標準注音表分欄排列，同欄為同部位、由左至右部位由前到後。每個目標音 SHALL 有固定三組「目標詞 ＋ 錯音」輸入。

#### Scenario: 檢視構音記錄

- WHEN 治療師開啟構音記錄
- THEN 聲母排成標準注音表的欄位，每個音底下有三組輸入

#### Scenario: 記錄一個錯誤

- WHEN 治療師在 ㄆ 這一格填入目標詞「拋」與錯音「ㄅㄠ」
- THEN 系統記下這一筆，並以 ㄅ 作為錯誤音

#### Scenario: 構音正確

- WHEN 治療師填了目標詞但錯音留白
- THEN 這一筆視為該音構音正確，不產生任何音韻歷程

### Requirement: 錯音填整個音節

系統 SHALL 讓治療師以自由文字填寫實際聽到的音，取第一個注音符號作為錯誤音;緊接在第一個符號之後的上標 `ⁿ` SHALL 解讀為鼻音化。無法解析時 SHALL NOT 報錯或拒絕輸入。

#### Scenario: 取第一個符號

- WHEN 錯音填「ㄆㄠ」
- THEN 系統以 ㄆ 作為錯誤音

#### Scenario: 鼻音化只算在第一個符號上

- WHEN 錯音填「ㄧⁿ」
- THEN 系統認定為 ㄧ 帶鼻音化

- WHEN 錯音填「ㄉㄭⁿ」
- THEN 系統以 ㄉ 作為錯誤音且不帶鼻音化——那個上標屬於後面的 ㄭ

#### Scenario: 解析不出注音

- WHEN 錯音填的內容裡沒有注音符號
- THEN 系統保留這段文字，但不從它推導任何音韻歷程

### Requirement: 音韻歷程自動推導

系統 SHALL 依 `references/phonological-processes.md` 的推導條件，從整份構音記錄推導音韻歷程。一筆錯誤 SHALL 可以同時命中多條歷程。推導結果 SHALL NOT 被寫入儲存。

#### Scenario: 方式改變

- WHEN 記錄了 ㄙ→ㄉ
- THEN 推導出塞音化，且 SHALL NOT 附加任何位置歷程

#### Scenario: 一筆錯誤命中多條

- WHEN 記錄了 ㄑ→ㄅ
- THEN 同時推導出不送氣化與塞音化

#### Scenario: 位置歷程不推導

- WHEN 記錄了 ㄉ→ㄍ
- THEN 系統 SHALL NOT 推導出後置化——前置化與後置化在文獻裡是列舉的替代型態，不是位置差的函數，只能手動貼

#### Scenario: 歸納呈現

- WHEN 記錄了 ㄙ→ㄉ 與 ㄕ→ㄉ
- THEN 歷程區塊顯示「塞音化:ㄕ ㄙ」

### Requirement: 可改用手動歸納

系統 SHALL 讓治療師關閉自動推導，改為自己指定哪些歷程涵蓋哪些音。關閉時 SHALL 提供空白的手動區塊，SHALL NOT 沿用推導結果作為起點。

#### Scenario: 切換成手動

- WHEN 治療師把歷程區塊切換成「自己選」
- THEN 出現一個空白的手動區塊，推導結果不再套用

#### Scenario: 切換回自動

- WHEN 治療師切換回「使用推導結果」
- THEN 畫面回到依當前資料推導出的歷程

#### Scenario: 不列出不可能的歷程

- WHEN 治療師為 ㄅ 手動挑選音韻歷程
- THEN 清單裡不會出現塞音化——ㄅ 本身就是塞音，不可能被塞音化

## MODIFIED Requirements

### Requirement: 音韻歷程的歸類方式

系統 SHALL 預設依辨異徵性自動推導音韻歷程，並 SHALL 讓治療師整份覆寫成自己的歸納。

> 這條取代了 `add-articulation-process-tracker` 的「音對貼音韻歷程標籤」需求，該需求要求歷程只能手動指定、系統不做自動判斷。改變的前提是 `references/` 裡的辨異徵性與部位排序已由使用者逐項確認，推導有可信的依據。

#### Scenario: 預設自動

- WHEN 治療師填完構音記錄，沒有動過歷程區塊的設定
- THEN 歷程由系統推導

#### Scenario: 覆寫

- WHEN 治療師改成自己選並指定了歷程
- THEN 後續的警示與報告都以治療師指定的為準
