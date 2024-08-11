import { prop } from '@typegoose/typegoose';

import { GuildConfigOptionsOptionClass } from "../types/types";

class ThresholdOptions extends GuildConfigOptionsOptionClass {
    /**
     * Percentage of votes needed to pass
     */
    @prop({ required: true })
    pass!: number;
}

class LegislativeThresholdOptions extends ThresholdOptions {
    /**
     * Percentage of votes needed to amend the constitution, override a veto (if any), and impeach an official
     */
    @prop({ required: true })
    amendment!: number;
}

class TermOptions extends GuildConfigOptionsOptionClass {
    /**
     * Maximum length of each term in months
     */
    @prop({ required: true })
    termLength!: number;

    /**
     * Maximum number of terms a person can serve (0 for unlimited)
     */
    @prop({ required: true })
    termLimit!: number;

    /**
     * Can the person run for consecutive terms?
     */
    @prop()
    consecutive?: boolean; // Only needed for HOS roles
}

class SeatOptions extends GuildConfigOptionsOptionClass {
    /**
     * True if the number of seats scale with the number of Citizens. False if the number of seats is fixed.
     */
    @prop({ required: true })
    scalable!: boolean;

    /**
     * Number of Citizens per seat or number of seats in the chamber
     */
    @prop({ required: true })
    value!: number;
}

class PresidentialOptions extends GuildConfigOptionsOptionClass {
    /**
     * Can the President veto/override any legislation passed by the Legislature?
     */
    /*
    @prop({ required: true })
    veto!: boolean;
     */

    @prop({ required: true, _id: false })
    termOptions!: TermOptions;

    constructor() {
        super();
        this.termOptions = new TermOptions();
    }
}

class DDOptions extends GuildConfigOptionsOptionClass {
    /**
     * If true, Citizens can appoint moderators through referendums. If false, they collectively work as moderators.
     */
    @prop ({ required: true })
    appointModerators!: boolean;

    /**
     * If true, Citizens can appoint judges through referendums. If false, they collectively work as judges.
     */
    @prop ({ required: true })
    appointJudges!: boolean;
}

export {
    ThresholdOptions, LegislativeThresholdOptions,
    PresidentialOptions, DDOptions,
    TermOptions, SeatOptions,
};