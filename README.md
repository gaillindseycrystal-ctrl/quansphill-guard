# Quansphill Guard

# Lovable prompt: Quansphill Fraud Monitor




Paste the block below into Lovable as your first message. Then connect Supabase (the green Supabase button in Lovable) and GitHub so the project lives in your repository.




---




Build "Quansphill Fraud Monitor", a web app for the final year project "Design and Implementation of a Mobile Money Fraud Detection System: A Case Study of Quansphill Ventures" (Accra Technical University, HND Computer Science, September 2026). Team: Antwi Dennis (01223445D), Acheampong Desmond (01234405D), Agyei Joseph (01232700D). Supervisor: Dr Charles Saah.




**Stack:** React, TypeScript, Tailwind, shadcn/ui, Recharts, Supabase (auth, Postgres, edge functions).




**Look and feel:** calm, serious, fintech. Light mist-grey background, deep petrol ink text, Ghana-green primary (#0B6B4B), amber for warnings, red for fraud. Headings in Bricolage Grotesque, body in Instrument Sans. Sentence-case labels, no all-caps eyebrows. Full dark mode. Responsive down to 360px.




## Pages




1. **Home / Live console (hero).** Headline: "Catch mobile money fraud in minutes, not days". Four KPI tiles (transactions scored, flagged at this threshold, waiting for staff review, confirmed fraud). A threshold slider (0.10 to 0.90, default 0.50). A live table of scored transactions (ID, type, amount in GHS, hour, fraud score bar, status pill). Clicking a row opens a side panel with the score, a bar chart of what raised or lowered it, the transaction details, and two buttons: "Confirm fraud" and "Mark legitimate". Show live "fraud caught" and "flags that were real fraud" percentages at the current threshold. Subscribe to Supabase realtime so new rows appear without refresh.

2. **Results.** Grouped bar chart of precision, recall and F1 for the three models, plus a table with all five metrics, five-fold CV F1, a feature-importance ranking, benchmark comparison, and a callout explaining why accuracy is misleading when 99.1% of transactions are legitimate.

3. **Data.** Funnel from 200,000 raw records to 197,842 cleaned, the 70/30 split, and SMOTE on the training set only.

4. **System.** Three-tier diagram: MySQL data layer with 5-minute ETL, Flask + XGBoost processing layer (preprocessing, inference, decision, retraining scheduler), and the dashboard.

5. **Score a transaction.** A form (type, amount, sender balance, receiver balance, hour, consecutive flag) that calls the scoring edge function and shows the score with a contribution breakdown.

6. **Findings.** Accordion answering the four research questions, plus limitations and recommendations.

7. **Reports (staff only).** Pick a date range and see flagged counts by day, by type and by hour, with a "Print report" button.

8. **Staff login.** Supabase email auth. Only signed-in staff can confirm or clear transactions and view Reports.




## Real numbers to use (do not change)




| Model | Accuracy | Precision | Recall | F1 | AUC-ROC | CV F1 |

|---|---|---|---|---|---|---|

| XGBoost | 99.91% | 95.7% | 94.8% | 95.2% | 0.984 | 0.951 ± 0.006 |

| Random Forest | 99.87% | 93.8% | 92.1% | 92.9% | 0.971 | 0.934 ± 0.008 |

| Logistic Regression | 99.72% | 85.4% | 83.9% | 84.6% | 0.901 | 0.849 ± 0.012 |




- Records: 200,000 raw, 197,842 after cleaning (196,042 legitimate, 1,800 fraud). Training 138,489 (1,260 fraud), after SMOTE 274,458. Test 59,353 (540 fraud).

- Top features by gain: 1 balance difference, 2 transaction-to-balance ratio, 3 TRANSFER type, 4 destination balance before, 5 hour of transaction. Consecutive flag ranked 9th of 15.

- Inference: 0.31 ms per transaction. Manual detection lag today: 24 to 72 hours.




## Database (Supabase)




- `transactions`: id, created_at, type, amount, old_balance, new_balance, dest_old_balance, hour, consecutive (bool), fraud_score (numeric), model_version.

- `reviews`: id, transaction_id, reviewer_id, decision ('fraud' | 'legitimate'), created_at.

- `settings`: key, value (store the classification threshold, default 0.5).

- Row-level security: anyone signed in as staff can read transactions and write reviews. The public pages read only static content.




## Scoring edge function




Create an edge function `score-transaction` that accepts one transaction, computes the four engineered features (balance difference, transaction-to-balance ratio, hour, consecutive flag), and returns a fraud score between 0 and 1. Make the function call a `MODEL_API_URL` environment variable (the Flask + XGBoost service from the project) when it is set. When it is not set, fall back to a clearly labelled demo rule so the app still works. The UI must show a small note whenever the demo rule is in use.




## Honesty rules




- Label anything simulated as simulated. The live stream on the home page is generated demo data.

- Do not invent metrics. Use only the numbers above.

- Keep the accuracy caveat visible next to the results.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://quansphill-guard.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48ce282c-ad30-4764-8113-1a41b6224119).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
