import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

import PoliticalRole, { Senator, Citizen, deletePoliticalRoleDocument } from "./PoliticalRole.js";
import PoliticalChannel, { deletePoliticalChannelDocument } from './PoliticalChannel.js';

import { PoliticalBranchType } from '../../types/static.js';

class Chamber {
    @prop({ required: true })
    id!: PoliticalBranchType;

    @prop({ required: true })
    name!: string;

    @prop()
    role?: Ref<PoliticalRole>;

    @prop({ required: true })
    threshold: number = 0.5;

    @prop()
    termLength?: number;

    @prop()
    channelID?: Ref<PoliticalChannel>;
}

class Legislature extends Chamber {
    id = PoliticalBranchType.Legislative;

    @prop({ required: true })
    amendmentThreshold: number = 2/3;
}

class Senate extends Legislature {
    name = "Senate";
    declare role?: Ref<Senator>;

    @prop({ required: true })
    termLength: number = 90 * 86400;

    @prop({ required: true })
    termLimit: number = 0;

    @prop({ required: true })
    seats: number = 10;
}

class Referendum extends Legislature {
    name = "Referendum";
    declare role?: Ref<Citizen>;
}

class Court extends Chamber {
    id = PoliticalBranchType.Judicial;
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
    const channelDocument = chamber.channelID;

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