var $ = require('jquery'),
	_ = require('lodash'),
	check = require('check-types'),
	Handlebars = require('Handlebars'),
	Loader = require('./Loader.js');

var BixiTime = module.exports = function (options) {
	/**
	 * @property {string} apiUrl The API endpoint for bike updates.
	 */
	check.assert.string(options.apiUrl);
	this.apiUrl = options.apiUrl;

	this.debug = (location.search.match('debug=1') !== null);

	/**
	 * @property {string} watchId The result of
	 * navigator.geolocation.watchPosition.
	 */
	this.watchId = null;

	this.loader = new Loader({
		elementLocator: '.header'
	});

	if ('geolocation' in navigator === false) {
		// TODO: Show unhappy map.
		this.showSadMap('No gelocation available.');
		return;
	}

	// Start the loading animation.
	this.loader.startLoading();

	var lastPositionItem = localStorage.getItem('position');
	var lastPosition = null;
	if (lastPositionItem) {
		try	{
			lastPosition = JSON.parse(lastPositionItem);
		} catch (e) {
			if (this.debug) {
				window.alert('Error parsing position from localStorage: ' +
					JSON.stringify(lastPositionItem)
				);
			}

			console.error('Error parsing position from localstorage', lastPositionItem, e);
		}
	}

	if (lastPosition !== null && this.validatePosition(lastPosition)) {
		this.showStations(lastPosition);
	}

	navigator.geolocation.getCurrentPosition(
		this.gotPosition.bind(this),
		this.showSadMap.bind(this),
		{
			timeout: 30000,
			maximumAge: 180000 // 3 minutes.
		}
	);

	//this.gotPosition.bind({
		//coords: {
			//latitude: 123.00,
			//longitude: 123.00
		//}
	//});
};

BixiTime.prototype.gotPosition = function(position) {
	this.loader.stopLoading();
	if (this.validatePosition(position) === false) {
		this.showSadMap('Invalid position: ' + JSON.stringify(position));
		return;
	}

	this.savePosition(position);
	this.showStations(position);

	// Now try to update with high accuracy.
	if (this.watchId === null ) {
		this.watchId = navigator.geolocation.getCurrentPosition(
			this.gotPosition.bind(this),
			this.showSadMap.bind(this),
			{
				timeout: 30000,
				maximumAge: 180000, // 3 minutes.
				enableHighAccuracy: true
			}
		);
	}
};

BixiTime.prototype.showSadMap = function(error) {
	this.loader.stopLoading();

	if (this.debug) {
		if (typeof error === 'object') {
			error = JSON.stringify(error);
		}
		window.alert('Got an error: ' + error);
	}

	// TODO: Show a sad map.
};


BixiTime.prototype.validatePosition = function(position) {
	if (position === undefined ||
		position.coords === undefined ||
		position.coords.latitude === undefined ||
		position.coords.longitude === undefined
	) {
		return false;
	}

	return true;
};

BixiTime.prototype.savePosition = function(position) {
	localStorage.setItem('position', JSON.stringify({
		coords: {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		}
	}));
};

BixiTime.prototype.showStations = function (position) {
	$.getJSON(this.apiUrl, {
		lat: position.coords.latitude,
		long: position.coords.longitude,
		limit: 5
	}, function (stations) {
		var stationSource = $('#station').html();
		var stationTemplate = Handlebars.compile(stationSource);

		// Render the template using station data.
		var html = _.map(stations, function (station) {
			if (station.distance > 2000) {
				station.distance = '&gt; 2km';
			} else {
				station.distance = station.distance.toString() + 'm';
			}

			station.fromLat = position.coords.latitude;
			station.fromLong = position.coords.longitude;
			return stationTemplate(station);
		}).join('');

		$('#results').html(html);
	});
};
