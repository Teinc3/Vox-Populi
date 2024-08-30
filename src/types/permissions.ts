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
const PermissionsCategories = {
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

enum PermissionsLevel {
    Emergency,
    Manage,
    Moderate,
    Interact,
    Send,
    View
}

interface PermissionsCategory {
    "overwrites": bigint[];
    "static": bigint[];
}

export { PermissionsCategories, PermissionsCategory, PermissionsLevel };