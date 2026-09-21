// Browser-side demo stream. The public live console shows generated demo data
// only — nothing is read from the database unless a staff member is signed in.
import { demoScore } from "@/lib/scoring.functions";

export type DemoTxn = {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  old_balance: number;
  new_balance: number;
  dest_old_balance: number;
  hour: number;
  consecutive: boolean;
  fraud_score: number;
  model_version: string;
};

const TYPES = ["TRANSFER", "CASH_OUT", "PAYMENT", "CASH_IN", "DEBIT"];

// Small deterministic generator so the public demo is stable within a session.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hex(rand: () => number, len: number) {
  let out = "";
  for (let i = 0; i < len; i += 1) out += Math.floor(rand() * 16).toString(16);
  return out;
}

export function generateDemoStream(count = 140, seed = 20260921): DemoTxn[] {
  const rand = mulberry32(seed);
  const now = Date.now();
  const rows: DemoTxn[] = [];

  for (let i = 0; i < count; i += 1) {
    const type = TYPES[Math.floor(rand() * TYPES.length)] ?? "TRANSFER";
    const risky = rand() < 0.12;
    const oldBalance = Math.round((rand() * 9000 + 200) * 100) / 100;
    const amount = risky
      ? oldBalance
      : Math.round(Math.min(oldBalance, rand() * 2500 + 20) * 100) / 100;
    const newBalance = Math.max(0, Math.round((oldBalance - amount) * 100) / 100);
    const destOldBalance = risky ? 0 : Math.round(rand() * 5000 * 100) / 100;
    const hour = risky ? Math.floor(rand() * 5) : Math.floor(rand() * 24);
    const consecutive = risky ? rand() < 0.7 : rand() < 0.1;

    const score = demoScore({
      type: risky ? "TRANSFER" : type,
      amount,
      oldBalance,
      newBalance,
      destOldBalance,
      hour,
      consecutive,
    }).score;

    rows.push({
      id: `${hex(rand, 8)}-${hex(rand, 4)}-4${hex(rand, 3)}-a${hex(rand, 3)}-${hex(rand, 12)}`,
      created_at: new Date(now - i * 5 * 60 * 1000).toISOString(),
      type: risky ? "TRANSFER" : type,
      amount,
      old_balance: oldBalance,
      new_balance: newBalance,
      dest_old_balance: destOldBalance,
      hour,
      consecutive,
      fraud_score: score,
      model_version: "demo-rule-browser",
    });
  }

  return rows;
}
