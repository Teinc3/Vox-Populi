import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

import GuildCategory, { deleteGuildCategoryDocument } from './GuildCategory.js';
import PoliticalSystem, { deletePoliticalSystemDocument } from './PoliticalSystem.js';
import PoliticalRole, { deletePoliticalSystemRoleDocument } from './PoliticalRole.js';

class GuildSchema {
    @prop({ required: true, unique: true })
    guildID!: string;

    @prop({ required: true })
    isBotOwner!: boolean;

    @prop()
    politicalSystem?: Ref<PoliticalSystem<PoliticalRole>>;
    
    @prop()
    categories?: Ref<GuildCategory>[];

    @prop()
    roles?: Ref<PoliticalRole>[];
}

const GuildModel = getModelForClass(GuildSchema);

async function deleteGuildDocument(guildID: string): Promise<boolean> {
    // Find the guild document
    const guild = await GuildModel.findOne({ guildID });
    if (!guild) {
        return true;
    }
    
    // Obtain all Refs
    const categories = guild.categories;
    const roles = guild.roles;
    const politicalSystem = guild.politicalSystem;
    
    // Delete all categories, roles, and the political system
    for (const category of categories ?? []) {
        await deleteGuildCategoryDocument(category);
    }
    for (const role of roles ?? []) {
        await deletePoliticalSystemRoleDocument(role);
    }
    if (politicalSystem) {
        await deletePoliticalSystemDocument(politicalSystem);
    }

    // Finally delete the guild document and get the result
    const result = await GuildModel.deleteOne({ guildID });
    return result.deletedCount === 1;
}

export default GuildModel;
export { GuildSchema };
export { deleteGuildDocument };