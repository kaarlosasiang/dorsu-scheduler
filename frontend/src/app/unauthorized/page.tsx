import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-slate-200/80">
        <CardHeader className="items-center text-center">
          <div className="mb-2 rounded-full bg-destructive/10 p-3 text-destructive">
            <ShieldAlert className="size-7" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            Your account does not have permission to open this page. Sign in with an authorized account or return to your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
