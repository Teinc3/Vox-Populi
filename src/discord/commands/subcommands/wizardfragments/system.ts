import {
  ButtonBuilder, Colors, ButtonStyle,
  EmbedBuilder, ActionRowBuilder,
  type APIButtonComponentWithCustomId
} from 'discord.js';

import { PoliticalSystemType } from '../../../../types/systems.js';
import settings from '../../../../data/settings.json' assert { type: 'json' };
import wizardDefaults from '../../../../data/defaults/wizard.json' assert { type: 'json' };
import BaseWizard from './BaseWizard.js';


class SystemWizard extends BaseWizard {

  selectPoliticalSystem = async (): Promise<void> => {
    // Send an embed to prompt the user to select a political system with 3 buttons
    const selectPoliticalSystemEmbed = new EmbedBuilder()
      .setTitle("Select a Political System")
      .setDescription("The political system you select will determine how the server functions!")
      .setFields([
        {
          name: "Presidential",
          value: wizardDefaults.politicalSystem.presidential.description,
          inline: false
        },
        {
          name: "Parliamentary",
          value: wizardDefaults.politicalSystem.parliamentary.description,
          inline: false
        },
        {
          name: "Direct Democracy",
          value: wizardDefaults.politicalSystem.directDemocracy.description,
          inline: false
        }
      ])
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    // Also create a select Menu with these options and a Cancel/Confirm button
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('system_cancel')
          .setLabel("Cancel")
          .setEmoji("❎")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('system_presidential')
          .setLabel("Presidential")
          .setEmoji("🤵")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('system_parliamentary')
          .setLabel("Parliamentary")
          .setEmoji("🏛️")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('system_dd')
          .setLabel("Direct Democracy")
          .setEmoji("🗳️")
          .setStyle(ButtonStyle.Success)
      )

    if (this.initWizard.response) {
      await this.initWizard.interaction.editReply({
        embeds: [selectPoliticalSystemEmbed],
        components: [actionRow]
      });
    } else {
      this.initWizard.response =
        await this.initWizard.interaction.reply({
          embeds: [selectPoliticalSystemEmbed],
          components: [actionRow]
        });
    }

    try {
      const confirmation = await this.initWizard.response.awaitMessageComponent({
        filter: this.initWizard.buttonFilter,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      switch (confirmation.customId) {
        case "system_cancel":
          return await this.initWizard.cancelled();

        case "system_presidential":
          this.initWizard.guildConfigData.politicalSystem = PoliticalSystemType.Presidential;
          this.initWizard.prevFunctions = [this.selectPoliticalSystem];
          return await this.initWizard.setNextFunc(this.setPresidentialOptions);

        case "system_parliamentary":
          this.initWizard.guildConfigData.politicalSystem = PoliticalSystemType.Parliamentary;
          this.initWizard.prevFunctions = [this.selectPoliticalSystem];
          return await this.initWizard.setNextFunc(
            this.initWizard.fragments.legislature.setSenateTermOptions
          );

        case "system_dd":
          this.initWizard.guildConfigData.politicalSystem = PoliticalSystemType.DirectDemocracy;
          this.initWizard.prevFunctions = [this.selectPoliticalSystem];
          return await this.initWizard.setNextFunc(this.setDDOptions);

        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }

  setPresidentialOptions = async (): Promise<void> => {

    if (!this.initWizard.guildConfigData.presidentialOptions) {
      this.initWizard.guildConfigData.presidentialOptions = {
        termLength: wizardDefaults.politicalSystem.presidential.termLength,
        termLimit: wizardDefaults.politicalSystem.presidential.termLimit,
        consecutive: wizardDefaults.politicalSystem.presidential.consecutive,
        cursor: 0
      }
    }

    const presidentialOptions = this.initWizard.guildConfigData.presidentialOptions;
    const cursor = presidentialOptions.cursor;

    const fields = [
      {
        name: "Term Length",
        value: presidentialOptions.termLength === 1
          ? "1 Month"
          : presidentialOptions.termLength.toString() + " Months",
        inline: true
      },
      {
        name: "Term Limits",
        value: presidentialOptions.termLimit === 0
          ? "No Limits"
          : presidentialOptions.termLimit.toString(),
        inline: true
      },
      {
        name: "Consecutive Terms",
        value: presidentialOptions.consecutive 
          ? "Enabled" 
          : "Disabled",
        inline: true
      }
    ]

    const activeField = fields[cursor];
    activeField.inline = false;

    const selectPresidentialOptionsEmbed = new EmbedBuilder()
      .setTitle("Configure Presidential Options (1/1)")
      .setDescription("These options decide the maximum number of terms the President can "
        + "serve and how long for each one.")
      .setFields(
        fields[cursor],
        ...fields.filter((_, i) => i !== cursor)
      )
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(...[
        new ButtonBuilder()
          .setCustomId("presidential_options_back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId("presidential_options_negative")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️")
          .setLabel(cursor === 0 ? "-1 Month" : "-1 Term")
          .setDisabled(cursor === 0 && presidentialOptions.termLength <= 1
            || cursor === 1 && presidentialOptions.termLimit <= 0),
        new ButtonBuilder()
          .setCustomId("presidential_options_positive")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️")
          .setLabel(cursor === 0 ? "+1 Month" : "+1 Term"),
        new ButtonBuilder()
          .setCustomId("presidential_options_toggle")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("↕️")
          .setLabel("Toggle Consecutive Terms"),
        new ButtonBuilder()
          .setCustomId("presidential_options_next")
          .setStyle(ButtonStyle.Secondary)
          // Won't show when cursor is 2
          .setLabel(cursor === 0 ? "Modify Term Limit" : "Modify Term Length")
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId("presidential_options_confirm")
          .setStyle(ButtonStyle.Success)
          .setLabel("Continue")
          .setEmoji("✅")
      ].filter(button => {
        const customID = (button.data as Partial<APIButtonComponentWithCustomId>).custom_id;
        if (cursor === 2 && (customID === "presidential_options_negative"
          || customID === "presidential_options_positive")
        ) {
          return false
        }
        return !(cursor <= 1 && customID === "presidential_options_toggle");
      }))

    await this.initWizard.interaction.editReply({
      embeds: [selectPresidentialOptionsEmbed],
      components: [actionRow]
    })

    try {
      const confirmation = await this.initWizard.response!.awaitMessageComponent({
        filter: this.initWizard.buttonFilter,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      switch (confirmation.customId) {
        case "presidential_options_back":
          return await this.initWizard.setPrevFunc();
        case "presidential_options_negative":
          if (cursor === 0) {
            presidentialOptions.termLength -= (presidentialOptions.termLength <= 1 ? 0 : 1);
          } else {
            presidentialOptions.termLimit -= (presidentialOptions.termLimit <= 0 ? 0 : 1);
          }
          break;
        case "presidential_options_positive":
          if (cursor === 0) {
            presidentialOptions.termLength += 1;
          } else {
            presidentialOptions.termLimit += 1;
          }
          break;
        case "presidential_options_toggle":
          presidentialOptions.consecutive = !presidentialOptions.consecutive;
          break;
        case "presidential_options_next":
          presidentialOptions.cursor += 1;
          if (presidentialOptions.cursor >= 3) {
            presidentialOptions.cursor = 0;
          }
          break;
        case "presidential_options_confirm":
          this.initWizard.prevFunctions.push(this.setPresidentialOptions);
          return await this.initWizard.setNextFunc(
            this.initWizard.fragments.legislature.setSenateTermOptions
          );
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }

  setParliamentaryOptions = async (): Promise<void> => {
    // Basically just snap elections, coalitions/majorities, oppositions, etc.
    // Now we only do snap Elections

    // Clamp the snap election value to be within the term length (otherwise weird things happen)
    if (!this.initWizard.guildConfigData.parliamentaryOptions) {
      this.initWizard.guildConfigData.parliamentaryOptions = {
        snapElection: Math.min(
          wizardDefaults.politicalSystem.parliamentary.snapElection,
          this.initWizard.guildConfigData.senateOptions!.terms.termLength - 1
        )
      }
    } else if (this.initWizard.guildConfigData.parliamentaryOptions.snapElection
      > this.initWizard.guildConfigData.senateOptions!.terms.termLength - 1) {
      this.initWizard.guildConfigData.parliamentaryOptions.snapElection
        = this.initWizard.guildConfigData.senateOptions!.terms.termLength - 1;
    }

    const embed = new EmbedBuilder()
      .setTitle("Configure options for Parliamentary System (1/1)")
      .setDescription(
        "These options decide the frequency of snap elections."
      )
      .setFields([
        {
          name: "Minimum Snap Election Interval",
          value: this.initWizard.guildConfigData.parliamentaryOptions.snapElection === 0
            ? "Snap Elections Disabled"
            : this.initWizard.guildConfigData.parliamentaryOptions.snapElection === 1
              ? "1 Month"
              : this.initWizard.guildConfigData.parliamentaryOptions.snapElection.toString()
                + " Months",
          inline: true
        },
        {
          name: "Configured Senator Term Length",
          value: this.initWizard.guildConfigData.senateOptions!.terms.termLength === 1
            ? "1 Month"
            : this.initWizard.guildConfigData.senateOptions!.terms.termLength.toString()
              + " Months",
          inline: true
        }
      ])
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('parliamentary_options_back')
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId('parliamentary_options_negative')
          .setLabel("-1 Month")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️")
          .setDisabled(this.initWizard.guildConfigData.parliamentaryOptions.snapElection <= 0),
        new ButtonBuilder()
          .setCustomId('parliamentary_options_positive')
          .setLabel("+1 Month")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️")
          .setDisabled(this.initWizard.guildConfigData.parliamentaryOptions.snapElection
            >= this.initWizard.guildConfigData.senateOptions!.terms.termLength - 1),
        new ButtonBuilder()
          .setCustomId('parliamentary_options_confirm')
          .setLabel("Continue")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      )
        
    await this.initWizard.interaction.editReply({ embeds: [embed], components: [actionRow] });

    try {
      const confirmation = await this.initWizard.response!.awaitMessageComponent({
        filter: this.initWizard.buttonFilter,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      switch (confirmation.customId) {
        case "parliamentary_options_back":
          return await this.initWizard.setPrevFunc();
        case "parliamentary_options_negative":
          this.initWizard.guildConfigData.parliamentaryOptions.snapElection
            -= (this.initWizard.guildConfigData.parliamentaryOptions.snapElection <= 0 ? 0 : 1);
          break;
        case "parliamentary_options_positive":
          this.initWizard.guildConfigData.parliamentaryOptions.snapElection
            += (this.initWizard.guildConfigData.parliamentaryOptions.snapElection
              >= this.initWizard.guildConfigData.senateOptions!.terms.termLength - 1 ? 0 : 1);
          break;
        case "parliamentary_options_confirm":
          this.initWizard.prevFunctions.push(this.setParliamentaryOptions);
          return await this.initWizard.setNextFunc(
            this.initWizard.fragments.judicial.setCourtGenericOptions
          ); // Since we first went to configure senate then came back
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }

  setDDOptions = async (): Promise<void> => {
    if (!this.initWizard.guildConfigData.ddOptions) {
      this.initWizard.guildConfigData.ddOptions = {
        appointModerators: wizardDefaults.politicalSystem.directDemocracy.appointModerators.value,
        appointJudges: wizardDefaults.politicalSystem.directDemocracy.appointJudges.value,
      }
    }
    const selectDDOptionsEmbed = new EmbedBuilder()
      .setTitle("Configure Options for Direct Democracy (1/1)")
      .setDescription("These options decide if Moderators and Judges are to be elected through "
        + "referendums or if Citizens collectively complete their work instead.")
      .setFields([
        {
          name: "Elect Moderators",
          value: this.initWizard.guildConfigData.ddOptions.appointModerators
            ? "Enabled"
            : "Disabled",
          inline: true
        },
        {
          name: "Elect Judges",
          value: this.initWizard.guildConfigData.ddOptions.appointJudges ? "Enabled" : "Disabled",
          inline: true
        }
      ])
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('dd_options_back')
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId('dd_options_appoint_moderators')
          .setLabel("Toggle Moderators")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🛠️"),
        new ButtonBuilder()
          .setCustomId('dd_options_appoint_judges')
          .setLabel("Toggle Judges")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⚖️"),
        new ButtonBuilder()
          .setCustomId('dd_options_confirm')
          .setLabel("Continue")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      )

    await this.initWizard.interaction.editReply({
      embeds: [selectDDOptionsEmbed],
      components: [actionRow]
    });

    try {
      const confirmation = await this.initWizard.response!.awaitMessageComponent({
        filter: this.initWizard.buttonFilter,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      switch (confirmation.customId) {
        case "dd_options_back":
          return await this.initWizard.setPrevFunc();
        case "dd_options_appoint_moderators":
          this.initWizard.guildConfigData.ddOptions.appointModerators
            = !this.initWizard.guildConfigData.ddOptions.appointModerators;
          break;
        case "dd_options_appoint_judges":
          this.initWizard.guildConfigData.ddOptions.appointJudges
            = !this.initWizard.guildConfigData.ddOptions.appointJudges;
          break;
        case "dd_options_confirm":
          this.initWizard.prevFunctions.push(this.setDDOptions);
          return await this.initWizard.setNextFunc(
            this.initWizard.fragments.legislature.setReferendumOptions
          );
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }
}

export default SystemWizard;