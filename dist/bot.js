"use strict";
const express = require("express");
const builder = require("botbuilder");
const rp = require("request-promise");
const handoff_1 = require("./handoff");
const commands_1 = require("./commands");
const dbAccess = require("./dbAccess");
// const constants = require("./constants");
// static keys
const SENTIMENTKEY = '27dd6dc8663c4339b4ddc4749181f10d';
var reasons = {
    NOCOMPRENDO: "NOCOMPRENDO",
    REQUEST: "REQUEST",
    SENTIMENT: "SENTIMENT"
}
//=========================================================
// Bot Setup
//=========================================================
const app = express();
// Setup Express Server
app.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('Server Up');
});
// Create chat bot
var connector = new builder.ChatConnector({
    appId: 'ebcceaf9-015b-4500-9843-8437224de7b8',
    appPassword: 'VypnQNjem3cD4QP4SeaZN8b'
});
var bot = new builder.UniversalBot(connector);
app.post('/api/messages', connector.listen());
// Create endpoint for agent / call center
// app.use('/userwebchat', express.static('public'));
// replace this function with custom login/verification for agents
const isAgent = (session) => session.message.user.name.startsWith("Agent");
const handoff = new handoff_1.Handoff(bot, isAgent);

app.use('/agentwebchat', express.static('agent'));
app.use('/userwebchat', express.static('public'));
    
//========================================================
// Bot Middleware
//========================================================
bot.use(commands_1.commandsMiddleware(handoff), handoff.routingMiddleware());
//=========================================================
// Bots Dialogs
//=========================================================
const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/9bb3e457-b6bc-4f10-ba9d-2c4ed7c06e9c?subscription-key=9242d30f3a0d4c34adb244c241638ef5&verbose=true';
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
intents.matches(/\b(hi|hello|hey)\b/i, '/sayHi');
intents.matches('talkToPerson', '/talkToPerson');
intents.onDefault('/noMatch');
// bot.use({
//     receive: function (event, next) {
//         // event.text to change incoming text
//         //Make the request
        
//     }
// });

bot.dialog('/', [
    function (session,args){
        session.replaceDialog('/processMsg');
    }
])

bot.dialog('/processMsg', intents);
bot.dialog('/sayHi', [
    function (session, args) {
        session.send('Hey there. I can do x, y and z for you.');
        session.cancelDialog();
    }
]);
bot.dialog('/talkToPerson', [
    function (session, args) {
        var userId = session.message.address.user.id;
        dbAccess.addNewConvo(userId, true, reasons.REQUEST, 1, session.message.text);
        session.send('Please wait a moment. A support staff will attend to you shortly.');
        session.cancelDialog();
    }
]);
bot.dialog('/noMatch', [
    function (session, args) {
        checkSentiment(session, function (sentiScore) {
            var userId = session.message.address.user.id;
            if (sentiScore < 1){
                dbAccess.addNewConvo(userId, true, reasons.SENTIMENT, sentiScore, session.message.text);
            } else {
                dbAccess.addNewConvo(userId, true, reasons.NOCOMPRENDO, sentiScore, session.message.text);
            }
            session.send('Hmm could you rephrase that please? Alternatively you can talk to a support staff.');
            session.cancelDialog();
            //show buttons
        });
    }
]);

function checkSentiment(session, cb) {
    var options = {
            method: 'POST',
            uri: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
            headers: {
                'Ocp-Apim-Subscription-Key': SENTIMENTKEY,
                'Content-Type': 'application/json'
            },
            body: {
                "documents": [
                    {
                        "language": "en",
                        "id": "3",
                        "text": session.message.text
                    }
                ]
            },
            json: true
        };
        var sentiScore = 1;
        rp(options).then(function (body){
            var rawSentiScore = body.documents[0].score
            if (rawSentiScore < 0.4){
                sentiScore = rawSentiScore;
            }
        }).catch(function (err){
            console.log(err.message);
        }).finally(function (err) {
            cb(sentiScore);
        })
}