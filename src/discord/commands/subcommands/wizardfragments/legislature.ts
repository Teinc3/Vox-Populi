import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, Colors, ButtonStyle } from 'discord.js';

import { PoliticalSystemType } from '../../../../types/systems';
import settings from '../../../../data/settings.json' assert { type: 'json' };
import wizardDefaults from '../../../../data/defaults/wizard.json' assert { type: 'json' };
import BaseWizard from './BaseWizard.js';

import type { InitWizardFunction } from '../init';


class LegislatureWizard extends BaseWizard {

  setSenateTermOptions = async (): Promise<void> => {
    if (!this.initWizard.guildConfigData.senateOptions) {
      this.initWizard.guildConfigData.senateOptions = {
        terms: {
          termLength: wizardDefaults.legislature.senate.termLength,
          termLimit: wizardDefaults.legislature.senate.termLimit,
          consecutive: true,
          cursor: 0
        },
        seats: {
          scalable: wizardDefaults.legislature.senate.seats.scalable,
          value: wizardDefaults.legislature.senate.seats.value
        },
        threshold: {
          super: wizardDefaults.thresholds.super,
          simple: wizardDefaults.thresholds.simple,
          cursor: 0
        }
      }
    }

    const termOptions = this.initWizard.guildConfigData.senateOptions.terms;
    const cursor = termOptions.cursor;

    const embed = new EmbedBuilder()
      .setTitle("Configure Senate Term Options (1/3)")
      .setDescription("These options decide how long and how many terms Senators can serve.")
      .setFields([
        {
          name: "Term Length",
          value: termOptions.termLength === 1
            ? "1 Month"
            : termOptions.termLength.toString() + " Months",
          inline: true
        },
        {
          name: "Term Limits",
          value: termOptions.termLimit === 0 ? "No Limits" : termOptions.termLimit.toString(),
          inline: true
        }
      ])
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('senate_term_back')
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId('senate_term_negative')
          .setLabel(cursor === 0 ? "-1 Month" : "-1 Term")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️")
          .setDisabled(cursor === 0 ? termOptions.termLength <= 1 : termOptions.termLimit <= 0),
        new ButtonBuilder()
          .setCustomId('senate_term_positive')
          .setLabel(cursor === 0 ? "+1 Month" : "+1 Term")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️"),
        new ButtonBuilder()
          .setCustomId("senate_term_next")
          .setStyle(ButtonStyle.Secondary)
          .setLabel(cursor === 0 ? "Modify Term Limit" : "Modify Term Length")
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId('senate_term_confirm')
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
        case "senate_term_back":
          return await this.initWizard.setPrevFunc();
        case "senate_term_negative":
          if (cursor === 0) {
            termOptions.termLength -= (termOptions.termLength <= 1 ? 0 : 1);
          } else {
            termOptions.termLimit -= (termOptions.termLimit <= 0 ? 0 : 1);
          }
          break;
        case "senate_term_positive":
          if (cursor === 0) {
            termOptions.termLength += 1;
          } else {
            termOptions.termLimit += 1;
          }
          break;
        case "senate_term_next":
          termOptions.cursor = 1 - termOptions.cursor;
          break;
        case "senate_term_confirm":
          this.initWizard.prevFunctions.push(this.setSenateTermOptions);
          return await this.initWizard.setNextFunc(this.setSenateSeatOptions);
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }

  setSenateSeatOptions = async (): Promise<void> => {
    const seatsOptions = this.initWizard.guildConfigData.senateOptions!.seats;

    const embed = new EmbedBuilder()
      .setTitle("Configure Senate Seat Options (2/3)")
      .setDescription("These options decide how many seats are available in the Senate.")
      .setFields([
        {
          name: "Method of Allocation",
          value: seatsOptions.scalable ? "Scale by Population" : "Fixed Number",
          inline: true
        },
        {
          name: seatsOptions.scalable ? "Citizens Per Seat" : "Number of Seats",
          value: seatsOptions.value.toString(),
          inline: true
        }
      ])
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('senate_seat_back')
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId('senate_seat_toggle')
          .setLabel("Toggle Allocation Method")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("↕️"),
        new ButtonBuilder()
          .setCustomId('senate_seat_negative')
          .setLabel("-1")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️")
          .setDisabled(seatsOptions.value <= 1),
        new ButtonBuilder()
          .setCustomId('senate_seat_positive')
          .setLabel("+1")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️"),
        new ButtonBuilder()
          .setCustomId('senate_seat_confirm')
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
        case "senate_seat_back":
          return await this.initWizard.setPrevFunc();
        case "senate_seat_toggle":
          seatsOptions.scalable = !seatsOptions.scalable;
          break;
        case "senate_seat_negative":
          seatsOptions.value -= (seatsOptions.value <= 1 ? 0 : 1);
          break;
        case "senate_seat_positive":
          seatsOptions.value += 1;
          break;
        case "senate_seat_confirm":
          this.initWizard.prevFunctions.push(this.setSenateSeatOptions);
          return await this.initWizard.setNextFunc(this.setSenateThresholdOptions);
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }

  setSenateThresholdOptions = async (): Promise<void> => {
    const thresholdOptions = this.initWizard.guildConfigData.senateOptions!.threshold;
    const cursor = thresholdOptions.cursor;

    // Should not happen, just for type safety
    if (!thresholdOptions.super) {
      return await this.initWizard.escape();
    }

    const fields = [
      {
        name: "Supermajority Threshold",
        value: thresholdOptions.super.toString() + "%",
        inline: true
      },
      {
        name: "Simple Majority Threshold",
        value: thresholdOptions.simple.toString() + "%",
        inline: true
      }
    ]
    if (cursor === 1) {
      fields.reverse();
    }

    const embed = new EmbedBuilder()
      .setTitle("Configure Senate Threshold Options (3/3)")
      .setDescription(
        "These options decide the percentage of votes needed for simple or super majorities."
      )
      .setFields(fields)
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    /* The reason why 1% is minimum is that 0% would mean that no votes are needed to pass a bill
         But 100% maximum is because 100% would mean that all votes are needed to pass a bill
         So there is no error here
         */
    const actionRowUtilities = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('senate_threshold_back')
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId('senate_threshold_toggle')
          .setLabel(
            cursor === 0
              ? "Modify Simple Majority Threshold"
              : "Modify Supermajority Threshold"
          )
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId('senate_threshold_confirm')
          .setLabel("Continue")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      )

    const actionRowThreshold = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('senate_threshold_minus_ten')
          .setLabel("-10%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏪")
          .setDisabled(cursor === 0 && thresholdOptions.super <= 10
            || cursor === 1 && thresholdOptions.simple <= 10),
        new ButtonBuilder()
          .setCustomId('senate_threshold_minus_one')
          .setLabel("-1%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️")
          .setDisabled(cursor === 0 && thresholdOptions.super <= 1
            || cursor === 1 && thresholdOptions.simple <= 1),
        new ButtonBuilder()
          .setCustomId('senate_threshold_plus_one')
          .setLabel("+1%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️")
          .setDisabled(cursor === 0 && thresholdOptions.super >= 100
            || cursor === 1 && thresholdOptions.simple >= 100),
        new ButtonBuilder()
          .setCustomId('senate_threshold_plus_ten')
          .setLabel("+10%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏩")
          .setDisabled(cursor === 0 && thresholdOptions.super >= 91
            || cursor === 1 && thresholdOptions.simple >= 91),
      )

    await this.initWizard.interaction.editReply({
      embeds: [embed],
      components: [actionRowUtilities, actionRowThreshold]
    });

    try {
      const confirmation = await this.initWizard.response!.awaitMessageComponent({
        filter: this.initWizard.buttonFilter,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      switch (confirmation.customId) {
        case "senate_threshold_back":
          return await this.initWizard.setPrevFunc();
        case "senate_threshold_minus_ten":
          if (cursor === 0) {
            thresholdOptions.super -= (thresholdOptions.super <= 10 ? 0 : 10);
          } else if (cursor === 1) {
            thresholdOptions.simple -= (thresholdOptions.simple <= 10 ? 0 : 10);
          } else {
            return await this.initWizard.escape();
          }
          break;
        case "senate_threshold_minus_one":
          if (cursor === 0) {
            thresholdOptions.super -= (thresholdOptions.super <= 1 ? 0 : 1);
          } else if (cursor === 1) {
            thresholdOptions.simple -= (thresholdOptions.simple <= 1 ? 0 : 1);
          } else {
            return await this.initWizard.escape();
          }
          break;
        case "senate_threshold_plus_one":
          if (cursor === 0) {
            thresholdOptions.super += (thresholdOptions.super >= 100 ? 0 : 1);
          } else if (cursor === 1) {
            thresholdOptions.simple += (thresholdOptions.simple >= 100 ? 0 : 1);
          } else {
            return await this.initWizard.escape();
          }
          break;
        case "senate_threshold_plus_ten":
          if (cursor === 0) {
            thresholdOptions.super += (thresholdOptions.super >= 91 ? 0 : 10);
          } else if (cursor === 1) {
            thresholdOptions.simple += (thresholdOptions.simple >= 91 ? 0 : 10);
          } else {
            return await this.initWizard.escape();
          }
          break;
        case "senate_threshold_toggle":
          thresholdOptions.cursor = 1 - thresholdOptions.cursor;
          break;
        case "senate_threshold_confirm":
          this.initWizard.prevFunctions.push(this.setSenateThresholdOptions);
          let nextFunc: InitWizardFunction;
         
          // For Parliamentary, we go to configure Parliamentary Options (since we skipped it
          // first for snap elections which are more relevant after senate is set up)
          // Since DD does not have Senate, and only DD has the option to disable Judges,
          // we can still go to Court Options
          switch (this.initWizard.guildConfigData.politicalSystem) {
            case PoliticalSystemType.Parliamentary:
              nextFunc = this.initWizard.fragments.system.setParliamentaryOptions;
              break;
            case PoliticalSystemType.DirectDemocracy:
              if (this.initWizard.guildConfigData.ddOptions!.appointJudges) {
                nextFunc = this.initWizard.fragments.judicial.setCourtGenericOptions;
                break;
              }
            default:
              nextFunc = this.initWizard.fragments.discord.linkDiscordRoles;
          }
          return await this.initWizard.setNextFunc(nextFunc);
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }

  setReferendumOptions = async (): Promise<void> => {
    if (!this.initWizard.guildConfigData.referendumThresholds) {
      this.initWizard.guildConfigData.referendumThresholds = {
        simple: wizardDefaults.thresholds.simple,
        super: wizardDefaults.thresholds.super,
        cursor: 0
      }
    }

    const referendumThresholds = this.initWizard.guildConfigData.referendumThresholds;
    const cursor = referendumThresholds.cursor;

    const fields = [
      {
        name: "Supermajority Threshold",
        value: referendumThresholds.super.toString() + "%",
        inline: true
      },
      {
        name: "Simple Majority Threshold",
        value: referendumThresholds.simple.toString() + "%",
        inline: true
      }
    ]

    if (cursor === 1) {
      fields.reverse();
    }

    const embed = new EmbedBuilder()
      .setTitle("Configure Referendum Thresholds (1/1)")
      .setDescription("These options decide the percentage of votes needed for simple "
        + "or super majorities in referendums.")
      .setFields(fields)
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    const actionRowUtilities = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('referendum_back')
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId('referendum_toggle')
          .setLabel(
            cursor === 0
              ? "Modify Simple Majority Threshold"
              : "Modify Supermajority Threshold"
          )
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId('referendum_confirm')
          .setLabel("Continue")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      )

    const actionRowThreshold = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('referendum_minus_ten')
          .setLabel("-10%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏪")
          .setDisabled(cursor === 0 && referendumThresholds.super <= 10
            || cursor === 1 && referendumThresholds.simple <= 10),
        new ButtonBuilder()
          .setCustomId('referendum_minus_one')
          .setLabel("-1%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️")
          .setDisabled(cursor === 0 && referendumThresholds.super <= 1
            || cursor === 1 && referendumThresholds.simple <= 1),
        new ButtonBuilder()
          .setCustomId('referendum_plus_one')
          .setLabel("+1%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️")
          .setDisabled(cursor === 0 && referendumThresholds.super >= 100
            || cursor === 1 && referendumThresholds.simple >= 100),
        new ButtonBuilder()
          .setCustomId('referendum_plus_ten')
          .setLabel("+10%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏩")
          .setDisabled(cursor === 0 && referendumThresholds.super >= 91
            || cursor === 1 && referendumThresholds.simple >= 91),
      )

    await this.initWizard.interaction.editReply({
      embeds: [embed],
      components: [actionRowUtilities, actionRowThreshold]
    });

    try {
      const confirmation = await this.initWizard.response!.awaitMessageComponent({
        filter: this.initWizard.buttonFilter,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      switch (confirmation.customId) {
        case "referendum_back":
          return await this.initWizard.setPrevFunc();
        case "referendum_minus_ten":
          if (cursor === 0) {
            referendumThresholds.super -= (referendumThresholds.super <= 10 ? 0 : 10);
          } else if (cursor === 1) {
            referendumThresholds.simple -= (referendumThresholds.simple <= 10 ? 0 : 10);
          } else {
            return await this.initWizard.escape();
          }
          break;
        case "referendum_minus_one":
          if (cursor === 0) {
            referendumThresholds.super -= (referendumThresholds.super <= 1 ? 0 : 1);
          } else if (cursor === 1) {
            referendumThresholds.simple -= (referendumThresholds.simple <= 1 ? 0 : 1);
          } else {
            return await this.initWizard.escape();
          }
          break;
        case "referendum_plus_one":
          if (cursor === 0) {
            referendumThresholds.super += (referendumThresholds.super >= 100 ? 0 : 1);
          } else if (cursor === 1) {
            referendumThresholds.simple += (referendumThresholds.simple >= 100 ? 0 : 1);
          } else {
            return await this.initWizard.escape();
          }
          break;
        case "referendum_plus_ten":
          if (cursor === 0) {
            referendumThresholds.super += (referendumThresholds.super >= 91 ? 0 : 10);
          } else if (cursor === 1) {
            referendumThresholds.simple += (referendumThresholds.simple >= 91 ? 0 : 10);
          } else {
            return await this.initWizard.escape();
          }
          break;
        case "referendum_toggle":
          referendumThresholds.cursor = 1 - referendumThresholds.cursor;
          break;
        case "referendum_confirm":
          this.initWizard.prevFunctions.push(this.setReferendumOptions);
          return await this.initWizard.setNextFunc(
            this.initWizard.guildConfigData.ddOptions!.appointJudges
              ? this.initWizard.fragments.judicial.setCourtGenericOptions
              : this.initWizard.fragments.discord.linkDiscordRoles
          );
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }
}

export default LegislatureWizard;