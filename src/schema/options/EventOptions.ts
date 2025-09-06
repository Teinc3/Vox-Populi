import { prop, type Ref } from '@typegoose/typegoose';

import PoliticalRole from '../roles/PoliticalRole.ts';
import { AppointmentDetails } from '../../types/events.ts';


class BaseEventOptions {}

class AppointmentOptions extends BaseEventOptions {
  /**
    * The role that the user is being appointed to.
    */
  @prop({ required: true, ref: () => 'PoliticalRole' })
  public role!: Ref<PoliticalRole>;

  /**
    * The ID of the user that the appointment is for.
    */
  @prop({ required: true })
  public userID!: string;

  /**
    * The details for the appointment.
    */
  @prop({ required: true, enum: () => AppointmentDetails })
  public details!: AppointmentDetails;

  /**
    * Reason for the appointment.
    */
  @prop()
  public reason?: string;
}

export { BaseEventOptions as default, AppointmentOptions };