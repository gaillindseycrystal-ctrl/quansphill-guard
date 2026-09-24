import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Printer } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { SimulatedNote } from "@/components/simulated-note";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Quansphill Fraud Monitor" },
      {
        name: "description",
        content:
          "Staff-only reporting on flagged mobile money transactions by day, by type and by hour, with a printable summary.",
      },
      { property: "og:title", content: "Reports · Quansphill Fraud Monitor" },
      { property: "og:description", content: "Flagged activity summarised for a chosen date range." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reports,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);

function Reports() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const [from, setFrom] = useState(iso(weekAgo));
  const [to, setTo] = useState(iso(today));
  const [threshold] = useState(0.5);

  const { data } = useQuery({
    queryKey: ["report", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("created_at, type, hour, amount, fraud_score")
        .gte("created_at", `${from}T00:00:00Z`)
        .lte("created_at", `${to}T23:59:59Z`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(
    () => (data ?? []).filter((r) => Number(r.fraud_score) >= threshold),
    [data, threshold],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const key = String(r.created_at).slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()].map(([day, flagged]) => ({ day, flagged }));
  }, [rows]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.type, (map.get(r.type) ?? 0) + 1));
    return [...map.entries()].map(([type, flagged]) => ({ type, flagged }));
  }, [rows]);

  const byHour = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({
      hour: String(h).padStart(2, "0"),
      flagged: 0,
    }));
    rows.forEach((r) => {
      const b = buckets[Number(r.hour)];
      if (b) b.flagged += 1;
    });
    return buckets;
  }, [rows]);

  return (
    <SiteLayout>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Reports</h1>
          <p className="mt-2 text-muted-foreground">
            Flagged transactions at a score of {threshold.toFixed(2)} or above.
          </p>
        </div>
        <Button className="no-print" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print report
        </Button>
      </div>

      <div className="mt-4">
        <SimulatedNote>
          These figures summarise the simulated demo stream, not real Quansphill transactions.
        </SimulatedNote>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Date range</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground">
            {rows.length.toLocaleString()} flagged transactions in range
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6">
        <ReportChart title="Flagged by day" data={byDay} xKey="day" />
        <div className="grid gap-6 lg:grid-cols-2">
          <ReportChart title="Flagged by transaction type" data={byType} xKey="type" />
          <ReportChart title="Flagged by hour of day" data={byHour} xKey="hour" />
        </div>
      </div>
    </SiteLayout>
  );
}

function ReportChart({
  title,
  data,
  xKey,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="flagged" fill="var(--color-chart-1)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
