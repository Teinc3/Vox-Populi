import fs from "fs";
import path from "path";

import { Client, type ClientOptions, Collection } from "discord.js";
import type { CustomCommand } from "../types/types";

class ExtendedClient extends Client {
    commands: Collection<string, CustomCommand>;

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
    }

    public async setupCommands() {
        const commandDir = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.ts'));

        for (const commandFile of commandFiles) {
            const commandPath = path.join(commandDir, commandFile);
            try {
                const command = await import(commandPath);
                if (command?.data && command?.execute) {
                    this.commands.set(command.data.name, command);
                } else {
                    console.log(`[WARNING] The ${commandFile} command is missing a required "data" or "execute" property.`);
                }
            } catch (error) {
                console.error(`[ERROR] Failed to load command at ${commandPath}:`, error);
            }
        }

        console.log(`Loaded ${this.commands.size} commands.`);
    }
}

export default ExtendedClient;