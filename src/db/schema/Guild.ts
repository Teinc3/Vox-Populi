import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import type { Guild, ChatInputCommandInteraction } from 'discord.js';

import GuildCategory, { createGuildCategories, deleteGuildCategoryDocument } from './GuildCategory.js';
import PoliticalSystem, { createPoliticalSystemDocument, deletePoliticalSystemDocument } from './PoliticalSystem.js';
import { createPoliticalRoleDocuments } from './PoliticalRole.js';
import PoliticalRoleHolder, { createPoliticalRoleHolderDocument, deletePoliticalRoleHolderDocument } from './PoliticalRolesHolder.js';

import { PoliticalSystemsType, type DDChamberOptions } from '../../types/static.js';
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

async function createGuildDocument(interaction: ChatInputCommandInteraction, politicalystemType: PoliticalSystemsType, reason?: string): Promise<boolean> {

    const discordGuild = interaction.guild!;
    const guildID = discordGuild.id;
    const isBotOwner = discordGuild.ownerId === interaction.client.user.id;

    const existingGuild = await GuildModel.findOne({ guildID });
    if (existingGuild !== null) {
        return false;
    }

    const guildData = new GuildSchema();
    guildData.guildID = guildID;
    guildData.isBotOwner = isBotOwner;

    const defaultChamberOptions = {
        isReferendum: politicalystemType === PoliticalSystemsType.DirectDemocracy,
        appointModerators: constants.mechanics.directDemocracy.appointModerators,
        appointJudges: constants.mechanics.directDemocracy.appointJudges
    } as DDChamberOptions;

    // Create all political roles then link them to the guild document, and generate the role document refs
    const roleHolder = await createPoliticalRoleDocuments(discordGuild, politicalystemType, defaultChamberOptions, reason);
    guildData.roles = await createPoliticalRoleHolderDocument(roleHolder);

    // Create special channel categories then link them to the guild document
    const guildCategories = await createGuildCategories(discordGuild, roleHolder, defaultChamberOptions, reason);
    guildData.categories = guildCategories;

    // Create Political System then link them to the guild document
    const politicalSystem = await createPoliticalSystemDocument(politicalystemType, roleHolder);
    guildData.politicalSystem = politicalSystem;

    // Finally, create the guild document with the proper linkages
    await GuildModel.create(guildData);
    return true
}

async function deleteGuildDocument(guild: Guild): Promise<boolean> {
    const guildID = guild.id;
    const guildDocument = await findGuildDocument(guildID);
    if (!guildDocument) {
        return true;
    }
    
    // Obtain all Refs
    const categories = guildDocument.categories;
    const roles = guildDocument.roles;
    const politicalSystem = guildDocument.politicalSystem;
    
    // Delete all categories, roles, and the political system
    for (const category of categories ?? []) {
        await deleteGuildCategoryDocument(category);
    }
    if (roles) {
        await deletePoliticalRoleHolderDocument(guild, roles);
    }
    if (politicalSystem) {
        await deletePoliticalSystemDocument(guild, politicalSystem);
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