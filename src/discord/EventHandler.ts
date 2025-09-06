
import EventGuard from '../types/typeguards/events.ts';
import { PoliticalEventType, AppointmentDetails } from '../types/events.ts';
import EventModel, { type EventSchema } from '../schema/events/Event.ts';
import TicketCollectorModel from '../schema/collectors/TicketCollector.ts';
import settings from '../data/settings.json' with { type: "json" };

import type { DocumentType } from '@typegoose/typegoose';
import type DiscordManager from './DiscordManager.ts';


const { eventLoopInterval } = settings.discord;

class EventHandler {
  private discordManager: DiscordManager;

  constructor(discordManager: DiscordManager) {
    this.discordManager = discordManager;
  }

  public init() {
    // Start EventLoop
    setTimeout(() => this.checkEvents(), 0);
    setInterval(() => this.checkEvents(), eventLoopInterval);
  }

  public async checkEvents() {
    // Query eventschema by with property completed false and dueDate 
    // less than current, then sort by ascending
    const events = await EventModel
      .find({ completed: false, dueDate: { $lt: new Date() } })
      .sort({ dueDate: 1 });
    for (const event of events) {
      try {
        switch (event.type) {
          case PoliticalEventType.Appointment:
            await this.handleAppointmentEvent(event);
            break;
          case PoliticalEventType.Vote:
          case PoliticalEventType.CourtCase:
          case PoliticalEventType.Proposal:
          case PoliticalEventType.ExecutiveOrder:
            console.log(`Event type "${event.type}" not implemented yet.`);
            event.completed = true;
            await event.save();
            break;
          default:
            console.log(`Unknown event type: ${(event as EventSchema).type}`);
            event.completed = true;
            await event.save();
        }
      } catch (error) {
        console.error(`Error handling event ${event.id}:`, error);
      }
    }

    // Query TicketCollectors to check if any messages have been modified/deleted/etc.
    const ticketCollectors = await TicketCollectorModel.find();
    for (const ticketCollector of ticketCollectors) {
      ticketCollector.checkLinkDiscordTicketCollector(
        this.discordManager.client,
        'Restoring Ticket Collector Message'
      );
    }
  }

  private async handleAppointmentEvent(event: DocumentType<EventSchema>) {
    if (!EventGuard.isAppointment(event)) {
      return;
    }

    const { guildID, options } = event;
    const guild = await this.discordManager.client.guilds.fetch(guildID);
    if (!guild) {
      console.error(`Guild ${guildID} not found for appointment event ${event.id}`);
      return;
    }

    const member = await guild.members.fetch(options.userID);
    if (!member) {
      console.error(`Member ${options.userID} not found for appointment event ${event.id}`);
      return;
    }

    const politicalRole = member.roles.cache.find(
      role => role.id === options.role.toString(),
    );
    if (!politicalRole) {
      console.error(`Role ${options.role} not found for appointment event ${event.id}`);
      return;
    }

    switch (options.details) {
      case AppointmentDetails.Elected:
      case AppointmentDetails.Promoted:
        await member.roles.add(politicalRole);
        break;
      case AppointmentDetails.Impeached:
      case AppointmentDetails.Demoted:
      case AppointmentDetails.TermEnd:
      case AppointmentDetails.Resigned:
        await member.roles.remove(politicalRole);
        break;
    }

    event.completed = true;
    await event.save();

    // TODO: Log this action in a log channel if configured
  }
}

export default EventHandler;
