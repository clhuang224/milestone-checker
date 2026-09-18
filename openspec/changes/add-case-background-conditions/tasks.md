# 任務:add-case-background-conditions

順序就是執行順序。原本擋住第 2、3、6 節的五個問題開發者都已經裁決，**沒有任何一項還在等答案**;已定案的決定（聲調只記錄不判斷、轉介規則維持原樣、聽力分左右耳且有第四個值、整體看優耳、母語的用途與清單、出貨示範規則）見 `proposal.md` 的〈已定案〉，不要在實作時重開。

第 6 節排在最後而且要獨立提交:它會把儲存 key 整組升版，而升版是作廢，既有資料歸零。前面五節一項都不需要它，所以那個破壞性的改動要單獨站在一個 commit 上，好在出事的時候一眼認得出來。

**沒有「聲調不推導音韻歷程」這一項**——它已經實作並提交（commit `94665c6`，`deriveProcessIds()` 對聲調目標音一律回空清單）。規格裡留著記載，這裡不留任務。

## 1. 聲調:只記錄，所以記下來的要是對的

- [ ] 1.1 `core/articulation/parse-heard.ts`:解析時可指定要哪一類符號，聲調列取第一個**聲調**符號;`probeErrors()` 依 `targetPhonemeId` 的類別呼叫;註解寫明理由是**不無中生有**（系統不判斷聲調，所以這裡記錯了沒有任何機制會發現）;單元測試涵蓋「ㄆㄠˊ」在聲調列解析成 `tone2`、在聲母列仍解析成 `p`，以及聲調列寫「ㄆㄠ」時仍算一筆錯誤、沒有錯音 id、`errorLabel()` 退回顯示原文
- [ ] 1.2 回歸測試:一個只有聲調錯誤的四歲以上個案仍然觸發 `rule-articulation-therapy-referral`;測試名稱與註解寫明這是**決定三**（開發者定案保留這個警示），不是還沒改到的東西

## 2. 個案母語

- [ ] 2.1 `models/case.model.ts`:新增 `NativeLanguageId` 聯集（成員依決定七的清單）、`NATIVE_LANGUAGE_LABELS`，以及 `Case` 的 `nativeLanguages?` 與 `otherNativeLanguages?` 兩個欄位;型別註解寫明三件事——「未填是 undefined，不是空陣列」、「其他不進規則事實」，以及決定八的推廣（規則問的是「評估標的跟他的語言背景對不對得上」）
- [ ] 2.2 `features/cases/case-detail`:〈基本資料〉加母語多選與「其他」輸入;**不設選取數量上限**（決定十:不擋、不提示、不為「填太多」設計任何行為）;「其他」不接受清單上已經有的語言
- [ ] 2.3 `core/rule-engine/facts.ts`:`buildFacts()` 的 `case` 加上 `nativeLanguages`，只放有 id 的那些;單元測試:未填時該欄位不存在（不是空陣列）

## 3. 個案聽力（決定四、決定五）

- [ ] 3.1 `models/case.model.ts`:新增 `HearingStatus` 聯集，成員是正常、異常與**配戴聽覺輔具**三個（未填是欄位不存在，不是成員），第四個值的 id 用英文、助聽器與人工電子耳共用同一個成員;`HEARING_STATUS_LABELS` 的第三個標籤要讓治療師看得出兩種輔具都算;另加 `CaseHearing`（`left?`／`right?`）與 `Case.hearing?`;型別註解寫明兩件事——「只填一耳是合法狀態，不要補另一耳的預設值」，以及「投影是有損的:之後再加成員的人要一併決定它在 `leftNormal`／`rightNormal`／`betterEarNormal` 三處各算什麼」
- [ ] 3.2 `features/cases/case-detail`:〈基本資料〉加左耳、右耳兩個聽力欄位，各自可選三個值且**都沒有預設值**（未填是初始狀態）;依決定九**不加任何說明文字**——這兩個欄位只有 label 與選項名，沒有「由誰判定」的補充句;元件測試:新建的個案兩耳都讀不出狀態，且只填一耳存得起來，配戴輔具存得起來且讀回來還是同一個值
- [ ] 3.3 `core/rule-engine/facts.ts`:加 `case.hearing.leftNormal`／`rightNormal` 兩個投影，以及合成的 `betterEarNormal`;**配戴輔具在三處都算「非正常」**（決定五:它在優耳判定裡算異常，單耳事實只能跟著一致，否則會出現「左耳正常 ＝ 是」與「整體正常 ＝ 否」同時成立）;合成的規則是「任一耳為正常 → `true`;兩耳都已填而非正常 → `false`;其餘 `undefined`」;程式碼註解寫明基礎是身障判定的優耳慣例、以及為什麼「非正常 ＋ 未填」不能是 `false`;單元測試把 `design.md` 第四節那張真值表逐格涵蓋，含配戴輔具與異常互相搭配的那幾格
- [ ] 3.4 `CASE_FIELDS` 加三筆 `RuleField`:「整體聽力正常（優耳）」「左耳聽力正常」「右耳聽力正常」;單元測試:某一耳未填時用到那一耳的規則不觸發，且「異常 ＋ 未填」的個案對「整體聽力正常 == true」與「== false」**兩條規則都不觸發**（這一則是釘住 `undefined` 不會被改成 `false` 的那一則，不能省）

## 4. 條件列

- [ ] 4.1 `core/rule-engine/condition-mapper.ts`:`ConditionSubject` 新增 `'articulationCategory'`，比對 `targetCategory`;來回轉換測試
- [ ] 4.2 `condition-mapper.ts`:集合改由 subject 決定（`SUBJECT_COLLECTION`），新增 `'nativeLanguage'`;`setRowFrom()` **先看集合再看述詞**;來回轉換測試涵蓋母語列與音韻歷程列不會互相認錯（兩者的內層述詞形狀相同）
- [ ] 4.3 `core/rule-engine/json-logic.ts`:未填欄位守門延伸到母語列（構音三種 subject 維持跳過），註解寫明跳過的理由是「空清單是合法答案」而母語不滿足這個前提;單元測試:沒填母語與填了但不含指定語言，兩者行為要分得出來
- [ ] 4.4 `features/rules/rule-editor/condition-editor`:對象下拉分組（構音／個案），新增「構音錯誤類別」（選項取 `ZHUYIN_CATEGORY_LABELS`）與「母語」;母語列**只提供「包含」**;聲調的選項標籤用 `label` 不用 `symbol`
- [ ] 4.5 元件測試:用編輯器建出「母語包含台語 AND 構音錯誤目標音包含 ㄓㄔㄕㄖ」，存檔後重新開啟能還原成對應的條件列而不是原始 JSON

## 5. 揭露

- [ ] 5.1 `features/cases/case-detail`:把「沒填生日的話，用到年齡的規則不會判斷」改成講機制（涵蓋生日、母語、左右耳），不新增其他畫面文字
- [ ] 5.2 「整體聽力正常」看的是優耳這件事要在畫面上，而且**不能只有 tooltip**:欄位名帶上「（優耳）」、事實路徑叫 `betterEarNormal`（3.3／3.4 已經做掉這兩個），這一項是 UX 決定要不要再加一句比照 `MODE_HINTS` 的白話重述，以及 tooltip 的文字

## 6. 出貨示範規則與儲存升版（決定十一）

這一節每一項各自一個 commit，6.4 尤其不可以跟別的改動綁在一起。

- [ ] 6.1 `data/starter-rules.ts`:新增一條 `severity: 'info'` 的示範附註規則，條件是「母語包含台灣台語 AND 構音錯誤目標音包含 ㄕ、ㄈ、ㄩ」，用 4.2 之後編輯器反解得出來的形狀寫，**不要手寫編輯器打不開的 JsonLogic**;訊息文字要講出開發者指定的那三組替代（石頭說成俗頭、飛機說成灰機、萵苣說成萵記），並讓治療師讀得出這是可以照著改的示範;程式碼註解寫明條件比訊息寬的原因是條件列問不出「替代成哪個音」，**不要為此擴充條件詞彙**
- [ ] 6.2 `data/starter-cases.ts`:示範個案的母語補上台灣台語，讓 6.1 那條規則在守門之後仍然判斷得到;**聽力兩耳刻意留空**，程式碼註解寫明留空是為了示範「沒填就不判斷」，不是漏掉
- [ ] 6.3 `data/starter-cases.ts`:依開發者給的三組詞加三筆音對——石頭（目標音 ㄕ）、飛機（目標音 ㄈ）、萵苣（目標音 ㄩ），錯音格記的是他給的那個誤讀（俗、灰、記）;**不要再自行補充其他例子**;跑一次 `starter-cases.spec.ts`，示範個案推導出來的音韻歷程會跟著變，該調整的是斷言不是資料
- [ ] 6.4 `core/storage/storage.ts`:**十個 key 全部**從 `:v7` 升到 `:v8`（`findings`／`cases`／`rules`／`articulation-processes`／`articulation-records`／`phonological-summaries`／`swallow-trials`／`session-records`／`assessment-forms`／`reports`，一個都不能漏，只升一部分會留下讀不到主體的孤兒）;`storage.spec.ts` 裡寫死的 key 一併改;commit 訊息要寫明這一版是**作廢不是遷移**，既有使用者的資料歸零
- [ ] 6.5 `data/starter-content.spec.ts` 補斷言:6.1 那條規則存在、等級是提示、條件經 `fromJsonLogic()` 反解得出條件列而不是原始 JSON、對示範個案會觸發、對一個什麼都沒填（含沒填母語）的個案不觸發

## 7. 收尾

- [ ] 7.1 `docs/ARCHITECTURE.md` 第三節補上新事實（含優耳那一項的算法、配戴輔具算非正常、以及它推翻了什麼）與母語列的守門例外;第五節的儲存版號從 `:v7` 更新成 `:v8`
- [ ] 7.2 `docs/user-guide.md` 補母語與左右耳聽力欄位的說明（含「其他」輸入的語言規則讀不到、聽力欄位不是純音聽檢結果、四個可填的值、「整體聽力正常」看的是優耳），以及那條出貨的示範附註規則是拿來照著改或直接刪掉的
- [ ] 7.3 `references/open-questions.md` 的〈聲調〉一節:把「聽力欄位也要做（見下）」那個指不到東西的指標修掉，並指向本 change 的名字
- [ ] 7.4 `pnpm lint` / `pnpm test` / `pnpm build` 全過
- [ ] 7.5 e2e:建一個母語含台語、左耳正常右耳未填的個案，確認優耳規則判得出「正常」，並在聲調列記一筆「ㄆㄠˊ」確認記下來的是二聲
