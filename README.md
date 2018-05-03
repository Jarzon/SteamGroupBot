# Steam Group Bot

A bot to moderate a steam group.

For now it only delete spam comments in the group homepage. It can detects spam even if the spammer change a few characters to bypass it.

### TODO
- Add an option to delete only the spam message with an external link (that would target the most common spam posted by bots with phishing links)
- Delete only the latest spam message
- Ban the user if he reach a limit of deleted messages
- Add a timed limit rate for spam message (useful for trading groups)

## Installation

Install the dependencies with npm

    npm update

Then edit config.js to fit your needs.