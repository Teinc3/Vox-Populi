import { type ClientOptions, type CommandInteraction } from "discord.js";
import type DBManager from "../db/DBManager";

declare interface CustomCommand extends ClientOptions {
    execute: <T>(interaction: CommandInteraction, dbManager?: DBManager) => Promise<T>;
}

enum PoliticalSystemsType {
    Presidential = 0,
    Parliamentary = 1,
    DirectDemocracy = 2
}

enum PoliticalPermissionsType {
    Legislative = 0,
    Executive = 1,
    Judicial = 2
}