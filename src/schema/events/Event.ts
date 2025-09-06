import { ChannelType, EmbedBuilder } from "discord.js";
import {
  prop, getModelForClass, isDocument, post, modelOptions, type DocumentType,
} from '@typegoose/typegoose';

import BaseEventOptions from '../options/EventOptions.ts';
import GuildModel from '../main/PoliticalGuild.ts';
import middlewareManager from '../../utils/MiddlewareManager.ts';
import { PoliticalEventType } from '../../types/events.ts';


/**
 * Base Event schema for storing events
 * 
 * @class
 */
@modelOptions({ schemaOptions: { discriminatorKey: 'type' } })
@post<EventSchema>('save', EventSchema.obtainEventMiddleware())
class EventSchema<GenericEventOptions extends BaseEventOptions = BaseEventOptions> {
  @prop({ required: true })
  public name!: string;
    
  @prop({ required: true, type: () => Date })
  public date!: Date;
    
  @prop({ required: true, enum: () => PoliticalEventType })
  public type!: PoliticalEventType;

  @prop({ required: true })
  public completed!: boolean;

  @prop({ type: () => Date })
  public dueDate?: Date;

  @prop({ required: true })
  public guildID!: string;

  @prop({ _id: false })
  public options!: GenericEventOptions;

  constructor(
    name: string,
    type: PoliticalEventType,
    guildID: string,
    options: GenericEventOptions,
    eventOptions: { dueDate?: Date, completed?: boolean }
  ) {
    this.name = name;
    this.date = new Date();
    this.type = type;
    this.guildID = guildID;
    this.options = options;

    this.completed = eventOptions.completed ?? false;
    if (eventOptions.dueDate) {
      this.dueDate = eventOptions.dueDate;
    }
  }

  // Statics
  public static obtainEventMiddleware() {
    return async (doc: DocumentType<EventSchema<BaseEventOptions>>) => {
      const client = middlewareManager.getClient();

      // Find the Server Log channel from the LogChannelHolder
      const guild = await GuildModel.findOne({ guildID: doc.guildID });
      if (!guild || !guild.logChannels) {
        return;
      }
        
      // Populate guild.logChannels.serverLogs
      await guild.populate('logChannels.serverLogs')
      if (!isDocument(guild.logChannels.serverLogs)
        || !guild.logChannels.serverLogs.channelID) {
        return;
      }
        
      // Fetch the channel (How are we gonna get a discord instance?)
      const channel = await client.channels.fetch(guild.logChannels.serverLogs.channelID)
      if (!channel || channel.type !== ChannelType.GuildText) {
        return;
      }

      // Form the the Embed (We will branch this out later depending on the type)
      const embed = new EmbedBuilder()
        .setTitle('New Event Created')
        .setDescription(doc.name + "\n")
        .setFields([
          { name: 'Event Type', value: doc.type, inline: true },
          {
            name: 'Completion Status',
            value: doc.completed ? 'Completed' : 'Pending',
            inline: true
          },
        ])
        .setTimestamp(doc.date);
            
      if (doc.dueDate !== undefined) {
        embed.addFields([
          { name: 'Due Date', value: `<t:${doc.dueDate.toDateString()}:F>`, inline: true }
        ]);
      }
      // Send the Embed
      await channel.send({ embeds: [embed] });
    }
  }
}

const EventModel = getModelForClass(EventSchema);

export default EventModel;
export { EventSchema };