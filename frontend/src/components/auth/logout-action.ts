"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction(redirectTo: string = "/") {
  const cookieStore = await cookies(); 

  cookieStore.set("better-auth.session_token", "", {
    maxAge: 0,
    path: "/",
  });

  redirect(redirectTo);
}
