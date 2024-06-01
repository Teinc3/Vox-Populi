import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

import PoliticalRole, { Senator, Citizen, deletePoliticalSystemRoleDocument } from "./PoliticalRole.js";
import PoliticalChannel, { deletePoliticalChannelDocument } from './PoliticalChannel.js';

import { PoliticalSystemsType } from '../../types/static.js';

class Legislature<T extends PoliticalRole> {
    @prop()
    role!: Ref<T>;

    @prop({ required: true })
    threshold: number = 0.5;

    @prop({ required: true })
    amendmentThreshold: number = 2/3;

    @prop()
    channelID?: Ref<PoliticalChannel>;
}

class Senate extends Legislature<Senator> {
    @prop({ required: true })
    termLength!: number;

    @prop({ required: true })
    termLimit!: number;

    @prop({ required: true })
    seats!: number;
}

class Referendum extends Legislature<Citizen> {}

const LegislatureModel = getModelForClass(Legislature);


function legislatureCreationTriage(politicalSystemType: PoliticalSystemsType): Legislature<PoliticalRole> {
    if (politicalSystemType === PoliticalSystemsType.DirectDemocracy) {
        return new Referendum();
    } else {
        return new Senate();
    }
}

async function deleteLegislatureDocument(_id: Ref<Legislature<PoliticalRole>>) {
    // Find the legislature document
    const legislature = await LegislatureModel.findOne({ _id });
    if (!legislature) {
        return;
    }

    // Find the role and channel documents
    const roleDocument = legislature.role;
    const channelDocument = legislature.channelID;

    // Delete them
    if (roleDocument) {
        await deletePoliticalSystemRoleDocument(roleDocument);
    }
    if (channelDocument) {
        await deletePoliticalChannelDocument(channelDocument);
    }

    // Delete the legislature document
    await LegislatureModel.deleteOne({ _id });
}

export default Legislature;
export { Senate, Referendum, LegislatureModel };
export { legislatureCreationTriage, deleteLegislatureDocument };