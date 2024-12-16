import LogChannel from "../schema/channels/LogChannel.js";
import PoliticalChannel from "../schema/channels/PoliticalChannel.js";
import type AbstractChannel from "../schema/channels/AbstractChannel.js";
import { AbstractChannelType, ChannelInterface } from "../types/channels.js";


/**
 * Creates a channel based on the type provided.
 * 
 * @param type 
 * @param channelCreationOptions 
 * @returns 
 */
export function createChannel(type: AbstractChannelType, channelCreationOptions: ChannelInterface): AbstractChannel {
    let ChannelClass: typeof AbstractChannel;
    switch (type) {
        case AbstractChannelType.Log:
            ChannelClass = LogChannel;
            break;
        case AbstractChannelType.Political:
            ChannelClass = PoliticalChannel;
            break;
        default:
            throw new Error("Invalid AbstractChannelType / Not Implemented");
    }
    return new ChannelClass(channelCreationOptions);
}