import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

class PoliticalChannel {
    @prop({ required: true })
    name!: string;

    @prop()
    channelID?: string;
}

const PoliticalChannelModel = getModelForClass(PoliticalChannel);

async function deletePoliticalChannelDocument(_id: Ref<PoliticalChannel>) {
    await PoliticalChannelModel.deleteOne({ _id });
}

export default PoliticalChannel;
export { PoliticalChannelModel };
export { deletePoliticalChannelDocument };