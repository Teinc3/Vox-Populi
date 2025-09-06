import { TextChannel } from 'discord.js';
import { prop, type Ref, getDiscriminatorModelForClass } from '@typegoose/typegoose';

import { TicketCollector } from '../collectors/TicketCollector.ts';
import { AbstractChannelType, ChannelInterface } from '../../types/channels.ts';
import AbstractChannel, { AbstractChannelModel } from './AbstractChannel.ts';

import type { DefaultInteractionData } from '../../types/collector.ts';


/**
 * Represents a Political channel in a guild.
 * 
 * @class
 * @extends AbstractChannel
 */
class PoliticalChannel extends AbstractChannel {
  type = AbstractChannelType.Political

  @prop({ default: [], required: true, ref: () => 'TicketCollector' })
  ticketCollectors!: Ref<TicketCollector>[];

  /* @prop({ default: [], required: true, ref: () => 'VoteCollector' })
    voteCollectors!: Ref<VoteCollector>[]; */

  constructor(channelCreationOptions: ChannelInterface) {
    super(channelCreationOptions);
  }

  // Thanks to circular imports now this can't be static, fuck off
  async createTicketCollector(
    discordChannel: TextChannel,
    channelRef: Ref<PoliticalChannel>,
    ticketData: DefaultInteractionData,
    reason?: string
  ) {
    const politicalChannel = await PoliticalChannelModel.findById(channelRef);
    if (!politicalChannel) {
      return;
    }

    const ticketCollector = new TicketCollector(channelRef, ticketData);
    await ticketCollector.checkLinkDiscordTicketCollector(discordChannel, reason);
    const ticketCollectorRef = await ticketCollector.createTicketCollectorDocument();
    politicalChannel.ticketCollectors.push(ticketCollectorRef);
    await politicalChannel.save();
  }
}

const PoliticalChannelModel = getDiscriminatorModelForClass(
  AbstractChannelModel,
  PoliticalChannel,
  AbstractChannelType.Political
);

export default PoliticalChannel;
export { PoliticalChannelModel };