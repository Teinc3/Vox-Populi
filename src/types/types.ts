import { SeatOptions, TermOptions, ThresholdOptions } from "../schema/options/RoleOptions";
import { DDOptions } from "../schema/options/SystemOptions";
import { EmergencyOptions } from "../schema/options/MiscOptions";

export enum PoliticalSystemsType {
    Presidential = 0,
    Parliamentary = 1,
    DirectDemocracy = 2
}

export enum PoliticalBranchType {
    None = 0,
    Legislative = 1,
    Executive = 2,
    Judicial = 3,
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

export type DiscordRoleHolderData = PoliticalRoleHolderInterface<ExtendedDefaultDiscordData<DefaultRoleData>>;

export interface DiscordRoleOptionsData {
    baseRoles: DiscordRoleHolderData; // This won't be accessed, just to hold the role data and prevent garbage collection
    filteredRoles: DiscordRoleHolderData;
    cursor: number;
}

type BasePermission = "view" | "send" | "interact" | "moderate" | "manage" | "emergency";

export type CustomPermissionsOverwrite<T> = {
    [key in Exclude<BasePermission, "emergency">]: T[];
}

export type CustomPermissions<T> = CustomPermissionsOverwrite<T> & Partial<Record<"emergency", T[]>>;

export interface DefaultRoleData {
    name: string;
    hierarchy: number;
    color: string;
    basePermissions?: BasePermission[]
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

type BaseRoles = {
    required: "VoxPopuli" | "Citizen" | "Undocumented";
    optional: "President" | "PrimeMinister" | "HeadModerator" | "Moderator" | "Senator" | "Judge";
}

export type PoliticalRoleHolderInterface<T> = {
    [key in BaseRoles["required"]]: T;
} & Partial<{
    [key in BaseRoles["optional"]]: T;
}>

/**
 * Type of political event
 * 
 * - Vote: For all types of political votes, including Presidential elections, Senate elections, and referendums.
 * - CourtCase: When a new court case is created
 * - Proposal: When a senator proposes a new bill. (Should this also include the voting process later on?)
 * - Appointment: When a new appointment is made, or someone is removed from a role.
 * - ExecutiveOrder: When an executive order is made. Temporary permissions can be given to officers executing the order.
 * 
 * @enum
 */
export enum PoliticalEventType {
    Vote,
    CourtCase, // When a court case is created
    Proposal, // Legislative Proposal.
    Appointment, // Appoint/Remove someone of a role.
    ExecutiveOrder, // Executive Order. Temporary permissions can be given to officers executing the order.
}

/**
 * Type of message collector
 * 
 * - Ticket: Ticket system for support
 * - CourtCase: Court case system
 * - Proposal: Propose a bill to vote on
 * - Registration: Registration to become a citizen with voting rights
 * 
 * @enum
 */
export enum MessageCollectorType {
    Ticket,
    CourtCase,
    Proposal,
    Registration
}