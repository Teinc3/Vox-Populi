import type ExtendedClient from "../discord/ExtendedClient.js";
import { EventSchema } from "../schema/events/Event.js";

/**
 * Singleton class for managing middleware.
 * 
 * This can be put in globals if there are more middleware to manage (For now in utils).
 */
class MiddlewareManager {
    private static instance: MiddlewareManager;
    private client!: ExtendedClient;

    constructor() {
        // Make sure singleton
        if (MiddlewareManager.instance) {
            return MiddlewareManager.instance;
        }
    }

    public setClient(client: ExtendedClient) {
        this.client = client;
    }

    public getClient() {
        return this.client;
    }

    public createEventMiddleware() {
        return EventSchema.obtainEventMiddleware();
    }
}

export default MiddlewareManager;