import EventModel from '../schema/Event.js';

import type DiscordManager from './DiscordManager.js';

import settings from '../data/settings.json' assert { type: "json" };
import TicketCollectorModel from '../schema/TicketCollector.js';

const { eventLoopInterval } = settings.discord;

class EventHandler {
    private discordManager: DiscordManager;

    constructor(discordManager: DiscordManager) {
        this.discordManager = discordManager;
    }

    public initiateEventLoop() {
        this.checkEvents();
        setInterval(() => this.checkEvents(), eventLoopInterval);
    }

    public async checkEvents() {
        // Query eventschema by with property completed false and dueDate less than current, sort by ascending
        const events = await EventModel.find({ completed: false, dueDate: { $lt: new Date() } }).sort({ dueDate: 1 });
        for (const event of events) {
            // Handle event
        }

        // Query TicketCollectors to check if any messages have been modified/deleted/etc.
        const ticketCollectors = await TicketCollectorModel.find();
        for (const ticketCollector of ticketCollectors) {
            ticketCollector.checkLinkDiscordTicketCollector(this.discordManager.client, 'Restoring Ticket Collector Message');
        }
    }
}

export default EventHandler;