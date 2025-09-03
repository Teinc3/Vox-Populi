import {
  ButtonBuilder, Colors, ButtonStyle, ChannelType,
  EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder,
  type MessageComponentInteraction, type APIEmbedField,
} from 'discord.js';

import { PoliticalSystemType } from '../../../../types/systems.js';
import { PoliticalRoleHierarchy } from '../../../../types/permissions.js';
import settings from '../../../../data/settings.json' assert { type: 'json' };
import roleDefaults from '../../../../data/defaults/roles.json' assert { type: 'json' };
import categoryDefaults from '../../../../data/defaults/channels.json' assert { type: "json" };
import BaseWizard from './BaseWizard.js';

import type { DefaultRoleData, DiscordRoleHolderData, ExtendedDefaultDiscordData, NewCategoryChannelData } from '../../../../types/wizard.js';


class DiscordWizard extends BaseWizard {

  linkDiscordRoles = async (): Promise<void> => {
    if (!this.initWizard.guildConfigData.discordOptions) {
      const newRoleData: DiscordRoleHolderData = JSON.parse(JSON.stringify(roleDefaults));
      const newCategoryData: NewCategoryChannelData = JSON.parse(JSON.stringify(categoryDefaults));

      this.initWizard.guildConfigData.discordOptions = {
        roleOptions: {
          baseRoles: newRoleData,
          filteredRoles: [...newRoleData],
          cursor: 0
        },
        discordChannelOptions: {
          baseCategoryChannels: newCategoryData.map(category => ({
            ...category,
            cursor: 0
          })),
          filteredCategoryChannels: [],
          cursor: 0,
          isCursorOnCategory: true
        }
      }
      this.initWizard.guildConfigData.discordOptions.roleOptions.filteredRoles.at(-1)!.id = this.initWizard.interaction.guildId ?? undefined;
    }

    const { roleOptions } = this.initWizard.guildConfigData.discordOptions;
    const { filteredRoles } = roleOptions;

    // Filter out the roles that are not needed
    const discardedRoles: Array<PoliticalRoleHierarchy> = [];

    if (this.initWizard.guildConfigData.politicalSystem === PoliticalSystemType.Parliamentary) {
      discardedRoles.push(PoliticalRoleHierarchy.President);
    } else if (this.initWizard.guildConfigData.politicalSystem === PoliticalSystemType.Presidential) {
      discardedRoles.push(PoliticalRoleHierarchy.PrimeMinister);
    } else {
      discardedRoles.push(PoliticalRoleHierarchy.President, PoliticalRoleHierarchy.PrimeMinister, PoliticalRoleHierarchy.Senator);

      if (!this.initWizard.guildConfigData.ddOptions!.appointJudges) {
        discardedRoles.push(PoliticalRoleHierarchy.Judge);
      }
      if (!this.initWizard.guildConfigData.ddOptions!.appointModerators) {
        discardedRoles.push(PoliticalRoleHierarchy.HeadModerator, PoliticalRoleHierarchy.Moderator);
      }
    }
        
    // Remove the roles that are not needed
    for (let i = 0; i < filteredRoles.length; i++) {
      if (discardedRoles.includes(filteredRoles[i].hierarchy as PoliticalRoleHierarchy)) {
        filteredRoles.splice(i, 1);
        i--;
      }
    }

    // Clamp cursor back to 0 if it goes out of bounds
    if (roleOptions.cursor >= filteredRoles.length - 1) {
      roleOptions.cursor = 0;
    }

    const embed = new EmbedBuilder()
      .setTitle("Link Discord Roles (1/2)")
      .setDescription("The following roles will be created. You can either link them to existing roles or create a new one.\nYou can change the names of the roles later through the `/config edit` command.")
      .setColor(Colors.Blurple)
      .setFields(filteredRoles.map((role: ExtendedDefaultDiscordData<DefaultRoleData>, index) => ({
        name: role?.name + (roleOptions.cursor === index ? " (Selected)" : ""),
        value: role?.id ? `<@&${role.id}>` : "New Role",
        inline: false
      })))
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    const actionRowUtilities = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("link_role_back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId("link_role_prev")
          .setLabel("Previous Role")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬆️"),
        new ButtonBuilder()
          .setCustomId("link_role_next")
          .setLabel("Next Role")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬇️"),
        new ButtonBuilder()
          .setCustomId("link_role_confirm")
          .setLabel("Continue")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      )
        
    const actionRowRoleSelect = new ActionRowBuilder<RoleSelectMenuBuilder>()
      .addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId("link_role_select")
          .setPlaceholder("Select a Role")
          .setMinValues(0)
          .setMaxValues(1)
      )
        
    await this.initWizard.interaction.editReply({ embeds: [embed], components: [actionRowUtilities, actionRowRoleSelect] });

    try {
      const confirmation = await this.initWizard.response!.awaitMessageComponent({
        filter: (i: MessageComponentInteraction) => (i.isButton() || i.isRoleSelectMenu()) && i.user.id === this.initWizard.interaction.user.id,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      switch (confirmation.customId) {
        case "link_role_back":
          return await this.initWizard.setPrevFunc();
        case "link_role_prev":
          roleOptions.cursor--;
          if (roleOptions.cursor < 0) {
            // We also skip being able to cursor Undocumented role
            roleOptions.cursor = filteredRoles.length - 2;
          }
          break;
        case "link_role_next":
          roleOptions.cursor++;
          if (roleOptions.cursor > filteredRoles.length - 2) {
            roleOptions.cursor = 0;
          }
          break;
        case "link_role_confirm":
          this.initWizard.prevFunctions.push(this.linkDiscordRoles);
          return await this.initWizard.setNextFunc(this.linkDiscordChannels);
        case "link_role_select":
          if (confirmation.isRoleSelectMenu()) {
            const discordRole = confirmation.roles.first();
            const selectedRole = filteredRoles[roleOptions.cursor];
            if (selectedRole) {
              if (discordRole && filteredRoles.some(r => r.id === discordRole.id)) {
                await confirmation.followUp({ content: "This Discord Role is already linked to another Political Role!", ephemeral: true });
              } else {
                selectedRole.id = discordRole?.id;
              }
            }
          }
          break;
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }

  linkDiscordChannels = async (): Promise<void> => {
    const { discordChannelOptions } = this.initWizard.guildConfigData.discordOptions;
    const { cursor: categoryCursor, isCursorOnCategory } = discordChannelOptions;

    // Based on our configured settings, filter out the channels that are not needed. Then, if a category does not have any channels, delete it as well.
    discordChannelOptions.filteredCategoryChannels = [...discordChannelOptions.baseCategoryChannels];
    for (let i = 0; i < discordChannelOptions.filteredCategoryChannels.length; i++) {
      const category = discordChannelOptions.filteredCategoryChannels[i];
      category.channels = category.channels.filter(channel => {
        const { disable } = channel;
        const isDDMatch = disable?.isDD === (this.initWizard.guildConfigData.politicalSystem === PoliticalSystemType.DirectDemocracy);
        const appointJudgesMatch = disable?.appointJudges === undefined ? true : disable?.appointJudges === this.initWizard.guildConfigData.ddOptions?.appointJudges;
        const appointModeratorsMatch = disable?.appointModerators === undefined ? true : disable?.appointModerators === this.initWizard.guildConfigData.ddOptions?.appointModerators;
        return !(disable && isDDMatch && appointJudgesMatch && appointModeratorsMatch)
      });

      if (category.channels.length === 0) {
        discordChannelOptions.filteredCategoryChannels.splice(i, 1);
        i--;
        continue;
      }
    }

    // Clamp cursor back to 0 if it goes out of bounds
    if (discordChannelOptions.cursor >= discordChannelOptions.filteredCategoryChannels.length) {
      discordChannelOptions.cursor = 0;
    }
    discordChannelOptions.filteredCategoryChannels.forEach(category => {
      if (category.cursor! >= category.channels.length) {
        category.cursor = 0;
      }
    });
        
    const embed = new EmbedBuilder()
      .setTitle("Link Discord Channels (2/2)")
      .setDescription("The following categories and channels will be created. You can either link them to existing channels or create a new one.\nYou can change the names of the channels later through the `/config edit` command.")
      .setColor(Colors.Blurple)
      .setFields(discordChannelOptions.filteredCategoryChannels.reduce((fields, category, index) => {
        fields.push({ name: "\u200B", value: "\u200B", inline: false });

        const isCategorySelected = isCursorOnCategory && discordChannelOptions.cursor === index;
        fields.push({
          name: (isCategorySelected ? "➡️ " : "") + category.name + (isCategorySelected ? " ⬅️" : ""),
          value: category?.id ? `<#${category.id}>` : "New Category Channel",
          inline: false
        });
                
        category.channels.forEach((channel, channelIndex) => {
          const isChannelSelected = !isCursorOnCategory && discordChannelOptions.cursor === index && category.cursor === channelIndex;
          fields.push({
            name: (isChannelSelected ? "➡️ " : "") + channel.name + (isChannelSelected ? " ⬅️" : ""),
            value: channel?.id ? `<#${channel.id}>` : "New Channel",
            inline: true
          });
        });
                
        return fields;
      }, [] as APIEmbedField[]))
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    const actionRowUtilities = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("link_channel_back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId("link_channel_prev")
          .setLabel("Previous " + (isCursorOnCategory ? "Category" : "Channel"))
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬆️"),
        new ButtonBuilder()
          .setCustomId("link_channel_next")
          .setLabel("Next " + (isCursorOnCategory ? "Category" : "Channel"))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("⬇️"),
        new ButtonBuilder()
          .setCustomId("link_channel_toggle")
          .setLabel(isCursorOnCategory ? "Modifying Categories" : "Modifying Channels")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId("link_channel_confirm")
          .setLabel("Continue")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      )
    // If no Default allowed, maybe we need to work with string menus instead
    const actionRowChannelSelect = new ActionRowBuilder<ChannelSelectMenuBuilder>()
      .addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("link_channel_select")
          .setChannelTypes(isCursorOnCategory ? [ChannelType.GuildCategory] : [ChannelType.GuildText])
          .setPlaceholder("Select a Channel")
          .setMinValues(0)
          .setMaxValues(1)
      )
        
    await this.initWizard.interaction.editReply({ embeds: [embed], components: [actionRowUtilities, actionRowChannelSelect] });

    try {
      const confirmation = await this.initWizard.response!.awaitMessageComponent({
        filter: (i: MessageComponentInteraction) => (i.isButton() || i.isChannelSelectMenu()) && i.user.id === this.initWizard.interaction.user.id,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      const { filteredCategoryChannels } = discordChannelOptions;

      switch (confirmation.customId) {
        case "link_channel_back":
          return await this.initWizard.setPrevFunc();

        case "link_channel_prev":
          if (isCursorOnCategory) {
            discordChannelOptions.cursor -= 1;
            if (discordChannelOptions.cursor < 0) {
              discordChannelOptions.cursor = filteredCategoryChannels.length - 1;
            }
          } else {
            filteredCategoryChannels[categoryCursor].cursor! -= 1;
            if (filteredCategoryChannels[categoryCursor].cursor! < 0) {
              filteredCategoryChannels[categoryCursor].cursor = filteredCategoryChannels[categoryCursor].channels.length - 1;
            }
          }
          break;

        case "link_channel_next":
          if (isCursorOnCategory) {
            discordChannelOptions.cursor += 1;
            if (discordChannelOptions.cursor >= filteredCategoryChannels.length) {
              discordChannelOptions.cursor = 0;
            }
          } else {
            filteredCategoryChannels[categoryCursor].cursor! += 1;
            if (filteredCategoryChannels[categoryCursor].cursor! >= filteredCategoryChannels[categoryCursor].channels.length) {
              filteredCategoryChannels[categoryCursor].cursor = 0;
            }
          }
          break;

        case "link_channel_toggle":
          discordChannelOptions.isCursorOnCategory = !discordChannelOptions.isCursorOnCategory;
          break;

        case "link_channel_confirm":
          this.initWizard.prevFunctions.push(this.linkDiscordChannels);
          return await this.initWizard.setNextFunc(this.initWizard.setEmergencyOptions);

        case "link_channel_select":
          if (confirmation.isChannelSelectMenu()) {
            const discordChannel = confirmation.channels.first()
            if (isCursorOnCategory) {
              const selectedCategory = discordChannelOptions.filteredCategoryChannels[discordChannelOptions.cursor];
              if (discordChannel && filteredCategoryChannels.some(category => category.id === discordChannel.id && category.id !== selectedCategory.id)) {
                await confirmation.followUp({ content: "This Discord Channel is already linked to another Category!", ephemeral: true });
              } else {
                selectedCategory.id = discordChannel ? discordChannel.id : undefined;
              }
            } else {
              const selectedChannel = filteredCategoryChannels[categoryCursor].channels[filteredCategoryChannels[categoryCursor].cursor];
              if (discordChannel && filteredCategoryChannels.some(category => category.channels.some(channel => channel.id === discordChannel.id && channel.id !== selectedChannel.id))) {
                await confirmation.followUp({ content: "This Discord Channel is already linked to another Channel!", ephemeral: true });
              } else {
                selectedChannel.id = discordChannel ? discordChannel.id : undefined;
              }
            }
          }
          break;

        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }
}

export default DiscordWizard;