import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';
import { type Guild } from 'discord.js';

import PoliticalRole, { President, PrimeMinister, HeadModerator, Senator, Judge, Moderator, Citizen, deletePoliticalRoleDocument, PoliticalRoleObjectList } from "./PoliticalRole.js";

class PoliticalRoleHolder {
    @prop({ ref: () => 'President' })
    President?: Ref<President>;

    @prop({ ref: () => 'PrimeMinister' })
    PrimeMinister?: Ref<PrimeMinister>;

    @prop({ ref: () => 'HeadModerator' })
    HeadModerator?: Ref<HeadModerator>;

    @prop({ ref: () => 'Senator' })
    Senator?: Ref<Senator>;

    @prop({ ref: () => 'Judge' })
    Judge?: Ref<Judge>;

    @prop({ ref: () => 'Moderator' })
    Moderator?: Ref<Moderator>;

    @prop({ ref: () => 'Citizen' })
    Citizen?: Ref<Citizen>;
}

const PoliticalRoleHolderModel = getModelForClass(PoliticalRoleHolder);

async function createPoliticalRoleHolderDocument(politicalRoleHolder: PoliticalRoleHolder): Promise<Ref<PoliticalRoleHolder>> {
    return await PoliticalRoleHolderModel.create(politicalRoleHolder);
}

async function deletePoliticalRoleHolderDocument(guild: Guild, _id: Ref<PoliticalRoleHolder>) {
    const politicalRoleHolder = await PoliticalRoleHolderModel.findOne({ _id });
    if (!politicalRoleHolder) {
        return;
    }

    for (const PoliticalRoleObject of PoliticalRoleObjectList) {
        const roleName = PoliticalRoleObject.name;
        const role = politicalRoleHolder[roleName.replace(" ", "") as keyof PoliticalRoleHolder];
        if (role) {
            await deletePoliticalRoleDocument(guild, role as Ref<PoliticalRole>);
        }
    }

    await PoliticalRoleHolderModel.deleteOne({ _id });
}

export default PoliticalRoleHolder;
export { PoliticalRoleHolderModel };
export { createPoliticalRoleHolderDocument, deletePoliticalRoleHolderDocument };