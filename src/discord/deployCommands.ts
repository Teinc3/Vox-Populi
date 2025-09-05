import { fileURLToPath, pathToFileURL } from 'url';
import path, { dirname } from "path";
import fs from "fs";
import { config } from "dotenv";
import { REST, Routes } from "discord.js";

import settings from "../data/settings.json" assert { type: 'json' };


// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(__filename);
config();

if (!process.env.DISCORD_TOKEN) {
  console.error('Token not provided');
  process.exit(1);
}

const token = process.env.DISCORD_TOKEN!;

const clientID: string = settings.discord.clientID;

const commands: string[] = [];

await loadCommands(commands);
await postCommands(token, clientID, commands);

async function loadCommands(pCommands: string[]) {
  const commandDir = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));
  for (const commandFile of commandFiles) {
    const commandPath = path.join(commandDir, commandFile);
    try {
      const command = await import(pathToFileURL(commandPath).toString());

      if ('data' in command && 'execute' in command) {
        pCommands.push(command.data.toJSON());
      } else {
        console.log(`[WARNING] The ${commandFile} command is missin`
          + 'a required "data" or "execute" property.');
      }
    } catch (error) {
      console.error(`[ERROR] Failed to load command at ${commandPath}:`, error);
    }
  }
}

async function postCommands(pToken: string, pClientID: string, pCommands: string[]) {
  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(pToken);

  // and deploy your commands!
  try {
    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(
      Routes.applicationCommands(pClientID),
      { body: pCommands }
    );
    console.log(
      `Successfully reloaded ${pCommands.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.log('Failed to reload application (/) commands.');
    console.error(error);
  }
}

