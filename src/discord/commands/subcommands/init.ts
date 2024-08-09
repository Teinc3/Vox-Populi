import { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, Colors, ButtonStyle,
    type ChatInputCommandInteraction, type Interaction, type InteractionResponse,
    type ButtonInteraction, type APIButtonComponentWithCustomId,
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

    private buttonFilter = (i: Interaction) => i.isButton() && i.user.id === this.interaction.user.id;

    // response is optional first because the message may not be sent yet
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
                    .setCustomId('system_directdemocracy')
                    .setLabel("Direct Democracy")
                    .setEmoji("🗳️")
                    .setStyle(ButtonStyle.Success)
            )
        
        if (this.response) {
            await this.interaction.editReply({ embeds: [selectPoliticalSystemEmbed], components: [actionRow] });
        } else {
            this.response = await this.interaction.reply({ embeds: [selectPoliticalSystemEmbed], components: [actionRow] });
        }

        try {
            const confirmation = await this.response.awaitMessageComponent({ filter: this.buttonFilter, time: constants.discord.interactionTimeout }) as ButtonInteraction;
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "system_cancel":
                    return await this.cancelled();

                case "system_presidential":
                    this.guildConfigData.politicalSystem = PoliticalSystemsType.Presidential;
                    this.prevFunctions = [this.selectPoliticalSystem];
                    this.page++;
                    return await this.setNextFunc(this.setPresidentialOptions);

                case "system_parliamentary":
                    this.guildConfigData.politicalSystem = PoliticalSystemsType.Parliamentary;
                    this.prevFunctions = [this.selectPoliticalSystem];
                    this.page++;
                    return await this.escape(false);
                    //return await this.setNextFunc(this.setSenateOptions);

                case "system_directdemocracy":
                    this.guildConfigData.politicalSystem = PoliticalSystemsType.DirectDemocracy;
                    this.prevFunctions = [this.selectPoliticalSystem];
                    this.page++;
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
                termLimits: constants.politicalSystem.presidential.termLimit,
                consecutive: constants.politicalSystem.presidential.consecutive,
                cursor: 0
            }
        }
    
        const presidentialOptions = this.guildConfigData.presidentialOptions;
    
        const fields = [
            {
                name: "Term Length",
                value: presidentialOptions.termLength === 1 ? "1 Month" : presidentialOptions.termLength.toString() + " Months",
                inline: true
            },
            {
                name: "Term Limits",
                value: presidentialOptions.termLimits === 0 ? "No Limits" : presidentialOptions.termLimits.toString(),
                inline: true
            },
            {
                name: "Consecutive Terms",
                value: presidentialOptions.consecutive ? "Enabled" : "Disabled",
                inline: true
            }
        ]
    
        const activeField = fields[presidentialOptions.cursor];
        activeField.inline = false;
    
        const selectPresidentialOptionsEmbed = new EmbedBuilder()
            .setTitle("Configure Options for Presidential System")
            .setDescription("These options decide the maximum number of terms the President can serve and how long for each one.")
            .setFields(
                fields[presidentialOptions.cursor],
                ...fields.filter((_, i) => i !== presidentialOptions.cursor)
            )
            .setColor(Colors.Blurple)
            .setFooter({ text: "Page " + this.page })
            .toJSON();
        
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(...[
                new ButtonBuilder()
                    .setCustomId("prez_options_back")
                    .setLabel("Back")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("↩️"),
                new ButtonBuilder()
                    .setCustomId("prez_options_negative")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("⬅️")
                    .setLabel(presidentialOptions.cursor === 0 ? "-1 Month" : "-1 Term")
                    .setDisabled(presidentialOptions.cursor === 0 && presidentialOptions.termLength <= 1 || presidentialOptions.cursor === 1 && presidentialOptions.termLimits <= 0),
                new ButtonBuilder()
                    .setCustomId("prez_options_positive")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("➡️")
                    .setLabel(presidentialOptions.cursor === 0 ? "+1 Month" : "+1 Term"),
                new ButtonBuilder()
                    .setCustomId("prez_options_toggle")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("↕️")
                    .setLabel("Toggle Consecutive Terms"),
                new ButtonBuilder()
                    .setCustomId("prez_options_next")
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Next Option")
                    .setEmoji("🆕"),
                new ButtonBuilder()
                    .setCustomId("prez_options_confirm")
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Goto Next Page")
                    .setEmoji("✅")
            ].filter(button => {
                const customID = (button.data as Partial<APIButtonComponentWithCustomId>).custom_id;
                if (presidentialOptions.cursor === 2 && (customID === "prez_options_negative" || customID === "prez_options_positive")) {
                    return false
                }
                if (presidentialOptions.cursor <= 1 && customID === "prez_options_toggle") {
                    return false
                }
                return true;
            }))
    
        await this.interaction.editReply({ embeds: [selectPresidentialOptionsEmbed], components: [actionRow] })

        try {
            const confirmation = await this.response!.awaitMessageComponent({ filter: this.buttonFilter, time: constants.discord.interactionTimeout }) as ButtonInteraction;
            await confirmation.deferUpdate();

            switch (confirmation.customId) {
                case "prez_options_back":
                    return await this.setPrevFunc();
                case "prez_options_negative":
                    if (presidentialOptions.cursor === 0) {
                        presidentialOptions.termLength -= (presidentialOptions.termLength <= 1 ? 0 : 1);
                    } else if (presidentialOptions.cursor === 1) {
                        presidentialOptions.termLimits -= (presidentialOptions.termLimits <= 0 ? 0 : 1);
                    } else {
                        return await this.escape();
                    }
                    break;
                case "prez_options_positive":
                    if (presidentialOptions.cursor === 0) {
                        presidentialOptions.termLength += 1;
                    } else if (presidentialOptions.cursor === 1) {
                        presidentialOptions.termLimits += 1;
                    } else {
                        return await this.escape();
                    }
                    break;
                case "prez_options_toggle":
                    if (presidentialOptions.cursor === 2) {
                        presidentialOptions.consecutive = !presidentialOptions.consecutive;
                    } else {
                        return await this.escape();
                    }
                    break;
                case "prez_options_next":
                    presidentialOptions.cursor += 1;
                    if (presidentialOptions.cursor >= 3) {
                        presidentialOptions.cursor = 0;
                    }
                    break;
                case "prez_options_confirm":
                    this.page++;
                    this.prevFunctions?.push(this.setPresidentialOptions);
                    return await this.escape(false);
                    //return await this.setNextFunc(this.selectEmergencyOptions);
                default:
                    return await this.escape();
            }
        } catch (e) {
            return await this.timedOut();
        }
    
        // Failsafe reassignment
        this.guildConfigData.presidentialOptions = presidentialOptions;
    
        return;
    }

    async setSenateOptions(): Promise<void> {
        return await this.setNextFunc(this.selectEmergencyOptions);
    }
    
    async setDDOptions(): Promise<void> {
        if (!this.guildConfigData.ddOptions) {
            this.guildConfigData.ddOptions = {
                isDD: true,
                appointModerators: constants.politicalSystem.directDemocracy.appointModerators.value,
                appointJudges: constants.politicalSystem.directDemocracy.appointJudges.value
            }
        }
        const selectDDOptionsEmbed = new EmbedBuilder()
            .setTitle("Configure Options for Direct Democracy")
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
                    .setLabel("Goto Next Page")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("✅")
            )
        
        await this.interaction.editReply({ embeds: [selectDDOptionsEmbed], components: [actionRow] });
    
        try {
            const confirmation = await this.response!.awaitMessageComponent({ filter: this.buttonFilter, time: constants.discord.interactionTimeout }) as ButtonInteraction;
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
                    this.page++;
                    this.prevFunctions?.push(this.setDDOptions);
                    return await this.escape(false);
                    //return await this.setNextFunc(this.selectEmergencyOptions);
                default:
                    return await this.escape();
            }	
        } catch (e) {
            return await this.timedOut();
        }
    }
    
    async selectEmergencyOptions(): Promise<void> {
        // Footer add that after confirmation cannot modify changes outside this wizard! Also button name will be "Confirm" not "Goto Next Page"
        return await this.setNextFunc(this.completeInit);
    }
    
    async completeInit(): Promise<void> {
        // Update database with new guild object
        const result = await createGuildDocument(this.interaction, this.guildConfigData, "Server Initialization");
        if (!result) {
            return await this.escape();
        }
    
        await this.interaction.followUp({ content: `Server has been successfully configured.`, ephemeral: false });
    
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