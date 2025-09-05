import { type Ref, getDiscriminatorModelForClass, prop } from "@typegoose/typegoose";

import TicketOptionsCollector from "../collectors/TicketOptionsCollector.js";
import { AbstractChannelType, ChannelInterface } from "../../types/channels.js";
import AbstractChannel, { AbstractChannelModel } from "./AbstractChannel.js";


/**
 * Represents a Ticket channel in a guild.
 * 
 * @class
 * @extends AbstractChannel
 */
class TicketChannel extends AbstractChannel {
  type = AbstractChannelType.Ticket

  @prop({ default: [], required: true, ref: () => 'TicketOptionsCollector' })
  ticketOptionsCollector!: Ref<TicketOptionsCollector>[];

  constructor(channelCreationOptions: ChannelInterface) {
    super(channelCreationOptions);
  }
}

const TicketChannelModel = getDiscriminatorModelForClass(
  AbstractChannelModel,
  TicketChannel,
  AbstractChannelType.Ticket
);

export default TicketChannel;
export { TicketChannelModel };