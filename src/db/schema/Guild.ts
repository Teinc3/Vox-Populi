import { prop, Ref, getModelForClass } from '@typegoose/typegoose';

import PoliticalSystem from './PoliticalSystem';
import PoliticalRole from './PoliticalRole.js';

class GuildSchema {
    @prop({ required: true })
    guildID!: string;

    @prop({ required: true })
    prefix!: string;

    @prop()
    politicalSystem?: Ref<PoliticalSystem<PoliticalRole>>;

    // Channel configurations
}

const GuildModel = getModelForClass(GuildSchema);

export default GuildModel;
export { GuildSchema }