import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { addAdmin, getAdminAccess, listAdmins, removeAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Manage administrators · Quansphill Fraud Monitor" },
      {
        name: "description",
        content: "Administrator-only access management for Quansphill Fraud Monitor staff.",
      },
      { property: "og:title", content: "Manage administrators · Quansphill Fraud Monitor" },
      { property: "og:description", content: "Manage administrator access for staff accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function AdminPage() {
  const queryClient = useQueryClient();
  const getAccess = useServerFn(getAdminAccess);
  const getAdmins = useServerFn(listAdmins);
  const grantAdmin = useServerFn(addAdmin);
  const revokeAdmin = useServerFn(removeAdmin);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const access = useQuery({ queryKey: ["admin-access"], queryFn: () => getAccess() });
  const admins = useQuery({
    queryKey: ["admins"],
    queryFn: () => getAdmins(),
    enabled: access.data?.isAdmin === true,
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    try {
      await grantAdmin({ data: { email } });
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Administrator access added.");
    } catch (error) {
      toast.error(messageFrom(error));
    } finally {
      setAdding(false);
    }
  }

  async function remove(userId: string) {
    setRemovingId(userId);
    try {
      await revokeAdmin({ data: { userId } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admins"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-access"] }),
      ]);
      toast.success("Administrator access removed.");
    } catch (error) {
      toast.error(messageFrom(error));
    } finally {
      setRemovingId(null);
    }
  }

  if (access.isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </SiteLayout>
    );
  }

  if (!access.data?.isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl py-8">
          <Card>
            <CardHeader>
              <CardTitle>Administrator access required</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your staff account does not have permission to manage administrators.
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }

  const adminRows = admins.data?.admins ?? [];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Manage administrators</h1>
            <p className="mt-2 text-muted-foreground">
              Administrators can change the fraud threshold and manage administrator access.
            </p>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Add administrator</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="admin-email">Staff email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={adding}>
                <UserPlus />
                {adding ? "Adding…" : "Add admin"}
              </Button>
            </form>
            <p className="mt-3 text-sm text-muted-foreground">
              The email must belong to an existing staff account.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Current administrators</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {admins.isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : admins.isError ? (
              <p className="p-6 text-sm text-destructive">{messageFrom(admins.error)}</p>
            ) : (
              <ul className="divide-y divide-border">
                {adminRows.map((admin) => {
                  const lastAdmin = adminRows.length === 1;
                  return (
                    <li key={admin.userId} className="flex flex-wrap items-center gap-3 px-6 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-all font-medium">{admin.email}</p>
                          {admin.isCurrentUser && <Badge variant="secondary">You</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Admin since {new Date(admin.grantedAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={lastAdmin || removingId === admin.userId}
                            title={lastAdmin ? "The last administrator cannot be removed" : undefined}
                          >
                            <Trash2 /> Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove administrator access?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {admin.email} will remain a staff member but will no longer be able to
                              change the fraud threshold or manage administrators.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(admin.userId)}>
                              Remove access
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}