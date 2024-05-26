import { type ClientOptions, type CommandInteraction } from "discord.js";

import type DBManager from "../db/DBManager";

declare interface CustomCommand extends ClientOptions {
    execute: <T>(interaction: CommandInteraction, dbManager?: DBManager) => Promise<T>;
}