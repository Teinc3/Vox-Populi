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
 * Type of static ticket that can be opened
 * 
 * @enum
 */
export enum TicketType {
    /**
     * This will be used to open an inquiry ticket with the moderation team.
     */
    Inquiry = "ticket_inquiry",
    /**
     * This will be used to report a user to the moderation team.
     */
    Report = "ticket_report",
    /**
     * This will be used to open a court case.
     */
    CourtCase = "ticket_courtcase",
    /**
     * This will be used to apply for citizenship.
     */
    Registration = "ticket_registration",
    /**
     * This will be used to propose a new bill.
     */
    Proposal = "ticket_proposal",
    /**
     * This will be used to apply for candidacy in an upcoming Presidential election.
     * 
     * Note that this is a temporary ticket type. It will only be available during the candidacy period for the Presidential election, so it is not present by default.
     * 
     * Senate candidates will be nominated through party leaders instead through a separate command.
     */
    Candidate = "ticket_candidate",
    /**
     * This will be used by Citizens to petition either the moderation team or the Senate.
     * 
     * Currently not implemented.
     */
    //Petition = "ticket_petition"
}