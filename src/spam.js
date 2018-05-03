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

                // Stop if the comment is older that the last one we verified
                if (newComment.commentId <= this.lastId) {
                    continue;
                }

                this.lastId = newComment.commentId;

                // Stop if config to detect spam with links only and there is no link in the comment
                if (this.config.spamWithLinksOnly && newComment.text.match("<a") === null) {
                    continue;
                }

                // Compare the new message with every message in the memory
                for (var [id, commentRow] of this.comments) {
                    // Detect if there is similar text in the DB
                    var diff = levenshtein.get(newComment.text, commentRow.text);

                    if (diff < newComment.text.length / this.config.spamMessageDiff) {

                        // Search if the comment is already marked as spam
                        var n = 0;
                        var spamKey = -1;
                        for (var spamGroup of this.spams) {
                            if (spamGroup.indexOf(commentRow.commentId) > -1) {
                                spamKey = n;
                                break;
                            }

                            n++;
                        }

                        // Add it in the related spam group or create a new group and stop the loop
                        if (spamKey > -1) {
                            this.spams[spamKey].push(newComment.commentId);
                        } else {
                            this.spams.push([
                                commentRow.commentId,
                                newComment.commentId
                            ]);
                        }
                        break;
                    }

                    // If the comments are identical, don't add the comment text
                    if (diff === 0) {
                        newComment.text = '';
                    }
                }

                newComment.deleted = false;
                this.comments.set(newComment.commentId, newComment);
            }
        });
    }

    // Remove old comments from memory
    clearComments()
    {
        var diff = this.comments.size - this.config.commentsHistoryLimit;

        for (var [id, comment] of this.comments) {

            if(diff <= 0) {
                break;
            }

            // Is the comment marked as spam
            var n = 0;
            var spamKey = -1;
            for (var spamGroup of this.spams) {
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

    // Delete comments that are marked as spam
    spamAction() {
        this.spams.forEach((group) => {
            if(group.length >= this.config.spamCountLimit) {
                var toDelete = [];

                group.forEach((id) => {
                    var comment = this.comments.get(id);

                    if(!comment.deleted) {
                        this.group.deleteComment(id);
                        comment.deleted = true;
                    }
                });
            }
        });
    }
};