module.exports = {
    name: '',
    password: '',
    groupid: '',
    spamTimeLimit: 360, // time, in seconds, between messages to be considered as spamming
    spamHistoryLimit: 1800, // Time, in seconds, before the comments are removed from the database in minutes
    spamCountLimit: 4, // Minimal number of message to count as spam
    spamMessageDiff: 10, // Maximum number of letters that can differ between two comments to consider them as the same spam message
    spamLookRate: 60 // How often, in seconds, we are getting comments from Steam
};