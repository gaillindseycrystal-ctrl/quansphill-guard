// Real figures from the Quansphill Ventures study. Do not alter these values.

export const PROJECT = {
  title: "Quansphill Fraud Monitor",
  study:
    "Design and Implementation of a Mobile Money Fraud Detection System: A Case Study of Quansphill Ventures",
  institution: "Accra Technical University",
  programme: "HND Computer Science",
  date: "September 2026",
  supervisor: "Dr Charles Saah",
  team: [
    { name: "Antwi Dennis", id: "01223445D" },
    { name: "Acheampong Desmond", id: "01234405D" },
    { name: "Agyei Joseph", id: "01232700D" },
  ],
};

export type ModelRow = {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  cvF1: string;
};

export const MODELS: ModelRow[] = [
  {
    model: "XGBoost",
    accuracy: 99.91,
    precision: 95.7,
    recall: 94.8,
    f1: 95.2,
    auc: 0.984,
    cvF1: "0.951 ± 0.006",
  },
  {
    model: "Random Forest",
    accuracy: 99.87,
    precision: 93.8,
    recall: 92.1,
    f1: 92.9,
    auc: 0.971,
    cvF1: "0.934 ± 0.008",
  },
  {
    model: "Logistic Regression",
    accuracy: 99.72,
    precision: 85.4,
    recall: 83.9,
    f1: 84.6,
    auc: 0.901,
    cvF1: "0.849 ± 0.012",
  },
];

export const DATASET = {
  raw: 200000,
  cleaned: 197842,
  legitimate: 196042,
  fraud: 1800,
  train: 138489,
  trainFraud: 1260,
  afterSmote: 274458,
  test: 59353,
  testFraud: 540,
};

export const TOP_FEATURES = [
  { rank: 1, name: "Balance difference" },
  { rank: 2, name: "Transaction-to-balance ratio" },
  { rank: 3, name: "TRANSFER type" },
  { rank: 4, name: "Destination balance before" },
  { rank: 5, name: "Hour of transaction" },
];

export const CONSECUTIVE_FEATURE_RANK = "9th of 15";
export const INFERENCE_MS = 0.31;
export const MANUAL_LAG = "24 to 72 hours";

export const TRANSACTION_TYPES = [
  "TRANSFER",
  "CASH_OUT",
  "PAYMENT",
  "CASH_IN",
  "DEBIT",
] as const;

export const ghs = (value: number) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(value);
