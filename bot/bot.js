import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { Low, JSONFile } from "lowdb";

dotenv.config();

const adapter = new JSONFile("database.json");
const db = new Low(adapter);
await db.read();
db.data ||= { guilds: {} };

const bot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

bot.once("ready", () => {
  console.log(`✅ Bot ログイン完了: ${bot.user.tag}`);
});

bot.on("messageCreate", (msg) => {
  if (!msg.guild || msg.author.bot) return;
  const prefix = db.data.guilds[msg.guild.id]?.prefix || "!";
  if (msg.content.startsWith(prefix + "ping")) {
    msg.reply("Pong!");
  }
});

bot.login(process.env.BOT_TOKEN);

export default bot;
export { db };
