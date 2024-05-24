import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

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

const LegislatureModel = getModelForClass(Legislature);

export default Legislature;
export { Senate, Referendum, LegislatureModel };