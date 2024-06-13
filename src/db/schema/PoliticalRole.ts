import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

import { PoliticalSystemsType } from '../../types/static.js';
import PoliticalRoleHolder from './PoliticalRolesHolder.js';

class PoliticalRole {
    @prop({ required: true })
    name!: string;
    
    @prop({ required: true })
    hierarchy!: number;

    @prop()
    roleID?: number;
}

const PoliticalRoleNames = [
    "President",
    "Prime Minister",
    "Head Moderator",
    "Senator",
    "Judge",
    "Moderator",
    "Citizen",
    "Undocumented"
];

class President extends PoliticalRole {
    name = PoliticalRoleNames[0];
    hierarchy = 0;
}

class PrimeMinister extends PoliticalRole {
    name = PoliticalRoleNames[1];
    hierarchy = 0;
}

class HeadModerator extends PoliticalRole {
    name = PoliticalRoleNames[2];
    hierarchy = 1;
}

class Senator extends PoliticalRole {
    name = PoliticalRoleNames[3];
    hierarchy = 2;
}

class Judge extends PoliticalRole {
    name = PoliticalRoleNames[4];
    hierarchy = 2;
}

class Moderator extends PoliticalRole {
    name = PoliticalRoleNames[5];
    hierarchy = 3;
}

class Citizen extends PoliticalRole {
    name = PoliticalRoleNames[6];
    hierarchy = 4;
}

class Undocumented extends PoliticalRole {
    name = PoliticalRoleNames[7];
    hierarchy = 5;
}

const PoliticalRoleModel = getModelForClass(PoliticalRole);

async function createPoliticalRoleDocuments(politicalSytemType: PoliticalSystemsType, isCombinedCourt: boolean): Promise<PoliticalRoleHolder> {
    const roleHolder = new PoliticalRoleHolder();

    if (politicalSytemType === PoliticalSystemsType.Presidential) {
        roleHolder.President = await PoliticalRoleModel.create(new President());
    } else if (politicalSytemType === PoliticalSystemsType.Parliamentary) {
        roleHolder.PrimeMinister = await PoliticalRoleModel.create(new PrimeMinister());
    }
    if (politicalSytemType !== PoliticalSystemsType.DirectDemocracy) {
        roleHolder.Senator = await PoliticalRoleModel.create(new Senator());
    }
    if (!isCombinedCourt) {
        roleHolder.Judge = await PoliticalRoleModel.create(new Judge());
    }
    // If Direct Democracy and appointModerators is false, no Moderator role is created
    roleHolder.HeadModerator = await PoliticalRoleModel.create(new HeadModerator());
    roleHolder.Moderator = await PoliticalRoleModel.create(new Moderator());

    roleHolder.Citizen = await PoliticalRoleModel.create(new Citizen());
    roleHolder.Undocumented = await PoliticalRoleModel.create(new Undocumented());

    return roleHolder;
}

async function deletePoliticalRoleDocument(_id: Ref<PoliticalRole>) {  
    await PoliticalRoleModel.deleteOne({ _id });
}

export default PoliticalRole;
export { PoliticalRoleNames, President, PrimeMinister, Senator, Judge, HeadModerator, Moderator, Citizen, Undocumented, PoliticalRoleModel }
export { createPoliticalRoleDocuments, deletePoliticalRoleDocument }