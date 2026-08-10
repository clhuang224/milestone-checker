# Delta for development-checklist

## ADDED Requirements

### Requirement: 階層式打勾清單結構
系統 SHALL 把里程碑用大項目(語言、言語、吞嚥)分類,每個大項目底下有子項目。

#### Scenario: 檢視一個大項目
- WHEN 使用者打開打勾清單頁面
- THEN 使用者會看到三個大項目,各自可以展開看到子項目

### Requirement: 達成記錄
系統 SHALL 讓使用者把一個子項目標記為已達成,並記錄達成日期。

#### Scenario: 標記一個里程碑達成
- WHEN 使用者打勾一個里程碑子項目
- THEN 系統會請使用者輸入(或之後可編輯)達成日期
- AND 這個日期會跟里程碑一起被儲存

### Requirement: 活動建議
系統 SHALL 在有資料的情況下,選擇性顯示一個里程碑的建議居家活動。

#### Scenario: 有建議活動的里程碑
- WHEN 一個里程碑有定義 `suggestedActivities`
- THEN 那些建議會顯示在里程碑項目附近

### Requirement: 觀察日誌
系統 SHALL 讓使用者新增跟結構化打勾清單獨立的、有日期的自由文字筆記。

#### Scenario: 新增一則筆記
- WHEN 使用者在觀察日誌寫下筆記並儲存
- THEN 這則筆記連同日期一起被儲存,之後會顯示在日誌裡

### Requirement: 純本機儲存
系統 SHALL 把所有資料只存在瀏覽器的 `localStorage`,不使用任何後端或帳號系統。

#### Scenario: 重新整理頁面
- WHEN 使用者記錄資料後重新整理頁面
- THEN 先前記錄的打勾清單跟觀察日誌資料都還在

### Requirement: 僅供參考警語
系統 SHALL 顯示一個常駐、不會被永久關掉的提示,說明這個打勾清單僅供參考,不是診斷工具。

#### Scenario: 檢視任何頁面
- WHEN 使用者檢視 App 的任何頁面
- THEN 警語都是可見的(不會被藏在選單裡,也不會只出現一次)

### Requirement: 範圍限定在語言/言語/吞嚥
系統 SHALL 在這次 change 裡,只包含語言、言語、吞嚥這三個類別的內容——不包含其他發展面向。

#### Scenario: 大項目清單
- WHEN 檢視大項目清單
- THEN 只會看到語言、言語、吞嚥(其他面向要等之後的 change 才會加入)
