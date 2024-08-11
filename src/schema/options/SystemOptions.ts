import { prop } from '@typegoose/typegoose';

import { TermOptions } from './RoleOptions.js';

import { GuildConfigOptionsOptionClass } from "../../types/types.js";

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

class ParliamentaryOptions extends GuildConfigOptionsOptionClass {
    /**
     * Number of months before a snap election can be called.
     * 
     * If set to 0, snap elections are disabled.
     */
    @prop({ required: true })
    snapElection!: number;
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

export { PresidentialOptions, ParliamentaryOptions, DDOptions };