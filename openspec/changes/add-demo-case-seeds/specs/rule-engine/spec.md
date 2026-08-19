# Delta for rule-engine

## ADDED Requirements

### Requirement: 示範個案

系統 SHALL 在個案清單為空時附上一筆示範個案，內容為改寫、簡化過的示意資料，讓第一次開啟的使用者看得到警示與報告草稿實際長什麼樣子。示範個案 SHALL 是一筆可以直接編輯或刪除的普通個案，刪除後 SHALL NOT 再次出現。

#### Scenario: 第一次開啟

- WHEN 一位使用者第一次開啟 app
- THEN 個案清單裡有一筆示範個案，點進去看得到被觸發的警示與組好的報告草稿

#### Scenario: 刪掉示範個案

- WHEN 治療師刪除示範個案，之後重新整理頁面
- THEN 示範個案不會再被 seed 回來

#### Scenario: 已經有自己的個案

- WHEN 一位已經建立過個案的使用者重新整理頁面
- THEN 系統不會插入示範個案

### Requirement: 示範個案的年齡不隨時間失效

系統 SHALL 由 seed 執行當天回推示範個案的生日，SHALL NOT 寫死固定日期。

#### Scenario: 隔年再次第一次開啟

- WHEN 使用者在隔年清空資料後重新開啟 app
- THEN 示範個案顯示的年齡與當初設計時相同，用來示範年齡條件的規則仍然會被觸發

## MODIFIED Requirements

### Requirement: 純本機儲存

系統 SHALL 把資料只存在瀏覽器的 `localStorage`，key 帶命名空間與版號，讀到壞資料時 fallback 成空集合。PoC 階段調整預設內容時，SHALL 直接提高 key 的版號讓舊資料作廢，SHALL NOT 為了保留舊資料而撰寫遷移程式。

#### Scenario: 重新整理頁面

- WHEN 治療師記錄資料後重新整理頁面
- THEN 先前的資料都還在

#### Scenario: 預設內容改版

- WHEN 開發者調整了預設的觀察項目或規則並提高 key 的版號
- THEN 既有使用者的舊資料整包作廢，重新看到新的一套預設內容
