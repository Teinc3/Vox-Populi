import { prop, Ref, getModelForClass } from '@typegoose/typegoose';

import PoliticalSystem from './PoliticalSystem';
import PoliticalRole from './PoliticalRole.js';

class GuildSchema {
    @prop({ required: true })
    guildID!: string;

    @prop({ required: true })
    prefix!: string;

    @prop({ required: true })
    isBotOwner!: boolean;

    @prop()
    politicalSystem?: Ref<PoliticalSystem<PoliticalRole>>;
}

const GuildModel = getModelForClass(GuildSchema);

export default GuildModel;
export { GuildSchema }