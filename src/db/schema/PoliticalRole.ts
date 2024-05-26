import { prop, getModelForClass } from '@typegoose/typegoose';

import { PoliticalSystemsType } from '../../types/static.js';

class PoliticalRole {
    @prop()
    roleID!: number;

    @prop({ required: true })
    name!: string;

    @prop({ required: true })
    hierarchy!: number;

    /*
    @prop()
    permissions!: Ref<PoliticalPermissions>
    */
}

class President extends PoliticalRole {
    name = "President";
    hierarchy = 0;
}

class PrimeMinister extends PoliticalRole {
    name = "Prime Minister";
    hierarchy = 0;
}

class Senator extends PoliticalRole {
    name = "Senator";
    hierarchy = 2;
}

class Judge extends PoliticalRole {
    name = "Judge"
    hierarchy = 2;
}

class Governor extends PoliticalRole {
    name = "Governor"
    hierarchy = 1;
}

class Moderator extends PoliticalRole {
    name = "Moderator"
    hierarchy = 3;
}

class Citizen extends PoliticalRole {
    name = "Citizen"
    hierarchy = 4;
}

class Undocumented extends PoliticalRole {
    name = "Undocumented"
    hierarchy = 5;
}

const PoliticalRoleModel = getModelForClass(PoliticalRole);

function politicalSystemRoleCreationTriage(politicalSystemType: PoliticalSystemsType): PoliticalRole {
    switch (politicalSystemType) {
        case PoliticalSystemsType.Presidential:
            return new President();
        case PoliticalSystemsType.Parliamentary:
            return new PrimeMinister();
        case PoliticalSystemsType.DirectDemocracy:
            return new Governor();
    }
}

export default PoliticalRole;
export { President, PrimeMinister, Senator, Judge, Governor, Moderator, Citizen, Undocumented, PoliticalRoleModel }
export { politicalSystemRoleCreationTriage }