import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in · Quansphill Fraud Monitor" },
      {
        name: "description",
        content:
          "Quansphill Ventures staff sign in to review flagged transactions and open the reports page.",
      },
      { property: "og:title", content: "Staff sign in · Quansphill Fraud Monitor" },
      { property: "og:description", content: "Sign in to review flagged mobile money activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/reports", replace: true });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate({ to: "/reports" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else if (!data.session)
        toast.success("Check your email to confirm the account, then sign in.");
      else navigate({ to: "/reports" });
    }
    setPending(false);
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md py-4 sm:py-8">
        <h1 className="text-4xl font-semibold leading-tight">Staff sign in</h1>
        <p className="mt-3 text-muted-foreground">
          Only signed-in staff can confirm or clear transactions and open the reports page.
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">
              {mode === "signin" ? "Sign in" : "Create a staff account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {mode === "signin"
                ? "New staff member? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
