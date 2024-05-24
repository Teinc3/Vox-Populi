import { prop, getModelForClass } from '@typegoose/typegoose';

class PoliticalRole {
    @prop()
    roleID!: number;

    @prop({ required: true })
    name!: string;

    /*@prop({ required: true })
    permissions!: Ref<PoliticalPermissions>*/
}

class President extends PoliticalRole {
    name = "President"
}

class PrimeMinister extends PoliticalRole {
    name = "Prime Minister"
}

class Senator extends PoliticalRole {
    name = "Senator"
}

class Judge extends PoliticalRole {
    name = "Judge"
}

class Moderator extends PoliticalRole {
    name = "Moderator"
}

class Citizen extends PoliticalRole {
    name = "Citizen"
}

class Undocumented extends PoliticalRole {
    name = "Undocumented"
}

const PoliticalRoleModel = getModelForClass(PoliticalRole);

export default PoliticalRole;
export { President, PrimeMinister, Senator, Judge, Moderator, Citizen, Undocumented, PoliticalRoleModel }