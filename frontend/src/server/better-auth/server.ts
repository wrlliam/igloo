import { auth } from ".";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "../db";
import { hosts } from "../db/schema";
import { eq } from "drizzle-orm";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export const getHosts = cache(async () => {
  const session = await getSession();
  if (!session || !session.user) return null;
    const rawHosts = await db
      .select()
      .from(hosts)
      .where(eq(hosts.userId, session?.user.id));
  return rawHosts;
});
