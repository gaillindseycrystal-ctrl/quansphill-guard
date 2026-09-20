import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { PROJECT } from "@/lib/project-data";

const NAV = [
  { to: "/", label: "Live console" },
  { to: "/results", label: "Results" },
  { to: "/data", label: "Data" },
  { to: "/system", label: "System" },
  { to: "/score", label: "Score a transaction" },
  { to: "/findings", label: "Findings" },
  { to: "/reports", label: "Reports" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold">Quansphill Fraud Monitor</span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {user ? (
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign out
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Staff sign in</Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>

      <footer className="no-print mt-12 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <p className="font-medium text-foreground">{PROJECT.study}</p>
          <p className="mt-1">
            {PROJECT.institution} · {PROJECT.programme} · {PROJECT.date} · Supervisor:{" "}
            {PROJECT.supervisor}
          </p>
          <p className="mt-1">
            {PROJECT.team.map((m) => `${m.name} (${m.id})`).join(" · ")}
          </p>
        </div>
      </footer>
    </div>
  );
}
