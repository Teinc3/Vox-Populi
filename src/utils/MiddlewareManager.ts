import type ExtendedClient from "../discord/ExtendedClient.js";


/**
 * Singleton class for managing middleware.
 * 
 * This can be put in globals if there are more middleware to manage (For now in utils).
 */
class MiddlewareManager {
  private client!: ExtendedClient;

  public setClient(client: ExtendedClient) {
    this.client = client;
  }

  public getClient() {
    return this.client;
  }
}

const middlewareManager = new MiddlewareManager();

export { MiddlewareManager, middlewareManager as default };