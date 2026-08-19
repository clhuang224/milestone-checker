/**
 * Manual round-trip check for the articulation tracker (tasks.md 5.2) — drives the real app
 * in a browser rather than the component test doubles.
 *
 * Needs a dev server first:  pnpm start --port 4287
 * Then:                      node e2e/articulation-smoke.mjs
 *
 * Reads state straight after a click can race the zoneless change detection, so anything
 * asserted right after an interaction needs a short wait — that is the harness, not a bug.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4287';
const out = (msg) => console.log(msg);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

// 1. create a case
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByPlaceholder('個案暱稱/代號').fill('小明（測試）');
await page.getByRole('button', { name: '建立' }).click();
await page.waitForURL(/\/cases\/[^/]+$/);
out('1. created case, landed on its page');

// 2. an assessment session, then into the articulation table
await page.getByRole('button', { name: '+ 新增評估' }).click();
await page.waitForTimeout(100);
await page.getByRole('link', { name: /構音記錄/ }).click();
await page.waitForURL(/\/articulation$/);
const heading = await page.locator('h2').first().textContent();
out(`2. on articulation page: ${heading.trim()}`);

// helper: the row block for a given zhuyin glyph
const rowFor = (glyph) =>
  page.locator('div.py-2').filter({ has: page.locator(`span.text-lg:text-is("${glyph}")`) });

async function recordPair({ target, errorLabel, nasalized, process, word, note }) {
  const row = rowFor(target);
  await row.getByRole('button', { name: '+ 新增音對' }).click();
  const editor = row.locator('div.border-sky-200');
  if (errorLabel) await editor.locator('select').selectOption({ label: errorLabel });
  // exact, or it also matches the 「母音鼻音化」 process checkbox
  if (nasalized) await editor.getByLabel('鼻音化', { exact: true }).check();
  if (process) await editor.getByLabel(process).check();
  if (word) {
    await editor.getByPlaceholder('字詞，例如「包」').fill(word);
    if (note) await editor.getByPlaceholder('實際聽到，例如「ㄆㄠ」').fill(note);
    await editor.getByRole('button', { name: '加入' }).click();
  }
  await editor.getByRole('button', { name: '儲存' }).click();
}

// 3. record the pairs from the original request: ㄆ→ㄅ, ㄊ→ㄉ, and ㄉ→ㄍ
await recordPair({ target: 'ㄆ', errorLabel: 'ㄅ', process: '不送氣化', word: '拼', note: 'ㄅㄧㄣ' });
await recordPair({ target: 'ㄊ', errorLabel: 'ㄉ', process: '不送氣化' });
await recordPair({ target: 'ㄉ', errorLabel: 'ㄍ', process: '後置化' });
// a correct sound (error left blank) and an untagged error
await recordPair({ target: 'ㄅ', word: '包' });
await recordPair({ target: 'ㄍ', errorLabel: 'ㄉ' });
// nasalization: the diacritic alone (ㄧ→ㄧⁿ), and layered on a substitution (ㄓ→ㄉⁿ)
await recordPair({ target: 'ㄧ', nasalized: true, process: '母音鼻音化' });
await recordPair({
  target: 'ㄓ',
  errorLabel: 'ㄉ',
  nasalized: true,
  process: '塞音化',
  word: '蜘蛛',
  note: 'ㄉㄭⁿ ㄉㄨⁿ',
});
out('3. recorded 7 records');

// the last save has to render before the rows are worth reading (see header note)
await page.waitForTimeout(100);
out(`   ㄆ row now reads: ${(await rowFor('ㄆ').textContent()).replace(/\s+/g, ' ').trim()}`);
out(`   ㄅ row now reads: ${(await rowFor('ㄅ').textContent()).replace(/\s+/g, ' ').trim()}`);
out(`   ㄧ row now reads: ${(await rowFor('ㄧ').textContent()).replace(/\s+/g, ' ').trim()}`);
out(`   ㄓ row now reads: ${(await rowFor('ㄓ').textContent()).replace(/\s+/g, ' ').trim()}`);

// 4. overview grouping (after a beat, so the last save has rendered)
await page.waitForTimeout(100);
const overview = page.locator('app-process-overview');
const groupText = async () =>
  (await overview.textContent()).replace(/\s+/g, ' ').trim();
out(`4. overview: ${await groupText()}`);

// 5. edit an existing pair — the dropdown must come back pre-filled
await rowFor('ㄆ').getByRole('button', { name: '編輯' }).click();
const editorSelect = rowFor('ㄆ').locator('div.border-sky-200 select');
out(`5. edit preselects error sound: "${await editorSelect.inputValue()}" (expect "b")`);
await rowFor('ㄆ').getByRole('button', { name: '取消' }).click();

// 6. reload and confirm persistence
await page.reload({ waitUntil: 'networkidle' });
out(`6. after reload, ㄆ row: ${(await rowFor('ㄆ').textContent()).replace(/\s+/g, ' ').trim()}`);
out(`   after reload, overview: ${await groupText()}`);

// 7. disclaimer visible on this page?
const disclaimer = await page.locator('app-disclaimer-banner').textContent();
out(`7. disclaimer on page: ${disclaimer.replace(/\s+/g, ' ').trim()}`);

// 8. the process catalogue page
await page.getByRole('link', { name: '音韻歷程' }).first().click();
await page.waitForURL(/articulation-processes/);
const count = await page.locator('div.bg-white.rounded-lg.border').count();
out(`8. catalogue shows ${count} processes`);

await page.screenshot({ path: '/tmp/shot-processes.png', fullPage: false });
await page.goBack();
await page.waitForURL(/articulation$/);
await page.screenshot({ path: '/tmp/shot-table.png', fullPage: false });

// 9. the referral rule end to end: an 8-year-old with errors beyond ㄓㄔㄕㄖ
await page.goto(`${BASE}/cases`, { waitUntil: 'networkidle' });
// derived from today, so the case stays 8 years old however long this script lives
const eightYearsAgo = new Date();
eightYearsAgo.setFullYear(eightYearsAgo.getFullYear() - 8);
const birthDate = eightYearsAgo.toISOString().slice(0, 10);

await page.getByPlaceholder('個案暱稱/代號').fill('小切（測試）');
await page.locator('#new-case-birth-date').fill(birthDate);
await page.getByRole('button', { name: '建立' }).click();
await page.waitForURL(/\/cases\/[^/]+$/);
const caseUrl = page.url();

// two sessions: an old one that predates the fourth birthday, and today's
await page.getByRole('button', { name: '+ 新增評估' }).click();
await page.waitForTimeout(100);
const beforeFour = new Date();
beforeFour.setFullYear(beforeFour.getFullYear() - 4);
beforeFour.setDate(beforeFour.getDate() - 1);
await page.locator('#assessment-date').fill(beforeFour.toISOString().slice(0, 10));
await page.waitForTimeout(100);
out(`9. assessment on ${beforeFour.toISOString().slice(0, 10)} → age reads ${await page
  .locator('#case-birth-date')
  .locator('xpath=following-sibling::span[1]')
  .textContent()}`);

await page.getByRole('button', { name: '+ 新增評估' }).click();
await page.waitForTimeout(100);
out(`   assessment today → age reads ${await page
  .locator('#case-birth-date')
  .locator('xpath=following-sibling::span[1]')
  .textContent()}`);

await page.getByRole('link', { name: /構音記錄/ }).click();
await page.waitForURL(/\/articulation$/);
// ㄓ→ㄉ and ㄔ→ㄎ are retroflex targets the rule sets aside; ㄘ→ㄎ and ㄧ→ㄧⁿ are not
await recordPair({ target: 'ㄓ', errorLabel: 'ㄉ', process: '塞音化' });
await recordPair({ target: 'ㄔ', errorLabel: 'ㄎ', process: '後置化' });
await recordPair({ target: 'ㄘ', errorLabel: 'ㄎ', process: '塞音化' });
await recordPair({ target: 'ㄧ', nasalized: true, process: '母音鼻音化' });

await page.goto(caseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(100);
const warnings = (await page.locator('app-warnings-list').textContent()).replace(/\s+/g, ' ').trim();
out(`   warnings: ${warnings}`);
out(`   referral rule fired: ${warnings.includes('建議安排構音治療')}`);

// the draft is bound with ngModel, so it lives in the textarea's value, not its textContent
const draft = await page.locator('app-report-draft textarea').inputValue();
out(`   report draft: ${draft.replace(/\s+/g, ' ').trim()}`);

out(errors.length ? `ERRORS: ${errors.join(' | ')}` : 'no console/page errors');
await browser.close();
