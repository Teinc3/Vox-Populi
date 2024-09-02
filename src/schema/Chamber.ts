import { prop, type Ref, getModelForClass, isDocument } from '@typegoose/typegoose';

import PoliticalChannel from './channels/PoliticalChannel.js';
import GuildModel from './PoliticalGuild.js';
import { ThresholdOptions, TermOptions, SeatOptions } from './options/RoleOptions.js';

import { LegislativeChamberType, PoliticalBranchType, PoliticalSystemsType } from '../types/types.js';
import { GuildConfigData } from '../types/wizard.js';

/**
 * Represents a base Chamber document.
 * 
 * @class Chamber
*/
class Chamber {
    @prop({ required: true })
    branch!: PoliticalBranchType;

    @prop({ enum: () => LegislativeChamberType })
    legislativeChamberType?: LegislativeChamberType;

    @prop({ required: true })
    name!: string;

    @prop({ ref: () => 'PoliticalChannel' })
    channel?: Ref<PoliticalChannel>;

    @prop({ required: true, _id: false })
    thresholds!: ThresholdOptions;
    
    // These are optional because they are not used by Referendum
    @prop({ _id: false })
    termOptions?: TermOptions;

    @prop({ _id: false })
    seatOptions?: SeatOptions;

    // Typeguards
    isLegislature(): this is Legislature {
        return this.branch === PoliticalBranchType.Legislative;
    }

    isCourt(): this is Court {
        return this.branch === PoliticalBranchType.Judicial;
    }

    isSenate(): this is Senate {
        return this.legislativeChamberType === LegislativeChamberType.Senate;
    }

    isReferendum(): this is Referendum {
        return this.legislativeChamberType === LegislativeChamberType.Referendum;
    }

    /**
     * This function creates a Chamber document based on the political branch type and the guild configuration data.
     * 
     * @param politicalBranchType 
     * @param guildConfigData 
     * @returns {Promise<Ref<T>>} - The reference to the created Chamber document
     */
    static async createChamberDocument<T extends Chamber>(politicalBranchType: PoliticalBranchType, guildConfigData: GuildConfigData): Promise<Ref<T>> {
        let chamber: T;

        if (politicalBranchType !== PoliticalBranchType.Legislative) {
            chamber = new Court(guildConfigData) as T;
        } else {
            if (guildConfigData.politicalSystem === PoliticalSystemsType.DirectDemocracy) {
                chamber = new Referendum(guildConfigData) as T;
            } else {
                chamber = new Senate(guildConfigData) as T;
            }
        }

        return await ChamberModel.create(chamber) as Ref<T>;
    }

    static async linkChamberChannelDocument(guildID: string, politicalBranch: PoliticalBranchType, politicalChannelDocument: Ref<PoliticalChannel>) {
        // Find the guild document and populate the politicalSystem field
        const guildDocument = await GuildModel.findOne({ guildID });
        if (!guildDocument) {
            return;
        }
        
        await guildDocument.populate('politicalSystem');
    
        if (!isDocument(guildDocument.politicalSystem)) {
            return;
        }
        
        // Determine the chamber based on the chamber type
        let chamber: Ref<Chamber>;
    
        switch (politicalBranch) {
            case PoliticalBranchType.Legislative:
                chamber = guildDocument.politicalSystem.legislature;
                break;
            case PoliticalBranchType.Judicial:
                chamber = guildDocument.politicalSystem.court;
                break;
            default:
                return;
        }
    
        // Link the channel
        await ChamberModel.findOneAndUpdate({ _id: chamber }, { channel: politicalChannelDocument });
    }

    static async deleteChamberDocument(_id: Ref<Chamber>) {
        await ChamberModel.deleteOne({ _id });
    }
}

/**
 * Represents a legislative chamber.
 * 
 * @extends Chamber
 */
class Legislature extends Chamber {
    branch = PoliticalBranchType.Legislative;
}

/**
 * Represents the Senate chamber.
 * 
 * @extends Legislature
 * This chamber is the default legislative chamber for both Presidential and Parliamentary systems.
 */
class Senate extends Legislature {
    name = "Senate";
    legislativeChamberType = LegislativeChamberType.Senate;

    constructor(guildConfigData: GuildConfigData) {
        super();
        
        const { cursor, ...termOptions } = guildConfigData.senateOptions!.terms;
        this.termOptions = termOptions;
        this.seatOptions = guildConfigData.senateOptions!.seats;

        const { cursor: _cursor, ...senateThresholds } = guildConfigData.senateOptions!.threshold;
        this.thresholds = senateThresholds;
    }
}

/**
 * Represents the Referendum chamber.
 * 
 * @extends Legislature
 * If Direct Democracy is enabled, this chamber is used instead of the Senate.
 */
class Referendum extends Legislature {
    name = "Referendum";
    legislativeChamberType = LegislativeChamberType.Referendum;

    constructor(guildConfigData: GuildConfigData) {
        super();
        
        const { cursor, ...referendumThresholds } = guildConfigData.referendumThresholds!;
        this.thresholds = referendumThresholds;
    }
}

/**
 * Represents the Court chamber.
 * 
 * @extends Chamber
 * If Direct Democracy is enabled and appointJudges is false, this value is set to 0.
 * 
 * @class
 */
class Court extends Chamber {
    branch = PoliticalBranchType.Judicial;
    name = "Court";

    constructor(guildConfigData: GuildConfigData) {
        super();
        this.thresholds = new ThresholdOptions();
        this.seatOptions = new SeatOptions();
        this.seatOptions.scalable = false; // Court seats are fixed

        if (guildConfigData.politicalSystem === PoliticalSystemsType.DirectDemocracy && guildConfigData.ddOptions!.appointJudges === false) {
            this.seatOptions.value = 0;
            this.thresholds = guildConfigData.referendumThresholds!;
        } else {
            const { cursor, ...courtOptions } = guildConfigData.courtOptions!.terms;
            this.termOptions = courtOptions;

            this.thresholds = guildConfigData.courtOptions!.threshold;
            this.seatOptions!.value = guildConfigData.courtOptions!.seats.value; // Since scalable is false, value is fixed, direct assignment is fine
        }
    }
}

const ChamberModel = getModelForClass(Chamber);

export default Chamber;
export { Legislature, Senate, Referendum, ChamberModel, Court };