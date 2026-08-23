/**
 * End-to-end smoke check for the session-record flow — drives the real app in a browser
 * rather than the component test doubles.
 *
 * Walks the whole route: a case → a 課節紀錄 with the articulation form attached → the grid →
 * the derived phonological processes → a reload → the 警示 tab → the 報告 tab.
 *
 * Needs a dev server first:  pnpm start --port 4287
 * Then:                      node e2e/articulation-smoke.mjs
 *
 * Exits 1 if any check fails, so it can gate.
 *
 * Reading state straight after a click can race the zoneless change detection, so anything
 * asserted right after an interaction waits on the text it expects rather than on a timer where
 * that is possible — the remaining short waits are the harness, not a bug.
 *
 * The articulation values are the seeded demo case 小美's, reused verbatim: clinical content
 * comes from the developer or from `references/`, never from this file.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4287';

const out = (msg) => console.log(msg);
const tidy = (text) => (text ?? '').replace(/\s+/g, ' ').trim();

const failures = [];
/** Records a check; anything false is reported at the end and fails the run. */
function check(label, ok, detail = '') {
  out(`   ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) {
    failures.push(label);
  }
}

/**
 * Retries a condition until it holds. Reading state straight after a click races zoneless change
 * detection: the DOM is correct a tick later, so a bare read reports a stale value rather than a
 * real failure.
 */
async function until(condition, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await condition()) {
      return true;
    }
    if (Date.now() >= deadline) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/** Local calendar date, matching the app's `todayISO()` — `toISOString()` would shift a timezone. */
function localISO(date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

// 0. start from the seeded state rather than from whatever the last run left behind
await page.goto(`${BASE}/cases`, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

// 1. a case, aged so the referral rule (>48 months) can apply
const today = localISO(new Date());
const born = new Date();
born.setFullYear(born.getFullYear() - 8);
const birthDate = localISO(born);

await page.getByPlaceholder('個案暱稱/代號').fill('小美（e2e）');
await page.locator('#new-case-birth-date').fill(birthDate);
await page.getByRole('button', { name: '建立' }).click();
await page.waitForURL(/\/cases\/[^/]+$/);
const caseUrl = page.url();
out(`1. created case, born ${birthDate}`);

// 2. a 課節紀錄 — at least one assessment form has to be ticked before 建立 will do anything
await page.getByRole('button', { name: '＋ 新增課節紀錄' }).click();
const createButton = page.getByRole('button', { name: '建立' });
check('建立 is disabled with no form ticked', await createButton.isDisabled());

const formToggle = page.getByRole('button', { name: '構音評估表' });
await formToggle.click();
check(
  '構音評估表 ticked',
  await until(async () => (await formToggle.getAttribute('aria-pressed')) === 'true'),
);
await createButton.click();

const recordLink = page.locator('table tbody a').first();
await recordLink.waitFor();
check('record row dated today', tidy(await recordLink.textContent()) === today, today);
await recordLink.click();
await page.waitForURL(/\/records\/[^/]+\/forms\/articulation$/);
const recordUrl = page.url();
out(`2. on the 構音評估表 tab of a new 課節紀錄`);
check(
  'articulation grid rendered',
  (await page.locator('app-articulation-table').count()) === 1,
  tidy(await page.locator('app-articulation-table h3').first().textContent()),
);

/** The cell block for one zhuyin glyph. */
const cellFor = (glyph) =>
  page
    .locator('div.flex.items-start')
    .filter({ has: page.locator(`span:text-is("${glyph}")`) })
    .first();

/** Fills one of the three slots: the target word, and what was heard. */
async function record(glyph, slot, word, heard) {
  const cell = cellFor(glyph);
  await cell.getByLabel('目標詞').nth(slot).fill(word);
  await cell.getByLabel('錯音').nth(slot).fill(heard);
  await cell.getByLabel('錯音').nth(slot).blur();
}

// 3. the demo case's recorded errors, covering stopping, coda loss and nasalization
await record('ㄓ', 0, '蜘蛛', 'ㄉㄭⁿ');
await record('ㄔ', 0, '吃飯', 'ㄎㄭⁿ');
await record('ㄔ', 1, '吃菜', 'ㄎㄭ');
await record('ㄘ', 0, '菜', 'ㄎㄚˋ');
await record('ㄞ', 0, '菜', 'ㄚ');
await record('ㄧ', 0, '衣', 'ㄧⁿ');
await record('ㄨ', 0, '烏', 'ㄨⁿ');
out('3. recorded 7 slots');

/** Input values live in the value property, not in textContent. */
async function slotOf(glyph, slot) {
  const cell = cellFor(glyph);
  const word = await cell.getByLabel('目標詞').nth(slot).inputValue();
  const heard = await cell.getByLabel('錯音').nth(slot).inputValue();
  return `${word || '(空)'} → ${heard || '(空)'}`;
}

// 4. the derived summary — no manual tagging involved
const summary = page.locator('app-process-summary');
await summary.filter({ hasText: '塞音化' }).waitFor();

/**
 * The summary rows as `{ 歷程名稱: '符號 符號' }`.
 *
 * Read span by span rather than by searching the section's textContent: Angular strips the
 * whitespace between the two spans, so the concatenated text reads 「塞音化ㄓ ㄔ ㄘ」 and a
 * substring assertion written the way a person would say it silently never matches.
 */
async function derivedGroups() {
  const rows = summary.locator('div.items-baseline');
  const count = await rows.count();
  const groups = {};
  for (let i = 0; i < count; i++) {
    const spans = rows.nth(i).locator('span');
    groups[tidy(await spans.nth(0).textContent())] = tidy(await spans.nth(1).textContent());
  }
  return groups;
}

let derived = await derivedGroups();
out(
  `4. derived: ${Object.entries(derived)
    .map(([name, symbols]) => `${name} ${symbols}`)
    .join(' / ')}`,
);
check('塞音化 ㄓ ㄔ ㄘ', derived['塞音化'] === 'ㄓ ㄔ ㄘ');
check('複韻母簡化 ㄞ', derived['複韻母簡化'] === 'ㄞ');
check('母音鼻音化 ㄧ ㄨ', derived['母音鼻音化'] === 'ㄧ ㄨ');
check(
  'ㄉㄭⁿ nasalizes ㄭ, not ㄓ',
  !(derived['母音鼻音化'] ?? '').includes('ㄓ') && !(derived['母音鼻音化'] ?? '').includes('ㄔ'),
);

// 5. 自己選 starts blank, and only offers processes the target sound could show
await summary.getByText('自己選').click();
await summary.filter({ hasText: '還沒有指定任何音韻歷程' }).waitFor();
const stoppingRow = summary.locator('div.flex.items-start').filter({ hasText: '塞音化' }).first();
const offered = (await stoppingRow.getByRole('button').allTextContents()).map(tidy);
out(`5. 自己選 offers 塞音化 for: ${offered.join(' ')}`);
check('塞音化 offered for the affricates only', offered.join(' ') === 'ㄓ ㄔ ㄘ');

await summary.getByText('使用推導結果').click();
check(
  'derivation comes back',
  await until(async () => (await derivedGroups())['塞音化'] === 'ㄓ ㄔ ㄘ'),
);

// 6. reload and confirm persistence
await page.reload({ waitUntil: 'networkidle' });
await summary.filter({ hasText: '塞音化' }).waitFor();
out(`6. after reload: ㄓ ${await slotOf('ㄓ', 0)} / ㄔ ${await slotOf('ㄔ', 1)}`);
check('ㄓ slot survived the reload', (await slotOf('ㄓ', 0)) === '蜘蛛 → ㄉㄭⁿ');
check('ㄔ second slot survived the reload', (await slotOf('ㄔ', 1)) === '吃菜 → ㄎㄭ');
derived = await derivedGroups();
check(
  'derived processes survived the reload',
  derived['塞音化'] === 'ㄓ ㄔ ㄘ' && derived['母音鼻音化'] === 'ㄧ ㄨ',
  JSON.stringify(derived),
);

// 7. the 警示 tab — the referral rule fires off the recorded errors
const warningsTab = page.getByRole('link', { name: /^警示/ });
check('警示 tab counts the trigger', tidy(await warningsTab.textContent()) === '警示 ⚠ 1');
await warningsTab.click();
await page.waitForURL(/\/forms\/_warnings$/);
const warnings = tidy(await page.locator('app-warnings-list').textContent());
out(`7. 警示: ${warnings}`);
check('referral rule fired', warnings.includes('建議安排構音治療'));
check('shown as 警示 severity', warnings.includes('[警示]'));

// 8. the 報告 tab
await page.getByRole('link', { name: '報告' }).click();
await page.waitForURL(/\/forms\/_report$/);
const draft = page.locator('app-report-draft textarea');
await draft.waitFor();
const draftText = tidy(await draft.inputValue());
out(`8. 報告草稿: ${draftText}`);
check('report draft has the rule’s text', draftText.includes('建議安排構音治療'));

// 9. an edit to the draft is kept per record, and the case page shows the same warning count
await draft.fill(`${draftText} 追蹤三個月。`);
await page.reload({ waitUntil: 'networkidle' });
await draft.waitFor();
check('edited draft persists', (await draft.inputValue()).includes('追蹤三個月。'));
check(
  '重新產生 warns before overwriting',
  (await page.locator('app-report-draft').getByText('這份草稿已經手動改過').count()) === 1,
);

await page.goto(caseUrl, { waitUntil: 'networkidle' });
const row = tidy(await page.locator('table tbody tr').first().textContent());
out(`9. case row: ${row}`);
check('case list row shows the warning count', row.includes('⚠ 1'));
check('case row names the attached form', row.includes('構音評估表'));

// 10. the disclaimer stays visible
const disclaimer = tidy(await page.locator('app-disclaimer-banner').textContent());
out(`10. disclaimer: ${disclaimer}`);
check('disclaimer visible', disclaimer.includes('不取代'));

out(`\nrecord: ${recordUrl}`);
out(errors.length ? `ERRORS: ${errors.join(' | ')}` : 'no console/page errors');
if (errors.length) {
  failures.push('console/page errors');
}

await browser.close();

if (failures.length) {
  out(`\n${failures.length} failed: ${failures.join('; ')}`);
  process.exit(1);
}
out('\nall checks passed');
