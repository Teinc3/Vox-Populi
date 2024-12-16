import { getDiscriminatorModelForClass, prop } from "@typegoose/typegoose";

import AbstractChannel, { AbstractChannelModel } from "./AbstractChannel.js";

import { AbstractChannelType, ChannelInterface, LogChannelType } from "../../types/channels.js";

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

const LogChannelModel = getDiscriminatorModelForClass(AbstractChannelModel, LogChannel, AbstractChannelType.Log);

export default LogChannel;
export { LogChannelModel };