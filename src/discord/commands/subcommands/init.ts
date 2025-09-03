import {
  ButtonBuilder, EmbedBuilder, ActionRowBuilder, Colors, ButtonStyle,
  type ChatInputCommandInteraction, type MessageComponentInteraction, type InteractionResponse,
  type GuildMemberRoleManager, type APIButtonComponentWithCustomId
} from 'discord.js';
import { isDocument } from '@typegoose/typegoose';

import { PoliticalRoleModel } from '../../../schema/roles/PoliticalRole.js';
import PoliticalGuild from '../../../schema/main/PoliticalGuild.js';
import settings from '../../../data/settings.json' assert { type: 'json' };
import wizardDefaults from '../../../data/defaults/wizard.json' assert { type: 'json' };
import SystemWizard from './wizardfragments/system.js';
import LegislatureWizard from './wizardfragments/legislature.js';
import JudicialWizard from './wizardfragments/judicial.js';
import DiscordWizard from './wizardfragments/discord.js';


import type { GuildConfigData } from '../../../types/wizard.js';


export default async function init(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const initWizard = new InitWizard(interaction);
  while (typeof initWizard.nextFunction === 'function') {
    await initWizard.nextFunction();
  }
  return initWizard.nextFunction;
}

type InitWizardFunction = () => Promise<void>;

/**
 * A class containing functions of the initialization wizard for setting up a new server configuration.
 * 
 * @class InitWizard
 * @property {ChatInputCommandInteraction} interaction - The interaction object that triggered the command
 * @property {GuildConfigData} guildConfigData - The data to be stored in the Guild document
 * @property {InteractionResponse} response - The response message sent by the bot. Used to edit the message when changing pages. Undefined if the message has not been sent yet.
 * @property {InitWizardFunction[]} prevFunctions - An array of functions that were previously called, so that the user can go back to the previous page without losing configuration data.
 * @property {InitWizardFunction | boolean} nextFunction - The next function to be called. If set to false, the wizard will end.
 * @property {number} page - The current page number of the wizard, used for the footer of the embed.
 * 
 */
export class InitWizard {

  fragments: {
    system: SystemWizard;
    legislature: LegislatureWizard;
    judicial: JudicialWizard;
    discord: DiscordWizard
  }
  initWizard: InitWizard;

  interaction: ChatInputCommandInteraction;
  guildConfigData: GuildConfigData;
  response?: InteractionResponse;
  prevFunctions: InitWizardFunction[];
  nextFunction: InitWizardFunction | boolean;
  page: number;

  constructor(interaction: ChatInputCommandInteraction) {
    this.fragments = {
      system: new SystemWizard(this),
      legislature: new LegislatureWizard(this),
      judicial: new JudicialWizard(this),
      discord: new DiscordWizard(this)
    }

    this.initWizard = this;

    this.interaction = interaction;
    this.guildConfigData = {} as GuildConfigData;

    this.prevFunctions = [];
    this.nextFunction = this.fragments.system.selectPoliticalSystem;
    this.page = 1;
  }

  buttonFilter = (i: MessageComponentInteraction) => i.isButton() && i.user.id === this.interaction.user.id;

  setEmergencyOptions = async (): Promise<void> => {
    if (!this.guildConfigData.emergencyOptions) {
      this.guildConfigData.emergencyOptions = {
        tempAdminLength: wizardDefaults.emergency.tempAdminLength,
        allowResetConfig: wizardDefaults.emergency.allowResetConfig,
        creatorID: this.interaction.user.id,
        cursor: 0
      }
    }
    const cursor = this.guildConfigData.emergencyOptions.cursor;

    const embed = new EmbedBuilder()
      .setTitle("Configure Emergency Options (1/1)")
      .setDescription("These options decides how much power you have in case of a server emergency.")
      .addFields([
        {
          name: "Temporary Administrator Status Length",
          value: this.guildConfigData.emergencyOptions.tempAdminLength === 0 ? "Disabled" : this.guildConfigData.emergencyOptions.tempAdminLength + " Days",
          inline: true
        },
        {
          name: "Allow Server Configuration Reset",
          value: this.guildConfigData.emergencyOptions.allowResetConfig ? "Enabled" : "Disabled",
          inline: true
        }
      ])
      .setColor(Colors.Yellow)
      .setFooter({ text: "This is the last page of the config wizard. After confirmation, all settings will be finalized!" })
      .toJSON();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents([
        new ButtonBuilder()
          .setCustomId('emergency_back')
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId('emergency_admin_minus')
          .setLabel("-1 Day")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(this.guildConfigData.emergencyOptions.tempAdminLength <= 0)
          .setEmoji("⬅️"),
        new ButtonBuilder()
          .setCustomId('emergency_admin_plus')
          .setLabel("+1 Day")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️"),
        new ButtonBuilder()
          .setCustomId('emergency_delete_toggle')
          .setLabel("Toggle Reset")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("↕️"),
        new ButtonBuilder()
          .setCustomId('emergency_next')
          .setLabel("Modify Next Option")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId('emergency_confirm')
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      ].filter(button => {
        const customID = (button.data as Partial<APIButtonComponentWithCustomId>).custom_id!;
        if (cursor === 1 && ["emergency_admin_minus", "emergency_admin_plus"].includes(customID)) {
          return false;
        } else if (cursor === 0 && customID === "emergency_delete_toggle") {
          return false;
        }
        return true;
      }));

    await this.interaction.editReply({ embeds: [embed], components: [actionRow] });

    try {
      const confirmation = await this.response!.awaitMessageComponent({
        filter: this.buttonFilter,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      switch (confirmation.customId) {
        case "emergency_back":
          return await this.setPrevFunc();
        case "emergency_admin_minus":
          if (this.guildConfigData.emergencyOptions.tempAdminLength > 0) {
            this.guildConfigData.emergencyOptions.tempAdminLength--;
          }
          break;
        case "emergency_admin_plus":
          this.guildConfigData.emergencyOptions.tempAdminLength++;
          break;
        case "emergency_delete_toggle":
          this.guildConfigData.emergencyOptions.allowResetConfig = !this.guildConfigData.emergencyOptions.allowResetConfig;
          break;
        case "emergency_next":
          this.guildConfigData.emergencyOptions.cursor = 1 - this.guildConfigData.emergencyOptions.cursor;
          break;
        case "emergency_confirm":
          return await this.setNextFunc(this.completeInit);
        default:
          return await this.escape();
      }
    } catch (_e) {
      return await this.timedOut();
    }
  }

  completeInit = async (): Promise<void> => {
    // Show "Configuring Server" message
    const configuringEmbed = new EmbedBuilder()
      .setTitle("Configuring Server")
      .setDescription("Please wait while the server is being configured...")
      .setColor(Colors.Blurple)
      .toJSON();
    await this.interaction.editReply({ embeds: [configuringEmbed], components: [] });

    // Update database with new guild object
    const result = await PoliticalGuild.createGuildDocument(this.interaction, this.guildConfigData, "Server Initialization");
    if (!result) {
      return await this.escape();
    }

    const successEmbed = new EmbedBuilder()
      .setTitle("Server Configuration")
      .setDescription("Server has been successfully configured.")
      .setColor(Colors.Green)
      .setAuthor({ name: this.interaction.user.tag, iconURL: this.interaction.user.displayAvatarURL() })
      .setTimestamp()
      .toJSON();
    await this.interaction.editReply({ embeds: [successEmbed], components: [] });

    // Assign the bot the Vox Populi role
    await result.populate({ path: 'roles', select: 'VoxPopuli' });
    if (!isDocument(result.roles)) {
      return await this.escape(true);
    }

    await result.populate({ path: 'roles.VoxPopuli', model: PoliticalRoleModel, select: 'roleID' });
    if (!isDocument(result.roles.VoxPopuli)) {
      return await this.escape(true);
    }

    const roleID = result.roles.VoxPopuli.roleID;
    if (!roleID) {
      return await this.escape(true);
    }
    const guild = this.interaction.guild!;
    const role = await guild.roles.fetch(roleID);
    if (role) {
      // Assign the role to the bot
      await guild.members.me?.roles.add(role);

      // If the emergency option is enabled, assign the creator the role
      // Maybe add this to logs in the future
      if (this.guildConfigData.emergencyOptions.allowResetConfig) {
        await (this.interaction.member?.roles as GuildMemberRoleManager).add(roleID);
      }
    }

    return await this.escape(true);
  }

  async setPrevFunc() {
    this.page--;
    const prevFunction = this.prevFunctions?.pop();
    if (!prevFunction) {
      console.error("No prev function???");
      return await this.escape();
    }
    this.nextFunction = prevFunction;
    return Promise.resolve();
  }

  async timedOut() {
    const embed = new EmbedBuilder()
      .setTitle("Timeout")
      .setDescription("No response received in 1 minute, automatically cancelling server initialization...")
      .setColor(Colors.Red)
      .toJSON();
    await this.interaction.editReply({ embeds: [embed], components: [] });
    return await this.escape(true);
  }

  async escape(cleanEscape: boolean = false) {
    this.nextFunction = cleanEscape;
    return Promise.resolve();
  }

  async setNextFunc(nextFunction: InitWizardFunction) {
    this.nextFunction = nextFunction;
    this.page++;
    return Promise.resolve();
  }

  async cancelled() {
    const embed = new EmbedBuilder()
      .setTitle("Cancelled")
      .setDescription("Server initialization was cancelled.")
      .setColor(Colors.Red)
      .toJSON();
    await this.interaction.editReply({ embeds: [embed], components: [] });
    return await this.escape(true);
  }
}