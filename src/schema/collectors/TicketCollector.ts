import { type Ref, isDocument, getDiscriminatorModelForClass } from '@typegoose/typegoose';
import { 
    MessageActionRowComponentData, ActionRowData, EmbedBuilder,
    ButtonStyle, ChannelType, Colors, ComponentType, TextChannel, MessageType,
    type APIEmbed, type ButtonInteraction, type Message,
} from 'discord.js';

import GuildModel from '../main/PoliticalGuild.js';
import EventModel, { EventSchema } from '../events/Event.js';
import ExtendedClient from '../../discord/ExtendedClient.js';
import { PoliticalChannelModel } from '../channels/PoliticalChannel.js';
import BaseCollector, { BaseCollectorModel } from './BaseCollector.js';

import type { DefaultTicketData } from '../../types/wizard.js';
import { TicketType, PoliticalEventType, AppointmentDetails } from '../../types/events.js';

/**
 * Ticket Collector schema for storing ticket collector objects
 * 
 * @class
 * @extends BaseCollector
 */
class TicketCollector extends BaseCollector<DefaultTicketData> {

    override createPayload(defaultTicketData: DefaultTicketData) {
        const embed: APIEmbed = {
            title: defaultTicketData.title,
            description: defaultTicketData.description,
            color: Colors[defaultTicketData.color ?? 'Blurple']
        }

        const actionRow: ActionRowData<MessageActionRowComponentData> = {
            components: defaultTicketData.options.map(option => ({
                type: ComponentType.Button,
                customId: TicketType[option.type],
                label: option.label,
                style: ButtonStyle[option.style],
                emoji: option.emoji
            })),
            type: ComponentType.ActionRow
        }

        return {
            embeds: [embed],
            components: [actionRow]
        };
    }

    async createTicketCollectorDocument(): Promise<Ref<TicketCollector>> {
        return await TicketCollectorModel.create(this);
    }

    /**
     * Overload 1: discordChannel (TextChannel), reason?
     * 
     * @param discordChannel 
     * @param reason 
     */
    async checkLinkDiscordTicketCollector(discordChannel: TextChannel, reason?: string): Promise<boolean>;
    /**
     * Overload 2: client (ExtendedClient), reason?
     * 
     * @param client 
     * @param reason 
     */
    async checkLinkDiscordTicketCollector(client: ExtendedClient, reason?: string): Promise<boolean>;
    async checkLinkDiscordTicketCollector(arg1: TextChannel | ExtendedClient, reason?: string): Promise<boolean> {
        // find PoliticalChannel
        const channelDocument = await PoliticalChannelModel.findById(this.channel);
        if (!channelDocument?.channelID) {
            // Channel doesn't exist, we can't do shit
            return false;
        }

        // Fetch the channel, if its the wrong type, we can't do anything.
        const discordChannel = arg1 instanceof ExtendedClient ? await arg1.channels.fetch(channelDocument.channelID) : arg1;
        if (!(discordChannel && discordChannel.type === ChannelType.GuildText)) {
            return false;
        }

        let discordMessage: Message<true> | undefined = undefined;

        if (this.messageID) {
            // Fetch the message
            try {
                discordMessage = await discordChannel.messages.fetch(this.messageID);
            } catch (err) {
                discordMessage = undefined;
            }
        }

        const payload = this.deserializePayload();

        // Fallback Options
        if (!discordMessage) {
            discordMessage = await discordChannel.send(payload)

            // If it's already saved before (hence messageID is present), then we update it in the document.
            if (this.messageID) {
                await TicketCollectorModel.findOneAndUpdate({ messageID: this.messageID }, { messageID: discordMessage.id });
            }
            this.messageID = discordMessage.id;
            
        }
        if (discordMessage.flags.has('SuppressEmbeds')) {
            discordMessage.suppressEmbeds(false);
        }
        if (!discordMessage.pinned) {
            // Force async pinning to avoid race conditions
            setTimeout(() => discordMessage.pin(reason), 1E3);

            discordChannel.awaitMessages({
                filter: (m: Message) => m.type === MessageType.ChannelPinnedMessage && m.reference!.messageId === discordMessage.id,
                max: 1,
                time: 60E3
            })
                .then(pinnedMessages => pinnedMessages.first()?.delete())
                .catch();
        }

        return true;
    }

    async handleTicket(interaction: ButtonInteraction) {
        const customId = interaction.customId;
        try {
            // Handle button click
            switch (customId) {
                case TicketType.Inquiry:
                    // Handle Inquiry
                    break;
                case TicketType.Report:
                    // Handle Report
                    break;
                case TicketType.CourtCase:
                    // Handle Suggestion
                    break;
                case TicketType.Registration:
                    await this.handleRegistration(interaction);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: 'There was an error while handling this ticket.', ephemeral: true });
        }
    }

    async handleRegistration(interaction: ButtonInteraction) {
        if (!interaction.guildId) {
            return;
        }
        if (!interaction.guild) {
            await interaction.client.guilds.fetch(interaction.guildId);
        }

        // Handle Registration: For now we admit all registrations, so completed is true
        const event = new EventSchema(`<@!${interaction.user.id}>(${interaction.user.username})'s Citizenship Application`, PoliticalEventType.Appointment, interaction.guildId, { completed: true });
        if (!event.isAppointment()) {
            return; // Another typeguard
        }

        // Find the Role. First we find the PoliticalGuild Document, populate roles and roles.Citizen
        const guildDocument = await GuildModel.findOne({ guildID: interaction.guildId });
        if (!(guildDocument)) {
            return;
        }
        await guildDocument.populate('roles')
        if (!isDocument(guildDocument.roles)) {
            return;
        }

        event.options = {
            role: guildDocument.roles.Citizen,
            details: AppointmentDetails.Promoted,
            userID: interaction.user.id,
            reason: 'For now all applications are accepted.'
        }

        // Populate roles.Citizen to obtain roleID
        await guildDocument.roles.populate('Citizen');
        if (!isDocument(guildDocument.roles.Citizen)) {
            return;
        }

        // Now fetch the role
        const { roleID } = guildDocument.roles.Citizen;
        if (!roleID) {
            return;
        }
        const role = await interaction.guild?.roles.fetch(roleID);
        if (!role) {
            return;
        }

        const member = await interaction.guild?.members.fetch(interaction.user.id);
        if (!member) {
            return;
        }

        if (member.roles.cache.some(r => r.id === roleID)) {
            await interaction.followUp({ content: 'You already have the Citizen Role!', ephemeral: true });
            return;
        }

        await member.roles.add(role, event.options.reason);
    
        await new EventModel(event).save();

        const embed = new EmbedBuilder()
            .setTitle('Application Outcome')
            .setDescription(`Congratulations! Your application for Citizenship has been **accepted**.\n\nYou now have the Citizen Role.`)
            .setColor(Colors.Green)
            .setFooter({ text: `Reason: ${event.options.reason ?? "No reason provided"}` })
            .setTimestamp();

        // Create a DM Channel
        const dmChannel = await member.createDM();
        dmChannel.send({ embeds: [embed] });
    }
}

const TicketCollectorModel = getDiscriminatorModelForClass(BaseCollectorModel, TicketCollector);

export default TicketCollectorModel;
export { TicketCollector };