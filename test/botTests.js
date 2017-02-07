var chai = require('chai');
var assert = chai.assert;    // Using Assert style
var expect = chai.expect;    // Using Expect style
var should = chai.should();  // Using Should style

var Spam = require('../src/spam.js');

var commentsOutput = [];
var disabledTimer = function(callback, time) {};

function addComment(authorName, authorId, date, commentId, text) {
    commentsOutput.unshift({
        authorName: authorName,
        authorId: authorId,
        date: date,
        commentId: commentId,
        text: text
    });
}

// Return a date in the past
function getDate(time = 0) {
    var date = new Date();

    date.setTime(date.getTime() - time);

    return date;
}

function delay(callback) {
    setTimeout(callback, 1);
}

var group = {
    getAllComments: (from, count, callback) => {
        callback(null, commentsOutput);
    }
};

var config = {
    name: '',
    password: '',
    groupid: '',
    spamTimeLimit: 5,
    spamHistoryLimit: 3600,
    spamCountLimit: 4,
    spamMessageDiff: 10,
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
            addComment("Master J", 0, getDate(), 1, 'Spam message <a href="localhost">link</a>');

            spam.detectSpam();

            assert.equal(Object.keys(spam.commentsDB).length, 1);
            done();

        });

        it('should add comments in the spamDB when both are identical', (done) => {
            addComment("Master J", "MasterJibus", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Master J", "MasterJibus", getDate(), 2, 'Spam message <a href="localhost">link</a>');

            spam.detectSpam();

            assert.equal(spam.spamDB.length, 1);
            assert.equal(spam.spamDB[0].length, 2);
            done();

        });

        it('should not add comments in the spamDB when both aren\'t identical', (done) => {
            addComment("Master J", "MasterJibus", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Master J", "MasterJibus", getDate(), 2, 'Test comment with a <a href="localhost">link</a>');

            spam.detectSpam();

            assert.equal(spam.spamDB.length, 0);
            done();

        });
    });
});