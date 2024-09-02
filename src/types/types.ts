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