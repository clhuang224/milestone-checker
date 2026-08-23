# 任務:add-tone-and-case-background

順序就是執行順序。第 1 節不依賴任何未決問題，可以先做;第 2、3 節卡在 Q2–Q6;第 6 節卡在 Q10／Q11。「聽力分左右耳」與「轉介規則維持原樣」是已定案的決定，見 `proposal.md` 的〈已定案〉。

## 1. 聲調自成一類

- [ ] 1.1 `core/articulation/derive-processes.ts`:目標音類別是 `tone` 時 `deriveProcessIds()` 直接回 `[]`;單元測試涵蓋「聲調列的錯音帶 ⁿ 不再推導出母音鼻音化」與「`applicableProcessIds('tone3')` 是空的」
- [ ] 1.2 （需 Q7）`core/articulation/parse-heard.ts`:解析時可指定要哪一類符號，聲調列取第一個**聲調**符號;`probeErrors()` 依 `targetPhonemeId` 的類別呼叫;單元測試涵蓋「ㄆㄠˊ」在聲調列解析成 `tone2`、在聲母列仍解析成 `p`，以及一聲寫「ㄆㄠ」時仍算一筆錯誤但沒有錯音 id

## 2. 個案母語

- [ ] 2.1 （需 Q2／Q3／Q4）`models/case.model.ts`:新增 `NativeLanguageId` 聯集、`NATIVE_LANGUAGE_LABELS`，以及 `Case` 的 `nativeLanguages?` 與 `otherNativeLanguages?` 兩個欄位（型別註解寫明「未填是 undefined，不是空陣列」與「其他不進規則事實」）
- [ ] 2.2 （需 Q9）`features/cases/case-detail`:〈基本資料〉加母語多選與「其他」輸入;「其他」不接受清單上已經有的語言
- [ ] 2.3 `core/rule-engine/facts.ts`:`buildFacts()` 的 `case` 加上 `nativeLanguages`，只放有 id 的那些;單元測試:未填時該欄位不存在

## 3. 個案聽力（分左右耳，決定一）

- [ ] 3.1 （需 Q5）`models/case.model.ts`:新增 `HearingStatus` 聯集、`HEARING_STATUS_LABELS`、`CaseHearing`（`left?`／`right?`）與 `Case.hearing?`;型別註解寫明兩件事——「只填一耳是合法狀態，不要補另一耳的預設值」，以及「事實層的 `leftNormal`／`rightNormal` 是有損投影，之後加成員的人要一併決定它算正常還是異常」
- [ ] 3.2 （需 Q5／Q6）`features/cases/case-detail`:〈基本資料〉加左耳、右耳兩個聽力欄位，各自三態且**都沒有預設值**;元件測試:新建的個案兩耳都讀不出狀態，且只填一耳存得起來
- [ ] 3.3 （需 Q10 才寫得出最後一則測試）`core/rule-engine/facts.ts` 與 `CASE_FIELDS`:加 `case.hearing.leftNormal`／`case.hearing.rightNormal` 兩個事實與兩筆 `RuleField`（「左耳聽力正常」「右耳聽力正常」），**不加合起來的 `hearingNormal`**;程式碼註解寫明不合起來的理由（合成規則會把臨床判斷藏進事實層，比照兩種年齡不自動挑一個）;單元測試:某一耳未填的個案不觸發用到那一耳的規則、只填一耳時「兩耳都正常」的 AND 規則不觸發

## 4. 條件列

- [ ] 4.1 `core/rule-engine/condition-mapper.ts`:`ConditionSubject` 新增 `'articulationCategory'`，比對 `targetCategory`;來回轉換測試
- [ ] 4.2 `condition-mapper.ts`:集合改由 subject 決定（`SUBJECT_COLLECTION`），新增 `'nativeLanguage'`;`setRowFrom()` **先看集合再看述詞**;來回轉換測試涵蓋母語列與 process 列不會互相認錯
- [ ] 4.3 `core/rule-engine/json-logic.ts`:未填欄位守門延伸到母語列（構音三種 subject 維持跳過），註解寫明跳過的理由是「空清單是合法答案」而母語不滿足這個前提;單元測試:沒填母語與填了但不含華語，兩者行為要分得出來
- [ ] 4.4 （需 Q8）`features/rules/rule-editor/condition-editor`:對象下拉分組（構音／個案），新增「構音錯誤類別」與「母語」;母語列**只提供「包含」**;聲調的選項標籤用 `label` 不用 `symbol`
- [ ] 4.5 （需 Q10）元件測試:用編輯器建出「母語含台灣華語 AND 兩耳聽力正常 AND 有聲調錯誤」（實際幾列依 Q10 的答案），存檔後重新開啟能還原成對應的條件列而不是原始 JSON

## 5. 揭露

- [ ] 5.1 `features/cases/case-detail`:把「沒填生日的話，用到年齡的規則不會判斷」改成講機制（涵蓋生日、母語、左右耳），不新增其他畫面文字

## 6. 那條規則

- [ ] 6.1 回歸測試:一個只有聲調錯誤的四歲以上個案仍然觸發 `rule-articulation-therapy-referral`;測試名稱與註解寫明這是**決定二**（開發者定案保留這個警示），不是還沒改到的東西
- [ ] 6.2 （需 Q10／Q11）若要出貨:`data/starter-rules.ts` 新增這條規則（「聽力正常」依 Q10 的答案寫成 AND 或 OR），並把 `storage.ts` **所有** key 一起升到 `:v8`;`starter-content.spec.ts` 補斷言

## 7. 收尾

- [ ] 7.1 `docs/ARCHITECTURE.md` 第三節補上三個新事實（含「不做合起來的聽力正常」這個決定與理由）與母語列的守門例外;第五節的儲存版號從 `:v5` 更正成當時的實際版號
- [ ] 7.2 `docs/使用說明.md` 補母語與左右耳聽力欄位的說明（含「其他」輸入的語言規則讀不到、聽力欄位不是純音聽檢結果、規則裡「聽力正常」要自己寫成兩列）
- [ ] 7.3 `references/open-questions.md` 的〈聲調〉一節改寫成已完成，指向本 change
- [ ] 7.4 `pnpm lint` / `pnpm test` / `pnpm build` 全過
- [ ] 7.5 e2e:建一個母語含台灣華語、兩耳聽力正常的個案，在聲調列記一筆錯誤，確認警示跳出來
