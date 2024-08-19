# Permissions

Vox Populi uses its own set of permissions to manage the bot's access to the server.
These permissions are simplified versions of Discord's permissions to reduce complexity of the code, and similar permissions in Discord are grouped together.

## Bot Permissions

The bot's own set of permissions are simplified into the following categories:
### View (Universal)
#### Non-Overridable
- Create Invite (1 << 0)
- View Audit Log (1 << 7)
- View Server Insights (1 << 19)
- Change Nickname (1 << 26)

#### Overridable
- View Channels (1 << 10)
- Read Message History (1 << 16)
- Connect (1 << 20)

### Send - Overridable
- Send Messages (1 << 11)
- Speak (1 << 21)

### Interact - Overridable
- Add Reactions (1 << 6)
- Stream (1 << 9)
- Embed Links (1 << 14)
- Attach Files (1 << 15)
- Use External Emojis (1 << 18)
- Use Voice Activity (1 << 25)
- Use Application Commands (1 << 31)
- Request to Speak (1 << 32)
- Create Public Threads (1 << 35)
- Create Private Threads (1 << 36)
- Use External Stickers (1 << 37)
- Send Messages in Threads (1 << 38)
- Use Activities (1 << 39)
- Use Soundboard (1 << 42)
- Use External Sounds (1 << 45)
- Send Voice Messages (1 << 46)
- Create Polls (1 << 49)
- Use External Apps (1 << 50)

### Moderate - Overridable
- Kick Members (1 << 1)
- Ban Members (1 << 2)
- Priority Speaker (1 << 8)
- Manage Messages (1 << 13)
- Mute Members (1 << 22)
- Deafen Members (1 << 23)
- Move Members (1 << 24)
- Manage Nicknames (1 << 27)
- Manage Threads (1 << 34)
- Timeout Members (1 << 40)

### Manage
#### Non-Overridable
- Manage Expressions (1 << 30)
- Manage Events (1 << 33)
- Manage Monetization (1 << 41)
- Create Expressions (1 << 43)
- Create Events (1 << 44)

#### Overridable
- Manage Channels (1 << 4)
- Send TTS Messages (1 << 12)
- Mention Everyone (1 << 17)
- Manage Roles (1 << 28)
- Manage Webhooks (1 << 29)

### Emergency (VoxPopuli) - Non-Overridable
- Administrator (1 << 3)
- Manage Server (1 << 5)

## Base Permissions

Every role in Discord has a set of base permissions that allow it to perform certain actions in all channels without channel overrides.

The following list shows base permissions for each role:
- Vox Populi: Emergency
- President/Prime Minister: Manage, Moderate
- Head Moderator/Moderator: Moderate
- Citizen: Interact
- @everyone (Undocumented): Send, View

Note that all officials must have the Citizen role, and therefore, access to all base permissions below them.

## Channel Permission Overrides