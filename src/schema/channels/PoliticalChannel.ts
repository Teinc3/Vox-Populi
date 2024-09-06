import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { ChannelType, GuildBasedChannel, TextChannel, type CategoryChannel, type Guild } from 'discord.js';

import { TicketCollector } from '../TicketCollector.js';

import ChannelPermissions from '../permissions/ChannelPermissions.js';
import { DefaultTicketData } from '../../types/wizard.js';

/**
 * Represents a Political channel in a guild.
 */
class PoliticalChannel {
    constructor(name: string, channelPermissions: ChannelPermissions, description: string, channelID?: string) {
        this.name = name;
        this.channelPermissions = channelPermissions;
        this.description = description;
        this.channelID = channelID;
    }    

    @prop({ required: true })
    name!: string;

    @prop({ required: true })
    description!: string;

    @prop()
    channelID?: string;

    @prop({ required: true, _id: false })
    channelPermissions!: ChannelPermissions

    @prop({ default: [], required: true, ref: () => 'TicketCollector' })
    ticketCollectors!: Ref<TicketCollector>[];

    static async deletePoliticalChannelDocument(guild: Guild, channelDocument: Ref<PoliticalChannel>, deleteObjects: boolean, reason?: string) {
        const politicalChannel = await PoliticalChannelModel.findOneAndDelete({ _id: channelDocument });
        if (!politicalChannel || !politicalChannel.channelID) {
            return;
        }
        
        await TicketCollector.deleteTicketCollectorDocuments(politicalChannel.ticketCollectors);
        if (deleteObjects) {
            await politicalChannel.deleteDiscordChannel(guild, reason);
        }
    }

    static async createTicketCollector(discordChannel: TextChannel, channelRef: Ref<PoliticalChannel>, ticketData: DefaultTicketData, reason?: string) {
        const politicalChannel = await PoliticalChannelModel.findById(channelRef);
        if (!politicalChannel) {
            return;
        }

        const ticketCollector = new TicketCollector(channelRef, ticketData);
        await ticketCollector.checkLinkDiscordTicketCollector(discordChannel, reason);
        const ticketCollectorRef = await ticketCollector.createTicketCollectorDocument();
        politicalChannel.ticketCollectors.push(ticketCollectorRef);
        await politicalChannel.save();
    }

    // For RefRoleArray, we need to filter out undefined values, so use the filter function if the role may be undefined
    async createPoliticalChannelDocument(guild: Guild, categoryChannel: CategoryChannel, options?: { ticketData?: DefaultTicketData, reason?: string }): Promise<Ref<PoliticalChannel>> {
        const discordChannel = await this.linkDiscordChannel(guild, categoryChannel, options?.reason);
        const channelRef = await PoliticalChannelModel.create(this);
        if (options?.ticketData) {
            await PoliticalChannel.createTicketCollector(discordChannel, channelRef, options?.ticketData);
        }
        return channelRef;
    }

    async linkDiscordChannel(guild: Guild, categoryChannel: CategoryChannel, reason?: string): Promise<TextChannel> {
        // Fetch cache
        if (guild.channels.cache.size === 0) {
            await guild.channels.fetch();
        }
        
        const { name } = this;
        const permissionOverwrites = await this.channelPermissions.createChannelPermissionsOverwrite(guild.id);
    
        let discordChannel: GuildBasedChannel | null | undefined;
        if (this.channelID) {
            // If channelID is defined, fetch the channel
            discordChannel = await guild.channels.fetch(this.channelID);
            if (discordChannel) {
                // This is not the channel we are looking for.
                if (discordChannel.type !== ChannelType.GuildText) {
                    this.channelID = undefined;
                    return await this.linkDiscordChannel(guild, categoryChannel, reason);
                } else {
                    // Set Configs parallel to setup
                    discordChannel.edit({ parent: categoryChannel, topic: this.description, permissionOverwrites, reason });
                    return discordChannel;
                }
            }
            // Else: fallback to undefined channelID
        }
        // If channelID is undefined, we create a new one
        discordChannel = await guild.channels.create({
            name,
            type: ChannelType.GuildText,
            parent: categoryChannel,
            topic: this.description,
            permissionOverwrites: permissionOverwrites,
            reason
        });
        // Link the channel
        this.channelID = discordChannel?.id;

        return discordChannel;
    }
    
    async deleteDiscordChannel(guild: Guild, reason?: string) {
        if (!this.channelID) {
            return;
        }

        const discordChannel = await guild.channels.fetch(this.channelID);
        if (discordChannel) {
            await discordChannel.delete(reason);
        }
    }
}

const PoliticalChannelModel = getModelForClass(PoliticalChannel);

export default PoliticalChannel;
export { PoliticalChannelModel };