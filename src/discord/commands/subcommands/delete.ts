import {  
    ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors,
    type Guild, type ChatInputCommandInteraction, type MessageComponentInteraction,
} from "discord.js";

import { deleteGuildDocument } from "../../../schema/Guild.js";

import constants from "../../../data/constants.json" assert { type: "json" };

export default async function execute_delete(interaction: ChatInputCommandInteraction, guild: Guild): Promise<boolean> {
    const embed = new EmbedBuilder()
        .setTitle('Server Configuration Deletion')
        .setDescription('Are you sure you want to delete the current server configuration? This will delete all data associated with this server from the database.')
        .setColor(Colors.Yellow)
        .setFooter({ text: 'This action is irreversible!' });

    // Add a confirmation step
    const confirm = new ButtonBuilder()
        .setCustomId('delete_confirm')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Danger);
    const cancel = new ButtonBuilder()
        .setCustomId('delete_cancel')
        .setLabel('No')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(confirm, cancel);
    const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });

    const filter = (i: MessageComponentInteraction) => i.isButton() && i.customId === 'delete_confirm' || i.customId === 'delete_cancel';

    try {
        const collected = await response.awaitMessageComponent({ filter, time: constants.discord.interactionTimeout });

        // Deferring the follow-up to prevent the interaction from timing out
        await collected.deferUpdate();
        
        // Lock the buttons
        confirm.setDisabled(true);
        cancel.setDisabled(true);
        const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);
        await response.edit({ components: [newRow] });

        if (collected.customId === 'delete_confirm') {
            // Proceed with deletion
            const result = await deleteGuildDocument(guild, `Server configuration deletion requested by ${interaction.user.tag} (${interaction.user.id})`);
            if (result) {
                const embed = new EmbedBuilder()
                    .setTitle('Server Configuration Deletion')
                    .setDescription('Server configuration has been successfully deleted.')
                    .setColor(Colors.Green)
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();
                try {
                    await interaction.editReply({ embeds: [embed], components: [] });
                } catch (err) {
                    await interaction.followUp({ embeds: [embed], components: [] });
                }
            } else {
                return false;
            }
        } else {
            const embed = new EmbedBuilder()
                .setTitle('Server Configuration Deletion')
                .setDescription('Server configuration deletion has been cancelled.')
                .setColor(Colors.Red);
            await interaction.editReply({ embeds: [embed], components: [] });
        }
        return true;

    } catch (err) {
        const embed = new EmbedBuilder()
            .setTitle('Server Configuration Deletion')
            .setDescription('Server configuration deletion has timed out.')
            .setColor(Colors.Red);
        await interaction.editReply({ embeds: [embed], components: [] });
        return false;
    }
}