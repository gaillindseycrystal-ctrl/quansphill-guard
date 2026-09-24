import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DATASET } from "@/lib/project-data";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Data preparation · Quansphill Fraud Monitor" },
      {
        name: "description",
        content:
          "From 200,000 raw mobile money records to 197,842 cleaned rows, a 70/30 split and SMOTE applied to the training set only.",
      },
      { property: "og:title", content: "Data preparation · Quansphill Fraud Monitor" },
      {
        property: "og:description",
        content: "Cleaning, splitting and balancing the Quansphill transaction dataset.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataPage,
});

function Stage({
  title,
  value,
  detail,
  width,
}: {
  title: string;
  value: string;
  detail: string;
  width: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{title}</p>
        <p className="tabular-nums text-sm text-muted-foreground">{value}</p>
      </div>
      <div className="mt-1 h-8 w-full overflow-hidden rounded-lg bg-muted">
        <div className="h-full rounded-lg bg-primary" style={{ width }} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function DataPage() {
  return (
    <SiteLayout>
      <h1 className="text-3xl font-semibold sm:text-4xl">Data</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        How the Quansphill transaction records were cleaned, split and balanced before training.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">From raw records to a training set</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Stage
            title="Raw records"
            value={DATASET.raw.toLocaleString()}
            detail="Exported from the MySQL transaction store."
            width="100%"
          />
          <Stage
            title="After cleaning"
            value={DATASET.cleaned.toLocaleString()}
            detail={`${DATASET.legitimate.toLocaleString()} legitimate and ${DATASET.fraud.toLocaleString()} fraud, so 2,158 rows were removed as duplicates or incomplete.`}
            width="98.9%"
          />
          <Stage
            title="Training set (70%)"
            value={DATASET.train.toLocaleString()}
            detail={`${DATASET.trainFraud.toLocaleString()} fraud cases before balancing.`}
            width="70%"
          />
          <Stage
            title="Training set after SMOTE"
            value={DATASET.afterSmote.toLocaleString()}
            detail="Synthetic minority oversampling applied to the training set only, never to the test set."
            width="100%"
          />
          <Stage
            title="Test set (30%)"
            value={DATASET.test.toLocaleString()}
            detail={`${DATASET.testFraud} fraud cases, left untouched and imbalanced so the evaluation stays honest.`}
            width="30%"
          />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Class balance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Fraud makes up {((DATASET.fraud / DATASET.cleaned) * 100).toFixed(2)}% of the cleaned
              dataset. That imbalance is the whole difficulty of the problem: the rare class is the
              one that matters.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why SMOTE on training only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Oversampling the test set would leak synthetic fraud into evaluation and inflate every
              score. Keeping the test set at its natural {DATASET.testFraud} fraud cases means the
              reported precision and recall reflect real conditions.
            </p>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
