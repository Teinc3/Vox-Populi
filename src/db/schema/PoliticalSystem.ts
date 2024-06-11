import { prop, type Ref, getModelForClass} from '@typegoose/typegoose';

import PoliticalRole, { President, PrimeMinister, deletePoliticalRoleDocument } from "./PoliticalRole.js";
import PoliticalRoleHolder from './PoliticalRolesHolder.js';
import Chamber, { Legislature, Senate, Referendum, createChamberDocument, deleteChamberDocument } from "./Chamber.js";

import { PoliticalSystemsType } from '../../types/static.js';
import constants from '../../data/constants.json' assert { type: "json" };

// Maybe can remove
class PoliticalSystem {
    @prop({ required: true })
    id!: PoliticalSystemsType;

    @prop()
    headOfState?: Ref<PoliticalRole>;

    @prop()
    legislature?: Ref<Legislature>;

    // If the court is the same as the legislature
    @prop({ required: true })
    isCombinedCourt: boolean = constants.mechanics.court.isCombinedCourt;

    @prop()
    court?: Ref<Chamber>;
}

class Presidential extends PoliticalSystem {
    id = PoliticalSystemsType.Presidential;
    declare headOfState?: Ref<President>;
    declare legislature?: Ref<Senate>;
}

class Parliamentary extends PoliticalSystem {
    id = PoliticalSystemsType.Parliamentary;
    declare headOfState?: Ref<PrimeMinister>;
    declare legislature?: Ref<Senate>;
}

class DirectDemocracy extends PoliticalSystem {
    id = PoliticalSystemsType.DirectDemocracy;
    declare legislature?: Ref<Referendum>;

    // If people vote on moderation, or if the moderation is done by mods appointed by referendums
    @prop({ required: true })
    appointModerators: boolean = constants.mechanics.directDemocracy.appointModerators;
}

const PoliticalSystemModel = getModelForClass(PoliticalSystem);

async function createPoliticalSystemDocument(
    politicalSystemType: PoliticalSystemsType,
    isCombinedCourt: boolean,
    politicalRoleHolder: PoliticalRoleHolder
): Promise<Ref<PoliticalSystem>> {

    let politicalSystem: PoliticalSystem;
    let headOfStateRole: Ref<PoliticalRole> | undefined;
    let legislatureRole: Ref<PoliticalRole>;

    switch (politicalSystemType) {
        case PoliticalSystemsType.Presidential:
            politicalSystem = new Presidential();
            headOfStateRole = politicalRoleHolder.President!;
            legislatureRole = politicalRoleHolder.Senator!;
            break;
        case PoliticalSystemsType.Parliamentary:
            politicalSystem = new Parliamentary();
            headOfStateRole = politicalRoleHolder.PrimeMinister!;
            legislatureRole = politicalRoleHolder.Senator!;
            break;
        case PoliticalSystemsType.DirectDemocracy:
            politicalSystem = new DirectDemocracy();
            legislatureRole = politicalRoleHolder.Citizen!;
            break;
    }

    politicalSystem.isCombinedCourt = isCombinedCourt;

    // Add hos ref
    if (headOfStateRole) {
        politicalSystem.headOfState = headOfStateRole;
    }

    // Create Legislature document
    politicalSystem.legislature = await createChamberDocument(legislatureRole, politicalSystemType === PoliticalSystemsType.DirectDemocracy ? Referendum : Senate);
    if (isCombinedCourt) {
        politicalSystem.court = politicalSystem.legislature;
    } else {
        // Create Court document
        politicalSystem.court = await createChamberDocument(politicalRoleHolder.Judge!, Chamber);
    }

    // Save the political system document and return the reference
    return await PoliticalSystemModel.create(politicalSystem);
}

async function deletePoliticalSystemDocument(_id: Ref<PoliticalSystem>) {
    // Find the political system document
    const politicalSystem = await PoliticalSystemModel.findOne({ _id });
    if (!politicalSystem) {
        return;
    }

    // Find documents: HoS, Legislature, Court (if not combined with legislature)
    const headOfStateDocument = politicalSystem.headOfState;
    const legislatureDocument = politicalSystem.legislature;
    // const courtDocument = politicalSystem.court;

    // Delete hos and legislature if still exist
    if (headOfStateDocument) {
        await deletePoliticalRoleDocument(headOfStateDocument);
    }
    if (legislatureDocument) {
        await deleteChamberDocument(legislatureDocument);
    }
    // delete court

    await PoliticalSystemModel.deleteOne({ _id });
} 

export default PoliticalSystem;
export { Presidential, Parliamentary, DirectDemocracy, PoliticalSystemModel };
export { createPoliticalSystemDocument, deletePoliticalSystemDocument };