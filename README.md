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

## Current Bugs
Not checked for latest commit.

## TODO
### Active
- Ability to link an existing channel during setup (At the end of the wizard config we list out all channels and user can cursor over and select the channel, and decide to link it or create a new one. Also write in footer that can change name after setup)
- Rework positioning of roles and channels

### Future
- Add logging and command to view logs
- Add voting system

### Wont Fix
- Simplify redundant code in Initialization Wizard
- Add more JSDocs to schema files