var $ = require('jquery'),
	check = require('check-types');

var Loader = module.exports = function Loader (options) {
	check.assert.object(options);
	check.assert.string(options.elementLocator);

	this.element = $(options.elementLocator);

	this.colourOrder = [
		'red', 'pink', 'green', 'yellow'
	];

	this.colourIdx = 0;

	/**
	 * @property {Interval} interval The result of window.setInterval.
	 */
	this.interval = null;
};

Loader.prototype.currentColour = function() {
	return this.colourOrder[this.colourIdx % this.colourOrder.length];
};

Loader.prototype.nextColour = function() {
	this.colourIdx += 1;
};

Loader.prototype.startLoading = function() {
	this.loadingInterval = window.setInterval(
		function () {
			this.element.removeClass(this.currentColour());
			this.nextColour();
			this.element.addClass(this.currentColour());
		}.bind(this),
		700
	);
};

Loader.prototype.stopLoading = function() {
	this.element.removeClass(this.currentColour());
	clearInterval(this.loadingInterval);
};
