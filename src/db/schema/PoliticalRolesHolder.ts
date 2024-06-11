import { prop, type Ref, getModelForClass } from '@typegoose/typegoose';

import PoliticalRole, { President, PrimeMinister, HeadModerator, Senator, Judge, Moderator, Citizen, Undocumented, deletePoliticalRoleDocument, PoliticalRoleNames } from "./PoliticalRole.js";

class PoliticalRoleHolder {
    @prop()
    President?: Ref<President>;

    @prop()
    PrimeMinister?: Ref<PrimeMinister>;

    @prop()
    HeadModerator?: Ref<HeadModerator>;

    @prop()
    Senator?: Ref<Senator>;

    @prop()
    Judge?: Ref<Judge>;

    @prop()
    Moderator?: Ref<Moderator>;

    @prop()
    Citizen?: Ref<Citizen>;

    @prop()
    Undocumented?: Ref<Undocumented>;
}

const PoliticalRoleHolderModel = getModelForClass(PoliticalRoleHolder);

async function createPoliticalRoleHolderDocument(politicalRoleHolder: PoliticalRoleHolder): Promise<Ref<PoliticalRoleHolder>> {
    return await PoliticalRoleHolderModel.create(politicalRoleHolder);
}

async function deletePoliticalRoleHolderDocument(_id: Ref<PoliticalRoleHolder>) {
    const politicalRoleHolder = await PoliticalRoleHolderModel.findOne({ _id });
    if (!politicalRoleHolder) {
        return;
    }

    for (const roleName of PoliticalRoleNames) {
        const role = politicalRoleHolder[roleName as keyof PoliticalRoleHolder];
        if (role) {
            await deletePoliticalRoleDocument(role as Ref<PoliticalRole>);
        }
    }
}

export default PoliticalRoleHolder;
export { PoliticalRoleHolderModel };
export { createPoliticalRoleHolderDocument, deletePoliticalRoleHolderDocument };