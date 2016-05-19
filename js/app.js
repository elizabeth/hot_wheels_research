// Takes data from data.csv and displays it on a map using google maps

var colors = [];
colors.push({color:"#f3bf72"});
colors.push({color:"#eea638"});
colors.push({color:"#d38612"});
colors.push({color:"#a4680e"});

var min = 1;

// build map
var myLatlng = new google.maps.LatLng(41.0588801, -98.3600825);
var mapOptions = {
    zoom: 4,
    center: myLatlng,
    minZoom: 2,
    maxZoom: 10,
    streetViewControl: false,
    mapTypeControlOptions: {
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
    }
};

// Create an array of styles.
var styles = [
    {
        stylers: [
            { hue: "#001a4d" },
            { saturation: 50 }
        ]
    },{
        featureType: "road",
        elementType: "geometry",
        stylers: [
            { lightness: 10 },
            { visibility: "simplified" }
        ]
    },{
        featureType: "road",
        elementType: "labels",
        stylers: [
            { visibility: "off" }
        ]
    },{
        featureType: "administrative.province",
        elementType: "labels",
        stylers: [
            { visibility: "off" }
        ]
    },{
        featureType: "poi",
        elementType: "labels",
        stylers: [
            { visibility: "off" }
        ]
    },{
        featureType: "landscape",
        elementType: "labels",
        stylers: [
            { visibility: "off" }
        ]
    }
];

// Create a new StyledMapType object, passing it the array of styles,
// as well as the name to be displayed on the map type control.
var styledMap = new google.maps.StyledMapType(styles,
    {name: "Hot Wheels Map"});

var map = new google.maps.Map(document.getElementById("map"),
    mapOptions);

//Associate the styled map with the MapTypeId and set it to display.
map.mapTypes.set('map_style', styledMap);
map.setMapTypeId('map_style');

// get data
var promise = $.ajax({
    type: "POST",
    url: "http://luludust.com:3000/api/upload",
    dataType: "json"
});

// show data on map
promise.then(function (data) {
    data.forEach(function(entry) {
        var cityState = entry.City;
        var heardRest = parseInt(entry["Heard of restaurant delivery"]);
        var longitude = parseFloat(entry.Longitude);
        var latitude = parseFloat(entry.Latitude);
        var color = colors[0].color;

        if (heardRest > 0 && heardRest <= 100) {
            color = colors[1].color;
        } else if (heardRest < 200 && heardRest > 100) {
            color = colors[2].color;
        } else if (heardRest < 300 && heardRest >= 200) {
            color = colors[3].color;
        }

        var dataItem = {
            "name": cityState,
            "value": heardRest,
            "color": color,
            "longitude": longitude,
            "latitude": latitude
        };
        var value = parseInt(dataItem.value);
        // calculate size of a bubble
        if (value < min) {
            value = min;
        } else {
            value = Math.sqrt(value);
        }

        var total = entry["Responses From"];
        var rest = Math.round(entry["Heard of restaurant delivery"]*100 / total);
        var noRest = Math.round(entry["No"] * 100 / total);
        var noPrime = Math.round(entry["No Prime member"] * 100 / total);

        var contentString = "<b>" + dataItem.name + "</b><br>" +
            "<b>Responses From: </b>" + total + "<br>" +
            "<b>Prime Area?: </b>" + entry["Prime Area?"] + "<br>" +
            "<b>Heard of Restaurant Delivery: </b>" + rest + "%<br>" +
            "<b>Not Heard of Restaurant Delivery: </b>" + noRest + "%<br>" +
            "<b>Not Prime Member: </b>" + noPrime + "%";

        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });

        var circle = new google.maps.Circle({
            map: map,
            strokeColor: dataItem.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: dataItem.color,
            fillOpacity: 0.35,
            center: {lat: dataItem.latitude, lng: dataItem.longitude},
            radius: value * 10000
        });

        circle.addListener('mouseover', function() {
            infowindow.setPosition(circle.getCenter());
            infowindow.open(map);
        });

        circle.addListener('mouseout', function() {
            infowindow.close();
        });
    });
});
