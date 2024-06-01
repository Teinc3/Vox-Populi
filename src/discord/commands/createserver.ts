import { SlashCommandBuilder, type TextChannel, type CommandInteraction, ChannelType } from "discord.js";

const data = new SlashCommandBuilder()
    .setName('createserver')
    .setDescription('Creates a new server with the Bot as owner and gives you the invite link.')
    .addStringOption((option) => {
        option.setName('name')
            .setDescription('The name of the server you want the bot to create.')
            .setRequired(true);
        return option;
    })

async function execute(interaction: CommandInteraction) {
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const guild = await interaction.client.guilds.create({ name: interaction.options.get('name')!.value as string });
        if (guild === null) {
            throw new Error();
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
        }

    } catch (err) {
        console.error(err);
        await interaction.followUp({ content: "Failed to create server.", ephemeral: true });
    }
}

export { data, execute }