declare type PoliticalSystem = Presidential | Parliamentary;

declare interface Presidential {
    id: number = 0;
}

declare interface Parliamentary {
    id: number = 1;
};

// Senator class? Extends generic Role class in hierarchy?
/* class Senator extends Role {
    ...
} */