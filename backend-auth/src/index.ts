import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { ensureSchema } from "./db.js";
import { authRouter } from "./routes/auth.js";

const app = express();

app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",") }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

// Centralized error handler — keeps stack traces out of responses.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

async function main() {
  await ensureSchema();
  app.listen(config.port, () => {
    console.log(`backend-auth listening on :${config.port} (db: ${config.db.database})`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
