import { prop, type Ref, getModelForClass/* , modelOptions, Severity */ } from '@typegoose/typegoose';

import PoliticalRole, { Senator, Citizen, deletePoliticalRoleDocument } from "./PoliticalRole.js";
import PoliticalChannel, { deletePoliticalChannelDocument } from './PoliticalChannel.js';

import { PoliticalBranchType } from '../../types/static.js';

//@modelOptions({ schemaOptions: { collection: "chambers" }, options: { allowMixed: Severity.ALLOW } })
class Chamber {
    @prop({ required: true })
    id!: PoliticalBranchType;

    @prop({ required: true })
    name!: string;

    @prop({ required: true, ref: () => 'PoliticalRole' })
    role!: Ref<PoliticalRole>;

    @prop({ ref: () => 'PoliticalChannel' })
    channel?: Ref<PoliticalChannel>;

    @prop({ required: true, default: 0.5 })
    threshold!: number;
    
    // These are optional because they are not used by Referendum
    @prop()
    termLength?: number;

    @prop()
    termLimit?: number;
}

class Legislature extends Chamber {
    id = PoliticalBranchType.Legislative;

    @prop({ required: true, default: 2/3 })
    amendmentThreshold!: number;
}

class Senate extends Legislature {
    name = "Senate";
    declare role: Ref<Senator>;

    termLimit = 2;
    termLength = 90 * 86400;

    @prop({ required: true, default: 10 })
    seats!: number;
}

class Referendum extends Legislature {
    name = "Referendum";
    declare role: Ref<Citizen>;
}

class Court extends Chamber {
    id = PoliticalBranchType.Judicial;
    name = "Court";

    termLimit = 0;
    termLength = 180 * 86400;
}

const ChamberModel = getModelForClass(Chamber);

async function createChamberDocument<T extends Chamber>(role: Ref<PoliticalRole>, ChamberType: new () => T): Promise<Ref<T>> {
    const chamber = new ChamberType();
    chamber.role = role;
    
    return await ChamberModel.create(chamber) as Ref<T>;
}

async function deleteChamberDocument(_id: Ref<Chamber>) {
    // Find the chamber document
    const chamber = await ChamberModel.findOne({ _id });
    if (!chamber) {
        return;
    }

    // Find the role and channel documents
    const roleDocument = chamber.role;
    const channelDocument = chamber.channel;

    // Delete them
    if (roleDocument) {
        await deletePoliticalRoleDocument(roleDocument);
    }
    if (channelDocument) {
        await deletePoliticalChannelDocument(channelDocument);
    }

    // Delete the chamber document
    await ChamberModel.deleteOne({ _id });
}

export default Chamber;
export { Legislature, Senate, Referendum, ChamberModel, Court };
export { createChamberDocument, deleteChamberDocument };