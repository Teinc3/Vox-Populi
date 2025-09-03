import { prop, type Ref, isDocumentArray } from "@typegoose/typegoose";

import { LogChannelType } from "../../types/channels.js";
import LogChannel, { LogChannelModel } from "./LogChannel.js";
import GuildCategory, { GuildCategoryModel } from "./GuildCategory.js";
import AbstractChannel from "./AbstractChannel.js";


class LogChannelHolder {
  @prop({ required: true, ref: () => 'LogChannel' })
  serverLogs!: Ref<LogChannel>;

  @prop({ required: true, ref: () => 'LogChannel' })
  chatLogs!: Ref<LogChannel>;

  static async createLogChannelHolderDocument(categoriesRef: Ref<GuildCategory>[]): Promise<LogChannelHolder> {
    // Populate all the categories and within them all channels.
    const categories = await GuildCategoryModel.find({ _id: { $in: categoriesRef } }).populate('channels');

    if (!isDocumentArray(categories)) {
      throw new Error('No categories found');
    }

    const logChannelHolder = new LogChannelHolder();

    // Populate all the channels
    const abstractChannels = categories.flatMap(category => category.channels).filter((channel): channel is Ref<AbstractChannel> => channel !== undefined);
        
    const promises = abstractChannels.map(async channel => {
      const channelDocument = await LogChannelModel.findOne({ _id: channel });
      if (channelDocument && channelDocument.isLogChannel()) {
        if (channelDocument.mode === LogChannelType.Server) {
          logChannelHolder.serverLogs = channel;
        } else if (channelDocument.mode === LogChannelType.Chat) {
          logChannelHolder.chatLogs = channel;
        }
      }
    });
        
    await Promise.all(promises);

    if (!logChannelHolder.serverLogs || !logChannelHolder.chatLogs) {
      throw new Error('No log channels found');
    }

    return logChannelHolder;
  }
}

export default LogChannelHolder;