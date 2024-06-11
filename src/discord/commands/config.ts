import { SlashCommandBuilder, PermissionsBitField, type ChatInputCommandInteraction, type Guild, type GuildMember } from "discord.js";

import { findGuildDocument } from "../../db/schema/Guild.js";
import init from "./subcommands/init.js";
import execute_delete from "./subcommands/delete.js";

import constants from "../../data/constants.json" assert { type: 'json' };

const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription("Configures the Server.")
    .setDMPermission(false)
    .addSubcommand((subcommand) => {
        subcommand.setName('init');
        subcommand.setDescription('Creates a new server configuration.');
        subcommand.addStringOption((option) => {
            option.setName('politicalsystem');
            option.setDescription('Select the desired political system for the server.');
            option.setRequired(true);
            option.addChoices(
                { name: 'Presidential', value: 'presidential' },
                { name: 'Parliamentary', value: 'parliamentary' },
                { name: 'Direct Democracy', value: 'directdemocracy'}
            );
            return option;
        });
        return subcommand;
    })
    .addSubcommand((subcommand) => {
        subcommand.setName('delete');
        subcommand.setDescription('Deletes the server configuration.');
        return subcommand;
    });

async function execute(interaction: ChatInputCommandInteraction) {
    const { guild } = interaction;
    if (guild === null) {
        // Should not happen with DM permissions off, but just in case
        return await interaction.reply({ content: 'This command must be run in a server.', ephemeral: false });
    }

    // Fetch guild and member data
    await guild.fetch();
    if (interaction.member === null) {
        await guild.members.fetch(interaction.user.id);
    }
    if (interaction.guild?.members.me === null) {
        await guild.members.fetch(interaction.client.user.id);
    }

    if (!await checkPermissions(interaction, guild)) {
        return;
    }

    // Proceed with configuration
    try {
        // Handle subcommand
        let result: boolean;
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case "init":
                result = await init(interaction, guild);
                break;
            case "delete":
                result = await execute_delete(interaction, guild);
                return;
            default:
                throw new Error('Invalid subcommand.');
        }

        if (!result) {
            throw new Error('Configuration Error');
        }
    } catch (err) {
        console.error(err);
        const errorMsgObject = { content: 'An error occurred while attempting to update the server configuration.', ephemeral: true }
        if (interaction.replied) {
            await interaction.followUp(errorMsgObject);
        } else {
            await interaction.reply(errorMsgObject);
        }
    }
}

/* Permissions Check for Config Command
1. Must not be in DM
2. Guild must not be configured before for subcommand "init", or must be configured otherwise.
3. User must have the necessary permissions
    1: Bot Owner
    2: Server Owner
    3: In server with ADMINISTRATOR permission
    4: Less than 5 members in server (Does not include Bot)
4. Bot must have the necessary ADMINISTRATOR permissions
*/
async function checkPermissions(interaction: ChatInputCommandInteraction, guild: Guild): Promise<boolean> {
    const hasConfigedGuild = await findGuildDocument(guild.id) !== null;
    if (interaction.options.getSubcommand() === "init" && hasConfigedGuild) {
        await interaction.reply({ content: 'This server has already been configured.', ephemeral: false });
        return false;
    } else if (interaction.options.getSubcommand() !== "init" && !hasConfigedGuild) {
        await interaction.reply({ content: 'This server does not have a proper configuration.', ephemeral: false });
        return false;
    }

    const isUserBotOwner = interaction.user.id === constants.discord.botOwnerID;
    const isServerOwner = guild.ownerId === interaction.user.id;
    const isAdmin = (interaction.member as GuildMember | null)?.permissions.has(PermissionsBitField.Flags.Administrator) ?? false;
    const memberCount = guild.memberCount;

    if (!isUserBotOwner && !isServerOwner && !isAdmin && memberCount > constants.discord.maxMemberFreeConfigCount) {
        await interaction.reply({ content: 'You do not have the necessary permissions to configure this server.', ephemeral: true });
        return false;
    }

    // Check if bot is server owner or has ADMINISTRATOR permissions
    const isBotOwner = guild.ownerId === interaction.client.user.id;
    const isBotAdmin = isBotOwner || (interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.Administrator) ?? false);

    if (!isBotAdmin) {
        await interaction.reply({ content: 'I do not have the necessary permissions to configure this server.', ephemeral: false });
        return false;
    }

    return true;
}

export { data, execute };