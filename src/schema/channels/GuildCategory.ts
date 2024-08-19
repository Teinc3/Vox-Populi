import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { type CategoryChannel, ChannelType, type Guild } from 'discord.js';

import PoliticalChannel, { createPoliticalChannelDocument, deletePoliticalChannelDocument } from './PoliticalChannel.js';
import type PoliticalRoleHolder from '../roles/PoliticalRolesHolder.js';
import { filterRefRoleArray } from '../permissions/ChannelPermissions.js';
import { linkChamberChannelDocument } from '../Chamber.js';

import { GuildConfigData, PoliticalBranchType, PoliticalSystemsType } from '../../types/types.js';

class GuildCategory {
    constructor(name: string) {
        this.name = name;
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
    categoryDocuments.push(await createGuildCategoryDocument(guild, new GuildCategory("Executive"), roleHolder, guildConfigData, reason));
    categoryDocuments.push(await createGuildCategoryDocument(guild, new GuildCategory("Legislative"), roleHolder, guildConfigData, reason));
    categoryDocuments.push(await createGuildCategoryDocument(guild, new GuildCategory("Judicial"), roleHolder, guildConfigData, reason));
    if (guildConfigData.politicalSystem !== PoliticalSystemsType.DirectDemocracy) {
        categoryDocuments.push(await createGuildCategoryDocument(guild, new GuildCategory("Electoral"), roleHolder, guildConfigData, reason));
    }

    return categoryDocuments;
}

async function createGuildCategoryDocument(guild: Guild, guildCategory: GuildCategory, roleHolder: PoliticalRoleHolder, guildConfigData: GuildConfigData, reason?: string): Promise<Ref<GuildCategory>> {
    // Create and link the category to the object first
    guildCategory = await linkDiscordCategory(guild, guildCategory, reason);
    const categoryChannel = await guild.channels.fetch(guildCategory.categoryID!);
    if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
        throw new Error("Failed to fetch category channel");
    }

    // Triage channels for executive (moderation), legislative, and judicial
    // We funnel the appropriate roles (obtained from roleHolder) to these channels
    guildCategory.channels = await createPoliticalChannels(guildCategory, guild, roleHolder, categoryChannel, guildConfigData, reason);

    return await GuildCategoryModel.create(guildCategory);
}

async function createPoliticalChannels(guildCategory: GuildCategory, guild: Guild, roleHolder: PoliticalRoleHolder, categoryChannel: CategoryChannel, guildConfigData: GuildConfigData, reason?: string | undefined): Promise<Ref<PoliticalChannel>[]> {
    const newChannelDocuments = new Array<Ref<PoliticalChannel>>();
    const isDD = guildConfigData.politicalSystem === PoliticalSystemsType.DirectDemocracy; 

    switch (guildCategory.name) {
        case "Executive":
            // Announcements and Admin office are only for Hierarchical systems
            if (!isDD) {
                newChannelDocuments.push(await createPoliticalChannelDocument(guild, new PoliticalChannel("announcements", ChannelType.GuildText, {
                    whoCanView: [],
                    whoCanInteract: [roleHolder.Citizen],
                    whoCanSend: filterRefRoleArray([roleHolder.President, roleHolder.PrimeMinister, roleHolder.HeadModerator]),
                    whoCanModerate: filterRefRoleArray([roleHolder.President, roleHolder.PrimeMinister, roleHolder.HeadModerator]),
                    whoCanManage: filterRefRoleArray([roleHolder.President, roleHolder.PrimeMinister])
                }), categoryChannel, reason));

                newChannelDocuments.push(await createPoliticalChannelDocument(guild, new PoliticalChannel("admin-office", ChannelType.GuildText, {
                    whoCanView: filterRefRoleArray([roleHolder.President, roleHolder.PrimeMinister, roleHolder.HeadModerator]),
                    whoCanInteract: [],
                    whoCanSend: [],
                    whoCanModerate: filterRefRoleArray([roleHolder.President, roleHolder.PrimeMinister, roleHolder.HeadModerator]),
                    whoCanManage: filterRefRoleArray([roleHolder.President, roleHolder.PrimeMinister])
                }), categoryChannel, reason));
            }

            if (!isDD || guildConfigData.ddOptions!.appointModerators) {
                newChannelDocuments.push(await createPoliticalChannelDocument(guild, new PoliticalChannel("moderator-lounge", ChannelType.GuildText, {
                    whoCanView: filterRefRoleArray([roleHolder.President, roleHolder.PrimeMinister, roleHolder.HeadModerator, roleHolder.Moderator]),
                    whoCanInteract: [],
                    whoCanSend: [],
                    whoCanModerate: filterRefRoleArray([roleHolder.HeadModerator]),
                    whoCanManage: filterRefRoleArray([roleHolder.President, roleHolder.PrimeMinister, roleHolder.HeadModerator])
                }), categoryChannel, reason));
            }

            newChannelDocuments.push(await createPoliticalChannelDocument(guild, new PoliticalChannel("server-logs", ChannelType.GuildText, {
                whoCanView: [],
                whoCanInteract: [],
                whoCanSend: [roleHolder.VoxPopuli],
                whoCanModerate: [roleHolder.VoxPopuli],
                whoCanManage: [roleHolder.VoxPopuli]
            }), categoryChannel, reason));

            newChannelDocuments.push(await createPoliticalChannelDocument(guild, new PoliticalChannel("chat-logs", ChannelType.GuildText, {
                // Chat logs only for moderators. If mods not appointed in DD, then available to everyone.
                whoCanView: isDD && !guildConfigData.ddOptions!.appointModerators ? [roleHolder.Citizen] : filterRefRoleArray([roleHolder.President, roleHolder.PrimeMinister, roleHolder.HeadModerator, roleHolder.Moderator]),
                whoCanInteract: [],
                whoCanSend: [roleHolder.VoxPopuli],
                whoCanModerate: [roleHolder.VoxPopuli],
                whoCanManage: [roleHolder.VoxPopuli]
            }), categoryChannel, reason));
            break;

        case "Legislative":
            const legislatureChamberChannelDocument = await createPoliticalChannelDocument(guild, new PoliticalChannel(isDD ? "referendum" : "senate-voting", ChannelType.GuildText, {
                whoCanView: [],
                whoCanInteract: isDD ? [roleHolder.Citizen] : filterRefRoleArray([roleHolder.Senator]),
                whoCanSend: [roleHolder.VoxPopuli], // Cant send messages to the senate, but can talk in the senate-lounge
                whoCanModerate: [roleHolder.VoxPopuli],
                whoCanManage: [roleHolder.VoxPopuli]
            }), categoryChannel, reason)
            newChannelDocuments.push(legislatureChamberChannelDocument);
            await linkChamberChannelDocument(guild.id, PoliticalBranchType.Legislative, legislatureChamberChannelDocument);
            
            if (!isDD) { // No need senate discussions in DD, because referendums are the main way to pass laws
                newChannelDocuments.push(await createPoliticalChannelDocument(guild, new PoliticalChannel("senate", ChannelType.GuildText, {
                    whoCanView: [],
                    whoCanInteract: filterRefRoleArray([roleHolder.Senator]),
                    whoCanSend: filterRefRoleArray([roleHolder.Senator]),
                    whoCanModerate: [roleHolder.VoxPopuli],
                    whoCanManage: [roleHolder.VoxPopuli]
                }), categoryChannel, reason));
            }
            break;

        case "Judicial":
            // We create this channel: "courtroom"
            const permsArray = isDD && !guildConfigData.ddOptions!.appointJudges ? [roleHolder.Citizen] : filterRefRoleArray([roleHolder.Judge]);
            const courtroomChannelDocument = await createPoliticalChannelDocument(guild, new PoliticalChannel("courtroom", ChannelType.GuildText, {
                whoCanView: [],
                whoCanInteract: permsArray,
                whoCanSend: permsArray,
                whoCanModerate: [roleHolder.VoxPopuli],
                whoCanManage: [roleHolder.VoxPopuli]
            }), categoryChannel, reason);
            newChannelDocuments.push(courtroomChannelDocument);
            await linkChamberChannelDocument(guild.id, PoliticalBranchType.Judicial, courtroomChannelDocument);
            break;

        case "Electoral": // This should not be available in Direct Democracy
            // We create this channel: "elections"
            newChannelDocuments.push(await createPoliticalChannelDocument(guild, new PoliticalChannel("elections", ChannelType.GuildText, {
                whoCanView: [],
                whoCanInteract: [roleHolder.Citizen],
                whoCanSend: [roleHolder.VoxPopuli],
                whoCanModerate: [roleHolder.VoxPopuli],
                whoCanManage: [roleHolder.VoxPopuli]
            }), categoryChannel, reason));
            break;
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