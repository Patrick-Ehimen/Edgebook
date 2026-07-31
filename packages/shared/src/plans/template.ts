import type { PlanRules } from './schemas';

/**
 * The plan template — the structure of a trading plan, as sections containing
 * subsections containing fillable fields.
 *
 * This lives in code, not the database. A saved plan stores only the *values*
 * keyed by field id, so new sections or fields can be added here at any time
 * and existing plans simply have no value for them yet. Never reuse or repurpose
 * a field `id` — that would silently re-point saved answers.
 */

export type PlanFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'tags'
  | 'table'
  | 'checklist'
  /** Holds the id of one of the user's Playbook records. */
  | 'playbook';

export interface PlanField {
  id: string;
  label: string;
  type: PlanFieldType;
  /** Guidance shown under the label. */
  help?: string;
  placeholder?: string;
  /** Suffix for `number` fields, e.g. "%" or "x". */
  unit?: string;
  /** Column headers for `table` fields. */
  columns?: string[];
  /** Chip suggestions offered for `tags` fields. */
  suggestions?: string[];
  /** Pre-seeded rows for `table` fields — the labels stay, the values get filled. */
  seedRows?: string[][];
  /** Pre-seeded lines for `checklist` fields. */
  seedItems?: { label: string; hard?: boolean }[];
  /** When set, this field also writes into the typed, enforceable rules object. */
  rulesKey?: keyof PlanRules;
}

export interface PlanSubsection {
  key: string;
  title: string;
  intro?: string;
  fields: PlanField[];
}

export interface PlanSectionTemplate {
  key: string;
  /** Display number, matching the written plan (§0 … §15). */
  number: number;
  title: string;
  /** Short right-aligned caption describing what the section governs. */
  governs: string;
  intro?: string;
  subsections: PlanSubsection[];
}

export const PLAN_TEMPLATE: PlanSectionTemplate[] = [
  {
    key: 'read-first',
    number: 0,
    title: 'Read this first',
    governs: 'The one-line mission',
    intro: 'What this plan is for, and which tool outranks which.',
    subsections: [
      {
        key: 'mission',
        title: 'Mission',
        fields: [
          {
            id: 'read.mission',
            label: 'This plan has one job',
            type: 'textarea',
            placeholder: 'e.g. Stop me from taking trades that don’t meet spec.',
            help: 'One or two sentences. If you internalise nothing else from the plan, it should be this.',
          },
          {
            id: 'read.principle',
            label: 'Core principle',
            type: 'text',
            placeholder:
              'e.g. Location is non-negotiable. Indicators are confirmation, never invitation.',
          },
        ],
      },
      {
        key: 'tool-ranking',
        title: 'Tool ranking',
        intro: 'The tools do not have equal weight. Rank them, and don’t change the ranking.',
        fields: [
          {
            id: 'read.toolRanking',
            label: 'Ranking',
            type: 'table',
            columns: ['Rank', 'Tool', 'Role', 'Can it start a trade alone?'],
            seedRows: [
              ['1', '', '', ''],
              ['2', '', '', ''],
              ['3', '', '', ''],
              ['4', '', '', ''],
            ],
          },
        ],
      },
    ],
  },

  {
    key: 'scope',
    number: 1,
    title: 'Scope & instruments',
    governs: 'The tradeable universe',
    subsections: [
      {
        key: 'universe',
        title: 'Tradeable universe',
        intro: 'Keep it small. Zones need history to be valid.',
        fields: [
          {
            id: 'scope.core',
            label: 'Core pairs',
            type: 'tags',
            help: 'The pairs you trade by default.',
            suggestions: ['BTCUSDT', 'ETHUSDT'],
          },
          {
            id: 'scope.rotation',
            label: 'Rotation pairs',
            type: 'tags',
            help: 'Held to a maximum at any one time — note the cap below.',
            suggestions: ['SOLUSDT', 'BNBUSDT'],
          },
          {
            id: 'scope.rotationCap',
            label: 'Max rotation pairs at once',
            type: 'number',
            placeholder: '2',
          },
          {
            id: 'scope.banned',
            label: 'Banned',
            type: 'textarea',
            placeholder:
              'e.g. Anything under ~$200M 24h volume, freshly listed tokens (<90 days of price history), low-float meme pairs.',
          },
        ],
      },
      {
        key: 'correlation',
        title: 'Correlation rule',
        fields: [
          {
            id: 'scope.correlation',
            label: 'How correlated positions are counted',
            type: 'textarea',
            placeholder:
              'e.g. Two long alt positions plus a long BTC is one trade at 3x size, not three trades.',
          },
        ],
      },
    ],
  },

  {
    key: 'timeframes',
    number: 2,
    title: 'Timeframe architecture',
    governs: 'Bias · Structure · Trigger',
    intro: 'Three layers, always. Never enter on the layer that gave you bias.',
    subsections: [
      {
        key: 'swing',
        title: '2.1 Swing setup',
        fields: [
          {
            id: 'tf.swing.layers',
            label: 'Layers',
            type: 'table',
            columns: ['Layer', 'Timeframe', 'Job'],
            seedRows: [
              ['Bias (HTF)', '', ''],
              ['Structure (MTF)', '', ''],
              ['Trigger (LTF)', '', ''],
            ],
          },
          {
            id: 'tf.swing.hold',
            label: 'Hold time',
            type: 'text',
            placeholder: 'e.g. 2 days – 3 weeks',
          },
          {
            id: 'tf.swing.frequency',
            label: 'Expected frequency',
            type: 'text',
            placeholder: 'e.g. 2–6 trades / month',
          },
        ],
      },
      {
        key: 'intraday',
        title: '2.2 Intraday setup',
        fields: [
          {
            id: 'tf.intraday.layers',
            label: 'Layers',
            type: 'table',
            columns: ['Layer', 'Timeframe', 'Job'],
            seedRows: [
              ['Bias (HTF)', '', ''],
              ['Structure (MTF)', '', ''],
              ['Trigger (LTF)', '', ''],
            ],
          },
          {
            id: 'tf.intraday.hold',
            label: 'Hold time',
            type: 'text',
            placeholder: 'e.g. 30 min – 12 hours',
          },
          {
            id: 'tf.intraday.frequency',
            label: 'Expected frequency',
            type: 'text',
            placeholder: 'e.g. 3–8 trades / week',
          },
          {
            id: 'tf.intraday.overnight',
            label: 'Overnight rule',
            type: 'textarea',
            placeholder:
              'e.g. Flat before sleep unless the trade is at +1R or better with the stop at breakeven.',
          },
        ],
      },
      {
        key: 'bias',
        title: '2.3 Bias definition',
        intro:
          'Mechanical, no opinion. Write it so two people would read the same chart the same way.',
        fields: [
          {
            id: 'tf.bias.bullish',
            label: 'Bullish',
            type: 'textarea',
            placeholder:
              'e.g. Higher highs and higher lows, trading above the 20-period Bollinger basis.',
          },
          { id: 'tf.bias.bearish', label: 'Bearish', type: 'textarea' },
          { id: 'tf.bias.neutral', label: 'Neutral / range', type: 'textarea' },
          {
            id: 'tf.bias.directionRule',
            label: 'What each bias permits',
            type: 'textarea',
            placeholder:
              'e.g. Bullish bias → longs only. Bearish → shorts only. Neutral → range playbook only, reduced conviction.',
          },
          {
            id: 'tf.bias.counterTrend',
            label: 'Counter-trend policy',
            type: 'textarea',
            placeholder: 'When, if ever, are you allowed to trade against a clean HTF trend?',
          },
        ],
      },
    ],
  },

  {
    key: 'location',
    number: 3,
    title: 'Supply & demand · S&R',
    governs: 'The location filter',
    subsections: [
      {
        key: 'zone-validity',
        title: '3.1 What qualifies as a zone',
        fields: [
          {
            id: 'loc.drawing',
            label: 'How you draw a zone',
            type: 'textarea',
            placeholder: 'Upper bound, lower bound, and what counts as the "base" candles.',
          },
          {
            id: 'loc.criteria',
            label: 'Validity criteria',
            type: 'checklist',
            help: 'A zone must satisfy every one of these to be tradeable.',
            seedItems: [
              { label: 'Impulsive departure', hard: true },
              { label: 'Structural consequence', hard: true },
              { label: 'Freshness — first touch is the trade', hard: true },
              { label: 'Room to target — at least 2R of clear space', hard: true },
            ],
          },
        ],
      },
      {
        key: 'hierarchy',
        title: '3.2 Zone hierarchy',
        fields: [
          {
            id: 'loc.hierarchy',
            label: 'Location grades',
            type: 'table',
            columns: ['Grade', 'Definition', 'Action'],
            seedRows: [
              ['A', '', ''],
              ['B', '', ''],
              ['C', '', ''],
            ],
          },
        ],
      },
      {
        key: 'flips',
        title: '3.3 S&R flips',
        fields: [
          {
            id: 'loc.flips',
            label: 'When a broken level counts as a zone',
            type: 'textarea',
            placeholder:
              'e.g. Only if the break was impulsive and closed beyond the level on the HTF close.',
          },
        ],
      },
      {
        key: 'sweeps',
        title: '3.4 Liquidity sweeps',
        fields: [
          {
            id: 'loc.sweeps',
            label: 'How sweeps change your stop and your read',
            type: 'textarea',
          },
        ],
      },
      {
        key: 'marking',
        title: '3.5 Marking routine',
        fields: [
          {
            id: 'loc.marking',
            label: 'Routine',
            type: 'textarea',
            placeholder:
              'When you mark zones, which timeframes, how many, and when you delete them.',
          },
          {
            id: 'loc.markingRule',
            label: 'Hard rule',
            type: 'text',
            placeholder: 'e.g. Never mark zones while in a position.',
          },
        ],
      },
    ],
  },

  {
    key: 'momentum',
    number: 4,
    title: 'RSI (14)',
    governs: 'The momentum filter',
    intro: 'Confirmation only — RSI never starts a trade on its own.',
    subsections: [
      {
        key: 'regime',
        title: '4.1 Regime',
        fields: [
          {
            id: 'rsi.bullRange',
            label: 'Bull regime range',
            type: 'text',
            placeholder: 'e.g. 40–80',
          },
          {
            id: 'rsi.bearRange',
            label: 'Bear regime range',
            type: 'text',
            placeholder: 'e.g. 20–60',
          },
          { id: 'rsi.regimeShift', label: 'What a regime shift tells you', type: 'textarea' },
        ],
      },
      {
        key: 'midline',
        title: '4.2 The 50 line',
        fields: [{ id: 'rsi.midline', label: 'How you use the midline', type: 'textarea' }],
      },
      {
        key: 'divergence',
        title: '4.3 Regular divergence',
        fields: [
          {
            id: 'rsi.regularDiv',
            label: 'Definition and what it confirms',
            type: 'textarea',
            placeholder: 'Include the swing separation you require, e.g. 5–30 bars apart.',
          },
        ],
      },
      {
        key: 'hidden-divergence',
        title: '4.4 Hidden divergence',
        fields: [
          { id: 'rsi.hiddenDiv', label: 'Definition and what it confirms', type: 'textarea' },
        ],
      },
      {
        key: 'extremes',
        title: '4.5 Extreme readings',
        fields: [
          { id: 'rsi.extremes', label: 'How you treat extremes', type: 'textarea' },
          {
            id: 'rsi.extremeVeto',
            label: 'Extreme that vetoes an entry',
            type: 'text',
            placeholder: 'e.g. Do not enter into an HTF RSI > 75 in that direction.',
          },
        ],
      },
    ],
  },

  {
    key: 'volatility',
    number: 5,
    title: 'Bollinger Bands (20, 2)',
    governs: 'The volatility filter',
    subsections: [
      {
        key: 'squeeze',
        title: '5.1 Squeeze',
        fields: [
          {
            id: 'bb.squeeze',
            label: 'What counts as a squeeze',
            type: 'textarea',
            placeholder: 'e.g. Bandwidth at or near a 20+ period low.',
          },
        ],
      },
      {
        key: 'band-walk',
        title: '5.2 Band walk',
        fields: [{ id: 'bb.bandWalk', label: 'What a band walk tells you', type: 'textarea' }],
      },
      {
        key: 'mean-reversion',
        title: '5.3 Mean reversion',
        fields: [
          {
            id: 'bb.meanReversion',
            label: 'When mean reversion is allowed',
            type: 'textarea',
            placeholder: 'e.g. Range conditions only — never in a band walk.',
          },
        ],
      },
      {
        key: 'percent-b',
        title: '5.4 %B as a stretch gauge',
        fields: [{ id: 'bb.percentB', label: 'How you read %B', type: 'textarea' }],
      },
      {
        key: 'never',
        title: '5.5 What Bollinger Bands must never do',
        fields: [
          {
            id: 'bb.never',
            label: 'Prohibitions',
            type: 'textarea',
            placeholder: 'e.g. A band touch is not a signal. Never enter on a band tag alone.',
          },
        ],
      },
    ],
  },

  {
    key: 'triggers',
    number: 6,
    title: 'Candlestick triggers',
    governs: 'The entry & stop reference',
    subsections: [
      {
        key: 'approved',
        title: '6.1 Approved triggers',
        intro: 'If it isn’t on this list, it isn’t a trigger.',
        fields: [
          {
            id: 'trig.approved',
            label: 'Approved trigger list',
            type: 'tags',
            suggestions: [
              'Bullish engulfing',
              'Pin bar / hammer',
              'Sweep and reclaim',
              'Morning star',
              'Inside-bar break',
            ],
          },
        ],
      },
      {
        key: 'quality',
        title: '6.2 Trigger quality rules',
        fields: [
          {
            id: 'trig.quality',
            label: 'Quality rules',
            type: 'checklist',
            seedItems: [
              { label: 'The candle has closed', hard: true },
              { label: 'The trigger touches the zone', hard: true },
              { label: 'Volume at or above average' },
              { label: 'Rejection wick through the zone closing back inside' },
            ],
          },
          { id: 'trig.notes', label: 'Notes', type: 'textarea' },
        ],
      },
    ],
  },

  {
    key: 'risk',
    number: 7,
    title: 'Risk management',
    governs: 'Overrides every other section',
    intro: 'A perfect setup taken at the wrong size is a losing strategy.',
    subsections: [
      {
        key: 'sizing',
        title: '7.1 Position sizing',
        fields: [
          {
            id: 'risk.perTrade',
            label: 'Risk per trade',
            type: 'number',
            unit: '%',
            placeholder: '1.0',
            rulesKey: 'riskPctPerTrade',
            help: 'Of current account equity. Enforced by the tilt engine.',
          },
          {
            id: 'risk.formula',
            label: 'Sizing formula',
            type: 'textarea',
            placeholder:
              'Position size = (Equity × risk%) / stop distance\nNotional = Position size × entry price',
          },
          {
            id: 'risk.recalc',
            label: 'When you recalculate equity',
            type: 'text',
            placeholder: 'e.g. Weekly, not after every trade.',
          },
          {
            id: 'risk.inversion',
            label: 'The inversion to avoid',
            type: 'text',
            placeholder: 'e.g. Never set size first and then find a stop for it.',
          },
        ],
      },
      {
        key: 'stops',
        title: '7.2 Stop placement',
        fields: [
          { id: 'risk.stopRule', label: 'Where the stop goes', type: 'textarea' },
          {
            id: 'risk.atrBuffer',
            label: 'ATR buffer',
            type: 'text',
            placeholder: 'e.g. 0.25 × ATR(14) on the trigger timeframe',
          },
          {
            id: 'risk.stopHard',
            label: 'Hard rules',
            type: 'checklist',
            seedItems: [
              { label: 'Never a mental stop — it goes in the exchange on fill', hard: true },
              { label: 'Never tighten the stop to make the R:R maths work', hard: true },
            ],
          },
        ],
      },
      {
        key: 'rr',
        title: '7.3 Minimum R:R',
        intro: 'Measured to the first target, not the moon target.',
        fields: [
          {
            id: 'risk.rr.intraday',
            label: 'Intraday',
            type: 'number',
            unit: ': 1',
            placeholder: '2.0',
            rulesKey: 'minRRIntraday',
          },
          {
            id: 'risk.rr.swing',
            label: 'Swing',
            type: 'number',
            unit: ': 1',
            placeholder: '3.0',
            rulesKey: 'minRRSwing',
          },
          {
            id: 'risk.rr.counter',
            label: 'Counter-trend',
            type: 'number',
            unit: ': 1',
            placeholder: '3.0',
            rulesKey: 'minRRCounterTrend',
          },
        ],
      },
      {
        key: 'exposure',
        title: '7.4 Exposure limits',
        intro: 'The daily and weekly limits are hard stops, not guidelines.',
        fields: [
          {
            id: 'risk.maxOpen',
            label: 'Max concurrent open risk',
            type: 'number',
            unit: '%',
            placeholder: '3.0',
            rulesKey: 'maxOpenRiskPct',
          },
          {
            id: 'risk.maxCorrelated',
            label: 'Max correlated open risk',
            type: 'number',
            unit: '%',
            placeholder: '2.0',
            rulesKey: 'maxCorrelatedRiskPct',
          },
          {
            id: 'risk.maxPositions',
            label: 'Max positions open at once',
            type: 'number',
            placeholder: '3',
            rulesKey: 'maxOpenPositions',
          },
          {
            id: 'risk.dailyLoss',
            label: 'Daily loss limit',
            type: 'number',
            unit: '%',
            placeholder: '3.0',
            rulesKey: 'dailyLossLimitPct',
            help: 'Hit it and you stop for the day.',
          },
          {
            id: 'risk.weeklyLoss',
            label: 'Weekly loss limit',
            type: 'number',
            unit: '%',
            placeholder: '6.0',
            rulesKey: 'weeklyLossLimitPct',
          },
          {
            id: 'risk.monthlyDD',
            label: 'Monthly drawdown limit',
            type: 'number',
            unit: '%',
            placeholder: '10',
            rulesKey: 'monthlyDrawdownLimitPct',
          },
          { id: 'risk.limitAction', label: 'What happens when a limit is hit', type: 'textarea' },
        ],
      },
      {
        key: 'leverage',
        title: '7.5 Leverage',
        fields: [
          {
            id: 'risk.leverageCeiling',
            label: 'Hard leverage ceiling',
            type: 'number',
            unit: 'x',
            placeholder: '5',
            rulesKey: 'leverageCeiling',
          },
          {
            id: 'risk.leverageNote',
            label: 'Policy',
            type: 'textarea',
            placeholder:
              'e.g. Leverage is an output of the sizing formula, never an input. If the formula demands more than the ceiling, the stop is too tight — skip.',
          },
        ],
      },
    ],
  },

  {
    key: 'scoring',
    number: 8,
    title: 'Confluence scoring',
    governs: 'The go / no-go filter',
    intro: 'The score is only useful if you can fail yourself with it.',
    subsections: [
      {
        key: 'factors',
        title: '8.1 Factors',
        fields: [
          {
            id: 'score.factors',
            label: 'Scoring factors',
            type: 'table',
            columns: ['#', 'Factor', 'Points'],
            seedRows: [
              ['1', '', ''],
              ['2', '', ''],
              ['3', '', ''],
              ['4', '', ''],
              ['5', '', ''],
              ['6', '', ''],
              ['7', '', ''],
              ['8', '', ''],
            ],
          },
          { id: 'score.total', label: 'Total possible', type: 'number', placeholder: '14' },
        ],
      },
      {
        key: 'grades',
        title: '8.2 Grades & sizing',
        fields: [
          {
            id: 'score.grades',
            label: 'Grade bands',
            type: 'table',
            columns: ['Grade', 'Score', 'Action', 'Risk'],
            seedRows: [
              ['A+', '', '', ''],
              ['A', '', '', ''],
              ['B', '', '', ''],
              ['C', '', '', ''],
            ],
          },
        ],
      },
      {
        key: 'vetoes',
        title: '8.3 Hard vetoes',
        intro: 'Regardless of score — any one of these and there is no trade.',
        fields: [
          {
            id: 'score.vetoes',
            label: 'Vetoes',
            type: 'checklist',
            seedItems: [
              { label: 'No candlestick trigger', hard: true },
              { label: 'Third touch or later on the zone', hard: true },
              { label: 'Below the minimum R:R for this setup type', hard: true },
              { label: 'Daily or weekly loss limit hit', hard: true },
              { label: 'Major scheduled event within 2 hours', hard: true },
            ],
          },
        ],
      },
    ],
  },

  {
    key: 'playbooks',
    number: 9,
    title: 'Playbooks',
    governs: 'If it isn’t one of these, it isn’t a trade',
    intro:
      'Link each slot to one of your playbooks — the plan then reads from that record instead of duplicating it. You can still write the parts a playbook record does not hold.',
    subsections: ['A', 'B', 'C'].map((letter, i) => ({
      key: `playbook-${letter.toLowerCase()}`,
      title: `9.${i + 1} Playbook ${letter}`,
      fields: [
        {
          id: `pb.${letter}.ref`,
          label: 'Linked playbook',
          type: 'playbook' as const,
          help: 'Pick one of your playbooks. Its name, thesis, entry, exit and invalidation can be pulled in below.',
        },
        {
          id: `pb.${letter}.name`,
          label: 'Name',
          type: 'text' as const,
          placeholder:
            letter === 'A'
              ? 'e.g. Trend Continuation Pullback'
              : letter === 'B'
                ? 'e.g. Reversal at HTF Extreme'
                : 'e.g. Squeeze Breakout & Retest',
        },
        {
          id: `pb.${letter}.share`,
          label: 'Target share of trades',
          type: 'text' as const,
          placeholder: letter === 'A' ? 'e.g. 60%+' : 'e.g. max 20%',
        },
        { id: `pb.${letter}.context`, label: 'Context', type: 'textarea' as const },
        {
          id: `pb.${letter}.conditions`,
          label: 'Conditions',
          type: 'textarea' as const,
          help: 'Numbered, and specific enough to fail.',
        },
        { id: `pb.${letter}.entry`, label: 'Entry', type: 'textarea' as const },
        { id: `pb.${letter}.stop`, label: 'Stop', type: 'textarea' as const },
        { id: `pb.${letter}.targets`, label: 'Targets', type: 'textarea' as const },
        { id: `pb.${letter}.invalidation`, label: 'Invalidation', type: 'textarea' as const },
        { id: `pb.${letter}.discipline`, label: 'Discipline note', type: 'textarea' as const },
      ],
    })),
  },

  {
    key: 'management',
    number: 10,
    title: 'Trade management',
    governs: 'Written before entry, always',
    subsections: [
      {
        key: 'ladder',
        title: '10.1 Scale-out ladder',
        fields: [
          {
            id: 'mgmt.ladder',
            label: 'Ladder',
            type: 'table',
            columns: ['Level', 'Action'],
            seedRows: [
              ['+1R', ''],
              ['T2', ''],
              ['Runner', ''],
            ],
          },
          { id: 'mgmt.ladderNote', label: 'Why this ladder', type: 'textarea' },
        ],
      },
      {
        key: 'unbreakable',
        title: '10.2 Rules you don’t get to break',
        fields: [
          {
            id: 'mgmt.unbreakable',
            label: 'Rules',
            type: 'checklist',
            seedItems: [
              { label: 'Never move a stop further from entry', hard: true },
              { label: 'Never add to a loser', hard: true },
              { label: 'Adding to a winner only at a new valid setup, sized separately' },
              { label: 'Time stop on dead trades' },
              { label: 'Flatten or reduce before scheduled high-impact events' },
            ],
          },
        ],
      },
      {
        key: 'early-exit',
        title: '10.3 Early exit conditions',
        fields: [
          {
            id: 'mgmt.earlyExit',
            label: 'Close before the stop when',
            type: 'textarea',
            help: 'Exiting early on evidence is discipline. Exiting early on discomfort is not.',
          },
        ],
      },
    ],
  },

  {
    key: 'routine',
    number: 11,
    title: 'Routine',
    governs: 'Where the plan gets executed',
    subsections: [
      {
        key: 'weekly',
        title: '11.1 Weekly',
        fields: [
          {
            id: 'rou.weekly.when',
            label: 'When / how long',
            type: 'text',
            placeholder: 'e.g. Sunday · ~60 min',
          },
          { id: 'rou.weekly.steps', label: 'Steps', type: 'textarea' },
        ],
      },
      {
        key: 'pre-session',
        title: '11.2 Daily pre-session',
        fields: [
          {
            id: 'rou.pre.when',
            label: 'When / how long',
            type: 'text',
            placeholder: 'e.g. ~15 min',
          },
          { id: 'rou.pre.steps', label: 'Steps', type: 'textarea' },
        ],
      },
      {
        key: 'post-session',
        title: '11.3 Daily post-session',
        fields: [
          {
            id: 'rou.post.when',
            label: 'When / how long',
            type: 'text',
            placeholder: 'e.g. ~10 min',
          },
          { id: 'rou.post.steps', label: 'Steps', type: 'textarea' },
        ],
      },
    ],
  },

  {
    key: 'checklist',
    number: 12,
    title: 'Pre-trade checklist',
    governs: 'Any hard "no" = no trade',
    intro: 'Run it every time. Mark the rows that are hard vetoes.',
    subsections: [
      {
        key: 'location',
        title: '12.1 Location',
        fields: [
          {
            id: 'chk.location',
            label: 'Location rows',
            type: 'checklist',
            seedItems: [
              { label: 'Trade is at a marked zone — not near one, at one' },
              { label: 'Zone is fresh: first or second touch', hard: true },
              { label: 'Zone has ≥ 2R clear space to first target', hard: true },
            ],
          },
        ],
      },
      {
        key: 'bias',
        title: '12.2 Bias',
        fields: [
          {
            id: 'chk.bias',
            label: 'Bias rows',
            type: 'checklist',
            seedItems: [
              {
                label: 'Direction agrees with HTF bias, or is a valid counter-trend setup',
                hard: true,
              },
              { label: 'I can name which playbook this is', hard: true },
            ],
          },
        ],
      },
      {
        key: 'trigger',
        title: '12.3 Trigger',
        fields: [
          {
            id: 'chk.trigger',
            label: 'Trigger rows',
            type: 'checklist',
            seedItems: [
              { label: 'Candlestick trigger from the approved list', hard: true },
              { label: 'The candle has closed', hard: true },
              { label: 'Trigger touches the zone' },
              { label: 'Volume at or above average' },
            ],
          },
        ],
      },
      {
        key: 'momentum',
        title: '12.4 Momentum',
        fields: [
          {
            id: 'chk.momentum',
            label: 'Momentum rows',
            type: 'checklist',
            seedItems: [
              { label: 'RSI confirms: regime hold / divergence / hidden divergence' },
              { label: 'Not entering into an HTF RSI extreme in that direction', hard: true },
            ],
          },
        ],
      },
      {
        key: 'volatility',
        title: '12.5 Volatility',
        fields: [
          {
            id: 'chk.volatility',
            label: 'Volatility rows',
            type: 'checklist',
            seedItems: [{ label: 'Bollinger state matches the playbook' }],
          },
        ],
      },
      {
        key: 'risk',
        title: '12.6 Risk',
        fields: [
          {
            id: 'chk.risk',
            label: 'Risk rows',
            type: 'checklist',
            seedItems: [
              { label: 'Stop is at true invalidation + ATR buffer', hard: true },
              { label: 'R:R meets the minimum for this setup type', hard: true },
              { label: 'Size calculated from the formula, not guessed', hard: true },
              { label: 'Open risk within total and correlated limits', hard: true },
              { label: 'Daily and weekly loss limits not hit', hard: true },
              { label: 'Leverage within the ceiling', hard: true },
            ],
          },
        ],
      },
      {
        key: 'score',
        title: '12.7 Score',
        fields: [
          {
            id: 'chk.score',
            label: 'Score rows',
            type: 'checklist',
            seedItems: [
              { label: 'Confluence score recorded, grade assigned' },
              { label: 'Grade meets the minimum to trade', hard: true },
            ],
          },
        ],
      },
      {
        key: 'plan',
        title: '12.8 Plan',
        fields: [
          {
            id: 'chk.plan',
            label: 'Plan rows',
            type: 'checklist',
            seedItems: [
              {
                label: 'Entry, stop, T1, T2 and runner rule written down before entry',
                hard: true,
              },
              { label: 'Not entering out of boredom, revenge, or FOMO', hard: true },
            ],
          },
        ],
      },
    ],
  },

  {
    key: 'journal',
    number: 13,
    title: 'Journal & review',
    governs: 'The numbers that decide if this works',
    subsections: [
      {
        key: 'metrics',
        title: '13.1 Key metrics',
        fields: [
          {
            id: 'jrn.targetExpectancy',
            label: 'Target expectancy',
            type: 'number',
            unit: 'R',
            placeholder: '0.25',
            rulesKey: 'targetExpectancyR',
          },
          {
            id: 'jrn.metrics',
            label: 'Metrics you track',
            type: 'textarea',
            placeholder:
              'e.g. Expectancy in R, win rate by playbook, average R won vs average R lost.',
          },
        ],
      },
      {
        key: 'mistakes',
        title: '13.2 Fixed mistake list',
        intro: 'A fixed list makes patterns countable; free text does not.',
        fields: [
          {
            id: 'jrn.mistakes',
            label: 'Mistake tags',
            type: 'tags',
            suggestions: [
              'None',
              'No trigger',
              'Chased entry',
              'Oversized',
              'Moved stop',
              'Early exit (fear)',
              'Late exit (greed)',
              'Wrong bias',
              'Stale zone',
              'Revenge trade',
              'FOMO',
              'Ignored loss limit',
              'Traded through event',
            ],
          },
        ],
      },
      {
        key: 'review-triggers',
        title: '13.3 Review triggers',
        fields: [
          {
            id: 'jrn.reviewTriggers',
            label: 'Triggers',
            type: 'table',
            columns: ['Every', 'Look at'],
            seedRows: [
              ['10 trades', ''],
              ['30 trades', ''],
              ['50 trades', ''],
            ],
          },
        ],
      },
    ],
  },

  {
    key: 'ramp',
    number: 14,
    title: 'Before you risk real money',
    governs: 'The staged ramp',
    subsections: [
      {
        key: 'stages',
        title: '14.1 Stages',
        fields: [
          {
            id: 'ramp.stages',
            label: 'Ramp',
            type: 'table',
            columns: ['Stage', 'Requirement', 'Size'],
            seedRows: [
              ['Backtest', '', ''],
              ['Forward-test on paper', '', ''],
              ['Live, reduced size', '', ''],
              ['Full size', '', ''],
            ],
          },
        ],
      },
      {
        key: 'promotion',
        title: '14.2 Promotion criteria',
        fields: [
          {
            id: 'ramp.promotion',
            label: 'What must be true to move up a stage',
            type: 'textarea',
            help: 'Adherence matters more than P&L at this stage.',
          },
        ],
      },
    ],
  },

  {
    key: 'versions',
    number: 15,
    title: 'Rule changes',
    governs: 'Version-stamped, always',
    subsections: [
      {
        key: 'changelog',
        title: '15.1 Change log',
        fields: [
          {
            id: 'ver.changelog',
            label: 'Versions',
            type: 'table',
            columns: ['Version', 'Date', 'Change', 'Reason'],
            seedRows: [['1.0', '', 'Initial plan', '—']],
          },
        ],
      },
      {
        key: 'amendment',
        title: '15.2 Amendment rule',
        fields: [
          {
            id: 'ver.amendment',
            label: 'How you’re allowed to change a rule',
            type: 'textarea',
            placeholder:
              'e.g. Change one rule at a time, and only after 30+ trades under the current version.',
          },
        ],
      },
    ],
  },
];

/**
 * How a linked Playbook record maps onto the §9 fields. `source` names the value
 * on the playbook (top level, or inside `criteriaJson`); `fieldSuffix` completes
 * the plan field id as `pb.<letter>.<fieldSuffix>`.
 */
export const PLAYBOOK_PREFILL: {
  source: 'name' | 'thesis' | 'entry' | 'exit' | 'invalidation';
  fieldSuffix: string;
  label: string;
}[] = [
  { source: 'name', fieldSuffix: 'name', label: 'Name' },
  { source: 'thesis', fieldSuffix: 'context', label: 'Context' },
  { source: 'entry', fieldSuffix: 'entry', label: 'Entry' },
  { source: 'exit', fieldSuffix: 'targets', label: 'Targets' },
  { source: 'invalidation', fieldSuffix: 'invalidation', label: 'Invalidation' },
];

/** The §9 slot letters, in order. */
export const PLAYBOOK_SLOTS = ['A', 'B', 'C'] as const;

/** Every field in the template, flattened — useful for lookups and validation. */
export const PLAN_FIELDS: PlanField[] = PLAN_TEMPLATE.flatMap((section) =>
  section.subsections.flatMap((sub) => sub.fields),
);

/** Fields that feed the typed, enforceable rules object. */
export const PLAN_RULE_FIELDS: (PlanField & { rulesKey: keyof PlanRules })[] = PLAN_FIELDS.filter(
  (f): f is PlanField & { rulesKey: keyof PlanRules } => f.rulesKey !== undefined,
);
