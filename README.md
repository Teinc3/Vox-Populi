# Vox-Populi
A democracy-simulating Discord bot in a server.

## Political Structure
When creating a new server, three political systems can be chosen: Presidential, Parliamentary and Direct Democracy.
These systems are similar except the election process.

See [Political Structure](docs/politicalStructure) for more detailed information.

## Ownership
The bot should ideally own the server.
However, bots cannot create new guilds if they are in more than 10 servers.
So we will have to think of a way to work around this.

## Technologies
- Typescript
- Discord.js
- MongoDB
- Typegoose

## Existing Bugs
None for now

## TODO
### Active
- Refactor extended schemas using mongoose discriminators (for options, maybe we can implement multiple interfaces which include the corresponding properties?)
  - Ticket Collector, Vote Collector extends Base Collector?
  - Ticket Channel (Only TicketOptionsCollector), Political Channel (TicketCollector, VoteCollector), LogsChannel extends Abstract channel

### Future
- Add voting system
- Protect Categories permissions
- Add command to view logs

### Wont Fix
- Rework positioning of roles and channels (Can be changed by Executive Order)