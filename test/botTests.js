var chai = require('chai');
var assert = chai.assert;    // Using Assert style
var expect = chai.expect;    // Using Expect style
var should = chai.should();  // Using Should style

var Spam = require('../src/spam.js');

var commentsOutput = [];
var disabledTimer = function(callback, time) {};

function addComment(authorName, authorId, date, commentId, text) {
    commentsOutput.push({
        authorName: authorName,
        authorId: authorId,
        date: date,
        commentId: commentId,
        text: text
    });
}

function delay(callback) {
    setTimeout(callback, 5);
}

var group = {
    getAllComments: (from, count, callback) => {
        callback(null, commentsOutput);
    }
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
var spam;

beforeEach(() => {
    commentsOutput = [];

    spam = new Spam(config, group, disabledTimer);
});

describe('Spam', () => {
    describe('#loop()', () => {

        it('should add a comment with a link in commentsDB', (done) => {
            addComment("Master J", 0, new Date(), 123, 'Spam message <a href="asdf">link</a>');

            spam.detectSpam();

            delay(() => {
                assert.equal(Object.keys(spam.commentsDB).length, 1);
                done();
            });
        });
    });
});