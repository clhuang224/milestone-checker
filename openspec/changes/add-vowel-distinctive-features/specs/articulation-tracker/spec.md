# Delta for articulation-tracker

## ADDED Requirements

### Requirement: 元音辨異徵性

系統 SHALL 為單元音（介音 ㄧㄨㄩ 與單韻母）記錄舌位高低、舌位前後、唇形三項辨異徵性;捲舌與舌尖元音 SHALL 各為獨立的是否項，而非舌位的一種值。

#### Scenario: 檢視單元音的辨異徵性

- WHEN 治療師檢視 ㄧ 這個符號
- THEN 系統顯示它的舌位高低、舌位前後與唇形

#### Scenario: 捲舌與舌位正交

- WHEN 比較 ㄦ 與 ㄜ
- THEN 兩者的舌位高低、前後、唇形相同，只有捲舌這一項不同

### Requirement: 複合韻母以韻頭韻腹韻尾拆解

系統 SHALL 把複韻母與聲隨韻母拆解成韻頭、韻腹、韻尾三個位置，韻尾限定為 `i`、`u`、`n`、`ng` 四個值。複合韻母 SHALL NOT 帶有自己的元音辨異徵性——其徵性來自韻腹。

#### Scenario: 複韻母與聲隨韻母結構相同

- WHEN 檢視 ㄞ 與 ㄢ 的結構
- THEN 兩者都是「韻腹 ㄚ ＋ 韻尾」，只差在韻尾是元音韻尾還是輔音韻尾

#### Scenario: 拆解不代表等同分開發音

- WHEN 閱讀 `references/taiwan-mandarin-vowels.md`
- THEN 文件明確記載拆解是建模上的方便，ㄞ 的聲學組成與「ㄚ 接著 ㄧ 分開念」並不相同

### Requirement: 臨床參考資料與程式碼一致

系統的臨床辨異徵性資料 SHALL 同時存在於 `references/` 的 markdown 表格與程式碼中，並 SHALL 有自動檢查阻止兩者不一致。

#### Scenario: 只改了程式碼

- WHEN 有人修改了 `src/app/data/` 裡的辨異徵性但沒有同步 `references/`
- THEN 提交前的檢查失敗，並指出是哪一個符號的哪一項不一致

## MODIFIED Requirements

### Requirement: 注音符號參考表

系統 SHALL 提供一份依教育部標準順序排列的靜態注音符號參考表，涵蓋聲母、介音、韻母、聲調四個類別。聲母 SHALL 附掛部位／方式／送氣／清濁四項辨異徵性;介音與單韻母 SHALL 附掛元音辨異徵性。參考表 SHALL 包含兩個空韻符號 `ɿ` 與 `ʅ`，分別對應 ㄗㄘㄙ 與 ㄓㄔㄕㄖ 的韻母，SHALL NOT 使用單一的 `ㄭ` 涵蓋兩者。

#### Scenario: 檢視構音記錄表格

- WHEN 治療師開啟一個個案的構音記錄表格
- THEN 表格依注音參考表的順序列出所有列，涵蓋聲母、介音、韻母、聲調

#### Scenario: 區分兩個空韻

- WHEN 治療師檢視空韻的列
- THEN 表格分別列出 `ɿ` 與 `ʅ`，並在游標停留時說明各自對應哪一組聲母

#### Scenario: 舌尖元音不標舌位

- WHEN 檢視 `ɿ` 或 `ʅ` 的辨異徵性
- THEN 唇形標為展唇、標記為舌尖元音，但舌位高低與前後留空——文獻對此沒有定論，系統不代為決定
