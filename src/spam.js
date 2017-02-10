"use strict";

var fs = require('fs');
var levenshtein = require('fast-levenshtein');

module.exports = class Spam
{

    constructor(config, group, timer)
    {
        this.group = group;
        this.config = config;

        this.commentsDB = {};
        this.spamDB = [];
        this.lastId = 0;

        if(timer === undefined) {
            timer = function(callback, time) { setInterval(callback, time) };
        }


        timer(() => {
            this.getGroupComments();
            this.clearComments();
            this.spamAction();
        }, this.config.spamLookRate);
    }

    getGroupComments()
    {
        this.group.getAllComments(0, 20, (err, comments) => {

            for (var i = comments.length; i-- > 0;) {
                var newComment = comments[i];

                // Look if its newer
                if(newComment.commentId > this.lastId) {

                    if(newComment.text.match("<a")) {

                        for (let key in this.commentsDB) {
                            var commentRow = this.commentsDB[key];

                            // Detect if there is similar text in the DB
                            if(levenshtein.get(newComment.text, commentRow.text) < (newComment.text.length / this.config.spamMessageDiff)) {

                                // Search if the comment is already marked as spam
                                var n = 0;
                                var spamKey = -1;
                                for (let spamGroup of this.spamDB) {
                                    if(spamGroup.indexOf(commentRow.commentId) > -1) {
                                        spamKey = n;
                                        break;
                                    }

                                    n++;
                                }

                                // Add it in the related spam group or create a new group and stop the loop
                                if(spamKey > -1) {
                                    this.spamDB[spamKey].push(newComment.commentId);
                                } else {
                                    this.spamDB.push([
                                        commentRow.commentId,
                                        newComment.commentId
                                    ]);
                                }
                                break;
                            }
                        }

                        this.commentsDB[newComment.commentId] = newComment;
                    }

                    this.lastId = newComment.commentId;
                }
            }
        });
    }

    // Delete comments that are too old
    clearComments()
    {
        for (let id in this.commentsDB) {
            var comment = this.commentsDB[id];

            if(comment.date.getTime() < (new Date()).getTime() - (this.config.spamHistoryLimit * 1000)) {
                delete this.commentsDB[id];
            }
        }
    }

    spamAction() {
        this.spamDB.forEach((group) => {
            if(group.length >= this.config.spamCountLimit) {
                var lastTime = 0;
                var count = 0;
                var toDelete = [];

                group.forEach((id) => {
                    var comment = this.commentsDB[id];
                    var time = comment.date.getTime();

                    toDelete.push(id);

                    // Count comments that are in the same time span
                    if((time - lastTime) <= this.config.spamTimeLimit * 1000) {
                        count++;


                        if(count == this.config.spamCountLimit) {

                            toDelete.forEach((toDeleteId) => {
                                this.group.deleteComment(toDeleteId);
                            });
                        }
                    }

                    lastTime = time;
                });
            }
        });
    }
};