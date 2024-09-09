import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';
import type { Guild } from 'discord.js';

import PoliticalRole from "./PoliticalRole.js";

import type { PoliticalRoleHolderInterface } from "../../types/permissions.js";

/**
 * A class that holds Refs to all political role documents in a guild.
 * 
 * @class PoliticalRoleHolder
 * @implements {PoliticalRoleHolderInterface<Ref<PoliticalRole>>}
 */
class PoliticalRoleHolder implements PoliticalRoleHolderInterface<Ref<PoliticalRole>> {
    @prop({ required: true, ref: () => 'PoliticalRole' })
    VoxPopuli!: Ref<PoliticalRole>;

    @prop({ ref: () => 'PoliticalRole' })
    President?: Ref<PoliticalRole>;

    @prop({ ref: () => 'PoliticalRole' })
    PrimeMinister?: Ref<PoliticalRole>;

    @prop({ ref: () => 'PoliticalRole' })
    HeadModerator?: Ref<PoliticalRole>;

    @prop({ ref: () => 'PoliticalRole' })
    Moderator?: Ref<PoliticalRole>;

    @prop({ ref: () => 'PoliticalRole' })
    Senator?: Ref<PoliticalRole>;

    @prop({ ref: () => 'PoliticalRole' })
    Judge?: Ref<PoliticalRole>;

    @prop({ required: true, ref: () => 'PoliticalRole' })
    Citizen!: Ref<PoliticalRole>;

    @prop({ required: true, ref: () => 'PoliticalRole' })
    Undocumented!: Ref<PoliticalRole>;

    async createPoliticalRoleHolderDocument(): Promise<Ref<PoliticalRoleHolder>> {
        return await PoliticalRoleHolderModel.create(this);
    }

    static async deletePoliticalRoleHolderDocument(guild: Guild, roleHolderDocumentRef: Ref<PoliticalRoleHolder>, deleteObjects: boolean, reason?: string) {
        const politicalRoleHolder = await PoliticalRoleHolderModel.findOneAndDelete({ _id: roleHolderDocumentRef });
        if (!politicalRoleHolder) {
            return;
        }
    
        await Promise.all(
            Object.values(politicalRoleHolder.toObject()).map(async (role: Ref<PoliticalRole>) => {
                if (role) {
                    await PoliticalRole.deletePoliticalRoleDocument(guild, role, deleteObjects, reason);
                }
            })
        );
    }
}

const PoliticalRoleHolderModel = getModelForClass(PoliticalRoleHolder);

export default PoliticalRoleHolder;
export { PoliticalRoleHolderModel };