"use strict";

let SteamCommunity = require('../node-steamcommunity/index.js');
let ReadLine = require('readline');
let Spam = require('./src/spam.js');

let config = require('./config.js');

let community = new SteamCommunity();

let rl = ReadLine.createInterface({
    "input": process.stdin,
    "output": process.stdout
});

let accountName = config.name;
let password = config.password;

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

        let gid = config.groupid;

        community.getSteamGroup(gid, function(err, group) {
            if (err) {
                console.log(err);
                process.exit(1);
            }

            let spam = new Spam(config, group, console);
        });

    });
}