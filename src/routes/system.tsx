import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Database, Cpu, MonitorSmartphone } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INFERENCE_MS } from "@/lib/project-data";

export const Route = createFileRoute("/system")({
  head: () => ({
    meta: [
      { title: "System design · Quansphill Fraud Monitor" },
      {
        name: "description",
        content:
          "Three-tier design: a MySQL data layer with five-minute ETL, a Flask and XGBoost processing layer, and the staff dashboard.",
      },
      { property: "og:title", content: "System design · Quansphill Fraud Monitor" },
      {
        property: "og:description",
        content: "How data moves from the transaction store to scored alerts on screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SystemPage,
});

const TIERS = [
  {
    icon: Database,
    title: "Data layer",
    subtitle: "MySQL transaction store",
    points: [
      "Holds raw mobile money transactions as they are recorded.",
      "An ETL job runs every five minutes and pushes new rows forward.",
      "Cleaning and de-duplication happen here before anything is scored.",
    ],
  },
  {
    icon: Cpu,
    title: "Processing layer",
    subtitle: "Flask service with XGBoost",
    points: [
      "Preprocessing builds the engineered features, including balance difference and transaction-to-balance ratio.",
      `Inference scores each transaction in ${INFERENCE_MS} ms.`,
      "The decision step applies the current threshold and marks a transaction for review.",
      "A retraining scheduler refreshes the model as confirmed cases accumulate.",
    ],
  },
  {
    icon: MonitorSmartphone,
    title: "Presentation layer",
    subtitle: "Staff dashboard",
    points: [
      "Live console with KPI tiles, a threshold slider and a scored transaction table.",
      "Staff confirm fraud or clear a transaction, and the decision is stored.",
      "Reports summarise flagged activity by day, type and hour.",
    ],
  },
];

function SystemPage() {
  return (
    <SiteLayout>
      <h1 className="text-3xl font-semibold sm:text-4xl">System</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        The detection system is built in three tiers so the transaction store, the model and the
        staff interface can each change without disturbing the others.
      </p>

      <div className="mt-8 space-y-2">
        {TIERS.map((tier, index) => (
          <div key={tier.title}>
            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <tier.icon className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-base">{tier.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {tier.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            {index < TIERS.length - 1 && (
              <div className="flex justify-center py-2 text-muted-foreground">
                <ArrowDown className="h-5 w-5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </SiteLayout>
  );
}
