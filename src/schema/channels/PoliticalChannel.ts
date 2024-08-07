import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { type CategoryChannel, ChannelType, type Guild } from 'discord.js';

import ChannelPermissions from '../permissions/ChannelPermissions.js';

type ChannelTypeType = ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildCategory | ChannelType.GuildAnnouncement | ChannelType.GuildStageVoice | ChannelType.GuildForum | ChannelType.GuildMedia;

class PoliticalChannel {
    constructor(name: string, channelType: ChannelTypeType, channelPermissions: ChannelPermissions) {
        this.name = name;
        this.channelType = channelType;
        this.channelPermissions = channelPermissions;
    }    

    @prop({ required: true })
    name!: string;

    @prop()
    channelID?: string;

    @prop({ required: true })
    channelType!: ChannelTypeType;

    // Subdoc
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
    let discordChannelByID = politicalChannel.channelID ? guild.channels.cache.get(politicalChannel.channelID) : null;
    let discordChannelsByName = guild.channels.cache.filter(channel => channel.name === name);
    
    if (discordChannelByID || discordChannelsByName.size > 0) {
        if (discordChannelByID) {
            // Add this channel to the list of channels with the same name, so it can be deleted
            politicalChannel.channelID = undefined;
            discordChannelsByName.set(discordChannelByID.id, discordChannelByID);
        }
        // Delete all channels with the same name
        await Promise.all(discordChannelsByName.map(async (channel) => {
            await unlinkDiscordChannel(guild, channel.id, reason);
        }));

        return await linkDiscordChannel(guild, politicalChannel, categoryChannel, reason);
    } else {
        // Create the channel if it DNE
        const discordChannel = await guild.channels.create({
            name,
            type: politicalChannel.channelType,
            parent: categoryChannel,
            permissionOverwrites: processPermissions(politicalChannel.channelPermissions),
            reason
        });
        // Link the channel
        politicalChannel.channelID = discordChannel?.id;
    }
    return politicalChannel;
}

async function deletePoliticalChannelDocument(guild: Guild, channelDocument: Ref<PoliticalChannel>, reason?: string) {
    const politicalChannel = await PoliticalChannelModel.findOneAndDelete({ _id: channelDocument });
    if (!politicalChannel || !politicalChannel.channelID) {
        return;
    }
    await unlinkDiscordChannel(guild, politicalChannel.channelID, reason);
}

async function unlinkDiscordChannel(guild: Guild, channelID: string, reason?: string) {
    const discordChannel = await guild.channels.fetch(channelID);
    if (discordChannel) {
        await discordChannel.delete(reason);
    }
}

function processPermissions(_channelPermissions: ChannelPermissions) {
    return [];
    /* const permissionOverwrites = [];
    for (const permission of channelPermissions.keys()) {
        permissionOverwrites.push({
            id: permission.id,
            allow: permission.allow,
            deny: permission.deny
        });
    }
    return permissionOverwrites; */
}

export default PoliticalChannel;
export { PoliticalChannelModel };
export { createPoliticalChannelDocument, deletePoliticalChannelDocument };