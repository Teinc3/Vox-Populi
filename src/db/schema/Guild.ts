import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

import GuildCategory, { deleteGuildCategoryDocument } from './GuildCategory.js';
import PoliticalSystem, { createPoliticalSystemDocument, deletePoliticalSystemDocument } from './PoliticalSystem.js';
import { createPoliticalRoleDocuments } from './PoliticalRole.js';
import PoliticalRoleHolder, { createPoliticalRoleHolderDocument, deletePoliticalRoleHolderDocument } from './PoliticalRolesHolder.js';

import { PoliticalSystemsType } from '../../types/static.js';
import constants from '../../data/constants.json' assert { type: "json" };

class GuildSchema {
    @prop({ required: true, unique: true })
    guildID!: string;

    @prop({ required: true })
    isBotOwner!: boolean;

    @prop({ required: true, ref: () => 'PoliticalSystem' })
    politicalSystem!: Ref<PoliticalSystem>;
    
    @prop({ default: new Array(), ref: () => 'GuildCategory' })
    categories?: Ref<GuildCategory>[];

    @prop({ required: true, ref: () => 'PoliticalRoleHolder' })
    roles!: Ref<PoliticalRoleHolder>;

    /*
    logs?: Ref<LogSchema>[];
    */
}

const GuildModel = getModelForClass(GuildSchema);

async function createGuildDocument(
    guildID: string,
    isBotOwner: boolean,
    politicalystemType: PoliticalSystemsType
): Promise<boolean> {

    const existingGuild = await GuildModel.findOne({ guildID });
    if (existingGuild !== null) {
        return false;
    }

    const guildData = new GuildSchema();
    guildData.guildID = guildID;
    guildData.isBotOwner = isBotOwner;

    const isCombinedCourt = constants.mechanics.court.isCombinedCourt

    // Create all political roles then link them to the guild document, and generate the role document refs
    const roleHolder = await createPoliticalRoleDocuments(politicalystemType, isCombinedCourt);
    guildData.roles = await createPoliticalRoleHolderDocument(roleHolder);

    // Create Political System then link them to the guild document
    const politicalSystem = await createPoliticalSystemDocument(politicalystemType, isCombinedCourt, roleHolder);
    guildData.politicalSystem = politicalSystem;

    // Finally, create the guild document with the proper linkages
    await GuildModel.create(guildData);
    return true
}

async function deleteGuildDocument(guildID: string): Promise<boolean> {
    const guild = await findGuildDocument(guildID);
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
    if (roles) {
        await deletePoliticalRoleHolderDocument(roles);
    }
    if (politicalSystem) {
        await deletePoliticalSystemDocument(politicalSystem);
    }

    // Finally delete the guild document and get the result
    const result = await GuildModel.deleteOne({ guildID });
    return result.deletedCount >= 1;
}

async function findGuildDocument(guildID: string): Promise<GuildSchema | null> {
    return await GuildModel.findOne({ guildID });
}

export default GuildModel;
export { GuildSchema };
export { createGuildDocument, deleteGuildDocument, findGuildDocument };