import { PermissionFlagsBits } from "discord.js";

import { 
    PermissionsLevel, 
    type PermissionsHolderInterface, type PermissionsCategory, type PermissionsOverwriteHolder,
    type BasePermissionsAggregate, type PermissionsLevelAggregate
} from "../types/permissions.js";

const { 
    Administrator,
    ManageGuild, ManageGuildExpressions, ManageEvents, ViewCreatorMonetizationAnalytics, CreateGuildExpressions, CreateEvents, ManageChannels, SendTTSMessages, MentionEveryone, ManageRoles, ManageWebhooks,
    KickMembers, BanMembers, PrioritySpeaker, ManageMessages, MuteMembers, DeafenMembers, MoveMembers, ManageNicknames, ManageThreads, ModerateMembers,
    AddReactions, Stream, EmbedLinks, AttachFiles, UseExternalEmojis, UseVAD, UseApplicationCommands, RequestToSpeak, CreatePublicThreads, CreatePrivateThreads, UseExternalStickers, SendMessagesInThreads, UseEmbeddedActivities, UseSoundboard, UseExternalSounds, SendVoiceMessages, SendPolls, // Set Voice Channel Status, UseExternalApps
    SendMessages, Speak,
    CreateInstantInvite, ViewAuditLog, ViewGuildInsights, ChangeNickname, ViewChannel, ReadMessageHistory, Connect 
} = PermissionFlagsBits;

/**
 * Permissions categories for the bot
 * 
 * Refer to `/docs/permissions.md` for more information
 */
export const PermissionsCategories: PermissionsHolderInterface<PermissionsCategory, true> = {
    emergency: {
        overwrites: [],
        static: [Administrator]
    },
    manage: {
        overwrites: [ManageChannels, SendTTSMessages, MentionEveryone, ManageRoles, ManageWebhooks],
        static: [ManageGuild, ManageGuildExpressions, ManageEvents, ViewCreatorMonetizationAnalytics, CreateGuildExpressions, CreateEvents]
    },
    moderate: {
        overwrites: [ManageMessages, ManageThreads, MuteMembers, DeafenMembers, MoveMembers, PrioritySpeaker],
        static: [KickMembers, BanMembers, ManageNicknames, ModerateMembers]
    },
    interact: {
        overwrites: [AddReactions, Stream, EmbedLinks, AttachFiles, UseExternalEmojis, UseVAD, UseApplicationCommands, RequestToSpeak, CreatePublicThreads, CreatePrivateThreads, UseExternalStickers, SendMessagesInThreads, UseEmbeddedActivities, UseSoundboard, UseExternalSounds, SendVoiceMessages, SendPolls],
        static: []
    },
    send: {
        overwrites: [SendMessages, Speak],
        static: []
    },
    view: {
        overwrites: [ViewChannel, ReadMessageHistory, Connect],
        static: [CreateInstantInvite, ViewAuditLog, ViewGuildInsights, ChangeNickname]
    }
}

export const discordPermissionOverwritesReference: PermissionsOverwriteHolder<bigint> = {
    view: PermissionsCategories.view.overwrites,
    send: PermissionsCategories.send.overwrites,
    interact: PermissionsCategories.interact.overwrites,
    moderate: PermissionsCategories.moderate.overwrites,
    manage: PermissionsCategories.manage.overwrites
};

export function parsePermissionsAggregate(permissions?: BasePermissionsAggregate): PermissionsLevelAggregate {
    if (!permissions) {
        return {};
    }
    
    const permissionsLevelAggregate: PermissionsLevelAggregate = {};
    if (permissions.start) {
        permissionsLevelAggregate.start = PermissionsLevel[permissions.start];
    }
    if (permissions.end) {
        permissionsLevelAggregate.end = PermissionsLevel[permissions.end];
    }
    return permissionsLevelAggregate;
}

/**
 * Automatically assigns all permissions from the highest permission level the role has to the lowest
 * 
 * @param permissionsLevelAggregate The range of permissions levels the role has
 * @returns An array of permissions
 * 
 * @static
 */
export function progressivePermissionsAllocator(permissionsLevelAggregate: PermissionsLevelAggregate): bigint[] {
    const permissions: bigint[] = [];
    const categoriesArray = Object.values(PermissionsCategories);
    const { start, end } = permissionsLevelAggregate;

    // Assuming categoriesArray is already sorted by permission levels
    if (start === undefined) {
        return new Array<bigint>();
    }
    for (let i = start; i <= (end ?? start); i++) {
        permissions.push(...categoriesArray[i].static, ...categoriesArray[i].overwrites);
    }
    return permissions;
}