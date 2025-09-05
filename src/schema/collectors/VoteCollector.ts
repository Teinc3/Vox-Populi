import { getDiscriminatorModelForClass } from "@typegoose/typegoose";

import { CollectorType, type DefaultInteractionData } from "../../types/collector.js";
import BaseCollector, { BaseCollectorModel } from "./BaseCollector.js";


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

const VoteCollectorModel = getDiscriminatorModelForClass(
  BaseCollectorModel,
  VoteCollector,
  CollectorType.Vote
);

export default VoteCollector;
export { VoteCollectorModel };