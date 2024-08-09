import { prop } from '@typegoose/typegoose';

class Thresholds {
    @prop({ required: true })
    amendment!: number;

    @prop({ required: true })
    pass!: number;
}

class TermOptions {
    @prop({ required: true })
    termLength!: number;

    @prop({ required: true })
    termLimit!: number;

    @prop()
    consecutive?: boolean; // Only needed for roles like Head Mod (for DD) and President (for Presidential)
}

class SeatOptions {
    @prop({ required: true })
    value!: number;

    @prop({ required: true })
    scaleable!: boolean;
}

class PresidentialOptions {
    @prop({ required: true, _id: false })
    termOptions!: TermOptions;

    constructor() {
        this.termOptions = new TermOptions();
    }
}

class DDOptions {
    @prop ({ required: true })
    appointModerators!: boolean;

    @prop ({ required: true })
    appointJudges!: boolean;
}

export {
    Thresholds, TermOptions, SeatOptions,
    PresidentialOptions, DDOptions
};