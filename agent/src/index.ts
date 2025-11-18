import { Elysia } from "elysia";

const app = new Elysia();
app.get("/", () => "Hello World");
app.listen({
  hostname: "0.0.0.0",
  port: 5127,
});
