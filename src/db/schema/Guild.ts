import { prop, getModelForClass } from '@typegoose/typegoose';
import type { IPoliticalSystem } from "../../types/types.d.ts";

class GuildSchema {
    @prop({ required: true })
    guildID!: number;

    @prop({ required: true })
    prefix!: string;

    @prop()
    politicalSystem?: IPoliticalSystem;

    // Channel configurations
}

const GuildModel = getModelForClass(GuildSchema);

export default GuildModel;