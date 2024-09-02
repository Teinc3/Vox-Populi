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