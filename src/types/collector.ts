import type {
  APIEmbed, ActionRowData, ButtonStyle, Colors, MessageActionRowComponentData, MessageCreateOptions
} from "discord.js";
import type { TicketType } from "./events.js";


export interface PayloadInterface extends MessageCreateOptions {
  embeds: Array<APIEmbed>;
  components: Array<ActionRowData<MessageActionRowComponentData>>;
}

export interface PayloadCreationFunction<PayloadRecipe> {
  createPayload(payloadRecipe: PayloadRecipe): PayloadInterface;
}

export enum CollectorType {
  Vote = "Vote",
  Ticket = "Ticket",
  TicketOptions = "TicketOptions"
}

export interface DefaultInteractionData {
  title: string;
  description: string;
  color?: keyof typeof Colors;
  options: DefaultInteractionButtonData[];
}

export interface DefaultInteractionButtonData {
  type: keyof typeof TicketType;
  style: Exclude<keyof typeof ButtonStyle, "Link">;
  label: string;
  emoji: string;
}