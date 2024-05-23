import { config } from 'dotenv';
config();

import DiscordManager from "./discord/DiscordManager.ts";
import DBManager from "./db/DBManager.ts";

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('Token not provided');
    process.exit(1);
}

const dbManager = new DBManager();
const discordManager = new DiscordManager(dbManager, process.env.TOKEN!);

function startConnections() {
    dbManager.connect().then();
    discordManager.login().then();
}

startConnections();