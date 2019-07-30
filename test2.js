// setting up our environment
var express = require('express');
var app = express();

// Our Encryption tool
const NodeRSA = require('node-rsa');

// What we need for our database
const MongoClient = require('mongodb').MongoClient;
const bodyParser= require('body-parser');
var url = 'mongodb://localhost:27017/test';
var dbase;


// BodyParser to enable "post requests"
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// Create Keys
const key = new NodeRSA({b: 512});
let encrypted_data;


// Connect to our database and listening on port 3000
MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) return console.log(err)

    app.listen(3000, () => {
        console.log('App listening on 3000');
        console.log("Database created!");


    });
    dbase = db.db("crud");

    // delete our old data to have "clean" database
    dbase.collection("data").deleteMany({ }, function(err, obj) {
        if (err) throw err;
        console.log(obj.result.n + " document(s) deleted");
    });
});

// Encrypt and save in database
app.post('/data/add', (req, res, next) => {

    // Variable to save our PostMan input
    let input_data = {
        text : req.body.text
    };

    // JSON to String
    let string = JSON.stringify(input_data.text);

    // Filter: Get rid of "" or '' in String
    let clean_string = string.replace(/["']/g, "");

    // Check for alphanumeric input
    if(clean_string.match(/^([0-9]|[a-z])+([0-9a-z]+)$/i)) {

        // Let's finally encrypt our String...
        let encrypted_string = key.encrypt(clean_string, 'base64');

        // ... and save it as JSON to insert it into our database!
        encrypted_data = {
            Word: encrypted_string
        };

        // Push to database
        dbase.collection('data').insertOne(encrypted_data, (err, result) => {
            if(err) {
                console.log(err);
            }

            res.send('data added successfully');
        });

    }
    else{
        res.send('ERROR: Only alphanumeric values are accepted!')
    }
});


// Read and decrypt from database
app.get('/data', (req, res) => {
    dbase.collection('data').find(encrypted_data).toArray( (err, results) => {
        let decrypted_data = JSON.stringify(results[0].Word);
        let decrypted_string = key.decrypt(decrypted_data, 'utf8');
        res.send(decrypted_string);
    });

});
