var dbAccess = {};
var admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert("path/to/serviceAccountKey.json"),
  databaseURL: "https://dxbothack.firebaseio.com"
});

// Get a reference to the database service
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
// var ref = db.ref("restricted_access/secret_document");

// addNewConvo("useruser2", true, "sentiment", "you're dumb");

dbAccess.addNewConvo = function (user_id, redflag, reason, sentiScore, trigger_msg) {
  db.ref('currConvos/' + user_id).set({
    redflag: redflag,
    reason : reason,
    trigger_msg: trigger_msg,
    senti_score: sentiScore,
    timestamp: Date.now()
  });
}

module.exports = dbAccess;