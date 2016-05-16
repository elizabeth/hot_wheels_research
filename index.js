//

// Requires the csv package
var CSVParse = require('csv-parse');

// Requires the express package
var express = require('express');

// Requires the cors package
var cors = require('cors');

// Requires the fs package
var fs = require('fs');

// Loads the multer package
var multer = require('multer');

// Initializes Express
var app = express();

// allows access cross-site access to server
app.use(cors());

// Sets port to defined in the environment or 3000
var port = process.env.PORT || 3000;

// Creates the router
var router = express.Router();

// Defines storage for Multer
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'tmp/')
    },
    filename: function (req, file, cb) {
        cb(null, 'tmp.csv')
    }
});
console.log('Multer storage defined.', 2);

/**
 * Checks if the file is valid format.
 * @param req - Request object
 * @param file - File object
 * @param cb - Callback
 * @private
 */
var _filter = function (req, file, cb) {
    console.log('Validating file.');
    if (file && file.mimetype == 'text/csv') {
        console.log('File is valid.');
        cb(null, true);
        return;
    } else {
        console.log('File is invalid.');
        cb(null, false);
        cb(new Error('Incorrect file type'));
        return;
    }
};

var upload = multer({ storage: storage, fileFilter: _filter});
console.log('Multer upload storage and filter initialized.', 2);

// Registers API routes to the address '/api'
app.use('/api', router);

// Initial API route: http://localhost:3000/api
router.get('/', function(req, res) {
    res.json({ message: 'Get working!' });
});

var _convertToJSON = function(csvArray) {
    console.log('Converting CSV to JSON.');
    var splicedKey = csvArray.splice(0, 1);
    var keys = splicedKey[0];

    var convertedCsv = [];
    csvArray.map(function(line) {
        var tempObj = {};
        for (var i = 0; i < line.length; i++)
            if (keys[i] == 'number')
                tempObj[keys[i]] = convertNumber(line[i]);
            else
                tempObj[keys[i]] = line[i];
        convertedCsv.push(tempObj);
    });
    console.log('CSV successfully converted to JSON.');
    return convertedCsv;
};

// Specifies the field being uploaded
var uploadFile = upload.single('csv');

// API route for uploading
// @author: github.com/taurvi
router.post('/upload', function(req, res, next) {
    //res.status(200).send('successful post');

    console.log('******** API CALLED ********');
    uploadFile(req, res, function error(err) {
        if (err) {
            // Checks if there was an error on uploading the file.
            res.status(422).send('The file uploaded was not a CSV.');
        } else {
            console.log('Reading the CSV.');
            var converted = [];
            fs.readFile('data.csv', function (err, data) {
                if (err) {
                    // Checks if there was an error reading the file.
                    console.log('There was an error reading the CSV.');
                    res.status(422).send('There was an error with reading the CSV.')
                } else {
                    console.log('CSV successfully read.');
                    // Stores the raw data to a string
                    var csvRaw = data.toString();
                    var csvArray = [];
                    // Uses CSV parse to parse the data into an array
                    console.log('Parsing the CSV.');
                    CSVParse(csvRaw, function (err, output) {
                        if (err) {
                            // Checks if there was an error with CSV Parse
                            console.log('There was an error parsing the CSV.');
                            res.status(422).send('There was an error with reading the CSV.');
                        } else {
                            console.log('CSV successfully parsed.');
                            // Stores the CSV Array into output
                            csvArray = output;

                            // Converts the CSV Array to JSON
                            converted = _convertToJSON(csvArray);
                        }
                        //_getLatLong(csvArray);

                        // Returns the JSON
                        console.log('Returning converted CSV.');
                        res.status(200).send(converted);
                        console.log('******** ENDING API CALL ********')
                    })
                }
            });
        }
    });
});

// Start server
app.listen(port);
console.log('server started');