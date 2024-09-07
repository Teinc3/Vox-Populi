import mongoose from 'mongoose';
import { prop, getModelForClass, type Ref, Severity } from '@typegoose/typegoose';

import Chamber, { type Legislature, type Senate, type Referendum, type Court } from "./Chamber.js";
import { PresidentialOptions, ParliamentaryOptions, DDOptions } from './options/SystemOptions.js';

import type { GuildConfigData } from '../types/wizard.js';
import { PoliticalSystemType, PoliticalBranchType } from '../types/types.js';

class PoliticalSystem {
    @prop({ required: true })
    id!: PoliticalSystemType;

    @prop({ required: true, ref: () => 'Legislature' })
    legislature!: Ref<Legislature>;

    @prop({ required: true, ref: () => 'Court' })
    court!: Ref<Court>;

    @prop({ _id: false, allowMixed: Severity.ALLOW, type: () => mongoose.Schema.Types.Mixed })
    options!: PresidentialOptions | ParliamentaryOptions | DDOptions;

    constructor(politicalSystemType: PoliticalSystemType) {
        this.id = politicalSystemType;
        switch (politicalSystemType) {
            case PoliticalSystemType.Presidential:
                this.options = new PresidentialOptions();
                break;
            case PoliticalSystemType.Parliamentary:
                this.options = new ParliamentaryOptions();
                break;
            case PoliticalSystemType.DirectDemocracy:
                this.options = new DDOptions();
                break;
        }
    }

    // Type guards
    isPresidential(): this is { options: PresidentialOptions, legislature: Ref<Senate> } {
        return this.id === PoliticalSystemType.Presidential;
    }

    isParliamentary(): this is { options: ParliamentaryOptions, legislature: Ref<Senate> } {
        return this.id === PoliticalSystemType.Parliamentary;
    }

    isDirectDemocracy(): this is { options: DDOptions, legislature: Ref<Referendum> } {
        return this.id === PoliticalSystemType.DirectDemocracy;
    }

    /**
     * Creates a PoliticalSystem document based on the guildConfigData and the politicalRoleHolder.
     * 
     * @param guildConfigData 
     * @param politicalRoleHolder 
     * @return { Promise<Ref<PoliticalSystem>> } - The reference to the created PoliticalSystem document
     * 
     */
    static async createPoliticalSystemDocument(guildConfigData: GuildConfigData): Promise<Ref<PoliticalSystem>> {
        const { politicalSystem: politicalSystemType } = guildConfigData;
        const politicalSystem = new PoliticalSystem(politicalSystemType);

        if (politicalSystem.isPresidential()) {
            const { cursor, ...gcTermOptions } = guildConfigData.presidentialOptions!;
            politicalSystem.options.termOptions! = gcTermOptions;
        } else if (politicalSystem.isParliamentary()) {
            politicalSystem.options.snapElection = guildConfigData.parliamentaryOptions!.snapElection;
        } else if (politicalSystem.isDirectDemocracy()) {
            politicalSystem.options = guildConfigData.ddOptions!;
        }

        // Create Legislature document
        politicalSystem.legislature = await Chamber.createChamberDocument(PoliticalBranchType.Legislative, guildConfigData);
        politicalSystem.court = await Chamber.createChamberDocument(PoliticalBranchType.Judicial, guildConfigData);

        // Save the political system document and return the reference
        return await PoliticalSystemModel.create(politicalSystem);
    }

    static async deletePoliticalSystemDocument(_id: Ref<PoliticalSystem>) {
        // Find the political system document
        const politicalSystem = await PoliticalSystemModel.findOneAndDelete({ _id });
        if (!politicalSystem) {
            return;
        }
    
        // Find documents: HoS, Legislature, Court
        const legislatureDocument = politicalSystem.legislature;
        const courtDocument = politicalSystem.court;
    
        // Delete legislature and court if still exist (not HOS, since deleted through political role)
        if (legislatureDocument) {
            await Chamber.deleteChamberDocument(legislatureDocument);
        }
        if (courtDocument) {
            await Chamber.deleteChamberDocument(courtDocument);
        }
    }
}

const PoliticalSystemModel = getModelForClass(PoliticalSystem);

export default PoliticalSystem;
export { PoliticalSystemModel };