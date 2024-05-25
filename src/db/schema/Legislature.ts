import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

import { PoliticalSystemsType } from '../../types/types';
import PoliticalRole, { Senator, Citizen } from "./PoliticalRole.js";

class Legislature<T extends PoliticalRole> {
    @prop()
    role!: Ref<T>;

    @prop({ required: true })
    threshold: number = 0.5;

    @prop({ required: true })
    amendmentThreshold: number = 2/3;

    // Or put channels under "Category subclass"
    /*@prop({ required: true })
    channelID!: number;*/
}

class Senate extends Legislature<Senator> {
    @prop({ required: true })
    termLength!: number;

    @prop({ required: true })
    termLimit!: number;

    @prop({ required: true })
    seats!: number;
}

class Referendum extends Legislature<Citizen> {}

function legislatureCreationTriage(politicalSystemType: PoliticalSystemsType): Legislature<PoliticalRole> {
    if (politicalSystemType === PoliticalSystemsType.DirectDemocracy) {
        return new Referendum();
    } else {
        return new Senate();
    }
}

const LegislatureModel = getModelForClass(Legislature);

export default Legislature;
export { Senate, Referendum, LegislatureModel };
export { legislatureCreationTriage };