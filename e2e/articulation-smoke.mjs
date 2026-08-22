/**
 * Manual round-trip check for the articulation tracker — drives the real app in a browser
 * rather than the component test doubles.
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

const tidy = (text) => text.replace(/\s+/g, ' ').trim();

// 1. create a case, aged so the referral rule can apply
await page.goto(`${BASE}/cases`, { waitUntil: 'networkidle' });
const eightYearsAgo = new Date();
eightYearsAgo.setFullYear(eightYearsAgo.getFullYear() - 8);
const birthDate = eightYearsAgo.toISOString().slice(0, 10);

await page.getByPlaceholder('個案暱稱/代號').fill('小明（測試）');
await page.locator('#new-case-birth-date').fill(birthDate);
await page.getByRole('button', { name: '建立' }).click();
await page.waitForURL(/\/cases\/[^/]+$/);
const caseUrl = page.url();
out(`1. created case, born ${birthDate}`);

// 2. an assessment session, then into the grid
await page.getByRole('button', { name: '+ 新增評估' }).click();
await page.waitForTimeout(100);
await page.getByRole('link', { name: /構音記錄/ }).click();
await page.waitForURL(/\/articulation$/);
out(`2. on articulation page: ${tidy(await page.locator('h2').first().textContent())}`);

/** The cell block for one zhuyin glyph. */
const cellFor = (glyph) =>
  page
    .locator('div.flex.items-start')
    .filter({ has: page.locator(`span.text-lg:text-is("${glyph}")`) })
    .first();

/** Fills one of the three slots: the target word, and what was heard. */
async function record(glyph, slot, word, heard) {
  const cell = cellFor(glyph);
  await cell.getByLabel('目標詞').nth(slot).fill(word);
  await cell.getByLabel('錯音').nth(slot).fill(heard);
  await cell.getByLabel('錯音').nth(slot).blur();
}

// 3. record errors covering every derivation route
await record('ㄆ', 0, '拼', 'ㄅㄧㄣ'); // aspiration lost
await record('ㄉ', 0, '刀', 'ㄍㄠ'); // place moves back
await record('ㄙ', 0, '三', 'ㄉㄢ'); // place and manner together
await record('ㄅ', 0, '包', ''); // correct: nothing derived
await record('ㄧ', 0, '衣', 'ㄧⁿ'); // diacritic only
await record('ㄞ', 0, '愛', 'ㄚ'); // coda dropped
await page.waitForTimeout(200);
out('3. recorded 6 slots');

/** Input values live in the value property, not in textContent. */
async function slotOf(glyph, slot) {
  const cell = cellFor(glyph);
  const word = await cell.getByLabel('目標詞').nth(slot).inputValue();
  const heard = await cell.getByLabel('錯音').nth(slot).inputValue();
  return `${glyph} ${word || '(空)'} → ${heard || '(空)'}`;
}

out(`   ${await slotOf('ㄆ', 0)}`);

// 4. the derived summary
const summary = page.locator('app-process-summary');
out(`4. derived: ${tidy(await summary.textContent()).slice(0, 200)}`);

// 5. switching to manual starts blank, and switching back restores the derivation
await summary.getByText('自己選').click();
await page.waitForTimeout(200);
const manual = tidy(await summary.textContent());
out(`5. manual starts blank: ${manual.includes('還沒有指定任何音韻歷程')}`);
out(`   ㄅ is offered 塞音化: ${manual.includes('塞音化 ㄅ')}  (should be false — ㄅ is a stop)`);

await summary.getByText('使用推導結果').click();
await page.waitForTimeout(200);
out(`   back to derived: ${tidy(await summary.textContent()).includes('後置化')}`);

// 6. reload and confirm persistence
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(300);
out(`6. after reload: ${await slotOf('ㄆ', 0)} / ${await slotOf('ㄅ', 0)}`);

// 7. the rule fires off the derived processes
await page.goto(caseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const warnings = tidy(await page.locator('app-warnings-list').textContent());
out(`7. referral rule fired: ${warnings.includes('建議安排構音治療')}`);
out(`   report draft: ${await page.locator('app-report-draft textarea').inputValue()}`);

// 8. the disclaimer stays visible
out(`8. disclaimer: ${tidy(await page.locator('app-disclaimer-banner').textContent())}`);

out(errors.length ? `ERRORS: ${errors.join(' | ')}` : 'no console/page errors');
await browser.close();
