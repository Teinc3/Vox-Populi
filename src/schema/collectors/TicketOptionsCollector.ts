import { getDiscriminatorModelForClass } from "@typegoose/typegoose";

import { CollectorType, type DefaultInteractionData } from "../../types/collector.js";
import BaseCollector, { BaseCollectorModel } from "./BaseCollector.js";


interface PayloadRecipe extends DefaultInteractionData {}

/**
 * Collector storing options in a Ticket channel
 * 
 * @class
 * @extends BaseCollector 
 */
class TicketOptionsCollector extends BaseCollector<PayloadRecipe> {
  type = CollectorType.TicketOptions;
}

const TicketOptionsCollectorModel = getDiscriminatorModelForClass(
  BaseCollectorModel,
  TicketOptionsCollector,
  CollectorType.TicketOptions
);

export default TicketOptionsCollector;
export { TicketOptionsCollectorModel };