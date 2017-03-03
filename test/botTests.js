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
    commentsHistoryLimit: 2,
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

        it('should add a comment with a link in comments', (done) => {
            addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.comments.size, 1);
            done();

        });

        it('should add comments in the spams when both are similar', (done) => {
            addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Name", "STEAMID", getDate(), 2, 'Spam message <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 1);
            assert.equal(spam.spams[0].length, 2);
            done();

        });

        it('should not add comments in the spams when both aren\'t similar', (done) => {
            addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Name", "STEAMID", getDate(), 2, 'Test comment with a <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 0);
            done();

        });

        it('should add a similar comment in a existing spam group', (done) => {
            addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Name", "STEAMID", getDate(), 2, 'Spam message <a href="localhost">link</a> 2');

            addComment("Name", "STEAMID", getDate(), 3, 'Spam message <a href="localhost">link</a> 3');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 1);
            assert.equal(spam.spams[0].length, 3);
            done();

        });
    });

    describe('#clearComments()', () => {
        it('should delete comments that are too old', (done) => {
            addComment("Name", "STEAMID", getDate(), 1, 'Lorem ipsum dolor sit amet, <a href="localhost">link</a>');
            addComment("Name", "STEAMID", getDate(), 2, 'pri falli corrumpit ullamcorper id <a href="localhost">link</a>');

            addComment("Name", "STEAMID", getDate(), 3, 'graece invidunt ex mel. <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.comments.size, 3);

            spam.clearComments();

            assert.equal(spam.comments.size, 2);
            done();
        });

        it('should delete spam db entries of old comments', (done) => {
            addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Name", "STEAMID", getDate(), 2, 'Spam message <a href="localhost">link</a> 2');

            addComment("Name", "STEAMID", getDate(), 3, 'Spam message <a href="localhost">link</a> 3');

            spam.getGroupComments();

            spam.clearComments();

            assert.equal(spam.comments.size, 3);

            assert.equal(spam.spams.length, 2);
            assert.equal(spam.spams[0].length, 1);

            done();

        });
    });

    describe('#spamAction()', () => {
        it('should delete spam comments that are within the config time span range', (done) => {
            addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            addComment("Name", "STEAMID", getDate(), 2, 'Spam message <a href="localhost">link</a> 2');

            addComment("Name", "STEAMID", getDate(), 3, 'Spam message <a href="localhost">link</a> 3');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 1);
            assert.equal(spam.spams[0].length, 3);

            spam.spamAction();

            var deleted = group.getDeleted();

            assert.equal(deleted[0], 1);
            assert.equal(deleted[1], 2);
            assert.equal(deleted[2], 3);

            done();

        });
    });
});