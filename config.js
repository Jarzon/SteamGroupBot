module.exports = {
    name: '', // Steam Username
    password: '', // Steam Password
    groupid: '', // Steam group id
    commentsHistoryLimit: 1800, // Limit of comments that are kept
    spamTimeLimit: 360, // Time, in seconds, between messages to be considered as spamming
    spamCountLimit: 4, // Minimal number of message to count as spam
    spamMessageDiff: 10, // Maximum number of letters that can differ between two comments to consider them as the same spam message
    spamLookRate: 60 // How often, in seconds, we are getting the group latest comments from Steam
};