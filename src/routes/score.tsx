import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { SimulatedNote } from "@/components/simulated-note";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scoreTransaction, type ScoreResult } from "@/lib/scoring.functions";
import { TRANSACTION_TYPES } from "@/lib/project-data";

export const Route = createFileRoute("/score")({
  head: () => ({
    meta: [
      { title: "Score a transaction · Quansphill Fraud Monitor" },
      {
        name: "description",
        content:
          "Enter a mobile money transaction and see its fraud score with a breakdown of what raised or lowered it.",
      },
      { property: "og:title", content: "Score a transaction · Quansphill Fraud Monitor" },
      {
        property: "og:description",
        content: "Try the scoring service on a single transaction.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScorePage,
});

function ScorePage() {
  const score = useServerFn(scoreTransaction);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [form, setForm] = useState({
    type: "TRANSFER",
    amount: "4500",
    oldBalance: "4800",
    newBalance: "0",
    destOldBalance: "0",
    hour: "2",
    consecutive: false,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await score({
        data: {
          type: form.type,
          amount: Number(form.amount),
          oldBalance: Number(form.oldBalance),
          newBalance: Number(form.newBalance),
          destOldBalance: Number(form.destOldBalance),
          hour: Number(form.hour),
          consecutive: form.consecutive,
        },
      });
      setResult(res);
    } catch {
      toast.error("Could not score that transaction. Check the values and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <SiteLayout>
      <h1 className="text-3xl font-semibold sm:text-4xl">Score a transaction</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Enter the details of a single transaction to see the fraud score and what drove it.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Amount (GHS)"
                  value={form.amount}
                  onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
                />
                <Field
                  label="Hour of day (0 to 23)"
                  value={form.hour}
                  onChange={(v) => setForm((f) => ({ ...f, hour: v }))}
                />
                <Field
                  label="Sender balance before"
                  value={form.oldBalance}
                  onChange={(v) => setForm((f) => ({ ...f, oldBalance: v }))}
                />
                <Field
                  label="Sender balance after"
                  value={form.newBalance}
                  onChange={(v) => setForm((f) => ({ ...f, newBalance: v }))}
                />
                <Field
                  label="Receiver balance before"
                  value={form.destOldBalance}
                  onChange={(v) => setForm((f) => ({ ...f, destOldBalance: v }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label htmlFor="consecutive">Consecutive transaction flag</Label>
                <Switch
                  id="consecutive"
                  checked={form.consecutive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, consecutive: v }))}
                />
              </div>

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Scoring…" : "Score this transaction"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result && (
              <p className="text-sm text-muted-foreground">
                Submit the form to see a score between 0 and 1.
              </p>
            )}
            {result && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Fraud score</p>
                  <p className="font-display text-5xl font-semibold tabular-nums">
                    {result.score.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Model: {result.modelVersion}</p>
                </div>

                {result.source === "demo" && (
                  <SimulatedNote>
                    Scored by the built-in demo rule, not the trained XGBoost model. Set the model
                    service address to score with the real model.
                  </SimulatedNote>
                )}

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.contributions} layout="vertical" margin={{ left: 10 }}>
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey="label" width={140} fontSize={11} />
                      <RTooltip />
                      <Bar dataKey="value" radius={4}>
                        {result.contributions.map((c) => (
                          <Cell
                            key={c.label}
                            fill={c.value >= 0 ? "var(--color-destructive)" : "var(--color-primary)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Balance difference</dt>
                    <dd className="font-medium tabular-nums">
                      {result.features.balanceDifference}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Transaction-to-balance ratio</dt>
                    <dd className="font-medium tabular-nums">
                      {result.features.transactionToBalanceRatio}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
