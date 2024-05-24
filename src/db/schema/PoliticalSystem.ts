import { prop } from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';

import { President, PrimeMinister } from "./PoliticalRole.js";
import { Senate } from "./Legislature.js";
import { IPoliticalSystem } from "../../types/types";

// Maybe can remove
class PoliticalSystem {}

class Presidential extends PoliticalSystem implements IPoliticalSystem {
    @prop({ required: true })
    id: number = 0

    @prop({ required: true, ref: () => President })
    headOfState!: Ref<President>;
}

class Parliamentary extends PoliticalSystem implements IPoliticalSystem {
    @prop({ required: true })
    id: number = 1

    @prop({ required: true, ref: () => PrimeMinister })
    headOfState!: Ref<PrimeMinister>;

    @prop({ required: true, ref: () => Senate })
    legislature!: Ref<Senate>;
}

export { Presidential, Parliamentary }