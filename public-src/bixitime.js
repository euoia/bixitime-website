var $ = require('jquery'),
	_ = require('lodash'),
	check = require('check-types'),
	Handlebars = require('Handlebars');

var BixiTime = module.exports = function (options) {
	/**
	 * @property {string} apiUrl The API endpoint for bike updates.
	 */
	check.assert.string(options.apiUrl);
	this.apiUrl = options.apiUrl;

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

	navigator.geolocation.getCurrentPosition(function (position) {
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
	}.bind(this));
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
	}, function (stations) {
		var stationSource = $('#station').html();
		var stationTemplate = Handlebars.compile(stationSource);
		var html = _.map(stations, function (station) {
			station.fromLat = position.coords.latitude;
			station.fromLong = position.coords.longitude;
			return stationTemplate(station);
		}).join('');

		$('#results').html(html);
	});
};
