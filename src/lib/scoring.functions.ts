import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  type: z.string(),
  amount: z.number(),
  oldBalance: z.number(),
  newBalance: z.number(),
  destOldBalance: z.number(),
  hour: z.number().min(0).max(23),
  consecutive: z.boolean(),
});

export type ScoreInput = z.infer<typeof inputSchema>;

export type Contribution = { label: string; value: number };

export type ScoreResult = {
  score: number;
  source: "model" | "demo";
  modelVersion: string;
  contributions: Contribution[];
  features: {
    balanceDifference: number;
    transactionToBalanceRatio: number;
    hour: number;
    consecutive: boolean;
  };
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function demoScore(input: ScoreInput): ScoreResult {
  const balanceDifference = input.oldBalance - input.newBalance - input.amount;
  const ratio = input.amount / Math.max(input.oldBalance, 1);

  const contributions: Contribution[] = [
    {
      label: "Balance difference",
      value: clamp(Math.abs(balanceDifference) / Math.max(input.amount, 1), 0, 1) * 0.3,
    },
    { label: "Transaction-to-balance ratio", value: clamp(ratio, 0, 1) * 0.28 },
    {
      label: "Transaction type",
      value: input.type === "TRANSFER" ? 0.16 : input.type === "CASH_OUT" ? 0.12 : -0.06,
    },
    {
      label: "Destination balance before",
      value: input.destOldBalance === 0 ? 0.12 : -0.04,
    },
    { label: "Hour of transaction", value: input.hour >= 0 && input.hour <= 5 ? 0.11 : -0.05 },
    { label: "Consecutive flag", value: input.consecutive ? 0.05 : -0.02 },
  ];

  const base = 0.08;
  const score = clamp(base + contributions.reduce((sum, c) => sum + c.value, 0));

  return {
    score: Number(score.toFixed(4)),
    source: "demo",
    modelVersion: "demo-rule-v1",
    contributions: contributions.map((c) => ({
      ...c,
      value: Number(c.value.toFixed(4)),
    })),
    features: {
      balanceDifference: Number(balanceDifference.toFixed(2)),
      transactionToBalanceRatio: Number(ratio.toFixed(4)),
      hour: input.hour,
      consecutive: input.consecutive,
    },
  };
}

export const scoreTransaction = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ScoreResult> => {
    const modelApiUrl = process.env["MODEL_API_URL"];
    const fallback = demoScore(data);

    if (!modelApiUrl) return fallback;

    try {
      const response = await fetch(modelApiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          amount: data.amount,
          old_balance: data.oldBalance,
          new_balance: data.newBalance,
          dest_old_balance: data.destOldBalance,
          hour: data.hour,
          consecutive: data.consecutive,
          balance_difference: fallback.features.balanceDifference,
          transaction_to_balance_ratio: fallback.features.transactionToBalanceRatio,
        }),
      });
      if (!response.ok) return fallback;
      const body = (await response.json()) as {
        fraud_score?: number;
        score?: number;
        model_version?: string;
        contributions?: Contribution[];
      };
      const score = body.fraud_score ?? body.score;
      if (typeof score !== "number") return fallback;
      return {
        score: Number(clamp(score).toFixed(4)),
        source: "model",
        modelVersion: body.model_version ?? "flask-xgboost",
        contributions: body.contributions ?? fallback.contributions,
        features: fallback.features,
      };
    } catch {
      return fallback;
    }
  });
