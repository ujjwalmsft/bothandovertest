"use strict";
const express = require("express");
const builder = require("botbuilder");
const handoff_1 = require("./handoff");
const commands_1 = require("./commands");
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
     // appId: process.env.MICROSOFT_APP_ID,
     // appPassword: process.env.MICROSOFT_APP_PASSWORD
     appId: 'ebcceaf9-015b-4500-9843-8437224de7b8',
     appPassword: 'VypnQNjem3cD4QP4SeaZN8b'
});
var bot = new builder.UniversalBot(connector);
app.post('/api/messages', connector.listen());
// Create endpoint for agent / call center
app.use('/webchat', express.static('public'));
// replace this function with custom login/verification for agents
const isAgent = (session) => session.message.user.name.startsWith("Agent");
const handoff = new handoff_1.Handoff(bot, isAgent);
//========================================================
// Bot Middleware
//========================================================
bot.use(commands_1.commandsMiddleware(handoff), handoff.routingMiddleware());
//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', [
    function (session, args, next) {
        session.send('Echo ' + session.message.text);
    }
]);
