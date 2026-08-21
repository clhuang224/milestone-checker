# 任務:add-vowel-distinctive-features

## 1. 參考資料

- [x] 1.1 新增 `references/zhuyin-finals.md`——結構說明、徵性值對照、單元音表、複合韻母拆解表、註記
- [x] 1.2 `scripts/check-references.mjs` 擴充到韻母表（比對 id 與符號）

## 2. 型別

- [x] 2.1 `models/zhuyin.model.ts` 新增 `VowelHeight`／`VowelBackness`／`Rounding`／`Coda`
- [x] 2.2 新增 `VowelFeatures`（含 `rhotic`、`apical` 兩個是否項）與 `RimeStructure`
- [x] 2.3 `ZhuyinSymbol` 新增 `vowel` 與 `rime` 兩個選填欄位

## 3. 資料

- [x] 3.1 介音與單韻母補元音辨異徵性
- [x] 3.2 複合韻母改成 `rime: { nucleusId, coda }`
- [x] 3.3 ㄦ 用 ㄜ 的徵性加 `rhotic`
- [x] 3.4 `ㄭ` 拆成 `ɿ`（`ihFront`）與 `ʅ`（`ihBack`），兩者舌位留空、標 `apical`

## 4. 介面

- [x] 4.1 構音表的空韻列顯示 ɿ／ʅ，游標停留時說明對應哪一組聲母
- [x] 4.2 聲母的徵性顯示補上清濁

## 5. 收尾

- [x] 5.1 單元測試:符號數量、空韻拆分、ㄦ 與 ㄜ 只差捲舌、複合韻母的韻腹都存在
- [x] 5.2 `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm check:references` 全過
- [x] 5.3 瀏覽器確認 ɿ／ʅ 與 popover 顯示正常
