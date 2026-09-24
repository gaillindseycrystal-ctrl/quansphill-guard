import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { demoScore } from "@/lib/scoring.functions";
import { generateDemoStream } from "@/lib/demo-stream";
import { INFERENCE_MS, MANUAL_LAG, ghs } from "@/lib/project-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live console · Quansphill Fraud Monitor" },
      {
        name: "description",
        content:
          "A live console that scores Quansphill Ventures mobile money transactions and flags likely fraud in minutes instead of days.",
      },
      { property: "og:title", content: "Live console · Quansphill Fraud Monitor" },
      {
        property: "og:description",
        content:
          "Threshold-tuned fraud scoring for mobile money transactions, with staff review built in.",
      },
    ],
  }),
  component: LiveConsole,
});

type Txn = {
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

type Review = {
  transaction_id: string;
  decision: "fraud" | "legitimate";
};

function scoreTone(score: number, threshold: number) {
  if (score >= threshold) return "bg-destructive";
  if (score >= threshold * 0.7) return "bg-warning";
  return "bg-primary";
}

function LiveConsole() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [threshold, setThreshold] = useState(0.5);
  const [selected, setSelected] = useState<Txn | null>(null);

  const signedIn = !!user;

  // Public visitors never read stored data: the console runs on a demo stream
  // generated in the browser. Stored transactions are staff-only.
  const demoRows = useMemo(() => generateDemoStream(), []);

  const txns = useQuery({
    queryKey: ["transactions"],
    enabled: signedIn,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return (data ?? []) as unknown as Txn[];
    },
  });

  const reviews = useQuery({
    queryKey: ["reviews"],
    enabled: signedIn,
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("transaction_id, decision");
      if (error) throw error;
      return (data ?? []) as unknown as Review[];
    },
  });

  useEffect(() => {
    if (!signedIn) return;
    const channel = supabase
      .channel("live-console")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, signedIn]);

  const rows: Txn[] = signedIn ? (txns.data ?? []) : (demoRows as unknown as Txn[]);
  const reviewMap = useMemo(() => {
    const map = new Map<string, "fraud" | "legitimate">();
    (reviews.data ?? []).forEach((r) => map.set(r.transaction_id, r.decision));
    return map;
  }, [reviews.data]);

  const stats = useMemo(() => {
    const flagged = rows.filter((r) => Number(r.fraud_score) >= threshold);
    const waiting = flagged.filter((r) => !reviewMap.has(r.id));
    const confirmed = rows.filter((r) => reviewMap.get(r.id) === "fraud");
    const flaggedReviewed = flagged.filter((r) => reviewMap.has(r.id));
    const flaggedTrue = flaggedReviewed.filter((r) => reviewMap.get(r.id) === "fraud");
    const caught = confirmed.filter((r) => Number(r.fraud_score) >= threshold);
    return {
      scored: rows.length,
      flagged: flagged.length,
      waiting: waiting.length,
      confirmed: confirmed.length,
      caughtPct: confirmed.length ? (caught.length / confirmed.length) * 100 : null,
      precisionPct: flaggedReviewed.length
        ? (flaggedTrue.length / flaggedReviewed.length) * 100
        : null,
    };
  }, [rows, reviewMap, threshold]);

  async function review(txn: Txn, decision: "fraud" | "legitimate") {
    if (!user) {
      toast.error("Sign in as staff to review transactions.");
      return;
    }
    const { error } = await supabase
      .from("reviews")
      .upsert(
        { transaction_id: txn.id, reviewer_id: user.id, decision },
        { onConflict: "transaction_id" },
      );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(decision === "fraud" ? "Marked as confirmed fraud." : "Marked as legitimate.");
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
  }

  const breakdown = selected
    ? demoScore({
        type: selected.type,
        amount: Number(selected.amount),
        oldBalance: Number(selected.old_balance),
        newBalance: Number(selected.new_balance),
        destOldBalance: Number(selected.dest_old_balance),
        hour: selected.hour,
        consecutive: selected.consecutive,
      }).contributions
    : [];

  return (
    <SiteLayout showProjectFooter>
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Catch mobile money fraud in minutes, not days
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Quansphill Ventures reviews suspicious mobile money activity by hand today, {MANUAL_LAG}{" "}
            after it happens. This console scores each transaction in {INFERENCE_MS} ms and puts the
            risky ones in front of staff straight away.
          </p>
        </div>
        <SimulatedNote>
          {signedIn
            ? "Demo data: the stored stream is generated demo data, not real customer transactions. Scores come from a clearly labelled demo rule unless the Flask + XGBoost service is connected."
            : "Demo data: this public view runs on a stream generated in your browser and reads nothing from the database. Sign in as staff to see stored transactions and record review decisions."}
        </SimulatedNote>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Transactions scored" value={stats.scored.toLocaleString()} />
        <Kpi label="Flagged at this threshold" value={stats.flagged.toLocaleString()} />
        <Kpi label="Waiting for staff review" value={stats.waiting.toLocaleString()} />
        <Kpi label="Confirmed fraud" value={stats.confirmed.toLocaleString()} />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Classification threshold</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Slider
              value={[threshold]}
              min={0.1}
              max={0.9}
              step={0.01}
              onValueChange={([v]) => setThreshold(v ?? 0.5)}
              className="max-w-xl"
            />
            <span className="w-14 text-sm font-medium tabular-nums">{threshold.toFixed(2)}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              Fraud caught at this threshold:{" "}
              <strong>
                {stats.caughtPct === null ? "No confirmed fraud yet" : `${stats.caughtPct.toFixed(1)}%`}
              </strong>
            </p>
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              Flags that were real fraud:{" "}
              <strong>
                {stats.precisionPct === null
                  ? "No reviewed flags yet"
                  : `${stats.precisionPct.toFixed(1)}%`}
              </strong>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Scored transactions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Transaction</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Hour</th>
                <th className="px-4 py-2 font-medium">Fraud score</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const score = Number(t.fraud_score);
                const decision = reviewMap.get(t.id);
                const status = decision
                  ? decision === "fraud"
                    ? "Confirmed fraud"
                    : "Legitimate"
                  : score >= threshold
                    ? "Waiting for review"
                    : "Cleared by score";
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/60"
                  >
                    <td className="px-4 py-2 font-mono text-xs">{t.id.slice(0, 8)}</td>
                    <td className="px-4 py-2">{t.type}</td>
                    <td className="px-4 py-2 tabular-nums">{ghs(Number(t.amount))}</td>
                    <td className="px-4 py-2 tabular-nums">{String(t.hour).padStart(2, "0")}:00</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${scoreTone(score, threshold)}`}
                            style={{ width: `${Math.round(score * 100)}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs">{score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <StatusPill status={status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Transaction {selected.id.slice(0, 8)}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-8">
                <div>
                  <p className="text-sm text-muted-foreground">Fraud score</p>
                  <p className="font-display text-4xl font-semibold">
                    {Number(selected.fraud_score).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Threshold {threshold.toFixed(2)} · model {selected.model_version}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">What raised or lowered the score</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={breakdown} layout="vertical" margin={{ left: 10 }}>
                        <XAxis type="number" fontSize={11} />
                        <YAxis type="category" dataKey="label" width={130} fontSize={11} />
                        <RTooltip />
                        <Bar dataKey="value" radius={4}>
                          {breakdown.map((c) => (
                            <Cell
                              key={c.label}
                              fill={
                                c.value >= 0 ? "var(--color-destructive)" : "var(--color-primary)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Simulated contribution breakdown from the demo rule.
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Detail label="Type" value={selected.type} />
                  <Detail label="Amount" value={ghs(Number(selected.amount))} />
                  <Detail label="Sender balance before" value={ghs(Number(selected.old_balance))} />
                  <Detail label="Sender balance after" value={ghs(Number(selected.new_balance))} />
                  <Detail
                    label="Receiver balance before"
                    value={ghs(Number(selected.dest_old_balance))}
                  />
                  <Detail label="Hour" value={`${String(selected.hour).padStart(2, "0")}:00`} />
                  <Detail label="Consecutive" value={selected.consecutive ? "Yes" : "No"} />
                  <Detail
                    label="Seen at"
                    value={new Date(selected.created_at).toLocaleString("en-GB")}
                  />
                </dl>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => review(selected, "fraud")}
                  >
                    Confirm fraud
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => review(selected, "legitimate")}
                  >
                    Mark legitimate
                  </Button>
                </div>
                {!user && (
                  <p className="text-xs text-muted-foreground">
                    Sign in as staff to record a decision.
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SiteLayout>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Confirmed fraud"
      ? "bg-destructive/15 text-destructive"
      : status === "Waiting for review"
        ? "bg-warning/20 text-warning-foreground"
        : status === "Legitimate"
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
