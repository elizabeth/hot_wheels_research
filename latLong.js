// Reads in data from hot_wheels.csv and writes to a new file data.csv with the added latitude and longitudes

// Requires the q package
var Q = require('q');
//Requires the promise package
var Promise = require('promise');

// Requires the csv-parse package
var CSVParse = require('csv-parse');
// Requires the fs package
var fs = require('fs');

// Requires the node-geocoder package
var geocoderProvider = 'google';
var httpAdapter = 'http';
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

// Requires the csv package
var csv = require('csv');
// Requires the csv-stringify package
var stringify = require('csv-stringify');

// get csv data
var read = function() {
    var deferred = Q.defer();
    fs.readFile('hot_wheels.csv', function (err, data) {
        if (err) {
            // Checks if there was an error reading the file.
            console.log('There was an error reading the CSV.');
            res.status(422).send('There was an error with reading the CSV.')
        } else {
            console.log('CSV successfully read.');
            // Stores the raw data to a string
            var csvRaw = data.toString();
            // Uses CSV parse to parse the data into an array
            console.log('Parsing the CSV.');
            CSVParse(csvRaw, function (err, output) {

                if (err) {
                    // Checks if there was an error with CSV Parse
                    console.log('There was an error parsing the CSV.');
                } else {
                    console.log('CSV successfully parsed.');
                    //headers = output.shift();
                    deferred.resolve(output);
                }
            });
        }
    });
    return deferred.promise;
};

// get the locations for all
var _getLatLong = function(data) {
    //var promises = data.map(_geocode);
    var promises = [];
    promises.push(data[0]);
    for (var i=1; i < data.length; i++) {
        promises.push(_geocode(data[i], i));
    }
    Promise.all(promises).then(function(results) {
        console.log("Got all data location");
        // callback to do something with the results
        _saveToCSV(results);
    }).catch(function(err) {
        console.log("Failed getting all data location" + err);
    });
};

// get latitude and longitude of each
// return each with the added location
var _geocode = function(data, i) {
    var entry = data.shift();
    promise = new Promise(function (resolve, reject) {
        setTimeout(function () {
            console.log("Getting data..." + i);
            geocoder.geocode(entry)
                .then(function(res) {
                    data.unshift(res[0].latitude.toString());
                    data.unshift(res[0].longitude.toString());
                    data.unshift(entry);
                    resolve(data);
                })
                .catch(function(err) {
                    console.log(entry + err);
                    data.unshift(res[0].latitude.toString());
                    data.unshift(res[0].longitude.toString());
                    data.unshift(entry);
                    resolve(data);
                });
            }, 200 * i);
        });
    return promise;
};

// save new data to csv file
var _saveToCSV = function(csvArray) {
    console.log('Converting CSV to JSON.');
    var keys = csvArray.shift();

    var first = keys.shift();
    keys.unshift("Latitude");
    keys.unshift("Longitude");
    keys.unshift(first);

    csvArray.unshift(keys);

    stringify(csvArray, function(err, output){
        fs.writeFile('data.csv', output, function (err, data) {
            if (err) {
                return console.log(err);
            } else {
                console.log("Successfully saved");
            }});
    });

    console.log('CSV successfully converted to JSON.');
};

read()
    .then(_getLatLong);