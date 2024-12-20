import { getDiscriminatorModelForClass } from "@typegoose/typegoose";

import BaseCollector, { BaseCollectorModel } from "./BaseCollector.js";

type PayloadRecipe = any;

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