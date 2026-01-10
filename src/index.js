import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { leadsRouter } from "./routes/leads.js";
import { callsRouter } from "./routes/calls.js";
import { followupsRouter } from "./routes/followups.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.send("Cholo-Paltai CRM API OK"));
app.use("/auth", authRouter);
app.use("/leads", leadsRouter);
app.use("/calls", callsRouter);
app.use("/followups", followupsRouter);
app.use("/dashboard", dashboardRouter);

app.listen(process.env.PORT || 4000, () => {
  console.log(`API listening on ${process.env.PORT || 4000}`);
});
