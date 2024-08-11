import { SeatOptions, TermOptions, ThresholdOptions } from "../schema/options/RoleOptions";
import { DDOptions } from "../schema/options/SystemOptions";

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
    emergencyOptions: {}
}