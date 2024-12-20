import { GatewayIntentBits, Events } from 'discord.js';

import ExtendedClient from "./ExtendedClient.js";
import EventHandler from './EventHandler.js';
import MiddlewareManager from '../utils/MiddlewareManager.js';

import TicketCollectorModel from '../schema/collectors/TicketCollector.js';

class DiscordManager {
    readonly client: ExtendedClient;
    private readonly eventHandler: EventHandler;
    private static readonly intents: GatewayIntentBits = GatewayIntentBits.MessageContent | GatewayIntentBits.GuildMembers | GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages
    private readonly token: string;

    constructor(token: string) {
        this.token = token;

        this.client = new ExtendedClient({ intents: DiscordManager.intents });
        this.eventHandler = new EventHandler(this);

        this.setup().then();
    }

    private async setup() {
        try {
            (new MiddlewareManager).setClient(this.client);
            
            await this.client.setupCommands();
            this.setupGateway();
            this.eventHandler.init();


        } catch (error) {
            console.error(error);
        }
    }

    private setupGateway() {
        this.client.on('ready', async () => {
            if (!this.client.user) return;
            console.log(`Logged in to Discord as ${this.client.user.tag}`);
        });

        this.client.on(Events.InteractionCreate, async interaction => {
            if (interaction.isChatInputCommand()) {
                const command = this.client.commands.get(interaction.commandName);
                if (!command) {
                    console.error(`Command ${interaction.commandName} was called but cannot be loaded.`);
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
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
            } else if (interaction.isButton()) {
                try {
                    // Is this from a ticketCollector?
                    const ticketCollectorDocument = await TicketCollectorModel.findOne({ messageID: interaction.message.id });
                    if (!ticketCollectorDocument) return;

                    // Yes! Handle the ticket
                    await interaction.deferUpdate();
                    await ticketCollectorDocument.handleTicket(interaction);
                } catch (error) {
                    console.error(error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error while executing this Button!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error while executing this Button!', ephemeral: true });
                    }
                }
            }

        });
    }

    public async login() {
        await this.client.login(this.token);
    }
}

export default DiscordManager;