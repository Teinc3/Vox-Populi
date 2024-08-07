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

export interface DDChamberOptions {
    isDD: boolean; // If it is a Direct Democracy
    appointModerators: boolean; // If Citizens act as moderators
    appointJudges: boolean; // If Citizens act as judges
}