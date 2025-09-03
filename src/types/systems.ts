export enum PoliticalSystemType {
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

export interface DDOptions {
  /**
     * If true, Citizens can appoint moderators through referendums. If false, they collectively work as moderators.
     */
  appointModerators: boolean;

  /**
     * If true, Citizens can appoint judges through referendums. If false, they collectively work as judges.
     */
  appointJudges: boolean;
}