export enum PoliticalSystemsType {
    Presidential = 0,
    Parliamentary = 1,
    DirectDemocracy = 2
}

export const PoliticalSystemDescriptions = {
    [PoliticalSystemsType.Presidential]: 'A system of government where the executive branch exists separately from a legislature.',
    [PoliticalSystemsType.Parliamentary]: 'A system of government where the executive branch derives its democratic legitimacy from, and is held accountable to, the legislature.',
    [PoliticalSystemsType.DirectDemocracy]: 'A form of democracy in which people decide on policy initiatives directly.'
};

export enum PoliticalBranchType {
    None = 0,
    Legislative = 1,
    Executive = 2,
    Judicial = 3,
}

export interface DDChamberOptions {
    isDD?: boolean; // If it is a Direct Democracy
    appointModerators?: boolean; // If Citizens act as moderators
    appointJudges?: boolean; // If Citizens act as judges
}