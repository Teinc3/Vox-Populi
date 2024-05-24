import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';

import PoliticalRole, { President, PrimeMinister } from "./PoliticalRole.js";
import Legislature from "./Legislature.js";

// Maybe can remove
class PoliticalSystem<H extends PoliticalRole> {
    @prop({ required: true })
    id!: number;

    @prop({ required: true })
    headOfState!: Ref<H>;

    @prop({ required: true })
    legislature!: Ref<Legislature<H>>;
}

class Presidential extends PoliticalSystem<President> {
    id = 0
}

class Parliamentary extends PoliticalSystem<PrimeMinister> {
    id = 1
}

const PoliticalSystemModel = getModelForClass(PoliticalSystem);

export default PoliticalSystem;
export { Presidential, Parliamentary, PoliticalSystemModel };