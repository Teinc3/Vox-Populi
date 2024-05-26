import { prop, Ref, getModelForClass } from '@typegoose/typegoose';

import PoliticalSystem from './PoliticalSystem.js';
import PoliticalRole from './PoliticalRole.js';

class GuildSchema {
    @prop({ required: true })
    guildID!: string;

    @prop({ required: true })
    isBotOwner!: boolean;

    @prop()
    politicalSystem?: Ref<PoliticalSystem<PoliticalRole>>;
    
    /* Guild structure, contains all the channel ID and role ID information
    @prop()
    guildStructure?: Ref<GuildStructure>;
    */
}

const GuildModel = getModelForClass(GuildSchema);

export default GuildModel;
export { GuildSchema }