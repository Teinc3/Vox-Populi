import { prop, type Ref, getModelForClass,/* , modelOptions, Severity */ 
isDocument} from '@typegoose/typegoose';

import PoliticalChannel from './channels/PoliticalChannel.js';
import GuildModel from './Guild.js';
import { Thresholds, TermOptions, SeatOptions } from './options.js';

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
    thresholds!: Thresholds;
    
    // These are optional because they are not used by Referendum
    @prop({ _id: false })
    termOptions?: TermOptions;

    @prop({ _id: false })
    seatOptions?: SeatOptions;

    constructor() {
        this.thresholds = new Thresholds();
    }
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

class Court extends Chamber {
    id = PoliticalBranchType.Judicial;
    name = "Court";

    constructor() {
        super();
        // this.termOptions = new TermOptions();
        // this.seatOptions = new SeatOptions();
        // this.seatOptions.scaleable = false; // Court seats are fixed
    }
}

const ChamberModel = getModelForClass(Chamber);

async function createChamberDocument<T extends Chamber>(politicalBranchType: PoliticalBranchType, guildConfigData: GuildConfigData): Promise<Ref<T>> {
    const ChamberType: new () => Chamber = politicalBranchType === PoliticalBranchType.Legislative ? guildConfigData.politicalSystem === PoliticalSystemsType.DirectDemocracy ? Referendum : Senate : Court;
    let chamber = new ChamberType();
    
    if (ChamberType === Senate) {
        chamber.termOptions!.termLength = guildConfigData.senateOptions!.terms.termLength;
        chamber.termOptions!.termLimit = guildConfigData.senateOptions!.terms.termLimits;
        
        chamber.seatOptions!.value = guildConfigData.senateOptions!.seats.value;
        chamber.seatOptions!.scaleable = guildConfigData.senateOptions!.seats.scaleable;
    } else if (ChamberType === Referendum) {
        // Referendum Options
    } else {
        // Court options (substitute)
        chamber.thresholds.amendment = guildConfigData.senateOptions!.threshold.amendment;
        chamber.thresholds.pass = guildConfigData.senateOptions!.threshold.pass;
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