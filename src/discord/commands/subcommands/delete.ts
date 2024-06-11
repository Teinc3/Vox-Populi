import {  
    Guild, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    type ChatInputCommandInteraction, type MessageComponentInteraction
} from "discord.js";

import { deleteGuildDocument } from "../../../db/schema/Guild";

import constants from "../../../data/constants.json" assert { type: "json" };

export default async function execute_delete(interaction: ChatInputCommandInteraction, guild: Guild): Promise<boolean> {
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
    const response = await interaction.reply({ content: 'Are you sure you want to delete the current server configuration?', components: [row], ephemeral: false });

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
            const result = await deleteGuildDocument(guild.id);
            if (result) {
                await interaction.followUp({ content: 'Server configuration has been successfully deleted.', ephemeral: false });
            } else {
                return false;
            }
        } else {
            await interaction.followUp({ content: 'Server configuration deletion has been cancelled.', ephemeral: false });
        }
        return true;

    } catch (err) {
        await interaction.followUp({ content: 'Server configuration deletion has timed out.', ephemeral: true });
        return false;
    }
}