import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';
import { type Guild } from 'discord.js';

import PoliticalRole, { VoxPopuli, President, PrimeMinister, HeadModerator, Senator, Judge, Moderator, Citizen, Undocumented, deletePoliticalRoleDocument } from "./PoliticalRole.js";

import { PoliticalRoleHolderInterface } from '../../types/types.js';

class PoliticalRoleHolder implements PoliticalRoleHolderInterface<Ref<PoliticalRole>> {
    @prop({ required: true, ref: () => 'VoxPopuli' })
    VoxPopuli!: Ref<VoxPopuli>;

    @prop({ ref: () => 'President' })
    President?: Ref<President>;

    @prop({ ref: () => 'PrimeMinister' })
    PrimeMinister?: Ref<PrimeMinister>;

    @prop({ ref: () => 'HeadModerator' })
    HeadModerator?: Ref<HeadModerator>;

    @prop({ ref: () => 'Moderator' })
    Moderator?: Ref<Moderator>;

    @prop({ ref: () => 'Senator' })
    Senator?: Ref<Senator>;

    @prop({ ref: () => 'Judge' })
    Judge?: Ref<Judge>;

    @prop({ required: true, ref: () => 'Citizen' })
    Citizen!: Ref<Citizen>;

    @prop({ required: true, ref: () => 'Undocumented' })
    Undocumented!: Ref<Undocumented>;
}

const PoliticalRoleHolderModel = getModelForClass(PoliticalRoleHolder);

async function createPoliticalRoleHolderDocument(politicalRoleHolder: PoliticalRoleHolder): Promise<Ref<PoliticalRoleHolder>> {
    return await PoliticalRoleHolderModel.create(politicalRoleHolder);
}

async function deletePoliticalRoleHolderDocument(guild: Guild, _id: Ref<PoliticalRoleHolder>, reason?: string) {
    const politicalRoleHolder = await PoliticalRoleHolderModel.findOneAndDelete({ _id });
    if (!politicalRoleHolder) {
        return;
    }

    await Promise.all(
        Object.values(politicalRoleHolder.toObject()).map(async (role) => {
            if (role) {
                await deletePoliticalRoleDocument(guild, role as Ref<PoliticalRole>, reason);
            }
        })
    );
}

export default PoliticalRoleHolder;
export { PoliticalRoleHolderModel, PoliticalRoleHolderInterface };
export { createPoliticalRoleHolderDocument, deletePoliticalRoleHolderDocument };