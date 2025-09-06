import { prop } from '@typegoose/typegoose';


export default class EmergencyOptions {
  /**
     * Number of hours a temporary admin will have admin permissions for.
     */
  @prop({ required: true })
  tempAdminLength!: number;

  /**
     * Can the config be deleted by the person who created it?
     */
  @prop({ required: true })
  allowResetConfig!: boolean;

  /**
     * The ID of the user who initialized the config.
     */
  @prop({ required: true })
  creatorID!: string;
}