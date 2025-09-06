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
  private botToken?: string;

  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
  }

  public setToken(token: string) {
    this.botToken = token;
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

    console.log(`Loaded ${this.commands.size} commands.`);

    // Deploy commands to Discord
    if (this.botToken) {
      await this.deployCommands(commandsArray);
    } else {
      console.warn('[WARNING] No token provided, skipping command deployment to Discord.');
    }
  }

  private async deployCommands(commands: string[]) {
    if (!this.botToken) {
      console.error('[ERROR] Cannot deploy commands: no token provided');
      return;
    }

    const clientID: string = settings.discord.clientID;
    const rest = new REST().setToken(this.botToken);

    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      await rest.put(
        Routes.applicationCommands(clientID),
        { body: commands }
      );

      console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
      console.error('[ERROR] Failed to reload application (/) commands:', error);
    }
  }
}

export default ExtendedClient;