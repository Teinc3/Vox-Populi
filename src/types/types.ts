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

/* export enum SenateSeatAllocationMethod {
    Proportional = 0, // A percentage of the total number of Citizens
    Fixed = 1 // A fixed number of seats
} */

export interface GuildConfigData {
    politicalSystem: PoliticalSystemsType;
    ddOptions?: {
        appointModerators: boolean; // If Citizens act as moderators
        appointJudges: boolean; // If Citizens act as judges
    };
    presidentialOptions?: {
        termLength: number;
        termLimits: number;
		consecutive: boolean;
		cursor: number;
    }
    parliamentaryOptions?: {
        snapElection: number;
    }
    senateOptions?: {
        terms: {
            termLength: number;
            termLimits: number;
            cursor: number;
        }
        seats: {
            scaleable: boolean; // If there are more allocation methods, we can expand to use enum SenateSeatAllocationMethod
            value: number; // Citizens per seat or Number of seats
        }
        // In percentages
        threshold: {
            amendment: number;
            pass: number;
            cursor: number;
        }
    }
    emergencyOptions: {}
}