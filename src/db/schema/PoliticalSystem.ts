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
    appointModerators: boolean = constants.mechanics.directDemocracy.appointModerators;

    // If people vote on judges, or if the judges are appointed by referendums
    @prop({ required: true })
    appointJudges: boolean = constants.mechanics.directDemocracy.appointJudges;
}

const PoliticalSystemModel = getModelForClass(PoliticalSystem);

async function createPoliticalSystemDocument(
    politicalSystemType: PoliticalSystemsType,
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

    // Add hos ref
    if (headOfStateRole) {
        politicalSystem.headOfState = headOfStateRole;
    }

    // Create Legislature document
    politicalSystem.legislature = await createChamberDocument(legislatureRole, politicalSystemType === PoliticalSystemsType.DirectDemocracy ? Referendum : Senate);
    politicalSystem.court = await createChamberDocument(politicalRoleHolder.Judge!, Court);

    // Save the political system document and return the reference
    return await PoliticalSystemModel.create(politicalSystem);
}

async function deletePoliticalSystemDocument(guild: Guild, _id: Ref<PoliticalSystem>) {
    // Find the political system document
    const politicalSystem = await PoliticalSystemModel.findOne({ _id });
    if (!politicalSystem) {
        return;
    }

    // Find documents: HoS, Legislature, Court
    const headOfStateDocument = politicalSystem.headOfState;
    const legislatureDocument = politicalSystem.legislature;
    const courtDocument = politicalSystem.court;

    // Delete hos and legislature if still exist
    if (headOfStateDocument) {
        await deletePoliticalRoleDocument(guild, headOfStateDocument);
    }
    if (legislatureDocument) {
        await deleteChamberDocument(guild, legislatureDocument);
    }
    if (courtDocument) {
        await deleteChamberDocument(guild, courtDocument);
    }

    await PoliticalSystemModel.deleteOne({ _id });
} 

export default PoliticalSystem;
export { Presidential, Parliamentary, DirectDemocracy, PoliticalSystemModel };
export { createPoliticalSystemDocument, deletePoliticalSystemDocument };