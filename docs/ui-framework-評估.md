# UI 元件框架評估

這份文件回答一個問題：**這個 app 該不該採用 UI 元件框架？如果該，採哪一個？**

寫的人戴兩頂帽子（`rd` 與 `ui`）。兩頂帽子意見不一致的地方，兩邊的說法都寫出來，並且說明哪一邊贏、為什麼贏——不折衷成一句聽起來都對的話。

查證日期：2026-08-23。所有版本號與發佈日期都標了來源；查不到的地方標「未查證」。

---

## 零、先講結論

**不採用任何會決定外觀的元件框架。** 保留現在手刻的 `@theme` token 層與 `@layer components`，需要真正的行為原語時再加 `@angular/cdk`；`@angular/aria`（Angular 官方的 headless 原語，v21 線上就有）可以評估但不急。

理由一句話：**這個 app 需要框架接手的部分，剛好就是框架最不擅長讓你改的部分（六欄構音格子、巢狀條件樹、三級嚴重度色票）；而框架真正能接手的部分（按鈕、卡片、輸入框、頁籤），這個 app 已經做完了，而且做得比框架的預設更貼合。**

另外一件必須講清楚的事：**「耳目一新」不會由元件框架帶來。** 元件框架的本質是讓你的 app 看起來像那個框架——那是「耳目一新」的反面。開發者這個需求是真的，但它的正確落點是**字體、密度、深色模式與資訊層級**，不是套件清單。第八節專門談字體。

---

## 一、兩頂帽子的分歧

先把不一致攤開。

### `ui` 的立場：spartan/ui 值得認真考慮

框架裡有一類跟 Element Plus／PrimeNG／Vuetify／MUI 不是同一種東西：**shadcn 模式**——CLI 把樣式原始碼**複製進你的 repo**，你擁有它、可以改成任何樣子；npm 上留下來的只有無樣式的行為層。spartan/ui 就是 Angular 版的這個模式，而且它明說要 Tailwind 4。

對這個 app 的具體好處：

- **覆蓋層（overlay）這一塊是真的缺口。** 現在 5 處用原生 `confirm()`，構音格子的辨異徵性用原生 `title` tooltip。兩個都是「先能動」的做法，不是最終形狀。原生 `title` 在觸控裝置上根本不出現，也讀不出朗讀順序；原生 `confirm()` 在畫面正中央彈一個作業系統對話框，跟「臨床儀器」這個美術方向完全打架。
- **它不強加一個長相。** helm 的預設色票是中性近黑，**不是藍色**——沒有 提示藍 的撞色問題。而且複製進來之後，把 `--primary` 換成 `#0f6f68` 就結束了。
- **之後還有三張表要做**（`soapNote`、`itemList`、吞嚥 trial，見 `docs/ARCHITECTURE.md` §8）。有一組驗證過的原語，比每次現刻一個好。

### `rd` 的立場：什麼都不要加

- **付出的依賴不小。** `@spartan-ng/brain@1.3.2` 的 peerDependencies 裡有 `luxon`、`clsx`、`tw-animate-css`（來源：npm registry 上該版本的 `peerDependencies` 欄位）。為了幾個按鈕樣式拖進一整套日期函式庫，比例不對。
- **CLI 帶 Nx。** `@spartan-ng/cli@1.3.2` 的 `dependencies` 裡有 `nx`、`@nx/angular`、`@nx/devkit`、`@nx/js`、`@nx/workspace`、`ts-morph`、`zod`（同樣來源）。這個 repo 是純 Angular CLI workspace，不是 Nx。（它是否**必須**要 Nx workspace 才跑得起來，我沒有實測，只知道會被裝進 `node_modules`。）
- **支援窗口是兩個 major。** spartan 官方版本支援頁寫的是「支援最新的兩個 Angular major」，目前是 21 與 22；Angular 21 的支援到 2026 年 11 月（來源：spartan.ng/documentation/version-support）。這個 repo 現在在 21.2，**等於採用當天就綁上一個三個月後到期的時鐘**。
- **對照一下規模。** `src/app` 全部 7943 行（`wc -l`）。要接手的 UI 面積本來就不大，而且已經寫完。
- 這個專案真正的風險在 `storage.ts` 的升版作廢、`trialClauses()` 的 `!= null` 守門、事實物件的扁平 id ——不在按鈕上。加一層 UI 依賴不會降低那些風險，只會多一個升 Angular 時要一起搬的東西。

### 誰贏

**`rd` 贏，但 `ui` 指出的缺口是真的，要用別的方式補。**

`ui` 的論點成立的前提是「之後要做的畫面需要 combobox、date picker、multi-select 這類難刻的東西」。實際檢查 `ARCHITECTURE.md` §8 列的三張未完成的表：

- `soapNote` —— 四段 textarea。
- `itemList` —— checkbox 與 number input，`findings-form.html` 已經有現成的形狀。
- 吞嚥 trial —— 一列 `<select>` 加數字欄，`condition-editor.html` 的 trial 條件列已經證明這個形狀刻得出來。

**沒有一張需要 combobox。** 日期已經在用原生 `<input type="date">`，而且用得很好（`.input` 的 `tabular-nums` 讓日期欄對齊）。所以「之後會需要」這個論點在這個 app 上不成立——它是一個對別的 app 成立的論點。

`ui` 真正指出來的缺口只有兩個：**inline confirm** 與 **真正的 tooltip**。兩個都是 `@angular/cdk` 的 `Overlay` ＋ `A11yModule` 直接處理的事，加起來大概各 30 行，而且 CDK 沒有任何樣式意見，動不到格子表一個 pixel。

而且：**spartan 的 helm 原始碼是 MIT，可以讀、可以抄，不必安裝。** 需要一個 popover 的時候，去看它怎麼組 CDK Overlay，然後自己寫 class list——拿走知識，不拿走依賴。這是 `ui` 想要的東西的完整版本，成本是零。

---

## 二、這個 app 實際需要哪些元件

從 `src/app/features/**` 逐一清點的結果，不是猜的。

| 需求                     | 出現在哪                                                                                    | 現在怎麼做                                                      | 框架接得走嗎                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 卡片                     | 幾乎每一頁                                                                                  | `.card` ／ `.card-head` ／ `.card-body`                         | 接得走，但沒有意義——現在這三十行 CSS 就夠了                                                         |
| 列表列                   | `case-list`、`rule-list`、`form-list`、`process-list`                                       | `flex` ＋ `border-b border-line` 手排                           | 接不走，這是版面不是元件                                                                            |
| 路由頁籤                 | `app.html` 主導覽、`record-detail` 課節頁籤                                                 | `<a routerLink routerLinkActive>` ＋ `.tab`                     | **不該接。** 框架的 tabs 元件多半自己管 active state，跟 router 打架                                |
| 按鈕（三個權重＋破壞性） | 全站                                                                                        | `.btn-primary` ／ `.btn-quiet` ／ `.btn-ghost` ／ `.btn-danger` | 接得走。但 `.btn-danger`「靜止時低調、hover 才變紅」的行為是這個 app 特有的臨床考量，任何框架都要改 |
| 文字／數字／日期輸入     | `case-list`、`case-detail`、`record-detail`、`findings-form`                                | `.input`                                                        | 接得走，代價見第五節                                                                                |
| 下拉選單                 | `condition-editor`（5 處）、`rule-editor`、`case-detail`                                    | 原生 `<select>` ＋ `.select`                                    | 接得走，但**原生 select 在這裡是對的**——它免費得到行動裝置的原生選單與鍵盤操作                      |
| Checkbox ／ Radio        | `findings-form`、`rule-editor`、`process-summary`                                           | 原生 ＋ `accent-color`                                          | 接得走，收益接近零                                                                                  |
| Textarea                 | `rule-editor`（2 處）、`report-draft`                                                       | `.textarea`                                                     | 同上                                                                                                |
| 資料表格                 | `case-detail` 課節紀錄表（**全 app 只有這一張**）                                           | `.data-table`                                                   | 接得走，但沒有排序、篩選、分頁、虛擬捲動的需求——用 DataTable 元件是拿大砲打蚊子                     |
| 切換 chip                | `case-detail` 選表、`record-detail` 改表、`condition-editor` 選音、`process-summary` 貼標籤 | `.chip` ／ `.chip-on`                                           | 半接得走。但它表達的是「**一個值被選取**」而不是「一個動作」，框架的 chip／badge 多半是後者         |
| Inline confirm           | `case-list`、`rule-list`、`process-list`、`record-detail`、`report-draft`（共 5 處）        | **原生 `confirm()`**                                            | **這是真缺口。** 但 CDK 就夠，不需要框架                                                            |
| 嚴重度提示框             | `warnings-list`、`report-draft`、`condition-editor`、`rule-list`                            | `.sev` ＋ `.sev-info` ／ `-warning` ／ `-critical`              | **不該接。** 提示藍／警示琥珀／重要紅是**臨床語意**，不是視覺裝飾。框架的 alert 一律要重新上色      |
| Tooltip                  | 構音格子的辨異徵性、`record-detail` 的「至少要留一張表」                                    | 原生 `title`                                                    | **這是真缺口。** 但見第七節：它有一個寬度紅線                                                       |
| 空狀態                   | 6 處 `@empty`                                                                               | 一行置中文字                                                    | 接不走，也不需要                                                                                    |
| **巢狀 AND／OR 條件樹**  | `condition-editor`（118 行模板、209 行元件）                                                | 完全手刻，遞迴元件                                              | **接不走。** 這個決定已經下過了，見下                                                               |
| **六欄構音格子**         | `articulation-table`                                                                        | 完全手刻，寬度是承重牆                                          | **接不走，而且是主要風險。** 見第七節                                                               |

清點的結論：**表上 16 項，框架真正能接手且接手有好處的只有 2 項（inline confirm、tooltip），而那 2 項是行為問題不是樣式問題。**

條件樹的決定不重新開：`CLAUDE.md` 已經記錄過——維護中的第三方 Angular query-builder 套件都停更 2 年以上，因此自己刻。這次沒有任何新事證推翻它（spartan、ng-primitives、Taiga 都沒有 query-builder；有的只是它們的 `select` 與 `button`，而條件樹缺的從來不是這兩個）。

---

## 三、為什麼那四個框架被一起點名

開發者排除了 Element Plus、PrimeNG、Vuetify、MUI 四個。這四個裡面**只有 PrimeNG 是 Angular**：Element Plus 是 Vue，Vuetify 是 Vue，MUI 是 React。所以這不是技術相容性的意見，是**美學上的**：

四個都是「**企業級 widget 套裝**」——一整組帶著自己設計語言的元件，Material 或類 Material 的層級陰影、預設藍色主色、高密度的表單控件、把你的 app 變成「一個用了那個框架的 app」。

**Angular Material 正是這一群的圓心，不是例外。** MUI 是 React 版的 Material，Vuetify 是 Vue 版的 Material，Angular Material 是 Angular 版的 Material。把它悄悄放進候選名單，等於沒有聽懂那句話。

那 Angular Material 有沒有值得單獨辯護的地方？有兩個，都不夠強：

1. **它是第一方，維護不會斷。** `@angular/material@22.1.3` 發佈於 2026-08-19，21.x 線最新是 21.2.14（2026-06-03）（來源：npm registry `time` 欄位）。這是全表最好的維護紀錄。
2. **M3 的色彩系統可以用青色當種子**，理論上不會撞 提示藍。

但代價：

- **要引進 Sass。** 這個 repo 現在只有一支純 CSS 的 `src/styles.css`。Material 的 theming 是 Sass API（`mat.theme()`），產出的 token 跟 Tailwind 4 的 `@theme` CSS 變數是**兩套來源**，要手動對映，永遠會漂移。這正是 `ARCHITECTURE.md` §6 講的「漂移掉的文件比沒有文件更糟」的同一種病，只是搬到樣式層。
- **它的 form field 沒辦法縮到格子表要的尺寸。** `.probe-box` 的高度是 2 ＋ 20 ＋ 2 ＋ 2 ＝ 26px（padding `0.125rem` 上下 ＋ `line-height 1.25rem` ＋ 1px 邊框上下）。Material 的 `mat-form-field` 是一個帶 outline 與浮動 label 機制的包裝殼，格子表要的是**赤裸的 input**。（Material density scale 每階減多少 px、最低到多少，我沒有查到官方頁面的確切數字，**標為未查證**；但這裡的論點不依賴那個數字——問題是包裝殼的存在，不是它有多高。）
- **它就是那個長相。** 開發者要「耳目一新」，Material 是這個世界上最不耳目一新的東西。

**結論：Angular Material 不採用。但它的 `@angular/cdk` 採用——那是同一個團隊、同一個發佈節奏、而且完全沒有樣式意見的行為層。**

---

## 四、候選名單與查證到的事實

所有日期都來自 **npm registry 的 `time` 欄位**（`https://registry.npmjs.org/<pkg>`），查詢時間 2026-08-23。Angular major 的發佈日同樣來自 `@angular/core` 的 `time`：v21.0.0 於 2025-11-19，v22.0.0 於 2026-06-03。

### 保留（推薦）

| 套件            | 最新版 | 發佈日                                       | Angular peer                          | 性質                                                                                                                                                                                              |
| --------------- | ------ | -------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@angular/cdk`  | 22.1.3 | 2026-08-19（21.x 線：21.2.14 ／ 2026-06-03） | `^22 \|\| ^23`（21.2.14 對應 `^21`）  | 第一方行為層：Overlay、FocusTrap、A11y、Portal、拖放。**零樣式意見**                                                                                                                              |
| `@angular/aria` | 22.1.3 | 2026-08-19（21.x 線：21.2.14 ／ 2026-06-03） | `@angular/cdk` 同版 ＋ `^21 \|\| ^22` | **第一方 headless 原語**，signals driven，developer preview。首次發佈 2025-09-17。`exports` 實測有：`./grid`、`./menu`、`./tabs`、`./tree`、`./listbox`、`./toolbar`、`./combobox`、`./accordion` |

`@angular/aria` 是這次查證最重要的發現：Angular 團隊自己出了一組**無樣式、以 signal 狀態機驅動、支援 zoneless** 的 WAI-ARIA 原語，而且**已經在這個 repo 用的 21.2 線上**。它是「不採用框架」這個選項的加強版，不是它的競爭者。狀態是 developer preview，所以現在不必急著用，但下次真的需要 menu 或 combobox 時，第一個看它。

### 認真評估過但不採用

| 套件                                  | 最新版  | 發佈日                             | Angular 支援                            | 為什麼不採用                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | ------- | ---------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **spartan/ui**（`@spartan-ng/brain`） | 1.3.2   | 2026-08-20                         | peer `>=21.0.0 <23.0.0`（**支援 21**）  | 見第一節。維護非常活躍、Tailwind 4 原生、預設色票中性不撞藍——**這是最強的落選者**。落選原因是 peer 帶 `luxon`／`clsx`／`tw-animate-css`、CLI 帶整套 Nx、兩個 major 的支援窗口，而它能接手的元件這個 app 已經有了                                                                                                                                             |
| **ng-primitives**                     | 0.130.1 | 2026-08-13                         | peer `^21 \|\| ^22`（**支援 21**）      | Headless、signals、官網明說 fully supports Zoneless——技術上完全對。但**版本號還在 0.130.x，沒有 1.0**，`0.` 開頭代表 breaking change 隨時可以來。跟 `@angular/aria` 做同一件事，而後者是第一方                                                                                                                                                               |
| **Angular Material**                  | 22.1.3  | 2026-08-19                         | `^22 \|\| ^23`（21.x 線 21.2.14）       | 見第三節。維護最好，美學最不符合，且要引進 Sass 與第二套 token                                                                                                                                                                                                                                                                                               |
| **Taiga UI**                          | 5.20.0  | 2026-08-17                         | peer `>=19.0.0`                         | 維護活躍、元件量大。但它有**自己完整的設計語言與 SCSS 主題系統**，跟 Tailwind 4 的 `@theme` 是兩套；預設主色是藍——正面撞 提示藍。zoneless／Angular 21 的官方支援聲明我**沒有查證到**（官網 getting-started 頁沒寫），peer 只寫 `>=19`                                                                                                                        |
| **daisyUI**                           | 5.7.20  | 2026-08-20                         | 不適用（純 Tailwind plugin，零 JS）     | **class 名稱直接撞。** 實測 `daisyui@5.7.20/daisyui.css`：它定義了 `.card`（105 處）、`.btn`（184）、`.input`(163)、`.select`（242）、`.textarea`（111）、`.tab`（285）、`.table`（75）、`.link`（21）——**這個 app 手刻的 8 個元件 class 全部同名**。採用它等於整份 `styles.css` 與所有模板一起改名。另外它零 JS，兩個真缺口（confirm、tooltip）一個都補不到 |
| **Preline**                           | 5.0.0   | 2026-08-21                         | 不適用（Tailwind plugin ＋ vanilla JS） | 維護很活躍。但它的互動是**原生 JS 直接操作 DOM**，在 Angular（尤其 zoneless）裡是反模式：DOM 被框架外的程式改動，Angular 的 signal 圖完全不知情                                                                                                                                                                                                              |
| **flowbite-angular**                  | 21.0.0  | 2026-01-13                         | peer `>=21.0.0 <22.0.0`（**只有 21**）  | 距今 7 個月未發版，而 Angular 22 已經在 2026-06-03 出了兩個半月還沒跟上。沒到這個 repo 的「2 年」淘汰線，但落後的方向不對                                                                                                                                                                                                                                    |
| **PrimeNG**                           | 22.1.0  | 2026-08-18                         | `^22.1.0`（**不支援 21**）              | 開發者明確排除                                                                                                                                                                                                                                                                                                                                               |
| **ng-zorro-antd**                     | 22.0.1  | 2026-08-07                         | `^22`（**不支援 21**）                  | 沒被點名，但它是 Ant Design——跟被排除的四個同一族，預設藍主色                                                                                                                                                                                                                                                                                                |
| **Nebular**                           | 17.0.0  | 2026-01-15                         | `^21`                                   | 7 個月未發版，且是自成一格的深色企業後台語言                                                                                                                                                                                                                                                                                                                 |
| **Clarity**（`@clr/angular`）         | 18.2.1  | 2026-06-18（18.2.2 於 2026-08-11） | `>=21.1.0`                              | VMware 的企業設計系統，藍主色，同族                                                                                                                                                                                                                                                                                                                          |

### 順帶查到、值得記一筆

- `class-variance-authority@0.7.1` 最後發佈於 **2024-11-26**——距今約 21 個月。它是 shadcn／spartan 生態常見的 variant 工具。不是致命問題（它很小、API 已穩），但按這個 repo 自己訂的 2 年淘汰線，它已經在線上。
- `@ng-icons/core@35.0.1`（2026-08-06，peer `>=22`）——如果之後要圖示，這是 Angular 生態最活躍的選擇；但目前 peer 只到 22，21 要找舊版。現在 app 用的是 emoji 與文字箭頭（`▾`、`→`、`⚠`），沒有圖示需求。

---

## 五、評分表

八個準則，對每個真正的候選打一次。◎ 好、○ 可、△ 有代價、× 不行。

| 準則                                 | 不採用 ＋ CDK                     | spartan/ui                                       | ng-primitives                | Angular Material                      | Taiga UI                                | daisyUI                                                 |
| ------------------------------------ | --------------------------------- | ------------------------------------------------ | ---------------------------- | ------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| 1. 維護新近度                        | ◎ 第一方，2026-08-19              | ◎ 2026-08-20                                     | ○ 2026-08-13，但 0.x         | ◎ 2026-08-19                          | ◎ 2026-08-17                            | ◎ 2026-08-20                                            |
| 2. Angular 21 ＋ zoneless ＋ signals | ◎ 就是它                          | ◎ peer 含 21                                     | ◎ 官網明說支援 zoneless      | ○ 支援，但要 Sass                     | △ peer 只寫 `>=19`，zoneless 聲明未查證 | ○ 純 CSS，無關                                          |
| 3. Tailwind 4 互通                   | ◎ 本來就是 Tailwind               | ◎ 明說要 Tailwind 4                              | ◎ 無樣式，不干涉             | △ 兩套 token 要手動同步               | × 自己一套 SCSS 主題                    | × **8 個 class 名稱直接撞**                             |
| 4. 色彩系統／提示藍撞色              | ◎ 青色主色是為此選的              | ◎ 預設中性近黑，不撞                             | ◎ 無色彩意見                 | ○ M3 可種青色，但沒有 info 語意角色   | × 預設藍主色                            | △ 有 `info` 角色，但預設主色偏藍，要重調                |
| 5. 元件覆蓋率（對照第二節）          | ○ 缺 confirm 與 tooltip，CDK 可補 | ◎ 覆蓋 14／16，但其中 12 項已經有了              | ○ 只有行為，樣式全自理       | ◎ 覆蓋高                              | ◎ 覆蓋最高                              | △ 純樣式，補不到 2 個真缺口                             |
| 6. 耳目一新？                        | ○ 取決於自己怎麼推進（見第八節）  | ○ 中性起點，要自己走出去                         | ◎ 完全自由                   | × Material 是最不新鮮的               | △ 有辨識度，但是**它的**辨識度          | △ 有辨識度，但很多 app 用同一套                         |
| 7. Bundle ／ 鎖定 ／ 可逆性          | ◎ 零新增，隨時可退                | △ 3 個 runtime peer ＋ Nx CLI ＋ 兩個 major 窗口 | ○ 依賴小，但 0.x 會 breaking | △ Sass ＋ 大 bundle ＋ 深度鎖定       | × 深度鎖定                              | △ 樣式層全面改寫才能退                                  |
| 8. 動得到構音格子嗎？                | ◎ **完全動不到**                  | ○ helm 是複製進來的原始碼，可以刪掉 padding      | ◎ 無樣式                     | × form field 包裝殼進不了 26px 的格子 | × 有自己的尺寸意見                      | △ `.input` 同名覆蓋，會直接改到 `.probe-box` 旁邊的欄位 |

---

## 六、為什麼「什麼都不採用」贏

不是因為它安全，是因為**其他選項在這個 app 上贏不了它**。

1. **第二節的清點是決定性的。** 框架能接手的 16 項裡有 12 項這個 app 已經做完，而且做得**比框架的預設更貼合**——`.btn-danger` 的「靜止低調、hover 才紅」是為了「刪除不能長得像旁邊的編輯，但也不該在列表裡一路喊」；`.chip` 表達的是值被選取而不是動作；`.probe-box` 用 `:not(:placeholder-shown)` 讓填過的格子轉白，於是六欄裡哪一列填過一眼看得出來。這些都不是框架給得起的東西，換過去是**淨損失**。

2. **真正的缺口只有 2 個，而且是行為不是樣式。** inline confirm 與 tooltip。`@angular/cdk` 的 `Overlay` ＋ `A11yModule` 直接解決，加起來大概 60 行，沒有任何樣式意見，動不到格子表一個 pixel。

3. **34px 的餘裕是一條硬紅線。** 六欄各 162px（`w-10` 40 ＋ `gap-1.5` 6 ＋ `w-12` 48 ＋ `gap-1` 4 ＋ `w-16` 64），加上 5 個 `gap-x-4` 共 80px，合計 **1052px**，而卡片給的是 1086px。任何一個帶自己 padding 意見的元件庫，只要在那些 input 上多加 2px 的水平 padding，六欄就 ×6 ＝ 12px 地吃掉餘裕；多 3px 就爆了。爆掉的後果不是版面難看，是**舌根那一欄掉到下一行，由前到後的部位順序這個臨床資訊消失**。這不是可以之後再調的東西。

4. **`@angular/aria` 讓「不採用」變成一個會成長的選項，而不是停在原地。** 第一方、無樣式、signals、已經在 21.2 線上。它跟現在的做法之間沒有任何遷移成本——需要 combobox 的那天再引入那一個 entry point 就好。

5. **開發者對現在的介面是滿意的。** 這是評估的基準線。任何一個框架方案的第一步都是**先讓現在的長相變差**，然後花工把它調回來——而且調回來之後，多的是一個依賴。

---

## 七、如果還是要採用 spartan/ui：實際的代價與退場路線

`ui` 那頂帽子的意見不是錯的，只是被第二節的清點壓過去。如果開發者想推翻這個結論（那是他的權利），這裡是誠實的成本估算。

### 要做的工

1. `pnpm add @spartan-ng/brain clsx luxon tw-animate-css`，`pnpm add -D @spartan-ng/cli`。留意 CLI 會把 Nx 拉進 `node_modules`（是否真的需要 Nx workspace，未實測）。
2. 把 helm 的 CSS 變數（`--primary`、`--background`、`--radius`⋯⋯，oklch 格式）與現有的 `@theme` token 對映。**這是最大的一塊工，也是最容易半途而廢的一塊**：兩套變數並存的那段時間，`.card` 的邊框顏色可能來自任一邊，沒人說得準。
3. 先只搬 **dialog** 與 **tooltip** 兩個，換掉 5 處 `confirm()` 與構音格子的 `title`。**不要**同時搬按鈕與輸入框。
4. 明確在 `styles.css` 寫下：**helm 的元件不得進入 `articulation-table.html`。** 格子表的 input 永遠是 `.probe-box`。
5. 排一次 Angular 22 升版，因為 21 的支援 2026 年 11 月結束。

### 退場路線

spartan 是三個可逆性完全不同的層，退場成本取決於用到哪一層：

- **helm 樣式碼**——它在你的 repo 裡，就是你的檔案。退場＝刪檔案，零成本。
- **`@spartan-ng/brain`**——runtime 依賴。退場＝把用到它的元件改回自己刻。用了幾個就是幾個的工。
- **CSS 變數對映層**——最難退的一層。一旦模板裡開始寫 `bg-primary` 而不是 `bg-accent`，兩套命名就交織了。**建議永遠不要做這一層**：讓 helm 的檔案自己用 helm 的變數，app 的其他地方繼續用 `@theme` 的 token，兩邊在 `styles.css` 裡各佔一段、互不引用。

**可逆性的實用規則：只用 spartan 的 overlay 類元件（dialog、popover、tooltip、alert-dialog），不碰 button／input／card／table。** 這樣退場永遠是「把那幾個元件改回自己刻」，不是「重寫整個樣式層」。

---

## 八、字體

開發者留了一個問題：要不要載字體？現在沒有載，走系統堆疊（`-apple-system` → PingFang TC ／ Microsoft JhengHei）；有人建議自架 Noto Sans TC 或思源黑體。

### 先講數字（實測，不是估的）

`@fontsource-variable/noto-sans-tc@5.3.0`（發佈於 2026-07-19），從 unpkg 的 file listing 逐檔加總：

- **105 個 woff2 分片，合計 4,194,768 bytes ＝ 4.00 MiB。**
- 單片中位數 **40,552 bytes**，最小 1,656、最大 85,112。
- 靜態版 `@fontsource/noto-sans-tc@5.3.0` 是 **68 MB／1977 檔**（多字重 × 多分片）。

分片是按 `unicode-range` 切的，瀏覽器只會下載頁面上真的用到的那幾片。這個 app 一頁大概會碰到幾百個不同漢字，實際大約會拉 **8～20 片，約 300～800 KB**。作為對照，整個 app 的 JS build 產物量級也差不多在這個範圍——**等於為了換一個字體，讓首次載入的資產翻倍。**

### 值不值得：不值得，但有一個例外

**CJK 那一半：不要載。**

- PingFang TC 與 Microsoft JhengHei 都是**做得很好**的字體，PingFang TC 尤其好。
- Noto Sans TC 跟 PingFang TC 是**同一個路數**（人文主義無襯線、開放的字腔、中等對比）。花 500 KB 換一個大部分人看不出差別的東西，是把預算花在看不見的地方。
- 這個 app 是**臨床工具，不是行銷頁**——治療師在門診之間開它，不是在展示它。載入時間的價值高於字體的價值。
- 而且 `styles.css` 最上面已經寫下當初的理由（不要網路依賴）。自架消除的是「網路依賴」這個理由，**沒有消除 bytes 這個理由**。

**例外：Latin ＋ 數字那一半，值得。**

現在的堆疊把 `-apple-system` 排第一，所以英數走 SF Pro ／ Segoe UI——沒有錯，但也完全沒有個性。而這個 app 螢幕上出現的數字不少：日期、月齡、`w-24` 的分數欄、警示條數、`tabular-nums` 對齊的表格。

**一支只含 Latin subset 的可變字體，一個 woff2 檔，大約 15～25 KB**（量級參考：Noto Sans TC 的 Latin 分片本身就在這個範圍）。它會改變的是：頁面標題、`.card-title` 的字距、數字欄的質感——**也就是「耳目一新」真正住的地方**。挑選方向（不指定特定字體，這是設計決定不是技術決定）：

- 一支有清楚 **tabular figures** 的中性 grotesque，讓數字欄的對齊不是靠 `font-variant-numeric` 硬撐。
- 或者對比更強的做法：內文維持系統字，**只給標題與數字**換一支面貌明確的字，這樣總量還能再減。

`--font-sans` 的堆疊順序不用動：把新的 Latin 字放在最前面，PingFang TC 之類的 CJK 字仍然在後面接手漢字。這正是現在這條堆疊的設計意圖（註解裡就寫了「Latin 排前面，數字與 ASCII 才不會掉進 CJK 字體」）。

### 字體會不會動到構音格子？

**不會，但要驗。** 格子表的欄寬是固定的 Tailwind class（`w-10`、`w-12`、`w-16`），不隨字體伸縮，所以 1052px 這個總數不變。真正的風險是**框內溢出**：注音符號在 `.zhuyin` 是 `1.125rem`，塞在 40px 寬的欄裡；換一支漢字字體如果注音符號（U+3105–312F）的字面偏寬，可能會擠。**如果最後真的動了 CJK 字體，換完要在瀏覽器裡看一次格子表，量欄位座標**——這是 `ui` 那頂帽子的既有規矩，單元測試看不出來。

只換 Latin 字則完全沒有這個風險。

### 框架選擇會改變這個答案嗎？

**不會。** 上面所有候選都不附 CJK 字體，全部假設你自己帶。唯一的偏差是 Angular Material：它的 M3 typography 預設綁 Roboto，等於推著你去載一支你不需要的 Latin 字——這是它的**又一個**小扣分，不是加分。

---

## 九、開發者要做的決定

按建議的順序，每個都可以單獨回答。

1. **接受「不採用會決定外觀的框架」這個結論嗎？** 如果接受，第 2、3 題往下走；如果不接受，去第 7 節看 spartan 的實際代價，然後回答第 6 題。

2. **要不要現在補掉兩個真缺口？** 也就是加 `@angular/cdk@^21.2`，把 5 處 `confirm()` 換成 inline confirm，把構音格子的 `title` 換成真 tooltip。
   - 這是本文唯一主動建議加的依賴。
   - 建議**分兩個 change 做**：inline confirm 一個、tooltip 一個。tooltip 那個要附一次瀏覽器實測，確認格子表六欄還是 1052px。
   - 也可以更保守：inline confirm **完全不用 overlay**——列表列上直接把「刪除」換成「確定刪除？／取消」兩顆按鈕就好，零依賴、而且在列表情境下比彈窗更好用。**如果選這條，`@angular/cdk` 連加都不用加。**

3. **`@angular/aria` 現在要不要引進？** 建議：**現在不要**，它是 developer preview。但把它記在這裡，下次需要 menu、combobox 或 accordion 時第一個看它，不要再開一次框架評估。

4. **要不要載字體？** 建議：**CJK 不載，只載一支 Latin subset 的可變字體（15～25 KB）自架。** 需要開發者決定的是**挑哪一支**——那是設計品味的選擇，不該由我代選。決定之後：放進 `--font-sans` 的最前面，`styles.css` 最上面那段「不載 webfont」的註解要一起改掉，說明現在的立場是「只載 Latin，CJK 交給系統」。

5. **Angular 21 的支援 2026 年 11 月結束**（v21.0.0 於 2025-11-19，v22.0.0 於 2026-06-03）。這跟 UI 框架無關，但這次查證撞出來了：**這件事比框架問題急。** 要不要排一次升 22？

6. **如果推翻結論、決定採用 spartan/ui：** 唯一需要現在回答的是——**接受「只用它的 overlay 類元件，不碰 button／input／card／table」這條界線嗎？** 接受的話它永遠可逆；不接受的話，它會變成這個專案最難拆掉的一層。

---

## 附註：查證方法與未查證項目

- 版本與發佈日一律取自 `https://registry.npmjs.org/<pkg>` 的 `time` 與 `dist-tags` 欄位，`peerDependencies` ／ `dependencies` 取自該版本的 manifest。查詢時間 2026-08-23。
- daisyUI 的 class 名稱衝突是**實測**：下載 `https://unpkg.com/daisyui@5.7.20/daisyui.css`（1,123,330 bytes）後對 class 名稱計數。
- 字體 bytes 是**實測**：`https://unpkg.com/@fontsource-variable/noto-sans-tc@5.3.0/?meta` 的 file listing 逐檔加總。
- 構音格子的 1052px ／ 1086px 由模板的 Tailwind class 推算並與 `docs/ARCHITECTURE.md` §7 記錄的數字相符；**沒有重新在瀏覽器裡量**。

**標為未查證的項目：**

- Angular Material 的 form field 預設高度與 density scale 的確切 px 值——官方 theming 頁抓不到內容。第三節的論點不依賴這個數字。
- Taiga UI 對 zoneless 與 Angular 21 的官方支援聲明——官網 getting-started 頁沒有寫，npm peer 只有 `>=19.0.0`。
- `@spartan-ng/cli` 是否**必須**在 Nx workspace 裡才能執行——只確認了它的 `dependencies` 含 Nx 套件，沒有實測在純 Angular CLI workspace 裡跑。
- spartan/ui 的元件清單來自官網 components 頁的敘述，**沒有逐一開啟每個元件頁核對**。
