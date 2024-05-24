import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { REST, Routes } from "discord.js";
import { config } from "dotenv";

import constants from "../data/constants.json" assert { type: 'json' };
const devGuildID = constants.discord.devGuildID;

config();

if (!process.env.DISCORD_TOKEN) {
    console.error('Token not provided');
    process.exit(1);
}

const token = process.env.DISCORD_TOKEN!;

const clientID: string = constants.discord.clientID;

const commands: string[] = [];

await loadCommands(commands);
await postCommands(token, clientID, devGuildID, commands);

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
                console.log(`[WARNING] The ${commandFile} command is missing a required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to load command at ${commandPath}:`, error);
        }
    }
}

async function postCommands(pToken: string, pClientID: string, pGuildID: string, pCommands: string[]) {
    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(pToken);

    // and deploy your commands!
    try {
        // The put method is used to fully refresh all commands in the guild with the current set
        await rest.put(Routes.applicationCommands(pClientID), { body: pCommands });
        await rest.put(Routes.applicationGuildCommands(pClientID, pGuildID), { body: pCommands });
        console.log('Successfully reloaded application (/) commands.')
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.log('Failed to reload application (/) commands.');
        console.error(error);
    }
}

