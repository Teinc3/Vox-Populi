import { prop, type Ref, getModelForClass,/* , modelOptions, Severity */ 
isDocument} from '@typegoose/typegoose';

import PoliticalChannel from './channels/PoliticalChannel.js';
import GuildModel from './Guild.js';

import { PoliticalBranchType } from '../types/types.js';
import constants from '../data/constants.json' assert { type: "json" };

//@modelOptions({ schemaOptions: { collection: "chambers" }, options: { allowMixed: Severity.ALLOW } })
class Chamber {
    @prop({ required: true })
    id!: PoliticalBranchType;

    @prop({ required: true })
    name!: string;

    @prop({ ref: () => 'PoliticalChannel' })
    channel?: Ref<PoliticalChannel>;

    @prop({ required: true })
    threshold!: number;
    
    // These are optional because they are not used by Referendum
    @prop()
    termLength?: number;

    @prop()
    termLimit?: number;

    @prop()
    seats?: number;
}

class Legislature extends Chamber {
    id = PoliticalBranchType.Legislative;

    threshold = constants.legislature.threshold;

    @prop({ required: true, default: constants.legislature.amendmentThreshold })
    amendmentThreshold!: number;
}

class Senate extends Legislature {
    name = "Senate";

    termLimit = constants.legislature.senate.termLimit;
    termLength = constants.legislature.senate.termLength;
    seats = constants.legislature.senate.seats;
}

class Referendum extends Legislature {
    name = "Referendum";
}

class Court extends Chamber {
    id = PoliticalBranchType.Judicial;
    name = "Court";

    termLimit = constants.judicial.termLimit;
    termLength = constants.judicial.termLength;
    threshold = constants.judicial.threshold;
    seats = constants.judicial.seats;
}

const ChamberModel = getModelForClass(Chamber);

async function createChamberDocument<T extends Chamber>(ChamberType: new () => T): Promise<Ref<T>> {
    return await ChamberModel.create(new ChamberType()) as Ref<T>;
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