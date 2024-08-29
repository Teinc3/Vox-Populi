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
    filteredRoles: DiscordRoleHolderData;
    cursor: number;
}

type BasePermission = "view" | "send" | "interact" | "moderate" | "manage" | "emergency";

export interface DefaultRoleData {
    name: string;
    hierarchy: number;
    color: string;
    basePermissions?: BasePermission[]
}

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

export interface PoliticalRoleHolderInterface<T> {
    VoxPopuli: T;
    President?: T;
    PrimeMinister?: T;
    HeadModerator?: T;
    Moderator?: T;
    Senator?: T;
    Judge?: T;
    Citizen: T;
    Undocumented: T;
}

export interface CustomPermissions<T> {
    view: T[];
    send: T[];
    interact: T[];
    moderate: T[];
    manage: T[];
    emergency?: T[];
}

export type CustomPermissionsOverwrite<T> = Omit<CustomPermissions<T>, "emergency">