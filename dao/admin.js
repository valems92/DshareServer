const
    admin = require('firebase-admin'),
    serviceAccount = require('../resources/key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dsharefinalproject.firebaseio.com"
});

const
    db = admin.database(),
    ref = db.ref('/searches'),
    messaging = admin.messaging();

class Admin {
    static async getAllFeatureFlightSearchesThatFoundSuggestion() {
        let searches = {};
        const dataSnapshot = await ref.orderByChild("foundSuggestion").equalTo(true).once("value");
        if (dataSnapshot) {
            let data = dataSnapshot.toJSON();

            let search;
            Object.keys(data).forEach(function (searchId) {
                search = data[searchId];
                // Keep future searches
                if (search.leavingTime > Date.now()) {
                    searches[search.id] = search;
                }
            });
        }

        return searches;
    }

    static sendNotification(registrationToken, payload ){

        return messaging.sendToDevice(registrationToken, payload);
    }


    static updateSearchLeavingTimeInFirebase(searchId,foundSuggestion) {
        db.ref('/searches/' + searchId).update({
            foundSuggestion: foundSuggestion});
    }

    static updateLeavingTimeInFirebase(searchId,leavingTime) {
        db.ref('/searches/' + searchId).update({
            leavingTime: leavingTime});
    }

    static deleteSearch(searchId){
        let status = ref.child(searchId).remove();
        if(status)
            return true;
        else
            return false;

    }


}

module.exports = Admin;