var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 43.8625172, lng: -79.3124672},
        scrollwheel: false,
        zoom: 13,
        disableDefaultUI: true
    });
    ko.applyBindings(new ViewModel());
}

// Signals to the user if google maps is not working
function MapError() {
    document.getElementById('map').innerHTML = "<h2>Google Maps is not loading. Try refreshing the page later.</h2>";
}


// Constructor set up to hold data from Google API and Foursquare
var Place = function (data) {
    this.name = ko.observable(data.name);
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.id = ko.observable(data.id);
    this.subject = ko.observable('');
    this.rating = ko.observable('');
    this.url = ko.observable('');
    this.marker = ko.observable();
    this.description = ko.observable('');
    this.address = ko.observable('');
    this.phonenumber = ko.observable('');
    this.canonicalUrl = ko.observable('');
    this.photoPrefix = ko.observable('');
    this.photoSuffix = ko.observable('');
};

var ViewModel = function () {

    var self = this;

    var marker;

    var markerimage = 'img/sushi.png';

    this.placeList = ko.observableArray([]);

    locations.forEach(function (plotitem) {

        self.placeList.push(new Place(plotitem));
    });

    // Info window that can display information on click of marker
    // Source - https://developers.google.com/maps/documentation/javascript/examples/infowindow-simple
    var InfoWindow = new google.maps.InfoWindow({
        maxWidth: 300,
    });

    self.placeList().forEach(function (plotitem) {

        // Add markers for each of the locations in placeList
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(plotitem.lat(), plotitem.lng()),
            map: map,
            icon: markerimage,
            animation: google.maps.Animation.DROP,

        });

        plotitem.marker = marker;

        // Foursquare AJAX request
        $.ajax({
            url: 'https://api.foursquare.com/v2/venues/' + plotitem.id() + '?client_id=GHWL1LOBUEUYBSOH2QZ2GBM1LTXGM4P1ZYZBIIFBS52ZUW5D&client_secret=VJNAIN3S5244IV5AZPINZZAE1XH5IPC1BD2NXESBXJ3WFJOZ&v=20130815',
            dataType: "json",
            success: function (data) {

                // Check result for each marker if they have the data required to
                // fill the constructor's variables

                var result = data.response.venue;

                var location = result.hasOwnProperty('location') ? result.location : '';
                if (location.hasOwnProperty('address')) {
                    plotitem.address(location.address || 'none');
                }

                var bestPhoto = result.hasOwnProperty('bestPhoto') ? result.bestPhoto : '';
                if (bestPhoto.hasOwnProperty('prefix')) {
                    plotitem.photoPrefix(bestPhoto.prefix || '');
                }

                if (bestPhoto.hasOwnProperty('suffix')) {
                    plotitem.photoSuffix(bestPhoto.suffix || '');
                }

                var contact = result.hasOwnProperty('contact') ? result.contact : '';
                if (contact.hasOwnProperty('formattedPhone')) {
                    plotitem.phonenumber(contact.formattedPhone || 'none');
                }

                var rating = result.hasOwnProperty('rating') ? result.rating : '';
                plotitem.rating(rating || 'none');

                var url = result.hasOwnProperty('url') ? result.url : '';
                plotitem.url(url || '');

                plotitem.canonicalUrl(result.canonicalUrl);

                // Content of card that appears on click of a marker
                var subject = '<div><center><h4>' + plotitem.name() 
                        + '</h4></center><div id="imager"><img src="' +
                        plotitem.photoPrefix() + '200x120' + plotitem.photoSuffix() +
                        '" alt="Image Location"></div><b><br><p>Information from Foursquare:</p></b><p>' +
                        plotitem.phonenumber() + '</p><p>Address: ' + plotitem.address() + '</p><p>' +
                        'Rating: ' + plotitem.rating() + '</p><p><a href=' + plotitem.url() + '>' + plotitem.url() +
                        '</a></p><p><a target="_blank" href=' + plotitem.canonicalUrl() +
                        '>Foursquare Page</a></p><p><a target="_blank" href=https://www.google.com/maps/dir/Current+Location/' +
                        plotitem.lat() + ',' + plotitem.lng() + '>Directions</a></p></div>';

                google.maps.event.addListener(plotitem.marker, 'click', function () {
                    InfoWindow.open(map, this);
                    plotitem.marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function () {
                        plotitem.marker.setAnimation(null);
                    }, 1000);
                    InfoWindow.setContent(subject);
                });
            },
            error: function (e) {
                InfoWindow.setContent('<h5>Foursquare is not loading. Try refreshing the page later.</h5>');
            }
        });

        // Makes error from AJAX display on the marker form
        google.maps.event.addListener(marker, 'click', function () {
            InfoWindow.open(map, this);
            plotitem.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                plotitem.marker.setAnimation(null);
            }, 500);
        });
    });

    self.hideElements = function (toggleNav) {
        self.toggleNav(true);
        return true;
    };

    self.showElements = function (toggleNav) {
        self.toggleNav(false);
        return true;
    };

    self.showInfo = function (plotitem) {
        google.maps.event.trigger(plotitem.marker, 'click');
        self.hideElements();
    };

    // Toggle the nav class based style
    self.toggleNav = ko.observable(false);
    this.navStatus = ko.pureComputed (function () {
        return self.toggleNav() === false ? 'nav' : 'navClosed';
        }, this);

    // Array of markers dependant on search form
    self.visible = ko.observableArray();

    self.placeList().forEach(function (place) {
        self.visible.push(place);
    });

    // Input on search is stored
    self.searchInput = ko.observable('');

    // If the user searches for a place that exists in the data then show it 
    // otherwise just hide the marker
    self.filterMarkers = function () {
        var searchInput = self.searchInput().toLowerCase();
        self.visible.removeAll();
        self.placeList().forEach(function (place) {
            place.marker.setVisible(false);
            if (place.name().toLowerCase().indexOf(searchInput) !== -1) {
                self.visible.push(place);
            }
        });
        self.visible().forEach(function (place) {
            place.marker.setVisible(true);
        });
    };

};