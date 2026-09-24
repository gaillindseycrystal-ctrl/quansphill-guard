import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CONSECUTIVE_FEATURE_RANK,
  DATASET,
  INFERENCE_MS,
  MANUAL_LAG,
  MODELS,
  TOP_FEATURES,
} from "@/lib/project-data";

export const Route = createFileRoute("/findings")({
  head: () => ({
    meta: [
      { title: "Findings · Quansphill Fraud Monitor" },
      {
        name: "description",
        content:
          "Answers to the four research questions on model choice, useful features, detection speed and practical limitations.",
      },
      { property: "og:title", content: "Findings · Quansphill Fraud Monitor" },
      {
        property: "og:description",
        content: "What the study concluded about detecting mobile money fraud at Quansphill.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Findings,
});

const QUESTIONS = [
  {
    q: "Which model detects mobile money fraud most reliably?",
    a: `XGBoost. It reached ${MODELS[0]!.f1}% F1, ${MODELS[0]!.precision}% precision and ${MODELS[0]!.recall}% recall with an AUC-ROC of ${MODELS[0]!.auc}, ahead of Random Forest (${MODELS[1]!.f1}% F1) and Logistic Regression (${MODELS[2]!.f1}% F1). Five-fold cross-validated F1 of ${MODELS[0]!.cvF1} shows the result is stable across folds.`,
  },
  {
    q: "Which transaction features carry the signal?",
    a: `By gain, the ranking is: ${TOP_FEATURES.map((f) => `${f.rank}. ${f.name}`).join(", ")}. Balance movement dominates: fraudulent transfers tend to empty an account and land on a destination with no prior balance. The consecutive-transaction flag ranked ${CONSECUTIVE_FEATURE_RANK} features, so it is weak on its own.`,
  },
  {
    q: "Can detection be fast enough to act on?",
    a: `Yes. Inference takes ${INFERENCE_MS} ms per transaction, and the ETL cycle runs every five minutes, so a suspicious transaction can be in front of staff within minutes. Manual review at Quansphill currently lags ${MANUAL_LAG} behind the event.`,
  },
  {
    q: "How should class imbalance be handled?",
    a: `Fraud is ${((DATASET.fraud / DATASET.cleaned) * 100).toFixed(2)}% of the cleaned data, so accuracy is not informative. SMOTE was applied to the training set only, taking it from ${DATASET.train.toLocaleString()} to ${DATASET.afterSmote.toLocaleString()} rows, while the test set kept its natural imbalance with ${DATASET.testFraud} fraud cases. Evaluation used precision, recall, F1 and AUC-ROC.`,
  },
];

const LIMITATIONS = [
  "The dataset covers one operator's records over a limited period and may not generalise to other providers.",
  "Labels come from confirmed cases, so fraud that was never detected is counted as legitimate.",
  "Fraud tactics shift, so a model trained today degrades without scheduled retraining.",
  "The demo stream in this dashboard is generated data, not live Quansphill traffic.",
];

const RECOMMENDATIONS = [
  "Deploy XGBoost behind the Flask service and keep the five-minute ETL cycle.",
  "Tune the classification threshold to the review capacity the team actually has, rather than fixing it at 0.50.",
  "Feed every staff decision back into the training set and retrain on a schedule.",
  "Log flagged cases and outcomes so precision and recall can be tracked in production, not only at evaluation time.",
];

function Findings() {
  return (
    <SiteLayout>
      <h1 className="text-3xl font-semibold sm:text-4xl">Findings</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        The four research questions, answered from the evaluation results.
      </p>

      <Accordion type="single" collapsible className="mt-6">
        {QUESTIONS.map((item, i) => (
          <AccordionItem key={item.q} value={`q${i}`}>
            <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Limitations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {LIMITATIONS.map((l) => (
                <li key={l} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  {l}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {RECOMMENDATIONS.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
