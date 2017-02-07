var assert = require('assert');
var Spam = require('../src/spam.js');

var commentsOutput = {};

function addComment(authorName, authorId, date, commentId, text) {
    commentsOutput[commentId] = {
        authorName: authorName,
        authorId: authorId,
        date: date,
        commentId: commentId,
        text: text
    };
}

var group = {};
group.getAllComments = (from, count, callback) => {
    return callback(null, commentsOutput);
};

var config = {
    name: '',
    password: '', // I don't recommend putting your password here, even more if you didn't enable 2 factors authentication
    groupid: '',
    spamTimeLimit: 5, // time between messages to be considered as spamming
    spamHistoryLimit: 3600, // Time before the comments are removed from the database in minutes
    spamCountLimit: 4, // Minimal number of message
    spamMessageDiff: 10, // Maximum number of letters that can differ between two comments to consider them as the same spam message
    spamLookRate: 1
};

beforeEach(() => {
    commentsOutput = {};
});

describe('Spam', () => {
    describe('#loop()', () => {

        var spam = new Spam(config, group);

        it('should ', (done) => {
            addComment("Master J", "0", new Date(), 123, "Spam message");

            spam.loop();

            setTimeout(() => {


                assert.equal(spam.commentsDB, 1);
                done();

            }, 20);
        });
    });
});