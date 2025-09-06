import { getModelForClass, prop, type Ref } from '@typegoose/typegoose';


import PoliticalRoleHolder from '../roles/PoliticalRoleHolder.ts';
import PoliticalRole from '../roles/PoliticalRole.ts';
import LogChannelHolder from '../channels/LogChannelHolder.ts';
import GuildCategory from '../channels/GuildCategory.ts';
import PoliticalSystem from './PoliticalSystem.ts';

import type { ChatInputCommandInteraction, Guild } from 'discord.js';
import type EmergencyOptions from '../options/MiscOptions.ts';
import type { EventSchema } from '../events/Event.ts';
import type { GuildConfigData } from '../../types/wizard.ts';


class PoliticalGuild {
  @prop({ required: true, unique: true })
  guildID!: string;

  @prop({ required: true })
  isBotOwner!: boolean;

  @prop({ required: true, ref: () => 'PoliticalSystem' })
  politicalSystem!: Ref<PoliticalSystem>;

  @prop({ required: true, _id: false })
  emergencyOptions!: EmergencyOptions
    
  @prop({ default: [], ref: () => 'GuildCategory' })
  categories?: Ref<GuildCategory>[];

  @prop({ required: true, ref: () => 'PoliticalRoleHolder' })
  roles!: Ref<PoliticalRoleHolder>;

  @prop({ default: [], ref: () => 'EventSchema' })
  events?: Ref<EventSchema>[];

  @prop({ _id: false })
  logChannels?: LogChannelHolder;

  constructor(
    discordGuild: Guild,
    interaction: ChatInputCommandInteraction,
    guildConfigData: GuildConfigData
  ) {
    const guildID = discordGuild.id;
    const isBotOwner = discordGuild.ownerId === interaction.client.user.id;

    this.guildID = guildID;
    this.isBotOwner = isBotOwner;
        
    const { cursor, ...emergencyOptions } = guildConfigData.emergencyOptions;
    this.emergencyOptions = emergencyOptions;
  }

  static async createGuildDocument(
    interaction: ChatInputCommandInteraction,
    guildConfigData: GuildConfigData,
    reason?: string
  ) {

    const discordGuild = interaction.guild
    if (!discordGuild || (await GuildModel.findOne({ guildID: discordGuild.id }) !== null)) {
      return false;
    }
        
    const guildDocument = new PoliticalGuild(
      discordGuild,
      interaction,
      guildConfigData
    );

    await guildDocument.createSubDocuments(discordGuild, guildConfigData, reason);

    // Finally, create the guild document with the proper linkages
    return await GuildModel.create(guildDocument);
  }

  static async deleteGuildDocument(
    guild: Guild,
    deleteObjects: boolean,
    reason?: string
  ): Promise<boolean> {
    const guildID = guild.id;
    const guildDocument = await GuildModel.findOneAndDelete({ guildID });
    if (!guildDocument) {
      return false;
    }
        
    // Obtain all Refs
    const categories = guildDocument.categories;
    const roleHolderRef = guildDocument.roles;
    const politicalSystem = guildDocument.politicalSystem;
        
    // Delete all categories, roles, and the political system concurrently
    const categoryPromises = (categories ?? []).map(category =>
      GuildCategory.deleteGuildCategoryDocument(guild, category, deleteObjects, reason)
    );
    const rolePromise = roleHolderRef ?
      PoliticalRoleHolder.deletePoliticalRoleHolderDocument(
        guild,
        roleHolderRef,
        deleteObjects,
        reason
      ) :
      Promise.resolve();
    const systemPromise = politicalSystem ?
      PoliticalSystem.deletePoliticalSystemDocument(politicalSystem) :
      Promise.resolve();
    
    await Promise.all([...categoryPromises, rolePromise, systemPromise]);
    
    return true;
  }
    
  private async createSubDocuments(
    discordGuild: Guild,
    guildConfigData: GuildConfigData,
    reason?: string
  ) {
    // Create all political roles then link them to the guild document
    // and generate the role document refs
    const roleHolder = await PoliticalRole.createPoliticalRoleDocuments(
      discordGuild,
      guildConfigData,
      reason
    );
    this.roles = await roleHolder.createPoliticalRoleHolderDocument();
    
    // Create special channel categories then link them to the guild document
    this.categories = await GuildCategory.createGuildCategories(
      discordGuild,
      roleHolder,
      guildConfigData,
      reason
    );

    // Create Political System then link them to the guild document
    this.politicalSystem = await PoliticalSystem.createPoliticalSystemDocument(guildConfigData);

    // Create Log Channels then link them to the guild document
    this.logChannels = await LogChannelHolder.createLogChannelHolderDocument(this.categories);
  }
}

const GuildModel = getModelForClass(PoliticalGuild);

export default GuildModel;
export { PoliticalGuild };