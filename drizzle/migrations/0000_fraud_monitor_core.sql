
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  amount numeric NOT NULL,
  old_balance numeric NOT NULL DEFAULT 0,
  new_balance numeric NOT NULL DEFAULT 0,
  dest_old_balance numeric NOT NULL DEFAULT 0,
  hour int NOT NULL DEFAULT 0,
  consecutive boolean NOT NULL DEFAULT false,
  fraud_score numeric NOT NULL DEFAULT 0,
  model_version text NOT NULL DEFAULT 'xgboost-v1.0-demo'
);

GRANT SELECT ON public.transactions TO anon;
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read simulated transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Staff can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('fraud','legitimate')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_id)
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read review outcomes" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Staff can record reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Staff can update their reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = reviewer_id);
CREATE POLICY "Staff can delete their reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = reviewer_id);

CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Staff can change settings" ON public.settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.settings (key, value) VALUES ('classification_threshold', '0.5');

ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

INSERT INTO public.transactions (created_at, type, amount, old_balance, new_balance, dest_old_balance, hour, consecutive, fraud_score)
SELECT
  now() - (g || ' minutes')::interval,
  (ARRAY['TRANSFER','CASH_OUT','PAYMENT','CASH_IN','DEBIT'])[1 + floor(random()*5)::int],
  round((random()*9000 + 50)::numeric, 2),
  round((random()*20000)::numeric, 2),
  round((random()*20000)::numeric, 2),
  round((random()*15000)::numeric, 2),
  floor(random()*24)::int,
  random() < 0.15,
  CASE WHEN random() < 0.12 THEN round((0.55 + random()*0.44)::numeric, 4)
       ELSE round((random()*0.45)::numeric, 4) END
FROM generate_series(1, 140) g;
