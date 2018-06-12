# Steam Group Bot

A bot to moderate a Steam group.

For now it delete spam comments in the group homepage, it won't ban users nor moderate group discussions. It can detects spam even if the spammer change come characters to try to bypass detection.

## Installation

### Application

The app is made using [Nw.js](https://nwjs.io/). You can [download the latest build](https://github.com/Jarzon/SteamGroupBot/releases/download/v1.0.0-alpha/SGBot.zip).

### CLI

If you only want to use it in the command line you can get the latest version, with it dependencies, using npm.

    npm install steamgroupbot

Then manually edit config.js to fit your needs and launch the bot using `node cli.js`.