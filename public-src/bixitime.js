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

	this.loader = new Loader({
		elementLocator: '.header'
	});

	// Start the loading animation.
	this.loader.startLoading();

	var lastPositionItem = localStorage.getItem('position');
	var lastPosition = null;
	if (lastPositionItem !== null) {
		try	{
			lastPosition = JSON.parse(lastPositionItem);
		} catch (e) {
			console.error('Error parsing position from localstorage', lastPositionItem, e);
		}
	}

	if (lastPosition !== null) {
		this.showStations(lastPosition);
	}

	navigator.geolocation.getCurrentPosition(
		function (position) {
			this.loader.stopLoading();
			this.gotPosition(position);
		}.bind(this)
	);

	//this.gotPosition.bind({
		//coords: {
			//latitude: 123.00,
			//longitude: 123.00
		//}
	//});
};


BixiTime.prototype.gotPosition = function(position) {
	if (position === undefined ||
		position.coords === undefined ||
		position.coords.latitude === undefined ||
		position.coords.longitude === undefined
	) {
		console.error('Invalid position', position);
		return;
	}

	localStorage.setItem('position', JSON.stringify({
		coords: {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		}
	}));

	this.showStations(position);
	$('.loading').hide();
};

BixiTime.prototype.showStations = function (position) {
	if (position === undefined ||
		position.coords === undefined ||
		position.coords.latitude === undefined ||
		position.coords.longitude === undefined
	) {
		console.error('Invalid position', position);
		return;
	}

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
