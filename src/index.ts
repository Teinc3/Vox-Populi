import mongoose from "mongoose";
import { config } from 'dotenv';

import DiscordManager from "./discord/DiscordManager.js";
import settings from "./data/settings.json" with { type: "json" };


config();

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Token not provided');
  process.exit(1);
}

mongoose.connect(settings.mongo.uri)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(console.error);
const discordManager = new DiscordManager(process.env.TOKEN!);

discordManager.login().then();