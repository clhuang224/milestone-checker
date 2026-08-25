# 任務:add-case-background-conditions

順序就是執行順序。第 1 節與第 4 節的 4.1 不依賴任何未決問題，可以先做;第 2 節的 2.2 卡在 Q4;第 3 節卡在 Q1、Q2、Q3;第 6 節卡在 Q5。已定案的決定（聲調只記錄不判斷、轉介規則維持原樣、聽力分左右耳、整體看優耳、母語的用途）見 `proposal.md` 的〈已定案〉，不要在實作時重開。

**沒有「聲調不推導音韻歷程」這一項**——它已經實作並提交（commit `94665c6`，`deriveProcessIds()` 對聲調目標音一律回空清單）。規格裡留著記載，這裡不留任務。

## 1. 聲調:只記錄，所以記下來的要是對的

- [ ] 1.1 `core/articulation/parse-heard.ts`:解析時可指定要哪一類符號，聲調列取第一個**聲調**符號;`probeErrors()` 依 `targetPhonemeId` 的類別呼叫;註解寫明理由是**不無中生有**（系統不判斷聲調，所以這裡記錯了沒有任何機制會發現）;單元測試涵蓋「ㄆㄠˊ」在聲調列解析成 `tone2`、在聲母列仍解析成 `p`，以及聲調列寫「ㄆㄠ」時仍算一筆錯誤、沒有錯音 id、`errorLabel()` 退回顯示原文
- [ ] 1.2 回歸測試:一個只有聲調錯誤的四歲以上個案仍然觸發 `rule-articulation-therapy-referral`;測試名稱與註解寫明這是**決定三**（開發者定案保留這個警示），不是還沒改到的東西

## 2. 個案母語

- [ ] 2.1 `models/case.model.ts`:新增 `NativeLanguageId` 聯集（成員依決定七的清單）、`NATIVE_LANGUAGE_LABELS`，以及 `Case` 的 `nativeLanguages?` 與 `otherNativeLanguages?` 兩個欄位;型別註解寫明三件事——「未填是 undefined，不是空陣列」、「其他不進規則事實」，以及決定八的推廣（規則問的是「評估標的跟他的語言背景對不對得上」）
- [ ] 2.2 （需 Q4）`features/cases/case-detail`:〈基本資料〉加母語多選與「其他」輸入;「其他」不接受清單上已經有的語言
- [ ] 2.3 `core/rule-engine/facts.ts`:`buildFacts()` 的 `case` 加上 `nativeLanguages`，只放有 id 的那些;單元測試:未填時該欄位不存在（不是空陣列）

## 3. 個案聽力（決定四、決定五）

- [ ] 3.1 （需 Q2）`models/case.model.ts`:新增 `HearingStatus` 聯集、`HEARING_STATUS_LABELS`、`CaseHearing`（`left?`／`right?`）與 `Case.hearing?`;型別註解寫明兩件事——「只填一耳是合法狀態，不要補另一耳的預設值」，以及「投影是有損的:之後加成員的人要一併決定它在 `leftNormal`／`rightNormal`／`betterEarNormal` 三處各算什麼」
- [ ] 3.2 （需 Q2／Q3）`features/cases/case-detail`:〈基本資料〉加左耳、右耳兩個聽力欄位，各自三態且**都沒有預設值**;元件測試:新建的個案兩耳都讀不出狀態，且只填一耳存得起來
- [ ] 3.3 `core/rule-engine/facts.ts`:加 `case.hearing.leftNormal`／`rightNormal` 兩個投影，以及合成的 `betterEarNormal`（一耳正常就 `true`;兩耳都異常才 `false`;其餘 `undefined`）;程式碼註解寫明基礎是身障判定的優耳慣例、以及為什麼「異常 ＋ 未填」不能是 `false`;單元測試把 `design.md` 第四節那張真值表六格全部涵蓋
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

## 6. 出貨（需 Q5，建議不做）

- [ ] 6.1 （需 Q5）若要出貨決定六那條附註規則:`data/starter-rules.ts` 新增一條 `severity: 'info'` 的規則（條件內容要開發者指定，不自行擬定），並把 `storage.ts` **所有** key 一起升到 `:v8`;`starter-content.spec.ts` 補斷言

## 7. 收尾

- [ ] 7.1 `docs/ARCHITECTURE.md` 第三節補上新事實（含優耳那一項的算法與它推翻了什麼）與母語列的守門例外;第五節的儲存版號從 `:v5` 更正成當時的實際版號
- [ ] 7.2 `docs/user-guide.md` 補母語與左右耳聽力欄位的說明（含「其他」輸入的語言規則讀不到、聽力欄位不是純音聽檢結果、「整體聽力正常」看的是優耳、決定六那條附註規則要自己建）
- [ ] 7.3 `references/open-questions.md` 的〈聲調〉一節:把「聽力欄位也要做（見下）」那個指不到東西的指標修掉，並指向本 change 的名字
- [ ] 7.4 `pnpm lint` / `pnpm test` / `pnpm build` 全過
- [ ] 7.5 e2e:建一個母語含台語、左耳正常右耳未填的個案，確認優耳規則判得出「正常」，並在聲調列記一筆「ㄆㄠˊ」確認記下來的是二聲
