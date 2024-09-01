import EventModel from '../schema/Event';

import type DiscordManager from './DiscordManager';

import settings from '../data/settings.json' assert { type: "json" };

const { eventLoopInterval } = settings.discord;

class EventHandler {
    private discordManager: DiscordManager;

    constructor(discordManager: DiscordManager) {
        this.discordManager = discordManager;

        this.initiateEventLoop();
    }

    private initiateEventLoop() {
        setInterval(async () => {
            // Query eventschema by with property completed false and dueDate less than current, sort by ascending
            const events = await EventModel.find({ completed: false, dueDate: { $lt: new Date() } }).sort({ dueDate: 1 });
            for (const event of events) {
                // Handle event
            }

            // Query MessageCollectors to check if any messages have been modified/deleted/etc.
        }, eventLoopInterval);
    }
}

export default EventHandler;