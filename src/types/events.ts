/**
 * Type of political event that can be created
 * 
 * @enum
 */
export enum PoliticalEventType {
  /**
    * Vote: For all types of political votes,
    * including Presidential elections, Senate elections, and referendums.
    */
  Vote = "Vote",
  /**
    * CourtCase: When a new court case is created
    */
  CourtCase = "Court",
  /**
    * Proposal: When a senator proposes a new bill.
    * (Should this also include the voting process later on?)
    */
  Proposal = "Proposal",
  /**
    * Appointment: When a new role appointment is made, or someone is removed from a role.
    */
  Appointment = "Role Change",
  /**
    * ExecutiveOrder: When an executive order is made.
    * Temporary permissions can be given to officers executing the order.
    */
  ExecutiveOrder = "Executive Order",
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
    * Note that this is a temporary ticket type. 
    * It will only be available during the candidacy period for the Presidential election,
    * so it is not present by default.
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

/**
 * AppointmentDetails: An enum collection of details of a role appointment.
 * 
 * Example syntax:
 * *[Actor]*: **[PreviousRole] -> [NewRole]**
 * 
 * @enum
 */
export enum AppointmentDetails {
  /**
    * Elected: When a user is elected to a role by any voting body.
    * 
    * Examples:
    * - *Senator*: **Citizen -> Senator**
    * - *Citizen*: **Citizen -> President**
    */
  Elected,
  /**
    * Promoted: When a user is promoted to a role by a higher role.
    * 
    * Examples:
    * - *Moderator*: **Resident -> Citizen**
    * - *President*: **Citizen -> Judge**
    */
  Promoted,
  /**
    * Impeached: When a user is impeached from a role by any voting body.
    * 
    * Examples:
    * - *Senator*: **PrimeMinister -> Citizen**
    * - *Citizen*: **President -> Citizen**
    */
  Impeached,
  /**
    * Demoted: When a user is demoted from a role by a higher role.
    * 
    * Examples:
    * - *President*: **HeadModerator -> Moderator**
    * - *Moderator*: **Citizen -> Resident**
    */
  Demoted,
  /**
    * TermEnd: When a user's term ends and they lose the role.
    * 
    * Examples:
    * - **Senator -> Citizen**
    * - **President -> Citizen**
    */
  TermEnd,
  /**
    * Resigned: When a user resigns from a role.
    * 
    * Examples:
    * - **Judge -> Citizen**
    * - **PrimeMinister -> Citizen**
    */
  Resigned
}