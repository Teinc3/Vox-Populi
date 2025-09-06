import { GatewayIntentBits, Events } from 'discord.js';

import middlewareManager from '../utils/MiddlewareManager.ts';
import TicketCollectorModel from '../schema/collectors/TicketCollector.ts';
import ExtendedClient from "./ExtendedClient.js";
import EventHandler from './EventHandler.ts';


class DiscordManager {
  readonly client: ExtendedClient;
  private readonly eventHandler: EventHandler;
  private static readonly intents: GatewayIntentBits
    = GatewayIntentBits.MessageContent | GatewayIntentBits.GuildMembers
      | GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages;

  constructor(token: string) {
    this.client = new ExtendedClient({ intents: DiscordManager.intents });
    this.client.token = token; // Set directly
    this.eventHandler = new EventHandler(this);

    this.setup().then();
  }

  private async setup() {
    try {
      middlewareManager.setClient(this.client);
            
      this.client.setupCommands().then(); // We don't wait for commands to be registered by discord
      this.setupGateway();
      this.eventHandler.init();


    } catch (error) {
      console.error(error);
    }
  }

  private setupGateway() {
    this.client.once(Events.ClientReady, async () => {
      if (!this.client.user) {
        console.warn('[WARN] Client user is not defined after clientReady event.');
        return;
      }
      console.log(`Logged in to ${this.client.user.tag}`);
    });

    this.client.on(Events.InteractionCreate, async interaction => {
      if (interaction.isChatInputCommand()) {
        const command = this.client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`Command ${interaction.commandName} was called but cannot be loaded.`);
          await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true
          });
          return;
        }
    
        try {
          await command.execute(interaction);
        } catch (error) {
          console.error(error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: 'There was an error while executing this command!',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: 'There was an error while executing this command!',
              ephemeral: true
            });
          }
        }
      } else if (interaction.isButton()) {
        try {
          // Is this from a ticketCollector?
          const ticketCollectorDocument = await TicketCollectorModel
            .findOne({ messageID: interaction.message.id });
          if (!ticketCollectorDocument) {
            return;
          }

          // Yes! Handle the ticket
          await interaction.deferUpdate();
          await ticketCollectorDocument.handleTicket(interaction);
        } catch (error) {
          console.error(error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: 'An error occured when handling this interaction!',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: 'An error occured when handling this interaction!',
              ephemeral: true
            });
          }
        }
      }

    });
  }

  public async login() {
    await this.client.login();
  }
}

export default DiscordManager;