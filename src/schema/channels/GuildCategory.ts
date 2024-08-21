import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';
import { ChannelType, type CategoryChannel, type Guild } from 'discord.js';

import PoliticalChannel, { createPoliticalChannelDocument, deletePoliticalChannelDocument } from './PoliticalChannel.js';
import type PoliticalRoleHolder from '../roles/PoliticalRolesHolder.js';
import ChannelPermissions, { filterRefRoleArray, type UnfilteredRefRoleArray } from '../permissions/ChannelPermissions.js';
import { linkChamberChannelDocument } from '../Chamber.js';

import { GuildConfigData, PoliticalBranchType, PoliticalSystemsType, DefaultChannelData, CustomPermissionsOverwrite } from '../../types/types.js';
import channelDefaults from '../../data/defaults/channels.json' assert { type: "json" };

/**
 * Represents a Category that contains Political Channels.
 * 
 * A Discord CategoryChannel can be linked to a GuildCategory.
 * 
 * @property {string} name - The name of the category channel as shown in Discord
 * @property {string} description - The description of the category channel as shown in Discord
 * @property {string} [categoryID] - The ID of the Discord CategoryChannel
 * @property {Array} [channels] - The Political Channels that are linked to this category
 * 
 * @class
 * 
 * @see {@link https://discord.js.org/docs/packages/discord.js/main/CategoryChannel:Class}
 */
class GuildCategory {
    constructor(name: string, description?: string) {
        this.name = name;
        this.description = description || "";
    }

    @prop({ required: true })
    name!: string;

    @prop({ required: true })
    description!: string;

    @prop()
    categoryID?: string;

    @prop({ ref: () => 'PoliticalChannel' })
    channels?: Ref<PoliticalChannel>[];
}

const GuildCategoryModel = getModelForClass(GuildCategory);

async function createGuildCategories(guild: Guild, roleHolder: PoliticalRoleHolder, guildConfigData: GuildConfigData, reason?: string): Promise<Ref<GuildCategory>[]> {
    const categoryDocuments = new Array<Ref<GuildCategory>>();    
    for (const category of channelDefaults) {
        const guildCategoryDocument = await createGuildCategoryDocument(guild, new GuildCategory(category.name, category.description), roleHolder, guildConfigData, category.channels, reason);
        if (guildCategoryDocument) {
            categoryDocuments.push(guildCategoryDocument);
        }
    }
    return categoryDocuments;
}

async function createGuildCategoryDocument(guild: Guild, guildCategory: GuildCategory, roleHolder: PoliticalRoleHolder, guildConfigData: GuildConfigData, defaultChannelsData: DefaultChannelData[], reason?: string): Promise<Ref<GuildCategory> | false> {
    // Create and link the category to the object first
    guildCategory = await linkDiscordCategory(guild, guildCategory, reason);
    const categoryChannel = await guild.channels.fetch(guildCategory.categoryID!);
    if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
        throw new Error("Failed to fetch category channel");
    }

    // Triage channels for executive (moderation), legislative, and judicial
    // We funnel the appropriate roles (obtained from roleHolder) to these channels
    guildCategory.channels = await createPoliticalChannels(guild, roleHolder, categoryChannel, guildConfigData, defaultChannelsData, reason);
    if (guildCategory.channels.length === 0) {
        await unlinkDiscordCategory(guild, guildCategory.categoryID, reason); // No channels in the category, delete it
        return false;
    }
    return await GuildCategoryModel.create(guildCategory);
}

async function createPoliticalChannels(guild: Guild, roleHolder: PoliticalRoleHolder, categoryChannel: CategoryChannel, guildConfigData: GuildConfigData, defaultChannelsData: DefaultChannelData[], reason?: string): Promise<Ref<PoliticalChannel>[]> {
    const newChannelDocuments = new Array<Ref<PoliticalChannel>>();
    const isDD = guildConfigData.politicalSystem === PoliticalSystemsType.DirectDemocracy; 
    
    for (const defaultChannelData of defaultChannelsData) {
        const { disable, permissionOverwrites } = defaultChannelData;

        // Skip creating the channel if it is disabled by our config
        const isDDMatch = disable?.isDD === isDD;
        const appointJudgesMatch = disable?.appointJudges === undefined ? true : disable?.appointJudges === guildConfigData.ddOptions?.appointJudges;
        const appointModeratorsMatch = disable?.appointModerators === undefined ? true : disable?.appointModerators === guildConfigData.ddOptions?.appointModerators;
        if (disable && isDDMatch && appointJudgesMatch && appointModeratorsMatch) {
            continue;
        }

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
        const politicalChannelDocument = await createPoliticalChannelDocument(guild, new PoliticalChannel(defaultChannelData.name, ChannelType.GuildText, channelPermissions, defaultChannelData.description), categoryChannel, reason);
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

async function deleteGuildCategoryDocument(guild: Guild, categoryDocument: Ref<GuildCategory>, reason?: string) {
    // Find the guild category document
    const guildCategory = await GuildCategoryModel.findOneAndDelete({ _id: categoryDocument });
    if (!guildCategory) {
        return;
    }

    const deleteChannelPromises = (guildCategory.channels ?? []).map(channel => deletePoliticalChannelDocument(guild, channel, reason));
    const unlinkCategoryPromise = unlinkDiscordCategory(guild, guildCategory.categoryID, reason);

    await Promise.all([...deleteChannelPromises, unlinkCategoryPromise]);
}

async function linkDiscordCategory(guild: Guild, guildCategory: GuildCategory, reason?: string): Promise<GuildCategory> {
    const { name } = guildCategory;

    // Fetch the cache
    if (guild.channels.cache.size === 0) {
        await guild.channels.fetch();
    }
    // Find the category
    let categoryChannel = guild.channels.cache.find(channel => channel.type === ChannelType.GuildCategory && channel.name === name) as CategoryChannel;

    // If the category does not exist, create it
    if (!categoryChannel) {
        // Create the category
        categoryChannel = await guild.channels.create({ name, type: ChannelType.GuildCategory, reason });

        if (!categoryChannel) {
            throw new Error("Failed to create category channel");
        }
        guildCategory.categoryID = categoryChannel.id;

    } else { // If the category exists, Delete the category and all its channels
        await unlinkDiscordCategory(guild, categoryChannel.id, reason);
        return await linkDiscordCategory(guild, guildCategory, reason);

    }
    return guildCategory;
}

async function unlinkDiscordCategory(guild: Guild, categoryID: string | undefined, reason?: string) {
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