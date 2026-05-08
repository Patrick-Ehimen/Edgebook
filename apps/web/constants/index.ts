export const FEATURES = [
  {
    icon: "⚡",
    title: "Auto-sync CEX perps",
    body: "Read-only API with one-click setup. Fills are grouped into positions, funding fees attributed correctly.",
  },
  {
    icon: "🧠",
    title: "Real-time tilt detector",
    body: "Catches revenge trades, oversize entries, and rule breaks the moment they happen. Optional auto-pause.",
  },
  {
    icon: "📈",
    title: "Edge decay watch",
    body: "Per-playbook rolling profit factor and expectancy. We tell you when a setup has stopped working.",
  },
  {
    icon: "🤖",
    title: "AI weekly review",
    body: "Every Sunday: top wins, biggest misses, behavioral patterns, and one specific change to try.",
  },
  {
    icon: "🔒",
    title: "Read-only · KMS encrypted",
    body: "We test for withdrawal scope and refuse keys that have any. Secrets never touch logs.",
  },
  {
    icon: "📦",
    title: "No lock-in",
    body: "Trades CSV, tax-ready CSV, full SQLite dump — export whenever. Your data stays yours.",
  },
];

export const STEPS = [
  {
    n: "1",
    title: "Connect or upload",
    body: "Read-only API to your exchange, or universal CSV importer. We backfill the last 90 days automatically.",
  },
  {
    n: "2",
    title: "Set your guardrails",
    body: "Pick a rule preset or roll your own. Tilt detector arms in real-time the moment you fire your first trade.",
  },
  {
    n: "3",
    title: "Trade, journal, review",
    body: "We log every fill, score every checklist, and email a weekly AI review of what to keep doing — and what to stop.",
  },
];

export const PRICES = [
  {
    name: "Free",
    price: "$0",
    note: "forever",
    cta: "Create account",
    items: [
      "1 exchange account",
      "30 days of history",
      "Manual + CSV import",
      "Core analytics",
      "Daily journal",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    note: "/ month",
    cta: "Start 14-day trial",
    items: [
      "Unlimited accounts",
      "Full history backfill",
      "AI weekly review",
      "Tilt detector + auto-pause",
      "Edge decay watch",
      "Tax-ready CSV (FIFO/LIFO/HIFO)",
    ],
    highlight: true,
  },
  {
    name: "Team",
    price: "$79",
    note: "/ seat / month",
    cta: "Talk to sales",
    items: [
      "Everything in Pro",
      "Mentor mode",
      "Shared playbooks",
      "SSO + audit log",
      "99.9% SLA",
    ],
    highlight: false,
  },
];
