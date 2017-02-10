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

    date.setTime(date.getTime() - time * 1000);

    return date;
}

function delay(callback) {
    setTimeout(callback, 1);
}

class GroupMock
{
    constructor()
    {
        this.deleted = [];
    }

    getAllComments(from, count, callback)
    {
        callback(null, commentsOutput);
    }

    deleteComment(cid, callback)
    {
        this.deleted.push(cid);
    }

    getDeleted()
    {
        var output = this.deleted;
        this.deleted = [];
        return output;
    }
}

var group = new GroupMock();

var config = {
    spamTimeLimit: 5,
    spamHistoryLimit: 360,
    spamCountLimit: 2,
    spamMessageDiff: 10,
    spamLookRate: 0
};
var spam;

beforeEach(() => {
    commentsOutput = [];

    spam = new Spam(config, group, disabledTimer);
});

describe('Spam', () => {
    describe('#getGroupComments()', () => {

        it('should add a comment with a link in commentsDB', (done) => {
            addComment("Master J", 0, getDate(), 1, 'Spam message <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(Object.keys(spam.commentsDB).length, 1);
            done();

        });

        it('should add comments in the spamDB when both are similar', (done) => {
            addComment("Master J", "MasterJibus", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Master J", "MasterJibus", getDate(), 2, 'Spam message <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.spamDB.length, 1);
            assert.equal(spam.spamDB[0].length, 2);
            done();

        });

        it('should not add comments in the spamDB when both aren\'t similar', (done) => {
            addComment("Master J", "MasterJibus", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Master J", "MasterJibus", getDate(), 2, 'Test comment with a <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.spamDB.length, 0);
            done();

        });

        it('should add a similar comment in a existing spam group', (done) => {
            addComment("Master J", "MasterJibus", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Master J", "MasterJibus", getDate(), 2, 'Spam message <a href="localhost">link</a> 2');

            addComment("Master J", "MasterJibus", getDate(), 3, 'Spam message <a href="localhost">link</a> 3');

            spam.getGroupComments();

            assert.equal(spam.spamDB.length, 1);
            assert.equal(spam.spamDB[0].length, 3);
            done();

        });
    });

    describe('#clearComments()', () => {
        it('should delete comments that are too old', (done) => {
            var old = config.spamHistoryLimit + 10;

            addComment("Master J", "MasterJibus", getDate(old), 1, 'Lorem ipsum dolor sit amet, <a href="localhost">link</a>');
            addComment("Master J", "MasterJibus", getDate(old), 2, 'pri falli corrumpit ullamcorper id <a href="localhost">link</a>');

            addComment("Master J", "MasterJibus", getDate(), 3, 'graece invidunt ex mel. <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(Object.keys(spam.commentsDB).length, 3);

            spam.clearComments();

            assert.equal(Object.keys(spam.commentsDB).length, 1);
            done();

        });
    });

    describe('#spamAction()', () => {
        it('should delete spam comments that are within the config time span range', (done) => {
            addComment("Master J", "MasterJibus", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Master J", "MasterJibus", getDate(), 2, 'Spam message <a href="localhost">link</a> 2');

            addComment("Master J", "MasterJibus", getDate(), 3, 'Spam message <a href="localhost">link</a> 3');

            spam.getGroupComments();

            assert.equal(spam.spamDB.length, 1);
            assert.equal(spam.spamDB[0].length, 3);

            spam.spamAction();

            var deleted = group.getDeleted();

            assert.equal(deleted[0], 1);
            assert.equal(deleted[1], 2);
            assert.equal(deleted[2], 3);

            done();

        });
    });
});