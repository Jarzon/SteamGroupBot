"use strict";

var fs = require('fs');
var levenshtein = require('fast-levenshtein');

module.exports = class Spam
{

    constructor(config, group, timer)
    {
        this.group = group;
        this.config = config;

        this.comments = new Map();
        this.spams = [];
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

                        for (let [id, commentRow] of this.comments) {
                            // Detect if there is similar text in the DB
                            var diff = levenshtein.get(newComment.text, commentRow.text);

                            if(diff < newComment.text.length / this.config.spamMessageDiff) {

                                // Search if the comment is already marked as spam
                                var n = 0;
                                var spamKey = -1;
                                for (let spamGroup of this.spams) {
                                    if(spamGroup.indexOf(commentRow.commentId) > -1) {
                                        spamKey = n;
                                        break;
                                    }

                                    n++;
                                }

                                // Add it in the related spam group or create a new group and stop the loop
                                if(spamKey > -1) {
                                    this.spams[spamKey].push(newComment.commentId);
                                } else {
                                    this.spams.push([
                                        commentRow.commentId,
                                        newComment.commentId
                                    ]);
                                }
                                break;
                            }
                        }

                        // If the comments are identical, don't add it
                        if(diff !== 0) {
                            this.comments.set(newComment.commentId, newComment);
                        }
                    }

                    this.lastId = newComment.commentId;
                }
            }
        });
    }

    // Delete comments that are too old
    clearComments()
    {
        var diff = this.comments.size - this.config.commentsHistoryLimit;

        for (let [id, comment] of this.comments) {

            if(diff <= 0) {
                break;
            }

            // Is the comment marked as spam
            var n = 0;
            var spamKey = -1;
            for (let spamGroup of this.spams) {
                if(spamGroup.indexOf(comment.commentId) > -1) {
                    spamKey = n;
                    break;
                }

                n++;
            }

            if(spamKey < 0) {
                this.comments.delete(id);
                diff--;
            }
        }

    }

    spamAction() {
        this.spams.forEach((group) => {
            if(group.length >= this.config.spamCountLimit) {
                var lastTime = 0;
                var count = 0;
                var toDelete = [];

                group.forEach((id) => {
                    var comment = this.comments.get(id);
                    var time = comment.date.getTime();

                    toDelete.push(id);

                    // Count comments that are in the same time span
                    if(time - lastTime <= this.config.spamTimeLimit * 1000) {
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