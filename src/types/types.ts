import type { SeatOptions, TermOptions, ThresholdOptions } from "../schema/options/RoleOptions";
import type { DDOptions } from "../schema/options/SystemOptions";
import type { EmergencyOptions } from "../schema/options/MiscOptions";

import type { BasePermissionsAggregate, CustomPermissions } from "./permissions.js";

export enum PoliticalSystemsType {
    Presidential,
    Parliamentary,
    DirectDemocracy
}

export enum PoliticalBranchType {
    None,
    Legislative,
    Executive,
    Judicial,
}

export enum LegislativeChamberType {
    Senate,
    Referendum
}

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
    hierarchy: number;
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
    // Add position?
    channels: ExtendedDefaultDiscordData<DefaultChannelData>[];
}

export interface DefaultChannelData {
    position: number;
    name: string;
    description: string;
    disable?: Partial<DDOptions> & {
        isDD?: boolean;
    };
    chamberTypeIsLegislative?: boolean;
    permissionOverwrites: CustomPermissions<number>;
}

export type ExtendedDefaultDiscordData<T> = T & {
    id?: string;
} & (T extends DefaultCategoryData ? { cursor: number } : {})

export enum PoliticalRoleHierarchy {
    VoxPopuli,
    President,
    PrimeMinister,
    HeadModerator,
    Moderator,
    Senator,
    Judge,
    Citizen,
    Undocumented
}

type BaseRoles = {
    required: "VoxPopuli" | "Citizen" | "Undocumented";
    optional: "President" | "PrimeMinister" | "HeadModerator" | "Moderator" | "Senator" | "Judge";
}

export type PoliticalRoleHolderInterface<T> = {
    [key in BaseRoles["required"]]: T;
} & Partial<{
    [key in BaseRoles["optional"]]: T;
}>