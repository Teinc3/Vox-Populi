import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
config();

const intents = GatewayIntentBits.MessageContent | GatewayIntentBits.GuildMembers;
const client = new Client({ intents });

client.on('ready', () => {
    if (!client.user) return;
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);