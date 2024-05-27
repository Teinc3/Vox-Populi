import { 
    SlashCommandBuilder, PermissionsBitField, EmbedBuilder, 
    ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType,
    type CommandInteraction, type Guild, type GuildMember,
} from "discord.js";

import type DBManager from "../../db/DBManager.js";

import { PoliticalSystemsType, PoliticalSystemDescriptions } from "../../types/static.js";
import constants from "../../data/constants.json" assert { type: 'json' };

const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription("Configures the Server.");

/* Call-Checks
1. Must not be in DM
2. Guild must not be configured before
3. User must have the necessary permissions
    1: Server Owner
    2: In server with ADMINISTRATOR permission
    3: Less than 5 non-bots in server
4. Bot must have the necessary ADMINISTRATOR permissions
*/
async function execute(interaction: CommandInteraction, dbManager: DBManager) {
    let { guild } = interaction;

    if (guild === null) {
        return await interaction.reply({ content: 'This command must be run in a server.', ephemeral: false });
    }

    // Fetch guild and member data
    guild = await guild.fetch();
    if (interaction.member === null) {
        await guild.members.fetch(interaction.user.id);
    }
    if (interaction.guild?.members.me === null) {
        await guild.members.fetch(interaction.client.user.id);
    }

    if (!await checkPermissions(interaction, dbManager, guild)) {
        return;
    }

    // Proceed with configuration
    try {
        const politicalSystem = await selectPoliticalSystem(interaction);
        if (politicalSystem === false) {
            return;
        }
        // Update database with new guild object
        const result = await dbManager.createGuildDocument(guild.id, politicalSystem, guild.ownerId === interaction.client.user.id);

        if (result) {
            await interaction.followUp({ content: 'Server has been successfully configured.', ephemeral: true });
        } else {
            throw new Error('Failed to create guild document.');
        }
    } catch (err) {
        console.error(err);
        const errorMsgObject = { content: 'An error occurred while attempting to configure the server.', ephemeral: true }
        if (interaction.replied) {
            await interaction.followUp(errorMsgObject);
        } else {
            await interaction.reply(errorMsgObject);
        }
    }
}

async function checkPermissions(interaction: CommandInteraction, dbManager: DBManager, guild: Guild): Promise<boolean> {
    if (await dbManager.getGuildObject(guild.id) !== null) {
        await interaction.reply({ content: 'This server has already been configured.', ephemeral: true });
        return false;
    }

    const isServerOwner = guild.ownerId === interaction.user.id;
    const isAdmin = (interaction.member as GuildMember | null)?.permissions.has(PermissionsBitField.Flags.Administrator) ?? false;
    const memberCount = guild.memberCount;

    if (!isServerOwner && !isAdmin && memberCount >= constants.defaults.maxMemberFreeConfigCount) {
        await interaction.reply({ content: 'You do not have the necessary permissions to configure this server.', ephemeral: true });
        return false;
    }

    // Check if bot is server owner or has ADMINISTRATOR permissions
    const isBotOwner = guild.ownerId === interaction.client.user.id;
    const isBotAdmin = isBotOwner || (interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.Administrator) ?? false);

    if (!isBotAdmin) {
        await interaction.reply({ content: 'I do not have the necessary permissions to configure this server.', ephemeral: true });
        return false;
    }

    return true;
}

// Page 1
async function selectPoliticalSystem(interaction: CommandInteraction): Promise<PoliticalSystemsType | false> {
    const politicalSystemOptions = Object.keys(PoliticalSystemsType).filter(key => isNaN(Number(key)))

    const embed = new EmbedBuilder()
        .setTitle('Server Configuration')
        .setDescription('Step 1. Select a political system for your server.')
        .setFooter({ text: 'Page 1/3' })
        .addFields(politicalSystemOptions.map((system, index) => {
            return {
                name: `${index + 1}. ${system}`,
                value: PoliticalSystemDescriptions[index as PoliticalSystemsType],
                inline: false
                };
            }
        ));

    // Attach dropdown menu for selecting political system
    const select = new StringSelectMenuBuilder()
        .setCustomId('select_political_system')
        .setPlaceholder('Select a Political System')
        .addOptions(politicalSystemOptions.map((system) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(system)
                .setValue(system.toLowerCase())
        }));
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    // Send message
    const response = await interaction.reply({ embeds: [embed], components: [row] });

    // Wait for user to select political system
    const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: constants.defaults.interactionTimeout });

    return new Promise((resolve, _) => {
        collector.on('collect', async (selectInteraction) => {
            const selectedSystem = selectInteraction.values[0];
            const index = politicalSystemOptions.findIndex(system => system.toLowerCase() === selectedSystem);
            await selectInteraction.deferUpdate();
            collector.stop('selected');
            resolve(index as PoliticalSystemsType);
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time') {
                await interaction.followUp({ content: 'You did not select a political system in time.', ephemeral: true });
                resolve(false);
            }
        });
    });
}

export { data, execute };