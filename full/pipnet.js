/* pipnet 1.46-1-beta . (c) The pipnet contributors . github.com/Lulu13022002/pipnet/blob/master/LICENSE */
(function(doc) {
  'use strict';
  var html = doc.documentElement, head = doc.getElementsByTagName('head')[0], body = doc.body;
  var self = {debug: 0, groupLog: false, safeMode: false, useModule: false, strict: false, object: {}, module: {}}, api = {}, pipmodule = {};
  var PL, G, isInit = false;
  var ownEvents = [];
  var _tempSelf;

  self.addEventListener = function(type, callback, options) { // like addEventListener
    if(type !== 'load') throw new TypeError('Actually there are only load event available');
    if(type === 'load' && isInit) callback();
    ownEvents.push({'type': type, 'callback': callback, 'options': options});
  },
  self.removeEventListener = function(type, callback, options) {
    for(var i = 0, l = ownEvents.length; i < l; i++) {
      var e = ownEvents[i]
      if(e.type !== type || e.callback !== callback || e.options !== options) continue;
      ownEvents.splice(i, 1);
      break;
    }
  },
  self.init = function(config) {
    if(isInit) throw new Error("pipnet << API already loaded");
    if(config != null) _tempSelf = self;

    /* These two variables and api.isEventSupported are based on facebook archive: github.com/facebookarchive/fixed-data-table */
    self.canUseDOM = !!(window !== undefined && window.document && window.document.createElement);
    if (!self.canUseDOM) throw new Error("pipnet << Deprecated browser; please update your navigator [" + self.userAgent.id + "]");
    
    self.useHasFeature = (function() {
      var implementation = doc.implementation;
      return implementation && implementation.hasFeature && implementation.hasFeature('', '') !== true;
    })(),
    self.isInDOM = function(target) {
      if(!this.canUseDOM || !target || typeof target !== 'object' || !('children' in target)) return false;
      if(PL.indexOf(['SCRIPT', 'STYLE', 'META', 'TITLE', 'HEAD', 'LINK'], target.nodeName) !== -1 || head.contains(target)) return false;
      var owner = target.ownerDocument;
      return owner && (window == (owner.defaultView || owner.parentWindow)); /*=== exception in IE8- => return false */
    };

    // Not GC to avoid confusion with garbage collector
    G = pipmodule['generic'] = (function() {
      /* t1 = Width|Height */
      var htmlViewer = self.canMeasureHTML ? html : body; // IE8 - IE6 => IE5-
      return {
        // if you want only get html/body params use this that supports IE5-
        'htmlViewer': htmlViewer,
        /* t1 = X|Y . t2 = Left|Top */
        // NOTE: Offset way have more precision so to normalize it use Math object
        scroll: function(target, isWindow, method, t1, t2) {
          if(isWindow == null) isWindow = api.isWindow(target);
          var r = 0;
          if(isWindow) r = window['page' + t1 + 'Offset'] || htmlViewer['scroll' + t2]; /* Modern browsers => IE8- */
          else r = el['scroll' + t2];
          return method == null ? r : Math[method](r);
        },
        /* t2 = Left|Top */
        increaseScroll: function(target, isWindow, increase, t2) {
          if(isWindow == null) isWindow = api.isWindow(target);
          if(isWindow) target = htmlViewer; /* Supports IE5- */
          (increase ? ++target['scroll' + t2] : --target['scroll' + t2]);
        },
        setScroll: function(target, isWindow, value, t2) {
          if(isWindow == null) isWindow = api.isWindow(target);
          if(isWindow) target = htmlViewer;
          target['scroll' + t2] = value;
        },
        /* t1 = F(client|scroll)(Width|Height) */
        measure: function(target, isWindow, t1) {
          if(isWindow == null) isWindow = api.isWindow(target);
          return isWindow ? htmlViewer[t1] : el[t1];
        },
        /* add = true/false */
        event: function(type, f, args, el, add) {
          el || (el = doc);
          var method = self.event.method[add ? 'add' : 'remove'];
          if (self.event.type === 2) {
            if(args == null) args = false;
            else if(typeof args === 'object' && args.hasOwnProperty('passive') && !self.event.supportsPassive) args = null;
            try {
              el[method](type, f, args);
            } catch(e) {
              if(typeof f === 'object' && f.handleEvent) { // supports this.handleEvent
                el[method](type, function(e) {
                  f.handleEvent.call(f, e);
                }, args);
              } else throw e;
            }
          } else {
            if(typeof f === 'object' && f.handleEvent) {
              el[method]('on' + type, function() {
                f.handleEvent.call(f, {'type': type});
              });
            } else el[method]('on' + type, f); /* IE8- */
          }
        },
        /* t1 = x|y t2 = y|x */
        clickedOnBar: function(target, e, x1, x2, isWindow, t1, t2) {
          e || (e = window.event);
          if(isWindow == null) isWindow = api.isWindow(target);
          if(x1 == null || x2 == null) {
            var loc = api.pointerEvent(e);
            x1 = x1 || loc[t1], x2 = x2 || loc[t2];
          }
          var clientMeter = PL.element.clientMeter(target, isWindow);
          return clientMeter[t2] <= x2 && x1 <= clientMeter[t1];
        },
        /* t1 = Y|X */
        scrollDirection: function(e, t1) {
          if(('delta' + t1) in e) return e['delta' + t1] < 0;
          if('detail' in e) return e.detail * (-40) > 0;
          return e.wheelDelta > 0;
        }
      }
    })();

    /* Polyfill for IE8- and feature around */
    PL = pipmodule['polyfill'] = (function() {
      var element = {};
      element.scrollLeft = function(target, isWindow, method) {
        return G.scroll(target, isWindow, method, 'X', 'Left');
      },
      element.scrollTop = function(target, isWindow, method) {
        return G.scroll(target, isWindow, method, 'Y', 'Top');
      },
      element.scrollMeter = function(target, isWindow, method) {
        if(isWindow == null) isWindow = api.isWindow(el);
        return {x: this.scrollLeft(target, isWindow, method), y: this.scrollTop(target, isWindow, method)};
      },
      element.clientWidth = function(target, isWindow) {
        return G.measure(target, isWindow, 'clientWidth');
      },
      element.clientHeight = function(target, isWindow) {
        return G.measure(target, isWindow, 'clientHeight');
      },
      element.clientMeter = function(target, isWindow) {
        if(isWindow == null) isWindow = api.isWindow(el);
        return {x: this.clientWidth(target, isWindow), y: this.clientHeight(target, isWindow)};
      },
      element.scrollWidth = function(target, isWindow) {
        return G.measure(target, isWindow, 'scrollWidth');
      },
      element.scrollHeight = function(target, isWindow) {
        return G.measure(target, isWindow, 'scrollHeight');
      },
      element.scrollMaxMeter = function(target, isWindow) {
        if(isWindow == null) isWindow = api.isWindow(el);
        return {x: this.scrollWidth(target, isWindow), y: this.scrollHeight(target, isWindow)};
      },
      // equivalent to scrollLeft++ or scrollLeft-- defined by increase parameter [boolean];
      element.increaseScrollLeft = function(target, isWindow, increase) {
        G.increaseScroll(target, isWindow, increase, 'Left');
        return G.scroll(target, isWindow, null, 'X', 'Left');
      },
      // equivalent to scrollTop++ or scrollTop-- defined by increase parameter [boolean];
      element.increaseScrollTop = function(target, isWindow, increase) {
        G.increaseScroll(target, isWindow, increase, 'Top');
        return G.scroll(target, isWindow, null, 'Y', 'Top');
      },
      // use this only if you want to increase or decrease both scrollLeft and scrollTop at the same time to gain some performance at the caching isWindow function
      element.increaseScrollMeter = function(target, isWindow, x, y) {
        if(isWindow == null) isWindow = api.isWindow(el);
        return {x: this.increaseScrollLeft(target, isWindow, x), y: this.increaseScrollTop(target, isWindow, y)};
      },
      element.setScrollLeft = function(target, isWindow, value) {
        G.setScroll(target, isWindow, value, 'Left');
      },
      element.setScrollTop = function(target, isWindow, value) {
        G.setScroll(target, isWindow, value, 'Top');
      },
      element.setScrollMeter = function(target, isWindow, x, y) {
        if(isWindow == null) isWindow = api.isWindow(target);
        this.setScrollLeft(target, isWindow, x);
        this.setScrollTop(target, isWindow, y);
      };

      return {
        indexOf: function(o, searchElement, fromIndex) {
          var protoIndexOf = Array.prototype.indexOf;
          if(protoIndexOf) return protoIndexOf.call(o, searchElement, fromIndex);
          else {
            if (o == null) throw new TypeError("PL.indexOf called on null or undefined"); // Firefox's error is "can't convert [array] to object" but chromium and microsoft return this message so i choose the majority to avoid a real check between navigator (NAV::userAgent.has('Firefox'))
            o = Object(o);
            var len = o.length >>> 0;
            if (len === 0) return -1;
            var n = fromIndex | 0;
            if (n >= len) return -1;
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            for (; k < len; k++) {
              if (k in o && o[k] === searchElement) return k;
            }
            return -1;
          }
        },
        // to skip enum bug check do (o, callback, false)
        // the context allow you to change this variable at your current context in whatever object (available in all callback)
        // o is an array but can be nullable or undefined or whatever so you don't have to check it before this call like: [if(args)] self::module.polyfill.iterateArrayObject0(args, e => console.log(e))
        iterateArrayObject0: function(o, callback, context, supportsDontEnumBug) {
          var protoHasOwnProperty = Object.prototype.hasOwnProperty;
      
          for (var prop in o) {
            if (protoHasOwnProperty.call(o, prop)) callback.call(context, prop);
          }
      
          if (supportsDontEnumBug && !({ toString: null }).propertyIsEnumerable('toString')) { // when hasOwnProperty work like: key in object / must be checked in older browser
            var dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'];
            for (var i = 0; i < 7; i++) {
              var dontEnum = dontEnums[i];
              if (protoHasOwnProperty.call(o, dontEnum)) callback.call(context, dontEnum);
            }
          }
        },
        iterateArrayObject: function(o, callback, context) {
          this.iterateArrayObject0(o, callback, context, true); // default to true cause polyfill module
        },
        size: function(o) {
          var size = 0;
          this.iterateArrayObject(o, function() { size++; });
          return size;
        },
        // polyfill of Object.keys
        // WARNING: Don't use this to check if array object is empty do instead size() > 0 or if you must iterate object after, use directly iterateArrayObject function, the callback are called only if array isn't empty
        keys: function(o) {
          var result = [];
          this.iterateArrayObject(o, function(item) { result.push(item); });
          return result;
        },
        string: {
          // polyfill of String.trim
          trim: function(str, lchar, rchar) {
            var protoTrim = String.prototype.trim;
            //\s = ?[\s\uFEFF\xA0]
            return protoTrim ? protoTrim.call(str) : str.replace(/^\s+|\s+$/g, '');
          },
          ltrim: function(str) {
            return str.replace(/^\s+/g, '');
          },
          rtrim: function(str) {
            return str.replace(/\s+$/g, '');
          },
          between: function(str, prefix, suffix, ignoreSpace) {
            if(suffix == null) suffix = prefix;
            if(ignoreSpace == null) ignoreSpace = false;
            return this.startsWith(str, prefix, ignoreSpace) && this.endsWith(str, suffix, ignoreSpace);
          },
          // polyfill of String.startsWith
          startsWith: function(str, prefix, ignoreSpace) {
            if(ignoreSpace == null) ignoreSpace = false;
            var protoStartsWith = String.prototype.startsWith;
            if(ignoreSpace) str = this.ltrim(str);
            return protoStartsWith ? protoStartsWith.call(str, prefix) : 0 === str.indexOf(prefix);
          },
          // polyfill of String.endsWith
          endsWith: function(str, suffix, ignoreSpace) {
            if(ignoreSpace == null) ignoreSpace = false;
            var protoEndsWith = String.prototype.endsWith;
            if(ignoreSpace) str = this.rtrim(str);
            return protoEndsWith ? protoEndsWith.call(str, suffix) : str.length - suffix.length === str.lasIndexOf(suffix);
          },
          nl2br: function(str, xhtml) { // suppose that html 5 is prioritary on xhtml 1.X
            return str.replace(/\r\n|\n/mg, xhtml ? "<br/>" : "<br>");
          }
        },
        bind: function(f, otherThis) {
          var protoBind = Function.prototype.bind, protoSlice = Array.prototype.slice;
          if(protoBind) return protoBind.bind.apply(f, (protoSlice.call(arguments, 1)));
          else {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            if (typeof f !== 'function') throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
            
            var baseArgs = protoSlice.call(arguments, 2), baseArgsLength = baseArgs.length,
                fToBind = f,
                fNOP    = function() {},
                fBound  = function() {
                  baseArgs.length = baseArgsLength; // reset to default base arguments
                  baseArgs.push.apply(baseArgs, arguments);
                  return fToBind.apply(fNOP.prototype.isPrototypeOf(f) ? f : otherThis, baseArgs);
                };
        
            if (f.prototype) fNOP.prototype = f.prototype;  // Function.prototype doesn't have a prototype property
            fBound.prototype = new fNOP();
        
            return fBound;
          }
        },
        event: {
          add: function(type, f, args, el) {
            G.event(type, f, args, el, true);
          },
          remove: function(type, f, args, el) {
            G.event(type, f, args, el, false);
          },
          source: function(e) {
            return e || window.event;
          },
          target: function(e) {
            return e ? e.target : window.event.srcElement;
          },
          preventDefault: function(e) {
            if(e && 'preventDefault' in e) e.preventDefault();
            else window.event.returnValue = false; // IE
          },
          stopPropagation: function(e) {
            if(e && 'stopPropagation' in e) e.stopPropagation();
            else window.event.cancelBubble = true; // IE
          },
          /* EXAMPLE:
            you can create an instance to avoid to research object for any methods
            IE9+:
              var testing = pipnet.module.polyfill.event.create('testing', {cancelable: false}); // {cancelable: false} => general args by default (bubbles, cancelable, detail)
              pipnet.module.polyfill.event.add('testing', function(e) {console.log(e);}, null, document.body); // null => args for specific event (capture, passive, once)
              pipnet.module.polyfill.event.fire(document.body, testing, {d: 1}); // {d: 1} => args used like callback (can be whatever int, number, boolean...)

            IE8-: (partial support -> only classic event like 'click')
              var click = pipnet.module.polyfill.event.create('click', {cancelable: false});
              pipnet.module.polyfill.event.add('click', function() {console.log(window.event);}, null, document.body);
              pipnet.module.polyfill.event.fire(document.body, click, {d: 1}); */
          create: function(name, params) {
            params || (params = {bubbles: false, cancelable: true, detail: null});
            var e;
            if(typeof CustomEvent === 'function') e = new CustomEvent(name, params); // typeof CustomEvent and not 'CustomEvent' in window because IE11 have a CustomEvent object but it's not a valid event object
            else if('createEvent' in doc) {
              e = doc.createEvent('CustomEvent'); // IE 9-11
              e.initCustomEvent(name, params.bubbles || false, params.cancellable || true, params.detail || null);
            } else if ('createEventObject' in doc) { // IE8- (partial support: only work with classic event like 'click')
              e = doc.createEventObject();
              e.eventType = name;
              PL.iterateArrayObject(params, function(key) { e[key] = params[key]; });
            }
            return e;
          },
          fire: function(target, e, args) {
            PL.iterateArrayObject(args, function(key) { e[key] = args[key]; });
            if('dispatchEvent' in target) target.dispatchEvent(e);
            else if('fireEvent' in target) target.fireEvent('on' + e.eventType, e); // return true if event is classic like 'click' else throw an error
          }
        },
        'element': element,
        /* jQuery polyfill: github.com/jquery/jquery */
        // to check if a property is available you can do: Array.from(pipnet.module.polyfill.CSS.styles(document.body)).indexOf('color') !== -1
        // polyfill of array.from (mainly for IE): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Polyfill
        CSS: (function(core_pnum, rmargin, rposition, fcomputed) {
          var rnumnonpx = new RegExp("^(" + core_pnum + ")(?!px)[a-z%]+$", "i");
          var docInstance = html.ownerDocument, docView = docInstance.defaultView;
          if(fcomputed || (docInstance && docView && 'getComputedStyle' in docView)) {
            return {
              styles: function(elem) {
                return (fcomputed ? window : elem.ownerDocument.defaultView).getComputedStyle(elem, null);
              },
              get: function(elem, name, _computed) {
                var computed = _computed || this.styles(elem),
                    ret = computed ? computed.getPropertyValue(name) || computed[name] : undefined;
                if(computed) {
                  /* Edit - support jQuery to speed up this part */
                  if (ret === "") {
                    var jQ = window.jQuery;
                    if(jQ && !jQ.contains(elem.ownerDocument, elem)) ret = jQ.style(elem, name);
                  }
                  if(rnumnonpx.test(ret) && rmargin.test(name)) {
                    var style = elem.style;
                    var width = style.width, minWidth = style.minWidth, maxWidth = style.maxWidth;
                    style.minWidth = style.maxWidth = style.width = ret;
                    ret = computed.width;
                    style.width = width, style.minWidth = minWidth, style.maxWidth = maxWidth;
                  }
                }
                return ret;
              }
            };
          } else if ('currentStyle' in html) {
            return {
              styles: function(elem) { return elem.currentStyle; },
              get: function(elem, name, _computed) {
                try {
                  var computed = _computed || this.styles(elem),
                      ret = computed ? computed[name] : undefined;
                  if(ret == null && style && style[name]) ret = style[name];
                  if(rnumnonpx.test(ret) && !rposition.test(name)) {
                    var style = elem.style;
                    var left = style.left, rs = elem.runtimeStyle;
                    var rsLeft = rs && rs.left;
                    if (rsLeft) rs.left = computed.left;
                    style.left = (name === "fontSize" || name === "font-size") ? "1em" : ret;
                    ret = style.pixelLeft + "px";
                    style.left = left;
                    if (rsLeft) rs.left = rsLeft;
                  }
                  return ret === "" ? "auto" : ret;
                } catch(e) {}
              }
            };
          }
        })(/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source, /^margin/, /^(top|right|bottom|left)$/, 'getComputedStyle' in window)
      };
    })();

    pipmodule['locate'] = {
      name: "pipnet",
      version: 1.46,
      state: "PRE-RELEASE",
      type: "full"
    };

    self.Ajax = {
      // Originally defined by MSIE
      // (via ActiveXObject with jscript 1.5 (partial support of javascript 1.5)) that have a bad security rate)
      // then standardized by W3C
      XMLHttpRequest: function() {
        if ('XMLHttpRequest' in window) return new XMLHttpRequest(); // IE7+, Firefox, Chrome, Opera, Safari
  // IE6, IE5
  /*@acc_on @*/
  /*@if (@_jscript_version >= 5)
          if('ActiveXObject' in window) {
            try { return new ActiveXObject("Msxml3.XMLHTTP"); } catch(e) {}
            try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) {}
            try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e) {}
            try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e) {}
            try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e) {}
          }
  @end @*/
        return null;
      },
      _getEvent: function(opt, name, custom) {
        var dir = opt['on'+name];
        if(dir === undefined) return null;
        var type = typeof dir;
        if(type === 'function') return {f: dir, context: opt.context}; // maybe create tree searcher like DOM to simplify this function
        if(type === 'object') {
          var dirf = dir.f;
          var typef = typeof dirf;
          if(typef === 'function') return {f: dirf, context: dir.context || opt.context};
          if(typef === 'object') {
            custom || (custom = false);
            if(!custom && !this.useStandard) {
              var last = dirf[dirf.length -1]; // last overwrite other object
              if(typeof last === 'function') return {f: last, context: dir.context || opt.context};
              return {f: last.f, context: last.context || dir.context || opt.context};
            }
            var alternateContext; // avoid redundant context
            var o = [];
            for(var i = 0, l = dirf.length; i < l; i++) {
              var curr = dirf[i];
              if(typeof curr === 'function') {
                o[i] = {f: curr, context: alternateContext || (alternateContext = dir.context || opt.context)};
                continue;
              }
              o[i] = {f: curr.f, context: curr.context || alternateContext || (alternateContext = dir.context || opt.context)};
            }
            return o;
          }
        }
      },
      _iterateEvents: function(o, callback) {
        if(!('length' in o)) callback.call(this, o.f, o.context);
        else {
          for(var i = 0, l = o.length; i < l; i++)
            callback.call(this, o[i].f, o[i].context);
        }
      },
      _newEvent: function(name) { // Sugar
        var o = this._getEvent(this.currOpt, name);
        if(o === null) return;
        this._iterateEvents(o, function(f, context) {
          this._applyEvent(name, f, context);
        });
      },
      _applyEvent: function(id, f, context) {
        if(!this.useStandard) this.currReq['on'+id.toLowerCase()] = PL.bind(f, context, this.currReq);
        else this.currReq.addEventListener(id.toLowerCase(), PL.bind(f, context, this.currReq), false);
      },
      _handleCustomEvent: function(o, req) {
        this._iterateEvents(o, function(f, context) {
          f.call(context, req);
        });
      },
      _args: function() { // default values
        return {url: "https://example.com", method: 'GET', data: null, context: this, async: true, useStandard: false};
      },
      /* You don't need to check which event is available for IE except if you have event that interact with other event in this case you need atleast a boolean or an anonymous object which referred your booleans
        Event availables (need atleast IE5):
        . onReadyStateChange
        . onTimeout / when the time of request exceed the delay defined in the property XMLHttpRequest::timeout (0 == no timeout)
        . onLoad / called only on IE9+
      IE10+
        . onLoadStart
        . onLoadEnd
        . onProgress
        . onError
        . onAbort
      Customs (validRequest / iValidRequest)
        . onFail request has returned a status code that doesn't include the codeRange defined in options (def is [200, 300])
        . onNotReadyState when XMLHttpRequest.readyState isn't equals (===) to ready defined in options (def is 4 {READY in DOM})
        . onSuccess when onFail and onNotReadyState aren't called, this event is fired ([minCode,] < status code < [,maxCode] && XMLHttpRequest.readyState === ready)

        Notes:
          Using iValidRequest mean that only onSuccess event is available
          If you use validRequest don't override onReadyStateChange property otherwise that break all custom events
      */
      /* When you change the default context via options.context: x this context is used by all your events to
         use different context by event you can use an alternative way:
          {
            onReadyStateChange: {
              context: newContext, // this overwrite default context (your options.context and Ajax scope)
              f: function(req) {
                // do everything
              }
            },
            onTimeout: function(req) {
              // do everything
            } // here the default context is used (options.context or if undefined: Ajax scope)
          }
        If you have enabled useStandard in options you can use multiple events with the same name
        but there are a limitation:
          if navigator (like IE 5) doesn't have addEventListener (there are not attachEvent for XMLHttpRequest)
          and you use a non custom event (onload...), this will overwrite the last method (req.on[name] = function)
          so if you have an array with 4 object/functions the last one is choosed and
          overwrite all other
          {
            onReadyStateChange: {
              context: newContext, // this overwrite default context (your options.context and Ajax scope)
              f: [
                function(req) {
                  // do everything
                }, // here the onReadyStateChange.context is used
                {
                  context: newContext,  // this overwrite default context (name.context, your options.context and Ajax scope)
                  f: function(req) {
                    // do everything2
                  }
                }
              ]
            }
          }
          Note: the useStandard property is compulsory only if you use a non custom event (onload...)
          this behavior is here because addEventListener is not called on custom event but just f.call(context, req);
      */
      /* Don't use this function for multiple request in parallel
         instead use pipnet.Ajax.XMLHttpRequest(); and do your classic request in loop or
         if you need custom event like onSuccess use pipnet.Ajax.request(options, REQUEST);
         REQUEST is your pipnet.Ajax.XMLHttpRequest() that you have declared outside the loop */
      // {url: URL, method: 'HEAD|GET|POST|PUT|DELETE', context: this, data: {var1: value1}, async: true|false, on[name of event]: function(req) {}}
      request: function(opt, req, _noArgs) {
        if(!_noArgs) opt = api.defaultConfig(opt, this._args());
        this.currOpt = opt;

        this.currReq = (req || (req = this.XMLHttpRequest()));
        this.useStandard = (this.canUseStandard ||
          (this.canUseStandard = 'addEventListener' in req)) && opt.useStandard;
        
        // IE5+
        this._newEvent('ReadyStateChange');
        this._newEvent('Timeout');

        // Extra
        if('onload' in req) this._newEvent('Load'); // IE9+
        // IE10+ / modern browser
        if('onloadstart' in req) this._newEvent('Loadstart');
        if('onloadend' in req) this._newEvent('Loadend');
        if('onprogress' in req) this._newEvent('Progress');
        if('onerror' in req) this._newEvent('Error');
        if('onabort' in req) this._newEvent('Abort');

        req.open(opt.method, opt.url, opt.async);
        req.send(PL.indexOf(['GET', 'POST'], opt.method) === -1 ? null : opt.data); // data is only for GET/POST
        
        delete this.currOpt;
        delete this.currReq;
        delete this.useStandard;
        return req;
      },
      // use i[Request|ValidRequest] when you have a simple request that doesn't need a lot of personalization
      iRequest: function(onReadyStateChange, url, method, context, data) {
        return this.request({
          'url': url,
          'method': method,
          'data': data,
          'context': context,
          'onReadyStateChange': onReadyStateChange
        });
      },

      // valid request (readyState === READY) + (300 > status code > 200) the order is defined because most error code return 404 (sometimes this override real eror code)
      validRequest: function(opt, req) {
        opt = api.defaultConfig(opt, this._args()); // like variable are passed by copy and not by reference

        var _this = this;
        var failEvent, successEvent, notReadyStateEvent = this._getEvent(opt, 'NotReadyState', true); // avoid multiple check
        opt = api.defaultConfig(opt,
        {
          ready: 4, codeRange: [200, 300], 
          onReadyStateChange: {
            context: _this, // be sure that Ajax scope is the context
            f: function(req) {
              if(req.readyState !== opt.ready) {
                if(notReadyStateEvent) this._handleCustomEvent(opt, notReadyStateEvent, req);
                return; // Not ready
              }
              if(req.status > opt.codeRange[1] || req.status < opt.codeRange[0]) { // Not valid code
                if(failEvent = this._getEvent(opt, 'Fail', true)) this._handleCustomEvent(failEvent, req);
                return;
              }
              if(successEvent = this._getEvent(opt, 'Success', true)) this._handleCustomEvent(successEvent, req);
            }
          }
        });
        return this.request(opt, req, true);
      },

      // valid request (readyState === READY) + (300 > status code > 200) the order is defined because most error code return 404 (sometimes this override real eror code)
      iValidRequest: function(onSuccess, url, method, context, data) {
        return this.validRequest({
          'url': url,
          'method': method,
          'data': data,
          'context': context,
          'onSuccess': function(req) {
            onSuccess.call(opt.context, req);
          }
        });
      }
    };
  
    api.fireOwnEvent = function(type) {
      for(var i = 0, l = ownEvents.length; i < l; i++) {
        if(ownEvents[i].type !== type) continue;
        ownEvents[i].callback();
      }
    };

    var isDeferLoading = false;
    if(config != null) {
      var parseConfig = function(o) {
        PL.iterateArrayObject(_tempSelf, function(key) {
          if(o[key] == null) return;
          var typek = typeof self[key];
          if(typek !== 'number' && typek !== 'boolean') return;
          self[key] = o[key];
        });
        _tempSelf = null;
      };
      var typec = typeof config;
      if(typec === 'string') { // file
        isDeferLoading = true;
        pipnet.Ajax.validRequest({
          url: config,
          onSuccess: function(req) {
            parseConfig(JSON.parse(req.responseText));
            _loadModules();
          }
        })
      } else if(typec === 'object') parseConfig(config);
    }

    self['_'] = {
      formatNumber: function(str, onlyOne) {
        if(onlyOne == null) onlyOne = false;
        var isUnderScore = false;
        for(var i = 0, l = str.length; i < l; i++) {
          var char = str[i] || str.charAt(i);
          if(char !== '_') {
            isUnderScore = false;
            continue;
          }
          if(isUnderScore && onlyOne) continue;
          isUnderScore = true;
          var index = str.indexOf('_');
          str = str.substr(0, index) + str.substr(index + 1);
          l = str.length;
          i--;
        }
        return str;
      },
      isValidNumber: function(str, intOnly, strict) {
        var value = intOnly ? parseInt(str, 10) : parseFloat(str);
        if(isNaN(value)) return false; // avoid incorrect value (when strict = true) with str = 'NaN' => true expected false
        if(strict == null) strict = self.strict === true;
        if(strict) return String(value) === str;
        return true;
      },
      parseNumber: function(str, intOnly, strict) {
        var value = intOnly ? parseInt(str, 10) : parseFloat(str);
        if(strict == null) strict = self.strict === true;
        if(strict && String(value) !== str) return NaN;
        return value;
      },
      // WARNING: if the parsed value isn't a simple number that return a pipnet.object.Version. The value returned is rounded when the limit of integer is reached for processor
      // parseUnsignedVersion with 'INT' replacement is only to supports letter like A|a = 1, B|b = 2
      //                      with '.INT' replacement is same that INT but add an extra dot at starting (4b = 4.b = 4.2) the returned value is always an Version object
      // Maybe support "INT+1"|"INT-1"
      parseUnsignedVersion: function(str, replacement, abc) {
        var isINT = replacement == null || replacement === "INT",
            isDotINT = replacement === ".INT";
        var useINT = isINT || isDotINT;
        abc || (abc = "abcdefghijklmnopqrstuvwxyz");
        var value = "";
        for(var i = 0, l = str.length; i < l; i++) {
          var char = str[i] || str.charAt(i); // str[i] IE8+ / charAt(i) IE7- (charAt have a check that be slower than str[i] so i use it only for IE compatibility)
          var indexOf = abc.indexOf(char.toLowerCase()) // toLowerCase alternative also work
          if(indexOf === -1) value += char;
          else if(useINT) {
            if(isDotINT) value += '.';
            value += indexOf + 1;
          } else value += replacement;
        }
        return (isDotINT ? false : this.parseNumber(value, false, true)) || new self.object.Version(value);
      },
      // this method will return 1 for 0 and +0
      //                         2 for signed zero (-0)
      //                  ignore number after dot and will count also the negative char '-'
      countLengthOfNumber: function(number) {
        if(number === 0 && 1 / number === -Infinity) return 2; // -0 Math.sign is undefined for IE (there are only these ways to detect -0 !== +0 => https://en.wikipedia.org/wiki/Signed_zero)
        var start = 0;
        if(number < 0) {
          start = 1;
          number = Math.abs(number);
        }
        return start + (Math.log(number + 1) / Math.LN10 | 0) + 1; // | 0 is a decimal OR that doing the same work in this context that Math.ceil(x)
      }
    };

    /* methods depends of nav var */
    // userAgent can easily be spoofed with header/library config or other so for example the getLib can return null for cUrl if cUrl change its useragent and getNavigator can return null
    // for Chrome user because header can easily be changed in server side (php, ruby, j2ee, .net) or in client side with Ajax (xhr request) 
    // only Googlebot replacement cannot be spoofed cause we check in server side the user ip that replace Chrome/W.X.Y.Z to Chromium/the real version
    var uA = navigator.userAgent || navigator.appVersion;
    (function(ID, INSIDE_REG, VALUE_REG) {
      if(!ID) throw new Error("pipnet << Unknown browser; please change your navigator with a valid identifier like userAgent, name or vendor");
      if(!uA) console.warn("pipnet << Deprecated browser; please use a navigator with a real userAgent and not only a vendor and a name");

      // if you want to speedup (ignore IE check) for getVersion('IE').get() method do:
      /* var ieUaVers = this.getValue('rv') || this.getValue0('MSIE', " ");
         new pipnet.object.Version(this.ieCompatibilityMode0(ieUaVers) ? doc.documentMode : ieUaVers) */
      // you can use this method also to parse version like "x.x.x.x" (fragments of version <= [maxFragmentsCount || Infinity]).
      // version fragments exceed [maxFragmentsCount] number are automatically ignored
      // [unsignedVersion] is only to supports letter like A|a = 1, B|b = 2
      var gI = 0;
      self.object.Version = function(vers) {
        if('Version' in this) return new this.Version(vers).get(null, false); // allow pipnet.object.Version("5.5") === new pipnet.object.Version("5.5").get() with some cache optimization
        else this.vers = vers;
        this.isValid = typeof vers === 'string' && vers.trim() !== '';
      };
      self.object.Version.prototype = {
        get: function(maxFragmentsCount, unsignedVersionReplacement) {
          if(!this.isValid) return {'VALUE': null, 'RAW': new Array(0), 'MAJOR': null, 'MINOR': null, 'REVISION': null, 'BUILD': null, length: 0};
          var o = {};

          var extra = "", l = 0;
          o['RAW'] = this.iterateFragments(function(value, raw, i) {
            o[i] = value;
            l++;
            if(i !== 0 && !isNaN(value)) extra += raw;
          }, maxFragmentsCount, unsignedVersionReplacement);
          o.length = l;

          o['MAJOR'] = l > 0 ? o[0] : null, o['MINOR'] = l > 1 ? o[1] : null, o['REVISION'] = l > 2 ? o[2] : null, o['BUILD'] = l > 3 ? o[3] : null; // user can define max parameter smaller that the default version (4) / possibly null if this value isn't reached or NaN if the value cannot be parsed as number

          if(extra === '') o.VALUE = o.MAJOR;
          else {
            var strValue = o.MAJOR + '.';
            if(!unsignedVersionReplacement || !o.REVISION) strValue += extra;
            else {
              var uVersion = self.parseUnsignedVersion(extra, unsignedVersionReplacement);
              strValue += typeof uVersion === 'number' ? String(uVersion) : uVersion.vers; // unsignedVersionReplacement = INT|.
            }
            o.VALUE = self._.parseNumber(strValue);
          }
          return o;
        },
        // WARNING: return a value in callback will also break the loop
        iterateFragments: function(callback, maxFragmentsCount, unsignedVersionReplacement, context, byRecursive /* Ignore always this parameter (he's called intenally)*/) {
          if(!this.isValid) return;
          var strVers = maxFragmentsCount != null ? this.vers.split('.', maxFragmentsCount) : this.vers.split('.');
          for(var i = 0, l = strVers.length; i < l; i++) {
            var frag = strVers[i];
            if(!byRecursive && unsignedVersionReplacement) { // when parseUnsignedVersion is apply avoid useless check
              var uVersion = self.parseUnsignedVersion(frag, unsignedVersionReplacement);
              if(typeof uVersion === "number") {
                if(callback.call(context, uVersion, frag, gI)) break;
              } else uVersion.iterateFragments(callback, null, null, context, true); // error lastIndex wrong value => new pipnet.object.Version("5.5R5D12V6.42.454").iterateFragments((frag, raw, i) => console.log(frag, raw, i), null, '.');
            } else if(callback.call(context, self._.parseNumber(frag), frag, gI)) break;
            gI++;
          }
          if(!byRecursive) gI = 0; // find a properly way to achieve this (more clean) or remove the feature (index in callback)
          else gI--; // remove last overflow
          return strVers;
        }
      };

      self.object.AnonSoftware = function(name) {
        if('AnonSoftware' in this) return new this.AnonSoftware(name);
        this.o = {};
        this.name(name);
      };
      self.object.AnonSoftware.prototype = {
        name: function(name) {
          this.o['name'] = name;
          return this;
        },
        version: function(number) {
          this.o['version'] = number;
          return this;
        },
        server: function(name) {
          this.o['serverName'] = name;
          return this;
        },
        dependsOn: function(deps) {
          this.o['deps'] = deps;
          return this;
        },
        r: function() {
          return this.o;
        }
      };

      // this is a special object that generate generic function
      self.object.ObserverID = function(str) {
        return {
          'str': str,
          // WARNING: Don't use this before getter if you want the value do getVersion(program) and check if value is null like var vers = getVersion(program); if(vers) // do whatever with vers
          existsVersion: function(program) {
            if(program === 'IE' && self.isIE) {
              if('documentMode' in doc) return true;
              if(this.existsKey('rv') !== -1 || this.existsKey0('MSIE' + " ") !== -1) return true;
            }
            return this.str.indexOf(program + "/") !== -1;
          },
          /* existsVersion2: function(program) { // this is a little faster (it's insignificant only for IE program) but unreadable. it seem the double ! operator is really fast
            if(program === 'IE' && self.isIE) {
              if('documentMode' in doc) return true;
              var rv = this.getValue('rv');
              return rv !== undefined ? !!rv : !!this.getValue0('MSIE', " ");
            }
            return this.str.indexOf(program + "/") !== -1;
          },*/
          // return raw version string usefull if you don't need a complex parser like getVersion (inside this object you can always get raw string with getVersion(x, x).vers) method
          getVersion0: function(program) {
            if(program === 'IE' && self.isIE) { // Firefox also use rv key so do a filter
              var ieUaVers = this.getValue('rv') || this.getValue0('MSIE', " ");
              return this.ieCompatibilityMode0(ieUaVers) ? doc.documentMode : ieUaVers; // documentMode is only for compatibility mode
            }
            var index = this.str.indexOf(program + "/");
            if(index !== -1) {
              var vers = this.str.substr(index + program.length + 1), indexOfSpace = vers.indexOf(' ');
              return indexOfSpace !== -1 ? vers.substr(0, indexOfSpace) : vers;
            }
            return null;
          },
          // getVersion('Chrome') for Googlebot will return W.X.Y.Z until December 2020 so need some replacement
          getVersion: function(program) {
            var vers0 = this.getVersion0(program, this.str);
            return vers0 ? new pipnet.object.Version(vers0) : null;
          }
        };
      };
      
      var uAO = self.userAgent = new pipnet.object.ObserverID(uA);
      self.platform = navigator.platform;

      // for spoofed userAgent
      /* Evergreen */
      var Googlebot = {
        cache: null,
        isValid: function(callback) {
          if(this.cache !== null) callback(this.cache);
          else {
            // allow other google bot like Googlebot-Image/x
            if(/Googlebot.*?\//.test(uA) && uAO.getVersion0('Chrome') === 'W.X.Y.Z') {
              callback(this.cache = {type: 'UA'});
              return;
            }

            self.Ajax.validRequest({
              url: "/github/standalone/net/googlebot.php",
              method: 'HEAD',
              context: this,
              onSuccess: function(req) {
                callback(this.cache = {type: 'IP', value: req.getResponseHeader('Data') === 'true'});
              }
            });
          }
        }
      };

      uAO.kvp = (function() {
        // WARNING: return a value in callback will also break the loop
        var iterateFragments = function(callback, context, str) {
          var ID = str || uA;
          var group, i = 0;
          while (group = INSIDE_REG.exec(ID)) {
            if(callback.call(context, group[group.length -1], i)) {
              INSIDE_REG.lastIndex = 0; // IMPORTANT: reset lastIndex to avoid that the loop continue at the next call / considier this like a dispose when regex is in global scope
              break;
            }
            i++;
          }
        };
        return {
          'iterateFragments': iterateFragments,
          get: function(str) {
            var frags = [];
            this.iterateFragments(function(value, index) { frags[index] = value; }, null, str);
            return frags;
          }
        }
      })(),
      // for all methods (existsKey[0], getValue[s][0], existsVersion, getVersion[0]) that use regExp with raw string you need to escape char (for example: '+' will become '\\+')
      // [delimiter] can be null to check if key exist but without value for example
      // WARNING: Don't use this before getter if you want the value do getValue(key) that return undefined or [empty array] (only for getValues method) if nothing is found except for return boolean method. Use this method only to check something
      uAO.existsKey0 = function(key, delimiter) {
        return this.kvp.raw.indexOf(key + (delimiter || "")) !== -1;
      },
      uAO.existsKey = function(key) {
        return this.existsKey0(key, ':');
      },
      // native function ends with a 0 and have less check and are raw
      // not use getValues0(key, delimiter)[0] to avoid memory leak (iterate all loop only to retrieve the first value maybe with limit it can pass)
      // you can use double ! operator in certain context like !!getValue0(key, delimiter) like checker; see: 'existsVersion2' note
      uAO.getValue0 = function(key, delimiter) {
        var group = this.kvp.raw.match(key + delimiter + VALUE_REG);
        if(group !== null) return group[group.length -1];
      },
      uAO.getValue = function(key) {
        return this.getValue0(key, ":");
      },
      // NOTE: to catch all group with /g (global flag) regex we need exec method that is faster in this context (can be used in whatever loop, that is the opposite of match method that block the current thread until all occurrence (not all groups) was found)
      uAO.getValues0 = function(key, delimiter) {
        var ID = this.kvp.raw;
        var values = [];
        var reg = new RegExp(key + delimiter + VALUE_REG, 'g');
        var group;
        while (group = reg.exec(ID)) values.push(group[group.length -1]);
        return values;
      },
      uAO.getValues = function(key) {
        return this.getValues0(key, ":");
      },
      // check if documentMode is smaller that the userAgent string (if true the documentMode has efficient and usefull otherwise there is no emulation it's the real navigator engine and its userAgent)

      /* if you use getVersion('IE').get() after ieCompatibilityMode() do instead (to speed up):
        * var gIE = getVersion('IE'); this will return null if called on other navigator
        * if(gIE && ieCompatibilityMode0(gIE.vers)) // use gIE.get() here */
      // WARNING: use ieCompatibilityMode0 only if the user run on IE navigator otherwise it will return false like ieCompatibilityMode but slowly
      uAO.ieCompatibilityMode0 = function(ieUaVers) {
        return Number(ieUaVers || this.getValue('rv') || this.getValue0('MSIE', " ")) > doc.documentMode;
      },
      uAO.ieCompatibilityMode = function(ieUaVers) {
        if(!('documentMode' in doc)) return false; // ignore if navigator isn't IE
        return this.ieCompatibilityMode0(ieUaVers);
      },
      // return object with name and server (@Nullable)
      // return null for unknown
      // this method doesn't support bot or library detection (see: getBot/getLib)
      // this is a default method if you want to supports more OS add it: if you find a result null for this method check that with existsVersion/existsKey
      // ref: https://lafibre.info/navigateurs/user-agent/
      uAO.getOS = function(withDep) {
        if(withDep == null) withDep = false;
        var an = new pipnet.object.AnonSoftware();
        if(self.isWindows) { // Microsoft can put Android and Mac OS X in its userAgent so we need to check it before other
          an.name('Windows');
          if(this.existsKey0('Windows NT', " ")) {
            var raw = this.getValue0('Windows NT', " "), vers = Number(raw);
            if(vers === 10) return an.version('10').server('Windows Server 2016').r();
            if(vers >= 6.2) return an.version(String(8 + vers - 6.2)).server('Windows Server 2012' + (vers === 6.3 ? ' R2' : '')).build();
            if(vers === 6.1) return an.version('7').server('Windows Server 2008 R2').r();
            if(vers === 6) return an.version('Vista').server('Windows Server 2008').r();
            if(vers >= 5.1) {
              if(vers === 5.2) an.server('Windows Server 2003');
              return an.version('XP').r();
            }
            if(vers === 5) return an.version('NT 2000').r();
            if(vers <= 4) return an.version('NT ' + raw);
          }
          if(this.existsKey0('Windows Phone', " ")) return an.name('Windows Phone').r();
        } else {
          if(self.useiOS) return an.name('iOS').r();
          if(self.isMac) return an.name('Mac OS X').r();
          if(this.existsVersion('GoogleTV')) an.name('GoogleTV').r();
          if(self.useAndroid) return an.name('Android').r();
          if(this.existsKey0('CrOS', " ")) {
            if(withDep) an.dependsOn('Linux|iOS');
            return an.name('Chrome OS').r();
          }
          if(this.existsKey0('SymbOS')) {
            if(withDep) an.dependsOn('Linux');
            return an.name('Symbian OS').r();
          }
          if(this.existsKey0('BSD')) {
            if(withDep) an.dependsOn('Linux');
            if(this.existsKey0('FreeBSD')) an.name('FreeBSD');
            if(this.existsKey0('NetBSD', " ")) an.name('NetBSD');
            if(this.existsKey0('OpenBSD', " ")) an.name('OpenBSD');
            return an.r();
          }
          if(self.useLinux) return an.name('Linux').r();
        }
        return null;
      };

      // the compatibility mode doesn't change the OS, php $_SERVER, or the Chromium stable version so we can save it in cache
      var Chromium =  {
        cache: null,
        stableVersion: function(callback) {
          if(this.cache) callback(this.cache);
          else {
            var OS = this.getCurrentOS();
            self.Ajax.validRequest({
              url: "https://chromiumdash.appspot.com/fetch_releases?platform=" + OS + "&channel=Stable",
              context: this,
              onSuccess: function(req) {
                if(OS == null) callback(this.cache = -1);
                callback(this.cache = JSON.parse(req.responseText)[0].version);
              }
            }); // get current platform
          }
        },
        getCurrentOS: function() {
          var OS = uAO.getOS(true);
          var name = OS.name;
          if('dep' in OS) {
            var pipeIndex = OS.dep.indexOf('|');
            name = OS.dep.substr(0, pipeIndex);
          }
          if(name === 'Mac OS X') name = 'Mac';
          if(['Mac', 'Linux', 'Windows', 'iOS', 'Android'].indexOf(name) === -1) return null;
          return name;
        }
      };
          
      // return null if unknown
      // this is a default method if you want to supports more libraries add it: if you find a result null for this method check that with existsVersion/existsKey
      uAO.getLib = function() {
        var href = this.getValue0("\\+", "");
        if(this.existsVersion('curl')) return 'cUrl';
        if(this.existsVersion('Wget')) return 'Wget';
        if(this.existsVersion('Chilkat')) return {name: 'Chilkat Software', href: href};
        return null;
      },
      // return null if unknown
      // this is a default method if you want to supports more bot add it: if you find a result null for this method check that with existsVersion/existsKey
      uAO.getBot = function() {
        if(uA.indexOf('bot') === -1) return null;
        var href = this.getValue0("\\+", "");
        if(this.existsVersion('Googlebot')) return {name: 'Googlebot', href: href};
        if(this.existsVersion('bingbot')) return {name: 'bingbot', href: href};
        return null;
      },
      // return null if unknown
      // this is a default method if you want to supports more navigator add it: if you find a result null for this method check that with existsVersion/existsKey
      uAO.getNavigator = function() {
        if(this.existsVersion('Edge')) return 'Edge'; // Microsoft can put Chrome and Safari in its userAgent so we need to check it before other
        if(self.isIE) return 'Internet Explorer';
        if(this.existsVersion('Chromium')) return 'Chromium';
        if(this.existsVersion('OPR') || this.existsVersion('Opera')) return 'Opera';
        if(this.existsVersion('Chrome')) return 'Chrome';
        if(this.existsVersion('Seamonkey')) return 'Seamonkey';
        if(this.existsVersion('Firefox')) return 'Firefox';
        if(this.existsVersion('Safari')) return 'Safari';
        if(this.existsVersion('Konqueror')) return 'Konqueror';
        if(this.existsVersion('w3m')) return 'w3m';
        return null;
      },
      // return null if unknown (iOS and mac OS haven't this info)
      // need more info
      uAO.processor = function() {
        backgroundUA.generate(); // remove this after test
        if(self.isWindows) {
          if(this.has('Win64; x64')) return {OS: '64', navigator: '64'};
          if(this.existsKey0('WOW64')) return {OS: '64', navigator: '32'};
          //ARM
        }
        if(self.useLinux && this.has('x86_64')) return {OS: '64', navigator: '64'};
        if(this.getOS().endsWith('BSD') && this.has('amd64')) return {OS: '64', navigator: '64'};
        return null;
      },
      uAO.has = function(value) {
        return uA.indexOf(value) !== -1;
      },
      uAO.refreshComponent = function(component) {
        backgroundUA.load(component);
        if(self.debug >= 2) console.debug("pipnet << Refresh " + (!!component ? component : "all") + " component" + (!!component ? "" : "s") + "!");
      },
      // Maybe remove CSS object because you can simplyfy this to '-' + deprecratedPrefix.value + '-'
      self.deprecatedPrefix = (function() {
        var get = function(prefix) { // this method return the prefix parameter only if it can be used in your current browser otherwise it return an empty string
          if(PL.indexOf(this.values, prefix) !== -1) return prefix;
          return '';
        };
        return {
          CSS: { 'get': get },
          'get': get
        };
      })();
      
      /* Background Task Reloader because userAgent can change during emulation [Only for constants] */
      var backgroundUA = (function() {
        var root = self.userAgent;
        var cache = {
          kvp: {
            raw: function() {
              var raw = "";
              root.kvp.iterateFragments(function(value) { raw += value + "; "; });
              return raw.substr(0, raw.length - 2);
            }
          },
          deprecatedPrefix: {
            values: function() {
              var prefixs = [];
              if(self.isIE || root.existsVersion('Edge')) prefixs[0] = 'ms';
              if(root.existsVersion('Firefox')) prefixs[0] = 'moz';
              if(root.existsVersion('OPR') || root.existsVersion('Opera')) prefixs[0] = 'o';
              prefixs.push('webkit');
              return prefixs;
            },
            CSS: {
              valuesBasedOn: function(prefixs) {
                var cssPrefixs = [];
                for(var i = 0, l = prefixs.length; i < l; i++) cssPrefixs[i] = '-' + prefixs[i] + '-';
                return cssPrefixs;
              }
            }
          },
          isMobile: function() { // This doesn't work for Chromium emulation because this feature doesn't update the page like Firefox so... use eventHandler then update this module (isMobile/agent). And browsers based on Chromium like Opera lost their identity in the emulation mode
            if('ontouchstart' in html) return true; // navigator.maxTouchPoints is not a valid way in edge emulation
            if('orientation' in window || ('orientation' in window.screen && window.screen.orientation.type === "portrait-primary")) return true;
            try { doc.createEvent("TouchEvent"); return true; } catch(e) {}
            return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(uA)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(uA.substr(0,4));
          }
        };

        var updateUA = function(uA) {
          uAO.str = uA;
          root.kvp['raw'] = cache.kvp.raw();
          ID = uA || navigator.vendor || window.opera;
          self.platform = navigator.platform;
        };

        return {
          generate: function() {
            console.log(Googlebot, Chromium);
            updateUA(navigator.userAgent || navigator.appVersion);
            if(root.existsVersion('Chrome')) {
              Googlebot.isValid(function(req) {
                if(req.type === 'IP' && !req.value) return;
                var uA_BOT = req.type === 'UA' ? uA : "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36"
                Chromium.stableVersion(function(stable) {
                  updateUA(uA_BOT.replace('Chrome/W.X.Y.Z', 'Chromium/' + stable));
                });
              });
            }
          },
          classLoader : {
            CONSTANTS: function() {
              self.useChromium = root.existsVersion('Chrome') || root.existsVersion('Chromium');
// IE synthax
/*@acc_on @*/
/*@if (@_jscript_version !== undefined) self.isIE = true;
@end @*/
              if(!self.isIE) self.isIE = 'ActiveXObject' in window || 'documentMode' in doc || root.existsVersion('Trident') || root.existsKey0('MSIE', " "); // IE sometimes doesn't have Trident so strange
              self.isMobile = cache.isMobile();
              // based on chrome://resources/js/cr.js
              self.useLinux = root.existsKey0('Linux');
              self.isWindows = self.platform.indexOf('Win') !== -1;
              self.isMac = self.platform.indexOf('Mac') !== -1;
              self.useAndroid = root.existsKey0('Android', " ");
              self.useiOS = root.existsKey0('CriOS') || (/iPad|iPhone|iPod|MacIntel/.test(self.platform) && !root.existsKey0("Safari"));
            },
            DEPRECATED_PREFIX: function() {
              var dPValues = cache.deprecatedPrefix.values();
              self.deprecatedPrefix['values'] = dPValues;
              self.deprecatedPrefix['value'] = dPValues[0];
              self.deprecatedPrefix.CSS['values'] = cache.deprecatedPrefix.CSS.valuesBasedOn(dPValues);
              self.deprecatedPrefix.CSS['value'] = '-' + dPValues[0] + '-';
            }
          },
          load: function(component) {
            this.generate();

            if(component) this.classLoader[component]();
            else PL.iterateArrayObject(this.classLoader, function(f) { this.classLoader[f](); }, this);
          }
        };
      })();
      backgroundUA.load();

      self.Ajax.validRequest({
        url: "/github/standalone/net/server.php",
        method: 'HEAD',
        context: this,
        onSuccess: function(req) {
          self.srvSoftware = new self.object.ObserverID(req.getResponseHeader('Software') || req.getResponseHeader('Server')); // it's not recommended to pass server info in header Server for all page so do expose_php = Off in php.ini

          /* to create a more robust/faster check (without userAgent + website supports) for TLS/SSL detection use this way:
          // you can also use this method to check if you're website supports specific TLS/SSL version
            With apache:

            in ssl.conf on another folder:
            SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1 // version that are not supported (all without the version that you check: here it's TLS 1.2)
            SSLCipherSuite HIGH:!aNULL:!MD5:!3DES // high cipher
            SSLHonorCipherOrder on // disable client preference

            With Nginx: ???
    
            add an image test.png in this folder
    
            and then you can simply create a request and see if the image is loaded without failed error:
            var img = document.createElement('img');
            img.style.display = "none";
            img.addEventListener('load', function() {
              // TLS 1.2 supported for navigator AND website
            }, false);
            img.addEventListener('error', function() {
              // TLS 1.2 not supported for navigator AND website
            }, false);
            img.src = "folder/test.png";
            document.body.appendChild(img);
          */
          // return null if not supported any version of tls or navigator is unknown
          // you can supports unknown navigator with:
          /* var tls = TLS();
              if(tls) return tls;
              else {
                if(has('navID')) return "1.0";
                // unknown navigator
              }
          */
          // ref: https://github.com/mail-in-a-box/user-agent-tls-capabilities/blob/master/clients.csv
          self.security = {
            // return the latest TLS version supported by the navigator and NOT the website
            // return null for unknown
            // this is a default method if you want to supports more navigator add it: if you find a result null for this method check that with existsVersion/existsKey
            // use parseFloat(x)/parseInt(x, 10) and not Number(x) to parse this value because value can have '-' that indicate the returned version is supported but disable by default or/and partial support
            // alternatively you can use pipnet.parseNumber(str, intOnly) that use your preference defined by strict field
            // set [draftVers] to false if you want only to ignore partial support/draft/disable by default of TLS version
            // WARNING: the returned supported version does not indicate that the lower versions are also supported
            // ref: https://caniuse.com
            // need more info for deprecated TLS 1.0
            TLS: function(draftVers) {
              if(draftVers == null) draftVers = true;
              var chromVers = uAO.getVersion(uAO.existsVersion('Chromium') ? 'Chromium' : 'Chrome');
              if(chromVers) { // this detect also for all navigator that use chromium (opera, lastest edge version)
                var vers = chromVers.get().VALUE;
                if(!uAO.has('Mobile')) { // don't need isMobile method because this method run only with userAgent and not Touch/Storage detection
                  if(vers >= 54) return "1.3" + (draftVers && vers < 70 ? "-" : "");
                  if(vers >= 30) return "1.2";
                  if(vers >= 22) return "1.1";
                } else if(vers >= 78) return "1.3";
                return "1.0";
              }
              if(uAO.existsVersion('Firefox')) {
                var vers = Number(uAO.getVersion0('Firefox'));
                if(!uAO.has('Mobile')) {
                  if(vers >= 51) return "1.3" + (draftVers && vers < 63 ? "-" : "");
                  if(vers >= 24) return "1.2" + (draftVers && vers < 27 ? "-" : "");
                  if(draftVers && vers >= 23) return "1.1-";
                } else if(vers >= 68) return "1.3";
                return "1.0";
              }
              if(uAO.existsVersion('Edge')) return Number(uAO.getVersion0('Edge')) >= 12 ? "1.2" : "1.0";
              if(self.isIE) {
                var ieUaVers = uAO.getValue('rv') || uAO.getValue0('MSIE', " ");
                var vers = Number(uAO.ieCompatibilityMode0(ieUaVers) ? doc.documentMode : ieUaVers);
                if(vers >= 8) return "1.2" + (draftVers && vers !== 11 ? "-" : "");
                if(vers >= 7) return "1.0"; // see https://github.com/Fyrd/caniuse/issues/4057
              }
              if(uAO.existsVersion('Safari')) {
                var vers = self.object.Version(uAO.getVersion0('Safari')).VALUE;
                if(vers >= (self.useiOS ? 12.2 : 12.1)) return "1.3" + (draftVers && !self.useiOS ? "-" : "");
                if(vers >= (self.useiOS ? 5 : 7)) return "1.2";
                return "1.0";
              }
              if(self.useAndroid) return self.object.Version(uAO.getValue0('Android', " ")).VALUE >= 4.42 ? "1.2" : "1.0";
    
              var javaVers = uAO.getVersion('Java'); // https://blogs.oracle.com/java-platform-group/diagnosing-tls,-ssl,-and-https
              if(javaVers) {
                var vers = javaVers.get().VALUE;
                if(vers >= 8) return "1.2";
                if(draftVers) {
                  if(vers >= 7) return "1.2-";
                  if(vers >= 6.111) return "1.1-";
                }
                return "1.0";
              }
    
              var openSSLVers = uAO.getVersion('OpenSSL') || self.srvSoftware.getVersion('OpenSSL');
              if(openSSLVers) return openSSLVers.get().VALUE >= 1.01 ? "1.2" : "1.0";
    
              if(uAO.existsKey0('Googlebot', " ") || uAO.existsVersion('Yahoo! Slurp') || uAO.existsVersion('BingPreview') || uAO.existsVersion('YandexBot')) return "1.2"; // bot
              return null;
            },
            // WARNING: Don't use this before getter if you want the value do TLS() and check if value is null like TLS() == null
            canUseTLS: function() {
              if(self.isIE) {
                var ieUaVers = uAO.getValue('rv') || uAO.getValue0('MSIE', " ");
                return Number(uAO.ieCompatibilityMode0(ieUaVers) ? doc.documentMode : ieUaVers) >= 7;
              }
              return self.useChromium || uAO.existsVersion('Firefox') || uAO.existsVersion('Edge') || // Desktop
                    uAO.existsVersion('Safari') || self.useAndroid || // Mobile
                    uAO.existsVersion('Java') || uAO.existsVersion('OpenSSL') || self.srvSoftware.existsVersion('OpenSSL') || // Library
                    uAO.existsKey0('Googlebot', " ") || uAO.existsVersion('Yahoo! Slurp') || uAO.existsVersion('BingPreview') || uA.existsVersion('YandexBot'); // Bot
            },
            // return the latest SSL version supported by the navigator and NOT the website
            // return null for unknown
            // the SSL encryption way is really deprecated and have many vulnerabilities that have fixed in TLS version so use these two function only in a compatibility context
            // need more info here
            SSL: function() {
              if(self.useChromium || uAO.existsVersion('Firefox')) return null;
              if(uAO.existsVersion('Java')) return null; // 2015 patch releases
              if(self.useAndroid || uAO.existsKey0('Windows Phone', " ")) return "3";
              if(self.isIE) {
                var ieUaVers = uAO.getValue('rv') || uAO.getValue0('MSIE', " ");
                if(Number(uAO.ieCompatibilityMode0(ieUaVers) ? doc.documentMode : ieUaVers) === 11 && !uAO.existsKey0('Windows Phone', " ")) return null;
                return "3"; // Windows Phone IE + IE10-
              }
              if(uAO.existsVersion('Safari') && !self.isWindows) return "3";
    
              var openSSLVers = uAO.getVersion('OpenSSL') || self.srvSoftware.getVersion('OpenSSL');
              if(openSSLVers && openSSLVers.get().VALUE <= 0.98) return "3";
              
              if(uAO.existsKey0('Googlebot', " ") || uAO.existsVersion('Yahoo! Slurp') || uAO.existsVersion('BingPreview') || uAO.existsVersion('YandexBot')) return "3";
              return null;
            },
            // WARNING: Don't use this before getter if you want the value do SSL() and check if value is null like SSL() == null
            canUseSSL: function() {
              return !!this.SSL(); // like this boolean check use exactly the same methods that are used in SSL()
            }
          }
        }
      });
    })(uA||navigator.vendor||window.opera, /\(([^)]+?)\)/g, "([^( |;)]+)"), // except ) ( space or ;

    self.event = (function() {
      // to check if the navigator can supports event do: module::navigator.event.type > 0
      var type = (function() {
        if('addEventListener' in window && 'removeEventListener' in window) return 2;
        if('attachEvent' in window && 'detachEvent' in window) return 1;
        return 0;
      })();
      /* Edit - support target or nodeName to work with specific event like change select error... */
      var isSupportedOnNodeName = function(eventNameSuffix, nodeName) {
        if (!self.canUseDOM) return false;

        var eventName = "on" + eventNameSuffix;
        var element = doc.createElement(nodeName);
        element.setAttribute(eventName, 'return;');
        var isSupported = typeof element[eventName] === 'function';

        if (!isSupported && self.useHasFeature && eventNameSuffix === 'wheel')
          isSupported = doc.implementation.hasFeature('Events.wheel', '3.0');
          // This is the only way to test support for the `wheel` event in IE9+.

        return isSupported;
      },
      // use this only if don't know what nodeName is, except for modern browser that isSupportedOnNode is faster than isSupportedOnNodeName
      isSupportedOnNode = function(eventNameSuffix, target, capture) {
        var abstractElement = target || doc;
        if (!self.canUseDOM || capture && !('addEventListener' in abstractElement)) return false;

        var eventName = "on" + eventNameSuffix;
        var isSupported = eventName in abstractElement;
        if (!isSupported) {
          var element = doc.createElement(target.nodeName);
          var nullAttribute = target == null || element.getAttribute(eventName) == null;
          if(nullAttribute) element.setAttribute(eventName, 'return;');
          var isSupported = typeof element[eventName] === 'function';
          if(nullAttribute) element.removeAttribute(eventName);
        }

        if (!isSupported && self.useHasFeature && eventNameSuffix === 'wheel')
          isSupported = doc.implementation.hasFeature('Events.wheel', '3.0');

        return isSupported;
      },
      // checked on global
      isSupportedOnDocument = function(eventNameSuffix, capture) {
          return isSupportedOnNode(eventNameSuffix, html, capture);
      };

      /* Mozilla ref: developer.mozilla.org/fr/docs/Web/API/EventTarget/addEventListener#Détection_en_toute_sécurité_du_support_des_options */
      var supportsOption = function(name) {
        var isSupported = false;
        try {
          var opts = Object.defineProperty({}, name, {
            get: function() { isSupported = true; }
          });
          window.addEventListener('test' + name, null, opts);
          window.removeEventListener('test' + name, null, opts);
        } catch(e) {} // catch also if addEventListener doesn't exists because attachEvent doesn't have args parameter
        return isSupported;
      };

      return {
        'type': type,
        method: (function() {
          var modernWay = type === 2;
          return {
            add: modernWay ? 'addEventListener' : 'attachEvent',
            remove: modernWay ? 'removeEventListener' : 'detachEvent'
          };
        })(),
        'isSupportedOnNodeName': isSupportedOnNodeName,
        'isSupportedOnNode': isSupportedOnNode,
        'isSupportedOnDocument': isSupportedOnDocument,
        wheel: {
          name: isSupportedOnDocument('wheel') ? 'wheel' : (self.userAgent.existsVersion("Firefox") ? 'DOMMouseScroll' : 'mousewheel'), 
          up: function(e) {
            return G.scrollDirection(e, 'Y');
          },
          right: function(e) {
            return G.scrollDirection(e, 'X');
          }
        },
        // Experimental feature
        supportsOptionOnSimpleMethod: function(parent, method, name) {
          var isSupported = false;
          try {
            parent[method](Object.defineProperty({}, name, { get: function() { isSupported = true; } }));
          } catch(e) {}
          return isSupported;
        },
        'supportsOption': supportsOption,
        supportsPassive: supportsOption('passive'), // Shortcut
        // use this if you want retrieve another parameter like rotationAngle
        coordTarget: function(e) {
          var mobile = ['touchstart', 'touchmove', 'touchend', 'touchcancel'], pc = ['mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'contextmenu'];
          var type = e.type;
          var h = PL.indexOf(mobile, type) === -1;
          if(PL.indexOf(pc, type) === -1 && h) throw new Error("pipnet << " + type + " isn't supported !");
          return !h ? (e.targetTouches || e.changedTouches || e.touches)[0] : e;
        },
        basicPointer: function(e) { // Shortcut
          var tar = this.coordTarget(e);
          return {x: tar['x'], y: tar['y']};
        },
        // type = client|page|offset|screen and all other implementation in future navigator JS core
        // NOTE: layerX or layerY, movementX, movementY is located at root of the event object for desktop event it's why you don't need to use this to get it
        pointer: function(e, type) {
          var tar = this.coordTarget(e);
          return {x: tar[type + 'X'], y: tar[type + 'Y']};
        }
      }
    })();
    if(self.event.type === 0) throw new Error("pipnet << Deprecated browser; please update your navigator [" + self.userAgent.id + "]");
    //maybe use scrollTop detection (performance)
    self.canMeasureHTML = html.clientHeight > 0; // BUG IE5 => In this case scrollTop/Left is always equals to 0, same for clientHeight/Width and scrollHeight/Width have wrong value only for html

    var _loadModules = function() {
      isInit = true;
      var hasDebugLoading = self.debug >= 2;
      var hasGoupAndDebugLoading = self.groupLog && hasDebugLoading;
      if(hasGoupAndDebugLoading) console.group("pipnet << Loading Core modules");
      PL.iterateArrayObject(pipmodule, function(key) {
        self.module[key] = self.module['pipnet@' + key] = pipmodule[key];
        if(hasDebugLoading) console.debug("pipnet << Loaded '" + key + "' module");
      });
      if(hasGoupAndDebugLoading) console.groupEnd("pipnet << Loading Core modules");
      api.fireOwnEvent('load');
    }
    if(!isDeferLoading) _loadModules();
  };

  self.showPackages = function() {
    if(self.safeMode) console.warn("pipnet << custom modules are ignored because safeMode is enabled");
    var temp = {};
    PL.iterateArrayObject(self.module, function(key) {
      if(key.indexOf('@') === -1) return;
      temp[key] = self.module[key];
    });
    console.debug("pipnet << List of active modules", temp);
  };

  /* Static functions */
  // option is an object ({writeInGlobal: @bool = true, writeSelfModule: @bool = false, disposeOption: @bool = true})
  self.exports = function(name, object, module, option) {
    if(!isInit) throw new Error("pipnet << API isn't loaded, the compilation of new module must be called after init function");
    if(typeof object !== 'object') throw new TypeError("pipnet << Can't automatically merge modules because " + object + " isn't an object");
    if(self.safeMode) return;
    option = api.defaultConfig(option, {writeInGlobal: true, writeSelfModule: false, disposeOption: true});
    name = PL.string.trim(name).replace(/ /g, '-');

    if(api.importModule(name, name, object)) {
      self.useModule = true;
      if(option.writeInGlobal) window[name] = object;
      if(option.writeSelfModule) object.module = module;

      var hasDebugLoading = self.debug >= 2;
      var hasGoupAndDebugLoading = self.groupLog && hasDebugLoading;
      if(hasGoupAndDebugLoading) console.group("pipnet << Loading " + name + " modules");
      if(object.hasOwnProperty('pipoption')) {
        var array, isExclude = 'exclude' in object.pipoption;
        if(isExclude) array = object.pipoption.exclude;
        else if('include' in object.pipoption) array = object.pipoption.include;
        if(array) {
          object.pip = {};
          PL.iterateArrayObject(pipmodule, function(key) {
            var afterM = key.substr(7);
            var posM = PL.indexOf(array, afterM);
            if(isExclude ? posM === -1 : posM !== -1) {
              switch(afterM) {
                case 'polyfill': object.pip['PL'] = PL; break;
                case 'generic': object.pip['G'] = G; break;
                default: object.pip[afterM] = pipmodule['pipnet@' + afterM];
              }
            }
          });
        }
        if(hasDebugLoading) console.debug("pipnet << Loaded '" + name + "@" + name + "' module with arguments", object.pipoption);
        if(option.disposeOption) delete object.pipoption;
      } else {
        object.pip = {
          'PL': PL,
          'G': G,
          'locate': module['pipnet@locate']
        };
        if(hasDebugLoading) console.debug("pipnet << Loaded '" + name + "@" + name + "' module");
      }

      PL.iterateArrayObject(module, function(key) {
        var value = module[key];
        key = PL.string.trim(key).replace(/ /g, '-'); // Normalize name: trim + space => tiret
        
        if(api.importModule(name, key, module[value]) && hasDebugLoading) console.debug("pipnet << Loaded '" + name + "@" + key + "' module");
      });
      if(hasGoupAndDebugLoading) console.groupEnd("pipnet << Loading " + name + " modules");
    }
  },
  self.isWindow = function(el) {
    return el === html || el === body;
  };

  /* API can be recognized with generic module */
  api.defaultConfig = function(config, def) {
    PL.iterateArrayObject(def, function(key) {
      if(config[key] != null) return;
      config[key] = def[key];
    });
    return config || {};
  },
  api.importModule = function(name, subname, module) {
    if(self.module.hasOwnProperty(name + '@' + subname)) {
      console.warn("pipnet << Module '" + name + '@' + subname + "' ignored: this name is already defined in your modules", self.module[name + '@' + subname]);
      return false;
    }
    self.module[name + '@' + subname] = module;
    return true;
  };
  window['pipnet'] = self;
})(document);