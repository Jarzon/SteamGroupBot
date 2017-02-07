module.exports = {
    name: '',
    password: '', // I don't recommend putting your password here, even more if you didn't enable 2 factors authentication
    groupid: '',
    spamTimeLimit: 5, // time between messages to be considered as spamming
    spamHistoryLimit: 3600, // Time before the comments are removed from the database in minutes
    spamCountLimit: 4, // Minimal number of message
    spamMessageDiff: 10, // Maximum number of letters that can differ between two comments to consider them as the same spam message
    spamLookRate: 5000 // How often we are getting comments from steam
};