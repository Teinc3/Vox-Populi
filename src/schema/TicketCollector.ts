import { prop, getModelForClass, type Ref } from '@typegoose/typegoose';
import { 
    MessageActionRowComponentData, ActionRowData, ButtonStyle, ChannelType, Colors, ComponentType, TextChannel,
    type APIEmbed, type ButtonInteraction, type Message, type MessageCreateOptions,
    MessageType
} from 'discord.js';

import ExtendedClient from '../discord/ExtendedClient.js';
import PoliticalChannel, { PoliticalChannelModel } from './channels/PoliticalChannel.js';

import { TicketType } from '../types/types.js';
import { DefaultTicketData } from '../types/wizard.js';

class TicketCollectorPayload implements MessageCreateOptions {
    public embeds!: Array<APIEmbed>;
    public components!: Array<ActionRowData<MessageActionRowComponentData>>;
}

class TicketCollector {
    @prop({ required: true, ref: () => 'PoliticalChannel' })
    public channel!: Ref<PoliticalChannel>;

    // May not exist when the object is first created
    @prop()
    public messageID?: string;

    @prop()
    public serializedPayload!: string;

    @prop({ default: true, required: true })
    public shouldPin!: boolean;

    constructor(channelRef: Ref<PoliticalChannel>, defaultTicketData: DefaultTicketData) {
        this.channel = channelRef;
        this.createPayload(defaultTicketData);
    }

    static async deleteTicketCollectorDocuments(ticketCollectors: Ref<TicketCollector>[]) {
        await TicketCollectorModel.deleteMany({ _id: { $in: ticketCollectors } });
    }

    createPayload(defaultTicketData: DefaultTicketData) {
        const embed: APIEmbed = {
            title: defaultTicketData.title,
            description: defaultTicketData.description,
            color: Colors[defaultTicketData.color ?? 'Blurple']
        }

        const actionRow: ActionRowData<MessageActionRowComponentData> = {
            components: defaultTicketData.options.map(option => ({
                type: ComponentType.Button,
                customId: TicketType[option.type],
                label: option.label,
                style: ButtonStyle[option.style],
                emoji: option.emoji
            })),
            type: ComponentType.ActionRow
        }

        this.serializedPayload = JSON.stringify({
            embeds: [embed],
            components: [actionRow]
        });
    }

    deserializePayload(): TicketCollectorPayload {
        return JSON.parse(this.serializedPayload) as TicketCollectorPayload;
    }

    async createTicketCollectorDocument(): Promise<Ref<TicketCollector>> {
        return await TicketCollectorModel.create(this);
    }

    /**
     * Overload 1: discordChannel (TextChannel), reason?
     * 
     * @param discordChannel 
     * @param reason 
     */
    async checkLinkDiscordTicketCollector(discordChannel: TextChannel, reason?: string): Promise<boolean>;
    /**
     * Overload 2: client (ExtendedClient), reason?
     * 
     * @param client 
     * @param reason 
     */
    async checkLinkDiscordTicketCollector(client: ExtendedClient, reason?: string): Promise<boolean>;
    async checkLinkDiscordTicketCollector(arg1: TextChannel | ExtendedClient, reason?: string): Promise<boolean> {
        // find PoliticalChannel
        const channelDocument = await PoliticalChannelModel.findById(this.channel);
        if (!channelDocument?.channelID) {
            // Channel doesn't exist, we can't do shit
            return false;
        }

        // Fetch the channel, if its the wrong type, we can't do anything.
        const discordChannel = arg1 instanceof ExtendedClient ? await arg1.channels.fetch(channelDocument.channelID) : arg1;
        if (!(discordChannel && discordChannel.type === ChannelType.GuildText)) {
            return false;
        }

        let discordMessage: Message<true> | undefined = undefined;

        if (this.messageID) {
            // Fetch the message
            discordMessage = await discordChannel.messages.fetch(this.messageID);
        }

        const payload = this.deserializePayload();

        // Fallback Options
        if (!discordMessage) {
            discordMessage = await discordChannel.send(payload)
            this.messageID = discordMessage.id;
        }
        if (discordMessage.flags.has('SuppressEmbeds')) {
            discordMessage.suppressEmbeds(false);
        }
        if (!discordMessage.pinned) {
            // Force async pinning to avoid race conditions
            setTimeout(() => discordMessage.pin(reason), 1E3);

            discordChannel.awaitMessages({
                filter: (m: Message) => m.type === MessageType.ChannelPinnedMessage && m.reference!.messageId === discordMessage.id,
                max: 1,
                time: 10E3
            })
                .then(pinnedMessages => pinnedMessages.first()?.delete())
                .catch(err => console.error(err));
        }
        return true;
    }

    async handleTicket(interaction: ButtonInteraction) {
        const customId = interaction.customId;
        // Handle button click
        switch (customId) {
            case TicketType.Inquiry:
                // Handle Inquiry
                break;
            case TicketType.Report:
                // Handle Report
                break;
            case TicketType.CourtCase:
                // Handle Suggestion
                break;
            case TicketType.Registration:
                // Handle Registration
                break;
            default:
                break;
        }
    }
}

const TicketCollectorModel = getModelForClass(TicketCollector);

export default TicketCollectorModel;
export { TicketCollector };