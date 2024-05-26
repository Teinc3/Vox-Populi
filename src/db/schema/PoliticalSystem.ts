import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';

import PoliticalRole, { President, PrimeMinister, Governor } from "./PoliticalRole.js";
import Legislature from "./Legislature.js";

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

const PoliticalSystemModel = getModelForClass(PoliticalSystem);

export default PoliticalSystem;
export { Presidential, Parliamentary, DirectDemocracy, PoliticalSystemModel };
export { politicalSystemCreationTriage };