import { GatewayIntentBits, Events } from 'discord.js';

import ExtendedClient from "./ExtendedClient.ts";

import type DBManager from "../db/DBManager.ts";

class DiscordManager {
    private dbManager: DBManager;

    private client: ExtendedClient;
    private readonly intents: GatewayIntentBits;
    private readonly token: string;

    constructor(dbManager: DBManager, token: string) {
        this.dbManager = dbManager;

        this.intents = GatewayIntentBits.MessageContent | GatewayIntentBits.GuildMembers;
        this.client = new ExtendedClient({ intents: this.intents });
        this.token = token;

        this.client.setupCommands()
            .then(() => this.setupGateway())
            .catch(console.error);
    }

    private setupGateway() {
        this.client.on('ready', async () => {
            if (!this.client.user) return;
            console.log(`Logged in to Discord as ${this.client.user.tag}`);
        });

        this.client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`Command ${interaction.commandName} not found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        });
    }

    public async login() {
        await this.client.login(this.token);
    }
}

export default DiscordManager;