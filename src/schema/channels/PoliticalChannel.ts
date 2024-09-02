import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { ChannelType, GuildBasedChannel, type CategoryChannel, type Guild } from 'discord.js';

import ChannelPermissions from '../permissions/ChannelPermissions.js';

/**
 * @see {@link https://discord.js.org/docs/packages/discord.js/main/GuildChannelCreateOptions:Interface#type}
 */
type CreatableChannelType = Exclude<ChannelType, ChannelType.DM | ChannelType.GroupDM | ChannelType.PublicThread | ChannelType.AnnouncementThread | ChannelType.PrivateThread | ChannelType.GuildCategory>;

/**
 * Represents a Political channel in a guild.
 */
class PoliticalChannel {
    constructor(name: string, channelType: CreatableChannelType, channelPermissions: ChannelPermissions, description: string, channelID?: string) {
        this.name = name;
        this.channelType = channelType;
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

    @prop({ required: true })
    channelType!: CreatableChannelType;

    @prop({ required: true, _id: false })
    channelPermissions!: ChannelPermissions

    static async deletePoliticalChannelDocument(guild: Guild, channelDocument: Ref<PoliticalChannel>, deleteObjects: boolean, reason?: string) {
        const politicalChannel = await PoliticalChannelModel.findOneAndDelete({ _id: channelDocument });
        if (!politicalChannel || !politicalChannel.channelID) {
            return;
        }
        if (deleteObjects) {
            await politicalChannel.deleteDiscordChannel(guild, reason);
        }
    }

    // For RefRoleArray, we need to filter out undefined values, so use the filter function if the role may be undefined
    async createPoliticalChannelDocument(guild: Guild, categoryChannel: CategoryChannel, reason?: string): Promise<Ref<PoliticalChannel>> {
        await this.linkDiscordChannel(guild, categoryChannel, reason);
        return await PoliticalChannelModel.create(this);
    }

    async linkDiscordChannel(guild: Guild, categoryChannel: CategoryChannel, reason?: string) {
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
                if (discordChannel.type !== this.channelType) {
                    this.channelID = undefined;
                    await this.linkDiscordChannel(guild, categoryChannel, reason);
                    return;
                } else {
                    // Set Configs parallel to setup
                    discordChannel.edit({ parent: categoryChannel, topic: this.description, permissionOverwrites, reason });
                    return;
                }
            }
            // Else: fallback to undefined channelID
        }
        // If channelID is undefined, we create a new one
        discordChannel = await guild.channels.create({
            name,
            type: this.channelType as CreatableChannelType,
            parent: categoryChannel,
            topic: this.description,
            permissionOverwrites: permissionOverwrites,
            reason
        });
        // Link the channel
        this.channelID = discordChannel?.id;
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