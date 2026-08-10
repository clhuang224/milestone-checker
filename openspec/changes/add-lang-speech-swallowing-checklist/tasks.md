# 任務清單

## 1. 專案骨架

- [x] 1.1 在這個資料夾裡跑 `ng new` 建立 Angular App(standalone、zoneless/Signals、routing、Tailwind)——Angular 21.2,已驗證 `ng build` 跟開發伺服器都正常
- [x] 1.2 設定 Vitest(取代預設的 Jasmine/Karma)——原生 `--test-runner=vitest`,已驗證 `ng test` 通過
- [x] 1.3 確認 `tsconfig` 有開 `strict: true`(對應全域 CLAUDE.md)——已確認
- [x] 1.4 設定好 ESLint/Prettier(或 Angular 內建的等效工具),讓排版自動化,不用手動——Prettier 已隨 scaffold 內建(`.prettierrc`);ESLint 還沒加,留到之後補

## 2. 資料結構與資料儲存

- [x] 2.1 寫 `models/milestone.model.ts`(Category、Milestone、AchievementRecord、ObservationEntry)
- [x] 2.2 寫 `StorageService`(localStorage 讀寫、有命名空間+版號的 key)——`core/storage/storage.ts`,類別名稱是 `Storage`(Angular 2025 命名風格自動產生,拿掉 `Service` 字尾)
- [x] 2.3 `StorageService` 的單元測試(Vitest)——10 個測試全過,涵蓋新增/取代/清除 achievement、新增 observation、資料損毀時的 fallback

## 3. 範例內容(先當佔位,需要審核)

- [ ] 3.1 先草擬一小批語言/言語/吞嚥的範例里程碑,每一條都附 `sourceNote`——清楚標示這是等待審核的佔位內容
- [ ] 3.2 **使用者審核關卡**:在把這些內容當真之前,先確認/替換掉佔位內容——這一步需要使用者的專業判斷,不能自動放行

## 4. 介面

- [ ] 4.1 `DisclaimerBanner` 元件(常駐顯示,不是點掉一次就沒了的那種提示)
- [ ] 4.2 `CategoryList` ——大項目 → 子項目的階層結構
- [ ] 4.3 `MilestoneItem` ——打勾框 + 達成日期選擇器 + 活動建議顯示
- [ ] 4.4 `ObservationLog` ——新增/列出自由文字筆記
- [ ] 4.5 明亮活潑視覺風格調整(Tailwind 主題、配色、間距)

## 5. 測試與收尾

- [ ] 5.1 主要元件的 smoke test(Vitest)
- [ ] 5.2 手動測一輪:打勾清單在瀏覽器裡真的能用嗎(打勾、重新整理頁面、資料還在)?
- [ ] 5.3 這個 change 功能完成後,更新 README 的「目前狀態」段落

## 6. 收尾

- [ ] 6.1 完成後把這個 OpenSpec change 存檔(archive)(`openspec/specs/development-checklist/` 會變成定案的規格)
- [ ] 6.2 把後續想法(其他發展面向、跨裝置同步)記下來當作未來 change 的候選項,這次不做
