var stream = stream;
var apply = apply;
var constant = constant;
var curry = curry;
var id = id;
var add = add;
var subtract = subtract;
var mathMax = mathMax;
var mathMin = mathMin;
var measureWidth = measureWidth;
var measureHeight = measureHeight;
var updateDomFunc = updateDomFunc;

var caseSplit = function (cases, obj) {
	// may curry
	if (!obj) {
		return function (obj) {
			for (var key in cases) {
				if (cases.hasOwnProperty(key) && obj.hasOwnProperty(key)) {
					if (!$.isFunction(cases[key])) {
						return cases[key];
					}
					return cases[key](obj[key]);
				}
			}
		}
	}
	for (var key in cases) {
		if (cases.hasOwnProperty(key) && obj.hasOwnProperty(key)) {
			if (!$.isFunction(cases[key])) {
				return cases[key];
			}
			return cases[key](obj[key]);
		}
	}
};

var _scrollbarWidth = function () {
  var parent, child, width;

  if(width===undefined) {
    parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
    child=parent.children();
    width=child.innerWidth()-child.height(99).innerWidth();
    parent.remove();
  }

 return width;
};

var unit = function (unit) {
	return function (number) {
		return number + unit;
	};
};
var px = unit('px');
var vw = unit('vw');

var onceZeroS = stream.once(0);

var windowWidth = stream.create();
var windowHeight = stream.create();
var updateWindowWidth = function () {
	stream.push(windowWidth, window.innerWidth);
};
var updateWindowHeight = function () {
	stream.push(windowHeight, window.innerHeight);
};
$(updateWindowWidth);
$(updateWindowHeight);
$(window).on('resize', function () {
	updateWindowWidth();
	updateWindowHeight();
});
var windowResize = stream.once(null, true);
$(window).on('resize', function (e) {
	stream.push(windowResize, e);
});

var windowScroll = stream.create(true);
$(window).on('scroll', function () {
	stream.push(windowScroll, window.scrollY);
});
stream.push(windowScroll, window.scrollY);

var windowHash = stream.create(true);
$(window).on('hashchange', function () {
	stream.push(windowHash, location.pathname);
});
stream.push(windowHash, location.pathname);


var layoutRecurse = function ($el, ctx, cs) {
	if ($.isArray(cs)) {
		return cs.map(function (c) {
			return layoutRecurse($el, ctx, c);
		});
	}
	else {
		return function (context) {
			var i = cs(context);
			// todo: replace with some isInstance function
			if (!i.minWidth || !i.minHeight) {
				console.log('not a component');
			}
			ctx.unbuild(i.destroy);
			i.$el.css('visibility', 'hidden')
				.css('position', 'absolute')
				.css('pointer-events', 'initial');
			stream.onValue(context.width, function (w) {
				updateDomFunc(i.$el, 'width', w);
			});
			stream.onValue(context.height, function (h) {
				updateDomFunc(i.$el, 'height', h);
			});
			stream.onValue(context.top, function (t) {
				updateDomFunc(i.$el, 'top', t);
			});
			stream.onValue(context.left, function (l) {
				updateDomFunc(i.$el, 'left', l);
			});
			stream.combine([
				context.width,
				context.height,
				context.top,
				context.left,
			], function () {
				updateDomFunc(i.$el, 'visibility', 'initial');
			});
			return i;
		};
	}
};

var layout = function (elArg, buildLayoutArg) {
	var el = buildLayoutArg ? elArg : div;
	var buildLayout = buildLayoutArg || elArg;
	return function () {
		var args = Array.prototype.slice.call(arguments);
		return el(function ($el, ctx) {
			$el.css('pointer-events', 'none')
				.css('position', 'relative');
			return buildLayout.apply(null, [$el, ctx].concat(layoutRecurse($el, ctx, args)));
		});
	};
};

var container = function (elArg, buildContainerArg) {
	var el = buildContainerArg ? elArg : div;
	var buildContainer = buildContainerArg || elArg;
	return div(function ($el, ctx) {
		return buildContainer($el, ctx, function (cs) {
			return layoutRecurse($el, ctx, cs);
		});
	});
};

var all = function (fs) {
	return function (c) {
		return fs.reduce(function (c, f) {
			return f(c);
		}, c);
	};
};

var rootComponent = function (c) {
	var scrollbarWidth = _scrollbarWidth();
	var width = stream.create();
	var height = stream.create();
	var minHeight = stream.create();
	stream.combine([
		windowWidth,
		windowHeight,
		minHeight,
	], function (ww, wh, mh) {
		var mhAtWW = mh(ww);
		if (mhAtWW > wh) {
			var mhAtScrollbarWW = mh(ww - scrollbarWidth);
			if (mhAtScrollbarWW > wh) {
				$('body').css('overflow-y', 'initial');
				stream.push(width, ww - scrollbarWidth);
				stream.push(height, mhAtScrollbarWW);
			}
			else {
				$('body').css('overflow-y', 'scroll');
				stream.push(width, ww - scrollbarWidth);
				stream.push(height, mhAtScrollbarWW);
			}
		}
		else {
			$('body').css('overflow-y', 'initial');
			stream.push(width, ww);
			stream.push(height, mhAtWW);
		}
	});
	var unbuild = [];
	var i = c({
		$el: $('body'),
		width: width,
		height: height,
		top: onceZeroS,
		left: onceZeroS,
		topAccum: onceZeroS,
		leftAccum: onceZeroS,
		unbuild: unbuild.push,
	});
	i.$el.css('position', 'absolute');
	var destroy = i.destroy;
	i.destroy = function () {
		unbuild.map(apply());
		destroy();
	};
	stream.pushAll(i.minHeight, minHeight);
	stream.all([
		width,
		height,
	], function (w, h) {
		i.$el.css('width', px(w))
			.css('height', px(h));
	});
	return i;
};

var color = function (c) {
	return $.extend({
		r: 0,
		g: 0,
		b: 0,
		a: 1,
	}, c);
};
var multiplyColor = function (amount) {
	return function (c) {
		return {
			r: Math.min(255, c.r * amount),
			g: Math.min(255, c.g * amount),
			b: Math.min(255, c.b * amount),
			a: c.a,
		};
	};
};
var desaturate = function (amount) {
	return function (c) {
		var average = (c.r + c.g + c.b) / 3;
		var coAmount = 1 - amount;
		return {
			r: coAmount * c.r + amount * average,
			g: coAmount * c.g + amount * average,
			b: coAmount * c.b + amount * average,
			a: c.a,
		};
	};
};
var colorBrightness = function (c) {
	return (c.r + c.g + c.b) / (255 + 255 + 255);
};
var colorString = function (c) {
	return 'rgba(' + Math.floor(c.r) + ',' + Math.floor(c.g) + ',' + Math.floor(c.b) + ',' + c.a + ')';
};
var rgbColorString = function (c) {
	return 'rgb(' + Math.floor(c.r) + ',' + Math.floor(c.g) + ',' + Math.floor(c.b) + ')';
};
var transparent = color({
	a: 0,
});
var black = color({
	r: 0,
	g: 0,
	b: 0,
});
var white = color({
	r: 255,
	g: 255,
	b: 255,
});

var mapMinWidths = function (is) {
	return stream.combine(is.map(function (i) {
		return i.minWidth;
	}), function () {
		var args = Array.prototype.slice.call(arguments);
		return args;
	});
};
var mapMinHeights = function (is) {
	return stream.combine(is.map(function (i) {
		return i.minHeight;
	}), function () {
		var args = Array.prototype.slice.call(arguments);
		return args;
	});
};

var url = function (str) {
	return 'url("' + str + '")';
};

var and = function (f) {
	return function (c) {
		return function (ctx) {
			var i = c(ctx);
			f(i, ctx);
			return i;
		};
	};
};
var $$ = function (f) {
	return and(function (i) {
		return f(i.$el);
	});
};
var jqueryMethod = function (func) {
	return function () {
		var args = Array.prototype.slice.call(arguments);
		return $$(function ($el) {
			$el[func].apply($el, args);
		});
	};
};
var $addClass = jqueryMethod('addClass');
var $attr = jqueryMethod('attr');
var $css = jqueryMethod('css');
var $on = jqueryMethod('on');
var $prop = jqueryMethod('prop');

var useMinWidth = function (ctx, i) {
	return stream.pushAll(i.minWidth, ctx.width);
};
var useMinHeight = function (ctx, i) {
	return stream.combineInto([
		ctx.width,
		i.minHeight,
	], function (w, mh) {
		return mh(w);
	}, ctx.height);
};
var withMinWidth = function (mw) {
	return layout(function ($el, ctx, c) {
		$el.addClass('withMinWidth');
		var i = c(ctx.child());
		return {
			minWidth: stream.once(mw),
			minHeight: i.minHeight,
		};
	});
};
var withMinHeight = function (mh) {
	return layout(function ($el, ctx, c) {
		$el.addClass('withMinHeight');
		var i = c(ctx.child());
		return {
			minWidth: i.minWidth,
			minHeight: stream.once(constant(mh)),
		};
	});
};
var passthrough = function (f) {
	return layout(function ($el, ctx, c) {
		$el.addClass('passthrough');
		f($el);
		return c(ctx.child());
	});
};
// var adjustMinSize = function (config) {
// 	return layout(function ($el, ctx, i) {
// 		return [{
// 			minWidth: stream.map(i.minWidth, function (mw) {
// 				return config.mw(mw);
// 			}),
// 			minHeight: stream.map(i.minHeight, function (mh) {
// 				return config.mh(mh);
// 			}),
// 		}];
// 	});
// };
var link = $css('cursor', 'pointer');

// var componentName = function (name) {
// 	return passthrough(function ($el) {
// 		$el.addClass(name);
// 	});
// };

var onThis = function (event) {
	return function (handler) {
		return $on(event, handler);
	};
};
var changeThis = onThis('change');
var clickThis = onThis('click');
var inputPropertychangeThis = onThis('input propertychange');
var keydownThis = onThis('keydown');
var keyupThis = onThis('keyup');
var mousedownThis = onThis('mousedown');
var mousemoveThis = onThis('mousemove');
var mouseoverThis = onThis('mouseover');
var mouseoutThis = onThis('mouseout');
var mouseupThis = onThis('mouseup');
var submitThis = onThis('submit');

var pushOnClick = function (s, f) {
	return clickThis(function (ev) {
		stream.push(s, f(ev));
	});
};

// var hoverThis = function (cb) {
// 	return passthrough(function ($el) {
// 		cb(false, $el);
// 		$el.on('mouseover', function (ev) {
// 			cb(true, $el, ev);
// 		});
// 		$el.on('mouseout', function (ev) {
// 			cb(false, $el, ev);
// 		});
// 	});
// };

// var hoverStream = function (s, f) {
// 	f = f || function (v) {
// 		return v;
// 	};
// 	return passthrough(function ($el) {
// 		$el.css('pointer-events', 'initial');
// 		$el.on('mouseover', function (ev) {
// 			stream.push(s, f(ev));
// 		});
// 		$el.on('mouseout', function (ev) {
// 			stream.push(s, f(false));
// 		});
// 	});
// };

// var cssStream = function (style, valueS) {
// 	return passthrough(function ($el) {
// 		stream.map(valueS, function (value) {
// 			$el.css(style, value);
// 		});
// 	});
// };

// var withBackgroundColor = function (s, arg2) {
// 	// stream is an object
// 	if (!stream.isStream(s)) {
// 		s = stream.once({
// 			backgroundColor: s,
// 			fontColor: arg2,
// 		});
// 	}
// 	return passthrough(function ($el) {
// 		stream.map(s, function (colors) {
// 			var bc = colors.backgroundColor;
// 			var fc = colors.fontColor;
// 			$el.css('color', colorString(fc))
// 				.css('background-color', colorString(bc));
// 		});
// 	});
// };
// var withFontColor = function (fc) {
// 	return passthrough(function ($el) {
// 		$el.css('color', colorString(fc));
// 	});
// };
// var hoverColor = function (backgroundColor, hoverBackgroundColor, fontColor, hoverFontColor) {
// 	backgroundColor = colorString(backgroundColor || transparent);
// 	hoverBackgroundColor = colorString(hoverBackgroundColor || backgroundColor);
// 	fontColor = colorString(fontColor || black);
// 	hoverFontColor = colorString(hoverFontColor || fontColor);
// 	return hoverThis(function (h, $el) {
// 		$el.css('background-color', h ? hoverBackgroundColor : backgroundColor);
// 		$el.css('color', h ? hoverFontColor : fontColor);
// 	});
// };

var keepAspectRatio = function (config) {
	config = config || {};
	return layout(function ($el, ctx, c) {
		$el.addClass('keepAspectRatio');
		var minWidth = stream.create();
		var minHeight = stream.create();
		var props = stream.combine([
			minWidth,
			minHeight,
			ctx.width,
			ctx.height,
		], function (mw, mh, w, h) {
			var ar = mw / mh(mw);
			var AR = w / h;
			// container is wider
			if ((!config.fill && AR > ar) ||
				(config.fill && AR < ar)) {
				var usedWidth = h * ar;

				var left;
				if (config.left) {
					left = 0;
				}
				else if (config.right) {
					left = w - usedWidth;
				}
				else {
					left = (w - usedWidth) / 2;
				}

				return {
					top: 0,
					left: left,
					width: usedWidth,
					height: h,
				};
			}
			// container is taller
			else {
				var usedHeight = w / ar;

				var top;
				if (config.top) {
					top = 0;
				}
				else if (config.bottom) {
					top = h - usedHeight;
				}
				else {
					top = (h - usedHeight) / 2;
				}

				return {
					top: top,
					left: 0,
					width: w,
					height: usedHeight,
				};
			}
		});
		var i = c(ctx.child({
			top: stream.prop(props, 'top'),
			left: stream.prop(props, 'left'),
			width: stream.prop(props, 'width'),
			height: stream.prop(props, 'height'),
		}));
		stream.pushAll(i.minWidth, minWidth);
		stream.pushAll(i.minHeight, minHeight);
		return {
			minWidth: i.minWidth,
			minHeight: stream.combine([
				i.minWidth,
				i.minHeight,
			], function (mw, mh) {
				return function (w) {
					return w / (mw / mh(mw));
				};
			}),
		};
	});
};

var image = function (config) {
	var srcStream = stream.isStream(config.src) ? config.src : stream.once(config.src);
	return img(function ($el, ctx) {
		var minWidth = stream.create();
		var minHeight = stream.create();
		stream.map(srcStream, function (src) {
			$el.prop('src', src);
		});
		$el.on('load', function () {
			var aspectRatio = $el[0].naturalWidth / $el[0].naturalHeight;
			var mw = config.minWidth || $el[0].naturalWidth;
			var mh = mw / aspectRatio;
			stream.push(minWidth, mw);
			stream.push(minHeight, constant(mh));
		});
		return {
			minWidth: minWidth,
			minHeight: minHeight,
		};
	});
};

var linkTo = function (href) {
	return layout(a, function ($el, ctx, c) {
		$el.prop('href', href);
		$el.css('pointer-events', 'initial');
		return c(ctx.child());
	});
};

var nothing = div(function ($el, ctx) {
	return {
		minWidth: onceZeroS,
		minHeight: stream.once(constant(0)),
	};
});

var text = function (strs, config) {
	strs = strs || '';
	if (!$.isArray(strs)) {
		strs = [strs];
	}
	config = config || strs[0];
	return div(function ($el, ctx) {
		var didMH = false;
		var mw = stream.create();
		var mh = stream.create();
		strs.map(function (c) {
			if ($.type(c) === 'string') {
				c = {
					str: c,
				};
			}
			var $span = $(document.createElement('span'));
			$span.html(c.str);
			if (c.size) {
				$span.css('font-size', c.size);
			}
			if (c.weight) {
				$span.css('font-weight', c.weight);
			}
			if (c.font) {
				$span.css('font-family', c.font);
			}
			if (c.color) {
				$span.css('color', colorString(c.color));
			}
			$span.appendTo($el);
		});
		if (config.size) {
			$el.css('font-size', config.size);
		}
		if (config.weight) {
			$el.css('font-weight', config.weight);
		}
		if (config.font) {
			$el.css('font-family', config.font);
		}
		if (config.color) {
			$el.css('color', config.color);
		}
		if (config.align) {
			$el.css('text-align', config.align);
		}
		stream.push(mw, measureWidth($el, config.minWidth));
		stream.push(mh, measureHeight($el));
		return {
			minWidth: mw,
			minHeight: mh,
		};
	});
};

var ignoreSurplusWidth = function (_, cols) {
	return cols;
};
var ignoreSurplusHeight = function (_, rows) {
	return rows;
};
var centerSurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	var widthPerCol = surplusWidth / positions.length;
	positions.map(function (position, i) {
		position.left += surplusWidth / 2;
	});
	return positions;
};
var evenSplitSurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	var widthPerCol = surplusWidth / positions.length;
	positions.map(function (position, i) {
		position.width += widthPerCol;
		position.left += i * widthPerCol;
	});
	return positions;
};
// don't read this function, please
var evenSplitSurplusWidthWithMinPerRow = function (minPerRow) {
	return function (gridWidth, positions) {
		var lastPosition = positions[positions.length - 1];
		var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
		var widthPerCol = gridWidth / Math.max(minPerRow, positions.length);
		positions.map(function (position, i) {
			position.width = widthPerCol;
			position.left = i * widthPerCol;
		});
		lastPosition = positions[positions.length - 1];
		surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
		widthPerCol = surplusWidth / positions.length;
		positions.map(function (position, i) {
			position.left += surplusWidth / 2;
		});
		return positions;
	};
};
var justifySurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	positions.map(function (position, i) {
		for (var index = 0; index < i; index++) {
			position.left += surplusWidth / (positions.length - 1);
		}
	});
	return positions;
};
var justifyAndCenterSurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	positions.map(function (position, i) {
		position.left += i * surplusWidth / (positions.length) +
			surplusWidth / (2 * positions.length);
	});
	return positions;
};
var surplusWidthAlign = function (t) {
	return function (gridWidth, positions) {
		var lastPosition = positions[positions.length - 1];
		var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
		positions.map(function (position, i) {
			position.left += t * surplusWidth;
		});
		return positions;
	};
};
var surplusWidthAlignLeft = surplusWidthAlign(0);
var surplusWidthAlignCenter = surplusWidthAlign(0.5);
var surplusWidthAlignRight = surplusWidthAlign(1);
var superSurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	if (positions.length === 1) {
		// if we're the only thing on the row, stretch up to roughly
		// double our min width
		if (surplusWidth < positions[0].width) {
			return evenSplitSurplusWidth(gridWidth, positions);
		}
		else {
			return positions;
		}
	}
	if (positions.length === 2) {
		// if there are two things in the row, make two columns each
		// with centered content
		return justifyAndCenterSurplusWidth(gridWidth, positions);
	}
	// if there are 3+ things in the row, then justify
	return justifySurplusWidth(gridWidth, positions);
};

var giveToNth = function (n) {
	return function (gridWidth, positions) {
		var lastPosition = positions[positions.length - 1];
		var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
		positions.map(function (position, i) {
			if (i === n || (i === positions.length - 1 && n >= positions.length)) {
				position.width += surplusWidth;
			}
			else if (i > n) {
				position.left += surplusWidth;
			}
		});
		return positions;
	};
};
var giveToFirst = giveToNth(0);
var giveToSecond = giveToNth(1);
var giveToThird = giveToNth(2);

var centerSurplusHeight = function (totalHeight, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
	positions.map(function (position, i) {
		position.top += surplusHeight / 2;
	});
	return positions;
};
var giveHeightToNth = function (n) {
	return function (totalHeight, positions) {
		var lastPosition = positions[positions.length - 1];
		var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
		positions.map(function (position, i) {
			if (i === n || (i === positions.length - 1 && n >= positions.length)) {
				position.height += surplusHeight;
			}
			else if (i > n) {
				position.top += surplusHeight;
			}
		});
		return positions;
	};
};
var giveHeightToLast = function (totalHeight, positions) {
	var n = positions.length - 1;
	var lastPosition = positions[positions.length - 1];
	var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
	positions.map(function (position, i) {
		if (i === n || (i === positions.length - 1 && n >= positions.length)) {
			position.height += surplusHeight;
		}
		else if (i > n) {
			position.top += surplusHeight;
		}
	});
	return positions;
};
// var slideshow = function (config, cs) {
// 	config.padding = config.padding || 0;
// 	config.leftTransition = config.leftTransition || 'none';
// 	config.alwaysFullWidth = config.alwaysFullWidth || false;
// 	return div.all([
// 		$css('overflow', 'hidden'),
// 		componentName('slideshow'),
// 		children(cs.map(function (c) {
// 			return c.all([
// 				$css('transition', 'left ' + config.leftTransition),
// 			]);
// 		})),
// 		wireChildren(function (instance, context, is) {
// 			var allMinWidths = mapMinWidths(is);
// 			var allMinHeights = mapMinHeights(is);

// 			stream.onValue(allMinWidths, function (mws) {
// 				stream.push(instance.minWidth, mws.reduce(add, config.padding * (is.length - 1)));
// 			});

// 			var contexts = is.map(function () {
// 				return {
// 					top: stream.once(0),
// 					left: stream.create(),
// 					width: stream.create(),
// 					height: context.height,};});

// 			stream.all([
// 				config.selectedS,
// 				context.width,
// 				allMinWidths,
// 				allMinHeights,
// 			], function (selected, width, mws, mhs) {
// 				var selectedLeft = 0;
// 				var selectedWidth = 0;
// 				var left = 0;
// 				var positions = mws.map(function (mw, index) {
// 					mw = config.alwaysFullWidth ? width : mw;
// 					if (selected === index) {
// 						selectedLeft = left + config.padding * index;
// 						selectedWidth = mw;
// 					}
// 					var position = {
// 						left: left + config.padding * index,
// 						width: mw,
// 					};
// 					left += mw;
// 					return position;
// 				});
// 				var dLeft = (width - selectedWidth) / 2 - selectedLeft;
// 				positions.map(function (position) {
// 					position.left += dLeft;
// 				});

// 				positions.map(function (position, index) {
// 					var ctx = contexts[index];
// 					stream.push(ctx.left, position.left);
// 					stream.push(ctx.width, position.width);
// 				});

// 				stream.push(instance.minHeight, constant(mhs.map(function (mh, i) {
// 					return mh(positions[i].width);
// 				}).reduce(mathMax, 0)));
// 			});

// 			return [contexts];
// 		}),
// 	]);
// };
// var slideshowVertical = function (config, cs) {
// 	config.padding = config.padding || 0;
// 	config.topTransition = config.topTransition || 'none';
// 	config.alwaysFullHeight = config.alwaysFullHeight || false;
// 	return div.all([
// 		$css('overflow', 'hidden'),
// 		componentName('slideshow'),
// 		children(cs.map(function (c) {
// 			return c.all([
// 				$css('transition', 'top ' + config.topTransition),
// 			]);
// 		})),
// 		wireChildren(function (instance, context, is) {
// 			var allMinWidths = mapMinWidths(is);
// 			var allMinHeights = mapMinHeights(is);

// 			allMinWidths.map(function (mws) {
// 				return mws.reduce(mathMax, 0);
// 			}, instance.minWidth);

// 			stream.combine([
// 				context.width,
// 				allMinHeights,
// 			], function (w, mhs) {
// 				stream.push(instance.minHeight, mhs.map(apply(w)).reduce(mathMax, 0));
// 			});

// 			var contexts = is.map(function (i) {
// 				return {
// 					top: stream.create(),
// 					left: stream.once(0),
// 					width: context.width,
// 					height: i.minHeight,
// 				};
// 			});

// 			stream.all([
// 				config.selected,
// 				context.width,
// 				context.height,
// 				allMinWidths,
// 				allMinHeights,
// 			], function (selected, width, height, mws, mhs) {
// 				var selectedTop = 0;
// 				var selectedHeight = 0;
// 				var top = 0;
// 				var positions = mhs.map(function (mh, index) {
// 					mh = config.alwaysFullHeight ? height : mh(width);
// 					if (selected === index) {
// 						selectedTop = top + config.padding * index;
// 						selectedHeight = mh;
// 					}
// 					var position = {
// 						top: top + config.padding * index,
// 						height: mh
// 					};
// 					top += mh;
// 					return position;
// 				});
// 				var dTop = (height - selectedHeight) / 2 - selectedTop;
// 				positions.map(function (position) {
// 					position.top += dTop;
// 				});

// 				positions.map(function (position, index) {
// 					var ctx = contexts[index];
// 					stream.push(ctx.top, position.top);
// 					stream.push(ctx.height, position.height);
// 				});
// 			});

// 			return [contexts];
// 		}),
// 	]);
// };

var sideBySide = function (config) {
	config = config || {};
	config.padding = config.padding || 0;
	config.handleSurplusWidth = config.handleSurplusWidth || ignoreSurplusWidth;
	return layout(function ($el, ctx, cs) {
		if (cs.length === 0) {
			return {
				minWidth: stream.once(0),
				minHeight: stream.once(constant(0)),
			};
		}
		var contexts = [];
		var is = cs.map(function (c) {
			var context = ctx.child({
				left: true,
				width: true,
			});
			contexts.push(context);
			return c(context);
		});
		var allMinWidths = mapMinWidths(is);
		var allMinHeights = mapMinHeights(is);
		var minHeightStreams = [allMinHeights];
		var computePositions = function (width, mws) {
			var left = 0;
			var positions = mws.map(function (mw, index) {
				var position = {
					left: left + config.padding * index,
					width: mw,
				};
				left += mw;
				return position;
			});
			positions = config.handleSurplusWidth(width, positions);
			return positions;
		};
		stream.all([
			ctx.width,
			allMinWidths,
			allMinHeights,
			config.sourcePositionsS || stream.once([]),
		], function (width, mws, mhs, sourcePositions) {
			var positions = computePositions(width, mws);
			if (config.targetPositionsS) {
				stream.push(config.targetPositionsS, positions);
			}
			sourcePositions.map(function (position, index) {
				positions[index] = position;
			});
			positions.map(function (position, index) {
				var ctx = contexts[index];
				stream.push(ctx.left, position.left);
				stream.push(ctx.width, position.width);
			});
		});
		return {
			minWidth: stream.map(allMinWidths, function (mws) {
				return mws.reduce(add, config.padding * (is.length - 1));
			}),
			minHeight: stream.combine([
				allMinWidths,
				allMinHeights,
			], function (mws, mhs) {
				return function (w) {
					var positions = computePositions(w, mws);
					return positions.map(function (position, i) {
						return mhs[i](positions[i].width);
					}).reduce(mathMax, 0);
				};
			}),
		};
	});
};

// var slider = function (config, cs) {
// 	config = config || {};
// 	config.leftTransition = config.leftTransition || '0s';
// 	var grabbedS = stream.once(false);
// 	var edge = {
// 		left: 'left',
// 		right: 'right',
// 	};
// 	var stateS = stream.once({
// 		index: 0,
// 		edge: 'left',
// 	});
// 	var xCoord = 0;
// 	return div.all([
// 		componentName('slider'),
// 		$css('overflow-x', 'hidden'),
// 		$css('cursor', 'move'),
// 		children(cs),
// 		wireChildren(function (instance, context, is) {
// 			var allMinWidths = mapMinWidths(is);
// 			var allMinHeights = mapMinHeights(is);

// 			var totalMinWidthS = stream.map(allMinWidths, function (mws) {
// 				return mws.reduce(add, 0);
// 			});
// 			stream.onValue(allMinWidths, function (mws) {
// 				stream.push(instance.minWidth, mws.reduce(mathMax, 0));
// 			});

// 			stream.combine([
// 				allMinWidths,
// 				allMinHeights,
// 			], function (mws, mhs) {
// 				stream.push(instance.minHeight, constant(mhs.map(function (mh, i) {
// 					return mh(mws[i]);
// 				}).reduce(mathMax, 0)));
// 			});

// 			var leftS = stream.combine([
// 				context.width,
// 				allMinWidths,
// 				stateS,
// 				grabbedS
// 			], function (width, mws, state, grabbed) {
// 				// configure left to be the left parameter of the first article in the slider
// 				var left = state.edge === 'left' ? 0 : width; // would love to case split
// 				mws.map(function (mw, index) {
// 					if (index < state.index) {
// 						left -= mw;
// 					}
// 					if (state.edge === 'right' && index === state.index) {
// 						left -= mw;
// 					}
// 				});
// 				if (grabbed !== false) {
// 					left += grabbed;
// 				}
// 				return left;
// 			});

// 			var leftsS = stream.combine([
// 				allMinWidths,
// 				leftS,
// 			], function (mws, left) {
// 				return mws.reduce(function (acc, v) {
// 					acc.arr.push(acc.lastValue);
// 					acc.lastValue += v;
// 					return acc;
// 				}, {
// 					arr: [],
// 					lastValue: left,
// 				}).arr;
// 			});

// 			instance.$el.css('user-select', 'none');
// 			instance.$el.on('mousedown', function (ev) {
// 				ev.preventDefault();
// 				stream.push(grabbedS, 0);
// 				is.map(function (i) {
// 					i.$el.css('transition', 'left 0s');
// 				});
// 			});
// 			var release = function (ev) {
// 				is.map(function (i) {
// 					i.$el.css('transition', 'left ' + config.leftTransition);
// 				});
// 				var mws = allMinWidths.lastValue;
// 				var width = context.width.lastValue;
// 				var grabbed = grabbedS.lastValue;
// 				if (!grabbed) {
// 					return;
// 				}
// 				var left = leftS.lastValue;
// 				// array of sums of min widths
// 				var edgeScrollPoints = mws.reduce(function (a, mw) {
// 					var last = a[a.length - 1];
// 					a.push(last - mw);
// 					return a;
// 				}, [0]);
// 				var closest = edgeScrollPoints.reduce(function (a, scrollPoint, index) {
// 					var leftDistanceHere = Math.abs(scrollPoint - left);
// 					var rightDistanceHere = Math.abs(scrollPoint - (left - width));
// 					return {
// 						left: leftDistanceHere < a.left.distance ? {
// 							distance: leftDistanceHere,
// 							index: index,
// 						} : a.left,
// 						right: rightDistanceHere < a.right.distance ? {
// 							distance: rightDistanceHere,
// 							index: index - 1,
// 						} : a.right,
// 					};
// 				}, {
// 					left: {
// 						distance: Number.MAX_VALUE,
// 						index: -1,
// 					},
// 					right: {
// 						distance: Number.MAX_VALUE,
// 						index: -1,
// 					},
// 				});
// 				if (closest.left.distance <= closest.right.distance) {
// 					stream.push(stateS, {
// 						index: closest.left.index,
// 						edge: 'left',
// 					});
// 				}
// 				else {
// 					stream.push(stateS, {
// 						index: closest.right.index,
// 						edge: 'right',
// 					});
// 				}
// 				stream.push(grabbedS, false);
// 				ev.preventDefault();
// 			};
// 			instance.$el.on('mouseup', release);
// 			instance.$el.on('mouseout', release);
// 			instance.$el.on('mousemove', function (ev) {
// 				var grabbed = grabbedS.lastValue;
// 				var totalMinWidth = totalMinWidthS.lastValue;
// 				var width = context.width.lastValue;
// 				var left = leftS.lastValue;
// 				if (grabbed !== false) {
// 					var dx = ev.clientX - xCoord;
// 					var left2 = left + dx;
// 					left2 = Math.min(0, left2);
// 					if (totalMinWidth > width) {
// 						left2 = Math.max(width - totalMinWidth, left2);
// 					}
// 					dx = left2 - left;
// 					grabbed = grabbed + dx;
// 					stream.push(grabbedS, grabbed);
// 				}
// 				xCoord = ev.clientX;
// 			});

// 			return [is.map(function (i, index) {
// 				return {
// 					top: stream.once(0),
// 					left: stream.map(leftsS, function (lefts) {
// 						return lefts[index];
// 					}),
// 					width: i.minWidth,
// 					height: context.height,
// 				};
// 			})];
// 		}),
// 	]);
// };

var stack = function (config) {
	config = config || {};
	config.padding = config.padding || 0;
	config.handleSurplusHeight = config.handleSurplusHeight || ignoreSurplusHeight;
	config.transition = config.transition || 0;
	var transition = config.transition + 's';
	return layout(function ($el, ctx, cs) {
		$el.addClass('stack');
		if (cs.length === 0) {
			return {
				minWidth: stream.once(0),
				minHeight: stream.once(constant(0)),
			};
		}
		var contexts = [];
		var is = cs.map(function (c) {
			var context = ctx.child({
				top: true,
				height: true,
			});
			contexts.push(context);
			return c(context);
		});
		var allMinWidths = mapMinWidths(is);
		var allMinHeights = mapMinHeights(is);
		is.map(function (i) {
			i.$el.css('transition', 'height ' + transition + ', top ' + transition);
		});
		stream.all([
			ctx.width,
			ctx.height,
			allMinHeights,
		], function (width, height, mhs) {
			var top = 0;
			var positions = mhs.map(function (mh, index) {
				var position = {
					top: top + config.padding * index,
					height: mh(width),
				};
				top += mh(width);
				return position;
			});
			positions = config.handleSurplusHeight(height, positions);
			positions.map(function (position, index) {
				var context = contexts[index];
				stream.push(context.top, position.top);
				stream.push(context.height, position.height);
			});
		});
		return {
			minWidth: stream.map(allMinWidths, function (mws) {
				return mws.reduce(mathMax, 0);
			}),
			minHeight: stream.map(allMinHeights, function (mhs) {
				return function (w) {
					return mhs.map(apply(w)).reduce(add, config.padding * (is.length - 1));
				};
			}),
		};
	});
};

var stackStream = function (config) {
	config = config || {};
	config.padding = config.padding || 0;
	config.handleSurplusHeight = config.handleSurplusHeight || ignoreSurplusHeight;
	config.transition = config.transition || 0;
	return function (actionS) {
		return container(function ($el, ctx, child) {
			var mw = stream.once(0);
			var mh = stream.once(constant(0));
			var contexts = [];
			var is = [];
			var mwDeleteListeners = [];
			var mhDeleteListeners = [];
			var tryPushContexts = function () {
				var width = ctx.width.lastValue;
				var height = ctx.height.lastValue;
				var mws = [];
				var mhs = [];
				is.map(function (i, index) {
					mws[index] = i.minWidth.lastValue;
					mhs[index] = i.minHeight.lastValue;
				});
				// if children have all provided mws and mhs, then provide mw and mh
				if (!mws.concat(mhs).reduce(function (a, b) {
					return a && b !== undefined;
				}, true)) {
					return;
				}
				stream.push(mw, mws.reduce(mathMax, 0));
				stream.push(mh, function (w) {
					return mhs.map(apply(w)).reduce(add, config.padding * (is.length - 1));
				});
				// if width and height from context, then position children
				if (width === undefined) {
					return;
				}
				if (height === undefined) {
					return;
				}
				var top = 0;
				var idx = -1;
				var positions = mhs.map(function (mh) {
					idx += 1;
					var position = {
						top: top + config.padding * idx,
						height: mh(width),
					};
					top += mh(width);
					return position;
				});
				positions = config.handleSurplusHeight(height, positions);
				contexts.map(function (context, index) {
					var position = positions[index];
					stream.push(context.top, position.top);
					stream.push(context.height, position.height);
				});
			};
			stream.onValue(ctx.width, tryPushContexts);
			stream.onValue(ctx.height, tryPushContexts);
			var cs = [];
			var index = -1;
			var insert = function (c) {
				index += 1;
				var context = ctx.child({
					top: true,
					height: true,
				});
				var i = child(c)(context);

				cs[index] = c;
				mwDeleteListeners[index] = stream.onValue(i.minWidth, tryPushContexts);
				mhDeleteListeners[index] = stream.onValue(i.minHeight, tryPushContexts);
				contexts[index] = context;
				is[index] = i;

				return index;
			};
			var remove = function (c) {
				var index = cs.indexOf(c);
				is[index].destroy();
				mwDeleteListeners[index]();
				mhDeleteListeners[index]();
				delete mwDeleteListeners[index];
				delete mhDeleteListeners[index];
				delete contexts[index];
				delete is[index];
				tryPushContexts();
			};
			stream.onValue(actionS, function (action) {
				caseSplit({
					insert: insert,
					insertMany: function (cs) {
						cs.map(insert);
					},
					remove: remove,
				}, action);
			});
			return {
				minWidth: mw,
				minHeight: mh,
			};
		});
	};
};

// var intersperse = function (arr, v) {
// 	var result = [];
// 	stream.map(arr, function (el) {
// 		stream.push(result, el);
// 		stream.push(result, v);
// 	});
// 	result.pop();
// 	return result;
// };


// var adjustPosition = function (amount, c) {
// 	var top = amount.top || 0;
// 	var left = amount.left || 0;
// 	return div.all([
// 		componentName('adjustPosition'),
// 		child(c),
// 		wireChildren(function (instance, context, i) {
// 			stream.pushAll(i.minWidth, instance.minWidth);
// 			stream.pushAll(i.minHeight, instance.minHeight);
// 			return [{
// 				top: stream.map(context.top, function (t) {
// 					return t + top;
// 				}),
// 				left: stream.map(context.left, function (l) {
// 					return l + left;
// 				}),
// 				width: context.width,
// 				height: context.height,
// 			}];
// 		}),
// 	]);
// };

var margin = function (amount) {
	var top = amount.all || 0,
		bottom = amount.all || 0,
		left = amount.all || 0,
		right = amount.all || 0;

	// amount may be a single number
	if ($.isNumeric(amount)) {
		top = bottom = left = right = amount;
	}
	// or an object with properties containing 'top', 'bottom', 'left', and 'right'
	else {
		for (var key in amount) {
			var lcKey = key.toLowerCase();
			if (amount[key] !== null) {
				if (lcKey.indexOf('top') !== -1) {
					top = amount[key];
				}
				if (lcKey.indexOf('bottom') !== -1) {
					bottom = amount[key];
				}
				if (lcKey.indexOf('left') !== -1) {
					left = amount[key];
				}
				if (lcKey.indexOf('right') !== -1) {
					right = amount[key];
				}
			}
		}
	}
	return layout(function ($el, ctx, c) {
		$el.addClass('margin');
		var i = c(ctx.child({
			top: stream.once(top),
			left: stream.once(left),
			width: stream.map(ctx.width, function (w) {
				return w - left - right;
			}),
			height: stream.map(ctx.height, function (h) {
				return h - top - bottom;
			}),
		}));
		return {
			minWidth: stream.map(i.minWidth, function (mw) {
				return mw + left + right;
			}),
			minHeight: stream.map(i.minHeight, function (mh) {
				return function (w) {
					return mh(w) + top + bottom;
				};
			}),
		};
	});
};

// // TODO: change this name quick, before there are too many
// // dependencies on it
// var expandoStream = function (amountS) {
// 	var topS = stream.create();
// 	var bottomS = stream.create();
// 	var leftS = stream.create();
// 	var rightS = stream.create();
// 	stream.map(amountS, function (amount) {
// 		var top = amount.all || 0,
// 			bottom = amount.all || 0,
// 			left = amount.all || 0,
// 			right = amount.all || 0;

// 		// amount may be a single number
// 		if ($.isNumeric(amount)) {
// 			top = bottom = left = right = amount;
// 		}
// 		// or an object with properties containing 'top', 'bottom', 'left', and 'right'
// 		else {
// 			for (var key in amount) {
// 				var lcKey = key.toLowerCase();
// 				if (amount[key] !== null) {
// 					if (lcKey.indexOf('top') !== -1) {
// 						top = amount[key];
// 					}
// 					if (lcKey.indexOf('bottom') !== -1) {
// 						bottom = amount[key];
// 					}
// 					if (lcKey.indexOf('left') !== -1) {
// 						left = amount[key];
// 					}
// 					if (lcKey.indexOf('right') !== -1) {
// 						right = amount[key];
// 					}
// 				}
// 			}
// 		}
// 		stream.push(topS, top);
// 		stream.push(bottomS, bottom);
// 		stream.push(leftS, left);
// 		stream.push(rightS, right);
// 	});
// 	return layout(function ($el, ctx, i) {
// 		return {
// 			minWidth: stream.combine([
// 				i.minWidth,
// 				leftS,
// 				rightS,
// 			], function (mw, l, r) {
// 				return mw + l + r;
// 			}),
// 			minHeight: stream.combine([
// 				i.minHeight,
// 				topS,
// 				bottomS,
// 			], function (mh, t, b) {
// 				return function (w) {
// 					return mh(w) + t + b;
// 				};
// 			}),
// 			width: stream.combine([
// 				ctx.width,
// 				leftS,
// 				rightS,
// 			], function (w, l, r) {
// 				return w - l - r;
// 			}),
// 			height: stream.combine([
// 				ctx.height,
// 				topS,
// 				bottomS,
// 			], function (h, t, b) {
// 				return h - t - b;
// 			}),
// 			top: topS,
// 			left: leftS,
// 		};
// 	});
// };

var alignLRM = function (config) {
	config = config || {};
	config.transition = (config.transition || 0) + 's';
	return function (lrm) {
		return layout(function ($el, ctx, l, r, m) {
			$el.addClass('alignLRM');
			var lCtx = ctx.child({
				width: true,
			});
			var rCtx = ctx.child({
				width: true,
				left: true,
			});
			var mCtx = ctx.child({
				width: true,
				left: true,
			});
			var lI = l(lCtx);
			var rI = r(rCtx);
			var mI = m(mCtx);
			useMinWidth(lCtx, lI);
			useMinWidth(rCtx, rI);
			stream.combineInto([
				rI.minWidth,
				ctx.width,
			], function (mw, w) {
				return w - mw;
			}, rCtx.left);
			useMinWidth(mCtx, mI);
			stream.combineInto([
				mI.minWidth,
				ctx.width,
			], function (mw, w) {
				return (w - mw) / 2;
			}, mCtx.left);
			lI.$el.css('transition', 'left ' + config.transition);
			rI.$el.css('transition', 'left ' + config.transition);
			mI.$el.css('transition', 'left ' + config.transition);
			return {
				minWidth: stream.combine([
					lI.minWidth,
					rI.minWidth,
					mI.minWidth,
				], function (l, r, m) {
					return [l, r, m].reduce(add);
				}),
				minHeight: stream.combine([
					lI.minWidth,
					rI.minWidth,
					mI.minWidth,
					lI.minHeight,
					rI.minHeight,
					mI.minHeight,
				], function (lw, rw, mw, lh, rh, mh) {
					return function (w) {
						return [lh(lw), rh(rw), mh(mw)].reduce(mathMax);
					};
				}),
			};
		})(lrm.l || nothing, lrm.r || nothing, lrm.m || nothing);
	};
};
var center = function (config) {
	return function (c) {
		return alignLRM(config)({
			m: c,
		});
	};
};

var alignTBM = function (config) {
	config = config || {};
	config.transition = (config.transition || 0) + 's';
	return function (tbm) {
		return layout(function ($el, ctx, t, b, m) {
			$el.addClass('alignTBM');
			var tCtx = ctx.child({
				height: true,
			});
			var bCtx = ctx.child({
				height: true,
				top: true,
			});
			var mCtx = ctx.child({
				height: true,
				top: true,
			});
			var tI = t(tCtx);
			var bI = b(bCtx);
			var mI = m(mCtx);
			useMinHeight(tCtx, tI);
			useMinHeight(bCtx, bI);
			stream.combineInto([
				bI.minHeight,
				ctx.height,
				ctx.width,
			], function (mh, h, w) {
				return h - mh(w);
			}, bCtx.top);
			useMinHeight(mCtx, mI);
			stream.combineInto([
				mI.minHeight,
				ctx.height,
				ctx.width,
			], function (mh, h, w) {
				return (h - mh(w)) / 2;
			}, mCtx.top);
			tI.$el.css('transition', 'top ' + config.transition);
			bI.$el.css('transition', 'top ' + config.transition);
			mI.$el.css('transition', 'top ' + config.transition);
			return {
				minWidth: stream.combine([
					tI.minWidth,
					bI.minWidth,
					mI.minWidth,
				], function (t, b, m) {
					return [t, b, m].reduce(mathMax);
				}),
				minHeight: stream.combine([
					tI.minHeight,
					bI.minHeight,
					mI.minHeight,
				], function (t, b, m) {
					return function (w) {
						return [t, b, m].map(apply(w)).reduce(add);
					};
				}),
			};
		})(tbm.t || nothing, tbm.b || nothing, tbm.m || nothing);
	};
};

// // var invertOnHover = function (c) {
// // 	var invert = stream.once(false, 'invert');

// // 	var choose = function (stream1, stream2) {
// // 		return stream.combine([invert, stream1, stream2], function (i, v1, v2) {
// // 			return i ? v2 : v1;
// // 		}, 'choose stream');
// // 	};


// // 	return div.all([
// // 		componentName('invert-on-hover'),
// // 		child(c.and($css('transition', 'background-color 0.2s linear, color 0.1s linear'))),
// // 		wireChildren(function (instance, context, i) {
// // 			stream.pushAll(i.minHeight, instance.minHeight);
// // 			stream.pushAll(i.minWidth, instance.minWidth);
// // 			return [{
// // 				backgroundColor: choose(context.backgroundColor, context.fontColor),
// // 				fontColor: choose(context.fontColor, context.backgroundColor),
// // 				top: stream.once(0),
// // 				left: stream.once(0),
// // 				width: context.width,
// // 				height: context.height,
// // 			}];
// // 		}),
// // 		mouseoverThis(function () {
// // 			stream.push(invert, true);
// // 		}),
// // 		mouseoutThis(function () {
// // 			stream.push(invert, false);
// // 		}),
// // 	]);
// // };

var border = function (colorS, amount, style) {
	var left = amount.left || amount.all || 0;
	var right = amount.right || amount.all || 0;
	var top = amount.top || amount.all || 0;
	var bottom = amount.bottom || amount.all || 0;
	var radius = amount.radius || 0;
	style = style || 'solid';

	if (!stream.isStream(colorS)) {
		colorS = stream.once(colorS);
	}

	var colorStringS = stream.map(colorS, colorString);

	return layout(function ($el, ctx, c) {
		$el.addClass('border');
		var i = c(ctx.child({
			width: stream.map(ctx.width, function (w) {
				return w - left - right;
			}),
			height: stream.map(ctx.height, function (h) {
				return h - top - bottom;
			}),
		}));
		i.$el.css('border-radius', px(radius));
		stream.map(colorStringS, function (colorstring) {
			i.$el.css('border-left', px(left) + ' ' + style + ' ' + colorstring)
				.css('border-right', px(right) + ' ' + style + ' ' + colorstring)
				.css('border-top', px(top) + ' ' + style + ' ' + colorstring)
				.css('border-bottom', px(bottom) + ' ' + style + ' ' + colorstring);
		});
		return {
			minWidth: stream.map(i.minWidth, function (mw) {
				return mw + left + right;
			}),
			minHeight: stream.map(i.minHeight, function (mh) {
				return function (w) {
					return mh(w) + top + bottom;
				};
			}),
		};
	});
};

var componentStream = function (cStream) {
	var error = new Error();
	return div(function ($el, ctx, unbuild) {
		$el.addClass('componentStream');
		var i;
		var unpushMW;
		var unpushMH;
		unbuild(function () {
			if (i) {
				i.destroy();
			}
		});
		var minWidth = stream.create();
		var minHeight = stream.create();
		var iStream = stream.reduce(cStream, function (i, c) {
			if (i) {
				i.destroy();
			}
			if (unpushMW) {
				unpushMW();
			}
			if (unpushMH) {
				unpushMH();
			}
			i = c(ctx.child());
			unpushMW = stream.pushAll(i.minWidth, minWidth);
			unpushMH = stream.pushAll(i.minHeight, minHeight);
			return i;
		});
		return {
			minWidth: minWidth,
			minHeight: minHeight,
		};
	});
};

// // var componentStreamWithExit = function (cStream, exit) {
// // 	var i;
// // 	return div.all([
// // 		componentName('component-stream'),
// // 		function (instance, context) {
// // 			var localCStream = stream.create();
// // 			stream.pushAll(cStream, localCStream);
// // 			stream.map(localCStream, function (c) {
// // 				var ctx = instance.newCtx();
// // 				stream.push(ctx.top, 0);
// // 				stream.push(ctx.left, 0);
// // 				stream.pushAll(context.width, ctx.width);
// // 				stream.pushAll(context.height, ctx.height);

// // 				var instanceC = function (c) {
// // 					if (i) {
// // 						(function (i) {
// // 							setTimeout(function () {
// // 								exit(i).then(function () {
// // 									i.destroy();
// // 								});
// // 							});
// // 						})(i);
// // 					}
// // 					i = c.create(ctx);
// // 					i.$el.css('transition', 'inherit');
// // 					stream.pushAll(i.minWidth, instance.minWidth);
// // 					stream.pushAll(i.minHeight, instance.minHeight);
// // 				};
// // 				if (c.then) {
// // 					c.then(function (c) {
// // 						instanceC(c);
// // 					}, function (error) {
// // 						console.error('child components failed to load');
// // 						console.log(error);
// // 					});
// // 				}
// // 				else {
// // 					instanceC(c);
// // 				}
// // 			});
// // 			return function () {
// // 				stream.end(localCstream);
// // 				if (i) {
// // 					i.destroy();
// // 				}
// // 			};
// // 		},
// // 	]);
// // };

var promiseComponent = function (cP) {
	// var s = stream.once(nothing);
	var s = stream.create();
	Q(cP).then(function (c) {
		stream.push(s, c);
	}, function (error) {
		console.log(error);
	}).catch(function (err) {
		console.log(err);
	});
	return componentStream(s);
};

// var toggleComponent = function (cs, indexStream) {
// 	return componentStream(stream.map(indexStream, function (i) {
// 		return cs[i];
// 	}));
// };

// // var modalDialog = function (c) {
// // 	return function (s, transition) {
// // 		var open = stream.once(false);
// // 		stream.pushAll(s, open);

// // 		transition = transition || 0;

// // 		return div.all([
// // 			$css('z-index', 100),
// // 			componentName('toggle-height'),
// // 			child(c),
// // 			wireChildren(function (instance, context, i) {
// // 				stream.push(instance.minWidth, 0);
// // 				stream.push(instance.minHeight, 0);

// // 				var $el = i.$el;
// // 				$el.css('position', 'fixed');
// // 				$el.css('transition', $el.css('transition') + ', opacity ' + transition + 's');
// // 				$el.css('display', 'none');
// // 				$el.css('pointer-events', 'initial');

// // 				stream.onValue(open, function (on) {
// // 					if (on) {
// // 						$el.css('display', '');
// // 						setTimeout(function () {
// // 							$el.css('opacity', 1);
// // 						}, 100);
// // 					}
// // 					else {
// // 						$el.css('opacity', 0);
// // 						setTimeout(function () {
// // 							$el.css('display', 'none');
// // 						}, transition * 1000);
// // 					}
// // 				});

// // 				return [{
// // 					width: stream.map(windowWidth, function () {
// // 						return window.innerWidth;
// // 					}),
// // 					height: windowHeight,
// // 					left: stream.once(0),
// // 					top: stream.once(0),
// // 				}];
// // 			}),
// // 		]);
// // 	};
// // };

// // var toggleHeight = function (s) {
// // 	var open = stream.once(false);
// // 	stream.pushAll(s, open);
// // 	return function (c) {
// // 		return div.all([
// // 			$css('overflow', 'hidden'),
// // 			componentName('toggle-height'),
// // 			child(c),
// // 			wireChildren(function (instance, context, i) {
// // 				stream.pushAll(i.minWidth, instance.minWidth);
// // 				stream.pushAll(stream.combine([i.minHeight, open], function (mh, onOff) {
// // 					return onOff ? mh : 0;
// // 				}), instance.minHeight);
// // 				return [{
// // 					top: stream.once(0),
// // 					left: stream.once(0),
// // 					width: context.width,
// // 					height: context.height,
// // 				}];
// // 			}),
// // 		]);
// // 	};
// // };

// // var dropdownPanel = function (source, panel, onOff, config) {
// // 	config = config || {};
// // 	config.transition = config.transition || "0.5s";
// // 	return div.all([
// // 		componentName('dropdown-panel'),
// // 		child(div.all([
// // 			child(panel),
// // 			wireChildren(function (instance, context, i) {
// // 				stream.pushAll(i.minWidth, instance.minWidth);
// // 				stream.pushAll(i.minHeight, instance.minHeight);
// // 				i.$el.css('transition', 'top ' + config.transition);
// // 				instance.$el.css('pointer-events', 'none');
// // 				i.$el.css('pointer-events', 'initial');
// // 				i.$el.css('z-index', '1000');
// // 				return [{
// // 					width: context.width,
// // 					height: i.minHeight,
// // 					top: stream.combine([onOff, i.minHeight], function (on, mh) {
// // 						return on ? 0 : -mh;
// // 					}),
// // 					left: stream.once(0),
// // 				}];
// // 			}),
// // 			$css('overflow', 'hidden'),
// // 		])),
// // 		child(source),
// // 		wireChildren(function (instance, context, iPanel, iSource) {
// // 			stream.pushAll(stream.combine([
// // 				iPanel.minWidth,
// // 				iSource.minWidth,
// // 			], Math.max), instance.minWidth);
// // 			stream.pushAll(iSource.minHeight, instance.minHeight);
// // 			if (config.panelHeightS) {
// // 				stream.pushAll(iPanel.minHeight, config.panelHeightS);
// // 			}
// // 			return [{
// // 				width: context.width,
// // 				height: iPanel.minHeight,
// // 				top: iSource.minHeight,
// // 				left: stream.once(0),
// // 			}, {
// // 				width: context.width,
// // 				height: iSource.minHeight,
// // 				top: stream.once(0),
// // 				left: stream.once(0),
// // 			}];
// // 		}),
// // 	]);
// // };

// // var fixedHeaderBody = function (config, header, body) {
// // 	config.transition = config.transition || "0.5s";
// // 	return div.all([
// // 		componentName('fixedHeaderBody'),
// // 		child(body),
// // 		child(header),
// // 		wireChildren(function (instance, ctx, bodyI, headerI) {
// // 			headerI.$el.css('position', 'fixed');

// // 			setTimeout(function () {
// // 				headerI.$el.css('transition', 'height ' + config.transition);
// // 				bodyI.$el.css('transition', 'top ' + config.transition);
// // 			});

// // 			stream.pushAll(stream.map(stream.combine([bodyI, headerI], function (i) {
// // 				return i.minHeight;
// // 			}), function () {
// // 				var args = Array.prototype.slice.call(arguments);
// // 				return args.reduce(add, 0);
// // 			}), instance.minHeight);

// // 			stream.pushAll(stream.map(stream.combine([bodyI, headerI], function (i) {
// // 				return i.minWidth;
// // 			}), function () {
// // 				var args = Array.prototype.slice.call(arguments);
// // 				return args.reduce(mathMax, 0);
// // 			}), instance.minWidth);

// // 			return [{
// // 				top: headerI.minHeight,
// // 				left: stream.once(0),
// // 				width: ctx.width,
// // 				height: bodyI.minHeight,
// // 			}, {
// // 				top: stream.once(0),
// // 				left: stream.once(0),
// // 				width: ctx.width,
// // 				height: headerI.minHeight,
// // 			}];
// // 		}),
// // 	]);
// // };

// // var makeSticky = function (c) {
// // 	return div.all([
// // 		componentName('stickyHeaderBody'),
// // 		child(c),
// // 		wireChildren(function (instance, context, i) {
// // 			stream.pushAll(i.minWidth, instance.minWidth);
// // 			stream.pushAll(i.minHeight, instance.minHeight);

// // 			return [{
// // 				top: stream.once(0),
// // 				left: stream.combine([
// // 					i.minHeight,
// // 					context.scroll,
// // 					context.top,
// // 					context.left,
// // 					context.leftAccum,
// // 				], function (mh, scroll, top, left, leftAccum) {
// // 					var $el = i.$el;
// // 					if (top > scroll) {
// // 						$el.css('position', 'absolute');
// // 						$el.css('transition', '');
// // 						return 0;
// // 					}
// // 					else if (top < scroll) {
// // 						var leftPosition = left + leftAccum;
// // 						$el.css('position', 'fixed');
// // 						$el.css('left', px(leftPosition));
// // 						setTimeout(function () {
// // 							$el.css('transition', 'inherit');
// // 						}, 20);
// // 						return leftPosition;
// // 					}
// // 				}),
// // 				width: context.width,
// // 				height: context.height,
// // 			}];
// // 		}),
// // 	]);
// // };

// // var stickyHeaderBody = function (body1, header, body2) {
// // 	return div.all([
// // 		componentName('stickyHeaderBody'),
// // 		child(body1),
// // 		child(body2),
// // 		child(header),
// // 		wireChildren(function (instance, context, body1I, body2I, headerI) {
// // 			stream.pushAll(stream.map(stream.combine([body1I, body2I, headerI], function (i) {
// // 				return i.minHeight;
// // 			}), function () {
// // 				var args = Array.prototype.slice.call(arguments);
// // 				return args.reduce(add, 0);
// // 			}), instance.minHeight);

// // 			var fixedNow = false;

// // 			return [{
// // 				top: stream.once(0),
// // 				left: stream.once(0),
// // 				width: context.width,
// // 				height: body1I.minHeight,
// // 			}, {
// // 				top: stream.combine([body1I.minHeight, headerI.minHeight], add),
// // 				left: stream.once(0),
// // 				width: context.width,
// // 				height: body2I.minHeight,
// // 			}, {
// // 				top: stream.combine([body1I.minHeight, context.scroll, context.topAccum], function (mh, scroll, topAccum) {
// // 					var $header = headerI.$el;
// // 					mh = Math.floor(mh);
// // 					if (mh > scroll + topAccum) {
// // 						$header.css('position', 'absolute');
// // 						$header.css('transition', '');
// // 						if (fixedNow) {
// // 							window.scrollTo(0, mh + topAccum);
// // 						}
// // 						fixedNow = false;
// // 						return mh;
// // 					}
// // 					else if (mh < scroll + topAccum) {
// // 						$header.css('position', 'fixed');
// // 						setTimeout(function () {
// // 							$header.css('transition', 'inherit');
// // 						}, 20);
// // 						if (!fixedNow) {
// // 							window.scrollTo(0, mh + topAccum);
// // 						}
// // 						fixedNow = true;
// // 						return topAccum;
// // 					}
// // 				}),
// // 				left: stream.once(0),
// // 				width: context.width,
// // 				height: headerI.minHeight,
// // 			}];
// // 		}),
// // 	]);
// // };


// // var grid = function (config, cs) {
// // 	config.padding = config.padding || 0;
// // 	config.handleSurplusWidth = config.handleSurplusWidth || ignoreSurplusWidth;
// // 	config.handleSurplusHeight = config.handleSurplusHeight || ignoreSurplusHeight;
// // 	config.maxPerRow = config.maxPerRow || 0;

// // 	return padding(config.outerGutter ? config.padding : 0, div.all([
// // 		componentName('grid'),
// // 		children(cs),
// // 		wireChildren(function (instance, context, is) {
// // 			if (is.length === 0) {
// // 				stream.push(instance.minWidth, 0);
// // 				stream.push(instance.minHeight, 0);
// // 			}
// // 			var minWidthsS = stream.combine(is.map(function (i) {
// // 				return i.minWidth;
// // 			}), function () {
// // 				return Array.prototype.slice.call(arguments);
// // 			});
// // 			var minHeightsS = stream.combine(is.map(function (i) {
// // 				return i.minHeight;
// // 			}), function () {
// // 				return Array.prototype.slice.call(arguments);
// // 			});

// // 			// todo: fix interaction of allSameWidth and useFullWidth
// // 			stream.pushAll(stream.map(minWidthsS, function (mws) {
// // 				return mws.reduce(function (a, mw) {
// // 					return config.useFullWidth ? a + mw + config.padding : Math.max(a, mw) + config.padding;
// // 				}, -config.padding);
// // 			}), instance.minWidth);

// // 			var contexts = is.map(function (i) {
// // 				return {
// // 					top: stream.create(),
// // 					left: stream.create(),
// // 					width: stream.create(),
// // 					height: stream.create(),
// // 				};
// // 			});

// // 			var rowsStream = stream.combine([
// // 				context.width,
// // 				minWidthsS], function (gridWidth, mws) {
// // 					if (config.allSameWidth) {
// // 						var maxMW = mws.reduce(mathMax, 0);
// // 						// thank you, keenan simons
// // 						for (var ii = 0; ii < mws.length; ii++) {
// // 							mws[ii] = maxMW;
// // 						}
// // 					}
// // 					var blankRow = function () {
// // 						return {
// // 							cells: [],
// // 							contexts: [],
// // 							height: 0,
// // 						};
// // 					};

// // 					var rowsAndCurrentRow = is.reduce(function (a, i, index) {
// // 						var rows = a.rows;
// // 						var currentRow = a.currentRow;

// // 						var mw = mws[index];
// // 						var widthUsedThisRow = currentRow.cells.reduce(function (a, b) {
// // 							return a + b + config.padding;
// // 						}, 0);
// // 						var widthNeeded = Math.min(mw, gridWidth);

// // 						if ((config.maxPerRow > 0 &&
// // 							currentRow.cells.length === config.maxPerRow) ||
// // 							(widthNeeded > 0 &&
// // 							 widthNeeded + widthUsedThisRow > gridWidth)) {
// // 							rows.push(currentRow);
// // 							currentRow = blankRow();
// // 						}

// // 						currentRow.cells.push(widthNeeded);
// // 						currentRow.contexts.push(contexts[index]);

// // 						return {
// // 							rows: rows,
// // 							currentRow: currentRow,
// // 						};
// // 					}, {
// // 						rows: [],
// // 						currentRow: blankRow(),
// // 					});
// // 					var rows = rowsAndCurrentRow.rows;
// // 					rows.push(rowsAndCurrentRow.currentRow);

// // 					rows.map(function (row, i) {
// // 						var widthUsed = 0;
// // 						var positions = row.cells.map(function (widthNeeded) {
// // 							var position = {
// // 								left: widthUsed,
// // 								width: widthNeeded,
// // 							};
// // 							widthUsed += widthNeeded + config.padding;
// // 							return position;
// // 						});
// // 						positions = config.handleSurplusWidth(gridWidth, positions, config, i);
// // 						positions.map(function (position, index) {
// // 							var ctx = row.contexts[index];
// // 							stream.push(ctx.width, position.width);
// // 						});
// // 					});

// // 					return rows;
// // 				});

// // 			var rowsWithHeights = stream.combine([
// // 				minHeightsS,
// // 				rowsStream,
// // 			], function (mhs, rows) {
// // 				var index = 0;
// // 				rows.map(function (row) {
// // 					row.height = 0;
// // 					row.cells.map(function (cell, i) {
// // 						row.height = Math.max(row.height, mhs[index + i]);
// // 					});
// // 					index += row.cells.length;
// // 				});

// // 				stream.push(instance.minHeight, rows.map(function (r) {
// // 					return r.height;
// // 				}).reduce(function (a, b) { return a + b + config.padding; }, -config.padding));
// // 				return rows;
// // 			});


// // 			stream.all([
// // 				context.width,
// // 				context.height,
// // 				rowsWithHeights], function (gridWidth, gridHeight, rows) {
// // 					if (config.bottomToTop) {
// // 						rows = rows.slice(0).reverse();
// // 					}
// // 					var top = 0;
// // 					rows = config.handleSurplusHeight(gridHeight, rows, config);
// // 					rows.map(function (row, i) {
// // 						var widthUsed = 0;
// // 						var positions = row.cells.map(function (widthNeeded) {
// // 							var position = {
// // 								top: top,
// // 								left: widthUsed,
// // 								width: widthNeeded,
// // 								height: row.height,
// // 							};
// // 							widthUsed += widthNeeded + config.padding;
// // 							return position;
// // 						});
// // 						positions = config.handleSurplusWidth(gridWidth, positions, config, i);
// // 						positions.map(function (position, index) {
// // 							var ctx = row.contexts[index];
// // 							stream.push(ctx.top, position.top);
// // 							stream.push(ctx.left, position.left);
// // 							stream.push(ctx.width, position.width);
// // 							stream.push(ctx.height, position.height);
// // 						});
// // 						top += row.height + config.padding;
// // 					});
// // 				});

// // 			return [contexts];
// // 		}),
// // 	]));
// // };

// // var withMinWidthStream = function (getMinWidthStream, c) {
// // 	return div.all([
// // 		componentName('with-min-width-stream'),
// // 		child(c),
// // 		wireChildren(function (instance, context, i) {
// // 			if ($.isFunction(getMinWidthStream)) {
// // 				stream.pushAll(getMinWidthStream(i, context), instance.minWidth);
// // 			}
// // 			else {
// // 				stream.pushAll(getMinWidthStream, instance.minWidth);
// // 			}
// // 			stream.pushAll(i.minHeight, instance.minHeight);
// // 			return [{
// // 				top: stream.once(0),
// // 				left: stream.once(0),
// // 				width: context.width,
// // 				height: context.height,
// // 			}];
// // 		}),
// // 	]);
// // };
var withMinHeightStream = function (getMinHeightStream) {
	return layout(function ($el, ctx, c) {
		$el.addClass('withMinHeightStream');
		var i = c(ctx.child());
		return {
			minWidth: i.minWidth,
			minHeight: $.isFunction(getMinHeightStream) ? getMinHeightStream(i) : getMinHeightStream,
		};
	});
};
var minHeightAtLeast = function (number) {
	if (!stream.isStream(number)) {
		number = stream.once(number);
	}
	return withMinHeightStream(function (i) {
		return stream.combine([
			i.minHeight,
			number,
		], function (mh, number) {
			return function (w) {
				return Math.max(mh(w), number);
			};
		});
	});
};

// // var atMostWindowBottom = function (c, distanceStream) {
// // 	distanceStream = distanceStream || stream.once(0);
// // 	return withMinHeightStream(function (instance, context) {
// // 		return stream.combine([instance.minHeight,
// // 							   context.top,
// // 							   context.topAccum,
// // 							   distanceStream,
// // 							   windowResize], function (mh, t, ta, distance) {
// // 								   return Math.min(mh, window.innerHeight - t - ta - distance);
// // 							   });
// // 	}, c);
// // };

var overlays = function (config) {
	return layout(function ($el, ctx, cs) {
		var is = cs.map(function (c) {
			return c(ctx.child());
		});
		var chooseLargest = function (streams) {
			return stream.combine(streams, function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(mathMax, 0);
			});
		};
		return {
			minWidth: stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(mathMax, 0);
			}),
			minHeight: stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return function (w) {
					return args.map(apply(w)).reduce(mathMax, 0);
				};
			}),
		};
	});
};


// // var table = function (config, css) {
// // 	config = config || {};
// // 	var padding = (config.padding || 0) * 2;
// // 	return div.all(stream.map(css, function (cs) {
// // 		return children(cs);
// // 	})).all([
// // 		componentName('table'),
// // 		wireChildren(function () {
// // 			var args = Array.prototype.slice.call(arguments);
// // 			var instance = args[0];
// // 			var context = args[1];
// // 			var iss = args.slice(2);

// // 			// we blindly assume all rows have the same number of columns

// // 			// set table min width
// // 			var maxMWs = stream.combine(iss.reduce(function (a, is) {
// // 				stream.push(a, stream.combine(is.map(function (i) {
// // 					return i.minWidth;
// // 				}), function () {
// // 					return Array.prototype.slice.call(arguments);
// // 				}));
// // 				return a;
// // 			}, []), function () {
// // 				var rowMWs = Array.prototype.slice.call(arguments);
// // 				return rowMWs.reduce(function (a, rowMWs) {
// // 					return stream.map(rowMWs, function (mw, i) {
// // 						return Math.max(a[i] || 0, mw);
// // 					});
// // 				}, []);
// // 			});
// // 			stream.map(maxMWs, function (maxMWs) {
// // 				var mw = maxMWs.reduce(function (a, mw) {
// // 					return a + mw + padding;
// // 				}, -padding);
// // 				stream.push(instance.minWidth, mw);
// // 			});

// // 			// set table min height
// // 			var rowMinHeights = iss.reduce(function (a, is) {
// // 				stream.push(a, stream.combine(is.map(function (i) {
// // 					return i.minHeight;
// // 				}), function () {
// // 					var args = Array.prototype.slice.call(arguments);
// // 					return args.reduce(mathMax, 0);
// // 				}));
// // 				return a;
// // 			}, []);
// // 			stream.combine(rowMinHeights, function () {
// // 				var mhs = Array.prototype.slice.call(arguments);
// // 				var mh = mhs.reduce(function (a, mh) {
// // 					return a + mh + padding;
// // 				}, -padding);
// // 				stream.push(instance.minHeight, mh);
// // 			});

// // 			return stream.map(rowMinHeights, function (mh, i) {
// // 				return stream.map(iss[i], function (_, index) {
// // 					return {
// // 						width: stream.map(maxMWs, function (maxMWs) {
// // 							return maxMWs[index];
// // 						}),
// // 						height: rowMinHeights[i],
// // 						top: stream.combine(rowMinHeights.slice(0, i).concat([stream.once(0)]), function () {
// // 							var mhs = Array.prototype.slice.call(arguments);
// // 							return mhs.reduce(function (a, mh) {
// // 								return a + mh + padding;
// // 							}, -padding);
// // 						}),
// // 						left: stream.map(maxMWs, function (maxMWs) {
// // 							return maxMWs.reduce(function (a, mw, mwI) {
// // 								return a + (mwI < index ? mw + padding : 0);
// // 							}, 0);
// // 						}),
// // 					};
// // 				});
// // 			});
// // 		}),
// // 	]);
// // };

// // var tabs = function (list, stream) {
// // 	var whichTab = stream || stream.once(0);
// // 	return stack({}, [
// // 		sideBySide({
// // 			handleSurplusWidth: centerSurplusWidth,
// // 		}, stream.map(list, function (item, index) {
// // 			return alignTBM({
// // 				bottom: toggleComponent([
// // 					item.tab.left,
// // 					item.tab.right,
// // 					item.tab.selected,
// // 				], stream.map(whichTab, function (i) {
// // 					if (index < i) {
// // 						return 0;
// // 					}
// // 					if (index > i) {
// // 						return 1;
// // 					}
// // 					return 2;
// // 				})).all([
// // 					link,
// // 					clickThis(function () {
// // 						stream.push(whichTab, index);
// // 					}),
// // 				]),
// // 			});
// // 		})),
// // 		componentStream(stream.map(whichTab, function (i) {
// // 			return list[i].content;
// // 		})),
// // 	]);
// // };

var matchStrings = function (stringsAndRouters) {
	return function (str) {
		for (var i = 0; i < stringsAndRouters.length; i++ ) {
			var stringAndRouter = stringsAndRouters[i];
			if (str.indexOf(stringAndRouter.string) === 0) {
				return stringAndRouter.router(str.substring(stringAndRouter.string.length));
			}
		}
	};
};

var routeToComponent = function (component) {
	return function () {
		return component;
	};
};

var routeToComponentF = function (componentF) {
	return function () {
		return componentF();
	};
};

var routeToFirst = function (routers) {
	return function (str) {
		for (var i = 0; i < routers.length; i++) {
			var result = routers[i](str);
			if (result) {
				return result;
			}
		}
	};
};

var routeMatchRest = function (f) {
	return function (str) {
		// wrapping in a promise catches any exceptions that f throws
		return promiseComponent(Q(str).then(f));
	};
};

var route = function (s, router) {
	return componentStream(stream.map(s, function (hash) {
		return router(hash);
	}));
};
