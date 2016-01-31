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

var Stream = {
	create: function () {
		var ended = false;
		
		var valueD = $.Deferred();

		var lastValue;
		var listeners = [];
		var children = [];

		var pushValue = function (v) {
			valueD.resolve(v);
			if (!ended && lastValue !== v) {
				lastValue = v;
				listeners.map(function (f) {
					return f(v);
				});
			}
		};

		return {
			lastValue: function () {
				return lastValue;
			},
			map: function (f) {
				var stream = Stream.create();
				children.push(stream);
				if (lastValue !== undefined) {
					stream.push(f(lastValue));
				}
				listeners.push(function (v) {
					stream.push(f(v));
				});
				return stream;
			},
			reduce: function (f, v) {
				var stream = Stream.once(v);
				children.push(stream);
				if (lastValue !== undefined) {
					stream.push(f(stream.lastValue(), lastValue));
				}
				listeners.push(function (v) {
					stream.push(f(stream.lastValue(), v));
				});
				return stream;
			},
			filter: function (f) {
				var stream = Stream.create();
				children.push(stream);
				if (lastValue !== undefined) {
					f(lastValue, stream.push);
				}
				listeners.push(function (v) {
					f(v, stream.push);
				});
				return stream;
			},
			onValue: function (f) {
				return this.map(function (v) {
					f(v);
					return true;
				});
			},
			promise: valueD.promise(),
			prop: function (str) {
				return this.map(function (v) {
					return v[str];
				});
			},
			delay: function (amount) {
				var stream = Stream.create();
				children.push(stream);
				this.map(function (v) {
					setTimeout(function () {
						stream.push(v);
					}, amount);
				});
				return stream;
			},
			end: function () {
				children.map(function (s) {
					s.end();
				});
				ended = true;
			},
			push: pushValue,
			pushAll: function (s) {
				this.onValue(function (v) {
					s.push(v);
				});
			},
			test: function () {
				var args = arguments;
				var err = new Error();
				setTimeout(function () {
					if (lastValue === undefined) {
						args;
						err;
						debugger;
					}
				}, 5000);
				return this;
			},
		};
	},
	once: function (v) {
		var stream = Stream.create();
		stream.push(v);
		return stream;
	},
	never: function () {
		return Stream.create();
	},
	combine: function (streams, f) {
		var arr = [];
		var stream = Stream.create();

		var running = false;
		var err = new Error();
		var tryRunF = function () {
			if (!running) {
				running = true;
				setTimeout(function () {
					err;
					running = false;
					for (var i = 0; i < streams.length; i++) {
						if (arr[i] === undefined) {
							return;
						}
					}
					stream.push(f.apply(null, arr));
				});
			}
		};
		
		streams.reduce(function (i, stream) {
			stream.onValue(function (v) {
				arr[i] = v;
				tryRunF();
			});
			return i + 1;
		}, 0);

		return stream;
	},
	all: function (streams, f) {
		return this.combine(streams, function () {
			f.apply(null, arguments);
			return true;
		});
	},
	combineObject: function (streamsObject) {
		var keys = Object.keys(streamsObject);
		var obj = {};
		var stream = Stream.create();
		
		var running = false;
		var tryRunF = function () {
			if (!running) {
				running = true;
				setTimeout(function () {
					running = false;
					for (var i = 0; i < keys.length; i++) {
						var key = keys[i];
						if (obj[key] === undefined) {
							return;
						}
					}
					stream.push($.extend({}, obj));
				});
			}
		};
		
		keys.map(function (key, i) {
			streamsObject[key].onValue(function (v) {
				obj[key] = v;
				tryRunF();
			});
		});

		return stream;
	},
	splitObject: function (obj) {
		var keys = Object.keys(obj);
		var streams = {};
		keys.map(function (key) {
			streams[key] = Stream.once(obj[key]);
		});
		return streams;
	},
	fromPromise: function (p, initialValue) {
		var stream = Stream.never();
		if (initialValue) {
			stream.push(initialValue);
		}
		p.then(function (v) {
			stream.push(v);
		});
		return stream;
	},
};

var child = function (component) {
	if (!component || !component.create) {
		console.error('faulty component');
	}
	return function (i) {
		i.child(component);
	};
};
var children = function (components) {
	components.map(function (component) {
		if (!component || !component.create) {
			console.error('faulty component');
		}
	});
	return function (i) {
		i.children(components);
	};
};
var wireChildren = function (f) {
	return function (i) {
		i.wireChildren = f;
	};
};

// add some syntactic sugar for calling and and all
var component = function (build) {
	var comp = {
		create: function (context) {
			var instance = this.build(context);

			instance.wireChildren = instance.wireChildren || function () {};

			var childComponents = instance.childComponentPs;
			var childContexts = [];
			var childInstances = childComponents.map(function (childComponent) {
				if ($.isArray(childComponent)) {
					var ctxs = [];
					var is = childComponent.map(function (c) {
						var ctx = instance.newCtx();
						ctxs.push(ctx);
						return c.create(ctx);
					});
					childContexts.push(ctxs);
					return is;
				}
				else {
					var ctx = instance.newCtx();
					childContexts.push(ctx);
					return childComponent.create(ctx);
				}
			});
			
			instance.childInstances = childInstances;
			
			var resultContexts = instance.wireChildren.apply(null, [instance, context].concat(childInstances)) || [];
			
			var applyResult = function (resultContext, childInstance, childContext) {
				resultContext = resultContext || {};
				if (resultContext.top) {
					resultContext.top.pushAll(childContext.top);
				}
				if (resultContext.left) {
					resultContext.left.pushAll(childContext.left);
				}
				if (resultContext.width) {
					resultContext.width.pushAll(childContext.width);
				}
				if (resultContext.height) {
					resultContext.height.pushAll(childContext.height);
				}
				if (resultContext.backgroundColor) {
					resultContext.backgroundColor.pushAll(childContext.backgroundColor);
				}
				if (resultContext.fontColor) {
					resultContext.fontColor.pushAll(childContext.fontColor);
				}
			};

			for (var i = 0; i < childInstances.length; i++) {
				var resultContext = resultContexts[i] || {};
				
				var childInstance = childInstances[i];
				var childContext = childContexts[i];
				
				if ($.isArray(childInstance)) {
					for (var j = 0; j < childInstance.length; j++) {
						applyResult(resultContext[j], childInstance[j], childContext[j]);
					}
				}
				else {
					applyResult(resultContext, childInstance, childContext);
				}
			}

			return instance;
		},
		build: build,
		and: function (f) {
			var that = this;
			var c = $.extend({}, that);
			c.build = function (context) {
				var i = that.build(context);
				var destroyF = f(i, context);
				var destroy = i.destroy;
				if (destroyF) {
					i.destroy = function () {
						var p = destroyF();
						if (p) {
							p.then(function () {
								destroy.apply(i);
							});
						}
						else {
							destroy.apply(i);
						}
					};
				}
				return i;
			};
			return c;
		},
		all: function (fs) {
			return fs.reduce(function (c, f) {
				return c.and(f);
			}, this);
		},
		compose: function (fs) {
			return fs.reduce(function (c, f) {
				return f(c);
			}, this);
		},
	};
	return comp;
};

// Takes a function that can be used with and or all.  Returns a
// function that can be used with compose.
var liftC = function (f) {
	return function (c) {
		return c.and(f);
	};
};

// Takes a function that takes arguments and returns a function that
// can be used with and or all.  Returns a function that takes those
// same arguments and returns a function that can be used with
// compose.
var liftCF = function (f) {
	return function () {
		var args = arguments;
		return function (c) {
			return c.and(f.apply(null, args));
		};
	};
};

var findOptimalHeight = function ($el, w) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('height', '')
		.css('width', w)
		.appendTo($sandbox);

	var height = parseInt($clone.css('height'));

	$clone.remove();
	return height;
};

var findMinWidth = function ($el) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('width', '')
		.css('height', '')
		.appendTo($sandbox);

	var width = parseInt($clone.css('width'));
	$clone.remove();

	return width;
};

var findScrollWidth = function ($el, w) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('width', w)
		.css('height', '')
		.appendTo($sandbox);

	var width = $clone[0].scrollWidth;
	$clone.remove();

	return width;
};

var findMinHeight = function ($el) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('width', '')
		.css('height', '')
		.appendTo($sandbox);
	
	var height = parseInt($clone.css('height'));
	
	$clone.remove();

	return height;
};

var updateDomFuncs = [];
var applyFunc = function (f) {
	f.$el.css(f.prop, f.value);
};
var runDomFuncs = function () {
	updateDomFuncs.map(applyFunc);
	updateDomFuncs = [];
	updateWindowWidth();
};
var updateDomFunc = function (func) {
	if (updateDomFuncs.length === 0) {
		setTimeout(runDomFuncs);
	}
	updateDomFuncs.push(func);
};
var el = function (name) {
	return component(function (context) {
		var minWidth = Stream.never();
		var minHeight = Stream.never();
		var updateMinHeight = function () {
			var mh = findMinHeight(i.$el);
			i.minWidth.push(mw);
			i.minHeight.push(mh);
		};

		var $el = $(document.createElement(name));
		if ($el.prop('tagName').toLowerCase() === 'div') {
			$el.css('pointer-events', 'none');
		}
		else {
			$el.css('pointer-events', 'initial');
		}
		$el.css('position', 'absolute');
		$el.css('visibility', 'hidden');
		context.$el.append($el);
		
		context.top.onValue(function (t) {
			updateDomFunc({
				$el: $el,
				prop: 'top',
				value: px(t),
			});
		});
		context.left.onValue(function (l) {
			updateDomFunc({
				$el: $el,
				prop: 'left',
				value: px(l),
			});
		});
		context.width.onValue(function (w) {
			updateDomFunc({
				$el: $el,
				prop: 'width',
				value: px(w),
			});
		});
		context.height.onValue(function (h) {
			updateDomFunc({
				$el: $el,
				prop: 'height',
				value: px(h),
			});
		});
		Stream.combine([context.width, context.height, context.top, context.left], function () {
			updateDomFunc({
				$el: $el,
				prop: 'visibility',
				value: '',
			});
		});
		context.backgroundColor.onValue(function (backgroundColor) {
			$el.css('background-color', colorString(backgroundColor));
		});
		context.fontColor.onValue(function (fontColor) {
			$el.css('color', colorString(fontColor));
		});

		var childComponentPs = [];
		
		var scrollStream = Stream.combine([context.scroll, context.top], function (scroll, top) {
			return scroll - top;
		});
		var topAccumStream = Stream.combine([context.topAccum, context.top], function (a, b) {
			return a + b;
		});
		var leftAccumStream = Stream.combine([context.leftAccum, context.left], function (a, b) {
			return a + b;
		});
		var brightnessStream = Stream.combine([context.brightness, context.backgroundColor], function (parentBrightness, c) {
			var brightness = colorBrightness(c);
			return c.a * brightness +
				(1 - c.a) * parentBrightness;
		});
		var newCtx = function (ctx) {
			return {
				$el: $el,
				scroll: scrollStream,
				topAccum: topAccumStream,
				top: Stream.never(),
				left: Stream.never(),
				leftAccum: leftAccumStream,
				width: Stream.never(),
				height: Stream.never(),
				backgroundColor: Stream.once(transparent),
				fontColor: Stream.never(),
				brightness: brightnessStream,
			};
		};
		
		return {
			$el: $el,
			optimalWidth: 0,
			minWidth: minWidth,
			minHeight: minHeight,
			newCtx: newCtx,
			childComponentPs: childComponentPs,
			child: function (component) {
				childComponentPs.push(component);
			},
			children: function (components) {
				childComponentPs.push(components);
			},
			destroy: function () {
				minWidth.end();
				minHeight.end();

				var allInstances = this.childInstances || [];
				for (var i = 0; i < allInstances.length; i++) {
					var instance = allInstances[i];
					if ($.isArray(instance)) {
						var instances = instance;
						instances.map(function (i) {
							i.destroy();
						});
					}
					else {
						instance.destroy();
					}
				}

				this.$el.remove();
			},
			updateDimensions: function (onlyNonzero) {
				var mw = findMinWidth(this.$el);
				var mh = findMinHeight(this.$el);
				// hack to do this - should really improve 'text' and
				// 'paragraph' functions, and call updateDimensions in
				// fewer places
				if (this.$el.prop('tagName') !== 'IMG') {
					if (!onlyNonzero || mw !== 0) {
						this.minWidth.push(mw);
					}
					if (!onlyNonzero || mh !== 0) {
						this.minHeight.push(mh);
					}
				}
			},
		};
	});
};


// div :: Component
var a = el('a');
var button = el('button');
var div = el('div');
var form = el('form');
var iframe = el('iframe');
var img = el('img');
var input = el('input');
var li = el('li');
var option = el('option');
var select = el('select');
var textarea = el('textarea');
var ul = el('ul');

var rootContext = function () {
	return {
		$el: $('body'),
		top: Stream.once(0),
		topAccum: Stream.once(0),
		left: Stream.once(0),
		leftAccum: Stream.once(0),
		scroll: windowScroll,
		width: windowWidth,
		height: Stream.never(),
		backgroundColor: Stream.once(white),
		fontColor: Stream.once(black),
		brightness: Stream.once(1),
	};
};

var rootComponent = function (component, ctx, setContainerSize) {
	var context = $.extend(rootContext(), ctx);
	var instance = component.create(context);

	instance.minHeight.pushAll(context.height);
	if (setContainerSize) {
		context.width.map(function (w) {
			context.$el.css('width', w);
		});
		context.height.map(function (h) {
			context.$el.css('height', h);
		});
	}
	return instance;
};
