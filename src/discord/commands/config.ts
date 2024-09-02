import {
    SlashCommandBuilder, PermissionsBitField,
    type ChatInputCommandInteraction, type Guild, type GuildMember
} from "discord.js";

import init from "./subcommands/init.js";
//import view from "./subcommands/view.js"
import execute_delete from "./subcommands/delete.js";

import GuildModel from "../../schema/PoliticalGuild.js";

import settings from "../../data/settings.json" assert { type: 'json' };

const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription("Configures the Server.")
    .setDMPermission(false)
    .addSubcommand((subcommand) => {
        subcommand.setName('init');
        subcommand.setDescription('Creates a new server configuration.');
        return subcommand;
    })
    .addSubcommandGroup((subcommandGroup) => {
        subcommandGroup.setName('view')
            .setDescription('Views the current server configuration.')
            .addSubcommand((subcommand) => {
                subcommand.setName('roles');
                subcommand.setDescription('Views configuration for a specific role.');
                subcommand.addRoleOption((option) => {
                    option.setName('role');
                    option.setDescription('The role to view the configuration for.');
                    option.setRequired(true);
                    return option;
                });
                return subcommand;
            });
        return subcommandGroup;
    })
    .addSubcommand((subcommand) => {
        subcommand.setName('delete');
        subcommand.setDescription('Deletes the server configuration.');
        subcommand.addBooleanOption((option) => {
            option.setName('removeobjects');
            option.setDescription('Should all channels and roles associated with the server configuration be removed?');
            option.setRequired(true);
            return option;
        });
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
    // Handle subcommand
    let result = false;
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case "init":
            result = await init(interaction);
            break;
        case "view":
            // Not implemented yet
            break;
        case "delete":
            result = await execute_delete(interaction, guild);
            return;
        default:
            console.error('Invalid Subcommand');
            break;
    }

    if (!result) {
        const errorMsgObject = {
            content: 'An error occurred while attempting to update the server configuration.',
            ephemeral: true
        }
        if (interaction.replied) {
            await interaction.followUp(errorMsgObject);
        } else {
            await interaction.reply(errorMsgObject);
        }
    }
}

/**
 * Permissions Check for Config Command
 * 
 * The user must satisfy the following conditions to configure the server:
 * 
 * - Must not be in DM
 * - Guild must not be configured before for subcommand "init", or must be configured otherwise.
 * - User must have be/done one of the following:
     1. Bot Owner
     2. Server Owner
     3. Created the server configuration, AND allowed themself to reset server configuration whenever they want
     4. In server with ADMINISTRATOR permission
     5. Less than 5 members in server (Does not include Bot)
 * - Bot must have the necessary ADMINISTRATOR permissions
 * 
 * @param interaction The interaction object
 * @param guild The guild object, fetched from the interaction
 * @returns {boolean} Whether the user has the necessary permissions to configure the server
 */
async function checkPermissions(interaction: ChatInputCommandInteraction, guild: Guild): Promise<boolean> {
    const guildConfiguration = await GuildModel.findOne({ guildID: guild.id });
    const hasConfiguredGuild = guildConfiguration !== null;

    if (interaction.options.getSubcommand() === "init" && hasConfiguredGuild) {
        await interaction.reply({ content: 'This server has already been configured.', ephemeral: false });
        return false;
    } else if (interaction.options.getSubcommand() !== "init" && !hasConfiguredGuild) {
        await interaction.reply({ content: 'This server does not have a proper configuration.', ephemeral: false });
        return false;
    }

    const isUserBotOwner = interaction.user.id === settings.discord.botOwnerID;
    const isServerOwner = guild.ownerId === interaction.user.id;
    const allowResetConfig = guildConfiguration?.emergencyOptions.allowResetConfig ?? false;
    const isAdmin = (interaction.member as GuildMember | null)?.permissions.has(PermissionsBitField.Flags.Administrator) ?? false;
    const memberCount = guild.memberCount;

    if (!(isUserBotOwner || isServerOwner || allowResetConfig || isAdmin || memberCount <= settings.discord.maxMemberFreeConfigCount)) {
        await interaction.reply({
            content: 'You do not have the necessary permissions to configure this server.',
            ephemeral: true
        });
        return false;
    }

    // Check if bot is server owner or has ADMINISTRATOR permissions
    const isBotOwner = guild.ownerId === interaction.client.user.id;
    const isBotAdmin = isBotOwner || (interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.Administrator) ?? false);

    if (!isBotAdmin) {
        await interaction.reply({
            content: 'I do not have the necessary permissions to configure this server.',
            ephemeral: false
        });
        return false;
    }

    return true;
}

export { data, execute };