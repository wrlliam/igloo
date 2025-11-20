import AddHostDialog from "~/components/add-host-dialog";
import { getHosts, getSession } from "~/server/better-auth/server";

export default async function Home() {
  const session = await getSession();
  const hosts = await getHosts();

  return (
    <>
      <div className="mt-40 mb-30 flex w-screen items-center justify-center">
        <h1 className="text-lg font-medium">Welcome, {session?.user.name}</h1>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-2">
        <AddHostDialog />

        <div className="mt-4 flex flex-1 flex-col gap-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {hosts && hosts.length > 0 ? (
              <>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted/50 aspect-square rounded-xl"
                  />
                ))}
              </>
            ) : (
              <p className="text-sm opacity-30">
                Unable to find any hosts, please add a host first.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
