import { prop, type Ref, getModelForClass,/* , modelOptions, Severity */ 
isDocument} from '@typegoose/typegoose';

import PoliticalChannel from './channels/PoliticalChannel.js';
import GuildModel from './Guild.js';
import { ThresholdOptions, TermOptions, SeatOptions } from './options/RoleOptions.js';

import { GuildConfigData, PoliticalBranchType, PoliticalSystemsType } from '../types/types.js';

//@modelOptions({ schemaOptions: { collection: "chambers" }, options: { allowMixed: Severity.ALLOW } })
class Chamber {
    @prop({ required: true })
    id!: PoliticalBranchType;

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
}

class Legislature extends Chamber {
    id = PoliticalBranchType.Legislative;
}

class Senate extends Legislature {
    name = "Senate";

    constructor() {
        super();
        this.termOptions = new TermOptions();
        this.seatOptions = new SeatOptions();
    }
}

class Referendum extends Legislature {
    name = "Referendum";
}

/**
 * Represents the Court chamber.
 * 
 * @extends Chamber
 * @property {SeatOptions.seats} seats - The number of Judges in the Court.
 * If Direct Democracy is enabled and appointJudges is false, this value is set to 0.
 * 
 * @class
 * @public
 */
class Court extends Chamber {
    id = PoliticalBranchType.Judicial;
    name = "Court";

    constructor() {
        super();
        this.thresholds = new ThresholdOptions();
        this.seatOptions = new SeatOptions();
        this.seatOptions.scalable = false; // Court seats are fixed

        // No term options as it might be possible that there are no judges (if ddOptions.appointJudges is false)
    }
}

const ChamberModel = getModelForClass(Chamber);

/**
 * This function creates a Chamber document based on the political branch type and the guild configuration data.
 * 
 * @param politicalBranchType 
 * @param guildConfigData 
 * @returns {Promise<Ref<T>>} - The reference to the created Chamber document
 */
async function createChamberDocument<T extends Chamber>(politicalBranchType: PoliticalBranchType, guildConfigData: GuildConfigData): Promise<Ref<T>> {
    const ChamberType: typeof Senate | typeof Referendum | typeof Court 
        = politicalBranchType === PoliticalBranchType.Legislative ? guildConfigData.politicalSystem === PoliticalSystemsType.DirectDemocracy ? Referendum : Senate : Court;
    const chamber = new ChamberType();
    
    if (chamber instanceof Senate) {
        const { cursor, ...termOptions } = guildConfigData.senateOptions!.terms;
        chamber.termOptions = termOptions;
        chamber.seatOptions = guildConfigData.senateOptions!.seats;

        const { cursor: _cursor, ...senateThresholds } = guildConfigData.senateOptions!.threshold;
        chamber.thresholds = senateThresholds;

    } else if (chamber instanceof Referendum) {
        const { cursor, ...referendumThresholds } = guildConfigData.referendumThresholds!;
        chamber.thresholds = referendumThresholds;

    } else { // Court options 
        if (guildConfigData.ddOptions?.appointJudges === false) {
            chamber.seatOptions!.value = 0;
            chamber.thresholds = guildConfigData.referendumThresholds!;
        } else {
            const { cursor, ...courtOptions } = guildConfigData.courtOptions!.terms;
            chamber.termOptions = courtOptions;

            chamber.thresholds = guildConfigData.courtOptions!.threshold;
            chamber.seatOptions!.value = guildConfigData.courtOptions!.seats.value; // Since scalable is false, value is fixed, direct assignment is fine
        }
    }
    
    return await ChamberModel.create(chamber) as Ref<T>;
}

async function linkChamberChannelDocument(guildID: string, chamberType: PoliticalBranchType, politicalChannelDocument: Ref<PoliticalChannel>) {
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

    switch (chamberType) {
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
    await ChamberModel.findOneAndUpdate({ _id: chamber }, { channel: politicalChannelDocument }, { new: true });
}

async function deleteChamberDocument(_id: Ref<Chamber>) {
    await ChamberModel.deleteOne({ _id });
}

export default Chamber;
export { Legislature, Senate, Referendum, ChamberModel, Court };
export { createChamberDocument, linkChamberChannelDocument, deleteChamberDocument };