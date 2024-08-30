import { getModelForClass, prop, type Ref } from '@typegoose/typegoose';
import type { ChatInputCommandInteraction, Guild } from 'discord.js';

import GuildCategory, { createGuildCategories, deleteGuildCategoryDocument } from './channels/GuildCategory.js';
import PoliticalSystem, { createPoliticalSystemDocument, deletePoliticalSystemDocument } from './PoliticalSystem.js';
import { createPoliticalRoleDocuments } from './roles/PoliticalRole.js';
import PoliticalRoleHolder, {
    createPoliticalRoleHolderDocument,
    deletePoliticalRoleHolderDocument
} from './roles/PoliticalRolesHolder.js';
import { EmergencyOptions } from './options/MiscOptions.js';

import { GuildConfigData } from '../types/types.js';

class GuildSchema {
    @prop({ required: true, unique: true })
    guildID!: string;

    @prop({ required: true })
    isBotOwner!: boolean;

    @prop({ required: true, ref: () => 'PoliticalSystem' })
    politicalSystem!: Ref<PoliticalSystem>;

    @prop({ required: true, _id: false })
    emergencyOptions!: EmergencyOptions
    
    @prop({ default: [], ref: () => 'GuildCategory' })
    categories?: Ref<GuildCategory>[];

    @prop({ required: true, ref: () => 'PoliticalRoleHolder' })
    roles!: Ref<PoliticalRoleHolder>;

    /*
    logs?: Ref<LogSchema>[];
    */
}

const GuildModel = getModelForClass(GuildSchema);

async function createGuildDocument(interaction: ChatInputCommandInteraction, guildConfigData: GuildConfigData, reason?: string) {

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
    
    const { cursor, ...emergencyOptions } = guildConfigData.emergencyOptions;
    guildData.emergencyOptions = emergencyOptions;

    // Create all political roles then link them to the guild document, and generate the role document refs
    const roleHolder = await createPoliticalRoleDocuments(discordGuild, guildConfigData, reason);
    guildData.roles = await createPoliticalRoleHolderDocument(roleHolder);

    // Create special channel categories then link them to the guild document
    guildData.categories = await createGuildCategories(discordGuild, roleHolder, guildConfigData, reason);

    // Create Political System then link them to the guild document
    guildData.politicalSystem = await createPoliticalSystemDocument(guildConfigData, roleHolder);

    // Finally, create the guild document with the proper linkages
    return await GuildModel.create(guildData);
}

async function deleteGuildDocument(guild: Guild, deleteObjects: boolean, reason?: string): Promise<boolean> {
    const guildID = guild.id;
    const guildDocument = await GuildModel.findOneAndDelete({ guildID });
    if (!guildDocument) {
        return false;
    }
    
    // Obtain all Refs
    const categories = guildDocument.categories;
    const roles = guildDocument.roles;
    const politicalSystem = guildDocument.politicalSystem;
    
    // Delete all categories, roles, and the political system concurrently
    const categoryPromises = (categories ?? []).map(category => deleteGuildCategoryDocument(guild, category, deleteObjects, reason));
    const rolePromise = roles ? deletePoliticalRoleHolderDocument(guild, roles, deleteObjects, reason) : Promise.resolve();
    const systemPromise = politicalSystem ? deletePoliticalSystemDocument(politicalSystem) : Promise.resolve();

    await Promise.all([...categoryPromises, rolePromise, systemPromise]);

    return true;
}

export default GuildModel;
export { GuildSchema };
export { createGuildDocument, deleteGuildDocument };