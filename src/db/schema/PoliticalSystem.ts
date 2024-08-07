import { prop, type Ref, getModelForClass} from '@typegoose/typegoose';
import type { Guild } from 'discord.js';

import PoliticalRole, { President, PrimeMinister, deletePoliticalRoleDocument } from "./PoliticalRole.js";
import PoliticalRoleHolder from './PoliticalRolesHolder.js';
import Chamber, { Legislature, Senate, Referendum, Court, createChamberDocument, deleteChamberDocument } from "./Chamber.js";

import { PoliticalSystemsType } from '../../types/static.js';
import constants from '../../data/constants.json' assert { type: "json" };

// Maybe can remove
class PoliticalSystem {
    @prop({ required: true })
    id!: PoliticalSystemsType;

    // I'm not entirely sure what use this has but I'll keep it for now
    // Maybe shows up in server info or something like that
    @prop({ ref: () => 'PoliticalRole' })
    headOfState?: Ref<PoliticalRole>;

    @prop({ required: true, ref: () => 'Legislature' })
    legislature!: Ref<Legislature>;

    @prop({ required: true, ref: () => 'Chamber' })
    court!: Ref<Chamber>;
}

class Presidential extends PoliticalSystem {
    id = PoliticalSystemsType.Presidential;
    declare headOfState?: Ref<President>;
    declare legislature: Ref<Senate>;
}

class Parliamentary extends PoliticalSystem {
    id = PoliticalSystemsType.Parliamentary;
    declare headOfState?: Ref<PrimeMinister>;
    declare legislature: Ref<Senate>;
}

class DirectDemocracy extends PoliticalSystem {
    id = PoliticalSystemsType.DirectDemocracy;
    declare legislature: Ref<Referendum>;

    // If people vote on moderation, or if the moderation is done by mods appointed by referendums
    @prop({ required: true })
    appointModerators: boolean = constants.politicalSystem.directDemocracy.appointModerators;

    // If people vote on judges, or if the judges are appointed by referendums
    @prop({ required: true })
    appointJudges: boolean = constants.politicalSystem.directDemocracy.appointJudges;
}

const PoliticalSystemModel = getModelForClass(PoliticalSystem);

async function createPoliticalSystemDocument(
    politicalSystemType: PoliticalSystemsType,
    politicalRoleHolder: PoliticalRoleHolder
): Promise<Ref<PoliticalSystem>> {

    let politicalSystem: PoliticalSystem;
    let headOfStateRole: Ref<PoliticalRole> | undefined;

    switch (politicalSystemType) {
        case PoliticalSystemsType.Presidential:
            politicalSystem = new Presidential();
            headOfStateRole = politicalRoleHolder.President!;
            break;

        case PoliticalSystemsType.Parliamentary:
            politicalSystem = new Parliamentary();
            headOfStateRole = politicalRoleHolder.PrimeMinister!;
            break;

        case PoliticalSystemsType.DirectDemocracy:
            politicalSystem = new DirectDemocracy();
            break;
    }

    // Add hos ref
    if (headOfStateRole) {
        politicalSystem.headOfState = headOfStateRole;
    }

    // Create Legislature document
    politicalSystem.legislature = await createChamberDocument(politicalSystemType === PoliticalSystemsType.DirectDemocracy ? Referendum : Senate);
    politicalSystem.court = await createChamberDocument(Court);

    // Save the political system document and return the reference
    return await PoliticalSystemModel.create(politicalSystem);
}

async function deletePoliticalSystemDocument(_id: Ref<PoliticalSystem>) {
    // Find the political system document
    const politicalSystem = await PoliticalSystemModel.findOneAndDelete({ _id });
    if (!politicalSystem) {
        return;
    }

    // Find documents: HoS, Legislature, Court
    const legislatureDocument = politicalSystem.legislature;
    const courtDocument = politicalSystem.court;

    // Delete legislature and court if still exist (not HOS, since deleted through political role)
    if (legislatureDocument) {
        await deleteChamberDocument(legislatureDocument);
    }
    if (courtDocument) {
        await deleteChamberDocument(courtDocument);
    }
}

async function findPoliticalSystemDocument(_id: Ref<PoliticalSystem>): Promise<PoliticalSystem | null> {
    return await PoliticalSystemModel.findOne({ _id });
}

export default PoliticalSystem;
export { Presidential, Parliamentary, DirectDemocracy, PoliticalSystemModel };
export { createPoliticalSystemDocument, deletePoliticalSystemDocument, findPoliticalSystemDocument };