import {
  prop, getModelForClass, modelOptions, getDiscriminatorModelForClass,
  type Ref
} from '@typegoose/typegoose';

import { TermOptions } from '../options/RoleOptions.ts';
import { PoliticalSystemType, PoliticalBranchType, type DDOptions } from '../../types/systems.ts';
import Chamber, { type Legislature, type Senate, type Referendum, type Court } from "./Chamber.js";

import type { GuildConfigData } from '../../types/wizard.ts';


@modelOptions({ schemaOptions: { collection: "politicalsystems" } })
class PoliticalSystem<LegislatureType extends Legislature = Legislature> {
  @prop({ required: true })
  type!: PoliticalSystemType;

  @prop({ required: true, ref: () => 'Legislature' })
  legislature!: Ref<LegislatureType>;

  @prop({ required: true, ref: () => 'Court' })
  court!: Ref<Court>;

  // Type guards
  isPresidential(): this is Presidential {
    return this.type === PoliticalSystemType.Presidential;
  }

  isParliamentary(): this is Parliamentary {
    return this.type === PoliticalSystemType.Parliamentary;
  }

  isDirectDemocracy(): this is DirectDemocracy {
    return this.type === PoliticalSystemType.DirectDemocracy;
  }

  /**
   * Creates a PoliticalSystem document based on the guildConfigData and the politicalRoleHolder.
   * 
   * @param guildConfigData 
   * @param politicalRoleHolder 
   * @return { Promise<Ref<PoliticalSystem>> } - The reference to the created
   *  PoliticalSystem document
   */
  static async createPoliticalSystemDocument(
    guildConfigData: GuildConfigData
  ): Promise<Ref<PoliticalSystem>> {
    const { politicalSystem: politicalSystemType } = guildConfigData;

    let politicalSystem: PoliticalSystem;
    switch (politicalSystemType) {
      case PoliticalSystemType.Presidential:
        politicalSystem = new Presidential(guildConfigData);
        break;
      case PoliticalSystemType.Parliamentary:
        politicalSystem = new Parliamentary(guildConfigData);
        break;
      case PoliticalSystemType.DirectDemocracy:
        politicalSystem = new DirectDemocracy(guildConfigData);
        break;
    }

    // Create Legislature document
    politicalSystem.legislature
      = await Chamber.createChamberDocument(PoliticalBranchType.Legislative, guildConfigData);
    politicalSystem.court
      = await Chamber.createChamberDocument(PoliticalBranchType.Judicial, guildConfigData);

    // Save the political system document and return the reference
    return await PoliticalSystemModel.create(politicalSystem);
  }

  static async deletePoliticalSystemDocument(_id: Ref<PoliticalSystem>) {
    // Find the political system document
    const politicalSystem = await PoliticalSystemModel.findOneAndDelete({ _id });
    if (!politicalSystem) {
      return;
    }
    
    // Find Chamber Documents
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

class Presidential extends PoliticalSystem<Senate> {
  type = PoliticalSystemType.Presidential;

  /**
     * Can the President veto/override any legislation passed by the Legislature?
     */
  /*
    @prop({ required: true })
    veto!: boolean;
     */

  @prop({ required: true, _id: false })
  termOptions: TermOptions;

  constructor(guildConfigData: GuildConfigData) {
    super();

    const { cursor, ...gcTermOptions } = guildConfigData.presidentialOptions!;
    this.termOptions = gcTermOptions;
  }
}

class Parliamentary extends PoliticalSystem<Senate> {
  type = PoliticalSystemType.Parliamentary;

  /**
     * Number of months before a snap election can be called.
     * 
     * If set to 0, snap elections are disabled.
     */
  @prop({ required: true })
  snapElection!: number;

  constructor(guildConfigData: GuildConfigData) {
    super();

    this.snapElection = guildConfigData.parliamentaryOptions!.snapElection;
  }
}

/**
 * Class representing a Direct Democracy political system.
 * 
 * @class
 * @extends {PoliticalSystem}
 * @implements {DDOptions}
 */
class DirectDemocracy extends PoliticalSystem<Referendum> implements DDOptions {
  type = PoliticalSystemType.DirectDemocracy;

  @prop({ required: true })
  appointModerators!: boolean;

  @prop({ required: true })
  appointJudges!: boolean;

  constructor(guildConfigData: GuildConfigData) {
    super();

    this.appointModerators = guildConfigData.ddOptions!.appointModerators;
    this.appointJudges = guildConfigData.ddOptions!.appointJudges;
  }
}

const PoliticalSystemModel = getModelForClass(PoliticalSystem);
getDiscriminatorModelForClass(PoliticalSystemModel, Presidential);
getDiscriminatorModelForClass(PoliticalSystemModel, Parliamentary);
getDiscriminatorModelForClass(PoliticalSystemModel, DirectDemocracy);

export default PoliticalSystem;
export { PoliticalSystemModel };