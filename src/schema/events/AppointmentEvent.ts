import { getDiscriminatorModelForClass } from '@typegoose/typegoose';

import { PoliticalEventType } from '../../types/events.ts';
import EventModel, { EventSchema } from './Event.ts';

import type { AppointmentOptions } from '../options/EventOptions.ts';


/**
 * Appointment Event schema
 * @class
 */
class AppointmentEvent extends EventSchema<AppointmentOptions> {
  type = PoliticalEventType.Appointment;
}

const AppointmentEventModel = getDiscriminatorModelForClass(
  EventModel,
  AppointmentEvent,
  PoliticalEventType.Appointment
);

export { AppointmentEventModel, AppointmentEvent as default };
