import { getSession } from "~/server/better-auth/server";

export default async function Home() {
  // Already redirects if not logged in
  const session = await getSession();

  return (
    <>
      <h1>igloo..</h1>
    </>
  );
}
