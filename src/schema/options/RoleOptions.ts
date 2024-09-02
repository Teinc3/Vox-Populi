import { prop } from '@typegoose/typegoose';

import { GuildConfigOptionsOptionClass } from "../../types/wizard.js";

class ThresholdOptions extends GuildConfigOptionsOptionClass {
    /**
     * Percentage of votes needed to pass a normal resolution
     */
    @prop({ required: true })
    simple!: number;

    /**
     * Percentage of votes needed for "Important Affairs",
     * such as amending the constitution, overriding a veto (if allowed), and impeaching an official
     */
    @prop({ required: true })
    super!: number;
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
     * Can the person hold consecutive terms?
     */
    @prop({ required: true })
    consecutive!: boolean;
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

export { ThresholdOptions, TermOptions, SeatOptions };