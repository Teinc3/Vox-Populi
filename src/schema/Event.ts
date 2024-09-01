import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';
import { PoliticalEventType } from '../types/types';
import { type GuildSchema } from './Guild';

/**
 * Event schema for storing events
 * 
 * @class
 */
class EventSchema {
    @prop({ required: true })
    public name!: string;
    
    @prop({ required: true, type: () => [Date] })
    public date!: Date;
    
    @prop({ required: true, enum: () => PoliticalEventType })
    public type!: PoliticalEventType;

    @prop({ required: true })
    public completed!: boolean;

    @prop({ type: () => Date })
    public dueDate?: Date;

    @prop({ required: true, ref: () => 'GuildSchema' })
    public guild!: Ref<GuildSchema>;

    constructor(name: string, type: PoliticalEventType, guildDocument: Ref<GuildSchema>, eventOptions: { dueDate?: Date, completed?: boolean }) {
        this.name = name;
        this.date = new Date();
        this.type = type;
        this.guild = guildDocument;

        this.completed = eventOptions.completed ?? false;
        if (eventOptions.dueDate) {
            this.dueDate = eventOptions.dueDate;
        }
    }
}

const EventModel = getModelForClass(EventSchema);

export default EventModel;
export { EventSchema };