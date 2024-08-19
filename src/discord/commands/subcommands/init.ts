import {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, Colors, ButtonStyle,
    type ChatInputCommandInteraction, type MessageComponentInteraction, type InteractionResponse, type APIButtonComponentWithCustomId,
} from 'discord.js';
import { isDocument } from '@typegoose/typegoose';

import { createGuildDocument } from '../../../schema/Guild.js';
import { PoliticalRoleModel } from '../../../schema/roles/PoliticalRole.js';

import { GuildConfigData, PoliticalSystemsType } from '../../../types/types.js';
import constants from '../../../data/constants.json' assert { type: 'json' };

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
class InitWizard {
    interaction: ChatInputCommandInteraction;
    guildConfigData: GuildConfigData;
    response?: InteractionResponse;
    prevFunctions: InitWizardFunction[];
    nextFunction: InitWizardFunction | boolean;
    page: number;

    constructor(interaction: ChatInputCommandInteraction) {
        this.interaction = interaction;
        this.guildConfigData = {} as GuildConfigData;

        this.prevFunctions = [];
        this.nextFunction = this.selectPoliticalSystem.bind(this);
        this.page = 1;
    }

    private buttonFilter = (i: MessageComponentInteraction) => i.isButton() && i.user.id === this.interaction.user.id;

    async selectPoliticalSystem(): Promise<void> {
        // Send an embed to prompt the user to select a political system with 3 buttons
        const selectPoliticalSystemEmbed = new EmbedBuilder()
            .setTitle("Select a Political System")
            .setDescription("The political system you select will determine how the server functions!")
            .setFields([
                {
                    name: "Presidential",
                    value: constants.politicalSystem.presidential.description,
                    inline: false
                },
                {
                    name: "Parliamentary",
                    value: constants.politicalSystem.parliamentary.description,
                    inline: false
                },
                {
                    name: "Direct Democracy",
                    value: constants.politicalSystem.directDemocracy.description,
                    inline: false
                }
            ])
            .setColor(Colors.Blurple)
            .setFooter({ text: "Page " + this.page })
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

        if (this.response) {
            await this.interaction.editReply({ embeds: [selectPoliticalSystemEmbed], components: [actionRow] });
        } else {
            this.response = await this.interaction.reply({
                embeds: [selectPoliticalSystemEmbed],
                components: [actionRow]
            });
        }

        try {
            const confirmation = await this.response.awaitMessageComponent({
                filter: this.buttonFilter,
                time: constants.discord.interactionTimeout
            });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "system_cancel":
                    return await this.cancelled();

                case "system_presidential":
                    this.guildConfigData.politicalSystem = PoliticalSystemsType.Presidential;
                    this.prevFunctions = [this.selectPoliticalSystem];
                    return await this.setNextFunc(this.setPresidentialOptions);

                case "system_parliamentary":
                    this.guildConfigData.politicalSystem = PoliticalSystemsType.Parliamentary;
                    this.prevFunctions = [this.selectPoliticalSystem];
                    return await this.setNextFunc(this.setSenateTermOptions);

                case "system_dd":
                    this.guildConfigData.politicalSystem = PoliticalSystemsType.DirectDemocracy;
                    this.prevFunctions = [this.selectPoliticalSystem];
                    return await this.setNextFunc(this.setDDOptions);

                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    async setPresidentialOptions(): Promise<void> {

        if (!this.guildConfigData.presidentialOptions) {
            this.guildConfigData.presidentialOptions = {
                termLength: constants.politicalSystem.presidential.termLength,
                termLimit: constants.politicalSystem.presidential.termLimit,
                consecutive: constants.politicalSystem.presidential.consecutive,
                cursor: 0
            }
        }

        const presidentialOptions = this.guildConfigData.presidentialOptions;
        const cursor = presidentialOptions.cursor;

        const fields = [
            {
                name: "Term Length",
                value: presidentialOptions.termLength === 1 ? "1 Month" : presidentialOptions.termLength.toString() + " Months",
                inline: true
            },
            {
                name: "Term Limits",
                value: presidentialOptions.termLimit === 0 ? "No Limits" : presidentialOptions.termLimit.toString(),
                inline: true
            },
            {
                name: "Consecutive Terms",
                value: presidentialOptions.consecutive ? "Enabled" : "Disabled",
                inline: true
            }
        ]

        const activeField = fields[cursor];
        activeField.inline = false;

        const selectPresidentialOptionsEmbed = new EmbedBuilder()
            .setTitle("Configure Presidential Options (1/1)")
            .setDescription("These options decide the maximum number of terms the President can serve and how long for each one.")
            .setFields(
                fields[cursor],
                ...fields.filter((_, i) => i !== cursor)
            )
            .setColor(Colors.Blurple)
            .setFooter({ text: "Page " + this.page })
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
                    .setDisabled(cursor === 0 && presidentialOptions.termLength <= 1 || cursor === 1 && presidentialOptions.termLimit <= 0),
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
                    .setLabel(cursor === 0 ? "Modify Term Limit" : "Modify Term Length") // Won't show when cursor is 2
                    .setEmoji("🔄"),
                new ButtonBuilder()
                    .setCustomId("presidential_options_confirm")
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Continue")
                    .setEmoji("✅")
            ].filter(button => {
                const customID = (button.data as Partial<APIButtonComponentWithCustomId>).custom_id;
                if (cursor === 2 && (customID === "presidential_options_negative" || customID === "presidential_options_positive")) {
                    return false
                }
                return !(cursor <= 1 && customID === "presidential_options_toggle");

            }))

        await this.interaction.editReply({ embeds: [selectPresidentialOptionsEmbed], components: [actionRow] })

        try {
            const confirmation = await this.response!.awaitMessageComponent({
                filter: this.buttonFilter,
                time: constants.discord.interactionTimeout
            });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "presidential_options_back":
                    return await this.setPrevFunc();
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
                    this.prevFunctions.push(this.setPresidentialOptions);
                    return await this.setNextFunc(this.setSenateTermOptions);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    async setParliamentaryOptions(): Promise<void> {
        // Basically just snap elections, coalitions/majorities, oppositions, etc.
        // Now we only do snap Elections

        // Clamp the snap election value to be within the term length (otherwise weird things happen)
        if (!this.guildConfigData.parliamentaryOptions) {
            this.guildConfigData.parliamentaryOptions = {
                snapElection: Math.min(constants.politicalSystem.parliamentary.snapElection, this.guildConfigData.senateOptions!.terms.termLength - 1)
            }
        } else if (this.guildConfigData.parliamentaryOptions.snapElection > this.guildConfigData.senateOptions!.terms.termLength - 1) {
            this.guildConfigData.parliamentaryOptions.snapElection = this.guildConfigData.senateOptions!.terms.termLength - 1;
        }

        const embed = new EmbedBuilder()
            .setTitle("Configure options for Parliamentary System (1/1)")
            .setDescription("These options decide the frequency of snap elections.")
            .setFields([
                {
                    name: "Minimum Snap Election Interval",
                    value: this.guildConfigData.parliamentaryOptions.snapElection === 0 ? "Snap Elections Disabled" : this.guildConfigData.parliamentaryOptions.snapElection === 1 ? "1 Month" : this.guildConfigData.parliamentaryOptions.snapElection.toString() + " Months",
                    inline: true
                },
                {
                    name: "Configured Senator Term Length",
                    value: this.guildConfigData.senateOptions!.terms.termLength === 1 ? "1 Month" : this.guildConfigData.senateOptions!.terms.termLength.toString() + " Months",
                    inline: true
                }
            ])
            .setColor(Colors.Blurple)
            .setFooter({ text: "Page " + this.page })
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
                    .setDisabled(this.guildConfigData.parliamentaryOptions.snapElection <= 0),
                new ButtonBuilder()
                    .setCustomId('parliamentary_options_positive')
                    .setLabel("+1 Month")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("➡️")
                    .setDisabled(this.guildConfigData.parliamentaryOptions.snapElection >= this.guildConfigData.senateOptions!.terms.termLength - 1),
                new ButtonBuilder()
                    .setCustomId('parliamentary_options_confirm')
                    .setLabel("Continue")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("✅")
            )
        
        await this.interaction.editReply({ embeds: [embed], components: [actionRow] });

        try {
            const confirmation = await this.response!.awaitMessageComponent({ filter: this.buttonFilter, time: constants.discord.interactionTimeout});
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "parliamentary_options_back":
                    return await this.setPrevFunc();
                case "parliamentary_options_negative":
                    this.guildConfigData.parliamentaryOptions.snapElection -= (this.guildConfigData.parliamentaryOptions.snapElection <= 0 ? 0 : 1);
                    break;
                case "parliamentary_options_positive":
                    this.guildConfigData.parliamentaryOptions.snapElection += (this.guildConfigData.parliamentaryOptions.snapElection >= this.guildConfigData.senateOptions!.terms.termLength - 1 ? 0 : 1);
                    break;
                case "parliamentary_options_confirm":
                    this.prevFunctions.push(this.setParliamentaryOptions);
                    return await this.setNextFunc(this.setCourtGenericOptions); // Since we first went to configure senate then came back
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    async setSenateTermOptions(): Promise<void> {
        if (!this.guildConfigData.senateOptions) {
            this.guildConfigData.senateOptions = {
                terms: {
                    termLength: constants.legislature.senate.termLength,
                    termLimit: constants.legislature.senate.termLimit,
                    consecutive: true,
                    cursor: 0
                },
                seats: {
                    scalable: constants.legislature.senate.seats.scalable,
                    value: constants.legislature.senate.seats.value
                },
                threshold: {
                    super: constants.thresholds.super,
                    simple: constants.thresholds.simple,
                    cursor: 0
                }
            }
        }

        const termOptions = this.guildConfigData.senateOptions.terms;
        const cursor = termOptions.cursor;

        const embed = new EmbedBuilder()
            .setTitle("Configure Senate Term Options (1/3)")
            .setDescription("These options decide how long and how many terms Senators can serve.")
            .setFields([
                {
                    name: "Term Length",
                    value: termOptions.termLength === 1 ? "1 Month" : termOptions.termLength.toString() + " Months",
                    inline: true
                },
                {
                    name: "Term Limits",
                    value: termOptions.termLimit === 0 ? "No Limits" : termOptions.termLimit.toString(),
                    inline: true
                }
            ])
            .setColor(Colors.Blurple)
            .setFooter({ text: "Page " + this.page })
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

        await this.interaction.editReply({ embeds: [embed], components: [actionRow] });

        try {
            const confirmation = await this.response!.awaitMessageComponent({
                filter: this.buttonFilter,
                time: constants.discord.interactionTimeout
            });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "senate_term_back":
                    return await this.setPrevFunc();
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
                    this.prevFunctions.push(this.setSenateTermOptions);
                    return await this.setNextFunc(this.setSenateSeatOptions);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    async setSenateSeatOptions(): Promise<void> {
        const seatsOptions = this.guildConfigData.senateOptions!.seats;

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
            .setFooter({ text: "Page " + this.page })
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

        await this.interaction.editReply({ embeds: [embed], components: [actionRow] });

        try {
            const confirmation = await this.response!.awaitMessageComponent({
                filter: this.buttonFilter,
                time: constants.discord.interactionTimeout
            });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "senate_seat_back":
                    return await this.setPrevFunc();
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
                    this.prevFunctions.push(this.setSenateSeatOptions);
                    return await this.setNextFunc(this.setSenateThresholdOptions);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    async setSenateThresholdOptions(): Promise<void> {
        const thresholdOptions = this.guildConfigData.senateOptions!.threshold;
        const cursor = thresholdOptions.cursor;

        // Should not happen, just for type safety
        if (!thresholdOptions.super) {
            return await this.escape();
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
            .setDescription("These options decide the percentage of votes needed for simple or super majorities.")
            .setFields(fields)
            .setColor(Colors.Blurple)
            .setFooter({ text: "Page " + this.page })
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
                    .setLabel(cursor === 0 ? "Modify Simple Majority Threshold" : "Modify Supermajority Threshold")
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
                    .setDisabled(cursor === 0 && thresholdOptions.super <= 10 || cursor === 1 && thresholdOptions.simple <= 10),
                new ButtonBuilder()
                    .setCustomId('senate_threshold_minus_one')
                    .setLabel("-1%")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("⬅️")
                    .setDisabled(cursor === 0 && thresholdOptions.super <= 1 || cursor === 1 && thresholdOptions.simple <= 1),
                new ButtonBuilder()
                    .setCustomId('senate_threshold_plus_one')
                    .setLabel("+1%")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("➡️")
                    .setDisabled(cursor === 0 && thresholdOptions.super >= 100 || cursor === 1 && thresholdOptions.simple >= 100),
                new ButtonBuilder()
                    .setCustomId('senate_threshold_plus_ten')
                    .setLabel("+10%")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("⏩")
                    .setDisabled(cursor === 0 && thresholdOptions.super >= 91 || cursor === 1 && thresholdOptions.simple >= 91),
            )

        await this.interaction.editReply({ embeds: [embed], components: [actionRowUtilities, actionRowThreshold] });

        try {
            const confirmation = await this.response!.awaitMessageComponent({
                filter: this.buttonFilter,
                time: constants.discord.interactionTimeout
            });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "senate_threshold_back":
                    return await this.setPrevFunc();
                case "senate_threshold_minus_ten":
                    if (cursor === 0) {
                        thresholdOptions.super -= (thresholdOptions.super <= 10 ? 0 : 10);
                    } else if (cursor === 1) {
                        thresholdOptions.simple -= (thresholdOptions.simple <= 10 ? 0 : 10);
                    } else {
                        return await this.escape();
                    }
                    break;
                case "senate_threshold_minus_one":
                    if (cursor === 0) {
                        thresholdOptions.super -= (thresholdOptions.super <= 1 ? 0 : 1);
                    } else if (cursor === 1) {
                        thresholdOptions.simple -= (thresholdOptions.simple <= 1 ? 0 : 1);
                    } else {
                        return await this.escape();
                    }
                    break;
                case "senate_threshold_plus_one":
                    if (cursor === 0) {
                        thresholdOptions.super += (thresholdOptions.super >= 100 ? 0 : 1);
                    } else if (cursor === 1) {
                        thresholdOptions.simple += (thresholdOptions.simple >= 100 ? 0 : 1);
                    } else {
                        return await this.escape();
                    }
                    break;
                case "senate_threshold_plus_ten":
                    if (cursor === 0) {
                        thresholdOptions.super += (thresholdOptions.super >= 91 ? 0 : 10);
                    } else if (cursor === 1) {
                        thresholdOptions.simple += (thresholdOptions.simple >= 91 ? 0 : 10);
                    } else {
                        return await this.escape();
                    }
                    break;
                case "senate_threshold_toggle":
                    thresholdOptions.cursor = 1 - thresholdOptions.cursor;
                    break;
                case "senate_threshold_confirm":
                    this.prevFunctions.push(this.setSenateThresholdOptions);
                    // For Parliamentary, we go to configure Parliamentary Options (since we skipped it first for snap elections which are more relevant after senate is set up)
                    // Since DD does not have Senate, and only DD has the option to disable Judges, we can still go to Court Options
                    return await this.setNextFunc(this.guildConfigData.politicalSystem === PoliticalSystemsType.Parliamentary ? this.setParliamentaryOptions : this.setCourtGenericOptions);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    async setDDOptions(): Promise<void> {
        if (!this.guildConfigData.ddOptions) {
            this.guildConfigData.ddOptions = {
                appointModerators: constants.politicalSystem.directDemocracy.appointModerators.value,
                appointJudges: constants.politicalSystem.directDemocracy.appointJudges.value,
            }
        }
        const selectDDOptionsEmbed = new EmbedBuilder()
            .setTitle("Configure Options for Direct Democracy (1/1)")
            .setDescription("These options decide if Moderators and Judges are to be elected through referendums or if Citizens collectively complete their work instead.")
            .setFields([
                {
                    name: "Elect Moderators",
                    value: this.guildConfigData.ddOptions.appointModerators ? "Enabled" : "Disabled",
                    inline: true
                },
                {
                    name: "Elect Judges",
                    value: this.guildConfigData.ddOptions.appointJudges ? "Enabled" : "Disabled",
                    inline: true
                }
            ])
            .setColor(Colors.Blurple)
            .setFooter({ text: "Page " + this.page })
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

        await this.interaction.editReply({ embeds: [selectDDOptionsEmbed], components: [actionRow] });

        try {
            const confirmation = await this.response!.awaitMessageComponent({
                filter: this.buttonFilter,
                time: constants.discord.interactionTimeout
            });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "dd_options_back":
                    return await this.setPrevFunc();
                case "dd_options_appoint_moderators":
                    this.guildConfigData.ddOptions.appointModerators = !this.guildConfigData.ddOptions.appointModerators;
                    break;
                case "dd_options_appoint_judges":
                    this.guildConfigData.ddOptions.appointJudges = !this.guildConfigData.ddOptions.appointJudges;
                    break;
                case "dd_options_confirm":
                    this.prevFunctions.push(this.setDDOptions);
                    return await this.setNextFunc(this.setReferendumOptions);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    async setReferendumOptions(): Promise<void> {
        if (!this.guildConfigData.referendumThresholds) {
            this.guildConfigData.referendumThresholds = {
                simple: constants.thresholds.simple,
                super: constants.thresholds.super,
                cursor: 0
            }
        }

        const referendumThresholds = this.guildConfigData.referendumThresholds;
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
            .setDescription("These options decide the percentage of votes needed for simple or super majorities in referendums.")
            .setFields(fields)
            .setColor(Colors.Blurple)
            .setFooter({ text: "Page " + this.page })
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
                    .setLabel(cursor === 0 ? "Modify Simple Majority Threshold" : "Modify Supermajority Threshold")
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
                    .setDisabled(cursor === 0 && referendumThresholds.super <= 10 || cursor === 1 && referendumThresholds.simple <= 10),
                new ButtonBuilder()
                    .setCustomId('referendum_minus_one')
                    .setLabel("-1%")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("⬅️")
                    .setDisabled(cursor === 0 && referendumThresholds.super <= 1 || cursor === 1 && referendumThresholds.simple <= 1),
                new ButtonBuilder()
                    .setCustomId('referendum_plus_one')
                    .setLabel("+1%")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("➡️")
                    .setDisabled(cursor === 0 && referendumThresholds.super >= 100 || cursor === 1 && referendumThresholds.simple >= 100),
                new ButtonBuilder()
                    .setCustomId('referendum_plus_ten')
                    .setLabel("+10%")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("⏩")
                    .setDisabled(cursor === 0 && referendumThresholds.super >= 91 || cursor === 1 && referendumThresholds.simple >= 91),
            )

        await this.interaction.editReply({ embeds: [embed], components: [actionRowUtilities, actionRowThreshold] });

        try {
            const confirmation = await this.response!.awaitMessageComponent({ filter: this.buttonFilter, time: constants.discord.interactionTimeout });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "referendum_back":
                    return await this.setPrevFunc();
                case "referendum_minus_ten":
                    if (cursor === 0) {
                        referendumThresholds.super -= (referendumThresholds.super <= 10 ? 0 : 10);
                    } else if (cursor === 1) {
                        referendumThresholds.simple -= (referendumThresholds.simple <= 10 ? 0 : 10);
                    } else {
                        return await this.escape();
                    }
                    break;
                case "referendum_minus_one":
                    if (cursor === 0) {
                        referendumThresholds.super -= (referendumThresholds.super <= 1 ? 0 : 1);
                    } else if (cursor === 1) {
                        referendumThresholds.simple -= (referendumThresholds.simple <= 1 ? 0 : 1);
                    } else {
                        return await this.escape();
                    }
                    break;
                case "referendum_plus_one":
                    if (cursor === 0) {
                        referendumThresholds.super += (referendumThresholds.super >= 100 ? 0 : 1);
                    } else if (cursor === 1) {
                        referendumThresholds.simple += (referendumThresholds.simple >= 100 ? 0 : 1);
                    } else {
                        return await this.escape();
                    }
                    break;
                case "referendum_plus_ten":
                    if (cursor === 0) {
                        referendumThresholds.super += (referendumThresholds.super >= 91 ? 0 : 10);
                    } else if (cursor === 1) {
                        referendumThresholds.simple += (referendumThresholds.simple >= 91 ? 0 : 10);
                    } else {
                        return await this.escape();
                    }
                    break;
                case "referendum_toggle":
                    referendumThresholds.cursor = 1 - referendumThresholds.cursor;
                    break;
                case "referendum_confirm":
                    this.prevFunctions.push(this.setReferendumOptions);
                    return await this.setNextFunc(this.guildConfigData.ddOptions!.appointJudges ? this.setCourtGenericOptions : this.setEmergencyOptions);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    /**
     * First page of Court Options
     * 
     * Sets number of Judges and Threshold for Court Verdicts
     */
    async setCourtGenericOptions(): Promise<void> {   
        // Initialize the Court Options if they don't exist
        if (!this.guildConfigData.courtOptions) {
            this.guildConfigData.courtOptions = {
                terms: {
                    termLength: constants.judicial.terms.termLength,
                    termLimit: constants.judicial.terms.termLimit,
                    consecutive: true,
                    cursor: 0
                },
                seats: {
                    scalable: false,
                    value: constants.judicial.seats
                },
                threshold: {
                    simple: constants.thresholds.simple,
                    super: constants.thresholds.unanimous,
                }
            }
        }

        const courtOptions = this.guildConfigData.courtOptions;

        const embed = new EmbedBuilder()
            .setTitle("Configure Court Options (1/2)")
            .setDescription("These options decide how many seats are available in the Court and the threshold for a verdict to pass.")
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
            .setFooter({ text: "Page " + this.page })
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

        await this.interaction.editReply({ embeds: [embed], components: [actionRowUtilities, actionRowThreshold] });

        try {
            const confirmation = await this.response!.awaitMessageComponent({ filter: this.buttonFilter, time: constants.discord.interactionTimeout });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "court_generic_back":
                    return await this.setPrevFunc();
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
                    this.prevFunctions.push(this.setCourtGenericOptions);
                    return await this.setNextFunc(this.setCourtThresholdOptions);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    /**
     * Second page of Court Options
     * 
     * Sets Term Length, Term Limits and if Consecutive Terms are allowed for Court Judges
     */
    async setCourtThresholdOptions(): Promise<void> {
        const courtOptions = this.guildConfigData.courtOptions!;
        const cursor = courtOptions.terms.cursor;

        const fields = [
            {
                name: "Term Length",
                value: courtOptions.terms.termLength === 1 ? "1 Month" : courtOptions.terms.termLength.toString() + " Months",
                inline: true
            },
            {
                name: "Term Limits",
                value: courtOptions.terms.termLimit === 0 ? "No Limits" : courtOptions.terms.termLimit.toString(),
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
            .setFooter({ text: "Page " + this.page })
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
                    .setDisabled(cursor === 0 && courtOptions.terms.termLength <= 1 || cursor === 1 && courtOptions.terms.termLimit <= 0),
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

        await this.interaction.editReply({ embeds: [embed], components: [actionRow] });

        try {
            const confirmation = await this.response!.awaitMessageComponent({ filter: this.buttonFilter, time: constants.discord.interactionTimeout });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "court_term_back":
                    return await this.setPrevFunc();
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
                    this.prevFunctions.push(this.setCourtThresholdOptions);
                    return await this.setNextFunc(this.setEmergencyOptions);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    async setEmergencyOptions(): Promise<void> {
        // Footer add that after confirmation cannot modify changes outside this wizard! Also button name will be "Confirm" not "Continue"
        const embed = new EmbedBuilder()
            .setTitle("Configure Emergency Options (1/1)")
            .setDescription("These options decide how the server handles emergencies.")
            .setColor(Colors.Red)
            .setFooter({ text: `Page: ${this.page}. This is the last page of the config wizard. After confirmation, all settings will be finalized!` })
            .toJSON();

        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('emergency_cancel')
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("❎"),
                new ButtonBuilder()
                    .setCustomId('emergency_back')
                    .setLabel("Back")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("↩️"),
                new ButtonBuilder()
                    .setCustomId('emergency_confirm')
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("✅")
            )

        await this.interaction.editReply({ embeds: [embed], components: [actionRow] });

        try {
            const confirmation = await this.response!.awaitMessageComponent({
                filter: this.buttonFilter,
                time: constants.discord.interactionTimeout
            });
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "emergency_cancel":
                    return await this.cancelled();
                case "emergency_back":
                    return await this.setPrevFunc();
                case "emergency_confirm":
                    return await this.setNextFunc(this.completeInit);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    }

    async completeInit(): Promise<void> {
        // Show "Configuring Server" message
        const configuringEmbed = new EmbedBuilder()
            .setTitle("Configuring Server")
            .setDescription("Please wait while the server is being configured...")
            .setColor(Colors.Blurple)
            .toJSON();
        await this.interaction.editReply({ embeds: [configuringEmbed], components: [] });

        // Update database with new guild object
        const result = await createGuildDocument(this.interaction, this.guildConfigData, "Server Initialization");
        if (!result) {
            return await this.escape();
        }

        const successEmbed = new EmbedBuilder()
            .setTitle("Server Configuration")
            .setDescription("Server has been successfully configured.")
            .setColor(Colors.Green)
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
        this.nextFunction = prevFunction.bind(this);
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
        this.nextFunction = nextFunction.bind(this);
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