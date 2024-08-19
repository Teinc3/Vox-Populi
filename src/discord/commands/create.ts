import { SlashCommandBuilder, type TextChannel, type ChatInputCommandInteraction, ChannelType } from "discord.js";
import { progressivePermissionsAllocator } from "../../schema/roles/PoliticalRole.js";
import { PermissionsLevel } from "../../types/permissions.js";

const data = new SlashCommandBuilder()
    .setName('create')
    .setDescription('Creates a new server with the Bot as owner and gives you the invite link.')
    .setDMPermission(true)
    .addStringOption((option) => {
        option.setName('name')
            .setDescription('The name of the server you want the bot to create.')
            .setRequired(true);
        return option;
    })

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = await interaction.client.guilds.create({ name: interaction.options.get('name')!.value as string });
    if (guild === null) {
        await interaction.followUp({ content: "Failed to create server.", ephemeral: true });
    }

    await guild.fetch();
    await guild.channels.fetch();

    const inviteChannel = guild.channels.cache.find(channel => channel.type === ChannelType.GuildText) as TextChannel;
    const invite = await inviteChannel.createInvite({ maxAge: 0, maxUses: 0 });

    if (!invite) {
        await interaction.followUp({ content: "Failed to create invite.", ephemeral: true });
        // Delete the server
        await guild.delete();
    } else {
        await interaction.followUp({ content: `Server created! Invite link: ${invite.url}`, ephemeral: true });

        // Set everyone's permissions
        const everyoneRole = guild.roles.cache.find(role => role.id === guild.id);
        if (everyoneRole) {
            await everyoneRole.setPermissions(progressivePermissionsAllocator(PermissionsLevel.Send));
        }
    }
}

export { data, execute }