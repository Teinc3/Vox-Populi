import { prop } from '@typegoose/typegoose';

class PoliticalRole {
    @prop({ required: true })
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

export { President, PrimeMinister, Senator, Judge, Moderator }