import { fileURLToPath, pathToFileURL } from 'url';
import path, { dirname } from "path";
import fs from "fs";
import { Client, Collection, type ClientOptions, type ChatInputCommandInteraction } from "discord.js";


interface CustomCommand extends ClientOptions {
  execute: <T>(interaction: ChatInputCommandInteraction) => Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(__filename);

class ExtendedClient extends Client {
  commands: Collection<string, CustomCommand>;

  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
  }

  public async setupCommands() {
    const commandDir = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));

    for (const commandFile of commandFiles) {
      const commandPath = path.join(commandDir, commandFile);
      try {
        const command = await import(pathToFileURL(commandPath).toString());
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