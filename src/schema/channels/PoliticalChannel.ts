import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { ChannelType, GuildBasedChannel, GuildChannel, TextChannel, ThreadChannel, type CategoryChannel, type Guild } from 'discord.js';

import ChannelPermissions, { createChannelPermissionsOverwrite } from '../permissions/ChannelPermissions.js';

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
}

const PoliticalChannelModel = getModelForClass(PoliticalChannel);

// For RefRoleArray, we need to filter out undefined values, so use the filter function if the role may be undefined
async function createPoliticalChannelDocument(guild: Guild, politicalChannel: PoliticalChannel, categoryChannel: CategoryChannel, reason?: string): Promise<Ref<PoliticalChannel>> {
    politicalChannel = await linkDiscordChannel(guild, politicalChannel, categoryChannel, reason);
    return await PoliticalChannelModel.create(politicalChannel);
}

async function linkDiscordChannel(guild: Guild, politicalChannel: PoliticalChannel, categoryChannel: CategoryChannel, reason?: string): Promise<PoliticalChannel> {
    // Fetch cache
    if (guild.channels.cache.size === 0) {
        await guild.channels.fetch();
    }
    
    const { name } = politicalChannel;
    const permissionOverwrites = await createChannelPermissionsOverwrite(guild.id, politicalChannel.channelPermissions);

    let discordChannel: GuildBasedChannel | null | undefined;
    if (politicalChannel.channelID) {
        // If channelID is defined, fetch the channel
        discordChannel = await guild.channels.fetch(politicalChannel.channelID);
        if (discordChannel) {
            // This is not the channel we are looking for.
            if (discordChannel.type !== politicalChannel.channelType) {
                politicalChannel.channelID = undefined;
                return await linkDiscordChannel(guild, politicalChannel, categoryChannel, reason);
            } else {
                // Set Configs parallel to setup
                discordChannel.edit({ parent: categoryChannel, topic: politicalChannel.description, permissionOverwrites, reason });
                return politicalChannel
            }
        }
        // Else: fallback to undefined channelID
    }
    // If channelID is undefined, we create a new one
    discordChannel = await guild.channels.create({
        name,
        type: politicalChannel.channelType as CreatableChannelType,
        parent: categoryChannel,
        topic: politicalChannel.description,
        permissionOverwrites: permissionOverwrites,
        reason
    });
    // Link the channel
    politicalChannel.channelID = discordChannel?.id;
    
    return politicalChannel;
}

async function deletePoliticalChannelDocument(guild: Guild, channelDocument: Ref<PoliticalChannel>, deleteObjects: boolean, reason?: string) {
    const politicalChannel = await PoliticalChannelModel.findOneAndDelete({ _id: channelDocument });
    if (!politicalChannel || !politicalChannel.channelID) {
        return;
    }
    if (deleteObjects) {
        await deleteDiscordChannel(guild, politicalChannel.channelID, reason);
    }
}

async function deleteDiscordChannel(guild: Guild, channelID: string, reason?: string) {
    const discordChannel = await guild.channels.fetch(channelID);
    if (discordChannel) {
        await discordChannel.delete(reason);
    }
}

export default PoliticalChannel;
export { PoliticalChannelModel };
export { createPoliticalChannelDocument, deletePoliticalChannelDocument };