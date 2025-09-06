import {
  fileURLToPath,
  pathToFileURL
} from 'url';
import path, { dirname } from "path";
import fs from "fs";
import {
  Client, Collection, REST, Routes,
  type ClientOptions, type ChatInputCommandInteraction
} from "discord.js";

import settings from "../data/settings.json" with { type: 'json' };


interface CustomCommand extends ClientOptions {
  execute: <T>(interaction: ChatInputCommandInteraction) => Promise<T>;
}

class ExtendedClient extends Client {
  commands: Collection<string, CustomCommand>;

  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
  }

  public async setupCommands() {
    const commandDir = path.join(dirname(fileURLToPath(import.meta.url)), 'commands');
    const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.ts'));
    const commandsArray: string[] = [];

    for (const commandFile of commandFiles) {
      const commandPath = path.join(commandDir, commandFile);
      try {
        const command = await import(pathToFileURL(commandPath).toString());
        if (command?.data && command?.execute) {
          this.commands.set(command.data.name, command);
          commandsArray.push(command.data.toJSON());
        } else {
          console.log(`[WARNING] The ${commandFile} command is missing `
            + ` a required "data" or "execute" property.`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed to load command at ${commandPath}:`, error);
      }
    }

    console.log(`Loaded ${this.commands.size} commands on the bot.`);

    // Deploy commands to Discord
    if (this.token) {
      await this.deployCommands(commandsArray);
    } else {
      console.warn('[WARNING] No token provided, skipping command deployment to Discord.');
    }
  }

  private async deployCommands(commands: string[]) {
    if (!this.token) {
      console.error('[ERROR] Cannot deploy commands: no token provided');
      return;
    }

    const clientID: string = settings.discord.clientID;
    const rest = new REST().setToken(this.token);

    try {
      await rest.put(
        Routes.applicationCommands(clientID),
        { body: commands }
      );

      console.log(`Successfully pushed ${commands.length} application (/) commands to discord.`);
    } catch (error) {
      console.error('[ERROR] Failed to push application (/) commands to discord:', error);
    }
  }
}

export default ExtendedClient;