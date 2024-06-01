import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

import PoliticalChannel, { deletePoliticalChannelDocument } from './PoliticalChannel.js';

class GuildCategory {
    @prop({ required: true })
    name!: string;

    @prop()
    categoryID?: string;

    @prop()
    channels?: Ref<PoliticalChannel>[];
}

const GuildCategoryModel = getModelForClass(GuildCategory);

async function deleteGuildCategoryDocument(_id: Ref<GuildCategory>) {
    // Find the guild category document
    const guildCategory = await GuildCategoryModel.findOne({ _id });
    if (!guildCategory) {
        return;
    }

    const channels = guildCategory.channels;
    for (const channel of channels ?? []) {
        deletePoliticalChannelDocument(channel);
    }

    await GuildCategoryModel.deleteOne({ _id });
}

export default GuildCategory;
export { GuildCategoryModel };
export { deleteGuildCategoryDocument };