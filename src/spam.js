"use strict";

var fs = require('fs');
var levenshtein = require('fast-levenshtein');

module.exports = class Spam {

    constructor(config, group) {
        this.group = group;
        this.config = config;

        this.commentsDB = {};
        this.spamDB = [];
        this.lastId = 0;
    }

    loop() {
        setInterval(() => {
            var timeLimit = (new Date()).getTime() - this.config.spamHistoryLimit;

            this.group.getAllComments(0, 20, (err, comments) => {

                for (var i = comments.length; i-- > 0;) {
                    var newComment = comments[i];

                    // Look if its newer
                    if(newComment.commentId > this.lastId) {

                        if(newComment.text.match("<a")) {

                            for (let key in this.commentsDB) {
                                var commentRow = this.commentsDB[key];

                                if(levenshtein.get(newComment.text, commentRow.text) < (newComment.text.length / this.config.spamMessageDiff)) {

                                    // Search if the ref comment is already marked as spam
                                    var n = 0;
                                    var spamKey = -1;
                                    for (let spamGroup of this.spamDB) {
                                        if(spamGroup.indexOf(commentRow.commentId) > -1) {
                                            spamKey = n;
                                            break;
                                        }

                                        n++;
                                    }

                                    // TODO: Use the comment id as an index

                                    if(result > -1) {
                                        console.log("   add it to related spam");
                                        this.spamDB[spamKey].push(newComment.commentId);
                                    } else {
                                        console.log("   Created a new spam cell");
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

            // Clean the array from too old comments
            for (let comment in this.commentsDB) {
                if(this.commentsDB.date < timeLimit) {
                    delete this.commentsDB[comment];
                } else break;
            }

            // Look at the spam DB and take actions
            this.spamDB.forEach((group) => {
                if(group.length > this.config.spamCountLimit) {
                    var lastTime = 0;
                    var count = 0;
                    group.forEach((id) => {
                        var comment = this.commentsDB[id];
                        var time = this.commentsDB[id].date.getTime();
                        if((time - lastTime) <= this.config.spamTimeLimit) {
                            count++;

                            if(count >= this.config.spamCountLimit) {
                                console.log("Ban Ban BAN!");
                            }
                        }

                        lastTime = time;
                    });
                }
            });
        }, this.config.spamLookRate);
    }
};