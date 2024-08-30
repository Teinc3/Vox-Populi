import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';
import { ChannelType, type CategoryChannel, type Guild } from 'discord.js';

import PoliticalChannel, { createPoliticalChannelDocument, deletePoliticalChannelDocument } from './PoliticalChannel.js';
import type PoliticalRoleHolder from '../roles/PoliticalRolesHolder.js';
import ChannelPermissions, { filterRefRoleArray, type UnfilteredRefRoleArray } from '../permissions/ChannelPermissions.js';
import { linkChamberChannelDocument } from '../Chamber.js';

import { GuildConfigData, PoliticalBranchType, PoliticalSystemsType, DefaultChannelData, CustomPermissionsOverwrite, DefaultCategoryData } from '../../types/types.js';

/**
 * Represents a Category that contains Political Channels.
 * 
 * A Discord CategoryChannel can be linked to a GuildCategory.
 * 
 * @property {string} name - The name of the category channel as shown in Discord
 * @property {string} [categoryID] - The ID of the Discord CategoryChannel
 * @property {Array} [channels] - The Political Channels that are linked to this category
 * 
 * @class
 * 
 * @see {@link https://discord.js.org/docs/packages/discord.js/main/CategoryChannel:Class}
 */
class GuildCategory {
    constructor(name: string, categoryID?: string) {
        this.name = name;
        this.categoryID = categoryID
    }

    @prop({ required: true })
    name!: string;

    @prop()
    categoryID?: string;

    @prop({ ref: () => 'PoliticalChannel' })
    channels?: Ref<PoliticalChannel>[];
}

const GuildCategoryModel = getModelForClass(GuildCategory);

async function createGuildCategories(guild: Guild, roleHolder: PoliticalRoleHolder, guildConfigData: GuildConfigData, reason?: string): Promise<Ref<GuildCategory>[]> {
    const categoryDocuments = new Array<Ref<GuildCategory>>();    
    const { filteredCategoryChannels } = guildConfigData.discordOptions.discordChannelOptions;

    for (const extendedCategoryChannelData of filteredCategoryChannels) {
        const { cursor, id: categoryID, ...categoryChannelData } = extendedCategoryChannelData;
        const guildCategoryDocument = await createGuildCategoryDocument(guild, new GuildCategory(categoryChannelData.name, categoryID), roleHolder, guildConfigData, categoryChannelData, reason);
        if (guildCategoryDocument) {
            categoryDocuments.push(guildCategoryDocument);
        }
    }
    return categoryDocuments;
}

async function createGuildCategoryDocument(guild: Guild, guildCategory: GuildCategory, roleHolder: PoliticalRoleHolder, guildConfigData: GuildConfigData, categoryChannelData: DefaultCategoryData, reason?: string): Promise<Ref<GuildCategory> | false> {
    // Create and link the category to the object first
    guildCategory = await linkDiscordCategory(guild, guildCategory, reason);
    const categoryChannel = await guild.channels.fetch(guildCategory.categoryID!);
    if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
        throw new Error("Failed to fetch category channel");
    }

    // Triage channels for executive (moderation), legislative, and judicial
    // We funnel the appropriate roles (obtained from roleHolder) to these channels
    guildCategory.channels = await createPoliticalChannels(guild, roleHolder, categoryChannel, guildConfigData, categoryChannelData, reason);
    if (guildCategory.channels.length === 0) {
        await deleteDiscordCategory(guild, guildCategory.categoryID, reason); // No channels in the category, delete it
        return false;
    }
    return await GuildCategoryModel.create(guildCategory);
}

async function createPoliticalChannels(guild: Guild, roleHolder: PoliticalRoleHolder, categoryChannel: CategoryChannel, guildConfigData: GuildConfigData, categoryChannelData: DefaultCategoryData, reason?: string): Promise<Ref<PoliticalChannel>[]> {
    const newChannelDocuments = new Array<Ref<PoliticalChannel>>();
    const isDD = guildConfigData.politicalSystem === PoliticalSystemsType.DirectDemocracy; 
    
    for (const defaultChannelData of categoryChannelData.channels) {
        const { permissionOverwrites } = defaultChannelData;

        // Parse permissions
        const channelPermissions = new ChannelPermissions();
        for (const key in permissionOverwrites) {
            const refRoleArray: UnfilteredRefRoleArray = [];
            for (const roleHierarchy of permissionOverwrites[key as keyof CustomPermissionsOverwrite<number>]) {
                // Obtain role from roleHolder
                switch (roleHierarchy) {
                    case 0: // VoxPopuli
                        refRoleArray.push(roleHolder.VoxPopuli);
                        break;
                    case 1: // President OR PrimeMinisters
                        // We can double push here because the roleHolder will return undefined if the role does not exist
                        refRoleArray.push(roleHolder.President)
                        refRoleArray.push(roleHolder.PrimeMinister);
                        break;
                    case 2: // HeadModerator
                        if (isDD && !guildConfigData.ddOptions!.appointModerators && !refRoleArray.includes(roleHolder.Citizen)) {
                            refRoleArray.push(roleHolder.Citizen);
                        } else {
                            refRoleArray.push(roleHolder.HeadModerator);
                        }
                        break;
                    case 3: // Moderator
                        if (isDD && !guildConfigData.ddOptions!.appointModerators && !refRoleArray.includes(roleHolder.Citizen)) {
                            refRoleArray.push(roleHolder.Citizen);
                        } else {
                            refRoleArray.push(roleHolder.Moderator);
                        }
                        break;
                    case 4: // Senator
                        if (isDD && !refRoleArray.includes(roleHolder.Citizen)) {
                            refRoleArray.push(roleHolder.Citizen);
                        } else {
                            refRoleArray.push(roleHolder.Senator);
                        }
                        break;
                    case 5: // Judge
                        if (isDD && !guildConfigData.ddOptions!.appointJudges && !refRoleArray.includes(roleHolder.Citizen)) {
                            refRoleArray.push(roleHolder.Citizen);
                        } else {
                            refRoleArray.push(roleHolder.Judge);
                        }
                        break;
                    case 6: // Citizen
                        // Prevent duplicates
                        if (!refRoleArray.includes(roleHolder.Citizen)) {
                            refRoleArray.push(roleHolder.Citizen);
                        }
                        break;
                }                
            }

            // Finally run the filter function to remove undefined values
            channelPermissions[key as keyof ChannelPermissions] = filterRefRoleArray(refRoleArray);
        }

        // Create the channel
        const politicalChannelDocument = await createPoliticalChannelDocument(guild, new PoliticalChannel(defaultChannelData.name, ChannelType.GuildText, channelPermissions, defaultChannelData.description, defaultChannelData.id), categoryChannel, reason);
        if (defaultChannelData.chamberTypeIsLegislative !== undefined) {
            if (defaultChannelData.chamberTypeIsLegislative === true) {
                await linkChamberChannelDocument(guild.id, PoliticalBranchType.Legislative, politicalChannelDocument);
            } else {
                await linkChamberChannelDocument(guild.id, PoliticalBranchType.Judicial, politicalChannelDocument);
            }
        }

        newChannelDocuments.push(politicalChannelDocument);
    }

    return newChannelDocuments;
}

async function deleteGuildCategoryDocument(guild: Guild, categoryDocument: Ref<GuildCategory>, deleteObjects: boolean, reason?: string) {
    // Find the guild category document
    const guildCategory = await GuildCategoryModel.findOneAndDelete({ _id: categoryDocument });
    if (!guildCategory) {
        return;
    }

    const deleteChannelPromises = (guildCategory.channels ?? []).map(channel => deletePoliticalChannelDocument(guild, channel, deleteObjects, reason));
    const deleteCategoryPromise = deleteObjects ? deleteDiscordCategory(guild, guildCategory.categoryID, reason) : Promise.resolve();

    await Promise.all([...deleteChannelPromises, deleteCategoryPromise]);
}

async function linkDiscordCategory(guild: Guild, guildCategory: GuildCategory, reason?: string): Promise<GuildCategory> {
    const { name } = guildCategory;

    // Fetch the cache
    if (guild.channels.cache.size === 0) {
        await guild.channels.fetch();
    }
    let categoryChannel: CategoryChannel | undefined;

    // If the categoryID is not already defined, create a new category
    if (!guildCategory.categoryID) {
        categoryChannel = await guild.channels.create({ name, type: ChannelType.GuildCategory, reason });
        guildCategory.categoryID = categoryChannel.id;
    } else {
        categoryChannel = (await guild.channels.fetch(guildCategory.categoryID) ?? undefined) as CategoryChannel | undefined;
        // If the channel doesn't exist, create a new one instead
        if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
            guildCategory.categoryID = undefined;
            return await linkDiscordCategory(guild, guildCategory, reason);
        }
    }
    
    return guildCategory;
}

async function deleteDiscordCategory(guild: Guild, categoryID: string | undefined, reason?: string) {
    // Find the category
    if (!categoryID) {
        return;
    }
    const categoryChannel = await guild.channels.fetch(categoryID) as CategoryChannel | null;
    if (categoryChannel) {
        await categoryChannel.delete(reason);
    }
}

export default GuildCategory;
export { GuildCategoryModel };
export { createGuildCategories, deleteGuildCategoryDocument };