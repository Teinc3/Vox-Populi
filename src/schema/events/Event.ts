import { prop, getModelForClass, Severity } from '@typegoose/typegoose';

import AppointmentOptions from '../options/EventOptions.js';
import { PoliticalEventType } from '../../types/events.js';

/**
 * Event schema for storing events
 * 
 * @class
 */
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
}

const EventModel = getModelForClass(EventSchema);

export default EventModel;
export { EventSchema };