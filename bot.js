"use strict";

var SteamCommunity = require('../node-steamcommunity/index.js');
var ReadLine = require('readline');
var fs = require('fs');
var levenshtein = require('fast-levenshtein');
var Spam = require('./src/spam.js');

var config = require('./config.js');

var community = new SteamCommunity();

var rl = ReadLine.createInterface({
    "input": process.stdin,
    "output": process.stdout
});

var accountName = config.name;
var password = config.password;

doLogin(accountName, password);

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

            var spam = new Spam(config, group);
        });

    });
}