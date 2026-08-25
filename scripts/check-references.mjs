/**
 * Checks that the clinical data in `src/app/data/` still matches the reviewed tables in
 * `references/`.
 *
 * These live in two places on purpose: `references/` is the human-facing artefact a therapist
 * can read and correct, `src/` is what the app runs on. Without this check the two drift, and
 * the documentation quietly becomes wrong — which is worse than having none.
 *
 * Reads both as text rather than importing them, so it stays independent of the Angular build.
 *
 * Run: pnpm check:references
 */
import { readFileSync } from 'node:fs';

const RESET = '[0m';
const RED = '[31m';
const GREEN = '[32m';

/**
 * Pulls the rows out of the table(s) under one heading, stopping at the next `## ` heading —
 * without that bound this swallowed the tables of every following section too.
 */
function markdownTable(markdown, heading) {
  const start = markdown.indexOf(heading) + heading.length;
  const rest = markdown.slice(start);
  const nextHeading = rest.indexOf('\n## ');
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);

  return section
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim().replace(/^`|`$/g, '')),
    )
    .filter((cells) => cells.length > 1 && !cells[0].startsWith('--'));
}

function checkInitials() {
  const markdown = readFileSync('references/taiwan-mandarin-consonants.md', 'utf8');
  const source = readFileSync('src/app/data/zhuyin-inventory.ts', 'utf8');

  const rows = markdownTable(markdown, '## 聲母表')
    .filter((cells) => cells[1] !== 'id')
    .map(([symbol, id, place, manner, aspiration, voicing]) => ({
      symbol,
      id,
      place,
      manner,
      aspiration,
      voicing,
    }));

  const initialsBlock = source.slice(
    source.indexOf('const INITIALS'),
    source.indexOf('const MEDIALS'),
  );
  // Whitespace-tolerant: prettier reflows these across lines once they grow past the print width.
  const q = String.raw`'([^']+)'`;
  const pattern = new RegExp(
    String.raw`id:\s*${q},\s*symbol:\s*${q},\s*category:\s*'initial',\s*features:\s*\{` +
      String.raw`\s*place:\s*${q},\s*manner:\s*${q},\s*aspiration:\s*${q},\s*voicing:\s*${q},?\s*\}`,
    'g',
  );
  const code = [...initialsBlock.matchAll(pattern)].map(
    ([, id, symbol, place, manner, aspiration, voicing]) => ({
      symbol,
      id,
      place,
      manner,
      aspiration,
      voicing,
    }),
  );

  const problems = [];
  if (rows.length !== code.length) {
    problems.push(`列數不同:references 有 ${rows.length} 筆，程式碼有 ${code.length} 筆`);
  }

  const byId = new Map(code.map((entry) => [entry.id, entry]));
  for (const row of rows) {
    const entry = byId.get(row.id);
    if (!entry) {
      problems.push(`程式碼裡找不到 ${row.symbol} (${row.id})`);
      continue;
    }
    for (const key of ['symbol', 'place', 'manner', 'aspiration', 'voicing']) {
      if (entry[key] !== row[key]) {
        problems.push(`${row.symbol} (${row.id}) 的 ${key}:references 是 ${row[key]}，程式碼是 ${entry[key]}`);
      }
    }
  }

  const referencedIds = new Set(rows.map((row) => row.id));
  for (const entry of code) {
    if (!referencedIds.has(entry.id)) {
      problems.push(`references 裡找不到 ${entry.symbol} (${entry.id})`);
    }
  }

  return { name: 'taiwan-mandarin-consonants', count: rows.length, problems };
}

/**
 * The finals table is checked by id and glyph only. Their features sit in nested objects that a
 * regex reads badly; the unit tests in articulation-content.spec.ts assert the values instead.
 * This catches the mistake that actually happens — adding or renaming a symbol in one place.
 */
function checkFinals() {
  const markdown = readFileSync('references/taiwan-mandarin-vowels.md', 'utf8');
  const source = readFileSync('src/app/data/zhuyin-inventory.ts', 'utf8');

  const rows = [
    ...markdownTable(markdown, '## 單元音').filter((cells) => cells[1] !== 'id'),
    ...markdownTable(markdown, '## 複合韻母').filter((cells) => cells[1] !== 'id'),
  ].map(([symbol, id]) => ({ symbol, id }));

  const block = source.slice(source.indexOf('const MEDIALS'), source.indexOf('const TONES'));
  const code = [...block.matchAll(/id: '([^']+)',\s*symbol: '([^']+)'/g)].map(([, id, symbol]) => ({
    symbol,
    id,
  }));

  const problems = [];
  const byId = new Map(code.map((entry) => [entry.id, entry]));
  for (const row of rows) {
    const entry = byId.get(row.id);
    if (!entry) {
      problems.push(`程式碼裡找不到 ${row.symbol} (${row.id})`);
    } else if (entry.symbol !== row.symbol) {
      problems.push(`${row.id} 的符號:references 是 ${row.symbol}，程式碼是 ${entry.symbol}`);
    }
  }

  const referencedIds = new Set(rows.map((row) => row.id));
  for (const entry of code) {
    if (!referencedIds.has(entry.id)) {
      problems.push(`references 裡找不到 ${entry.symbol} (${entry.id})`);
    }
  }

  return { name: 'taiwan-mandarin-vowels', count: rows.length, problems };
}

function checkProcesses() {
  const markdown = readFileSync('references/phonological-processes.md', 'utf8');
  const source = readFileSync('src/app/data/starter-articulation-processes.ts', 'utf8');

  const rows = markdownTable(markdown, '## 清單')
    .filter((cells) => cells[0] !== 'id')
    .map(([id, name, description]) => ({ id, name, description }));

  const pattern = /id: '([^']+)',\s*name: '([^']+)',\s*description: '([^']+)'/g;
  const code = [...source.matchAll(pattern)].map(([, id, name, description]) => ({
    id,
    name,
    description,
  }));

  const problems = [];
  const byId = new Map(code.map((entry) => [entry.id, entry]));
  for (const row of rows) {
    const entry = byId.get(row.id);
    if (!entry) {
      problems.push(`程式碼裡找不到 ${row.name} (${row.id})`);
      continue;
    }
    if (entry.name !== row.name) {
      problems.push(`${row.id} 的名稱:references 是 ${row.name}，程式碼是 ${entry.name}`);
    }
    if (entry.description !== row.description) {
      problems.push(`${row.name} 的說明不一致`);
    }
  }

  const referencedIds = new Set(rows.map((row) => row.id));
  for (const entry of code) {
    if (!referencedIds.has(entry.id)) {
      problems.push(`references 裡找不到 ${entry.name} (${entry.id})`);
    }
  }

  problems.push(...derivationProblems(markdown));

  return { name: 'phonological-processes', count: rows.length, problems };
}

/**
 * The 推導條件 table says which processes the code derives. It drifted once, in the worst possible
 * direction: it claimed 前置化/後置化 come from comparing place indices, which is the exact
 * mistake the project removed from the code and wrote a whole section of that same file to warn
 * against. Nothing caught it, because checkProcesses only ever read the 清單 table.
 *
 * So compare the table against the rules that actually exist. A process the table gives a real
 * criterion for must have a rule; one the table marks 不推導 must not.
 */
function derivationProblems(markdown) {
  const source = readFileSync('src/app/core/articulation/derive-processes.ts', 'utf8');
  const rulesBlock = source.slice(source.indexOf('const RULES'), source.indexOf('\n};'));
  const derived = new Set([...rulesBlock.matchAll(/^  (\w+):/gm)].map(([, id]) => id));

  const names = new Map(
    markdownTable(markdown, '## 清單')
      .filter((cells) => cells[0] !== 'id')
      .map(([id, name]) => [name, id]),
  );

  const problems = [];
  for (const [name, criterion] of markdownTable(markdown, '## 推導條件')
    .filter((cells) => cells[0] !== '歷程')
    .map(([name, criterion]) => [name, criterion])) {
    const id = names.get(name);
    if (!id) {
      problems.push(`推導條件表裡的「${name}」在清單表裡找不到`);
      continue;
    }
    const saysNo = criterion.includes('不推導') || criterion.includes('推導不出來');
    if (saysNo && derived.has(id)) {
      problems.push(`推導條件說「${name}」不推導，但 derive-processes.ts 有 ${id} 這條規則`);
    }
    if (!saysNo && !derived.has(id)) {
      problems.push(`推導條件給了「${name}」判準，但 derive-processes.ts 沒有 ${id} 這條規則`);
    }
  }
  return problems;
}

/** Consistencies, their qualitative flags, and the counting units, all id + label pairs. */
function checkSwallowing() {
  const markdown = readFileSync('references/swallowing-consistencies.md', 'utf8');
  const source = readFileSync('src/app/data/starter-swallow-catalogue.ts', 'utf8');

  const rows = [
    ...markdownTable(markdown, '## 兩個交疊的量表，不是一條線')
      .filter((cells) => cells[0] !== 'id')
      .map(([id, , name]) => ({ id, name })),
    ...markdownTable(markdown, '## 質性標記')
      .filter((cells) => cells[0] !== 'id')
      .map(([id, name]) => ({ id, name })),
    ...markdownTable(markdown, '## 計次單位')
      .filter((cells) => cells[0] !== 'id')
      .map(([id, name]) => ({ id, name })),
  ];

  const code = [...source.matchAll(/id: '([^']+)',[\s\S]{0,80}?name: '([^']+)'/g)].map(
    ([, id, name]) => ({ id, name }),
  );

  const problems = [];
  const byId = new Map(code.map((entry) => [entry.id, entry]));
  for (const row of rows) {
    const entry = byId.get(row.id);
    if (!entry) {
      problems.push(`程式碼裡找不到 ${row.name} (${row.id})`);
    } else if (entry.name !== row.name) {
      problems.push(`${row.id} 的名稱:references 是 ${row.name}，程式碼是 ${entry.name}`);
    }
  }

  const referencedIds = new Set(rows.map((row) => row.id));
  for (const entry of code) {
    if (!referencedIds.has(entry.id)) {
      problems.push(`references 裡找不到 ${entry.name} (${entry.id})`);
    }
  }

  return { name: 'swallowing-consistencies', count: rows.length, problems };
}

const results = [checkInitials(), checkFinals(), checkProcesses(), checkSwallowing()];
const failed = results.filter((result) => result.problems.length > 0);

for (const result of results) {
  if (result.problems.length === 0) {
    console.log(`${GREEN}✓${RESET} ${result.name} — ${result.count} 筆與程式碼一致`);
  } else {
    console.log(`${RED}✘${RESET} ${result.name}`);
    for (const problem of result.problems) {
      console.log(`    ${problem}`);
    }
  }
}

if (failed.length > 0) {
  console.log(`\n${RED}references/ 與程式碼不一致。${RESET}先改 references/，再同步 src/app/data/。`);
  process.exit(1);
}
