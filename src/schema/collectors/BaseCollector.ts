import { getModelForClass, modelOptions, prop, type Ref } from "@typegoose/typegoose";

import type AbstractChannel from "../channels/AbstractChannel.js";

import type { PayloadCreationFunction, PayloadInterface } from "../../types/collector.js";

/**
 * Base collector schema for storing collector objects
 */
@modelOptions({ schemaOptions: { collection: "collectors" } })
class BaseCollector<PayloadRecipe> implements PayloadCreationFunction<PayloadRecipe> {
    @prop({ required: true, ref: () => 'PoliticalChannel' })
    public channel: Ref<AbstractChannel>;

    // May not exist when the object is first created
    @prop({ unique: true })
    public messageID?: string;

    @prop()
    public serializedPayload!: string;

    @prop({ default: true, required: true })
    public shouldPin!: boolean;

    constructor(channelRef: Ref<AbstractChannel>, payloadRecipe: PayloadRecipe) {
        this.channel = channelRef;
        const payload = this.createPayload(payloadRecipe);
        this.serializePayload(payload);
    }

    static async deleteCollectorDocuments<PayloadRecipe>(ticketCollectors: Ref<BaseCollector<PayloadRecipe>>[]) {
        await BaseCollectorModel.deleteMany({ _id: { $in: ticketCollectors } });
    }

    createPayload(_payloadRecipe: PayloadRecipe): PayloadInterface {
        throw new Error("Abstract method not implemented.");
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
