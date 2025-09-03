import { getModelForClass, modelOptions, prop, type Ref } from "@typegoose/typegoose";

import type AbstractChannel from "../channels/AbstractChannel.js";

import type { CollectorType, DefaultInteractionData, PayloadCreationFunction, PayloadInterface } from "../../types/collector.js";
import { APIEmbed, ActionRowData, ButtonStyle, Colors, ComponentType, MessageActionRowComponentData } from "discord.js";
import { TicketType } from "../../types/events.js";

/**
 * Base collector schema for storing collector objects
 */
@modelOptions({
    schemaOptions: {
        collection: "collectors",
        discriminatorKey: "type"
    }
})
class BaseCollector<GenericRecipe extends DefaultInteractionData>
    implements PayloadCreationFunction<GenericRecipe> {
        
    public type!: CollectorType;

    @prop({ required: true, ref: () => 'PoliticalChannel' })
    public channel: Ref<AbstractChannel>;

    // May not exist when the object is first created
    @prop({ unique: true })
    public messageID?: string;

    @prop()
    public serializedPayload!: string;

    @prop({ default: true, required: true })
    public shouldPin!: boolean;

    constructor(channelRef: Ref<AbstractChannel>, payloadRecipe: GenericRecipe) {
        this.channel = channelRef;
        const payload = this.createPayload(payloadRecipe);
        this.serializePayload(payload);
    }

    static async deleteCollectorDocuments<GenericRecipe extends DefaultInteractionData>(
        ticketCollectors: Ref<BaseCollector<GenericRecipe>>[]
    ) {
        await BaseCollectorModel.deleteMany({ _id: { $in: ticketCollectors } });
    }

    createPayload(payloadRecipe: GenericRecipe): PayloadInterface {
        const embed: APIEmbed = {
            title: payloadRecipe.title,
            description: payloadRecipe.description,
            color: Colors[payloadRecipe.color ?? 'Blurple']
        }

        const actionRow: ActionRowData<MessageActionRowComponentData> = {
            components: payloadRecipe.options.map(option => ({
                type: ComponentType.Button,
                customId: TicketType[option.type],
                label: option.label,
                style: ButtonStyle[option.style],
                emoji: option.emoji
            })),
            type: ComponentType.ActionRow
        }

        return {
            embeds: [embed],
            components: [actionRow]
        };
    }

    serializePayload(payload: PayloadInterface) {
        this.serializedPayload = JSON.stringify(payload);
    }

    deserializePayload(): PayloadInterface {
        return JSON.parse(this.serializedPayload);
    }
}

const BaseCollectorModel = getModelForClass(BaseCollector);

export default BaseCollector;
export { BaseCollectorModel };
