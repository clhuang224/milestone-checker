/**
 * End-to-end check for the case-background conditions — drives the real app in a browser.
 *
 * Walks: a case with 母語 and one ear filled → a better-ear rule written in the editor → a 課節紀錄
 * with a syllable on a tone row → the 警示 tab as the ears change → the seeded demo case's 警示.
 *
 * Needs a dev server first:  pnpm start --port 4287
 * Then:                      node e2e/case-background-smoke.mjs
 *
 * Exits 1 if any check fails, so it can gate.
 *
 * What a tone row's 錯音 is read as (the tone mark, not the initial) is not observable in the
 * running app, so this script only checks that the syllable is kept; the parsing itself is
 * covered by unit tests on parseHeard()/probeErrors().
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4287';
const RULES_KEY = 'therapist-rule-engine:rules:v8';
const BETTER_EAR_RULE = 'e2e 優耳規則';

const out = (msg) => console.log(msg);
const tidy = (text) => (text ?? '').replace(/\s+/g, ' ').trim();

const failures = [];
function check(label, ok, detail = '') {
  out(`   ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) {
    failures.push(label);
  }
}

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
page.on('dialog', (d) => d.accept());

// 0. fresh storage
await page.goto(`${BASE}/cases`, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

// 1. a case with 台灣台語, left ear 正常, right ear empty
const born = new Date();
born.setFullYear(born.getFullYear() - 8);
await page.getByPlaceholder('個案暱稱/代號').fill('背景條件（e2e）');
await page.locator('#new-case-birth-date').fill(localISO(born));
await page.getByRole('button', { name: '建立' }).click();
await page.waitForURL(/\/cases\/[^/]+$/);
const caseUrl = page.url();

async function openDetails() {
  const toggle = page.getByRole('button', { name: /基本資料/ });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await page.locator('legend', { hasText: '左耳聽力' }).waitFor();
}
const earChip = (ear, label) =>
  page
    .locator('fieldset')
    .filter({ has: page.locator(`legend:text-is("${ear}")`) })
    .getByRole('button', { name: label, exact: true });
async function pressedIn(ear) {
  const chips = page
    .locator('fieldset')
    .filter({ has: page.locator(`legend:text-is("${ear}")`) })
    .getByRole('button');
  const pressed = [];
  for (let i = 0; i < (await chips.count()); i++) {
    if ((await chips.nth(i).getAttribute('aria-pressed')) === 'true') {
      pressed.push(tidy(await chips.nth(i).textContent()));
    }
  }
  return pressed;
}

await openDetails();
check(
  'both ears start empty',
  (await pressedIn('左耳聽力')).length === 0 && (await pressedIn('右耳聽力')).length === 0,
);
await page.locator('label.chip', { hasText: '台灣台語' }).click();
await earChip('左耳聽力', '正常').click();
check(
  'left ear 正常 pressed',
  await until(async () => (await pressedIn('左耳聽力')).join() === '正常'),
);
check('right ear still empty', (await pressedIn('右耳聽力')).length === 0);
const taiChecked = await page
  .locator('label.chip', { hasText: '台灣台語' })
  .locator('input')
  .isChecked();
check('台灣台語 checked', taiChecked);
const unjudged = await page.getByText('生日、母語、左右耳聽力哪一項沒填').count();
out(
  `1. case ${caseUrl}; left=${await pressedIn('左耳聽力')} right=${await pressedIn('右耳聽力')}; not-judged line shown: ${unjudged === 1}`,
);
const stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('therapist-rule-engine:cases:v8')),
);
const storedCase = stored.cases.find((c) => c.label === '背景條件（e2e）');
out(
  `   stored: nativeLanguages=${JSON.stringify(storedCase.nativeLanguages)} hearing=${JSON.stringify(storedCase.hearing)}`,
);
check(
  'stored hearing is { left: normal }',
  JSON.stringify(storedCase.hearing) === '{"left":"normal"}',
);

// 2. the better-ear rule, written in the editor
await page.goto(`${BASE}/rules`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '新增規則' }).click();
const editor = page.locator('app-rule-editor');
// a new rule opens with one comparison row already in it
const row = editor.locator('app-condition-editor app-condition-editor').first();
const fieldSelect = row.locator('select').nth(0);
const options = (await fieldSelect.locator('option').allTextContents()).map(tidy);
out(`2. field options include: ${options.filter((o) => o.includes('聽力')).join(' / ')}`);
for (const label of ['整體聽力正常（優耳）', '左耳聽力正常', '右耳聽力正常']) {
  check(`dropdown offers ${label}`, options.includes(label));
}
await fieldSelect.selectOption({ label: '整體聽力正常（優耳）' });
await row.locator('select').nth(2).waitFor();
await row.locator('select').nth(2).selectOption({ label: '是' });
const operator = await row.locator('select').nth(1).inputValue();
const hint = tidy(
  await row
    .locator('p.meta')
    .first()
    .textContent()
    .catch(() => ''),
);
out(`   operator=${operator} hint: ${hint}`);
check('better-ear hint shown', hint.startsWith('任一耳正常就是「是」'));
check('operator is ==', operator === '==');
await editor.getByRole('button', { name: '＋ 適用條件' }).click();
await editor.locator('optgroup').first().waitFor({ state: 'attached' });
const subjectOptions = (await editor.locator('optgroup option').allTextContents()).map(tidy);
out(`   適用條件 subjects: ${subjectOptions.join(' / ')}`);
check(
  'subjects offer 構音錯誤類別 and 母語',
  subjectOptions.includes('構音錯誤類別') && subjectOptions.includes('母語'),
);
// drop the set row again so the rule is the better-ear row alone
await editor.getByRole('button', { name: '移除' }).nth(1).click();
check('set row removed', await until(async () => (await editor.locator('optgroup').count()) === 0));
await page.locator('#rule-name').fill(BETTER_EAR_RULE);
await page.locator('#rule-message').fill('e2e：優耳聽力判為正常');
await editor.getByRole('button', { name: '儲存' }).click();
check(
  'rule saved to list',
  await until(async () => (await page.getByText(BETTER_EAR_RULE).count()) === 1),
);
const savedRule = (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), RULES_KEY)).find(
  (r) => r.name === BETTER_EAR_RULE,
);
out(`   saved condition: ${JSON.stringify(savedRule?.condition)}`);
check(
  'saved condition is the better-ear row alone',
  JSON.stringify(savedRule?.condition) ===
    '{"and":[{"==":[{"var":"case.hearing.betterEarNormal"},true]}]}',
);

// 3. a 課節紀錄 with the articulation form, ㄆㄠˊ on a tone row
await page.goto(caseUrl, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '＋ 新增課節紀錄' }).click();
await page.getByRole('button', { name: '構音評估表' }).click();
await page.getByRole('button', { name: '建立' }).click();
await page.locator('table tbody a').first().click();
await page.waitForURL(/\/records\/[^/]+\/forms\/articulation$/);
const recordBase = page.url().replace(/\/forms\/articulation$/, '');

const toneCell = page
  .locator('div.flex.items-start')
  .filter({ has: page.locator('span.zhuyin:text-is("ˇ")') })
  .first();
const toneCellLabel = tidy(await toneCell.locator('div.shrink-0').first().textContent());
await toneCell.getByLabel('錯音').nth(0).fill('ㄆㄠˊ');
await toneCell.getByLabel('錯音').nth(0).blur();
await page.waitForTimeout(300);
await page.reload({ waitUntil: 'networkidle' });
const keptValue = await toneCell.getByLabel('錯音').nth(0).inputValue();
const summaryText = tidy(await page.locator('app-process-summary').textContent());
out(`3. tone cell 「${toneCellLabel}」 錯音 after reload: ${keptValue}`);
out(`   音韻歷程 card: ${summaryText}`);
check('tone slot persisted', keptValue === 'ㄆㄠˊ');
// What the tone row's error was read as (tone2 vs ㄆ) has no surface in the app: errorLabel() is
// not rendered, tone targets derive no process, and no rule row can ask for the heard symbol
// (the engine drops any condition the editor cannot read). Only unit tests can see it.
out('   NOTE: the parsed tone (二聲 vs ㄆ) is not shown anywhere in the running app');

// 4. the better-ear rule against the ears
async function warnings() {
  await page.goto(`${recordBase}/forms/_warnings`, { waitUntil: 'networkidle' });
  await page.locator('app-warnings-list').waitFor();
  return tidy(await page.locator('app-warnings-list').textContent());
}
let w = await warnings();
out(`4a. left 正常 / right empty → ${w}`);
check('better-ear rule fires with left 正常 only', w.includes(BETTER_EAR_RULE));

await page.goto(caseUrl, { waitUntil: 'networkidle' });
await openDetails();
await earChip('左耳聽力', '正常').click();
check('left ear cleared', await until(async () => (await pressedIn('左耳聽力')).length === 0));
w = await warnings();
out(`4b. both empty → ${w}`);
check('better-ear rule silent with both ears empty', !w.includes(BETTER_EAR_RULE));

await page.goto(caseUrl, { waitUntil: 'networkidle' });
await openDetails();
await earChip('左耳聽力', '異常').click();
check('left ear 異常', await until(async () => (await pressedIn('左耳聽力')).join() === '異常'));
w = await warnings();
out(`4c. left 異常 / right empty → ${w}`);
check('better-ear rule silent with left 異常, right empty', !w.includes(BETTER_EAR_RULE));

// 5. the demo case, seeded on first open
await page.evaluate(() => localStorage.clear());
await page.goto(`${BASE}/cases`, { waitUntil: 'networkidle' });
await page.getByRole('link', { name: /小美/ }).first().click();
await page.waitForURL(/\/cases\/[^/]+$/);
await page.locator('table tbody a').first().click();
await page.waitForURL(/\/forms\//);
const demoBase = page.url().replace(/\/forms\/.*$/, '');
await page.goto(`${demoBase}/forms/_warnings`, { waitUntil: 'networkidle' });
await page.locator('app-warnings-list').waitFor();
const demo = tidy(await page.locator('app-warnings-list').textContent());
out(`5. demo 警示: ${demo}`);
check('demo note on 台灣台語 shown', demo.includes('示範：台灣台語的方言影響'));

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
