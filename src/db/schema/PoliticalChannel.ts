import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { type CategoryChannel, ChannelType, type Guild } from 'discord.js';

import ChannelPermissions from './ChannelPermissions.js';

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

    @prop({ required: true, _id: false })
    channelPermissions!: ChannelPermissions
}

const PoliticalChannelModel = getModelForClass(PoliticalChannel);

// For RefRoleArray, we need to filter out undefined values, so use the filter function if the role may be undefined
async function createPoliticalChannelDocument(guild: Guild, politicalChannel: PoliticalChannel, categoryChannel?: CategoryChannel, reason?: string): Promise<Ref<PoliticalChannel>> {
    politicalChannel = await linkDiscordChannel(guild, politicalChannel, categoryChannel, reason);
    return await PoliticalChannelModel.create(politicalChannel);
}

async function linkDiscordChannel(guild: Guild, politicalChannel: PoliticalChannel, categoryChannel?: CategoryChannel, reason?: string): Promise<PoliticalChannel> {
    const { name } = politicalChannel;

    try {
        // Fetch cache
        if (guild.channels.cache.size === 0) {
            await guild.channels.fetch();
        }
        // Find the required channel
        let discordChannel = guild.channels.cache.find(channel => channel.name === name);
        if (!discordChannel) {
            // Create the channel if it DNE
            if (categoryChannel) {
                discordChannel = await guild.channels.create({
                    name,
                    type: politicalChannel.channelType,
                    parent: categoryChannel,
                    permissionOverwrites: processPermissions(politicalChannel.channelPermissions),
                    reason
                });
            }
        } else {
            // Delete the existing channel and create a new one
            await discordChannel.delete(reason);
            return await linkDiscordChannel(guild, politicalChannel, categoryChannel, reason);
        }
        // Link the channel
        politicalChannel.channelID = discordChannel?.id;

    } catch (err) {
        console.error(err);
    }
    return politicalChannel;
}

async function deletePoliticalChannelDocument(_id: Ref<PoliticalChannel>) {
    await PoliticalChannelModel.deleteOne({ _id });
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