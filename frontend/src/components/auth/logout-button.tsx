"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { logoutAction } from "./logout-action";

import { Button } from "~/components/ui/button";

export function LogoutButton({
  redirectTo = "/",
  children = "Sign out",
  className,
}: {
  redirectTo?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={async () => {
        startTransition(async () => {
          await logoutAction(redirectTo);
        });
      }}
      className={className}
    >
      <Button variant="ghost" type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing out...
          </>
        ) : (
          children
        )}
      </Button>
    </form>
  );
}
