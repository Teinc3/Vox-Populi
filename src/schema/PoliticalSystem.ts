import { prop, type Ref, getModelForClass} from '@typegoose/typegoose';

import PoliticalRole, { President, PrimeMinister } from "./roles/PoliticalRole.js";
import PoliticalRoleHolder from './roles/PoliticalRolesHolder.js';
import Chamber, { Legislature, Senate, Referendum, createChamberDocument, deleteChamberDocument } from "./Chamber.js";
import { PresidentialOptions, DDOptions } from './options.js';

import { GuildConfigData, PoliticalBranchType, PoliticalSystemsType } from '../types/types.js';

// Maybe can remove
class PoliticalSystem {
    @prop({ required: true })
    id!: PoliticalSystemsType;

    @prop({ required: true, ref: () => 'Legislature' })
    legislature!: Ref<Legislature>;

    @prop({ required: true, ref: () => 'Chamber' })
    court!: Ref<Chamber>;

    // I'm not entirely sure what use this has but I'll keep it for now
    // Maybe shows up in server info or something like that
    @prop({ ref: () => 'PoliticalRole' })
    headOfState?: Ref<PoliticalRole>;

    // Optional Presidential methods
    @prop({ _id: false })
    presidentialOptions?: PresidentialOptions;

    // Optional DD methods
    @prop({ _id: false })
    ddOptions?: DDOptions;
}

class Presidential extends PoliticalSystem {
    id = PoliticalSystemsType.Presidential;
    declare headOfState?: Ref<President>;
    declare legislature: Ref<Senate>;
    declare presidentialOptions: PresidentialOptions;

    constructor() {
        super();
        this.presidentialOptions = new PresidentialOptions();
    }
}

class Parliamentary extends PoliticalSystem {
    id = PoliticalSystemsType.Parliamentary;
    declare headOfState?: Ref<PrimeMinister>;
    declare legislature: Ref<Senate>;
}

class DirectDemocracy extends PoliticalSystem {
    id = PoliticalSystemsType.DirectDemocracy;
    declare legislature: Ref<Referendum>;
    declare ddOptions: DDOptions;

    constructor() {
        super();
        this.ddOptions = new DDOptions();
    }
}

const PoliticalSystemModel = getModelForClass(PoliticalSystem);

async function createPoliticalSystemDocument(guildConfigData: GuildConfigData, politicalRoleHolder: PoliticalRoleHolder): Promise<Ref<PoliticalSystem>> {

    let politicalSystem: PoliticalSystem;
    let headOfStateRole: Ref<PoliticalRole> | undefined;
    const { politicalSystem: politicalSystemType } = guildConfigData;

    switch (politicalSystemType) {
        case PoliticalSystemsType.Presidential:
            politicalSystem = new Presidential();
            headOfStateRole = politicalRoleHolder.President!;

            politicalSystem.presidentialOptions!.termOptions.termLength = guildConfigData.presidentialOptions!.termLength;
            politicalSystem.presidentialOptions!.termOptions.termLimit = guildConfigData.presidentialOptions!.termLimits;
            politicalSystem.presidentialOptions!.termOptions.consecutive = guildConfigData.presidentialOptions!.consecutive;
            break;

        case PoliticalSystemsType.Parliamentary:
            politicalSystem = new Parliamentary();
            headOfStateRole = politicalRoleHolder.PrimeMinister!;
            
            break;

        case PoliticalSystemsType.DirectDemocracy:
            politicalSystem = new DirectDemocracy();

            politicalSystem.ddOptions!.appointModerators = guildConfigData.ddOptions!.appointModerators;
            politicalSystem.ddOptions!.appointJudges = guildConfigData.ddOptions!.appointJudges;
            break;
    }

    // Add hos ref
    if (headOfStateRole) {
        politicalSystem.headOfState = headOfStateRole;
    }

    // Create Legislature document
    // BTW Pass guildConfigData stuff there as well
    politicalSystem.legislature = await createChamberDocument(PoliticalBranchType.Legislative, guildConfigData);
    politicalSystem.court = await createChamberDocument(PoliticalBranchType.Judicial, guildConfigData);

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