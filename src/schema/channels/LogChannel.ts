import { getDiscriminatorModelForClass, prop } from "@typegoose/typegoose";

import { AbstractChannelType, ChannelInterface, LogChannelType } from "../../types/channels.js";
import AbstractChannel, { AbstractChannelModel } from "./AbstractChannel.js";


/**
 * Represents a Log channel in a guild.
 * 
 * @class
 * @extends AbstractChannel
 */
class LogChannel extends AbstractChannel {
  type = AbstractChannelType.Log

  @prop({ enum: () => LogChannelType })
  mode?: LogChannelType;
    
  constructor(channelCreationOptions: ChannelInterface) {
    super(channelCreationOptions);
    this.mode = channelCreationOptions.logChannel!;
  }
}

const LogChannelModel = getDiscriminatorModelForClass(
  AbstractChannelModel,
  LogChannel,
  AbstractChannelType.Log
);

export default LogChannel;
export { LogChannelModel };