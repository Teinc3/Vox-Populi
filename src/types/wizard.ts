import type { ButtonStyle, Colors } from "discord.js";

import type { SeatOptions, TermOptions, ThresholdOptions } from "../schema/options/RoleOptions.js";
import type { DDOptions } from "../schema/options/SystemOptions.js";
import type { EmergencyOptions } from "../schema/options/MiscOptions.js";

import { PoliticalSystemType } from "./systems.js";
import { PoliticalRoleHierarchy, type BasePermissionsAggregate, type PermissionsOverwriteEnumKeyHolder } from "./permissions.js";
import { type LogChannelTypeKeys, TicketType } from "./events.js";

interface CursorOption { cursor: number };

export interface GuildConfigData {
    politicalSystem: PoliticalSystemType;
    presidentialOptions?: TermOptions & CursorOption;
    parliamentaryOptions?: {
        snapElection: number;
    }
    ddOptions?: DDOptions;
    senateOptions?: {
        terms: TermOptions & CursorOption;
        seats: SeatOptions;
        threshold: ThresholdOptions & CursorOption;
    },
    referendumThresholds?: ThresholdOptions & CursorOption;
    courtOptions?: {
        terms: TermOptions & CursorOption;
        seats: SeatOptions;
        threshold: ThresholdOptions; // Since only one threshold is needed, no need to store current rotation on cursor
    };
    emergencyOptions: EmergencyOptions & CursorOption;
    discordOptions: DiscordOptions;
}

interface DiscordOptions {
    roleOptions: DiscordRoleOptionsData;
    discordChannelOptions: DiscordChannelOptionsData;
}

export type DiscordRoleHolderData = Array<ExtendedDefaultDiscordData<DefaultRoleData>>

type DiscordRoleOptionsData = {
    baseRoles: DiscordRoleHolderData; // This won't be accessed, just to hold the role data and prevent garbage collection
    filteredRoles: DiscordRoleHolderData;
} & CursorOption;

export interface DefaultRoleData {
    name: string;
    hierarchy: PoliticalRoleHierarchy;
    color: string;
    basePermissions?: BasePermissionsAggregate;
}

export type NewCategoryChannelData = ExtendedDefaultDiscordData<DefaultCategoryData>[];

type DiscordChannelOptionsData = {
    baseCategoryChannels: ExtendedDefaultDiscordData<DefaultCategoryData>[];
    filteredCategoryChannels: ExtendedDefaultDiscordData<DefaultCategoryData>[];
    isCursorOnCategory: boolean;
} & CursorOption;

export interface DefaultCategoryData {
    name: string;
    channels: ExtendedDefaultDiscordData<DefaultChannelData>[];
}

interface DefaultChannelData {
    name: string;
    description: string;
    permissionOverwrites: PermissionsOverwriteEnumKeyHolder;
    disable?: Partial<DDOptions> & {
        isDD?: boolean;
    };
    chamberTypeIsLegislative?: boolean;
    tickets?: DefaultTicketData;
    logChannel?: LogChannelTypeKeys;
}

export interface DefaultTicketData {
    title: string;
    description: string;
    color?: keyof typeof Colors;
    options: DefaultTicketOptionData[];
}

export interface DefaultTicketOptionData {
    type: keyof typeof TicketType;
    style: Exclude<keyof typeof ButtonStyle, "Link">;
    label: string;
    emoji: string;
}

export type ExtendedDefaultDiscordData<T> = T & {
    id?: string;
} & (T extends DefaultCategoryData ? CursorOption : {})