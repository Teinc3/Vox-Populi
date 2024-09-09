import { prop, type Ref, isDocumentArray } from "@typegoose/typegoose";

import PoliticalChannel, { PoliticalChannelModel } from "./PoliticalChannel.js";
import GuildCategory, { GuildCategoryModel } from "./GuildCategory.js";
import { LogChannelType } from "../../types/events.js";

class LogChannelHolder {
    @prop({ required: true, ref: () => 'PoliticalChannel' })
    serverLogs!: Ref<PoliticalChannel>;

    @prop({ required: true, ref: () => 'PoliticalChannel' })
    chatLogs!: Ref<PoliticalChannel>;

    static async createLogChannelHolderDocument(categoriesRef: Ref<GuildCategory>[]): Promise<LogChannelHolder> {
        // Populate all the categories and within them all channels.
        const categories = await GuildCategoryModel.find({ _id: { $in: categoriesRef } }).populate('channels');

        if (!isDocumentArray(categories)) {
            throw new Error('No categories found');
        }

        const logChannelHolder = new LogChannelHolder();

        // Populate all the channels and search if .logChannelType exists
        const channels = categories.flatMap(category => category.channels).filter((channel): channel is Ref<PoliticalChannel> => channel !== undefined);

        let serverLogs: Ref<PoliticalChannel> | undefined = undefined;
        let chatLogs: Ref<PoliticalChannel> | undefined = undefined;
        
        const promises = channels.map(async channel => {
            const channelDocument = await PoliticalChannelModel.findOne({ _id: channel });
            if (channelDocument && channelDocument.logChannelType !== undefined) {
                if (channelDocument.logChannelType === LogChannelType.Server) {
                    serverLogs = channel;
                } else if (channelDocument.logChannelType === LogChannelType.Chat) {
                    chatLogs = channel;
                }
            }
        });
        
        await Promise.all(promises);

        if (!serverLogs || !chatLogs) {
            throw new Error('No log channels found');
        }
        logChannelHolder.serverLogs = serverLogs;
        logChannelHolder.chatLogs = chatLogs;

        return logChannelHolder;
    }
}

export default LogChannelHolder;