# Delta for rule-engine

## ADDED Requirements

### Requirement: 課節紀錄

系統 SHALL 讓治療師為個案建立課節紀錄，每筆帶日期與備註，並 SHALL 掛上一到多張評估表;建立時 SHALL 要求至少選一張表，之後 SHALL 可以增減。

#### Scenario: 建立課節紀錄

- WHEN 治療師新增一筆課節紀錄並勾選「構音評估表」
- THEN 系統建立這筆紀錄，並讓治療師進入構音評估表填寫

#### Scenario: 一次做兩件事

- WHEN 一筆課節紀錄同時掛了 SOAP 與構音評估表
- THEN 兩張表都可以填寫，且屬於同一筆紀錄、同一個日期

#### Scenario: 至少要有一張表

- WHEN 治療師嘗試建立一筆沒有勾選任何表的課節紀錄
- THEN 系統不建立，並說明至少要選一張

### Requirement: 評估或治療由掛載的表表達

系統 SHALL NOT 在課節紀錄上另設「評估／治療」的類型欄位;這個區分 SHALL 由紀錄掛了哪些表表達。

#### Scenario: 治療紀錄

- WHEN 一筆課節紀錄只掛了 SOAP
- THEN 這筆紀錄呈現為治療紀錄，不需要另外標記類型

### Requirement: 評估表目錄

系統 SHALL 提供一份評估表目錄，每張表有名稱與內容形態。內容形態為打勾／分數清單的表，其項目 SHALL 可由治療師編輯;內容形態為專用儀器的表（構音格子、吞嚥試驗），其輸入方式 SHALL 由程式提供，治療師 SHALL 僅能設定它所使用的分類目錄。

#### Scenario: 檢視評估表一覽

- WHEN 治療師開啟評估表一覽
- THEN 看到各張表與它們的掛載數量

#### Scenario: 專用儀器不可改成項目清單

- WHEN 治療師開啟構音評估表的設定
- THEN 可以設定音韻歷程目錄，但不能改動注音格子的輸入方式

### Requirement: 觀察項目的事實命名空間維持平鋪

項目歸屬於某張表 SHALL 只影響編輯與顯示;規則事實中的項目 id SHALL 維持全域唯一且平鋪在最上層，既有規則與已匯出的規則檔 SHALL NOT 因此失效。

#### Scenario: 既有規則仍然可用

- WHEN 一份在改版前匯出的規則檔被匯入
- THEN 其中引用觀察項目的條件照常運作，不需要改寫

## MODIFIED Requirements

### Requirement: 年齡以課節日期推算

系統 SHALL 用課節紀錄的日期推算個案年齡，SHALL NOT 使用產生報告當天的日期。

#### Scenario: 課節日與報告日不同天

- WHEN 一筆課節紀錄的日期是個案 3 歲 11 個月當天，治療師兩週後才開啟它寫報告
- THEN 規則與報告草稿使用的年齡是 3 歲 11 個月

#### Scenario: 表格顯示當時年齡

- WHEN 治療師檢視個案頁的課節紀錄表格
- THEN 每一列顯示該次課節當天的年齡

### Requirement: 範圍限定在目前有的評估表

系統 SHALL 只實作目前已定義的評估表，新增其他領域的表 SHALL 另開 change。原本以「語言／言語／吞嚥」三分類限定範圍的做法 SHALL 廢除——該分類只涵蓋觀察項目，構音與吞嚥從未依循它。

#### Scenario: 新增一個領域

- WHEN 要加入一個目前沒有的評估表
- THEN 需要一個新的 OpenSpec change，不能默默擴充

## REMOVED Requirements

### Requirement: 觀察項目的三領域分類

移除理由:`categoryId: 'language' | 'speech' | 'swallowing'` 只被觀察表單的分區標題使用，而構音與吞嚥各有自己的資料模型與畫面，從未依循這個分類。分區的工作由評估表本身承接——構音評估表本身就是那個分組。
