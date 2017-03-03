var chai = require('chai');
var assert = chai.assert;    // Using Assert style
var expect = chai.expect;    // Using Expect style
var should = chai.should();  // Using Should style

var Spam = require('../src/spam.js');

var disabledTimer = function(callback, time) {};

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
        this.commentsOutput = [];
        this.deleted = [];
    }

    addComment(authorName, authorId, date, commentId, text) {
        this.commentsOutput.unshift({
            authorName: authorName,
            authorId: authorId,
            date: date,
            commentId: commentId,
            text: text
        });
    }

    getAllComments(from, count, callback)
    {
        callback(null, this.commentsOutput);
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

var spam, group;
var config = {
    spamTimeLimit: 5,
    commentsHistoryLimit: 2,
    spamCountLimit: 2,
    spamMessageDiff: 10,
    spamLookRate: 0
};

beforeEach(() => {
    group = new GroupMock();

    spam = new Spam(config, group, disabledTimer);
});

describe('Spam', () => {
    describe('#getGroupComments()', () => {

        it('should add a comment with a link in comments', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.comments.size, 1);
        });

        it('should add comments in the spams when both are similar', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            group.addComment("Name", "STEAMID", getDate(), 2, 'Spam message <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 1);
            assert.equal(spam.spams[0].length, 2);
        });

        it('should not add comments in the spams when both aren\'t similar', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            group.addComment("Name", "STEAMID", getDate(), 2, 'Test comment with a <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 0);
        });

        it('should add a similar comment in a existing spam group', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            group.addComment("Name", "STEAMID", getDate(), 2, 'Spam message <a href="localhost">link</a> 2');

            group.addComment("Name", "STEAMID", getDate(), 3, 'Spam message <a href="localhost">link</a> 3');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 1);
            assert.equal(spam.spams[0].length, 3);
        });
    });

    describe('#clearComments()', () => {
        it('should delete comments that are too old', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Lorem ipsum dolor sit amet, <a href="localhost">link</a>');
            group.addComment("Name", "STEAMID", getDate(), 2, 'pri falli corrumpit ullamcorper id <a href="localhost">link</a>');

            group.addComment("Name", "STEAMID", getDate(), 3, 'graece invidunt ex mel. <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.comments.size, 3);

            spam.clearComments();

            assert.equal(spam.comments.size, 2);
        });
    });

    describe('#spamAction()', () => {
        it('should delete spam comments that are within the config limit range', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            group.addComment("Name", "STEAMID", getDate(), 2, 'Spam message <a href="localhost">link</a> 2');

            group.addComment("Name", "STEAMID", getDate(), 3, 'Spam message <a href="localhost">link</a> 3');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 1);
            assert.equal(spam.spams[0].length, 3);

            spam.spamAction();

            assert.deepEqual(group.getDeleted(), [1, 2, 3]);
        });

        it('should not delete comments that have been already deleted', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            group.addComment("Name", "STEAMID", getDate(), 2, 'Spam message <a href="localhost">link</a> 2');

            group.addComment("Name", "STEAMID", getDate(), 3, 'Spam message <a href="localhost">link</a> 3');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 1);
            assert.equal(spam.spams[0].length, 3);

            spam.spamAction();
            spam.spamAction();

            var deleted = group.getDeleted();

            assert.equal(deleted.length, 3);
        });
    });
});