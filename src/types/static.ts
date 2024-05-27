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

export enum PoliticalPermissionsType {
    Legislative = 0,
    Executive = 1,
    Judicial = 2
}