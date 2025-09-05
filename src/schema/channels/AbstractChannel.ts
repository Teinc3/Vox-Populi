import {
  ChannelType,
  type CategoryChannel, type GuildBasedChannel, type TextChannel, type Guild
} from "discord.js";
import { Ref, getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

import { BaseCollectorModel } from "../collectors/BaseCollector.js";
import { DefaultInteractionData } from "../../types/collector.js";
import { AbstractChannelType, ChannelInterface } from "../../types/channels.js";

import type ChannelPermissions from "../permissions/ChannelPermissions.js";
import type PoliticalChannel from "./PoliticalChannel.js";
import type LogChannel from "./LogChannel.js";


/**
 * Represents any type of tracked text channel in a guild.
 * 
 * @class
 */
@modelOptions({
  schemaOptions: {
    collection: "abstractchannels",
    discriminatorKey: "type",
  }
})
class AbstractChannel implements ChannelInterface {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  description!: string;

  @prop({ unique: true })
  channelID?: string;

  @prop({ required: true, enum: () => AbstractChannelType })
  type!: AbstractChannelType

  @prop({ required: true, _id: false })
  channelPermissions!: ChannelPermissions

  constructor(channelCreationOptions: ChannelInterface) {
    this.name = channelCreationOptions.name;
    this.description = channelCreationOptions.description;
    this.channelPermissions = channelCreationOptions.channelPermissions;
    if (channelCreationOptions.channelID) {
      this.channelID = channelCreationOptions.channelID;
    }
  }

  // Type Guards
  /*
    isTicketChannel(): this is TicketChannel {
        return this.type === AbstractChannelType.Ticket
    }
    */

  isLogChannel(): this is LogChannel {
    return this.type === AbstractChannelType.Log
  }

  isPoliticalChannel(): this is PoliticalChannel {
    return this.type === AbstractChannelType.Political
  }

  static async deleteAbstractChannelDocument(
    guild: Guild,
    channelDocument: Ref<AbstractChannel>,
    deleteObjects: boolean,
    reason?: string
  ) {
    const politicalChannel = await AbstractChannelModel.findOneAndDelete({
      _id: channelDocument
    });
    if (!politicalChannel || !politicalChannel.channelID) {
      return;
    }

    if (politicalChannel.isPoliticalChannel()) {
      await BaseCollectorModel.deleteCollectorDocuments(politicalChannel.ticketCollectors);
    }
        
    if (deleteObjects) {
      await politicalChannel.deleteDiscordChannel(guild, reason);
    }
  }

  // For RefRoleArray, we need to filter out undefined values,
  // so use the filter function if the role may be undefined
  async createAbstractChannelDocument(
    guild: Guild,
    categoryChannel: CategoryChannel,
    options?: {
      ticketData?: DefaultInteractionData,
      reason?: string
    }
  ): Promise<Ref<AbstractChannel>> {
    const discordChannel = await this.linkDiscordChannel(
      guild,
      categoryChannel,
      options?.reason
    );
    const channelRef = await AbstractChannelModel.create(this);

    if (options?.ticketData && this.isPoliticalChannel()) {
      await this.createTicketCollector(
        discordChannel, 
        channelRef as Ref<PoliticalChannel>, 
        options?.ticketData
      );
    }
    return channelRef;
  }

  async linkDiscordChannel(
    guild: Guild, 
    categoryChannel: CategoryChannel, 
    reason?: string
  ): Promise<TextChannel> {
    // Fetch cache
    if (guild.channels.cache.size === 0) {
      await guild.channels.fetch();
    }
        
    const { name } = this;
    const permissionOverwrites
      = await this.channelPermissions.createChannelPermissionsOverwrite(guild.id);
    
    let discordChannel: GuildBasedChannel | null | undefined;
    if (this.channelID) {
      // If channelID is defined, fetch the channel
      discordChannel = await guild.channels.fetch(this.channelID);
      if (discordChannel) {
        // This is not the channel we are looking for.
        if (discordChannel.type !== ChannelType.GuildText) {
          this.channelID = undefined;
          return await this.linkDiscordChannel(guild, categoryChannel, reason);
        } else {
          // Set Configs parallel to setup
          discordChannel.edit({
            parent: categoryChannel,
            topic: this.description,
            permissionOverwrites,
            reason
          });
          return discordChannel;
        }
      }
      // Else: fallback to undefined channelID
    }
    // If channelID is undefined, we create a new one
    discordChannel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: categoryChannel,
      topic: this.description,
      permissionOverwrites: permissionOverwrites,
      reason
    });
    // Link the channel
    this.channelID = discordChannel?.id;

    return discordChannel;
  }
    
  async deleteDiscordChannel(guild: Guild, reason?: string) {
    if (!this.channelID) {
      return;
    }

    const discordChannel = await guild.channels.fetch(this.channelID);
    if (discordChannel) {
      await discordChannel.delete(reason);
    }
  }
}

const AbstractChannelModel = getModelForClass(AbstractChannel);

export default AbstractChannel;
export { AbstractChannelModel }