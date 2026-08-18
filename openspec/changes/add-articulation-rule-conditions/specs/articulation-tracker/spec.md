# Delta for articulation-tracker

## MODIFIED Requirements

### Requirement: 構音記錄與規則引擎的關係

系統 SHALL 把構音音對記錄提供給規則引擎當作評估事實，讓規則的適用條件能依構音錯誤與音韻歷程判斷。音韻歷程的**歸類**SHALL 仍然只由治療師手動貼標籤決定，系統 SHALL NOT 依構音特徵自動判斷某筆音對屬於哪個歷程。

> 這條取代了 `add-articulation-process-tracker` 的「獨立於規則引擎」需求。當初切開的理由是「需要先補上 `Case` 的月齡欄位，範圍會變大」，`add-articulation-rule-conditions` 正是來補那一塊。

#### Scenario: 構音資料觸發規則

- WHEN 治療師在構音記錄表格裡新增一筆錯誤音對，而某條已啟用規則的適用條件涵蓋它
- THEN 個案頁面上會出現這條規則的警示

#### Scenario: 系統仍然不自動歸類

- WHEN 治療師記錄了一筆 ㄉ→ㄍ 的錯誤音對但沒有貼任何標籤
- THEN 系統不會自動把它歸到「後置化」，音韻歷程總覽仍然把它列在「尚未歸類」底下
