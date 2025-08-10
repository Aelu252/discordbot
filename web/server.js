import express from "express";
import session from "express-session";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bot, { db } from "../bot/bot.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));
app.use(express.static(join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/", (req, res) => {
  res.render("index", { user: req.session.user });
});

app.get("/login", (req, res) => {
  const redirect = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(
    process.env.REDIRECT_URI
  )}&response_type=code&scope=identify%20guilds`;
  res.redirect(redirect);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/");

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI,
    }),
  });
  const tokenData = await tokenRes.json();

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();

  const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const guildData = await guildRes.json();

  req.session.user = { ...userData, guilds: guildData };
  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  res.render("dashboard", { user: req.session.user, guilds: req.session.user.guilds });
});

app.post("/dashboard/:guildID", async (req, res) => {
  const { prefix } = req.body;
  const guildID = req.params.guildID;
  db.data.guilds[guildID] = { prefix };
  await db.write();
  res.redirect("/dashboard");
});

app.listen(PORT, () => console.log(`🌐 Webサイト起動: http://localhost:${PORT}`));
