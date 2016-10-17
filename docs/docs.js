$(function () {
  var hcj = window.hcj;

  var c = hcj.component;
  var casesplit = hcj.casesplit;
  var el = hcj.element;
  var stream = hcj.stream;

  var stack = c.stack;
  var docStack = c.stack({
	padding: 20,
  });

  var color = {
	lightGray: hcj.color.create({
	  r: 220,
	  g: 210,
	  b: 220,
	}),
	lighterGray: hcj.color.create({
	  r: 250,
	  g: 240,
	  b: 250,
	}),
	notBlack: hcj.color.create({
	  r: 10,
	  g: 0,
	  b: 10,
	}),
	red: hcj.color.create({
	  r: 255,
	  g: 0,
	  b: 0,
	}),
  };

  var font = {
	h1: {
	  family: 'sans-serif',
	  size: 40,
	  lineHeight: 1.2,
	  weight: 'bold',
	},
	h2: {
	  family: 'sans-serif',
	  lineHeight: 1.2,
	  size: 30,
	},
	h3: {
	  family: 'sans-serif',
	  lineHeight: 1.2,
	  size: 20,
	},
	p: {
	  approximateHeight: true,
	  family: 'sans-serif',
	  lineHeight: 1.2,
	  size: 15,
	},
	code: {
	  family: 'monospace',
	  lineHeight: 1.2,
	  size: 15,
	},
  };

  // takes a string with backticks
  // outputs a text config
  var processBackticks = function (str) {
	var state = false;
	return str.split('`').map(function (s) {
	  state = !state;
	  if (state) {
		return {
		  str: s,
		};
	  }
	  return {
		str: s,
		font: font.code,
	  };
	});
  };
  var text = function (font) {
	return function (str) {
	  return c.text(processBackticks(str), font);
	};
  };
  var h1 = text(font.h1);
  var h1m = text([font.h1, {
	measureWidth: true,
  }]);
  var h2 = text(font.h2);
  var h2m = text([font.h2, {
	measureWidth: true,
  }]);
  var h3 = text(font.h3);
  var h3m = text([font.h3, {
	measureWidth: true,
  }]);
  var p = text(font.p);
  var pm = text([font.p, {
	measureWidth: true,
  }]);
  var codeBlock = function (strs) {
	return c.wrap(el.pre)(stack(strs.map(function (str) {
	  return c.text(str, font.code);
	})));
  };

  var install = docStack([
	p("`git clone https://github.com/hcj-js/hcj.git`"),
	p("Use the files in the dist folder."),
  ]);

  var introduction = docStack([
	stack([
	  p("1. Define Components"),
	  p("2. Define More Components"),
	  p("3. Profit"),
	]),
	p("The browser is a common cross-platform code target.  It can make web requests, receive input through form elements, play sounds, render content with opengl, and much more.  These features are all available through DOM apis specified by the w3c.  DOM code is written in HTML, CSS, and/or Javascript, and can run on any platform that implements the browser."),
	p("Conveniently, the DOM's apis for element positioning are total.  This means it is impossible to write a page that sends your browser's renderer into an infinite loop; furthermore it's easy to live-edit pages in your browser's element inspector.  However, as total languages are not turing complete, and as any web developer will tell you, it gets tedious to write HTML and CSS by hand."),
	p("Therefore, many applications use Javascript frameworks like Ember, Backbone, Knockout, and others to display views based on application state and handle user input.  HCJ is such a javascript framework.  The reason it's called hcj.js is that it is intend as a pure javascript framework, automating the creation of HTML nodes and application of CSS styles.  By calling DOM apis, the HCJ framework allows for easy assembly of complex websites using pure Javascript, or alternately even pure JSON."),
	p("HCJ's main purpose is element positioning.  Using a small subset of CSS styles, it enables you to build websites composably, arranging elements however you want within the space available.  The core algorithm is simple: first minimum dimensions are sent from child to parent, second actual dimensions are sent from parent to child.  There is a standard library of components that enable simple reactive programming and responsive design, and you can write your own components and layouts."),
	p("Not all of the display methods available in CSS are implemented in HCJ's standard library.  Layouts that would correspond to float left and float right are not currently written.  Because HCJ is a javascript framework, page load times become noticable.  For SEO, we support rendering using PhantomJS; this can be done either server-side or as part of your build process."),
	p("These docs themselves are written using HCJ, of course.  The source is located at https://hcj-js.github.io/hcj/docs.js"),
  ]);

  var aLittleVocab = docStack([
	p("`component` - A function that takes a `context` and returns an `instance`.  The constructor for this type is a function called `component`, described in the Defining Components section."),
	p("`layout` - Any function that takes one or more `components` and returns a new `component`."),
	stack([
	  p("`context` - Object with the following nine properties:"),
	  p("&#8226; `$el`: Element to append the instance to."),
	  p('&#8226; `width`: Stream giving the width available to the instance.'),
	  p('&#8226; `height`: Stream giving the height available to the instance.'),
	  p('&#8226; `left`: Stream giving the left position of the instance relative to $el.'),
	  p('&#8226; `top`: Stream giving the top position of the instance relative to $el.'),
	  p('&#8226; `leftOffset`: Stream giving the left coordinate of $el relative to the page.'),
	  p('&#8226; `topOffset`: Stream giving the top coordinate of $el relative to the page.'),
	  p('&#8226; `onRemove()`: Signs up a callback to run when this instance is removed.'),
	  p('&#8226; `append()`: Takes a `component` and an optional `viewport`.  Constructs a context and renders the component.  Property added by the `component` constructor.'),
	]),
	stack([
	  p('`instance` - Object with the following four properties:'),
	  p('&#8226; `$el`: The root element of the instance, as a jquery selector.'),
	  p('&#8226; `minWidth`: Stream giving the instance\'s min width'),
	  p('&#8226; `minHeight`: Stream of functions that, given a width, return the min height of the instance at that width'),
	  p("&#8226; `remove()`: Runs its context's onRemove methods, and removes $el from the dom"),
	]),
	stack([
	  p("`viewport` - Object passed into the `context::append` method.  It has the following optional properties, all streams:"),
	  p("&#8226; `$el`: Element to append instance to.  Default value is the instance's root element."),
	  p("&#8226; `width`: Width of the viewport, as a number.  If present, used instead of this component's width."),
	  p("&#8226; `height`: Height of the viewport.  If present, used instead of this component's height."),
	  p("&#8226; `left`: Left coordinate of the viewport.  If present, used instead of 0."),
	  p("&#8226; `top`: Top coordinate of the viewport.  If present, used instead of 0."),
	  p("&#8226; `widthCss`: String value to use for the child component's width property.  If present, used instead of either mapping (+ 'px') over the viewport's `width` stream if present or using '100%'.  Needed for css transitions to work correctly."),
	  p("&#8226; `heightCss`: String value to use for the child component's width property.  If present, used instead of either mapping (+ 'px') over the viewport's `width` stream if present or using '100%'."),
	  p("&#8226; `topCss`: String value to use for the child component's width property.  If present, used instead of either mapping (+ 'px') over the viewport's `width` stream if present or using '0px'."),
	  p("&#8226; `leftCss`: String value to use for the child component's width property.  If present, used instead of either mapping (+ 'px') over the viewport's `width` stream if present or using '0px'."),
	]),
  ]);

  var libraryModules = docStack([
	p('The HCJ library pollutes the global window object with the `hcj` object.  Each module is a property of this object.  HCJ modules include:'),
	stack([
	  p('&#8226; component: Functions that return components.'),
	  p('&#8226; element: Some helper methods for creating custom components.'),
	  p('&#8226; rootComponent: The function that bootstraps a component onto a page.'),
	  p('&#8226; stream: The hcj stream library.'),
	]),
  ]);

  var definingComponents = docStack([
	p("The `hcj.component.component` function is used to define components.  It is a curried function that takes two arguments.  The first is the component's tag name.  The second is a `build` method, run each time the component is rendered."),
	p("Four arguments are provided to the build method.  The first, `$el`, the created root element of the component as a JQuery selector.  The second, `context`, is the context that the component is being rendered into.  The third and fourth, `pushMeasureWidth` and `pushMeasureHeight`, may be used optionally to imperatively push values into the instance's `minWidth` and `minHeight` streams."),
	p("The build method may return an object with two properties: `minWidth` and `minHeight`.  The `minWidth` property is a stream of numbers, and the `minHeight` property is a stream of functions which take a width and return the required height at that width.  You should either return these properties OR call the `pushMeasureWidth` and `pushMeasureHeight` functions, not both."),
	p("The `window.hcj.element` namespace gives you the `component` constructor applied to many common tag names such as `a` and `div`."),
	p("Just so you know, internally the `pushMeasureWidth` function clones the root element of the instance, append the clone to a hidden sandbox, removes any width property, measures the clone's width, removes the clone from the sandbox, and pushes the width into the `minWidth` stream.  Similarly, the `pushMeasureHeight` pushes a function into the `minHeight` stream which takes a width, clones the root element of the instance, appends the clone to a sandbox, removes any height property, sets the width to the provided value, measures the height, removes the clone, and returns the height."),
	p("For example:"),
	codeBlock([
	  "// captcha component",
	  "&nbsp;",
	  "var el = window.hcj.element;",
	  "&nbsp;",
	  "var captcha = el.div(function ($el, context, pushMeasureWidth, pushMeasureHeight) {",
	  "  var someCaptcha = SomeCaptcha.render($el).then(function () {",
	  "    pushMeasureWidth();",
	  "    context.onRemove(function () {",
	  "      someCaptcha.remove();",
	  "    });",
	  "  });",
	  "  pushMeasureWidth();",
	  "  pushMeasureHeight();",
	  "});",
	]),
	p("This component runs pushMeasureWidth on render for programmer convenience and page load time.  Once the captcha is loaded, the width is measured again."),
  ]);

  var renderingComponents = docStack([
	p('To render a component, pass it to the `rootComponent` function.  For example:'),
	codeBlock([
	  "var c = hcj.component;",
	  "var color = hcj.color;",
	  "&nbsp;",
	  "var page = c.all([",
	  "  c.margin(10),",
	  "  c.backgroundColor(color.create({",
	  "    r: 200,",
	  "    g: 253,",
	  "    b: 53,",
	  "  }),",
	  "])(c.text('Hello World'));",
	  "&nbsp;",
	  "var rootInstance = hcj.rootComponent(page);",
	]),
	p("Currently, it's only possible to render a component by making it a root component of the page.  Multiple root components may be used to display some modal dialogs."),
	p("Font loading is important.  The DOM does not contain any APIs for font loading, but there are several font loaders on the internet."),
  ]);

  var definingLayouts = docStack([
	p("A layout is any function that takes components as arguments and returns a component.  The `hcj.component.layout` function is a helper method for making layouts.  It should almost always be used - it applies pointer-events: none and overflow: hidden to the layout element.  You pass it one argument, the layout's `buildLayout` function."),
	p("The arguments to your `buildLayout` function are somewhat dynamic.  The first two arguments, $el and context, are passed through from the layout component's own `build` method.  The remaining arguments are the child components, as they are passed in to the layout."),
	p("The `buildLayout` function is not passed `pushMeasureWidth` and `pushMeasureHeight` must return an object with `minWidth` and `minHeight` streams."),

	h2('Very Basic Example'),
	p('`someLayout :: Component -> Component`'),
	p("Here is an archetypcial example of a layout.  It wraps a component in a div and pushes it down by five pixels."),
	codeBlock([
	  "var layout = hcj.component.layout",
	  "&nbsp;",
	  "var someLayout = layout(function ($el, ctx, c) {",
	  "  var viewport = {",
	  "	top: stream.create(5),",
	  "  };",
	  "  return ctx.append(c, viewport);",
	  "});",
	]),

	h2('Basic Example - Purple Margin'),
	p('`purpleMargin :: Component -> Component`'),
	p("Let's say we want to define a layout that adds a 10px purple margin.  This means the width and height of the child component will decrease by 20 pixels."),
	p("The `context.child` function returns a context.  Now, here's the code for `purpleMargin`.  First, the background color is set.  Second, the child instance is defined.  Last, the layout's min size info is returned."),
	codeBlock([
	  "var purpleMargin = layout(function ($el, context, c) {",
	  "  $el.css('background-color', '#FF00FF');",
	  "&nbsp;",
	  "  var instance = context.append(c, {",
	  "    width: stream.map(context.width, function (w) {",
	  "      return w - 20;",
	  "    }),",
	  "    height: stream.map(context.height(function (h) {",
	  "      return h - 20;",
	  "    }),",
	  "    top: stream.once(10),",
	  "    left: stream.once(10),",
	  "  });",
	  "&nbsp;",
	  "  return {",
	  "    minWidth: stream.map(instance.minWidth, function (mw) {",
	  "      return mw + 20;",
	  "    }),",
	  "    minHeight: stream.map(instance.minHeight, function (mh) {",
	  "      return function (w) {",
	  "        return mh(w - 20) + 20;",
	  "      };",
	  "    }),",
	  "  };",
	  "});",
	]),

	h2('Example - Stack'),
	p("`stack :: Array(Component) -> Component`"),
	p("Say we want to put components into a vertical stack.  In this example, the `buildLayout` function is called with an array of components because the `stack` is called with an array of components.  Layouts can be called with one or more individual components, arrays, arrays of arrays, etc."),
	p("In this code, first we map over the components argument to create an array of child contexts, and an array of instances.  Next, we create two variables - streams of all the min widths, and all the min heights, of the instances."),
	p("Then we combine some streams together to give tops and heights to the instances."),
	p("Last we return the min width and min height of the stack.  The min width of the stack is set to the maximum of the min widths of the instances, and the min height is set to be the sum of the min heights of the instances."),
	codeBlock([
	  "var stack = layout(function ($el, context, cs) {",
	  "  var viewports = [];",
	  "  var instances = [];",
	  "  cs.map(function (c, index) {",
	  "    var viewport = {",
	  "      top: true,",
	  "      height: true,",
	  "    };",
	  "    viewports.push(viewport);",
	  "    instances.push(context.append(c, viewport));",
	  "  });",
	  "&nbsp;",
	  "  var minWidthsS = stream.all(instances.map(function (i) {",
	  "    return i.minWidth;",
	  "  }));",
	  "  var minHeightsS = stream.all(instances.map(function (i) {",
	  "    return i.minHeight;",
	  "  }));",
	  "&nbsp;",
	  "  // rather imperative",
	  "  stream.combine([",
	  "    context.width,",
	  "    context.height,",
	  "    minHeightsS,",
	  "  ], function (w, h, mhs) {",
	  "    var top = 0;",
	  "    mhs.map(function (mh, index) {",
	  "      var viewport = viewports[index];",
	  "      var height = mh(w);",
	  "      stream.push(viewport.top, top);",
	  "      stream.push(viewport.height, height);",
	  "      top += h;",
	  "    });",
	  "  });",
	  "&nbsp;",
	  "  return {",
	  "    minWidth: stream.map(minWidthsS, function (mws) {",
      "      return mws.reduce(function (a, b) {",
	  "        return Math.max(a, b);",
	  "      }, 0);",
	  "    }),",
	  "    minHeight: stream.combine([",
	  "      context.width,",
	  "      minHeightsS,",
	  "    ], function (w, mhs) {",
	  "      return mhs.map(function (mh) {",
	  "        return mh(w);",
	  "      }).reduce(function (a, b) {",
	  "        return a + b;",
	  "      }, 0);",
	  "    }),",
	  "  };",
	  "});",
	]),
  ]);

  var standardLibraryElements = docStack([
  ]);

  var standardLibraryComponents = docStack([
	p('Here, in no particular order, are the primitive components.  These are defined as described in the Defining Components section.  They are found in the `window.hcj.component` object.'),

	h2('text'),
	p('`text :: ([SpanConfig], TextConfig) -> Component`'),
	p("The `text` function has a rather complex API."),
	p('It is a two-argument function.  The first argument can either be one `SpanConfig` or an array of `SpanConfigs`.  The second argument is an optional `TextConfig`.'),
	p('A `SpanConfig` may be either a string, or an object with the following properties (all optional except `str` which is required):'),
	stack([
	  p("&#8226; `str`: The string to show."),
	  p("&#8226; `size`: font size"),
	  p("&#8226; `weight`: font weight"),
	  p("&#8226; `family`: font family"),
	  p("&#8226; `color`: font color as an object with `r`, `g`, `b`, and `a` properties"),
	  p("&#8226; `shadow`: font shadow"),
	  p("&#8226; `spanCSS`: Array of objects with `name` and `value` properties.  Additional CSS styles to apply to the span."),
	]),
	p('The `TextConfig` parameter applies globally to all spans within the text component.  It can have all of the same properties as a `SpanConfig`, minus `str`, plus some additional properties:'),
	stack([
	  p("&#8226; `align`: text align"),
	  p("&#8226; `minWidth`: causes the text's width not to be measured; this number is used instead"),
	  p("&#8226; `minHeight`: causes the text's height not to be measured; this number is used instead"),
	  p("&#8226; `oneLine`: causes the text's height not to be measured.  It is assumed to be one line tall.  Its min height value is calculated from its font size and line height."),
	]),
	p("Each time dimensions may change, `text` first approximates its min width and min height by assuming that a character has a width of 0.5 times its height.  Then, it performs the above operation.  If oneLine is set, then height approximation is not performed."),
	p('Examples:'),
	codeBlock([
	  "var c = window.hcj.component;",
	  "&nbsp;",
	  "var hello = c.text('Hello');",
	  "&nbsp;",
	  "var largeText = c.text('Large Text', {",
	  "  size: '50px',",
	  "});",
	  "&nbsp;",
	  "var spans = c.text([{",
	  "  str: 'SANTIH',",
	  "  weight: 'bold',",
	  "}, {",
	  "  str: '_OEFYCL_OE',",
	  "  family: 'Lato',",
	  "}]);",
	]),

	h2('image'),
	p('`image :: ImageConfig -> Component`'),
	p("An `ImageConfig` may have the following properties, all optional except `src` which is required.  By default, an image's min width is set to its natural width, and its min height is set to maintain aspect ratio."),
	stack([
	  p("&#8226; `src`: image source"),
	  p("&#8226; `minWidth`: if present, min width is set to this number instead of the image's natural width"),
	  p("&#8226; `minHeight`: if present, min width of image is set to the quotient of this number and the image's aspect ratio"),
	]),
	p('Note: Images will almost always stretch.  To solve this, wrap them in the `keepAspectRatio` layout.'),

	h2('bar.h, bar.v, and rectangle'),
	stack([
	  p('`bar.h :: Number -> Component`'),
	  p('`bar.v :: Number -> Component`'),
	  p('`rectangle :: {[h, x]: Number, [v, y]: Number} -> Component`'),
	]),
	p("`bar.h` and `bar.v` create horizontal and vertical separators of the size you specify.  `rectangle` takes an object with `h` and `v` or `x` and `y` properties, and creates a rectangle of that size."),

	h2('empty'),
	stack([
	  p('`empty :: String -> Component`'),
	  p('`nothing :: Component`'),
	]),
	p('The `empty` function takes a tag name and returns a component with zero width and zero height using that tag name.'),
	p('The `nothing` component is defined as `empty("div")`.'),
  ]);

  var standardLibraryLayouts = docStack([
	p('Here are some common standard library layouts.  Some take optional config objects.  These can be called either curried or not, i.e. you can pass in only the config object and receive a function from components to components.'),

	h2('alignHorizontal (alignH, alignLRM)'),
	stack([
	  p('`alignHorizontal :: {l: Component, r: Component, m: Component} -> Component`'),
	  p('`alignHLeft :: Component -> Component`'),
	  p('`alignHRight :: Component -> Component`'),
	  p('`alignHMiddle :: Component -> Component`'),
	]),
	p('Takes an object with `l`, `r`, and/or `m` properties.  Aligns components left, right, and middle.'),
	p('Example:'),
	codeBlock([
	  "var c = window.hcj.component;",
	  "&nbsp;",
	  "var logo = c.text('logo');",
	  "var menu = c.text('menu');",
	  "&nbsp;",
	  "var header = c.alignH({",
	  "  l: logo,",
	  "  r: menu,",
	  "});",
	]),

	h2('alignVertical (alignV, alignTBM)'),
	stack([
	  p('`alignVertical :: {t: Component, b: Component, m: Component} -> Component`'),
	  p('`alignVTop :: Component -> Component`'),
	  p('`alignVBottom :: Component -> Component`'),
	  p('`alignVMiddle :: Component -> Component`'),
	]),
	p('Takes up to three components.  Aligns them top, bottom, and middle within the space available.  Three functions are also provided that operate on just one component each.'),

	h2('componentStream'),
	stack([
	  p('`componentStream :: Stream(Component) -> Component`'),
	  p('`promiseComponent :: (Promise(Component), Component) -> Component`'),
	]),
	p('`componentStream` takes an hcj stream of components and returns a component that displays the most recent one.'),
	p('`promiseComponent` takes a promise that resolves to a component and an optional initial component to display, and returns a corresponding componentStream.'),

	h2('grid'),
	p('`grid :: GridConfig -> Array(Component) -> Component`'),
	p('A mobile responsive grid layout.  Components are placed into rows.'),
	stack([
	  p("&#8226; `padding`: padding amount between components"),
	  p("&#8226; `surplusWidthFunc`: splits surplus width among components in each row; see `sideBySide`"),
	  p("&#8226; `surplusHeightFunc`: splits surplus hegiht among grid rows; see `stack`"),
	  p("&#8226; `useFullWidth`: if set, the grid's min width is computued as the sum of the min widths of the child components, rather than as the largest of the min widths of the child components"),
	]),

	h2('keepAspectRatio'),
	p('`keepAspectRatio :: KeepAspectRatioConfig -> Component -> Component`'),
	p('Behaves much like the `background` CSS property.'),
	p("Positions a component in a space, maintaining its aspect ratio.  Will xhibit strange behavior when the child component's aspect ratio is not constant."),
	p('A `KeepAspectRatioConfig` may have any of the following properties:'),
	stack([
	  p("&#8226; fill: If set, the child component covers the space and may be cropped.  If not set, the child component is contained within the space and there may be margins."),
	  p("&#8226; top: If set, the top of the child component is aligned with the top of the keepAspectRatio component."),
	  p("&#8226; bottom: If set, the bottom of the child component is aligned with the bottom of the keepAspectRatio component."),
	  p("&#8226; left: If set, the left of the child component is aligned with the left of the keepAspectRatio component."),
	  p("&#8226; right: If set, the left of the child component is aligned with the left of the keepAspectRatio component."),
	]),

	h2('largestWidthThatFits'),
	p('`largestWidthThatFits :: Array(Component) -> Component`'),
	p('Chooses the largest-width component that fits inside its own given width, among the components passed in.  (Currently will crash if none fit.)'),
	p("(See kitchen skin.)"),

	h2('overlays'),
	p('`overlays :: OverlaysConfig -> Array(Component) -> Component`'),
	p('Places components one directly on top of another.'),
	p('The OverlaysConfig is not currently used.'),

	h2('promiseComponent'),
	p('see componentStream'),

	h2('sideBySide'),
	p('`sideBySide :: SideBySideConfig -> Array(Component) -> Component`'),
	p('Puts components directly side by side.'),
	p('A `SideBySideConfig` may have the following properties:'),
	stack([
	  p("&#8226; `padding`: Padding amount between components."),
	  p("&#8226; `surplusWidthFunc`: Similar to a `stack`, a `sideBySide` can have surplus width.  A `surplusWidthFunc` function takes two arguments.  The first is the actual width of the `sideBySide`.  The second is an array of objects with `left` and `width` properties, giving the computed left coordinate and min width of each child within the stack.  It returns a new array of objects with `left` and `width` coordinates."),
	]),

	h2('stack'),
	p('`stack :: StackConfig -> Array(Component) -> Component`'),
	p('Puts components in a stack, one on top of another.'),
	p('A `StackConfig` may have the following properties:'),
	stack([
	  p("&#8226; `padding`: Padding amount between components."),
	  p("&#8226; `surplusHeightFunc`: There can be surplus height, i.e. the actual height of the stack can be greater than the minimim heights of all of the children.  A `surplusHeightFunc` function takes two arguments.  The first argument is the actual height of the stack (in pixels).  The second argument is an array of objects with `top` and `height` properties, giving the computed top coordinate and min height of each child within the stack (in pixels).  It returns a new array of objects with `top` and `height` properties."),
	]),
  ]);

  var standardLibraryComponentModifiers = docStack([
	p('While most layouts in the previous section multiple components and return a component, many layouts take exactly one component and return a component.  Much styling and functionality can be added by applying these layouts.'),
	p('These are found in the `window.hcj.component` object.'),

	h2('all'),
	p('`all :: Array(Component -> Component) -> Component -> Component`'),
	p('The `hcj.component.all` function is listed first because it is real good.  It performs function composition, i.e. applies multiple functions, one after another.'),
	p('Example:'),
	codeBlock([
	  "var title = all([",
	  "  margin({",
	  "    all: 10,",
	  "  }),",
	  "  border(color.white, {",
	  "    all: 1,",
	  "  }),",
	  "])(text('Star Trek'));",
	]),
	p('Another example:'),
	codeBlock([
	  "var prettyBorder = all([",
	  "  border(white, {",
	  "    all: 1,",
	  "  });",
	  "  border(gray, {",
	  "    all: 1,",
	  "  });",
	  "  border(black, {",
	  "    all: 1,",
	  "  });",
	  "]);",
	  "&nbsp;",
	  "var button = all([",
	  "  margin({",
	  "    all: 10,",
	  "  }),",
	  "  prettyBorder,",
	  "])(text('Submit'));",
	]),

	h2('$$'),
	stack([
	  p('`$$ :: ($ -> IO ()) -> Component -> Component`'),
	  p('`$addClass :: String -> Component -> Component`'),
	  p('`$attr :: (String, String) -> Component -> Component`'),
	  p('`$css :: (String, String) -> Component -> Component`'),
	  p('`$on :: (String, (Event -> IO ())) -> Component -> Component`'),
	  p('`$prop :: (String, String) -> Component -> Component`'),
	]),
	p('`hcj.component.$$` takes a function which takes the JQuery selector of an instance and performs arbitrary activity.  Returns a function from a component to a component.'),
	p('The rest are defined using `$$`.'),

	h2('and'),
	p('`and :: ((Instance, Context) -> IO ()) -> Component -> Component`'),
	p('The `hcj.component.and` function takes a function which takes an instance and a context, and returns a function from a component to a component.  Example:'),
	codeBlock([
	  "var turnBlue = and(function (i) {",
	  "  i.$el.css('background-color', 'blue');",
	  "});",
	]),

	h2('backgroundColor'),
	p('`backgroundColor :: BackgroundColorConfig -> Component -> Component`'),
	p('Applies a background color and a font color to a component'),
	stack([
	  p('A `BackgroundColorConfig` is an object or a stream of objects.  If it is an object, then its properties may be streams instead of single values.  In any case, it has the following properties:'),
	  p("&#8226; background: background color"),
	  p("&#8226; font: font color"),
	  p("&#8226; backgroundHover: background color on hover"),
	  p("&#8226; fontHover: font color on hover"),
	]),

	h2('border'),
	p('`border :: Color -> BorderConfig -> Component -> Component`'),
	p('Adds a colored border around a component.'),
	p('A `Color` is an object with `r`, `g`, `b`, and `a` properties.  (see below)'),
	stack([
	  p('A `BorderConfig` is an object with the following properties:'),
	  p("&#8226; all: border to apply to all sides"),
	  p("&#8226; top: border to apply to the top"),
	  p("&#8226; bottom: border to apply to bottom"),
	  p("&#8226; left: border to apply to the left side"),
	  p("&#8226; right: border to apply to the right side"),
	  p("&#8226; radius: border radius"),
	]),

	h2('crop'),
	p('Crops a component down to a proportion of its size.'),
	p('`crop :: CropConfig -> Component -> Component`'),
	stack([
	  p("A `CropConfig` can either be a number, which is treated as an object with an 'all' property of that value, or an object with any of the following properties:"),
	  p("&#8226; all: crop percentage on all sides"),
	  p("&#8226; top: crop percentage from the top"),
	  p("&#8226; bottom: crop percentage from the bottom"),
	  p("&#8226; left: crop percentage from the left"),
	  p("&#8226; right: crop percentage from the right"),
	]),

	h2('link'),
	p('`link :: Component -> Component`'),
	p('Applies a certain hover effect.'),

	h2('linkTo'),
	p('`linkTo :: LinkConfig -> Component -> Component`'),
	p('Wraps component it in an `a` tag with a particular href.'),
	stack([
	  p('A `LinkConfig` is an object with the following properties:'),
	  p("&#8226; href: href property (required)"),
	  p("&#8226; target: link target"),
	]),

	h2('margin'),
	p('`margin :: MarginConfig -> Component -> Component`'),
	p('Adds some space around a component.'),
	stack([
	  p('A `MarginConfig` may have any of the following properties:'),
	  p("&#8226; all: margin to apply to all sides"),
	  p("&#8226; top: margin to apply to the top"),
	  p("&#8226; bottom: margin to apply to bottom"),
	  p("&#8226; left: margin to apply to the left side"),
	  p("&#8226; right: margin to apply to the right side"),
	]),

	h2('minHeight'),
	p('`minHeight :: MinHeight -> Component -> Component`'),
	p('`minHeightAtLeast :: MinHeightAtLeast -> Component -> Component`'),
	p('Overrides the min height of a component.'),
	p('The `MinHeight` can be a function from numbers to numbers, a stream of functions from numbers to numbers, or a function that takes the `Instance` and `Context` and returns a stream of functions from numbers to numbers.'),
	p('minHeightAtLeast takes a number or a stream of numbers, and sets the min height of a component to be at least that great.'),

	h2('minWidth'),
	p('`minWidth :: MinWidth -> Component -> Component`'),
	p('`minWidthAtLeast :: MinWidthAtLeast -> Component -> Component`'),
	p('Overrides the min width of a component.'),
	p('The `MinWidth` can be a number, a stream of numbers, or a function that takes the `Instance` and `Context` and returns a stream of numbers.'),
	p('minWidthAtLeast takes a number or a stream of numbers, and sets the min width of a component to be at least that great.'),

	h2('onThis'),
	stack([
	  p('`onThis :: String -> (Event -> IO ()) -> Component -> Component`'),
	  p('`changeThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`clickThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`keydownThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`keyupThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mousedownThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mousemoveThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mouseoverThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mouseoutThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mouseupThis :: (Event -> IO ()) -> Component -> Component`'),
	]),
	p('`onThis` is a curried form of the `$on` function.  Additional functions are also provided where it is called with its first argument.'),
  ]);

  var standardLibraryStreams = docStack([
	p("All programming is asynchronous.  There is the code that's run when your computer boots, and then there are interrupts."),
	p("HCJ provides its own slimy little stream implementation.  The reasons for choosing this over another implementation like Bacon or Reactive Extensions are speed and control over the stream semantics."),
	p("An hcj stream (or just, stream) is nothing more than a way to get the most recent available data from point A into point B.  A stream is an object with two properties:"),
	stack([
	  p("&#8226; lastValue: the most recent data point"),
	  p("&#8226; listeners: array of functions that are run when there is new data (private member, do not access)"),
	]),
	p('Streams can be defined either declaratively or imperatively.  That is, you can let a stream be an operation applied to other streams, or you can just create it and push to it.  Unlike in other stream implementations:'),
	stack([
	  p("&#8226; The most recent data point is accessible through the `lastValue` property, and may be read off at your leisure."),
	  p("&#8226; If you push one value through a stream multiple times, it will only be hanlded the first time."),
	  p("&#8226; If you push multiple values through a stream quickly (synchronously), intermediate values will be skipped."),
	]),
	p('So, the internal stream library is certainly not for aggregating financial transactions, but rather for maintaining output state in terms of input state as lightly as possible.'),
	p('Note: to skip intermediate values, `setTimeout` calls are made.  When streams are defined in terms of each other, multiple `setTimeout` calls are made in sequence.  If you want to run some code after all stream operations have settled, you must call `stream.defer` instead of `setTimeout`.  If you want to defer the execution of a block of code and then push to a stream, call `stream.next` instead of `setTimeout`.  Otherwise, `stream.defer` calls will not know to wait for your code.'),

	p('Here are the stream methods:'),

	h2('combine'),
	p('`combine : map Stream ts -> (ts -> x) -> Stream x`'),
	p('Takes an array of streams, and a function.  Result stream is the application the function onto the latest values from all input streams.'),

	h2('combineInto'),
	p('`combine : map Stream ts -> (ts -> x) -> Stream x -> IO ()`'),
	p('Imperative form of `combine`.  Takes an array of streams, a function, and a target stream, and pushes all values into the target stream.'),

	h2('combineObject'),
	p('`combineObject : {a: Stream x, b: Stream y, ...} -> Stream {a: x, b: y, ...}`'),
	p('Takes an object whose properties are streams, returns a stream of objects.'),

	h2('create'),
	p('`create : a -> Stream a`'),
	p('Creates a stream, and (optionally) initializes it using the argument passed in.  The `push` or `pushAll` functions can be used to push in additional points into the stream.'),
	p('Example:'),
	codeBlock([
	  "var onceFiftyS = stream.create(50);",
	]),

	h2('debounce'),
	p('`debounce : Stream a -> Number -> Stream a`'),
	p('Pushes to output stream no more quickly than the given number of milliseconds.'),

	h2('delay'),
	p('`delay : Stream a -> Number -> Stream a`'),
	p('Pushes to output stream after waiting the given number of milliseconds.'),

	h2('filter'),
	p('`filter : Stream a -> (a -> Bool) -> Stream a`'),
	p('Returns a stream that includes only the values for which the provided predicate returns something truthy.'),

	h2('fromPromise'),
	p('`fromPromise : Promise a -> a -> Stream a`'),
	p('Takes a promise, and an optional initial value.  Returns a stream (optionally initialized with the initial value), which receives the value from the promise when it resolves.'),

	h2('map'),
	p('`map : Stream a -> (a -> b) -> Stream b'),
	p('Applies a function to each data point of a stream.'),
	p('Example:'),
	codeBlock([
	  "var centsS = stream.create();",
	  "var dollarAmountS = stream.map(centsS, function (cents) {",
	  "  return Math.floor(cents / 100) + '.' + (cents % 100);",
	  "})",
	]),

	h2('promise'),
	p('`promise : Stream a -> Promise a`'),
	p('Returns a promise that resolves as soon as there is a data point in the stream.'),

	h2('prop'),
	p('`prop : Stream {p: t} -> (p : String) -> Stream t`'),
	p('Maps over a stream of objects, accessing the specified key.  That type signature uses some made-up notation for polymorphic row types.'),

	h2('push'),
	p('`push : Stream a -> a -> IO ()`'),
	p('Pushes a value onto a stream.'),
	p('Example:'),
	codeBlock([
	  "var clickS = stream.create();",
	  "$el.on('click', function (ev) {",
	  "  stream.push(clickS, ev)",
	  "})",
	]),

	h2('pushAll'),
	p('`pushAll : Stream a -> Stream a -> IO ()`'),
	p('Pushes all values from one stream onto another stream.'),
	p('Example:'),
	codeBlock([
	  "var sourceS = stream.create();",
	  "var targetS = stream.create();",
	  "stream.pushAll(sourceS, targetS);",
	]),

	h2('reduce'),
	p('`reduce : Stream a -> (b -> a -> b) -> b -> Stream b'),
	p('Applies a function to each data point of a stream, keeping a running total.  Like array reduce, but the reduce callback has the orders of the arguments reversed.'),
	p('Example:'),
	codeBlock([
	  "var clickS = stream.create();",
	  "var countClicksS = stream.reduce(clickS, function (x)",
	  "  return x + 1;",
	  "}, 0);",
	]),

	h2('splitObject'),
	p('`splitObject : {a: x, b: y, ...} -> {a: Stream x, b: Stream y, ...}`'),
	p('Takes an object, returns an object where each property is a stream initialized with the value from the input object.'),
  ]);

  var standardLibraryForms = docStack([
	h2('HCJ Forms'),
	p("Forms documentation coming soon"),
	// p("Hcj provides some functionality for generating web forms.  To be frank it's a little haphazard, and will be replaced by something cleaner in the future.  However it definitely works."),

	// h2("hcj.forms.formFor"),
	// p("The formFor function is for generating forms.  It is curried, taking several parameters in sequence.  These paramaters are:"),
	// stack([
	//   p('The form field types and names'),
	//   p('Default values for the form fields'),
	//   p('The on submit function'),
	//   p('Form style'),
	//   p('Display callback'),
	// ]),
	// p("The field types and names are two parameters"),
  ]);

  var standardLibraryColors = docStack([
	p('The standard library has a standard notation for colors.  A `Color` is an object with all of the following properties:'),
	p('These functions are found in `window.hcj.color'),
	stack([
	  p("&#8226; r: red value from 0 to 255"),
	  p("&#8226; g: green value from 0 to 255"),
	  p("&#8226; b: blue value from 0 to 255"),
	  p("&#8226; a: alpha value from 0 to 1"),
	]),

	h2('color'),
	p('`Color` constructor.  Easier than describing further, is pasting the code:'),
	codeBlock([
	  "var color = function (c) {",
	  "  return {",
	  "    r: c.r || 0,",
	  "    g: c.g || 0,",
	  "    b: c.b || 0,",
	  "    a: c.a || 1,",
	  "  };",
	  "};",
	]),

	h2('colorString'),
	p('`Color` destructor.  Takes a color, returns string using rgba format.'),
  ]);

  var standardLibraryJso = docStack([
	p("Jso is a subset of json that can be evaluated as a functional programming language."),
	p("Its intended use is to represent websites as a data structures, which can be evaluated both server-side to generate an initial render as well as SEO content, as well as client-side to produce the full interactive page."),
	p("More documentation on Jso and reference implemenattions coming soon."),
  ]);

  var csIsNotAFunction = docStack([
	p("Might be the most common error message you're going to get using this library.  Very uninformative, sorry."),
  ]);

  var version2 = docStack([
	p('Remove JQuery dependency, making hcj smaller and more agnostic'),
	p('Add a Test Page testing the standard library, as well as documenting how to use it'),
	p('Document Jso (see https://github.com/jeffersoncarpenter/casesplit)'),
	p('Add some float left and float right functionality'),
	p('Automatically apply CSS transitions / make sure they work'),
	p('See if using canvas to measure text is faster than placing a DOM element in a sandbox'),
	p('(maybe) CSS approximations of components and layouts for server-side rendering'),
  ]);

  var support = docStack([
	p("Join #hcj on Freenode.  Our community is small but active."),
	p('<iframe src="https://kiwiirc.com/client/irc.freenode.net/?&theme=basic#hcj" style="border:0; width:100%; height:450px;"></iframe>'),
  ]);

  var testPage = docStack([
	p("Demo of the standard library components."),

	h2("text"),
	p("Display all kinds of text."),
	c.text("big text", {
	  size: 50,
	}),
	c.text("little text", {
	  size: 10,
	}),
	c.text("colored text", {
	  color: hcj.color.create({
		r: 200,
		g: 0,
		b: 200,
	  }),
	}),
	c.text([{
	  str: 'f',
	  size: 25,
	}, {
	  str: 'u',
	  size: 20,
	  align: 'top',
	}, {
	  str: 'n',
	  size: 25,
	}, {
	  str: 'k',
	  align: 'sub',
	}, {
	  str: 'y',
	}, {
	  str: ' ',
	}, {
	  str: 't',
	  spanCSS: [{
		name: 'display',
		value: 'inline-block',
	  }, {
		name: 'transform',
		value: 'scaleX(-1)',
	  }],
	}, {
	  str: 'e',
	  spanCSS: [{
		name: 'display',
		value: 'inline-block',
	  }, {
		name: 'transform',
		value: 'scaleY(-1)',
	  }],
	}, {
	  str: 'x',
	}, {
	  str: 't',
	}]),
	c.text("invisible text", {
	  color: hcj.color.create({
		r: 0,
		g: 0,
		b: 0,
		a: 0,
	  }),
	}),

	c.nothing,
	h2("image"),
	p('Display an image'),
	c.all([
	  c.keepAspectRatio,
	  c.alignHLeft,
	])(c.image({
	  src: './demo.png',
	  minWidth: 300,
	})),

	c.nothing,
	h2("bar.h, bar.v"),
	p('Make a 20px horizontal separator'),
	c.sideBySide([
	  pm('TEXT'),
	  c.bar.h(20),
	  pm('TEXT'),
	]),
	p('Make a 20px vertical separator'),
	c.stack([
	  pm('TEXT'),
	  c.bar.v(20),
	  pm('TEXT'),
	]),

	c.nothing,
	h2("empty"),
	p('Make an empty div.'),
	c.nothing,

	c.nothing,
	h2("alignH"),
	p('Align three items left, right, and middle'),
	c.alignH({
	  l: pm('LEFT'),
	  r: pm('RIGHT'),
	  m: pm('MIDDLE'),
	}),

	c.nothing,
	h2("alignV"),
	p('Align three items top, bottom, and middle'),
	c.sideBySide([
	  c.alignV({
		t: pm('TOP'),
		b: pm('BOTTOM'),
		m: pm('MIDDLE'),
	  }),
	  c.alignV({
		t: h3m('LARGE TOP'),
		b: h3m('LARGE BOTTOM'),
		m: h3m('LARGE MIDDLE'),
	  }),
	  c.alignV({
		t: h1m('LARGER TOP'),
		b: h1m('LARGER BOTTOM'),
		m: h1m('LARGER MIDDLE'),
	  }),
	]),

	c.nothing,
	h2('componentStream'),
	p('Show a stream of components.  Component receives new text each time you press the button'),
	c.scope(function () {
	  var generateRandomLetters = function (count) {
		var result = '';
		for (var i = 0; i < count; i++) {
		  result += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
		}
		return result;
	  };
	  var countLetters = 10;
	  var lettersS = stream.once(generateRandomLetters(countLetters));
	  return c.stack([
		c.componentStream(stream.map(lettersS, function (letters) {
		  return p(letters);
		})),
		c.all([
		  c.clickThis(function () {
			stream.push(lettersS, generateRandomLetters(countLetters));
		  }),
		  c.alignHLeft,
		])(c.text({
		  str: 'new string',
		  el: el.button,
		  measureWidth: true,
		})),
	  ]);
	}),

	c.nothing,
	h2('grid'),
	p('Show a grid of components'),
	c.grid({
	  padding: 20,
	  surplusWidthFunc: hcj.funcs.surplusWidth.evenlySplitCenter,
	})([
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	  pm('GRID TEXT'),
	]),

	c.nothing,
	h2('keepAspectRatio'),
	p('Maintain aspect ratio even in adverse conditions, both by covering and by containing'),
	c.sideBySide([
	  c.all([
		c.keepAspectRatio(),
		c.minWidth(20),
		c.minHeight(200),
		c.alignHLeft,
	  ])(c.image({
		src: './demo.png',
		minWidth: 300,
	  })),
	  c.all([
		c.keepAspectRatio({
		  fill: true,
		}),
		c.minWidth(20),
		c.minHeight(200),
		c.alignHLeft,
	  ])(c.image({
		src: './demo.png',
		minWidth: 300,
	  })),
	]),

	c.nothing,
	h2('largestWidthThatFits'),
	p('Choose the largest width that fits'),
	c.all([
	  c.minWidth(0),
	])(c.largestWidthThatFits([
	  pm('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
	  pm('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
	  pm('cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'),
	  pm('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'),
	  pm('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'),
	  pm('fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
	  pm('ggggggggggggggggggggggggggggggggggggggggggggggggggggggg'),
	  pm('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh'),
	  pm('iiiiiiiiiiiii'),
	])),

	c.nothing,
	h2('overlays'),
	p('Display lots of things on top of each other'),
	c.overlays([
	  h1('Some text'),
	  h1('Hello'),
	  c.stack([
		c.text('hi', [font.p, {
		  color: color.red,
		}]),
		c.text('hi', [font.p, {
		  color: color.red,
		}]),
		c.text('hi', [font.p, {
		  color: color.red,
		}]),
	  ]),
	]),

	c.nothing,
	h2('promiseComponent'),
	p('Wait until content comes in'),
	c.scope(function () {
	  var cS = stream.once(c.nothing);
	  var strS = stream.once('load stuff');
	  var go = function (secondsLeft) {
		if (secondsLeft === 0) {
		  stream.push(cS, p('stuff!'));
		  stream.push(strS, 'load stuff');
		  return;
		}
		stream.push(strS, secondsLeft + '');
		setTimeout(function () {
		  go(secondsLeft - 1);
		}, 1000);
	  };
	  return stack([
		c.all([
		  c.clickThis(function () {
			go(5);
		  }),
		  c.alignHLeft,
		])(c.text({
		  str: strS,
		  el: el.button,
		  measureWidth: true,
		})),
		c.componentStream(cS),
	  ]);
	}),

	c.nothing,
	h2('sideBySide'),
	p('Display components side by side'),
	c.sideBySide([
	  h1m('A'),
	  h1m('B'),
	  h1m('C'),
	]),

	c.nothing,
	h2('stack'),
	p('Display components in a stack'),
	c.stack([
	  h1('A'),
	  h1('B'),
	  h1('C'),
	]),

	c.nothing,
	h2('backgroundColor'),
	p('Apply background and font colors'),
	c.all([
	  c.backgroundColor({
		background: color.lightGray,
		backgroundHover: color.notBlack,
		font: color.red,
	  }),
	])(h1('MERRY CHRISTMAS')),

	c.nothing,
	h2('border'),
	p('Add a border around an alement'),
	c.all([
	  c.border(color.notBlack, 1),
	  c.alignHLeft,
	])(h1m('HCJ')),

	c.nothing,
	h2('crop'),
	p('Crop from the top, bottom, left, and/or right'),
	c.all([
	  c.crop({
		top: 0.4,
		right: 0.1,
		left: 0.2,
		bottom: 0.2,
	  }),
	  c.alignHLeft,
	])(h1m('HALP')),

	c.nothing,
	h2('linkTo'),
	p('Link to google'),
	c.all([
	  c.linkTo({
		href: 'https://google.com/',
		defaultStyle: true,
	  }),
	])(p('knowledge awaits')),

	c.nothing,
	h2('margin'),
	p('Put a margin around a component'),
	c.all([
	  c.margin(20),
	])(h1m('HCJ')),

	c.nothing,
	h2('minWidth and minHeight'),
	p('Arbitrarily specify the min width and min height of a component'),
	c.sideBySide([
	  c.all([
		c.minWidth(20),
	  ])(h1('HCJ')),
	  c.stack([
		c.all([
		  c.minHeight(11),
		])(h1('HCJ')),
		c.all([
		  c.minHeight(11),
		])(h1('HCJ')),
		c.all([
		  c.minHeight(11),
		])(h1('HCJ')),
	  ]),
	]),

	c.nothing,
	h2('clickThis'),
	p('prompt the user'),
	c.all([
	  c.clickThis(function () {
		var name = prompt("What's your name?");
		alert("Hello " + name + "!");
	  }),
	  c.alignHLeft,
	])(c.text({
	  str: 'push me',
	  el: el.button,
	  measureWidth: true,
	})),
  ]);

  var pages = [{
	title: "Introduction",
	component: introduction,
  }, {
	title: 'Install',
	component: install,
  }, {
	title: 'Terminology',
	component: aLittleVocab,
  }, {
	title: 'Rendering Components',
	component: renderingComponents,
  }, {
	title: 'Standard Library - Components',
	component: standardLibraryComponents,
  }, {
	title: 'Standard Library - Layouts',
	component: standardLibraryLayouts,
  }, {
	title: 'Standard Library - More Layouts',
	component: standardLibraryComponentModifiers,
  }, {
	title: 'Standard Library - Streams',
	component: standardLibraryStreams,
  }, {
	title: 'Standard Library - Forms',
	component: standardLibraryForms,
  }, {
	title: 'Standard Library - Colors',
	component: standardLibraryColors,
  }, {
	title: 'Standard Library - Jso',
	component: standardLibraryJso,
  }, {
	title: 'API - Defining Components',
	component: definingComponents,
  }, {
	title: 'API - Defining Layouts',
	component: definingLayouts,
  }, {
	title: 'cs is not a function',
	component: csIsNotAFunction,
  }, {
	title: 'Test Page',
	component: testPage,
  }, {
	title: 'Planned Features',
	component: version2,
  }, {
	title: 'Community',
	component: support,
  }];

  var initialIndex = window.location.hash && parseInt(window.location.hash.substring(1));
  var currentPageS = stream.once(initialIndex || 0);
  $(window).on('hashchange', function () {
	var index = window.location.hash && parseInt(window.location.hash.substring(1));
	stream.push(currentPageS, index);
  });

  stream.map(currentPageS, function (index) {
	window.location.hash = index;
  });

  var sidebar = c.all([
	c.margin(20),
	c.backgroundColor({
	  background: color.lightGray,
	}),
  ])(stack([
	c.image({
	  src: './demo.png',
	  minWidth: 0,
	}),
	c.bar.h(20),
	stack(pages.map(function (p, i) {
	  return c.all([
		c.margin(2),
		c.linkTo(window.location.origin + window.location.pathname + '#' + i),
		c.backgroundColor({
		  background: stream.map(currentPageS, function (index) {
			return index === i ? color.lighterGray : color.lightGray;
		  }),
		  backgroundHover: color.lighterGray,
		}),
	  ])(c.text(p.title, font.p));
	})),
  ]));

  var docs = c.all([
	c.minHeightAtLeast(stream.windowHeight),
	c.backgroundColor({
	  font: color.notBlack,
	}),
  ])(c.grid({
	surplusWidthFunc: hcj.funcs.surplusWidth.giveToNth(1),
	surplusHeightFunc: hcj.funcs.surplusHeight.giveToNth(0),
  })([
	sidebar,
	c.all([
	  c.margin(20),
	  c.backgroundColor({
		background: color.lighterGray,
	  }),
	])(docStack([
	  h1('hcj.js'),
	  p('A website library for hackers'),
	  p('v0.1'),
	  c.componentStream(stream.map(currentPageS, function (index) {
		var p = pages[index];
		return c.all([
		  c.$css('transition', 'left 1s'),
		])(docStack([
		  h1(p.title),
		  p.component,
		]));
	  // }), function (i, ctx) {
	  // 	var deferred = $.Deferred();
	  // 	stream.defer(function () {
	  // 	  i.$el.css('left', -ctx.width.lastValue + 'px');
	  // 	  setTimeout(function () {
	  // 		deferred.resolve();
	  // 	  }, 1000);
	  // 	});
	  // 	return deferred.promise();
	  // }, function (i, ctx) {
	  // 	stream.defer(function () {
	  // 	  i.$el.css('left', ctx.width.lastValue / 2 + 'px');
	  // 	  setTimeout(function () {
	  // 		i.$el.css('transition', 'left 1s');
	  // 		// i.$el.css('left', '0px');
	  // 	  });
	  // 	});
	  })),
	])),
  ]));

  window.hcj.rootComponent(docs);
});
