import { AbstractChannelType } from "../types/channels.js";
import PoliticalChannel from "../schema/channels/PoliticalChannel.js";
import LogChannel from "../schema/channels/LogChannel.js";

import type { ChannelInterface } from "../types/channels.js";
import type AbstractChannel from "../schema/channels/AbstractChannel.js";


/**
 * Creates a channel based on the type provided.
 * 
 * @param type 
 * @param channelCreationOptions 
 * @returns 
 */
export default function createChannel(
  type: AbstractChannelType,
  channelCreationOptions: ChannelInterface
): AbstractChannel {
  // eslint-disable-next-line @typescript-eslint/naming-convention
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