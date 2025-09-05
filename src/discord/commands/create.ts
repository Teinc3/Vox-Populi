import {
  SlashCommandBuilder, ChannelType,
  type TextChannel, type ChatInputCommandInteraction
} from "discord.js";


const data = new SlashCommandBuilder()
  .setName('create')
  .setDescription('Creates a new server with the Bot as owner and gives you the invite link.')
  .setDMPermission(true)
  .addStringOption(option => {
    option.setName('name')
      .setDescription('The name of the server you want the bot to create.')
      .setRequired(true);
    return option;
  })

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = await interaction.client.guilds.create({
    name: interaction.options.get('name')!.value as string
  });
  if (interaction.member === null) {
    return await interaction.followUp({
      content: 'Error: Could not fetch member data.',
      ephemeral: false
    });
  }

  await guild.fetch();
  await guild.channels.fetch();

  const inviteChannel = guild.channels.cache
    .find(channel => channel.type === ChannelType.GuildText) as TextChannel;
  const invite = await inviteChannel.createInvite({ maxAge: 0, maxUses: 0 });

  if (!invite) {
    await interaction.followUp({ content: "Failed to create invite.", ephemeral: true });
    // Delete the server
    await guild.delete();
  } else {
    await interaction.followUp({
      content: `Server created! Invite link: ${invite.url}`,
      ephemeral: true
    });
  }
}

export { data, execute };