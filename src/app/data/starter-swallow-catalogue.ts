import {
  ConsistencyDefinition,
  ConsistencyFlagDefinition,
  SwallowUnitDefinition,
} from '../models/swallow-catalogue.model';

/**
 * Level numbers and short labels from IDDSI. The full descriptors are deliberately not here —
 * they are CC BY-SA 4.0 and may not be altered; see references/swallowing-consistencies.md.
 *
 * `order` is thinnest first. Levels 3 and 4 belong to both scales, which is why `groups` is a
 * list rather than one value.
 */
export const STARTER_CONSISTENCIES: ConsistencyDefinition[] = [
  { id: 'thin', level: '0', name: '稀薄', groups: ['drink'], order: 1, builtin: true },
  {
    id: 'slightlyThick',
    level: '1',
    name: '極微稠',
    groups: ['drink'],
    order: 2,
    builtin: true,
  },
  { id: 'mildlyThick', level: '2', name: '低度稠', groups: ['drink'], order: 3, builtin: true },
  {
    id: 'moderatelyThick',
    level: '3',
    name: '中度稠／流質',
    groups: ['drink', 'food'],
    order: 4,
    builtin: true,
  },
  {
    id: 'extremelyThick',
    level: '4',
    name: '高度稠／糊狀',
    groups: ['drink', 'food'],
    order: 5,
    builtin: true,
  },
  { id: 'mincedMoist', level: '5', name: '細碎及濕軟', groups: ['food'], order: 6, builtin: true },
  {
    id: 'softBiteSized',
    level: '6',
    name: '軟質及一口量',
    groups: ['food'],
    order: 7,
    builtin: true,
  },
  { id: 'easyToChew', level: '7EC', name: '容易咀嚼', groups: ['food'], order: 8, builtin: true },
  { id: 'regular', level: '7', name: '食物原狀', groups: ['food'], order: 9, builtin: true },
];

/** Properties that are not a point on the thin→thick line, so they cannot be a level. */
export const STARTER_CONSISTENCY_FLAGS: ConsistencyFlagDefinition[] = [
  {
    id: 'transitional',
    name: '過渡期食物',
    description: '起始是一種質地，遇到水分或體溫後變成另一種，例如明膠果凍、冰淇淋',
    builtin: true,
  },
  {
    id: 'mixedConsistency',
    name: '混合質地',
    description: '固體與液體分離，例如稀飯、湯麵、帶湯青菜',
    builtin: true,
  },
];

export const STARTER_SWALLOW_UNITS: SwallowUnitDefinition[] = [
  { id: 'mouthful', name: '口', builtin: true },
  { id: 'spoon', name: '匙', builtin: true },
  { id: 'time', name: '次', builtin: true },
];
