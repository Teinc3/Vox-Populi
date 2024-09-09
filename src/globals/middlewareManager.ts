import type ExtendedClient from "../discord/ExtendedClient";
import { EventSchema } from "../schema/events/Event.js";

class MiddlewareManager {
    private client!: ExtendedClient;

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

const middlewareManager = new MiddlewareManager();

export default middlewareManager;