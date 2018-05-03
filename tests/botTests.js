let chai = require('chai');
let assert = chai.assert;    // Using Assert style
let expect = chai.expect;    // Using Expect style
let should = chai.should();  // Using Should style

let Spam = require('../src/spam.js');

let disabledTimer = function(callback, time) {};

// Return a date in the past
function getDate(time = 0) {
    let date = new Date();

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

    addComment(authorName, authorId, date, commentId, text)
    {
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
        let output = this.deleted;
        this.deleted = [];
        return output;
    }
}

let spam, group;
let config = {
    spamTimeLimit: 5,
    commentsHistoryLimit: 2,
    spamCountLimit: 2,
    spamMessageDiff: 10,
    spamLookRate: 0,
    spamWithLinksOnly: true
};

beforeEach(() => {
    group = new GroupMock();

    spam = new Spam(config, group, disabledTimer);
});

describe('Spam', () => {
    describe('#getGroupComments()', () => {

        it('shouldn\'t delete comment that don\'t contain a link when config spamWithLinksOnly is true', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Spam message');

            spam.getGroupComments();

            assert.equal(spam.comments.size, 0);
        });

        it('should add a comment with a link in memory', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.comments.size, 1);
        });

        it('should mark comments as spam when both are similar', () => {
            group.addComment("Name", "STEAMID", getDate(), 1, 'Spam message <a href="localhost">link</a>');
            group.addComment("Name", "STEAMID", getDate(), 2, 'Spam message <a href="localhost">link</a>');

            spam.getGroupComments();

            assert.equal(spam.spams.length, 1);
            assert.equal(spam.spams[0].length, 2);
        });

        it('should not mark comments as spam when both aren\'t similar', () => {
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
        it('should remove comments from memory when they are too old', () => {
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

            let deleted = group.getDeleted();

            assert.equal(deleted.length, 3);
        });
    });
});