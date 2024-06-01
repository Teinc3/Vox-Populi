import { prop, type Ref, getModelForClass} from '@typegoose/typegoose';

import PoliticalRole, { President, PrimeMinister, Governor, deletePoliticalSystemRoleDocument } from "./PoliticalRole.js";
import Legislature, { deleteLegislatureDocument } from "./Legislature.js";

import { PoliticalSystemsType } from '../../types/static.js';

// Maybe can remove
class PoliticalSystem<H extends PoliticalRole> {
    @prop({ required: true })
    id!: PoliticalSystemsType;

    @prop()
    headOfState!: Ref<H>;

    @prop()
    legislature!: Ref<Legislature<H>>;
}

class Presidential extends PoliticalSystem<President> {
    id = PoliticalSystemsType.Presidential;
}

class Parliamentary extends PoliticalSystem<PrimeMinister> {
    id = PoliticalSystemsType.Parliamentary;
}

class DirectDemocracy extends PoliticalSystem<Governor> {
    id = PoliticalSystemsType.DirectDemocracy;
}

const PoliticalSystemModel = getModelForClass(PoliticalSystem);

function politicalSystemCreationTriage(politicalSystemType: PoliticalSystemsType): PoliticalSystem<PoliticalRole> {
    switch (politicalSystemType) {
        case PoliticalSystemsType.Presidential:
            return new Presidential();
        case PoliticalSystemsType.Parliamentary:
            return new Parliamentary();
        case PoliticalSystemsType.DirectDemocracy:
            return new DirectDemocracy();
    }
}

async function deletePoliticalSystemDocument(_id: Ref<PoliticalSystem<PoliticalRole>>) {
    // Find the political system document
    const politicalSystem = await PoliticalSystemModel.findOne({ _id });
    if (!politicalSystem) {
        return;
    }

    // Find the head of state and legislature documents
    const headOfStateDocument = politicalSystem.headOfState;
    const legislatureDocument = politicalSystem.legislature;

    // Delete hos and legislature
    if (headOfStateDocument) {
        await deletePoliticalSystemRoleDocument(headOfStateDocument);
    }
    if (legislatureDocument) {
        await deleteLegislatureDocument(legislatureDocument);
    }

    await PoliticalSystemModel.deleteOne({ _id });
} 

export default PoliticalSystem;
export { Presidential, Parliamentary, DirectDemocracy, PoliticalSystemModel };
export { politicalSystemCreationTriage, deletePoliticalSystemDocument };