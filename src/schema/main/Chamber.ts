import {
  prop, getModelForClass, isDocument, modelOptions, getDiscriminatorModelForClass,
  type Ref,
} from '@typegoose/typegoose';

import { ThresholdOptions, TermOptions, SeatOptions } from '../options/RoleOptions.ts';
import {
  PoliticalBranchType, LegislativeChamberType, PoliticalSystemType
} from '../../types/systems.ts';
import GuildModel from './PoliticalGuild.ts';

import type PoliticalChannel from '../channels/PoliticalChannel.ts';
import type { GuildConfigData } from '../../types/wizard.ts';


/**
 * Represents a base Chamber document.
 * 
 * @class Chamber
*/
@modelOptions({ 
  schemaOptions: { 
    collection: "chambers",
    //discriminatorKey: "branch",
  }
})
class Chamber {
  @prop({ required: true })
  branch!: PoliticalBranchType;

  @prop({ ref: () => 'PoliticalChannel' })
  channel?: Ref<PoliticalChannel>;

  @prop({ required: true, _id: false })
  thresholds!: ThresholdOptions;

  // Typeguards
  isLegislature(): this is Legislature {
    return this.branch === PoliticalBranchType.Legislative;
  }

  isCourt(): this is Court {
    return this.branch === PoliticalBranchType.Judicial;
  }

  /**
   * This function creates a Chamber document based on the political branch type
   * and the guild configuration data.
   * 
   * @param politicalBranchType 
   * @param guildConfigData 
   * @returns {Promise<Ref<T>>} - The reference to the created Chamber document
   */
  static async createChamberDocument<T extends Chamber>(
    politicalBranchType: PoliticalBranchType,
    guildConfigData: GuildConfigData
  ): Promise<Ref<T>> {
    let chamber: Chamber;

    if (politicalBranchType !== PoliticalBranchType.Legislative) {
      chamber = new Court(guildConfigData);
    } else {
      if (guildConfigData.politicalSystem === PoliticalSystemType.DirectDemocracy) {
        chamber = new Referendum(guildConfigData);
      } else {
        chamber = new Senate(guildConfigData);
      }
    }

    return await ChamberModel.create(chamber) as Ref<T>;
  }

  static async linkChamberChannelDocument(
    guildID: string,
    politicalBranch: PoliticalBranchType,
    politicalChannelDocument: Ref<PoliticalChannel>
  ) {
    // Find the guild document and populate the politicalSystem field
    const guildDocument = await GuildModel.findOne({ guildID });
    if (!guildDocument) {
      return;
    }
        
    await guildDocument.populate('politicalSystem');
    
    if (!isDocument(guildDocument.politicalSystem)) {
      return;
    }
        
    // Determine the chamber based on the chamber type
    let chamber: Ref<Chamber>;
    
    switch (politicalBranch) {
      case PoliticalBranchType.Legislative:
        chamber = guildDocument.politicalSystem.legislature;
        break;
      case PoliticalBranchType.Judicial:
        chamber = guildDocument.politicalSystem.court;
        break;
      default:
        return;
    }
    
    // Link the channel
    await ChamberModel.findOneAndUpdate(
      { _id: chamber },
      { channel: politicalChannelDocument }
    );
  }

  static async deleteChamberDocument(_id: Ref<Chamber>) {
    await ChamberModel.deleteOne({ _id });
  }
}

/**
 * Represents a legislative chamber.
 * 
 * @extends Chamber
 */
class Legislature extends Chamber {
  branch = PoliticalBranchType.Legislative;

  @prop({ enum: () => LegislativeChamberType })
  legislativeChamberType?: LegislativeChamberType;

  // Typeguards

  isSenate(): this is Senate {
    return this.legislativeChamberType === LegislativeChamberType.Senate;
  }

  isReferendum(): this is Referendum {
    return this.legislativeChamberType === LegislativeChamberType.Referendum;
  }
}

/**
 * Represents the Senate chamber.
 * 
 * This chamber is the default legislative chamber for both Presidential and Parliamentary systems.
 * 
 * @extends Legislature
 * @extends Chamber
 */
class Senate extends Legislature {
  legislativeChamberType = LegislativeChamberType.Senate;

  @prop({ _id: false })
  termOptions: TermOptions;

  @prop({ _id: false })
  seatOptions: SeatOptions;

  constructor(guildConfigData: GuildConfigData) {
    super();
        
    const { cursor, ...termOptions } = guildConfigData.senateOptions!.terms;
    this.termOptions = termOptions;
    this.seatOptions = guildConfigData.senateOptions!.seats;

    const { cursor: _cursor, ...senateThresholds } = guildConfigData.senateOptions!.threshold;
    this.thresholds = senateThresholds;
  }
}

/**
 * Represents the Referendum chamber.
 * 
 * If Direct Democracy is enabled, this chamber is used instead of the Senate.
 * 
 * @extends Legislature
 * @extends Chamber
 */
class Referendum extends Legislature {
  legislativeChamberType = LegislativeChamberType.Referendum;

  constructor(guildConfigData: GuildConfigData) {
    super();
        
    const { cursor, ...referendumThresholds } = guildConfigData.referendumThresholds!;
    this.thresholds = referendumThresholds;
  }
}

/**
 * Represents the Court chamber.
 * 
 * If Direct Democracy is enabled and appointJudges is false, this value is set to 0.
 * 
 * @extends Chamber
 * @class
 */
class Court extends Chamber {
  branch = PoliticalBranchType.Judicial;

  @prop({ _id: false })
  termOptions?: TermOptions;

  @prop({ required: true, _id: false })
  seatOptions: SeatOptions;

  constructor(guildConfigData: GuildConfigData) {
    super();

    this.seatOptions = new SeatOptions();
    this.seatOptions.scalable = false; // Court seats are fixed

    // Citizens act as judges
    if (guildConfigData.politicalSystem === PoliticalSystemType.DirectDemocracy
      && guildConfigData.ddOptions!.appointJudges === false) {
      this.seatOptions.value = 0;
      this.thresholds = guildConfigData.referendumThresholds!;
    } else { // Judges
      const { cursor, ...courtOptions } = guildConfigData.courtOptions!.terms;
      this.termOptions = courtOptions;

      this.thresholds = guildConfigData.courtOptions!.threshold;
      // Since scalable is false, value is fixed, direct assignment is fine
      this.seatOptions!.value = guildConfigData.courtOptions!.seats.value;
    }
  }
}

const ChamberModel = getModelForClass(Chamber);
getDiscriminatorModelForClass(ChamberModel, Senate);
getDiscriminatorModelForClass(ChamberModel, Referendum);
getDiscriminatorModelForClass(ChamberModel, Court);

export default Chamber;
export { Legislature, Senate, Referendum, ChamberModel, Court };