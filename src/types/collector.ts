import type { APIEmbed, ActionRowData, MessageActionRowComponentData, MessageCreateOptions } from "discord.js";


export interface PayloadInterface extends MessageCreateOptions {
    embeds: Array<APIEmbed>;
    components: Array<ActionRowData<MessageActionRowComponentData>>;
}

export interface PayloadCreationFunction<PayloadRecipe> {
    createPayload(payloadRecipe: PayloadRecipe): PayloadInterface;
}