import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SiteLayout } from "@/components/site-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CONSECUTIVE_FEATURE_RANK,
  DATASET,
  INFERENCE_MS,
  MODELS,
  TOP_FEATURES,
} from "@/lib/project-data";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Model results · Quansphill Fraud Monitor" },
      {
        name: "description",
        content:
          "Precision, recall, F1, AUC-ROC and cross-validated F1 for XGBoost, Random Forest and Logistic Regression on 197,842 mobile money records.",
      },
      { property: "og:title", content: "Model results · Quansphill Fraud Monitor" },
      {
        property: "og:description",
        content: "How the three fraud detection models compared, and why accuracy misleads here.",
      },
    ],
  }),
  component: Results,
});

function Results() {
  const chartData = MODELS.map((m) => ({
    model: m.model,
    Precision: m.precision,
    Recall: m.recall,
    F1: m.f1,
  }));

  return (
    <SiteLayout>
      <h1 className="text-3xl font-semibold sm:text-4xl">Results</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Three models were trained on the same cleaned dataset and evaluated on a held-out test set
        of {DATASET.test.toLocaleString()} transactions containing {DATASET.testFraud} fraud cases.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Precision, recall and F1 by model</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="model" fontSize={12} />
              <YAxis domain={[70, 100]} fontSize={12} unit="%" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Precision" fill="var(--color-chart-1)" radius={4} />
              <Bar dataKey="Recall" fill="var(--color-chart-2)" radius={4} />
              <Bar dataKey="F1" fill="var(--color-chart-3)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mt-6 border-warning/50 bg-warning/10">
        <CardContent className="pt-6 text-sm">
          <p className="font-display text-base font-semibold">Why accuracy is misleading here</p>
          <p className="mt-2">
            99.1% of the cleaned records are legitimate ({DATASET.legitimate.toLocaleString()} of{" "}
            {DATASET.cleaned.toLocaleString()}). A model that labels every transaction legitimate
            would score about 99.1% accuracy and catch no fraud at all. Precision, recall, F1 and
            AUC-ROC are the numbers that matter.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Full metric table</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 pr-4 font-medium">Accuracy</th>
                <th className="py-2 pr-4 font-medium">Precision</th>
                <th className="py-2 pr-4 font-medium">Recall</th>
                <th className="py-2 pr-4 font-medium">F1</th>
                <th className="py-2 pr-4 font-medium">AUC-ROC</th>
                <th className="py-2 pr-4 font-medium">Five-fold CV F1</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m) => (
                <tr key={m.model} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium">{m.model}</td>
                  <td className="py-2 pr-4 tabular-nums">{m.accuracy}%</td>
                  <td className="py-2 pr-4 tabular-nums">{m.precision}%</td>
                  <td className="py-2 pr-4 tabular-nums">{m.recall}%</td>
                  <td className="py-2 pr-4 tabular-nums">{m.f1}%</td>
                  <td className="py-2 pr-4 tabular-nums">{m.auc}</td>
                  <td className="py-2 pr-4 tabular-nums">{m.cvF1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature importance by gain</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {TOP_FEATURES.map((f) => (
                <li key={f.rank} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {f.rank}
                  </span>
                  {f.name}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              The consecutive-transaction flag ranked {CONSECUTIVE_FEATURE_RANK} features, so it
              adds little on its own.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Benchmark comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              XGBoost leads on every metric: {MODELS[0]!.f1}% F1 against {MODELS[1]!.f1}% for Random
              Forest and {MODELS[2]!.f1}% for Logistic Regression.
            </p>
            <p>
              The gap is widest on recall ({MODELS[0]!.recall}% versus {MODELS[2]!.recall}%), which
              is the metric that decides how much fraud actually gets caught.
            </p>
            <p>
              Cross-validated F1 of {MODELS[0]!.cvF1} shows the XGBoost result holds across folds
              rather than depending on one lucky split.
            </p>
            <p>
              Inference costs {INFERENCE_MS} ms per transaction, so scoring keeps up with live
              traffic.
            </p>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
