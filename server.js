const
    express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    admin = require('./dao/admin'),
    flightsUpdate = require('./lib/flightsUpdate');

// Get request and return response as JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//flightsUpdate(admin);

app.post('/newMessage', (req, res) => {
    let body = req.body;

    let payload = {
        notification: {
            title: body.title,
            body: body.body
        }
    };

    admin.sendNotification(body.tokens, payload).then(() => {
        // Response is a message ID string.
        res.send("Success");
    }).catch(() => {
        res.status(500).send("Failed");
    });

});

app.listen(3000, function () {
    console.log("server starting on 3000");
});