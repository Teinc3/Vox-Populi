import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';
import { ChannelType, type CategoryChannel, type Guild } from 'discord.js';

import PoliticalChannel from './PoliticalChannel.js';
import type PoliticalRoleHolder from '../roles/PoliticalRoleHolder.js';
import ChannelPermissions, { ChannelPermissionsInterface, type UnfilteredRefRoleArray } from '../permissions/ChannelPermissions.js';
import Chamber from '../Chamber.js';

import { PoliticalBranchType, PoliticalSystemsType, PoliticalRoleHierarchy } from '../../types/types.js';
import { GuildConfigData, DefaultCategoryData } from '../../types/wizard.js';
import { CustomPermissionsOverwrite } from '../../types/permissions.js';

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

    static async createGuildCategories(guild: Guild, roleHolder: PoliticalRoleHolder, guildConfigData: GuildConfigData, reason?: string): Promise<Ref<GuildCategory>[]> {
        const categoryDocuments = new Array<Ref<GuildCategory>>();    
        const { filteredCategoryChannels } = guildConfigData.discordOptions.discordChannelOptions;
    
        for (const extendedCategoryChannelData of filteredCategoryChannels) {
            const { cursor, id: categoryID, ...categoryChannelData } = extendedCategoryChannelData;
            
            const guildCategory = new GuildCategory(categoryChannelData.name, categoryID)
            const guildCategoryDocument = await guildCategory.createGuildCategoryDocument(guild, roleHolder, guildConfigData, categoryChannelData, reason);
            
            if (guildCategoryDocument) {
                categoryDocuments.push(guildCategoryDocument);
            }
        }
        return categoryDocuments;
    }

    static async createPoliticalChannels(guild: Guild, roleHolder: PoliticalRoleHolder, categoryChannel: CategoryChannel, guildConfigData: GuildConfigData, categoryChannelData: DefaultCategoryData, reason?: string): Promise<Ref<PoliticalChannel>[]> {
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
                    // We can push Undefined roles, as if its undefined, it will be filtered out later
                    switch (roleHierarchy) {
                        case PoliticalRoleHierarchy.VoxPopuli:
                            refRoleArray.push(roleHolder.VoxPopuli);
                            break;
                        case PoliticalRoleHierarchy.President:
                            refRoleArray.push(roleHolder.President)
                            break;
                        case PoliticalRoleHierarchy.PrimeMinister:
                            refRoleArray.push(roleHolder.PrimeMinister);
                            break;
                        case PoliticalRoleHierarchy.HeadModerator:
                            if (isDD && !guildConfigData.ddOptions!.appointModerators && !refRoleArray.includes(roleHolder.Citizen)) {
                                refRoleArray.push(roleHolder.Citizen);
                            } else {
                                refRoleArray.push(roleHolder.HeadModerator);
                            }
                            break;
                        case PoliticalRoleHierarchy.Moderator:
                            if (isDD && !guildConfigData.ddOptions!.appointModerators && !refRoleArray.includes(roleHolder.Citizen)) {
                                refRoleArray.push(roleHolder.Citizen);
                            } else {
                                refRoleArray.push(roleHolder.Moderator);
                            }
                            break;
                        case PoliticalRoleHierarchy.Senator:
                            if (isDD && !refRoleArray.includes(roleHolder.Citizen)) {
                                refRoleArray.push(roleHolder.Citizen);
                            } else {
                                refRoleArray.push(roleHolder.Senator);
                            }
                            break;
                        case PoliticalRoleHierarchy.Judge:
                            if (isDD && !guildConfigData.ddOptions!.appointJudges && !refRoleArray.includes(roleHolder.Citizen)) {
                                refRoleArray.push(roleHolder.Citizen);
                            } else {
                                refRoleArray.push(roleHolder.Judge);
                            }
                            break;
                        case PoliticalRoleHierarchy.Citizen:
                            // Prevent duplicates
                            if (!refRoleArray.includes(roleHolder.Citizen)) {
                                refRoleArray.push(roleHolder.Citizen);
                            }
                            break;
                    }                
                }
    
                // Finally run the filter function to remove undefined values
                channelPermissions[key as keyof ChannelPermissionsInterface] = ChannelPermissions.filterRefRoleArray(refRoleArray);
            }
    
            // Create the channel
            const politicalChannel = new PoliticalChannel(defaultChannelData.name, ChannelType.GuildText, channelPermissions, defaultChannelData.description, defaultChannelData.id);
            const politicalChannelDocument = await politicalChannel.createPoliticalChannelDocument(guild, categoryChannel, reason);
            
            if (defaultChannelData.chamberTypeIsLegislative !== undefined) {
                if (defaultChannelData.chamberTypeIsLegislative === true) {
                    await Chamber.linkChamberChannelDocument(guild.id, PoliticalBranchType.Legislative, politicalChannelDocument);
                } else {
                    await Chamber.linkChamberChannelDocument(guild.id, PoliticalBranchType.Judicial, politicalChannelDocument);
                }
            }
    
            newChannelDocuments.push(politicalChannelDocument);
        }
    
        return newChannelDocuments;
    }

    static async deleteGuildCategoryDocument(guild: Guild, categoryDocument: Ref<GuildCategory>, deleteObjects: boolean, reason?: string) {
        // Find the guild category document
        const guildCategory = await GuildCategoryModel.findOneAndDelete({ _id: categoryDocument });
        if (!guildCategory) {
            return;
        }
    
        const deleteChannelPromises = (guildCategory.channels ?? []).map(channel => PoliticalChannel.deletePoliticalChannelDocument(guild, channel, deleteObjects, reason));
        const deleteCategoryPromise = deleteObjects ? guildCategory.deleteDiscordCategory(guild, reason) : Promise.resolve();
    
        await Promise.all([...deleteChannelPromises, deleteCategoryPromise]);
    }

    async createGuildCategoryDocument(guild: Guild, roleHolder: PoliticalRoleHolder, guildConfigData: GuildConfigData, categoryChannelData: DefaultCategoryData, reason?: string): Promise<Ref<GuildCategory> | false> {
        // Create and link the category to the object first
        await this.linkDiscordCategory(guild, reason);
        const categoryChannel = await guild.channels.fetch(this.categoryID!);
        if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
            throw new Error("Failed to fetch category channel");
        }
    
        // Triage channels for executive (moderation), legislative, and judicial
        // We funnel the appropriate roles (obtained from roleHolder) to these channels
        this.channels = await GuildCategory.createPoliticalChannels(guild, roleHolder, categoryChannel, guildConfigData, categoryChannelData, reason);
        
        if (this.channels.length === 0) {
            await this.deleteDiscordCategory(guild, reason); // No channels in the category, delete it
            return false;
        }
        return await GuildCategoryModel.create(this);
    }

    async linkDiscordCategory(guild: Guild, reason?: string) {
        const { name } = this;
    
        // Fetch the cache
        if (guild.channels.cache.size === 0) {
            await guild.channels.fetch();
        }
        let categoryChannel: CategoryChannel | undefined;
    
        // If the categoryID is not already defined, create a new category
        if (!this.categoryID) {
            categoryChannel = await guild.channels.create({ name, type: ChannelType.GuildCategory, reason });
            this.categoryID = categoryChannel.id;
        } else {
            categoryChannel = (await guild.channels.fetch(this.categoryID) ?? undefined) as CategoryChannel | undefined;
            // If the channel doesn't exist, create a new one instead
            if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
                this.categoryID = undefined;
                await this.linkDiscordCategory(guild, reason);
            }
        }
    }

    async deleteDiscordCategory(guild: Guild, reason?: string) {
        // Find the category
        if (!this.categoryID) {
            return;
        }
        const categoryChannel = await guild.channels.fetch(this.categoryID) as CategoryChannel | null;
        if (categoryChannel) {
            await categoryChannel.delete(reason);
        }
    }
}

const GuildCategoryModel = getModelForClass(GuildCategory);

export default GuildCategory;
export { GuildCategoryModel };