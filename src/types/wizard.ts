import type { ButtonStyle, Colors } from "discord.js";
import type { SeatOptions, TermOptions, ThresholdOptions } from "../schema/options/RoleOptions.js";
import type { DDOptions } from "../schema/options/SystemOptions.js";
import type { EmergencyOptions } from "../schema/options/MiscOptions.js";

import type { BasePermissionsAggregate, PermissionsOverwriteEnumKeyHolder, PermissionsOverwriteHolder } from "./permissions.js";
import { PoliticalRoleHierarchy, PoliticalSystemsType, TicketType } from "./types.js";

interface GuildConfigOptionsOption {}
export class GuildConfigOptionsOptionClass implements GuildConfigOptionsOption {}

export type ExtendedGuildConfigOptionsOption<OptionsType extends GuildConfigOptionsOption> = OptionsType & {
    cursor: number;
}

export interface GuildConfigData {
    politicalSystem: PoliticalSystemsType;
    presidentialOptions?: ExtendedGuildConfigOptionsOption<TermOptions>;
    parliamentaryOptions?: {
        snapElection: number;
    }
    ddOptions?: DDOptions;
    senateOptions?: {
        terms: ExtendedGuildConfigOptionsOption<TermOptions>;
        seats: SeatOptions;
        threshold: ExtendedGuildConfigOptionsOption<ThresholdOptions>;
    },
    referendumThresholds?: ExtendedGuildConfigOptionsOption<ThresholdOptions>;
    courtOptions?: {
        terms: ExtendedGuildConfigOptionsOption<TermOptions>;
        seats: SeatOptions;
        threshold: ThresholdOptions; // Since only one threshold is needed, no need to store current rotation on cursor
    };
    emergencyOptions: ExtendedGuildConfigOptionsOption<EmergencyOptions>;
    discordOptions: DiscordOptions;
}

export interface DiscordOptions {
    roleOptions: DiscordRoleOptionsData;
    discordChannelOptions: DiscordChannelOptionsData;
}

export type DiscordRoleHolderData = Array<ExtendedDefaultDiscordData<DefaultRoleData>>

export interface DiscordRoleOptionsData {
    baseRoles: DiscordRoleHolderData; // This won't be accessed, just to hold the role data and prevent garbage collection
    filteredRoles: DiscordRoleHolderData;
    cursor: number;
}

export interface DefaultRoleData {
    name: string;
    hierarchy: PoliticalRoleHierarchy;
    color: string;
    basePermissions?: BasePermissionsAggregate;
}

export type NewCategoryChannelData = ExtendedDefaultDiscordData<DefaultCategoryData>[];

export interface DiscordChannelOptionsData {
    baseCategoryChannels: ExtendedDefaultDiscordData<DefaultCategoryData>[];
    filteredCategoryChannels: ExtendedDefaultDiscordData<DefaultCategoryData>[];
    cursor: number;
    isCursorOnCategory: boolean;
}

export interface DefaultCategoryData {
    name: string;
    channels: ExtendedDefaultDiscordData<DefaultChannelData>[];
}

export interface DefaultChannelData {
    name: string;
    description: string;
    disable?: Partial<DDOptions> & {
        isDD?: boolean;
    };
    chamberTypeIsLegislative?: boolean;
    permissionOverwrites: PermissionsOverwriteEnumKeyHolder;
    tickets?: DefaultTicketData;
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
} & (T extends DefaultCategoryData ? { cursor: number } : {})