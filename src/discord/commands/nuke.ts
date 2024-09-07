import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

const data = new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Nuke all channels and roles from the current server.')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const member = await guild.members.fetch(interaction.user.id);

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.followUp({ content: "You cannot use this command as you are not a server Administrator.", ephemeral: true });
        return;
    }

    await interaction.reply({ content: "Nuking server...", ephemeral: true });

    const channels = await guild.channels.fetch();
    const roles = await guild.roles.fetch();

    await Promise.all([
        ...channels.map(channel => channel && channel.deletable && channel.delete()),
        ...roles.map(role => role && role.id !== guild.id && role?.delete())
    ]);

    // Create a new role and channel after nuking
    const role = await guild.roles.create({
        name: 'Admin',
        permissions: PermissionFlagsBits.Administrator
    });
    member.roles.add(role);

    const newChannel = await guild.channels.create({ name: 'general', type: ChannelType.GuildText });
    if (newChannel) {
        await newChannel.send("Server has been nuked. You can now setup the server again.");
    }
}

export { data, execute };