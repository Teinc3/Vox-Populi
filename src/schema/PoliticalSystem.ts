import mongoose from 'mongoose';
import { prop, getModelForClass, type Ref, Severity } from '@typegoose/typegoose';

import Chamber, { Legislature, Senate, Referendum, Court } from "./Chamber.js";
import { PresidentialOptions, ParliamentaryOptions, DDOptions } from './options/SystemOptions.js';

import { PoliticalBranchType, PoliticalSystemsType } from '../types/types.js';
import { GuildConfigData } from '../types/wizard.js';

class PoliticalSystem {
    @prop({ required: true })
    id!: PoliticalSystemsType;

    @prop({ required: true, ref: () => 'Legislature' })
    legislature!: Ref<Legislature>;

    @prop({ required: true, ref: () => 'Court' })
    court!: Ref<Court>;

    @prop({ _id: false, allowMixed: Severity.ALLOW, type: () => mongoose.Schema.Types.Mixed })
    options!: PresidentialOptions | ParliamentaryOptions | DDOptions;

    constructor(politicalSystemType: PoliticalSystemsType) {
        this.id = politicalSystemType;
        switch (politicalSystemType) {
            case PoliticalSystemsType.Presidential:
                this.options = new PresidentialOptions();
                break;
            case PoliticalSystemsType.Parliamentary:
                this.options = new ParliamentaryOptions();
                break;
            case PoliticalSystemsType.DirectDemocracy:
                this.options = new DDOptions();
                break;
        }
    }

    // Type guards
    isPresidential(): this is { options: PresidentialOptions, legislature: Ref<Senate> } {
        return this.id === PoliticalSystemsType.Presidential;
    }

    isParliamentary(): this is { options: ParliamentaryOptions, legislature: Ref<Senate> } {
        return this.id === PoliticalSystemsType.Parliamentary;
    }

    isDirectDemocracy(): this is { options: DDOptions, legislature: Ref<Referendum> } {
        return this.id === PoliticalSystemsType.DirectDemocracy;
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