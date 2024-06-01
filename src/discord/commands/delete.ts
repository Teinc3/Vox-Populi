import { 
    SlashCommandBuilder, type CommandInteraction,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    type MessageComponentInteraction
} from "discord.js";

import type DBManager from "../../db/DBManager";

import constants from "../../data/constants.json" assert { type: "json" };

const data = new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Deletes the server configuration.');

// Cannot be reset unless Bot Owner OR server owner OR < maxMemberFreeConfigCount members.
async function execute(interaction: CommandInteraction, dbManager: DBManager) {
    let { guild } = interaction;
    if (guild === null) {
        return await interaction.reply({ content: 'This command must be run in a server.', ephemeral: false });
    }

    const isUserBotOwner = interaction.user.id === constants.discord.botOwnerID;
    if (!isUserBotOwner) {
        await guild.fetch();

        const memberCount = guild.memberCount;

        if (interaction.member === null) {
            await guild.members.fetch(interaction.user.id);
        }
        const isServerOwner = guild.ownerId === interaction.user.id;
        
        if (!isServerOwner && memberCount > constants.discord.maxMemberFreeConfigCount) {
            return await interaction.reply({ content: 'You do not have the necessary permissions to delete the server configuration.', ephemeral: true });
        }
    }

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
            const result = await dbManager.deepDeleteGuildDocument(guild.id);
            if (result) {
                await interaction.followUp({ content: 'Server configuration has been successfully deleted.', ephemeral: false });
            } else {
                await interaction.followUp({ content: 'Failed to delete server configuration.', ephemeral: true });
            }
        } else {
            await interaction.followUp({ content: 'Server configuration deletion has been cancelled.', ephemeral: false });
        }
    } catch (err) {
        await interaction.followUp({ content: 'Server configuration deletion has timed out.', ephemeral: true });
    }
}

export { data, execute };