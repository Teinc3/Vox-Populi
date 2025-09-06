import { PoliticalEventType } from "../events";

import type { DocumentType } from "@typegoose/typegoose";
import type { EventSchema } from "../../schema/events/Event";
import type AppointmentEvent from "../../schema/events/AppointmentEvent";


export default class EventGuard {
  public static isAppointment(
    event: DocumentType<EventSchema>
  ): event is DocumentType<AppointmentEvent> {
    return event.type === PoliticalEventType.Appointment;
  }
}