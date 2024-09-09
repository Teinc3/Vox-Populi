import { prop, getModelForClass, Severity, isDocument, type DocumentType, post } from '@typegoose/typegoose';
import { ChannelType, EmbedBuilder } from "discord.js";

import middlewareManager from '../../globals/middlewareManager.js';
import AppointmentOptions from '../options/EventOptions.js';
import GuildModel from '../main/PoliticalGuild.js';

import { PoliticalEventType } from '../../types/events.js';


/**
 * Event schema for storing events
 * 
 * @class
 */
@post<EventSchema>('save', middlewareManager.createEventMiddleware())
class EventSchema {
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

    @prop({ _id: false, allowMixed: Severity.ALLOW })
    public options?: AppointmentOptions; // Union type w/ other options

    constructor(name: string, type: PoliticalEventType, guildID: string, eventOptions: { dueDate?: Date, completed?: boolean }) {
        this.name = name;
        this.date = new Date();
        this.type = type;
        this.guildID = guildID;

        this.completed = eventOptions.completed ?? false;
        if (eventOptions.dueDate) {
            this.dueDate = eventOptions.dueDate;
        }

        switch (type) {
            case PoliticalEventType.Appointment:
                this.options = new AppointmentOptions();
                break;
            default:
                break;
        }
    }

    // Type guards
    public isAppointment(): this is { options: AppointmentOptions } {
        return this.type === PoliticalEventType.Appointment;
    }

    // Statics
    public static obtainEventMiddleware() {
        return async (doc: DocumentType<EventSchema>) => {
            const client = middlewareManager.getClient();

            // Find the Server Log channel from the LogChannelHolder
            const guild = await GuildModel.findOne({ guildID: doc.guildID });
            if (!guild || !guild.logChannels) {
                return;
            }
        
            // Populate guild.logChannels.serverLogs
            await guild.populate('logChannels.serverLogs')
            if (!isDocument(guild.logChannels.serverLogs) || !guild.logChannels.serverLogs.channelID) {
                return;
            }
        
            // Fetch the channel (How are we gonna get a discord instance?)
            const channel = await client.channels.fetch(guild.logChannels.serverLogs.channelID)
            if (!channel || channel.type !== ChannelType.GuildText) {
                return;
            }

            // Form the the Embed (We will branch this out later depending on the type)
            const embed = new EmbedBuilder()
                .setTitle(`New ${doc.type} Event`)
                .setDescription(`A new event has been created: \n\n*${doc.name}*`)
                .setFields([
                    { name: 'Completion Status', value: doc.completed ? 'Completed' : 'Pending', inline: true },
                    { name: 'Due Date', value: doc.dueDate?.toDateString() ?? 'N/A', inline: true }
                ])
                .setTimestamp(doc.date);

            // Send the Embed
            await channel.send({ embeds: [embed] });
        }
    }
}

const EventModel = getModelForClass(EventSchema);

export default EventModel;
export { EventSchema };