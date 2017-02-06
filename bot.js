"use strict";

var SteamCommunity = require('../node-steamcommunity/index.js');
var ReadLine = require('readline');
var fs = require('fs');
var levenshtein = require('fast-levenshtein');

var config = require('./config.js');

var community = new SteamCommunity();
var rl = ReadLine.createInterface({
    "input": process.stdin,
    "output": process.stdout
});

var accountName = config.name;
var password = config.password;

if(password === '' ) {
    rl.question("Password: ", function(pass) {
        password = pass;

        doLogin(accountName, password);
    });
} else {
    doLogin(accountName, password);
}

function doLogin(accountName, password, authCode, twoFactorCode, captcha) {
    community.login({
        "accountName": accountName,
        "password": password,
        "authCode": authCode,
        "twoFactorCode": twoFactorCode,
        "captcha": captcha
    }, function(err, sessionID, cookies, steamguard) {
        if(err) {
            if(err.message == 'SteamGuardMobile') {
                rl.question("Steam Authenticator Code: ", function(code) {
                    doLogin(accountName, password, null, code);
                });

                return;
            }

            if(err.message == 'SteamGuard') {
                console.log("An email has been sent to your address at " + err.emaildomain);
                rl.question("Steam Guard Code: ", function(code) {
                    doLogin(accountName, password, code);
                });

                return;
            }

            if(err.message == 'CAPTCHA') {
                console.log(err.captchaurl);
                rl.question("CAPTCHA: ", function(captchaInput) {
                    doLogin(accountName, password, authCode, twoFactorCode, captchaInput);
                });

                return;
            }

            console.log(err);
            process.exit();
            return;
        }

        console.log("Logged on!");

        var gid = config.groupid;

        community.getSteamGroup(gid, function(err, group) {
            if (err) {
                console.log(err);
                process.exit(1);
            }

            var spamDiff = 10;
            var spamCountLimit = 4;
            var spamTimeLimit = 36000;

            var commentsDB = {};
            var spamDB = [];
            var lastId = 0;

            setInterval(function() {
                var timeLimit = (new Date()).getTime() - 3600; // 5 mins

                group.getAllComments(0, 20, function(err, comments) {// TODO: Detect that the last comment is to old and select the next page

                    for (var i = comments.length; i-- > 0;) {
                        var newComment = comments[i];

                        if(newComment.commentId > lastId) {

                            console.log(newComment.commentId + ": " + newComment.text);

                            if(newComment.text.match("<a")) { //TODO: Add a config to toggle any spam (with or without links)

                                for (let index in commentsDB) {
                                    var commentRow = commentsDB[index];
                                    console.log("  comment: " + commentRow.commentId + " diff: " + levenshtein.get(newComment.text, commentRow.text));

                                    if(levenshtein.get(newComment.text, commentRow.text) < (newComment.text.length / spamDiff)) {
                                        console.log("   is a Spam");

                                        // Search if the ref comment is already marked as spam
                                        var n = 0;
                                        var result = -1;
                                        for (let spamGroup of spamDB) {
                                            if(spamGroup.indexOf(commentRow.commentId) > -1) {
                                                result = n;
                                                break;
                                            }

                                            n++;
                                        }

                                        // TODO: Use the comment id as an index

                                        if(result > -1) {
                                            console.log("   add it to related spam");
                                            spamDB[result].push(newComment.commentId);
                                        } else {
                                            console.log("   Created a new spam cell");
                                            spamDB.push([
                                                commentRow.commentId,
                                                newComment.commentId
                                            ]);
                                        }
                                        break;
                                    }
                                }

                                commentsDB[newComment.commentId] = newComment;
                            }

                            lastId = newComment.commentId;
                        }
                    }
                });

                // Clean the array from too old comments
                for (var i = commentsDB.length; i-- > 0;) {
                    if(commentsDB.date < timeLimit) {
                        commentsDB.splice(i);
                    }
                }

                // Look at the spam DB and take actions
                spamDB.forEach((group) => {
                    if(group.length > spamCountLimit) {
                        var lastTime = 0;
                        var count = 0;
                        group.forEach((id) => {
                            var comment = commentsDB[id];
                            var time = commentsDB[id].date.getTime();
                            if((time - lastTime) <= spamTimeLimit) {
                                count++;

                                if(count >= spamCountLimit) {
                                    console.log("Ban Ban BAN!");
                                }
                            }

                            lastTime = time;
                        });
                    }
                });
            }, 5000);
        });

    });
}