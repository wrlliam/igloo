import { Button } from "~/components/ui/button";
import { getHosts, getSession } from "~/server/better-auth/server";

export default async function Home() {
  // Already redirects if not logged in
  const session = await getSession();
  const hosts = await getHosts();

  return (
    <>
    
      <div className="mt-40 mb-30 flex w-screen items-center justify-center">
        <h1 className="text-lg font-medium">Welcome, {session?.user.name}</h1>
      </div>

      <div className="flex flex-col gap-2 mx-auto max-w-7xl">
        <Button className="w-fit cursor-pointer">Add Host</Button>
        <div className="mt-4 flex flex-1 flex-col gap-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-muted/50 aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
