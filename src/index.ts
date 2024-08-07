import { config } from 'dotenv';
config();

import DiscordManager from "./discord/DiscordManager.js";
import mongoose from "mongoose";
import constants from "./data/constants.json" assert { type: "json" };

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('Token not provided');
    process.exit(1);
}

mongoose.connect(constants.mongo.uri)
    .then(() => console.log('Connected to MongoDB!'))
    .catch(console.error);
const discordManager = new DiscordManager(process.env.TOKEN!);

discordManager.login().then();