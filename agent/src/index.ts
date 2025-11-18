import { Elysia } from "elysia";
import { z } from "zod";
import { runCommand } from "./utils";

const evalSchema = z.object({
  command: z.string(),
});

const app = new Elysia();
app
  .get("/", () => ({
    cookies: "with",
    milk: true,
  }))
  .post("/", async ({ body }) => {
    try {
      const { command } = evalSchema.parse(body);
      const result = await runCommand(command);

      if (result.ok) {
        return new Response(
          JSON.stringify({
            ok: true,
            message: "Successfully ran command.",
            out: result.stdout,
          }),
          {
            status: 500,
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            ok: false,
            message: "This command failed to run.",
            out: result.stdout,
          }),
          {
            status: 200, // Not internal error but user error.
          }
        );
      }
    } catch (e) {
      console.log(e)
      return new Response(
        JSON.stringify({
          ok: false,
          message:
            "Failed to eval command. Please try again later - if this issue continues please create an issue on our github.",
        }),
        {
          status: 500,
        }
      );
    }
  });

app.listen({
  hostname: "0.0.0.0",
  port: 5172,
});
