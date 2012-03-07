/*
  mobile-carousel.js
  
  jQuery carousel plugin, handles mobile swipe events
*/
(function ($) {
	"use strict";

	var hasTouch = 'ontouchstart' in window && !isTouchPad;

	//CONSTANTS
	var MOVE_EVENT = hasTouch ? 'touchmove' : 'mousemove',
	    START_EVENT = hasTouch ? 'touchstart' : 'mousedown',
		STOP_EVENT = hasTouch ? 'touchend' : 'mouseup';

	var methods = {
		init: function (options) {
			return this.each(function () {
				var self = $(this),
					data = self.data('carousel');

				if (!data) {
					var settings = $.extend({
						index: 0,
						snapDuration: 100,
						threshold: 0,
						imageWidth: 290,
						autochange: true,
						rotateDuration: 4000,
						rotateExtraTime: 2000
					}, options);

					self.css('left', settings.index * settings.imageWidth * -1);

					data = {
						options: settings,
						position: { x: settings.index * settings.imageWidth * -1, y: 0 },
						offset: { x: 0, y: 0 },
						change: { x: 0, y: 0 },
						total: self.find('li').length,
						moving: false,
						lastChange: 0
					};

					self.data('carousel', data);
				}

				self.css('width', settings.imageWidth * (data.total + 1));

				self.bind(MOVE_EVENT, methods._move);
				self.bind(START_EVENT, methods._start);
				self.bind(STOP_EVENT, methods._stop);

				if (!hasTouch)
					self.bind('mouseout', methods._stop);

				self.mobileCarousel('_resetTimer');
			});
		},
		_autorotate: function () {
			var self = $(this);
			var data = self.data('carousel');

			var now = Date.now();
			if (now - data.lastChange >= data.options.rotateDuration) {
				data.options.index = (data.options.index + 1) % data.total;
				self.mobileCarousel('change', data.options.index, data.options.rotateExtraTime);
				data.lastChange = now;

				self.mobileCarousel('_resetTimer');
			}

			self.data('carousel', data);
		},
		_move: function (ev) {
			ev.preventDefault();
			var self = $(ev.currentTarget);
			var data = self.data('carousel');

			if (!data.moving)
				return;

			var currentLeft = parseInt(self.css('left'), 10);
			var diff = ev.pageX - data.offset.x;
			self.css('left', currentLeft + diff);

			data.change.x += diff;
			data.offset.x = ev.pageX;

			data.lastChange = Date.now();

			self.data('carousel', data);
		},
		_start: function (ev) {
			ev.preventDefault();
			var self = $(ev.currentTarget);
			var data = self.data('carousel');

			data.moving = true;
			data.offset.x = ev.pageX;

			self.data('carousel', data);
		},
		_stop: function (ev) {
			ev.preventDefault();
			var self = $(ev.currentTarget);
			var data = self.data('carousel');

			if (data.moving === false) {
				data.change.x = 0;
				data.change.y = 0;
				return;
			}

			data.moving = false;

			if (Math.abs(data.change.x) >= data.options.threshold) {
				if (data.change.x > 0) {
					data.options.index = Math.max(data.options.index - 1, 0);
				} else if (data.change.x < 0) {
					data.options.index = Math.min(data.options.index + 1, data.total - 1);
				}
			}

			self.mobileCarousel('change', data.options.index);

			data.change.x = 0;
			data.change.y = 0;

			self.data('carousel', data);
		},
		_resetTimer: function () {
			var self = $(this);
			var data = self.data('carousel');

			if (data.options.autochange) {
				data.lastChange = Date.now();
				self.delay(data.options.rotateDuration, 'carousel').queue('carousel', function () {
					self.mobileCarousel('_autorotate');
				}).dequeue('carousel');
			}

			self.data('carousel', data);
		},
		change: function (index, extraTime) {
			if (extraTime === undefined)
				extraTime = 0;

			var self = $(this);
			var data = self.data('carousel');
			self.animate({ left: (-1 * data.options.imageWidth * index) }, data.options.snapDuration + extraTime);
			data.options.index = index;

			self.mobileCarousel('_resetTimer');

			self.data('carousel', data);
		}
	};

	$.fn.mobileCarousel = function (method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.mobileCarousel');
		}
	};
})(jQuery);