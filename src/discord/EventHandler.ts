import EventModel from '../schema/events/Event.ts';
import TicketCollectorModel from '../schema/collectors/TicketCollector.ts';
import settings from '../data/settings.json' with { type: "json" };

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
    for (const _event of events) {
      // Handle event
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
}

export default EventHandler;