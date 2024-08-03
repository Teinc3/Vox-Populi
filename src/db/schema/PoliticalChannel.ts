import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import type { Guild } from 'discord.js';

class PoliticalChannel {
    @prop({ required: true })
    name!: string;

    @prop()
    channelID?: string;
}

const PoliticalChannelModel = getModelForClass(PoliticalChannel);

async function linkDiscordChannel(guild: Guild, politicalChannel: PoliticalChannel): Promise<PoliticalChannel> {
    const { name } = politicalChannel;

    try {
        // Is cache filled?
        if (guild.channels.cache.size === 0) {
            await guild.channels.fetch();
        }
        // Find the channel
        let discordChannel = guild.channels.cache.find(channel => channel.name === name);
        if (!discordChannel) {
            // Create the channel
            discordChannel = await guild.channels.create({ name });
        }
        // Link the channel
        politicalChannel.channelID = discordChannel.id;

    } catch (err) {
        console.error(err);
    }
    return politicalChannel;
}

async function deletePoliticalChannelDocument(_id: Ref<PoliticalChannel>) {
    await PoliticalChannelModel.deleteOne({ _id });
}

export default PoliticalChannel;
export { PoliticalChannelModel };
export { deletePoliticalChannelDocument };