import { type ClientOptions, type CommandInteraction } from "discord.js";

declare interface IPoliticalSystem {
    id: number;
}

declare interface CustomCommand extends ClientOptions {
    execute: (interaction: CommandInteraction) => Promise<void>;
}