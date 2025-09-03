import { getDiscriminatorModelForClass } from "@typegoose/typegoose";

import BaseCollector, { BaseCollectorModel } from "./BaseCollector.js";

import type { DefaultInteractionData } from "../../types/collector.js";


interface PayloadRecipe extends DefaultInteractionData {}

/**
 * Collector storing options in a Ticket channel
 * 
 * @class
 * @extends BaseCollector 
 */
class TicketOptionsCollector extends BaseCollector<PayloadRecipe> {}

const TicketOptionsCollectorModel = getDiscriminatorModelForClass(BaseCollectorModel, TicketOptionsCollector);

export default TicketOptionsCollector;
export { TicketOptionsCollectorModel };