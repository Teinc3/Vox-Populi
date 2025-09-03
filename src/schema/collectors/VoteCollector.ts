import BaseCollector, { BaseCollectorModel } from "./BaseCollector.js";

import { CollectorType, type DefaultInteractionData, type PayloadInterface } from "../../types/collector.js";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";

/**
 * Vote Collector schema for storing vote collector objects
 * 
 * @class
 * @extends BaseCollector
 */
class VoteCollector extends BaseCollector<DefaultInteractionData> {
    type = CollectorType.Vote;

    async createVoteCollectorDocument() {
        throw new Error("Method not implemented.");
    }

    async checkLinkDiscordVoteCollector() {
        throw new Error("Method not implemented.");
    }
}

const VoteCollectorModel = getDiscriminatorModelForClass(BaseCollectorModel, VoteCollector, CollectorType.Vote);

export default VoteCollector;
export { VoteCollectorModel };