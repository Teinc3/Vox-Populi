import { PermissionFlagsBits } from "discord.js";
const { 
    Administrator, ManageGuild,
    ManageGuildExpressions, ManageEvents, ViewCreatorMonetizationAnalytics, CreateGuildExpressions, CreateEvents, ManageChannels, SendTTSMessages, MentionEveryone, ManageRoles, ManageWebhooks,
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
export const PermissionsCategories = {
    "emergency": {
        overwrites: [],
        static: [Administrator]
    },
    "manage": {
        overwrites: [ManageChannels, SendTTSMessages, MentionEveryone, ManageRoles, ManageWebhooks],
        static: [ManageGuild, ManageGuildExpressions, ManageEvents, ViewCreatorMonetizationAnalytics, CreateGuildExpressions, CreateEvents]
    },
    "moderate": {
        overwrites: [ManageMessages, ManageThreads, MuteMembers, DeafenMembers, MoveMembers, PrioritySpeaker],
        static: [KickMembers, BanMembers, ManageNicknames, ModerateMembers]
    },
    "interact": {
        overwrites: [AddReactions, Stream, EmbedLinks, AttachFiles, UseExternalEmojis, UseVAD, UseApplicationCommands, RequestToSpeak, CreatePublicThreads, CreatePrivateThreads, UseExternalStickers, SendMessagesInThreads, UseEmbeddedActivities, UseSoundboard, UseExternalSounds, SendVoiceMessages, SendPolls],
        static: []
    },
    "send": {
        overwrites: [SendMessages, Speak],
        static: []
    },
    "view": {
        overwrites: [ViewChannel, ReadMessageHistory, Connect],
        static: [CreateInstantInvite, ViewAuditLog, ViewGuildInsights, ChangeNickname]
    }
}

export const discordPermissionOverwritesReference = {
    view: PermissionsCategories.view.overwrites,
    send: PermissionsCategories.send.overwrites,
    interact: PermissionsCategories.interact.overwrites,
    moderate: PermissionsCategories.moderate.overwrites,
    manage: PermissionsCategories.manage.overwrites
};

export type BasePermission = keyof typeof PermissionsCategories;

export enum PermissionsLevel {
    Emergency,
    Manage,
    Moderate,
    Interact,
    Send,
    View
}

export type PermissionsAggregate<T> = Partial<{ start: T, end: T }>;

export type BasePermissionsAggregate = PermissionsAggregate<BasePermission>;

export type PermissionsLevelAggregate = PermissionsAggregate<PermissionsLevel>;

const basePermissionToPermissionsLevel: Record<BasePermission, PermissionsLevel> = {
    "emergency": PermissionsLevel.Emergency,
    "manage": PermissionsLevel.Manage,
    "moderate": PermissionsLevel.Moderate,
    "interact": PermissionsLevel.Interact,
    "send": PermissionsLevel.Send,
    "view": PermissionsLevel.View
}

/**
 * Converts a base permission string to a permissions level enum
 * @param permission 
 * @returns The permissions level enum
 */
export function getPermissionsLevel(permission: BasePermission): PermissionsLevel {
    return basePermissionToPermissionsLevel[permission]
}

export function getPermissionsLevelAggregate(permissions?: BasePermissionsAggregate): PermissionsLevelAggregate {
    if (!permissions) {
        return {};
    }
    
    const permissionsLevelAggregate: PermissionsLevelAggregate = {};
    if (permissions.start) {
        permissionsLevelAggregate.start = getPermissionsLevel(permissions.start);
    }
    if (permissions.end) {
        permissionsLevelAggregate.end = getPermissionsLevel(permissions.end);
    }
    return permissionsLevelAggregate;
}

export interface PermissionsCategory {
    "overwrites": bigint[];
    "static": bigint[];
}

export type CustomPermissionsOverwrite<T> = {
    [key in Exclude<BasePermission, "emergency">]: T[];
}

export type CustomPermissions<T> = CustomPermissionsOverwrite<T> & Partial<Record<"emergency", T[]>>;

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
    for (let i = start; i <= (end ?? categoriesArray.length - 1); i++) {
        permissions.push(...categoriesArray[i].static, ...categoriesArray[i].overwrites);
    }
    return permissions;
}