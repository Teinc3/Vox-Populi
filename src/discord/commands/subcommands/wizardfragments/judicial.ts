import { ButtonBuilder, EmbedBuilder, ActionRowBuilder, Colors, ButtonStyle } from 'discord.js';


import settings from '../../../../data/settings.json' with { type: 'json' };
import wizardDefaults from '../../../../data/defaults/wizard.json' with { type: 'json' };
import BaseWizard from './BaseWizard.js';


class JudicialWizard extends BaseWizard {

  /**
     * First page of Court Options
     * 
     * Sets number of Judges and Threshold for Court Verdicts
     */
  setCourtGenericOptions = async (): Promise<void> => {   
    // Initialize the Court Options if they don't exist
    if (!this.initWizard.guildConfigData.courtOptions) {
      this.initWizard.guildConfigData.courtOptions = {
        terms: {
          termLength: wizardDefaults.judicial.terms.termLength,
          termLimit: wizardDefaults.judicial.terms.termLimit,
          consecutive: true,
          cursor: 0
        },
        seats: {
          scalable: false,
          value: wizardDefaults.judicial.seats
        },
        threshold: {
          simple: wizardDefaults.thresholds.simple,
          super: wizardDefaults.thresholds.unanimous,
        }
      }
    }

    const courtOptions = this.initWizard.guildConfigData.courtOptions;

    const embed = new EmbedBuilder()
      .setTitle("Configure Court Options (1/2)")
      .setDescription(
        "These options decide how many seats are available in the Court "
        + "and the threshold for a verdict to pass."
      )
      .setFields([
        {
          name: "Number of Judges",
          value: courtOptions.seats.value.toString(),
          inline: true
        },
        {
          name: "Verdict Threshold",
          value: courtOptions.threshold.simple.toString() + "%",
          inline: true
        }
      ])
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();
        
    const actionRowUtilities = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('court_generic_back')
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId("court_judges_minus")
          .setLabel("-1 Judge")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬇️")
          .setDisabled(courtOptions.seats.value <= 1),
        new ButtonBuilder()
          .setCustomId("court_judges_plus")
          .setLabel("+1 Judge")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬆️"),
        new ButtonBuilder()
          .setCustomId('court_generic_confirm')
          .setLabel("Continue")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      )
        
    const actionRowThreshold = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('court_threshold_minus_ten')
          .setLabel("-10%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏪")
          .setDisabled(courtOptions.threshold.simple <= 10),
        new ButtonBuilder()
          .setCustomId('court_threshold_minus_one')
          .setLabel("-1%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️")
          .setDisabled(courtOptions.threshold.simple <= 1),
        new ButtonBuilder()
          .setCustomId('court_threshold_plus_one')
          .setLabel("+1%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️")
          .setDisabled(courtOptions.threshold.simple >= 100),
        new ButtonBuilder()
          .setCustomId('court_threshold_plus_ten')
          .setLabel("+10%")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏩")
          .setDisabled(courtOptions.threshold.simple >= 91)
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
        case "court_generic_back":
          return await this.initWizard.setPrevFunc();
        case "court_judges_minus":
          courtOptions.seats.value -= (courtOptions.seats.value <= 1 ? 0 : 1);
          break;
        case "court_judges_plus":
          courtOptions.seats.value += 1;
          break;
        case "court_threshold_minus_ten":
          courtOptions.threshold.simple -= (courtOptions.threshold.simple <= 10 ? 0 : 10);
          break;
        case "court_threshold_minus_one":
          courtOptions.threshold.simple -= (courtOptions.threshold.simple <= 1 ? 0 : 1);
          break;
        case "court_threshold_plus_one":
          courtOptions.threshold.simple += (courtOptions.threshold.simple >= 100 ? 0 : 1);
          break;
        case "court_threshold_plus_ten":
          courtOptions.threshold.simple += (courtOptions.threshold.simple >= 91 ? 0 : 10);
          break;
        case "court_generic_confirm":
          this.initWizard.prevFunctions.push(this.setCourtGenericOptions);
          return await this.initWizard.setNextFunc(this.setCourtThresholdOptions);
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }

  /**
     * Second page of Court Options
     * 
     * Sets Term Length, Term Limits and if Consecutive Terms are allowed for Court Judges
     */
  setCourtThresholdOptions = async (): Promise<void> => {
    const courtOptions = this.initWizard.guildConfigData.courtOptions!;
    const cursor = courtOptions.terms.cursor;

    const fields = [
      {
        name: "Term Length",
        value: courtOptions.terms.termLength === 1
          ? "1 Month"
          : courtOptions.terms.termLength.toString() + " Months",
        inline: true
      },
      {
        name: "Term Limits",
        value: courtOptions.terms.termLimit === 0
          ? "No Limits"
          : courtOptions.terms.termLimit.toString(),
        inline: true
      }
    ]

    if (cursor === 1) {
      fields.reverse();
    }

    const embed = new EmbedBuilder()
      .setTitle("Configure Court Options (2/2)")
      .setDescription("These options decide how long and how many terms Judges can serve.")
      .setFields(fields)
      .setColor(Colors.Blurple)
      .setFooter({ text: "Page " + this.initWizard.page })
      .toJSON();

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents([
        new ButtonBuilder()
          .setCustomId("court_term_back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("↩️"),
        new ButtonBuilder()
          .setCustomId("court_term_negative")
          .setLabel(cursor === 0 ? "-1 Month" : "-1 Term")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️")
          .setDisabled(cursor === 0 && courtOptions.terms.termLength <= 1
            || cursor === 1 && courtOptions.terms.termLimit <= 0),
        new ButtonBuilder()
          .setCustomId("court_term_positive")
          .setLabel(cursor === 0 ? "+1 Month" : "+1 Term")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️"),
        new ButtonBuilder()
          .setCustomId("court_term_next")
          .setLabel(cursor === 0 ? "Modify Term Limit" : "Modify Term Length")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId("court_term_confirm")
          .setLabel("Continue")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      ])

    await this.initWizard.interaction.editReply({ embeds: [embed], components: [actionRow] });

    try {
      const confirmation = await this.initWizard.response!.awaitMessageComponent({
        filter: this.initWizard.buttonFilter,
        time: settings.discord.interactionTimeout
      });
      await confirmation.deferUpdate();

      switch (confirmation.customId) {
        case "court_term_back":
          return await this.initWizard.setPrevFunc();
        case "court_term_negative":
          if (cursor === 0) {
            courtOptions.terms.termLength -= (courtOptions.terms.termLength <= 1 ? 0 : 1);
          } else {
            courtOptions.terms.termLimit -= (courtOptions.terms.termLimit <= 0 ? 0 : 1);
          }
          break;
        case "court_term_positive":
          if (cursor === 0) {
            courtOptions.terms.termLength += 1;
          } else {
            courtOptions.terms.termLimit += 1;
          }
          break;
        case "court_term_next":
          courtOptions.terms.cursor = 1 - courtOptions.terms.cursor;
          break;
        case "court_term_confirm":
          this.initWizard.prevFunctions.push(this.setCourtThresholdOptions);
          return await this.initWizard.setNextFunc(
            this.initWizard.fragments.discord.linkDiscordRoles
          );
        default:
          return await this.initWizard.escape();
      }
    } catch (_e) {
      return await this.initWizard.timedOut();
    }
  }
}

export default JudicialWizard;