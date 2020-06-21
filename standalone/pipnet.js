/* pipnet 1.46-beta . (c) The pipnet contributors . github.com/Lulu13022002/pipnet/blob/master/LICENSE */
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
    if (!self.canUseDOM) throw new Error("pipnet << Deprecated browser; please update your browser [" + self.userAgent.id + "]");

    self.useHasFeature = (function() {
      var implementation = doc.implementation;
      return implementation && implementation.hasFeature && implementation.hasFeature('', '') !== true;
    })(),
    self.isInDOM = function(target) {
      if(!this.canUseDOM || !target || typeof target !== 'object' || !('children' in target)) return false;
      if(PL.array.indexOf(['SCRIPT', 'STYLE', 'META', 'TITLE', 'HEAD', 'LINK'], target.nodeName) !== -1 || head.contains(target)) return false;
      var owner = target.ownerDocument;
      return !!owner && (window == (owner.defaultView || owner.parentWindow)); /*=== exception in IE8- => return false */
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
        object: {
          dontEnums: ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
          // to skip enum bug check do (o, callback, false)
          // the context allow you to change this variable at your current context in whatever object (available in all callback)
          // o is an array but can be nullable or undefined or whatever so you don't have to check it before this call like: [if(args)] self::module.polyfill.iterate0(args, e => console.log(e))
          // when return value in callback isn't equals to undefined (no return value or return undefined)
          // the loop is break and this method return the return value of the callback
          // supportsDontEnumBug to fix the JScript [[DontEnum]] bug
          iterate0: function(o, callback, context, supportsDontEnumBug) {
            var protoHasOwnProperty = Object.prototype.hasOwnProperty;
        
            for (var prop in o) {
              if (protoHasOwnProperty.call(o, prop)) {
                var returnValue = callback.call(context, prop);
                if(returnValue !== undefined) return returnValue;
              }
            }
        
            if (supportsDontEnumBug && !({ toString: null }).propertyIsEnumerable('toString')) { // when hasOwnProperty work like: key in object / must be checked in older browser
              for (var i = 0; i < 7; i++) {
                var dontEnum = this.dontEnums[i];
                if (protoHasOwnProperty.call(o, dontEnum)) {
                  var returnValue = callback.call(context, dontEnum);
                  if(returnValue !== undefined) return returnValue;
                }
              }
            }
          },
          iterate: function(o, callback, context) {
            return this.iterate0(o, callback, context, true); // default to true cause polyfill module
          },
          size: function(o) {
            var size = 0;
            this.iterate(o, function() { size++; });
            return size;
          },
          // polyfill of Object.keys
          // WARNING: Don't use this to check if array object is empty do instead size() > 0 or if you must iterate object after, use directly iterate function, the callback are called only if array isn't empty
          keys: function(o) {
            var result = [];
            this.iterate(o, function(item) { result.push(item); });
            return result;
          },
          values: function(o) {
            var result = [];
            this.iterate(o, function(item) { result.push(o[item]); });
            return result;
          },
          entries: function(o) {
            var result = [];
            this.iterate(o, function(item) { result.push([item, o[item]]); });
            return result;
          },
          assign: function(target) {
            for(var i = 1, l = arguments.length; i < l; i++) {
              this.iterate(arguments[i], function(key) {
                target[key] = this[key];
              }, arguments[i]); // allow async iteration while outside loop continue
            }
            return target;
          },
          getOwnPropertySymbols: function(o) {
            var result = [];
            var i = 0;
            this.iterate(o, function(key) {
              if(typeof key !== 'symbol') return;
              result[i] = key;
              i++;
            });
            return result;
          },
          is: function(o1, o2) { // utility ???
            return o1 === o2;
          },
          setPrototypeOf: function(o, proto) { // if you don't want any check use directly the declared version (o.prototype = proto;)
            var l = arguments.length;
            if(l < 2) throw new TypeError("Object.setPrototypeOf requires at least 2 arguments, but only " + l + " were passed");
            if (o == null) throw new TypeError("Object.setPrototypeOf called on null or undefined");
            var typep = typeof proto;
            if(typep !== 'object') throw new TypeError("Object.setPrototypeOf: expected an object or null, got number");  // null is a teoric object typeof null === 'object'
            if(proto !== null) o.prototype = proto;
            else delete o.prototype;
            return o;
          }
        },
        array: {
          indexOf: function(o, searchElement, fromIndex) {
            var protoIndexOf = Array.prototype.indexOf;
            if(protoIndexOf) return protoIndexOf.call(o, searchElement, fromIndex);
            else {
              if (o == null) throw new TypeError("Array.indexOf called on null or undefined"); // Firefox's error is "can't convert [array] to object" but chromium and microsoft return this message so i choose the majority to avoid a real check between browser (NAV::userAgent.has('Firefox'))
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
          includes: function(o, searchElement, fromIndex) {
            var protoIncludes = Array.prototype.includes;
            if(protoIncludes) return protoIncludes.call(o, searchElement, fromIndex);
            else return this.indexOf(o, searchElement, fromIndex) !== -1;
          },
          lastIndexOf: function(o, searchElement, fromIndex) {
            var protoLastIndexOf = Array.prototype.lastIndexOf;
            //if(protoLastIndexOf) return protoLastIndexOf.call(o, searchElement, fromIndex);
            //else {
              if (o == null) throw new TypeError("Array.lastIndexOf called on null or undefined"); // Firefox's error is "can't convert [array] to object" but chromium and microsoft return this message so i choose the majority to avoid a real check between browser (NAV::userAgent.has('Firefox'))
              o = Object(o); // compulsory ???
              var len = o.length >>> 0; // >>> 0 compulsory ?
              if (len === 0) return -1;

              var n = Number(fromIndex);
              if(isNaN(n)) n = len-1;

              var k = Math.min(n >= 0 ? n : len - Math.abs(n), len-1);
              
              for (; k >= 0; k--) {
                if (k in o && o[k] === searchElement) return k;
              }
              return -1;
            //}
          },
          // this method i just a test
          splice: function(array, start, deleteCount) {
            var result = [], l = array.length;
            if(deleteCount <= 0 || start > l - 1) return result;
            if(start < -l) start = -l;

            var reverse = start < 0;
            var min;
            if(reverse) min = l-1 + start;

            for(var i =  0; i < l; i++) {
              if(reverse ? i <= min : i < start) continue;
              if(deleteCount === 0) break;
              result.push(array[i]);
              delete array[i]; // find a ways that resize array
              deleteCount--;
            }
            return result;
          },
          slice: function(array, start, end) {
            var result = [], l = array.length;
            if(start > l - 1 || end <= 0) return result;
            if(start < -l) start = -l;

            var reverseS = start < 0;
            var min;
            if(reverseS) {
              min = l-1 + start + 1;
              if(end <= min) return result;
            }

            var reverseE = end < 0;
            var max;
            if(reverseE) {
              max = l-1 + end + 1;
              if(start >= max) return result;
            }
            console.log("iter");
          
            for(var i = 0; i < l; i++) {
              if(i < (reverseS ? min : start)) continue;
              if(i >= (reverseE ? max : end)) break;
              result.push(array[i]);
            }
            return result;

          },
          reverse: function(array) {
            var result = [];
            var ri = 0;
            for(var i = array.length-1; i >= 0; i--) {
              result[ri] = array[i];
              ri++;
            }
            return result;
          },
          //@Deprecated
          sort: function(array) {
            var result = [];
            var comparer = [];
            var extra = [];
            for(var i = 0, l = array.length; i < l; i++) {
              var item = array[i];
              var type = typeof item;
              switch(type) {
                case "number":
                case "string":
                  comparer[i] = item.toString().charCodeAt(0);
                  break;
                case "object":
                  if(item === null) this.comparer[i] = item.toString().charCodeAt(0);
                  if(item === undefined) extra[i] = item; // define max unicode value + 1 in comparer
                  if(item instanceof Array) { // in attempt of polyfill
                    if(item.length === 0) this.comparer[i] = -1; // before charCodeAt
                  }
              }
            }
            return result;
          },
          // improved version of standard join method:
          /* you can change used method to show item with opt parameter:
            {method: 'toSource'}
            if you need to target specific type you can do:
            {string: toLowerCase}
            // if type is string call toLowercase otherwise call the default (opt.method or if undefined 'toString' method)
          */
          join: function(array, separator, opt) {
            separator || (separator = ',');
            if(opt == null || typeof opt !== 'object') opt = {method: 'toString'};
            else opt = api.defaultConfig(opt, {method: 'toString'});

            var cache = {};
            var result = "";
            for(var i = 0, l = array.length; i < l; i++) {
              var item = array[i];
              if(i !== 0) result += separator;
              if(item == null) continue;
              var type = typeof item;
              result += item[cache[type] || (cache[type] = type in opt) ? opt[type] : opt.method](); // need polyfill for toSource method
            }
            return result;
          },
          shift: function(array) {
            var l = array.length;
            if(l === 0) return;
            var result = array[0];
            for(var i = 0, l = l -1; i < l; i++)
              array[i] = array[i+1];
            
            array.length--;
            return result;
          },
          unshift: function(array) {
            var argsl = arguments.length;
            var al = array.length;
            if(argsl < 2) return al;
            var _array = this.clone(array); // array are declared by reference so.. (maybe use Object.freeze).
            argsl--;
            for(var i = 0; i < argsl; i++)
              array[i] = arguments[i + 1];
            
            var a = 0;
            for(var i = argsl, l = argsl + al; i < l; i++) {
              array[i] = _array[a];
              a++;
            }
            return array.length;
          },
          // 1 === SUCCESS | 0 === FAIL (when there are not item defined)
          push: function(array) {
            var argsl = arguments.length;
            if(argsl < 2) return 0;
            var al = array.length;
            var a = 1;
            for(var i = al, tl = al + argsl -1; i < tl; i++) {
              array[i] = arguments[a];
              a++;
            }
            return 1;
          },
          pop: function(array) {
            var l = array.length;
            if(l === 0) return;
            var result = array[l-1];
            array.length--;
            return result;
          },
          // In modern way use directly ... => [0, 2, ...[0, 2]] same for arguments => ...items
          concat: function(array) {
            var a = array.length;
            for(var i = 1, l = arguments.length; i < l; ) {
              var item = arguments[i++];
              if(item == null || !(item instanceof Array)) {
                array[a++] = item;
                continue;
              }
              
              for(var z = 0, s = item.length; z < s; ) array[a++] = item[z++];
            }
            return array;
          },
          // improved forEach with return null inside the loop you call the break in the internal loop
          forEach: function(array, runnable, thisArg) {
            for(var i = 0, l = array.length; i < l; i++) {
              if(runnable.call(thisArg, array[i], i, array) === null) break;
            }
          },
          map: function(array, predicate, thisArg) { // not predicate
            var result = [];
            this.forEach(array, function(value, index) {
              result[index] = predicate.call(this, value, index, array);
            }, thisArg);
            return result;
          },
          // flat in build
          flat: function(array, deepLevel) {
            for(var i = 0, l = array.length; i < l; ) {
              var item = array[i++];
              if(!(item instanceof Array)) continue;
            }
          },
          flatMap: function(array, predicate, thisArg) { // ? flatMap == map
            var result = [];
            this.forEach(array, function(value, index) {
              result[index] = predicate.call(this, value, index, array);
            }, thisArg);
            return result;
          },
          some: function(array, predicate, thisArg) {
            var result = false;
            this.forEach(array, function(value, index) {
              if(predicate.call(this, value, index, array)) {
                result = true;
                return null;
              }
            }, thisArg);
            return result;
          },
          every: function(array, predicate, thisArg) {
            var result = true;
            this.forEach(array, function(value, index) {
              if(!predicate.call(this, value, index, array)) {
                result = false;
                return null;
              }
            }, thisArg);
            return result;
          },
          filter: function(array, predicate, thisArg) {
            var result = [];
            var a = 0;
            for(var i = 0, l = array.length; i < l; i++) {
              if(predicate.call(thisArg, array[i], i, array))
                result[a++] = array[i];
            }
            return result;
          },
          find: function(array, predicate, thisArg) {
            var result;
            this.forEach(array, function(value, index) {
              if(predicate.call(this, value, index, array)) {
                result = value;
                return null;
              }
            }, thisArg);
            return result;
          },
          findIndex: function(array, predicate, thisArg) {
            var result = -1;
            this.forEach(array, function(value, index) {
              if(predicate.call(this, value, index, array)) {
                result = index;
                return null;
              }
            }, thisArg);
            return result;
          },
          fill: function(array, value, start, end) { // view slice
          },
          // improved reduce that allow a custom this in thisArgs param and another step between each iteration
          reduce: function(array, callback, initialValue, step, thisArgs) { // inject
            var l = array.length;
            if(l === 0) return;
            var hasInitialValue = initialValue != null;
            var start = hasInitialValue ? 0 : 1;
            if(!hasInitialValue) initialValue = array[0];
            step || (step = 1);

            var previousValue = initialValue; // readability
            for(var i = start; i < l; i += step)
              previousValue = callback.call(thisArgs, previousValue, array[i], array);
            return previousValue;
          },
          // improved reduceRight that allow a custom this in thisArgs param and another step between each iteration
          reduceRight: function(array, callback, initialValue, step, thisArgs) { // reduceReverse/injectReverse/injectRight
            var l = array.length;
            if(l === 0) return;
            var hasInitialValue = initialValue != null;
            var start = l - (hasInitialValue ? 1 : 2);
            if(!hasInitialValue) initialValue = array[l-1];
            step || (step = 1);

            var previousValue = initialValue; // readability
            for(var i = start; i >= 0; i -= step)
              previousValue = callback.call(thisArgs, previousValue, array[i], array);
            return previousValue;
          },
          // warning the order is reverse like reduceRight
          // optimized loop for sum array
          sum: function(array, callback, thisArg, initialValue) {
            var len = array.length;
            var hasCallback = callback !== undefined;
            var result = initialValue|0;
            while(len-- !== 0) 
              result += hasCallback ? callback.call(thisArg, array[len], array) : array[len];
            return result;
          },
          keys: function(array) {
            var protoKeys = Array.prototype.keys; // maybe freeze prototype to ignore change by other script after init()
            if(protoKeys) return protoKeys.call(array);
            else return new self.object.ArrayIterator('keys', array);
          },
          values: function(array) {
            var protoValues = Array.prototype.values;
            if(protoValues) return protoValues.call(array);
            else return new self.object.ArrayIterator('values', array);
          },
          entries: function(array) {
            var protoEntries = Array.prototype.entries;
            if(protoEntries) return protoEntries.call(array);
            else return new self.object.ArrayIterator('entries', array);
          },
          copyOfRange: function(original, from, to) {
            var newLength = to - from;
            if (newLength < 0) return [];
            var copy = Array(newLength);
            this._copy(original, from, copy, 0,
                             Math.min(original.length - from, newLength));
            return copy;
          },
          _copy: function(src, srcPos, dest, destPos, length) {
            while(length-- != 0) dest[destPos++] = src[srcPos++];
          },
          copyWithin: function(array, target, start, end) {

          },
          // deepLevel = -1 mean that you clone all array inside main array
          clone: function(array, deepLevel) { // copy
            var hasDeepLevel;
            (deepLevel, hasDeepLevel = deepLevel >= 0) ||
            (deepLevel = -1, hasDeepLevel = false);
            var l = array.length;
            var result = Array(l);
            for(var i = 0; i < l; i++) {
              var item = array[i];
              if(!hasDeepLevel) result[i] = item; // all
              else if(hasDeepLevel) {
                if(this.isArray(item)) result[i] = item;
                do {
                  result[i++] = this.clone(item, deepLevel);
                  l++;
                } while(deepLevel-- !== 0);
              }
            }
            return result;
          },
          toSource: function(array) {
            var result = "[";
            for(var i = 0, l = array.length; i < l; i++) {
              if(i !== 0) result += ", ";
              var item = array[i];
              var type = typeof item;
              if(type === 'number') result += item;
              else {
                var source = item.toSource(); // use polyfill for unknown method
                if(type === 'object') source = source.substring(1, source.length -1);
                if(type === 'string')
                  source = source.substring(source.indexOf('(', 11) + 1, source.lastIndexOf(')', source.length -2));
                
                result += source;
              }
            }
            return result += "]";
          },
          toString: function(array) {
            var result = "";
            for(var i = 0, l = array.length; i < l; i++) {
              if(i !== 0) result += ",";
              result += array[i].toString(); // use polyfill for unknown method
            }
            return result;
          },
          isArray: function(array) {
            return array instanceof Array; // proper than Object.prototype.toString.call(x) === '[object Array]'
          },
          valueOf: function(native) {
            return Boolean(native) ? Array : this;
          },
          from: function(o) {
            if(this.isArray(o)) return o;
            if(!('length' in o)) return [];
            var len = o.length;
            if(len <= 0) return [];

            var result = Array(len); // avoid resize after any push
            while(len-- !== 0) result[len] = o[len];
            return result;
          }
        },
        // difference with typeof is that like method name say this take
        // the child class and not the primitive type (except for null and undefined)
        // when typeof new Number(5) return object
        // childOf(new Number(5)) return number;
        // available values: null, undefined, Number, String, Object, Boolean, Array, Symbol, BigInt, RegExp, Arguments, Date, Error, Function...
        childOf: function(value) {
          if(value === null) return "null";
          if(value === undefined) return "undefined";
          var result = Object.prototype.toString.call(value);
          return result.substring(8, result.length-1);
        },
        // available values: see #childOf
        // if you only need to check the primitive type use 'typeof'
        // if you only need to check the class instance use 'instanceof'
        // if you need both of them use 'isChildOf'
        // that is equivalent to: this.childOf(value) === expected
        isChildOf: function(value, expected) {
          return typeof value === expected.toLowerCase() || value instanceof window[expected];
        },
        number: {
          POSITIVE_INFINITY: 1/0,
          NEGATIVE_INFINITY: -1/0,
          NaN: 0/0,
          MAX_SAFE_INTEGER: 9007199254740991, // Math.pow(2, 53) - 1
          MIN_SAFE_INTEGER: -9007199254740991,
          RAMANUJAN: function() {
            return Math.pow(Math.E, Math.PI * Math.sqrt(163));
          },
          // take x and new Number(x)
          isInteger: function(x) {
            if(!PL.isChildOf(x, 'Number')) return false;
            return this.__isInteger(x);
          },
          // take x, native version
          _isInteger: function(x) {
            if(typeof x !== 'number') return false;
            return this.__isInteger(x);
          },
          // take x, new Number(x), "x" and [x], null, true, false
          __isInteger: function(x) {
            return x % 1 === 0; // here x % 1, x is converted to number via Number(x)
          },
          // a safe integer is a integer between [-(2^53-1), 2^53-1]
          // when you have an overflow of these boundaries
          // the integer is rounded except for bigInt (xn)
          // But for bit operator (<<|>>(>)~^) the boundary of stable result
          // can be less than these boundaries
          // to avoid this strange result you can convert it to bigint
          // and replace >>> with >> (see#long#methods)

          // take x and new Number(x)
          isSafeInteger: function(x) {
            if(!this.isInteger(x)) return false;
            return this.__isSafeInteger(x);
          },
          // take x, native version
          _isSafeInteger: function(x) {
            if(!this._isInteger(x)) return false;
            return this.__isSafeInteger(x);
          },
          // take x (only number)
          __isSafeInteger: function(x) {
            return x < this.MAX_SAFE_INTEGER && x > this.MIN_SAFE_INTEGER;
          },
          // this doesn't ignore decimal value if you want to just ignore decimal and return only int part
          // use math#trunc or bit#trunc
          // this convert decimal to int without direct pow cause of strange result of multiple (see #emultiple that use this function)
          toInteger: function(x) {
            if(this.isInteger(x)) return x;
            return this.___toInteger(x);
          },
          _toInteger: function(x) {
            if(this._isInteger(x)) return x;
            return this.___toInteger(x);
          },
          __toInteger: function(x) {
            if(this.__isInteger(x)) return x;
            return this.___toInteger(x);
          },
          ___toInteger: function(x) {
            var str = String(x);
            var len = str.length;
            var i = 0;
            var hasDigit = false;
            var afterDot = false;
            var result = "";
            do {
              var char = str.charAt(i);
              if(char === '.') {
                afterDot = true;
                continue;
              }
              if(char === 'e') break;
              if(!afterDot && !hasDigit && char >= '0') hasDigit = true;
              if(char === '0' && !hasDigit) continue;
              result += char;
            } while(++i < len);
            return Number(result);
          },
          // take x and new Number(x)
          isFinite: function(x) {
            if(!PL.isChildOf(x, 'Number')) return false;
            if(this._isNaN(x) || this.isInfinite(x)) return false;
            return true;
          },
          // take x, native version
          _isFinite: function(x) {
            if(typeof x !== 'number') return false;
            if(this.__isNaN(x) || this._isInfinite(x)) return false;
            return true;
          },
          // take x (only number)
          __isFinite: function(x) {
            if(this.__isNaN(x) || this._isInfinite(x)) return false;
            return true;
            //return (x < 0 ? -x : x) <= Number.MAX_VALUE;
          },
          // allow NaN, new Number(NaN) and undefined, native version
          isNaN: function(x) {
            return this.__isNaN(Number(x));
          },
          // allow NaN, new Number(NaN)
          _isNaN: function(x) {
            if(x instanceof Number) return this.isNaN(x); // allow new Number(NaN) and disallow undefined
            return this.__isNaN(x);
          },
          // allow NaN and only NaN
          __isNaN: function(x) {
            return x !== x;
          },
          // take x and new Number(x)
          isInfinite: function(x) {
            x = Number(x); // allow new Number(x)
            return this._isInfinite(x);
          },
          // take x
          _isInfinite: function(x) {
            return x === Infinity || x === -Infinity;
          },
          // work only for number
          // for string use x === '-0'
          isS0: function(x) { // check signed zero
            if(x !== 0) return false;
            return this._isS0(x);
          },
          isU0: function(x) { // check unsigned zero
            if(x !== 0) return false;
            return !this._isS0(x);
          },
          // use this method when x is +0 or -0 otherwise use isS0 or isU0
          // when return value is false that mean the value is a unsigned zero (+0)
          // there are only these ways to detect -0 !== +0 => https://en.wikipedia.org/wiki/Signed_zero
          _isS0: function(x) {
            return 1/x === -Infinity;
          },
          // choose between mcountOfIntegerDigit and countOfIntegerDigit
          // depend of the power of the computer
          // if the power in calcul is high use mcountOfIntegerDigit otherwise countOfIntegerDigit
          // if you need to count negative char in calcul
          // you can do:
          /*  var total = mcountOfIntegerDigit(x);
              if(x < 0 || number.isS0(x)) total++;
              return total; */
          // you can also modify these functions if you always need to count negative char
          mcountOfIntegerDigit: function(x) {
            x = Number(x);
            return this._mcountOfIntegerDigit(x);
          },
          _mcountOfIntegerDigit: function(x) {
            if(x < 0) x = -x;
            return (Math.log(x + 1) / Math.LN10 | 0) + 1;
          },
          countOfIntegerDigit: function(x) {
            return this.__countOfIntegerDigit(String(PL.math.trunc(x)));
          },
          _countOfIntegerDigit: function(x) {
            return this.__countOfIntegerDigit(String(PL.math._trunc(x)));
          },
          __countOfIntegerDigit: function(x) {
            var str = String(x);
            var result = 0;

            var dotIndex = str.indexOf('.', 1), hasDot = dotIndex !== -1;
            var eIndex = str.indexOf('e', hasDot ? dotIndex : 1), hasE = eIndex !== -1;

            if(!hasDot && !hasE) {
              result = str.length;
              if(x < 0) result--;
            } else {
              result += hasDot ? dotIndex : eIndex;
              if(hasE) result += Number(str.substr(eIndex + 2));
            }
            return result;
          },
          countOfDecimalDigit: function(x) {
            x = Number(x);
            return this._countOfDecimalDigit(String(x));
          },
          _countOfDecimalDigit: function(str) {
            if(this.__isInteger(str)) return 0;
            return this.__countOfDecimalDigit(str);
          },
          __countOfDecimalDigit: function(str) {
            var result = 0;

            var dotIndex = str.indexOf('.', 1), hasDot = dotIndex !== -1;
            var eIndex = str.indexOf('e', hasDot ? dotIndex : 1), hasE = eIndex !== -1;

            if(hasDot) result += (hasE ? eIndex : str.length) -1 - dotIndex;
            if(hasE) result += Number(str.substr(eIndex + 2));
            
            return result;
          },
          // faster than Math.pow(2, -52)
          EPSILON: (function() {
            var epsilon = 1;
            while (1 + .5 * epsilon !== 1) epsilon *= .5
          })(), // difference with 1 - smallest value greater than 1
          BIG_EPSILON: 2.2204460492503130808472633361816e-16,
          MAX_PRECISION: 100, // to have a native result in IE you can pass this variable to 20 you can also use self.isIE ? 20 : 100 after initialization
          toFixed: function(x, precision) {
            if(x === Infinity || x === -Infinity) return x;
            precision = precision | 0;
            if(precision < 0 || precision > this.MAX_PRECISION) throw new RangeError("precision " + precision + " out of range");
            
            var str = x.toString();
            var dotIndex = str.indexOf('.');
            var currDecimal = 0;
            if(dotIndex !== -1) {
              if(precision === 0) {
                if(str.charAt(dotIndex+1) >= '5') {
                  var isNegative = x < 0;
                  return (isNegative ? '-' : '') + String(1+Number(str.substring(isNegative ? 1 : 0, dotIndex))); // round
                }
                return str.substring(0, dotIndex);
              }

              currDecimal = str.length - dotIndex - 1;
              if(currDecimal > precision) {
                var finalLength = dotIndex +1 + precision;

                if(str.charAt(finalLength) > '5') // round
                  return str.substring(0, finalLength-1) + (1+Number(str.charAt(finalLength-1)));
                
                return str.substring(0, finalLength);
              }
            } else {
              if(precision === 0) return str;
              str += '.';
              dotIndex = str.length -1;
            }

            var k = dotIndex + Math.max(precision, currDecimal);
            for( ; dotIndex <= k; dotIndex++) {
              if(str.charAt(dotIndex) === '') str += '0';
            }
            return str;
          },
          toExponential: function(x, precision) {
            if(x === Infinity || x === -Infinity) return x;
            precision = Number(precision);
            if(precision < 0 || precision > this.MAX_PRECISION) throw new RangeError("precision " + precision + " out of range");
            
            var exp = 0;
            var c = Number(x.toString());
            var n = c < 0 ? -c : c;
            while(n >= 10) {
              exp++;
              n /= 10;
            }

            var sign = ''; // +
            if(c < 0) sign = '-';

            var str = sign + String(n);
            exp = 'e+' + exp;

            // reuse a part of fixed method
            var dotIndex = str.indexOf('.');
            var currDecimal = 0;
            var loop = true;
            if(dotIndex !== -1) {
              if(precision === 0) {
                if(str.charAt(dotIndex+1) >= '5')
                  return sign + String(1+Number(str.substring(sign === '-' ? 1 : 0, dotIndex))) + exp; // round

                return str.substring(0, dotIndex) + exp;
              }

              currDecimal = str.length - dotIndex - 1;
              if(isNaN(precision)) precision = currDecimal;
              if(currDecimal > precision) {
                var finalLength = dotIndex +1 + precision;

                if(str.charAt(finalLength) > '5') // round
                  return str.substring(0, finalLength-1) + (1+Number(str.charAt(finalLength-1))) + exp;
                
                return str.substring(0, finalLength) + exp;
              }
            } else {
              if(precision === 0) loop = false;
              else {
                if(isNaN(precision)) precision = 0;
                else str += '.';
                dotIndex = str.length -1;
              }
            }

            if(loop === true) {
              var k = dotIndex + Math.max(precision, currDecimal);
              for( ; dotIndex <= k; dotIndex++) {
                if(str.charAt(dotIndex) === '') str += '0';
              }
            }

            return str + exp;
          },
          toPrecision: function(x, precision) {
            if(x === Infinity || x === -Infinity) return x;
            precision = Number(precision);
            if(precision < 1 || precision > this.MAX_PRECISION) throw new RangeError("precision " + precision + " out of range");
            
            var str = x.toString();
            if(str.indexOf('e') !== -1) return x.toExponential(--precision);
            var k = precision - (str.length - (x < 0 ? 1 : 0));
            if(k > 0) return x.toFixed(k);
            return x.toExponential(--precision);
          },
          parseFloat: function(x) {
            if(x == null) return NaN;
            if(x === Infinity || x === -Infinity) return x;
            var str = x.toString();
            var data = {};
            var result = "";

            for(var i = 0, l = str.length; i < l; i++) {
              var char = str.charAt(i);
              if(char !== 'e' && char !== '.') {
                if((char < '0' || char > '9')) break;
              } else {
                if(i === l -1) break; // if e or dot is at end break
                if(char in data) break; // allow one e/dot but not more
                data[char] = true;
              }
              result += char;
            }
            return result === "" ? NaN : Number(result);
          },
          // warning: this low level function doesn't have any check
          // use it only if you care about support of string starting by
          // 0(x) or # and only for single char (without surrogate)
          // to support decode radix (#/0x/x prefix) use parseInt
          // to have a report of any error use parseChar (available also with toChar instead of _toChar)
          _parseChar: function(char, radix) {
            var x = Number(char);
            if(x >= '0' && x <= '9' && x < radix) return x;
            var code = char.charCodeAt(0);
            var isLow = code >= 97 && code <= 122;
            if((code >= 65 && code <= 90) || isLow) { // alphabet
              console.log(code + ((288 & 0x3E0) >> 5) & 0x1F);
              if(isLow) code -= 32;
              var result = code - 55;
              return radix > result ? result : NaN;
            }
            return NaN;
          },
          parseChar: function(char, radix) {
            if(char == null) return NaN;
            char = String(char);
            radix = Number(radix);
            if(isNaN(radix) || radix < 2 || radix > 36) return NaN;

            return this._parseChar(char, radix);
          },
          // decode is not true and not false = native result (radix 10 or 16 if starts by '0x')
          // with decode to false default radix is 10
          // with decode to true it's like native result
          // but when str starts by '0' without 'x' radix is 8 / when str starts by '#' radix is 16
          // to enable decode use a nullable radix: parseInt(str, null, true);
          parseInt: function(str, radix, decode) {
            if(str == null) return NaN;
            str = String(str);
            var index = 0;
            var header;
            if(radix != null) {
              if(radix < 2 || radix > 36) return NaN; // invalid radix
            } else {
              radix |= 10;
              if(decode !== false) {
                header = str.charAt(0);
                if(header === '0') {
                  if(str.charAt(1).toLowerCase() === 'x') {
                    radix = 16;
                    index += 2;
                  } else if(decode === true) {
                    radix = 8;
                    index++;
                  }
                } else if(decode === true && header === '#') {
                  radix = 16;
                  index++;
                }
              }
            }

            var limit = -Number.MAX_VALUE;
            var isNegative = false;
            if(index === 0) {
              header || (header = str.charAt(0));
              if(header === '-') {
                index++;
                isNegative = true;
                limit = Number.MIN_VALUE;
              } else if(header === '+') index++;
            }

            var len = str.length;
            var started = index+1;
            var result = 0, multmin, digit;
            multmin = limit / radix;
            while (index < len) {
              // Accumulating negatively avoids surprises near MAX_VALUE
              digit = this._parseChar(str.charAt(index++), radix); // convert letter to number with radix
              if (isNaN(digit)) { // if(digit < 0) error
                if(started === index) return NaN; // when string start by invalid char result is equals to zero and so... we don't need to use this valid
                break;
              }
              if (result < multmin) console.error("5 " + result);
              result *= radix;
              if (result < limit + digit) console.error("10 " + result);
              result -= digit;
            }
            if(result === 0) return 0; // avoid signed zero (-0)
            return isNegative ? result : -result;
          },
          _digits: [
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a' , 'b' , 'c' , 'd' , 'e' , 'f' ,
            'g' , 'h' , 'i' , 'j' , 'k' , 'l' ,
            'm' , 'n' , 'o' , 'p' , 'q' , 'r' ,
            's' , 't' , 'u' , 'v' , 'w' , 'x' ,
            'y' , 'z'
          ],
          // low level see: #parseChar
          _toChar: function(charCode, radix) {
            if(charCode >= 0) {
              if(charCode <= 9) return charCode.toString();
              if(charCode <= 15) // a...f
                return radix > charCode ? this._digits[charCode] : undefined;
            }
            return undefined;
          },
          toChar: function(charCode, radix) {
            radix = Number(radix);
            if(radix < 0 || radix > 32) throw new RangeError("radix must be an integer at least 2 and no greater than 36");
            if(isNaN(radix)) radix = 10;

            var result = this._toChar(charCode, radix);
            return result !== undefined ? result : String(charCode);
          },
          // the boundary of i is defined by the length of the result if the result string has a length greater than 65 characters you can get unexcepted result
          // cause in Java for example there are limited long to 0x7fffffffffffffffL (2^63 -1) but in
          // javascript Number.MAX_VALUE is equals to ~1.7976...e+308 and for Java it's the max value of double.
          // so in Java when you use toString this behavior change between the boundary of the type (Short/Double/Float/Integer)
          // Java use also to save their String an array of char it's why an array is used and after converted to a copy of array.
          // array go to garbage collector after this permanent copy
          // boundaryType = (DOUBLE, LONG, FLOAT, INTEGER/INT, SHORT) = INTEGER
          toStringJV: function(i, radix, boundaryType) {
            radix = Number(radix);
            if(isNaN(radix) || radix === 10) return String(i);
            if(radix < PL.string.char.MIN_RADIX || radix > PL.string.char.MAX_RADIX) throw new RangeError("radix must be an integer at least 2 and no greater than 36");
            
            var boundary;
            switch(boundaryType) {
              case 'DOUBLE':
              case 'LONG': boundary = 65; break;
              case 'FLOAT': boundary = 5;
            }
            var buf = Array(65);
            var charPos = 64;

            var isNegative = i < 0;
            if (!isNegative) i = -i;
            
            while (i <= -radix) {
              buf[charPos--] = this._digits[(-(i % radix))|0]; // |0 is like (int) x in this case (the limit of work of bit operator (2147483647 (2^31 -1) isn't an issue cause the value of left number never reach this boundary)
              i /= radix;
            }
            buf[charPos] = this._digits[(-i)|0];
            if (isNegative) buf[--charPos] = '-';
            console.log(buf);
            return PL.string.fromCharsArray(buf, charPos, 65 - charPos);
          },
          toString: function(i, radix) {
            radix = Number(radix);
            if(isNaN(radix) || radix === 10) return String(i);
            if(radix < PL.string.char.MIN_RADIX || radix > PL.string.char.MAX_RADIX) throw new RangeError("radix must be an integer at least 2 and no greater than 36");
            
            var header = "", buf = "";

            if(i < 0) {
              header = '-';
              i = -i;
            }
            
            while (i > radix) {
              buf += this._digits[(i % radix)|0];
              i /= radix;
            }
            header += this._digits[i|0];

            return header + buf;
          },
          bigint: {
            MAX_SAFE_INTEGER: BigInt(Number.MAX_SAFE_INTEGER),
            MIN_SAFE_INTEGER: BigInt(Number.MIN_SAFE_INTEGER)
          }
          /*float: { // see bit#float for bit methods in attemp of bigDecimal
            from: function(x) {
              return typeof x === 'bigint' ? this.bfrom(x) : this.lfrom(x);
            },
            bfrom: function(x) {
              return x % 0x80000000000000000000000000000000n;
            },
            bfrom: function(x) {
              return x % 0x80000000000000000000000000000000;
            },
            // see #from
            afrom: function(array) {
              var len = array.length;
              var result = 0;
              while(--len !== 0) result += Number(array[len]);
              return this.lfrom(result);
            },
            // see #bfrom
            abfrom: function(array) {
              var len = array.length;
              var result = 0n;
              while(--len !== 0) result += array[len];
              return Number(this.bfrom(result));
            },
            // see #afrom
            alfrom: function(array) {
              var len = array.length;
              var result = 0;
              while(--len !== 0) result += array[len];
              return this.lfrom(result);
            },
            is: function(x) {
              return x >= 1.401298464324817e-45 && x <= 1.7014118346046923e+38;
            },
            // see #from, value is the first element of array
            ais: function(x) {
              return this.is(x[0]);
            }
          },*/
          // used to convert number to bit number not confusing with bit#methods that use bit operator
          
        },
        math: {
          /* Arithmetic calcul result
          // you can pass number in 2nd argument a number to replace x or an object with key=>value: char key is replaced by number value
          // the third argument is passed to true if you want the native method instead of pipnet.module.polyfill.math use directly Object window.Math  
            Eval is used in intern after these transformations:
            . |x| is equivalent to Math.abs(x);
            . x¹ is same that x cause power of one
            . x² is equivalent to Math.pow(x, 2);
            . x³ is equivalent to Math.pow(x, 3);
            . x^y is equivalent to Math.pow(x, y); (bit operator are deleted)
            . ½ is equivalent to 1/2
            . ¼ is equivalent to 1/4
            . ¾ is equivalent to 3/4
            . x° is used to convert value from radians to degrees (see #math.toDegrees)
            . default namespace for property and method are Math then Number and finally window: pi = Math.PI
            . allow implicit multiplication before parenthese: x(x + y) or (x + y)x
              and between a number and a letter: 5x => 5*x
              and between a number and a property or a method that result a number: 2pi or 2sqrt(5)
          */
          acr: function(str) {
            var abs = false, absStr = "";
            var m = false, mStr = "";
            var result = "";

            // this is used to create a save of a buffer or to lock a buffer...
            var compose = function(char) {
              if(abs) {
                absStr += char;
                return;
              }

              if(m) {
                mStr += char;
                return;
              }

              result += char;
            };

            // retrieve the flux including saved buffer and temp buffer
            var flux = function() {
              var extra = "";
              if(abs) extra = absStr;
              else if(m) extra = mStr;
              return result + extra;
            };

            // append to buffer (temp has priority on saved)
            var appendOnBuffer = function(s) {
              if(abs) return absStr += s;
              if(m) return mStr += s;
              return result += s;
            }

            var char;
            for(var i = 0, l = str.length; i < l; i++) {
              char = str.charAt(i);
              if(m) {
                if(this._acr.endProperty(char)) {
                  m = false;
                  compose(this._acr.evalFunction(mStr, str)); // allow pi²
                  //continue;
                }
              }

              if(char === '|') {
                abs = !abs;
                console.log(absStr);
                if(!abs) {
                  absStr = this.acr(absStr);
                  if(absStr < 0) absStr = -absStr;
                  result += absStr;
                  absStr = "";
                }
                continue;
              }

              if(char === '¹') continue; // ignore power of 1
              
              if(char === '^' || char === '°' || char === '²' || char === '³') {
                var lf;
                var fl = flux();
                if(char !== '°') {
                  var power = 2;
                  if(char === '^') { // search power after ^ allow (x) and x
                    var m = this._acr.findPower(str, i, l);
                    power = m.value;
                    i += m.totalLength;
                  } else if(char === '³') power = 3;
                  var lfl = fl.length;
                  lf = this._acr.evalPower(fl, lfl, lfl, power);
                } else {
                  var lfl = fl.length;
                  lf = this._acr.evalRadians(fl, lfl, lfl);
                }

                var current = fl;

                var start = lf.start;
                if(abs) start--; // avoid | extra char

                if(lf.value < 0) { // avoid increment/decrement operator (--/++) before negative result of square
                  var before = current.charAt(start-1);
                  if(before === '-' || before === '+') start--;
                }

                console.log(current, lf);
                var newCurrent = current.substring(0, start) +
                                 lf.value +
                                 current.substring(lf.end);
                console.log(newCurrent, char);

                if(abs) absStr = newCurrent;
                else result = newCurrent;
                continue;
              }

              // rad unity
              if(char === 'r') {
                if(str.charAt(i + 1) === 'a' && str.charAt(i + 2) === 'd') {
                  var fl = flux(), lfl = fl.length;
                  appendOnBuffer(this._acr.evalDegrees(fl, lfl, lfl));
                  i+=2;
                  continue;
                }
              }

              // allow implicit multiplication x(x + y)
              if(char === '(' || char === ')') {
                var left = char === '(';
                var juxt = str.charAt(i + (left ? -1 : 1));
                if(this._acr.isDigit(juxt)) compose(left ? '*' + char : char + '*');
                else compose(char);
                continue;
              }

              if(!abs && !m && this._acr.isAlphabet(char)) m = true;

              this._acr.translateUnicodeSymbol(char, function(value) {
                char = value;
              });
              
              compose(char);
            }
            if(m) result += this._acr.evalFunction(mStr, str);
            console.log(result);
            return eval(result);
          },
          _acr: {
            translateUnicodeSymbol: function(char, callback) {
              if(char === '½') return callback(.5, 3);
              if(char === '¼') return callback(.25, 4);
              if(char === '¾') return callback(.75, 4);
            },
            translateUnicodeSymbolR: function(char) {
              return this.translateUnicodeSymbol(char, function(value, totalLength) {
                return {'value': value, 'totalLength': totalLength};
              });
            },
            // valid strict function with US-ASCII char and _
            // property is here: a function or a key=>value
            endProperty: function(char) {
              if(this.inParam) {
                if(char === ')') delete this.inParam;
                return false;
              }
              if(this.isAlphabet(char) || this.isDigit(char) ||
                 char === '.' || char === '_') return false;

              if(char === '(') {
                this.inParam = true;
                return false;
              }
              return true;
            },
            parseProperty: function(str) { // take x(y)
              var p1 = str.lastIndexOf('('), p2 = str.lastIndexOf(')');
              if(p1 === -1 || p2 !== str.length -1) return {name: str};

              var namedKey = str.indexOf(']', p1-1);
              if(namedKey !== -1 && p1 !== -1) {
                if(namedKey + 1 < p1) return {name: str}; // isn't equals to ](
              }

              return {name: str.substring(0, p1), params: str.substring(p1 + 1, p2)};
            },
            evalFunction: function(mStr, str) {
              var property = this.parseProperty(mStr);

              var key = property.name;
              var uKey = key.toUpperCase();

              var result = key;
              var um = uKey in Math;
              if(um || uKey in Number) { // CONSTANT priority (normalized)
                if(um) result = "Math."+uKey;
                else result = "Number."+uKey;
              } else {
                if(key in Math) result = "Math."+key;
                else if(key in Number) result = "Number."+key;
              }
              if('params' in property) {
                result += '(';
                var args = property.params.split(',');
                for(var i = 0, l = args.length; i < l; i++) {
                  if(i !== 0) result += ',';
                  result += PL.math.acr(args[i]); // allow acr in 
                }
                result += ')';
              }
              
              var cast = Number(eval(result));
              if(isNaN(cast)) return result;

              var beforeChar = str.charAt(str.length-mStr.length-1);
              if(this.isDigit(beforeChar)) return '*' + cast; // when digit before method and method result is number use implicit multiplication
              return cast;
            },
            isDigit: function(char) {
              return char >= '0' && char <= '9';
            },
            isAlphabet: function(char) {
              return (char >= 'a' && char <= 'z') ||
                     (char >= 'A' && char <= 'Z');
            },
            findPower: function(str, i, len) { // x^?
              var index = i+1, after = str.charAt(index);
              if(after === '') throw new TypeError("Power on an empty number isn't allowed"); // x^<empty>

              if(this.isDigit(after)) {
                var nb = this.searchRawNumberOf(str, after, index, len, false, true);
                console.log(nb);
                return {type: 'number', value: nb.value, totalLength: nb.value.length};
              }
              if(after === '(') {
                var scope = this.searchScopeOf(str, index, len, false);
                console.log(scope);
                return {type: 'scope', value: eval(scope.value), totalLength: scope.value.length+2 /* include ( and ) of scope */};
              }
              
              var unicode = this.translateUnicodeSymbolR(after);
              if(unicode !== undefined)
                return {type: 'usymbol', value: unicode.value, totalLength: unicode.totalLength};

              throw new TypeError("Power on an empty number isn't allowed");
            },
            evalPower: function(str, i, len, power) {
              var index = i-1, before = str.charAt(index);
              if(before === '') throw new TypeError("Power of an empty number isn't allowed"); // <empty>²

              if(this.isDigit(before)) {
                var nb = this.searchRawNumberOf(str, before, index, len, true, true);
                console.log(nb);
                return {type: 'number', value: Math.pow(nb.value, power), start: nb.limit, end: i};
              }
              if(before === ')') {
                var scope = this.searchScopeOf(str, index, len, true);
                console.log(scope);
                return {type: 'scope', value: Math.pow(eval(scope.value), power), start: scope.close, end: i};
              }
              
              var unicode = this.translateUnicodeSymbolR(before);
              if(unicode !== undefined)
                return {type: 'usymbol', value: Math.pow(unicode.value, power), start: 0, end: 3};

              throw new TypeError("Power of an empty number isn't allowed");
            },
            evalRadians: function(str, i, len) {
              var index = i-1, before = str.charAt(index);
              if(before === '') throw new TypeError("Degree of an empty radian number isn't allowed"); // <empty>°

              if(this.isDigit(before)) {
                var nb = this.searchRawNumberOf(str, before, index, len, true, true);
                console.log(nb);
                return {type: 'number', value: PL.math.toDegrees(Number(nb.value)), start: nb.limit, end: i};
              }
              if(before === ')') {
                var scope = this.searchScopeOf(str, index, len, true);
                console.log(scope);
                return {type: 'scope', value: PL.math.toDegrees(eval(scope.value)), start: scope.close, end: i};
              }
              
              var unicode = this.translateUnicodeSymbolR(before);
              if(unicode !== undefined)
                return {type: 'usymbol', value: PL.math.toDegrees(unicode.value), start: 0, end: 3};

              throw new TypeError("Degree of an empty radian number isn't allowed"); 
            },
            evalDegrees: function(str, i, len) {
              var index = i-1, before = str.charAt(index);
              if(before === '') throw new TypeError("Degree of an empty radian number isn't allowed"); // <empty>°

              if(this.isDigit(before)) {
                var nb = this.searchRawNumberOf(str, before, index, len, true, true);
                console.log(nb);
                return {type: 'number', value: PL.math.toRadians(Number(nb.value)), start: nb.limit, end: i};
              }
              if(before === ')') {
                var scope = this.searchScopeOf(str, index, len, true);
                console.log(scope);
                return {type: 'scope', value: PL.math.toRadians(eval(scope.value)), start: scope.close, end: i};
              }
              
              var unicode = this.translateUnicodeSymbolR(before);
              if(unicode !== undefined)
                return {type: 'usymbol', value: PL.math.toRadians(unicode.value), start: 0, end: 3};

              throw new TypeError("Degree of an empty radian number isn't allowed"); 
            },
            searchRawNumberOf: function(str, char, i, len, reverse, allowDecimal) {
              var max, buff, dp;
              if(!reverse) {
                max = len -1;
                buff = char;
              } else {
                max = 0;
                buff = Array(len);
                dp = len;
                buff[dp--] = char;
              }

              while(i !== max) {
                char = str.charAt(reverse ? --i : ++i);
                if(char < '0' || char > '9') {
                  if(char === '-') i++;
                  if (!allowDecimal || char !== '.') break;
                }
                !reverse ? buff += char : buff[dp--] = char;
              }
              return {value: reverse ? PL.string.fromCharsArray(buff) : buff, limit: i};
            },
            searchScopeOf: function(str, i, len, reverse) {
              var open = 1;
              var max, buff, dp;
              var closure = 0;
              if(!reverse) {
                max = len -1;
                buff = "";
              } else {
                max = 0;
                buff = Array(len -1);
                dp = len -1;
              }

              while(i !== max) {
                var char = str.charAt(reverse ? --i : ++i);

                switch(char) {
                  case '(': !reverse ? open++ : open--; break;
                  case ')': !reverse ? open-- : open++; break;
                  default: !reverse ? buff += char : buff[--dp] = char; // trick when reverse use java string char array
                }

                console.log(i, open);
                if(open < 0) throw new TypeError("Missing ) or ( in parenthetical"); // overflow to many closures
              
                if(!reverse) {
                  if(i + open > max) throw new TypeError("Missing ) or ( in parenthetical"); // not the space to continue (to many open closures) 
                } else {
                  if(i - open < max) throw new TypeError("Missing ) or ( in parenthetical"); // not the space to continue (to many close closures) 
                }

                if(open === 0) {
                  closure = i;
                  break;
                }
              }
              return {value: reverse ? PL.string.fromCharsArray(buff) : buff, close: closure};
            }
          },
          // approximation of neperian logarithm with Weddle method (default) to calculate integral
          // of function f(x) = 1/x, a = 1, b = x
          // you can change integral method with its string name (iMethod)
          alog: function(x, n, iMethod) {
            x = Number(x);
            if(isNaN(x) || x < 0) return NaN; // x < 0 prohibited
            if(x === 0) return -Infinity;
            n || (n = 1000), iMethod || (iMethod = "Weddle");
            return PL.math.f.integral.A[iMethod](function(x) {
              return 1/x;
            }, 1, x, n);
          },
          log10: function(x) {
            return Math.log(x) / Math.LN10;
          },
          log2: function(x) {
            return Math.log(x) / Math.LN2;
          },
          log1p: function(x) {
            if(x === 0) return x; // allow signed zero (-0)
            return Math.log(x + 1);
          },
          exp: function(x) {
            return Math.pow(Math.E, Number(x));
          },
          expm1: function(x) {
            if(x === 0) return x; // allow signed zero (-0)
            return Math.exp(x) - 1;
          },
          MAX_DEGREES: 360,
          toRadians: function(angdeg) {
            angdeg = Number(angdeg);
            if(angdeg < 0) angdeg = -angdeg;
            if(angdeg > this.MAX_DEGREES) {
              angdeg %= this.MAX_DEGREES;
              if(angdeg === 0) angdeg = this.MAX_DEGREES;
            }
            return this._toRadians(angdeg);
          },
          // 180 * angrad = PI * angdeg
          // use _toRadians and _toDegrees for valid value: [0°, 360°], [0rad, (2pi)rad]
          // use toRadians and toDegrees when you don't known angdeg or for string number "2", "5"...
          // warning when angle exceed valid value (+360° or +(2pi)rad) the modulo of max value is returned to converted invalid value to valid
          // but in this conversion value like 360x or (2pi)x return 360° or (2pi)rad and not zero
          // only angdeg zero return angrad zero
          _toRadians: function(angdeg) {
            return (angdeg / 180) * Math.PI;
          },
          toDegrees: function(angrad) {
            angrad = Number(angrad);
            if(angrad < 0) angrad = -angrad;
            var angdeg = this._toDegrees(angrad);
            if(angdeg > this.MAX_DEGREES) {
              angdeg %= this.MAX_DEGREES;
              if(angdeg === 0) angdeg = this.MAX_DEGREES;
            }
            return angdeg;
          },
          _toDegrees: function(angrad) {
            return (angrad * 180) / Math.PI;
          },
          // voc:
          // ->     tends to (even if Inf is defined like a constant in JS)
          // ===    equals && and || or
          // != before range mean doesn't include same for =

          // when there are no comment it mean that function is defined on ]-Inf, +Inf[ without singularity
          // methods cos, sin, acos, asin atan exist already and take the right definition range
          // tan exists but ignore definition range if you care about it use Math.tan instead of pipnet#math#tan
          // some calcul are based on: https://sr.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D1%83%D1%81_(%D1%82%D1%80%D0%B8%D0%B3%D0%BE%D0%BD%D0%BE%D0%BC%D0%B5%D1%82%D1%80%D0%B8%D1%98%D0%B0)

          // x % x2 rest of the division  x / x2   
          // x % PI === 0 => 0
          // x % (PI / 2) === 0 -> +x: Infinity -x: -Infinity
          tan: function(x) {
            x = Number(x);
            if(x % Math.PI === 0) return 0; // maybe return 0 signed or unsigned with sign of x
            if(x % (Math.PI / 2) === 0) return x >= 0 ? Infinity : -Infinity;
            // in reality tan function tends to Infinity or -Infinity you are free to add specification with object {}
            return Math.tan(x);
          },
          //cotangent
          // x % PI === 0 -> +x: Infinity -x: -Infinity
          // x % (PI / 2) === 0 => 0
          cotan: function(x) {
            x = Number(x);
            if(x % Math.PI === 0) return x >= 0 ? Infinity : -Infinity; // see tanh function
            if(x % (Math.PI / 2) === 0) return 0;
            return Math.cos(x)/Math.sin(x);
          },
          //secant
          // x % (PI / 2) === 0 && x % PI !== 0 -> +x: Infinity -x: -Infinity
          sec: function(x) {
            x = Number(x);
            if(x % (Math.PI / 2) === 0 && x % Math.PI !== 0) return x >= 0 ? Infinity : -Infinity; // see tanh function
            return 1/Math.cos(x);
          },
          //cosecant
          // x % PI === 0 -> +x: Infinity -x: -Infinity
          cosec: function(x) {
            x = Number(x);
            if(x % Math.PI === 0) return x >= 0 ? Infinity : -Infinity;
            return 1/Math.sin(x);
          },
          // x != ]-1, 1[
          // x === 1 => 0
          // x === -1 => PI
          // (x > 0 || x < 0) -> PI / 2
          asec: function(x) {
            if(isNaN(x)) return NaN;
            return Math.acos(1/x);
          },
          // x != ]-1, 1[
          // x === 1 => PI / 2
          // x === -1 => -PI / 2
          // (x > 0 || x < 0) -> 0
          acosec: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return Math.asin(1/x);
          },
          // x === +0 => PI / 2
          // x === -0 => -PI / 2
          // (x > 0 || x < 0) -> 0
          acotan: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            if(x === 0) {
              var result = Math.PI / 2;
              return PL.number._isS0(x) ? -result : result;
            }
            return (Math.PI / 2) - Math.atan(x);
          },
          // allow RADIAN or DEGREE in future...
          cosh: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            if(x === Infinity || x === -Infinity) return Infinity;
            return (Math.pow(Math.E, x) + Math.pow(Math.E, -x))/2;
          },
          sinh: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            if(x === Infinity || x === -Infinity) return x;
            return (Math.pow(Math.E, x) - Math.pow(Math.E, -x))/2;
          },
          // x > 0 -> 1
          // x < 0 -> -1
          tanh: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            if(x === 0) return x; // allow signed zero (-0)
            if(x === Infinity) return 1;
            if(x === -Infinity) return -1;
            return 1 - (2 / (Math.pow(Math.E, 2*x) + 1));
          },
          // x != 0
          // x > 0 -> 1
          // x < 0 -> -1
          cotanh: function(x) {
            x = Number(x);
            if(isNaN(x) || x === 0) return NaN; // x = 0 is prohibited
            var e2x = Math.pow(Math.E, 2*x);
            return (e2x + 1) / (e2x - 1);
          },
          // x === 0 => 1
          // (x > 0 || x < 0) -> 0
          sech: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return 2/(Math.pow(Math.E, x) + Math.pow(Math.E, -x));
          },
          // x === +0 -> Inf
          // x === -0 -> -Inf
          // x > 0 -> +0
          // x < 0 -> -0
          cosech: function(x) {
            x = Number(x);
            if(x === 0) return PL.number._isS0(x) ? -Infinity : Infinity;
            return 2/(Math.pow(Math.E, x) - Math.pow(Math.E, -x));
          },
          // x != [-Inf, 1[
          acosh: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return Math.log(x + Math.sqrt(Math.pow(x, 2) - 1));
          },
          asinh: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return Math.log(x + Math.sqrt(Math.pow(x, 2) + 1));
          },
          // x = [-1, 1]
          atanh: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return (1/2) * Math.log((1+x) / (1-x));
          },
          // x != ]-1, 1[
          // (x > 0 || x < 0) -> 0
          acotanh: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return (1/2) * Math.log((x+1) / (x-1));
          },
          // x != ]0, 1[
          // x === 0 -> Inf
          // x === 1 => 0
          asech: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return Math.log((1 + Math.sqrt(1 - Math.pow(x, 2))) / x);
          },
          // x === 0 -> Inf
          // x -> Inf => 0
          // x -> -Inf => -0
          // (x > 0 || x < 0) -> 0
          acosech: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            if(x === Infinity) return 0;
            if(x === -Infinity) return -0;
            return Math.log((1/x) + Math.sqrt((1/Math.pow(x, 2)) + 1));
          },
          hypot: function() {
            var l = arguments.length;
            if(l === 0) return 0;
            if(l === 1) {
              var result = Number(arguments[0]);
              return result < 0 ? -result : result;
            }
            var result = 0;
            for(var i = 0; i < l; i++) {
              var arg = Number(arguments[i]);
              if(isNaN(arg)) return NaN;
              if(arg === Infinity || arg === -Infinity) return Infinity;

              result += Math.pow(arg, 2);
            }
            return Math.sqrt(result);
          },
          FPRECISION: 9.536743128535363e-8,
          fround: function(x) { // float
            return x - this.FPRECISION;
          },
          stepOf: function(x, step, overflow) {
            x = Number(x), step = Number(step);
            if(isNaN(x)) return NaN;
            if(isNaN(step)) step = 1;
            return this._stepOf(x, step, overflow);
          },
          _stepOf: function(x, step, overflow) {
            x = this._floor(x / step);
    
            if (overflow) return x % overflow;
            return x;
          },
          // normalize with modulo including negative value
          // use emod when your result is a strange result
          // for example
          // mod(1.2, 1, 0, 1) return 0.19999999999999996
          // where emod(1.2, 1, 0, 1) return 2
          // you can also use emodulo if you care about min and max
          mod: function(x, mod, min, max) {
            x = Number(x), mod = Number(mod), min |= 0, max = Number(max);
            if(isNaN(x) || isNaN(mod)) return NaN;
            return this._mod(x, mod, min, max);
          },
          _mod: function(x, mod, min, max) {
            if(x >= min && x <= max) return x;
            if(x < 0) return (-x) % mod;
            return x % mod;
          },
          // allow callback
          __mod: function(callback, x, mod, min, max) {
            if(x >= min && x <= max) return;
            if(x < 0) return callback((-x) % mod);
            return callback(x % mod);
          },
          // exact result of x % mod for shortdecimal
          // the strange result is due to soustraction of decimal see esubstract
          // limitation for bigdecimal like 1.000000000000000000000000000005685454544444555
          // where String(x) and other base method return round result (here: 1) so 1 % 1 === 0
          emodulo: function(x, mod) {
            x = Number(x), mod = Number(mod);
            if(isNaN(x) || isNaN(mod)) return NaN;
            return this._emodulo(x, mod);
          },
          // you don't know x but x is a number
          _emodulo: function(x, mod) {
            var result = x % mod;
            if(PL.number.__isInteger(x) || result < -1.7999999999999998 || result > 1.7999999999999998) return result;
            return this.__emodulo(x, mod);
          },
          // you know that x % mod return bad result and x and mod is number
          __emodulo: function(x, mod) {
            var e = this.pow10(PL.number.__countOfDecimalDigit(String(x)));
            return ((x*e) % (mod*e)) / e;
          },
          // the difference with emodulo is that
          // emodulo try to repair bad result of x % mod with a lot of calcul
          // here there are not modulo operator all of this is emulated (except if x % mod is a good value)
          // by one multiple and one divide then a esubstract
          // so this method use more calcul but it's a stable method
          // cause if the modulo operator doesn't work like other browser in
          // emodulo result is affected but in nemodulo the result isn't affected
          // only if browser have a problem with multiple, divide, and substract (only for pow) see #pow
          // this affectation is available also for emodulo
          nemodulo: function(x, mod) {
            x = Number(x), mod = Number(mod);
            if(isNaN(x) || isNaN(mod)) return NaN;
            return this._nemodulo(x, mod);
          },
          // you don't know x but x is a number
          _nemodulo: function(x, mod) {
            var result = x % mod;
            if(PL.number.__isInteger(x) || result < -1.7999999999999998 || result > 1.7999999999999998) return result;
            return this.__nemodulo(x, mod);
          },
          // you know that x % mod return bad result and x and mod is number
          __nemodulo: function(x, mod) {
            return this.___esubstract([x, (mod * this._stepOf(x, mod))], 2);
          },
          ___substract: function(args, len) {
            var result = args[0];
            var i = 0;
            while(++i < len) result -= args[i];
            return result;
          },
          // check if x is in e notation (never change between browser)
          // without check e in string(x) generally this method is faster
          is10: function(x) {
            if(x > 0 && x < 1) return x <= 0.0000009;
            return x >= 0x3635c9adc5dea00000 || x <= -0x3635c9adc5dea00000;
          },
          isBigger10: function(x1, x2, exponent1, exponent2) {
            if(exponent1 === exponent2) return x1 > x2;
            return exponent1 > exponent2;
          },
          getLeftPart10: function(x) {
            return Number(this._getLeftPart10(x));
          },
          _getLeftPart10: function(x) {
            return this.__getLeftPart10(String(x));
          },
          __getLeftPart10: function(str) {
            return str.substring(0, str.indexOf('e', 1));
          },
          getRightPart10: function(x) {
            return Number(this._getLeftPart10(x));
          },
          _getRightPart10: function(x) {
            return this._getRightPart10(String(x));
          },
          __getRightPart10: function(str) {
            return str.substring(str.indexOf('e', 1) + 1);
          },
          getParts10: function(x) {
            var eIndex = str.indexOf('e', 1);
            return [Number(str.substring(0, eIndex)), Number(str.substring(eIndex + 1))];
          },
          _getParts10: function(x) {
            return this.__getParts10(String(x));
          },
          __getParts10: function(str) {
            var eIndex = str.indexOf('e', 1);
            return [str.substring(0, eIndex), str.substring(eIndex + 1)];
          },
          // support biginteger and bigdecimal (exact value) with e notation
          // notice that in e method bigdecimal mean 0.00x and p.00x
          // if you need a different integer digit use class bigDecimal
          // cause browser round other to 0
          // convert all integer inside e notation example 5 = 5e0
          // examples
          // bigInteger
          //  5e47 - 4e60
          //    browser: -3.9999999999994995e+60
          //    bigsubstract: -3.9999999999995e+60
          //  5e43 - 4e43
          //    browser: 1.0000000000000004e+43
          //    bigsubstract: 1e+43
          // bigDecimal
          //  (5e-70) - (4e-60)
          //    browser: -3.9999999994999997e-60
          //    bigsubstract: -3.9999999995e-60
          //  (5e-70) - (4e-70)
          //    browser: 9.999999999999998e-71
          //    bigsubstract: 1e-70
          ___bigsubstract: function(args, len) {
            var x, exponent;
            if(!this.is10(args[0])) {
              x = Number(args[0]);
              exponent = 0;
            } else {
              var str0 = String(args[0]), eIndex0 = str0.indexOf('e', 1);
              x = Number(str0.substring(0, eIndex0)),
              exponent = Number(str0.substring(eIndex0 + 1));
            }
            var i = 0;
            var decimalDigit;
            while(++i < len) {
              if(!this.is10(args[i])) {
                x -= args[i];
                continue;
              }

              var strI = String(args[i]), eIndexI = strI.indexOf('e', 1);
              var e = Number(strI.substring(eIndexI + 1)), v = Number(strI.substring(0, eIndexI));
              if(e === exponent) {
                x -= v;
                continue;
              }

              var result = Number(x + 'e' + exponent) - args[i],
                  resultX = this._getLeftPart10(result);

              if(PL.number.__isInteger(resultX)) { // rounded x
                x = Number(resultX);
                if(e > exponent) exponent = e;
                continue;
              }

              // check good work of browser...
              if(e < exponent)
                decimalDigit = (x-1) + '.' + (this.pow10(exponent - e) - v);
              else {
                decimalDigit = '-' + (v-1) + '.' + (this.pow10(e - exponent) - x);
                exponent = e;
              }

              x = Number(resultX === decimalDigit ? resultX : decimalDigit);

              /* round value or safe value
              if(e === exponent) { // e[p] = e[p+1]
                if(v > x) x = v;
                else x -= v;
              } else {
                if(e > exponent) { // e[p] > e[p+1]
                  x = -v;
                  exponent = e;
                }
              }*/
            }
            return Number(x + 'e' + exponent);
          },
          // exact result of args[i] - args[i+1] - args[i+p]... for bigInteger, bigDecimal, shortDecimal and longDecimal
          esubstract: function() {
            var len = arguments.length;
            if(len === 0) return NaN;
            return this.__esubstract(arguments, len);
          },
          // you know that arguments aren't empty
          _esubstract: function() {
            return this.__esubstract(arguments, arguments.length);
          },
          // you know that arguments aren't empty and you know length of arguments
          __esubstract: function(args, len) {
            var result = this.___substract(args, len);
           
            if(!PL.number.__isFinite(result)) return result;
            if(String(result).indexOf('e') >= 12) return this.___bigsubstract(args, len);
            if(PL.number.__isInteger(result) || result < -1.7999999999999998 || result > 1.7999999999999998) return result;
            
            return this.____esubstract(result, args, len);
          },
          // you know that arguments aren't empty and you know length of arguments
          // and that args[i] - args[i+p] return a bad result
          ___esubstract: function(args, len) {
            var result = this.___substract(args, len);

            if(String(result).indexOf('e') >= 12) return this.___bigsubstract(args, len);

            return this.____esubstract(result, args, len);
          },
          // support shortDecimal and longDecimal
          ____esubstract: function(result, args, len) {
            var maxE_10 = PL.number.__countOfDecimalDigit(String(args[0]));
            var i = 0;
            while(++i < len) {
              var e_10 = PL.number.__countOfDecimalDigit(String(args[i]));
              if(e_10 > maxE_10) maxE_10 = e_10;
            }

            var e = this.pow10(maxE_10); // pow is used outside of loop
            result = args[0] * e;
            i = 0;
            while(++i < len) result -= args[i] * e;
            result /= e;

            return result;
          },
          ___add: function(args, len) {
            var result = args[0];
            var i = 0;
            while(++i < len) result += args[i];
            return result;
          },
          // support biginteger and bigdecimal (exact value) with e notation
          // convert all integer inside e notation example 5 = 5e0
          // examples
          //  bigInteger
          //    5e47 + 4e58
          //      browser: 4.0000000000499997e+58
          //      bigadd: 4.00000000005e+
          //    5e47 + 4e47
          //      browser: 9.000000000000001e+47
          //      bigadd: 9e+47
          //  bigDecimal
          //    (5e-70) + (2e-82)
          //      browser: 5.0000000000019996e-70
          //      bigadd: 5.000000000002e-70
          //    (5e-70) + (4e-70)
          //      browser: 8.999999999999999e-70
          //      bigadd: 9e-70
          ___bigadd: function(args, len) {
            var x, exponent;
            if(!this.is10(args[0])) {
              x = Number(args[0]);
              exponent = 0;
            } else {
              var str0 = String(args[0]), eIndex0 = str0.indexOf('e', 1);
              x = Number(str0.substring(0, eIndex0)),
              exponent = Number(str0.substring(eIndex0 + 1));
            }
            var i = 0;
            var decimalDigit;
            while(++i < len) {
              if(!this.is10(args[i])) {
                x += args[i];
                continue;
              }

              var strI = String(args[i]), eIndexI = strI.indexOf('e', 1);
              var e = Number(strI.substring(eIndexI + 1)), v = Number(strI.substring(0, eIndexI));
              if(e === exponent) {
                x += v;
                continue;
              }

              var result = Number(x + 'e' + exponent) + args[i],
                  resultX = this._getLeftPart10(result);

              if(PL.number.__isInteger(resultX)) { // rounded x
                x = Number(resultX);
                if(e > exponent) exponent = e;
                continue;
              }

              // check good work of browser...
              if(e < exponent)
                decimalDigit = x + Number(this.pow10(e - exponent) * v);
              else {
                decimalDigit = v + Number(this.pow10(exponent - e) * x);
                exponent = e;
              }
              
              console.log(resultX, decimalDigit);

              x = Number(resultX === decimalDigit ? resultX : decimalDigit);

              /* round value or safe value
              if(e === exponent) { // e[p] = e[p+1]
                if(v > x) x = v;
                else x += v;
              } else {
                if(e > exponent) { // e[p] > e[p+1]
                  x = v;
                  exponent = e;
                }
              }*/
            }
            return Number(x + 'e' + exponent);
          },
          // exact result of args[i] + args[i+1] + args[i+p]... for bigInteger, bigDecimal, shortDecimal and longDecimal
          eadd: function() {
            var len = arguments.length;
            if(len === 0) return NaN;
            return this.__eadd(arguments, len);
          },
          // you know that arguments aren't empty
          _eadd: function() {
            return this.__eadd(arguments, arguments.length);
          },
          // you know that arguments aren't empty and you know length of arguments
          __eadd: function(args, len) {
            var result = this.___add(args, len);
           
            if(!PL.number.__isFinite(result)) return result;
            if(String(result).indexOf('e') >= 12) return this.___bigadd(args, len);
            if(PL.number.__isInteger(result)) return result;
            
            return this.____eadd(result, args, len);
          },
          // you know that arguments aren't empty and you know length of arguments
          // and that args[i] + args[i+p] return a bad result
          ___eadd: function(args, len) {
            var result = this.___add(args, len);

            if(String(result).indexOf('e') >= 12) return this.___bigadd(args, len);

            return this.____eadd(result, args, len);
          },
          // support shortDecimal
          ____eadd: function(result, args, len) {
            var maxE_10 = PL.number.__countOfDecimalDigit(String(args[0]));
            var i = 0;
            while(++i < len) {
              var e_10 = PL.number.__countOfDecimalDigit(String(args[i]));
              if(e_10 > maxE_10) maxE_10 = e_10;
            }

            var e = this.pow10(maxE_10); // pow is used outside of loop
            result = args[0] * e;
            i = 0;
            while(++i < len) result += args[i] * e;
            result /= e;

            return result;
          },
          ___divide: function(args, len) {
            var result = args[0];
            var i = 0;
            while(++i < len) result /= args[i];
            return result;
          },
          // support biginteger and bigdecimal (exact value) with e notation
          // convert integer inside e notation example 5 = 5e0
          // examples
          // bigInteger
          //  8e20 / 8e42
          //    browser: 9.999999999999999e-23
          //    bigdivide: 1e-22
          //  8e42 / 9e42
          //    browser: 0.888888888888889
          //    bigdivide: 0.8888888888888888
          // bigDecimal
          //  (5e-81) / (4e-55)
          //    browser: 1.2499999999999999e-26
          //    bigdivide: 1.25e-26
          //  (8e-42) / (9e-42)
          //    browser: 0.888888888888889
          //    bigdivide: 0.8888888888888888
          ___bigdivide: function(args, len) {
            var x, exponent;
            if(!this.is10(args[0])) {
              x = Number(args[0]);
              exponent = 0;
            } else {
              var str0 = String(args[0]), eIndex0 = str0.indexOf('e', 1);
              x = Number(str0.substring(0, eIndex0)),
              exponent = Number(str0.substring(eIndex0 + 1));
            }
            var i = 0;
            while(++i < len) {
              if(!this.is10(args[i])) {
                x /= args[i];
                continue;
              }

              var strI = String(args[i]), eIndexI = strI.indexOf('e', 1);
              var e = Number(strI.substring(eIndexI + 1));

              x /= Number(strI.substring(0, eIndexI));
              if(e === exponent) exponent = 0;
              else exponent -= e;
            }
            return Number(x + 'e' + exponent);
          },
          // exact result of args[i] / args[i+1] / args[i+p]... for bigInteger, bigDecimal and longDecimal
          edivide: function() {
            var len = arguments.length;
            if(len === 0) return NaN;
            return this.__edivide(arguments, len);
          },
          // you know that arguments aren't empty
          _edivide: function() {
            return this.__edivide(arguments, arguments.length);
          },
          // you know that arguments aren't empty and you know length of arguments
          __edivide: function(args, len) {
            var result = this.___divide(args, len);

            if(!PL.number.__isFinite(result)) return result;
            if(String(result).indexOf('e') >= 17) return this.___bigdivide(args, len);
            if(PL.number.__isInteger(result)) return result;
            
            return this.____edivide(result, args, len);
          },
          // you know that arguments aren't empty and you know length of arguments
          // and that args[i] / args[i+p] return a bad result
          ___edivide: function(args, len) {
            var result = this.___divide(args, len);
            
            if(String(result).indexOf('e') >= 17) return this.___bigdivide(args, len);
            return this.____edivide(result, args, len);
          },
          // support longDecimal
          ____edivide: function(result, args, len) {
            var maxE_10 = PL.number.__countOfDecimalDigit(String(args[0]));
            var i = 0;
            while(++i < len) {
              var e_10 = PL.number.__countOfDecimalDigit(String(args[i]));
              if(e_10 > maxE_10) maxE_10 = e_10;
            }

            var e = this.pow10(maxE_10); // pow is used outside of loop
            result = this.__powNorm(args[0], e);
            i = 0;
            while(++i < len) result /= this.__powNorm(args[i], e);
            console.log(this.__powNorm(args[0], e));
            console.log(this.__powNorm(args[1], e));
            console.log(e);

            return result;
          },
          ___multiple: function(args, len) {
            var result = args[0];
            var i = 0;
            while(++i < len) result *= args[i];
            return result;
          },
          // support biginteger and bigdecimal (exact value) with e notation
          // convert integer inside e notation example 5 = 5e0
          // examples
          //  bigInteger
          //    5e47 * 4e58
          //      browser: 1.9999999999999998e+106
          //      bigmultiple: 2e+106
          //    5e47 * 3e47
          //      browser: 1.5000000000000003e+95
          //      bigmultiple: 1.5e+95
          //  bigDecimal
          //    (5e-87) * (3e-75)
          //      browser: 1.5000000000000001e-161
          //      bigmultiple: 1.5e-161
          //    (5e-75) * (3e-75)
          //      browser: 1.4999999999999999e-149
          //      bigmultiple: 1.5e-149
          ___bigmultiple: function(args, len) {
            var x, exponent;
            if(!this.is10(args[0])) {
              x = Number(args[0]);
              exponent = 0;
            } else {
              var str0 = String(args[0]), eIndex0 = str0.indexOf('e', 1);
              x = Number(str0.substring(0, eIndex0)),
              exponent = Number(str0.substring(eIndex0 + 1));
            }
            var i = 0;
            while(++i < len) {
              if(!this.is10(args[i])) {
                x *= args[i];
                continue;
              }

              var strI = String(args[i]), eIndexI = strI.indexOf('e', 1);

              x *= Number(strI.substring(0, eIndexI));
              exponent += Number(strI.substring(eIndexI + 1));
            }
            return Number(x + 'e' + exponent);
          },
          // exact result of args[i] * args[i+1] * args[i+p]... for bigInteger, bigDecimal and longDecimal
          emultiple: function() {
            var len = arguments.length;
            if(len === 0) return NaN;
            return this.__emultiple(arguments, len);
          },
          // you know that arguments aren't empty
          _emultiple: function() {
            return this.__emultiple(arguments, arguments.length);
          },
          // you know that arguments aren't empty and you know length of arguments
          __emultiple: function(args, len) {
            var result = this.___multiple(args, len);
           
            if(!PL.number.__isFinite(result)) return result;
            if(String(result).indexOf('e') >= 17) return this.___bigmultiple(args, len);
            if(PL.number.__isInteger(result)) return result;
            
            return this.____emultiple(result, args, len);
          },
          // you know that arguments aren't empty and you know length of arguments
          // and that args[i] * args[i+p] return a bad result
          ___emultiple: function(args, len) {
            var result = this.___multiple(args, len);
            if(String(result).indexOf('e') >= 17)  this.___bigmultiple(args, len);
            return this.____emultiple(result, args, len);
          },
          // support longDecimal
          ____emultiple: function(result, args, len) {
            var maxE_10 = PL.number.__countOfDecimalDigit(String(args[0]));
            var i = 0;
            while(++i < len) {
              var e_10 = PL.number.__countOfDecimalDigit(String(args[i]));
              if(e_10 > maxE_10) maxE_10 = e_10;
            }
            var e = this.pow10(maxE_10); // pow is used outside of loop
            result = this.__powNorm(args[0], e);
            i = 0;
            while(++i < len) result *= this.__powNorm(args[i], e);
            console.log(this.__powNorm(args[0], e));
            console.log(this.__powNorm(args[1], e));
            console.log(e);
            result /= this.multiple10(maxE_10, maxE_10);

            return result;
          },
          lerp: function(ratio, start, end) {
            ratio = Number(ratio), start |= 0, end = Number(end);
            if(isNaN(ratio)) return NaN;
            return this._lerp(ratio, start, end);
          },
          _lerp: function(ratio, start, end) {
            return start + (end - start) * ratio;
          },
          toPercent: function(ratio) { // opposite of toRate
            if (ratio < 0 || ratio > 1) // ratio >>> 1 === 0
              throw new RangeError(ratio + ' must be between [0, 1]');

            return this.lerp(ratio, 0, 100);
          },
          _toPercent: function(ratio) {
            return this._lerp(ratio, 0, 100);
          },
          norm: function(x, min, max) {
            if (x < min || x > max)
              throw new RangeError(x + ' must be between [' + min + ', ' + max + ']');
    
            return this._norm(x, min, max);
          },
          _norm: function(x, min, max) {
            return x === max ? 1 : (x - min) / (max - min);
          },
          toRate: function(x) { // opposite of toPercent
            return this.norm(x, 0, 100);
          },
          _toRate: function(x) {
            return this._norm(x, 0, 100);
          },
          map: function(x, min1, max1, min2, max2) {
            return this.lerp(this.norm(x, min1, max1), min2, max2);
          },
          _map: function(x, min1, max1, min2, max2) {
            return this._lerp(this._norm(x, min1, max1), min2, max2);
          },
          cbrt: function(x) {
            return Math.fround(Math.sqrt(x) / 6);
          },
          sign: function(x) {
            x = Number(x);
            if(x === 0) return x;
            if(isNaN(x)) return NaN;
            return x < 0 ? -1 : 1;
          },
          abs: function(x) {
            x = Number(x);
            return this._abs(x);
          },
          _abs: function(x) {
            return x < 0 ? -x : x;
          },
          trunc: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return this._trunc(x);
          },
          _trunc: function(x) {
            if(x >= PL.bit.O32 && x <= -(PL.bit.O32)-1) return PL.bit.trunc(x); // delegate to bit operator when there are not an overflow
            var str = x.toString();
            var eIndex = str.indexOf('e');
            if(eIndex !== -1) {
              var next = str.charAt(eIndex + 1);
              if(next === '+') return x;
              if(next === '-') return 0;
              return 0;
            }
            var dotIndex = str.indexOf('.');
            if(x === Infinity || x === -Infinity || dotIndex === -1) return x;

            return Number(str.substring(0, dotIndex));
          },
          ceil: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return this._ceil(x);
          },
          _ceil: function(x) {
            if(x >= PL.bit.O32 && x <= -(PL.bit.O32)-1) return PL.bit.ceil(x); // delegate to bit operator when there are not an overflow
            var str = x.toString();
            var eIndex = str.indexOf('e');
            if(eIndex !== -1) {
              var next = str.charAt(eIndex + 1);
              if(next === '+') return x;
              if(next === '-') return 1;
            }
            var dotIndex = str.indexOf('.');
            if(x === Infinity || x === -Infinity || dotIndex === -1) return x;

            if(x >= 0) {
              str = (++x).toString();
              dotIndex = str.indexOf('.', dotIndex); // update index
            }
            return Number(str.substring(0, dotIndex));
          },
          floor: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return this._floor(x);
          },
          _floor: function(x) {
            if(x >= PL.bit.O32 && x <= -(PL.bit.O32)-1) return PL.bit.floor(x); // delegate to bit operator when there are not an overflow
            var str = x.toString();
            var eIndex = str.indexOf('e');
            if(eIndex !== -1) {
              var next = str.charAt(eIndex + 1);
              if(next === '+') return x;
              if(next === '-') return 0;
            }
            var dotIndex = str.indexOf('.');
            if(x === Infinity || x === -Infinity || dotIndex === -1) return x;

            if(x < 0) {
              str = (--x).toString();
              dotIndex = str.indexOf('.', dotIndex); // update index
            }
            return Number(str.substring(0, dotIndex));
          },
          round: function(x) {
            x = Number(x);
            if(isNaN(x)) return NaN;
            return this._round(x);
          },
          _round: function(x) {
            if(x >= PL.bit.O32 && x <= -(PL.bit.O32)-1) return PL.bit.round(x); // delegate to bit operator when there are not an overflow
            var str = x.toString();
            var eIndex = str.indexOf('e');
            if(eIndex !== -1) {
              var next = str.charAt(eIndex + 1);
              if(next === '+') return x;
              if(next === '-') return 0;
            }
            var dotIndex = str.indexOf('.');
            if(x === Infinity || x === -Infinity || dotIndex === -1) return x;

            var dNext = str.charAt(dotIndex + 1);
            if(dNext === '') return x;
            if(x >= 0) {
              if(dNext >= 5) {
                str = (++x).toString();
                dotIndex = str.indexOf('.', dotIndex); // update index
              }
            } else if(dNext > 5) {
              str = (--x).toString();
              dotIndex = str.indexOf('.', dotIndex); // update index
            }

            return Number(str.substring(0, dotIndex));
          },
          e: {
            lget: function(n) {
              var e = 1;
              while(n > 1) {
                e /= n;
                e++;
                n--;
              }
              return 1 + e; 
            },
            // nb is the number of decimal desired
            nFor: function(decimalLength) {
              var s = 0, n = 0;
              while (s < decimalLength * Math.LN10) {
                n += 10;
                s = 0;
                for (var k = 2; k <= n; k++) s += Math.log(k);
                s += Math.log((n+1) / (n+2));
              }
              return n;
            },
            sget: function(decimalLength) {
              decimalLength || (decimalLength = 300);
              var size = decimalLength / 4, nmax = this.nFor(decimalLength);
              var T = new Array(size + 2);
              T[0] = 1;
              for(var i = 1; i <= size + 1; i++) T[i] = 0;
              for(var n = nmax; n >= 2; n--) {
                //#region divide
                for(var i = 0; i <= size; i++) {
                  var q = Math.floor(T[i] / n);
                  var r = T[i] % n;
                  T[i] = q;
                  T[i+1] = T[i+1] + 10000 * r;
                }
                //#endregion
                T[0]++;
              }
              T[0]++;
              var aff = T[0].toString() + ".";
              for(var i = 1; i <= size; i++) {
                var t$ = T[i].toString();
                while (t$.length < 4) t$ = "0" + t$;
                aff += " " + t$;
              }
              return aff;
            },
            expo1: function(n) {
              var e = 1, f = 1 + 1/n;
              for(var k = 1; k <= n; k++) e *= f;
              return e;
            },
            expo2: function(n) {
              return Math.pow(1+1/n, n);
            },
            Mac: function(n) {
              var e = 1, fac = 1;
              for(var n = 1; n <= 30; n++) {
                fac *= n;
                e= e + 1/fac;
                var er = 3/ fac / (n+1);
                if (n % 6 === 0 && !confirm("n = "+n+" e = "+e+"\n"+"erreur< "+er)) return;
              }
            }
          },
          pi: {
            // by default use nmax = 350 for 100 decimals
            lget: function(nmax) {
              nmax || (nmax = 350);
              var n = nmax, pi = 2*n / (2*n + 1);

              while(n > 1) {
                pi /= 2*n - 1;
                pi *= n - 1;
                pi += 2;
                n--;
              }
              return pi;
            },
            // nb is the number of decimal desired
            nFor: function(decimalLength) {
              return PL.math.e.nFor(decimalLength)*5;
            },
            // issues: NaN last index + nFor
            sget: function(decimalLength) {
              decimalLength || (decimalLength = 100);
              var b = decimalLength * 100, nmax = this.nFor(decimalLength);
              var size = decimalLength / 4;
              var T = new Array(size + 2);
              for(var i = 1; i <= size + 1; i++) T[i] = 0;
              T[0] = 2*nmax;
              var d = T[0] + 1;
              this._divide(T, d, b, size);
              for(var n = nmax; n >= 2; n--) {
                T[0] += 2;
                d = 2*n -1;
                this._divide(T, d, b, size);
                var m = n-1, q = 0;
                for (var i = size + 1; i >= 1; i--)
                {
                  var p = T[i]*m+q
                  q = Math.floor(p/b);
                  T[i] = p%b;
                }
                T[0] = T[0]*m + q;
              }
              T[0] += 2;
              
              var aff = T[0].toString() + ".";
              for(var i = 1; i <= size; i++) {
                var t$ = T[i].toString();
                while (t$.length < 4) t$ = "0"+t$;
                aff += " " + t$;
              }
              console.log(T);
              return aff;
            },
            _divide: function(T, d, b, size) {
              for(var i=0; i <= size+1; i++)
              {
                var q = Math.floor(T[i]/d);
                var r = T[i] % d;                    
                T[i] = q;
                T[i+1] += b*r;
              }
            },
            perim: function() {
              var n = 6, p = 3, an = Math.sqrt(3) / 4;
              while (an !== .5) {
                n*=2;
                an = Math.sqrt(1/8 + an/4);
                p = p / 2 / an;
                var pex = p / 2 / an;
                //if(!confirm("n = " + n + "\n"+ p + " < pi < " + pex)) return;
              }
              if(p === pex) return p;
              return {'n': n, min: p, max: pex};
            },
            isoperim: function() {
              var n = 2, u = .25, v = Math.sqrt(2) / 4;
              while(v > u) {
                u = (u+v) / 2;
                v = Math.sqrt(u * v);
                n++;
                var vs = 1 / v, us = 1 / u;
                if(!confirm("n = "+n+" / nb. of side = " + Math.pow(2, n) + "\n" + vs + " < pi < " + us)) return;
              }
              if(vs === us) return vs;
              return {'n': n, min: vs, max: us};
            },
            atan: function(n) {
              if(n <= 0) return NaN;
              var d = 1, sn = 0;
              while(n-- !== 0) {
                sn += 1/d - 1/(d + 2);
                d += 4;
              }
              return 4*sn;
            },
            atan2: function() {
              return Math.atan(1) * 4;
            },
            GregS3: function() {
              var n = 0, p1 = 1, sgn = 1;
              while(true) {
                n++;
                sgn = -sgn;
                var p2 = p1 + sgn / (2*n + 1);
                if(n % 1000 === 0)
                {
                  var pi = 2 * (p1+p2), err = Math.abs(p2-p1) / 2;
                  if(!confirm("n = " + n + " , pi = " + pi + "\n"+"Err max = " + err)) return;
                }
                p1 = p2;
              }
            },
            S4: function() {
              var sn = 1, snm1 = 0, tn = 0, n = 0, signe = 1;
              var er;
              while (snm1 !== sn) {
                n++;
                tn = 1 / (2*n+1) / Math.pow(3,n);
                signe =- signe;
                snm1 = sn;
                sn += tn * signe;
                er = tn;
              }
              var k = 2 * Math.sqrt(3);
              return {value: k*sn, errMax: er, n: n};
            },
            LongChamps: function(nmax) {
              nmax || (nmax = 100);
              var Un = 2*nmax + 1;
              for(var n = nmax; n >= 1; n--) Un = (2*n + 1) * (2*n + 1) / (2+Un);
              Un = 1 / (2+Un);
              return 4 / (1+Un);
            },
            // convergenve of pi is slow (when n = 360 000)
            // use MachineGet to get a faster result
            Euler: function() {
              var n = 0, p2 = 0;
              var term;
              while(true)
              {
                n++;
                term = 1/n/n; p2 += term;
                if(n === 360000) break; // change this value to get optimal break value
                /*if(n % 1000 === 0)
                {
                  var pic = 6*p2;
                  var pi = Math.sqrt(pic);
                  if(!confirm("n = "+n+" , pi² = "+pic+"\n"+"pi = "+pi+"\n"+"1/n² = "+term)) return;
                }*/
              }
              var pic = 6*p2;
              return {pic: pic, value: Math.sqrt(pic), n: n, "1/n^2": term};
            },
            _uvw: function(x, y, n) {
              var un = Math.pow(x, 2 * n+1), vn = Math.pow(y, 2 * n+1);
              var wn = (4*un - vn) / (2*n + 1);
              return wn;
            },
            // when nmax > 10 value will not change cause rounded result of computer but errMax will change
            Machine: function(nmax) {
              var x = 1/5, y = 1/239, sn = 0;
              for(var n = 0; n <= nmax; n++) sn += Math.pow(-1, n) * this._uvw(x, y, n, 0);
              var err = 4 * this._uvw(x, y, nmax+1, 1);
              return {value: sn*4, errMax: err};
            },
            WallisIt: function(nmax) {
              var nu = 4 /*2^2*/, de = nu - 1;
              var sn = 2*nu / de;
              for(var n = 2; n <= nmax; n++) {
                nu = Math.pow(2 * n, 2);
                de = nu - 1; 
                sn = sn * nu / de;
              }
              return sn;
            },
            WallisRecur: function(nmax) {
              var nu, sn = 1;
              for(var n = 1; n <= nmax; n++) {
                nu = Math.pow(2 * n, 2);
                sn = sn * nu / (nu -1);
              }
              return 2 * sn;
            },
            Viete: function(nmax) {
              nmax = Number(nmax);
              if(nmax < 0 || isNaN(nmax)) return NaN;
              var r2 = Math.sqrt(2);
              var u = r2 / 2, dsp = u;
              while (nmax-- !== 0) {
                u = Math.sqrt((1+u) / 2);
                dsp *= u;
              }
              return 2 / dsp;
            },
            // the last digit (16th) is incorrect but all other are good
            Fibonacci: function() {
              return 4*(4 * Math.atan(1/5) - Math.atan(1/239));
            },
            // convergence of pi is reach at nmax = 9998
            Milne: function(nmax) {
              nmax || (nmax = 100);
              return PL.math.function.integral.A.Milne(function(x) {
                return 4/(1+Math.pow(x, 2));
              }, 0, 1, nmax);
            },
            // take a cylinder take its perimeter(L) and its diameter (d)
            // if you do a division between both, an approximation of pi must be find
            cylinder: function(d, L) {
              return L/d;
            },
            Mamo: function() {
              return 4*(6 * Math.atan(1/8) + 2 * Math.atan(1/57) + Math.atan(1/239));
            },
            // this section mean that result isn't equals (or close) to Math.PI
            // but like JS round value all other method have also some approximations like Math.PI isn't equals to the trenscendant number pi
            A: {
              Ramanujan: function() {
                return Math.sqrt(Math.sqrt((2143 / 22)));
              },
              //(5/4) + (1/4) * Math.sqrt(Math.pow(15/2, 2) + 1)
              //= 1.25 + (1/4) * Math.sqrt(57.25)
              Borel: function() {
                return 1.25 + (1/4) * Math.sqrt(57.25);
              },
              quadCircle: function() {
                return {value: (254 + 1/6) / 81, err: (4/3) / 81};
              },
              Metius: function() {
                return 355 / 113;
              },
              // use it only to get three decimal not more
              Ptolemee: function() {
                return 3 + 8/60 + 30 / Math.pow(60, 2);
              },
              atan: function() {
                return 4 * (4*Math.atan(1/5) + Math.atan(1/239));
              }
            },
            rand: {
              // Buffon
              // use a real random for this method
              pi2NF: function(nmax) {
                if(nmax < 0) return;
                nmax || (nmax = 1000);
                var f = 0;
                var i = 0;
                var n = nmax;
                while(nmax-- !== 0) {
                  i++;
                  var e = Math.random();
                  if(e === .5) continue;
                  f += e > .5 ? 1 : 0;
                  //if (f !== 0 && n % 10 === 0) console.log("2n/f = "+2*n/f);
                }
                console.log(i);
                if (f !== 0) return 2*n/f;
              },
              pi: function(nmax) {
                if(nmax < 0) return;
                nmax || (nmax = 2000);
                var n = 0, f = 0;
                while (n++ !== nmax) {
                  var x = Math.random() * 6, y = Math.random() * 3;
                  if (y * y <= 6*x - x*x) f++;
                }
                return 4*f/n;
              }     
            }
          },
          // all random disposed here are pseudo random (PRNG)
          // but support seed not like Math.random()
          // the range is always [0, 1]
          // in search of real random (usage for cyptography (password)): SecureRandom.java / rand.secure.rand()
          rand: {
            // Math.random is defined by un+1 = FRAC[(a × un) + b]
            /* usage:
                var seed = pipnet.module.polyfill.math.rand.xmur3("2NF_Buffon");
                var randMethod = pipnet.module.polyfill.math.rand.sfc32(seed(), seed(), seed(), seed());
                var n = 1000;
                while(n-- !== 0) console.log(randMethod(n));

              // when rand method have seed procedure it's recommend to follow these instructions
              // when method has a namespace including rand method and another
              // you can use other method (Mash/seed) to generate seed then call it inside the rand method
              // [!] don't use seed method inside namespace outside of its namespace these methods are adapted for its namespace
              // and not another
              these methods use bit operator that can depends of system architexture (32,64,arm32,arm64)
              // [!] browser can also change the speed of these methods (see #v3b)
              // [!] set known seed value without generator with recommended number and only for test not for production
            */
           seed: { // generate seed for other methods (a|b|c|d|s)
              xmur3: function(str) {
                var len = str.length;
                for(var i = 0, h = 1779033703 ^ len; i < len; i++) {
                  h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
                  h = h << 13 | h >>> 19;
                }
                return function() {
                  h = Math.imul(h ^ h >>> 16, 2246822507);
                  h = Math.imul(h ^ h >>> 13, 3266489909);
                  return (h ^= h >>> 16) >>> 0;
                };
              },
              xmur3a: function(str) {
                var len = str.length;
                for(var k, i = 0, h = 2166136261 >>> 0; i < len; i++) {
                  k = Math.imul(str.charCodeAt(i), 3432918353);
                  k = k << 15 | k >>> 17;
                  h ^= Math.imul(k, 461845907); h = h << 13 | h >>> 19;
                  h = Math.imul(h, 5) + 3864292196 | 0;
                }
                h ^= len;
                return function() {
                  h ^= h >>> 16; h = Math.imul(h, 2246822507);
                  h ^= h >>> 13; h = Math.imul(h, 3266489909);
                  h ^= h >>> 16;
                  return h >>> 0;
                };
              },
              _mix: function(h) {
                h ^= h >>> 15; h = Math.imul(h, 2246822507);
                h ^= h >>> 13; h = Math.imul(h, 3266489917); h ^= h >>> 16;
                return h;
              },
              // s = Array (4) {INT}
              xmur3xxHash: function(s) {
                return function() {
                  var e = s[0] + s[1] + s[2] + s[3];
                  s[0] += e ^ 597399067; s[1] ^= e ^ 668265263; s[2] += e ^ 951274213; s[3] ^= e ^ 374761393;
                  s[0] = this._mix(s[0]) + s[1]; s[1] = this._mix(s[1]);
                  s[2] = this._mix(s[2]) + s[3]; s[3] = this._mix(s[3]);
                  e = s[0] + s[1] + s[2] + s[3];
                  s[0] += e; s[1] ^= e; s[2] += e; s[3] ^= e;
                  return s;
                };
              },
              // older methods before xmur3
              // based on https://papa.bretmulvey.com/post/124027987928/hash-functions
              // @Deprecated proposed only for test
              xfnv1a: function(str) {
                var len = str.length;
                for(var i = 0, h = 2166136261 >>> 0; i < len; i++)
                  h = Math.imul(h ^ str.charCodeAt(i), 16777619);
                return function() {
                  h += h << 13; h ^= h >>> 7;
                  h += h << 3;  h ^= h >>> 17;
                  return (h += h << 5) >>> 0;
                };
              },
              // earlier attempt at improving xfnv1a, possibly overly verbose
              // @Deprecated proposed only for test
              xfnv1ap: function(str) {
                var len = str.length;
                for(var i = 0, h = 0xdeadbeef | 0; i < len; i++) {
                  h = Math.imul(h + str.charCodeAt(i), 2654435761), h ^= h >>> 24,
                  h = Math.imul(h << 11 | h >>> 21, 2246822519);
                }
                return function() {
                  h += h << 13; h ^= h >>> 7; h += h << 3;  h ^= h >>> 17;
                  h ^= h >>> 15;
                  h = Math.imul(h, 2246822507);
                  h ^= h >>> 13;
                  h = Math.imul(h, 3266489917);
                  return ((h = Math.imul(h ^ h >>> 16, 1597334677)) >>> 0);
                };
              }
            },
            mulberry32: function(a) {
              return function() {
                var t = a += 0x6D2B79F5;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
              };
            },
            // Sources: https://www.jstatsoft.org/article/view/v008i14
            // http://www-perso.iro.umontreal.ca/~lecuyer/myftp/papers/xorshift.pdf
            // http://vigna.di.unimi.it/ftp/papers/xorshift.pdf
            // http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
            xorshift32: function(a) {
              return function() {
                a ^= a << 13; a ^= a >>> 17; a ^= a << 5;
                return (a >>> 0) / 4294967296;
              };
            },
            // Improved variants, based on ideas from Marc-B-Reynolds and Sebastiano Vigna
            // https://gist.github.com/Marc-B-Reynolds/0b5f1db5ad7a3e453596
            // https://gist.github.com/Marc-B-Reynolds/82bcd9bd016246787c95
            
            // 32-bit version of "xorshift64star" using a 32-bit LCG multiplier
            xorshift32m: function(a) {
              return function() {
                a ^= a << 13; a ^= a >>> 17; a ^= a << 5;
                return (Math.imul(a, 1597334677) >>> 0) / 4294967296;
              };
            },
            // This version should pass SmallCrush, implements __builtin_bswap32
            xorshift32amx: function(a) {
              return function() {
                var t = Math.imul(a, 1597334677);
                t = t >>> 24 | t >>> 8&65280 | t << 8&16711680 | t << 24; // reverse byte order
                a ^= a << 13; a ^= a >>> 17; a ^= a << 5;
                return (a + t >>> 0) / 4294967296;
              };
            },
            xorshift64: function(a) {
              return function() {
                a ^= a << 13, a ^= a >> 7, a ^= a << 17;
                return (a >>> 0) / 4294967296;
              };
            },
            // suggested by Marsaglia, fails only the MatrixRank test of BigCrush
            xorshift64s: function(a) {
              return function() {
                a ^= a >> 12, a ^= a << 25, a ^= a >> 27; // abc
                return a / 2147483648;
              };
            },
            xorshift128: function(a, b, c, d) {
              return function() {
                var t = a ^ a << 11;
                a = b, b = c, c = d;
                d = (d ^ d >>> 19) ^ (t ^ t >>> 8);
                return (d >>> 0) / 4294967296;
              };
            },
            // it does not always pass BigCrush, xoshiro256 is much better than this one
            xorshift1024s: {
              index: 0,
              //transform seed method to an array of 16 items
              aseed: function(m) {
                return function() {
                  var arr = new Array(16);
                  for(var i = 0; i < 16; i++) arr[i] = m();
                  return arr;
                };
              },
              rand: function(arr) {
                return function() {
                  var s = arr[this.index++], t = arr[this.index &= 15];
                  t ^= t << 31, t ^= t >> 11, t ^= s ^ (s >> 30);	// abc
                  return t / 2147483648;
                }.bind(this);
              }
            },
            xorshift128p: function(a, b) { // 64 bits
              return function() {
                var t = a, s = b;
                t ^= t << 23, t ^= t >> 17, t ^= s ^ (s >> 26);	// abc
                return t + s;
              };
            },
            // 32-bit xorshift128+ (experimental, later improved to xoroshiro)
            // Source: https://github.com/umireon/my-random-stuff/blob/master/xorshift/xorshift128plus_32_test.c
            // This is functionally equivalent to the generator currently used in Google Chrome since 2015.
            xorshift128p32: function(a, b, c, d) {
              return function() {
                var x = a >>> 0,
                    y = b >>> 0,
                    z = c >>> 0,
                    w = d >>> 0, t;
          
                t = w + y + (x !== 0 && z >= (-x>>>0) ? 1 : 0);
                y ^= y << 23 | x >>> 9;
                x ^= x << 23;
          
                a = z;
                b = w;
                c = x ^ z ^ (x >>> 18 | y << 14) ^ (z >>> 5 | w << 27);
                d = y ^ w ^ (y >>> 18) ^ (w >>> 5);
          
                return t >>> 0;
              };
            },
            /* Algorithm "xorwow" from p. 5 of Marsaglia, "Xorshift RNGs" */
            xorwow: function(a, b, c, d, e, f) {
              return function() {
                var t = a ^ a >>> 2;
                a = b, b = c, c = d, d = e;
                e = (e ^ e << 4) ^ (t ^ t << 1);
                f += 362437;
                return ((e+f) >>> 0) / 4294967296;
              };
            },
            // Source: https://web.archive.org/web/20180201134533/http://xoroshiro.di.unimi.it/
            xoroshiro64ss: function(a, b) {
              return function() {
                var r = Math.imul(a, 0x9E3779BB);
                r = (r << 5 | r >>> 27) * 5;
                b ^= a; a = b ^ (a << 26 | a >>> 6) ^ b << 9;
                b = b << 13 | b >>> 19;
                return (r >>> 0) / 4294967296;
              };
            },
            // only good for floating point values, linearity issues on lower bits.
            xoroshiro64s: function(a, b) {
              return function() {
                var r = Math.imul(a, 0x9E3779BB);
                b ^= a;
                a = b ^ (a << 26 | a >>> 6) ^ b << 9;
                b = b << 13 | b >>> 19;
                return (r >>> 0) / 4294967296;
              };
            },
            // unofficial xoroshiro64+ (experimental)
            xoroshiro64p: function(a, b) {
              return function() {
                var r = a + b;
                b ^= a;
                a = b ^ (a << 26 | a >>> 6) ^ b << 9;
                b = b << 13 | b >>> 19;
                return (r >>> 0) / 4294967296;
              };
            },
            // 32-bit xoroshiro128+ (experimental)
            // Source: https://github.com/umireon/my-random-stuff/blob/master/xorshift/xoroshiro128plus_32_test.c
            xoroshiro128p32: function(a, b, c, d) {
              return function() {
                var x = a >>> 0, y = b >>> 0, z = c >>> 0, w = d >>> 0, t;
          
                t = w + y + (z !== 0 && x >= (-z>>>0) ? 1 : 0);
                z ^= x;
                w ^= y;
          
                a = (y << 23 | x >>> 9) ^ z ^ (z << 14);
                b = (x << 23 | y >>> 9) ^ w ^ (w << 14 | z >>> 18);
                c = w << 4 | z >>> 28;
                d = z << 4 | w >>> 28;
          
                return t >>> 0;
              };
            },
            // Source: http://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf
            xoshiro128ss: function(a, b, c, d) {
              return function() {
                var t = b << 9, r = a * 5; r = (r << 7 | r >>> 25) * 9;
                c ^= a; d ^= b;
                b ^= c; a ^= d; c ^= t;
                d = d << 11 | d >>> 21;
                return (r >>> 0) / 4294967296;
              };
            },
            xoshiro128pp: function(a, b, c, d) {
              return function() {
                var t = b << 9, r = a + d; r = (r << 7 | r >>> 25) + a;
                c = c ^ a; d = d ^ b; b = b ^ c; a = a ^ d; c = c ^ t;
                d = d << 11 | d >>> 21;
                return (r >>> 0) / 4294967296;
              };
            },
            // "for floating-point generation" - indicating serious bias in lowest bits.
            xoshiro128p: function(a, b, c, d) {
              return function() {
                var t = b << 9, r = a + d;
                c = c ^ a; d = d ^ b; b = b ^ c; a = a ^ d; c = c ^ t;
                d = d << 11 | d >>> 21;
                return (r >>> 0) / 4294967296;
              };
            },
            _rol64: function(x, k) {
              return (x << k) | (x >> (64 - k));
            },
            // Source: https://en.wikipedia.org/wiki/Xorshift
            xoshiro256ss: function(a, b, c, d) {
              return function() {
                var result = this._rol64(b * 5, 7) * 9;
                var t = b << 17;
              
                c ^= a;
                d ^= b;
                b ^= c;
                a ^= d;
              
                c ^= t;
                d = this._rol64(d, 45);
              
                return (result >>> 0) / 4294967296;
              }.bind(this);
            },
            // 15% faster than xoshiro256ss, but the lowest three bits have low linear complexity;
            // therefore, it should be used only for floating point results
            xoshiro256p: function(a, b, c, d) {
              return function() {
                var result = a + d;
                var t = b << 17;
              
                c ^= a;
                d ^= b;
                b ^= c;
                a ^= d;
              
                c ^= t;
                d = this._rol64(d, 45);
              
                return (result >>> 0) / 4294967296;
              }.bind(this);
            },
            // Source: https://burtleburtle.net/bob/rand/smallprng.html
            /* Seed procedure as recommended by the author:
                var seed = 0; // any unsigned 32-bit integer.
                var jsf = jsf32([0xF1EA5EED, seed, seed, seed]);
                for(var i = 0; i < 20; i++) jsf(); */
            jsf32: function(a, b, c, d) {
              return function() {
                a |= 0; b |= 0; c |= 0; d |= 0;
                var t = a - (b << 27 | b >>> 5) | 0;
                a = b ^ (c << 17 | c >>> 15);
                b = c + d | 0;
                c = d + t | 0;
                d = a + t | 0;
                return (d >>> 0) / 4294967296;
              };
            },
            // 3-rotate version, improves randomness.
            jsf32b: function(a, b, c, d) {
              return function() {
                a |= 0; b |= 0; c |= 0; d |= 0;
                var t = a - (b << 23 | b >>> 9) | 0;
                a = b ^ (c << 16 | c >>> 16) | 0;
                b = c + (d << 11 | d >>> 21) | 0;
                b = c + d | 0;
                c = d + t | 0;
                d = a + t | 0;
                return (d >>> 0) / 4294967296;
              };
            },
            // "chaotic" PRNG
            /* Source: http://gjrand.sourceforge.net/
              Seed procedure as recommended by the author (close enough):
              var seed = 0; // any unsigned 32-bit integer.
              var advance = gjrand32([0xCAFEF00D, 0xBEEF5EED, seed, seed]);
              for(var i = 0; i < 14; i++) advance(); */
            gjrand32: function(a, b, c, d) {
              return function() {
                a |= 0; b |= 0; c |= 0; d |= 0;
                a = a << 16 | a >>> 16;
                b = b + c | 0;
                a = a + b | 0;
                c = c ^ b;
                c = c << 11 | c >>> 21;
                b = b ^ a;
                a = a + c | 0;
                b = c << 19 | c >>> 13;
                c = c + a | 0;
                d = d + 0x96a5 | 0;
                b = b + d | 0;
                return (a >>> 0) / 4294967296;
              };
            },
            // Source: http://pracrand.sourceforge.net/
            sfc32: function(a, b, c, d) {
              return function() {
                a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
                var t = (a + b) | 0;
                a = b ^ b >>> 9;
                b = c + (c << 3) | 0;
                c = (c << 21 | c >>> 11);
                d += 1 | 0;
                t += d | 0;
                c += t | 0;
                return (t >>> 0) / 4294967296;
              };
            },
            // fast on Firefox but slow in Chrome
            // Souce: http://cipherdev.org/v3b.c
            /* Seed procedure as recommended by the author:
              var seed = 0; // any unsigned 32-bit integer
              var next = v3b(seed, 2654435769, 1013904242, 3668340011); // golden ratios
              for(var i = 0; i < 16; i++) next(); */
            v3b: function(a, b, c, d) {
              var out, pos = 0, a0 = 0, b0 = b, c0 = c, d0 = d;
              return function() {
                if(pos === 0) {
                  a += d; a = a << 21 | a >>> 11;
                  b = (b << 12 | b >>> 20) + c;
                  c ^= a; d ^= b;
                  a += d; a = a << 19 | a >>> 13;
                  b = (b << 24 | b >>> 8) + c;
                  c ^= a; d ^= b;
                  a += d; a = a << 7 | a >>> 25;
                  b = (b << 12 | b >>> 20) + c;
                  c ^= a; d ^= b;
                  a += d; a = a << 27 | a >>> 5;
                  b = (b << 17 | b >>> 15) + c;
                  c ^= a; d ^= b;
                
                  a += a0; b += b0; c += c0; d += d0; a0++; pos = 4;
                }
                switch(--pos) {
                  case 0: out = a; break;
                  case 1: out = b; break;
                  case 2: out = c; break;
                  case 3: out = d; break;
                }
                return out >>> 0;
              };
            },
            // Source: https://www.researchgate.net/publication/233997772_Fast_and_Small_Nonlinear_Pseudorandom_Number_Generators_for_Computer_Simulation
            // inverted version of tyche 20% faster
            tychei: function(a, b, c, d) {
              return function() {
                a |= 0; b |= 0; c |= 0; d |= 0;
                b = (b << 25 | b >>> 7)  ^ c; c = c - d | 0;
                d = (d << 24 | d >>> 8)  ^ a; a = a - b | 0;
                b = (b << 20 | b >>> 12) ^ c; c = c - d | 0;
                d = (d << 16 | d >>> 16) ^ a; a = a - b | 0;
                return (a >>> 0) / 4294967296;
              };
            },
            // based on ChaCha's quarter-round
            tyche: function(a, b, c, d) {
              return function() {
                a |= 0; b |= 0; c |= 0; d |= 0;
                a = a + b | 0; d = d ^ a; d = d << 16 | d >>> 16;
                c = c + d | 0; b ^= c; b = b << 12 | b >>> 20;
                a = a + b | 0; d ^= a; d = d << 8  | d >>> 24;
                c = c + d | 0; b ^= c; b = b << 7  | b >>> 25;
                return (b >>> 0) / 4294967296;
              };
            },
            // when jsr isn't generated by seed generator jsr=123456789
            SHR3: function(jsr) {
              return function() {
                jsr ^= jsr << 17, jsr ^= jsr >> 13, jsr ^= jsr << 5;
                return (jsr >>> 0) / 4294967296;
              };
            },
            // when jcg isn't generated by seed generator jcg=380116160
            CNG: function(jcg) {
              return function() {
                jcg = 69069 * jcg + 1234567;
                return (jcg >>> 0) / 4294967296;
              };
            },
            FIB: function(a, b) {
              return function() {
                b += a, a -= b;
                return (a >>> 0) / 4294967296;
              };
            },
            LFIB4: function(a) {
              a++;
              T[a] += T[(a+58) & 255] + T[(a+119) & 255] + T[(a+178) & 255];
              return T[a];
            },
            SWB: function(a, b, c) {
              a++, t = b < c ? 1 : 0;
              b = T[(a+34) & 255], c = T[(a+19) & 255] + t;
              T[a] = b - c;
              return T[a];
            },
            XOS: function(a, b, c, d) {
              var tmp = a ^ (a << 15); 
              a += b, b += c, c += d; 
              d += (d ^ (d>>21)) ^ (tmp ^ (tmp >> 4));
              return d;
            },
            // George Marsaglia's PRNG
            // kiss use diffent sub PRNG like MWC, Xorshift, Congruential
            // Source: https://link.springer.com/content/pdf/10.1007%2Fs12095-017-0225-x.pdf
            kiss32: function(w, z, jsr, jcng) {
              return function() {
                z *= (z&65535) + (z>>16), w *= (w&65535) + (w>>16);
                var MWC = (z << 16) + w;
                jsr ^= jsr << 17, jsr ^= jsr >> 13, jsr ^= jsr << 5;  
                var SHR3 = jsr;
                var CNG = 69069 * jcng + 1234567;
                return (((MWC^CNG)+SHR3) >>> 0) / 4294967296;
              };
            },
            kiss: function(x, jsr, cng) { // 64 bit
              return function() {
                var c = x >> 6;
                var t = (x << 58) + c;
                x += t, c += (x < t);
                var MWC = c;
                jsr ^= jsr << 13, jsr ^= jsr >> 17, jsr ^= jsr << 43;
                var XSH = jsr;
                var CNG = 69069 * cng + 1234567;
                return ((MWC+XSH+CNG) >>> 0) / 4294967296;
              };
            },
            kiss11: {
              Q: 4194304,
              carry: 0,
              rand: function(j, cng, jsr) {
                return function() {
                  j = (j + 1) & 4194303;
                  var x = this.Q;
                  var t = (x << 28) + this.carry;
                  this.carry = (x >> 4) - (t<x);
                  this.Q = t - x;

                  var CNG = 69069 * cng + 13579;
                  jsr ^= jsr << 13, jsr ^= jsr >> 17, jsr ^= jsr << 5;
                  var XSH = jsr;
                  return ((this.Q+CNG+XSH) >>> 0) / 4294967296;
                }.bind(this);
              }
            },
            // end of George Marsaglia's PRNG
            // recommended seed generator for xor generator
            /* Example of seed generator in C (state struct represent parameter a(64) [b(32) c(64) d(32)])
              #include <stdint.h>

              struct splitmix64_state {
                uint64_t s;
              };
              struct xorshift128_state xorshift128_init(uint64_t seed) {
                struct splitmix64_state smstate = {seed};
                struct xorshift128_state result = {0};

                uint64_t tmp = splitmix64(&smstate);
                result.a = (uint32_t)tmp;
                result.b = (uint32_t)(tmp >> 32);

                tmp = splitmix64(&smstate);
                result.c = (uint32_t)tmp;
                result.d = (uint32_t)(tmp >> 32);

                return result;
              }
              In JS:
                seed: {
                  xorArray: function(s) {
                    var a, b, c, d;
                    var tmp = splitmix64(s);
                    a = tmp >>> 0;
                    b = (tmp >> 32) >>> 0;

                    tmp = splitmix64(s);
                    c = tmp >>> 0;
                    d = (tmp >> 32) >>> 0;
                    return [a, b, c, d];
                    // in js create a lot of array like struct (in C) isn't recommended so
                    // i recommend to use xorI(s, letter) when you generate a lot of seed struct
                  },
                  // example on tychei
                  var tmp = splitmix64(s), tmp2 = splitmix64(s);
                  tychei(xorI(tmp, false), xorI(tmp, true), xorI(tmp2, false), xorI(tmp2, true))();
                  xorI: function(splitmix64, is64b) {
                    return is64b ? splitmix64 >>> 0 : (splitmix64 >> 32) >>> 0;
                  },
                  xorOn: function(s, xorMethod) {
                    return xorMethod.apply(null, this.xorArray(s))();
                  }
                }
              */
            splitmix64: function(a) {
              return function() {
                var result = BigInt(a) + 0x9E3779B97f4A7C15n;
                result = (result ^ (result >> 30n)) * 0xBF58476D1CE4E5B9n;
                result = (result ^ (result >> 27n)) * 0x94D049BB133111EBn;
                return ((result ^ (result >> 31n)) >> 0n);
              };
            },
            // Sources: http://gee.cs.oswego.edu/dl/papers/oopsla14.pdf http://marc-b-reynolds.github.io/shf/2017/09/27/LPRNS.html
            // https://nullprogram.com/blog/2018/07/31/
            // SplitMix32 is a transformation of the fmix32 finalizer from MurmurHash3 into a PRNG.
            // It has a 32-bit internal state, like Xorshift and Mulberry32.
            splitmix32: function(a) {
              return function() {
                a |= 0; a = a + 0x9e3779b9 | 0;
                var t = a ^ a >>> 15
                t = Math.imul(t, 0x85ebca6b);
                t ^= t >>> 13;
                t = Math.imul(t, 0xc2b2ae35);
                return ((t ^= t >>> 16) >>> 0) / 4294967296;
              };
            },
            entropy: function() {

            },
            Sykari: function(s) {
              return function() {
                s = Math.sin(s) * 10000;
                return s - Math.floor(s);
              };
            },
            // @Deprecated consecutive values are correlated, every 710, are related
            sin: function(s) {
              if(s === 0 || (s % (Math.PI/2)) === 0) throw new RangeError("seed must be different of zero and not a multiple of (PI / 2)");
              return function() {
                var x = Math.sin(s++) * 10000;
                return x - Math.floor(x);
              };
            },
            // maybe change imul x1
            // Linear congruential generator
            // Sources: https://en.wikipedia.org/wiki/Linear_congruential_generator
            // http://www.firstpr.com.au/dsp/rand31/p1192-park.pdf
            // http://www.firstpr.com.au/dsp/rand31/p105-crawford.pdf#page=4
            // https://pdfs.semanticscholar.org/8284/542deb19d556c8818e0456cce771a50ed0ff.pdf
            /*  c is non zero
                c and m are relatively prime,
                a-1 is divisible by all prime factors of m,
                a-1 is a multiple of 4 if m is a multiple of 4. */
            /*
            example:
              x = 1
              a = x*7*47 + 1
              c = 100
              m = 48^2 - 1
              -> (s = Math.imul(a, s) >>> 0) / 4294967296;
             */
            LCG: {
              0: function(s) {
                return function() {
                  return (s = Math.imul(48271, s) >>> 0) / 4294967296;
                }.bind(this);
              },
              1: function(s) {
                return function() {
                  return (s = Math.imul(741103597, s) >>> 0) / 4294967296;
                }.bind(this);
              },
              2: function(s) {
                return function() {
                  return (s = Math.imul(1597334677, s) >>> 0) / 4294967296;
                }.bind(this);
              }
            },
            next: function(s) {
              var next = 4;
              return function() {
                  return ((s + next++) >>> 0) / 4294967296;
              };
            },
            // multiply with carry
            // big period: 2^60 to 2^2000000.
            MWC: {
              //m_w: 123456789,
              //m_z: 987654321,
              mask: 0xffffffff,
              seed: function(i) {
                return {m_w: (123456789 + i) & this.mask, m_z: (987654321 - i) & this.mask};
              },
              rand: function(o) {
                return function() {
                  o.m_z = (36969 * (o.m_z & 65535) + (o.m_z >> 16)) & this.mask;
                  o.m_w = (18000 * (o.m_w & 65535) + (o.m_w >> 16)) & this.mask;
                  var result = (o.m_z << 16) + (o.m_w & 65535);
                  return (result >>> 0) / 4294967296;
                }.bind(this);
              }
            },
            // based on MWC
            Alea: {
              Mash: function(r) {
                if(r === undefined) r = +new Date() + Math.random();
                var n = 4022871197;
                return function() {
                  var len = r.length;
                  for(var t, s, u = 0, e = 0.02519603282416938; u < len; u++) {
                    s = r.charCodeAt(u);
                    var f = (e * (n += s) - (n*e|0));
                    n = 4294967296 * ((t = f * (e*n|0)) - (t|0)) + (t|0);
                  }
                  return (n|0) * 2.3283064365386963e-10;
                };
              },
              rand: function(s) {
                var m = this.Mash(s), a = m(" "), b = a, c = a, d = m(s), x = 1;
                a -= d, b -= d, c -= d;
                a < 0 && a++, b < 0 && b++, c < 0 && c++;
                return function() {
                  var y = x * 2.3283064365386963e-10 + a * 2091639; a = b, b = c;
                  return c = y - (x = y|0);
                };
              }
            },
            // this use method of your browser if this method isn't available you get an error
            // like this method depends on your program the PRNG can be different on other browser
            // don't use method of browser for Cryptography cause you don't really know if all browser have the same secure PRNG
            // instead...
            secure: {
              rng: window.crypto || window.msCrypto,
              checkAvailable: function(arrayBufferView) {
                if (this.rng === undefined) throw new TypeError("Your browser is too older to execute a suitable RNG");
                if(window[arrayBufferView] === undefined) throw new ReferenceError(arrayBufferView + " doesn't exist");
              },
              // you can change arrayBufferView constructor
              // to change the range of result
              // by default Uint32Array simulate Math.random with secure hash
              rand: function(arrayBufferView) {
                arrayBufferView || (arrayBufferView = 'Uint32Array');
                this.checkAvailable(arrayBufferView);

                // Source: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues#Examples
                return function() {
                  return this.rng.getRandomValues(new window[arrayBufferView](1))[0] / 4294967296;
                }.bind(this);
              },
              rawBytes: function(arrayBufferView) {
                arrayBufferView || (arrayBufferView = 'Uint8Array');
                this.checkAvailable(arrayBufferView);

                return function(N) {
                  return String.fromCharCode.apply(null, this.rng.getRandomValues(new window[arrayBufferView](N)));
                }.bind(this);
              },
              // N is always a multiple of two event for odd number: 3 => 2
              hash: function(arrayBufferView) {
                arrayBufferView || (arrayBufferView = 'Uint8Array');
                this.checkAvailable(arrayBufferView);

                var d = 0;
                switch(arrayBufferView) {
                  case 'Uint16Array': d = 2; break;
                  case 'Uint32Array': d = 3; break;
                  default: d = 1; // Uint8ClampedArray | Uint8Array
                }
                return function(N) {
                  var uArray = this.rng.getRandomValues(new window[arrayBufferView](N>>d));
                  var result = "", totalLen = 0;
                  for(var i = 0, len = uArray.length; i < len; i++) {
                    var c = uArray[i], hex = c.toString(16);
                    var nhex = (c < 16 ? '0' : '') + hex;
                    result += nhex;
                    totalLen += nhex.length;
                    if(totalLen > N) {
                      var d = totalLen - N;
                      return result.substring(0, totalLen -d);
                    }
                  }
                  return result;
                }.bind(this);
              },
            }
          },
          f: {
            table: {
              separator: "\n+-----+-----+",
              show: function(f, min, max) {
                var s = this.separator + "\n|  x  |  y  |";
                do
                  s += this.separator + "\n|  " + max + "  |  " + f(max) + "  |";
                while(max-- !== min);
                return s + this.separator;
              },
              asArray: function(f, min, max) {
                var a = new Array(max-min);
                do
                  a[max] = f(max);
                while(max-- !== min);
                return a;
              },
              var: {
                show: function(f, min, max) {
                  var isPositive = null;
                  var top = "", sep = "", bottom = "";
                  top += "|  ";
                  do {
                    var vari = max >= 0;
                    if(isPositive !== null && isPositive === sign) continue;
                    top += max + "  |";
                    sep += "+-----+-----";
                    bottom += (sign ? '+' : '-') + "  |";
                  } while(max-- !== min);
                  return sep + "+\n" + top + "\n" + sep + "+\n" + bottom;
                }
              },
              sign: {
                show: function(f, min, max) {
                  var isPositive = null;
                  var top = "", sep = "", bottom = "|";
                  top += "|";
                  do {
                    var y = f(min), isZero = y === 0, sign = y > 0;
                    if(isNaN(y) || y === Infinity || y === -Infinity) continue;
                    if(isPositive !== null && !isZero) {
                      if(isPositive === sign && min < 0) continue;
                      if(min > 0) continue;
                    }
                    isPositive = isZero ? null : sign;
                    top += "  " + min + "  |";
                    sep += "+-----";
                    if(!isZero) bottom += "     " + (sign ? '+' : '-') + "     |";
                  } while(min++ !== max);
                  return "\n" + sep + "+\n" + top + "\n" + sep + "+\n" + bottom + "\n" + sep + "+";
                }
              }
            },
            graph: {

            },
            type: function() {

            },
            primCotes: function(x) {
              var x2 = Math.pow(x, 2);
              return (1/2) * (x2 + Math.log(Math.abs(2*x - 1)) + Math.log(x2 + 1));
            },
            limit: {

            },
            deriv: {
              dL2: function(f, x, h) {
                var fx = f(x), af = f(x+h), df = f(x-h);
                var deriv1 = (af - fx) / h,
                    deriv2= (af + df - 2*fx) / (h*h);
                var d1 = Math.round(deriv1 * 10000) / 10000, // round 4 decimal digits
                    d2 = Math.round(deriv2 * 10000) / 10000;
                var r = 17;
                var Tt = Math.abs(deriv2 / 2) * h, Tr = (Math.abs(fx) * r) / h;
                return {x: x, fx: fx, "f'x": d1, "f''x": d2, error: {trunc: Tt, round: Tr, max: Tt + Tr}};
              },
              dL3: function(f, x, h) {
                var fx = f(x), af = f(x+h), df = f(x-h);
                var deriv1 = (af - df) / (2 * h),
                    deriv2= (af + df - 2*fx) / (h*h);
                var d1 = Math.round(deriv1 * 10000) / 10000, // round 4 decimal digits
                    d2 = Math.round(deriv2 * 10000) / 10000;
                var t = Math.abs(2 * Math.E * fx) / h;
                return {x: x, fx: fx, "f'x": d1, "f''x": d2, T: t, Tm: 0};
              }
            },
            integral: {
              // this package provide methods that give an approximation calcul of integral
              // name are based on name of person or object
              // event best method give an approximation due to computer limit (or js engine round: see math big methods)  
              A: {
                // based on: https://zestedesavoir.com/tutoriels/472/calcul-approche-dintegrales/ where you can find all calculs
                // big approx
                // convert courb to rectangle
                // speed of convergence: O(1/n)
                rect: function(f, a, b, n) {
                  var s = 0, step = (b - a) / n;
                  var x = a;
                  for(var i = 0; i < n; i++) {
                    s += f(x);
                    x += step;
                  }
                  return s * step;
                },
                // using polynom interpolaters of Lagrange: trap(1) Simpson(2), Simpson38(3), Milne(4), Weddle(6)
                // medium approx
                // convert courb to trapeze
                // speed of convergence: O(1/(n^2))
                trap: function(f, a, b, n) {
                  var s = (f(a) + f(b)) / 2;
                  var step = (b - a) / n;
                  var x = a + step; 
                  for(var i = 1; i < n; i++) {
                    s += f(x);
                    x += step;
                  }
                  return s * step;
                },
                // speed of convergence: O(1/(n^4))
                Simpson: function(f, a, b, n) {
                  var step = (b - a) / n;
                  var s = (f(a) + f(b)) / 2 + 2 * f(a + step / 2);
                  var x = a + step;
                  var e = 0;
                  while(n-- !== 0) {
                    s += f(x) + 2 * f(x + step / 2);
                    x += step;
                    e++;
                  }
                  console.log(e);
                  return s * step / 3;
                },
                Simpson2: function(f, a, b, n) {
                  var h = (b - a) / n, j = f(a);
                  var e = 0;
                  for(var i = 1; i <= n - 2; i += 2) {
                    var x = a + i*h;
                    j += 4*f(x) +2*f(x+h);
                    e++;
                  }
                  console.log(e);
                  j += 4*f(b-h) + f(b);
                  return j * h / 3;
                },
                // n must be a multiple of 3 otherwise n will be rounded to be a multiple of 3
                Simpson38: function(f, a, b, n) {
                  var k = (n % 3) | 0;
                  if (k !== 0) n = (n+2) * (k === 1) + (n+1) * (k === 2);
                  var h = (b - a) / n;
                  var j = 0;
                  for(var i = 1; i <= n - 2; i += 3) {
                    var x = a + i*h;
                    j = j + 3*f(x) + 3*f(x+h) + 2*f(x+2*h);
                  }
                  j += f(a) - f(b);
                  return j * h * 3/8;
                },
                // improved trap method
                // when b - a > 10 or p > 5: n = 8
                Romberg: function(f, a, b, n, p) {
                  if(b - a > 10 || p > 5) n = 8;
                  if(p >= 8) {
                    console.warn("Risk of divergence. In this case decrease p or increase n");
                    return;
                  }
                  var max = Math.pow(2, n);
                  var af = f(a) + f(b);
                  var r = new Array(max);
                  for(var i = 0; i <= max; i++) r[i] = [];
                  r[0][0] = (b-a) * af / 2;
                  r[1][0] = (b-a) * (af + 2 * f(a / 2 + b / 2)) / 4;
                  var nn = 1;
                  while(nn++ <= n)
                  {
                    var ns = Math.pow(2, nn);
                    var h = (b-a) / ns;
                    r[nn][0] = af / 2;
                    for(var i = 1;i <= ns-1; i++) r[nn][0] = r[nn][0] + f(a + i * h);
                    r[nn][0] = h * r[nn][0] // end r(i,j) while i = 0 to n
                  }
                  var j = 0;
                  while(j++ <= n-1)
                  {
                    i = j - 1;
                    while (i++ <= n) {
                      var k = Math.pow(4, j);
                      r[i][j] = (k * r[i][j-1] - r[i-1][j-1]) / (k-1);
                      var test = Math.abs(r[i][j] - r[i-1][j]);
                      if(test < Math.pow(10, -p)) {
                        console.log(r);
                        console.log("Integrale Trapèzes = " + r[n][0] + "\n" + "Integrale Romberg = "+r[i][j]);
                        return;
                      }
                    }
                  }
                  console.warn("Algorithm doesn't converge for p = " + p);
                },
                // n must be a multiple of 4 otherwise n will be rounded to be a multiple of 4
                Milne: function(f, a, b, n) {
                  var r = n % 4;
                  if (r !== 0) n = Math.ceil(n / 4) * 4;
                  var h = (b - a) / n;
                  var j = 0;
                  for(var i = 0; i <= n-4; i+=4) {
                    var x = a + i * h;
                    j += 7 * f(x) + 32 * f(x+h) + 12 * f(x+2*h) + 32 * f(x+3*h) + 7 * f(x+4*h);
                  }
                  return j * h * 2/45;
                },
                // convert courb to tangente
                // to choose between tanM and tanA: use a benchmark with different power of calcul in your context
                // cause tanM use simple multiplication
                // where tanEA use math#eadd that use a lot of calcul and check for longdecimal error
                tanM: function(f, a, b, n) {
                  var s = 0, step = (b - a) / n;
                  var x = a + step / 2;
                  for(var i = 0; i < n; i++) s += f(x + i * step);
                  return s * step;
                },
                tanEA: function(f, a, b, n) {
                  var s = 0, step = (b - a) / n;
                  var x = a + step / 2;
                  for(var i = 0; i < n; i++) {
                    s += f(x);
                    x = PL.math.__eadd([x, step], 2);
                  }
                  return s * step;
                },
                // median of trap and tan(M:EA) method
                // you can get the maximal error
                PonceletM: function(f, a, b, n, withMaxError) {
                  withMaxError || (withMaxError = false);
                  var trap = this.trap(f, a, b, n), tan = this.tanM(f, a, b, n);
                  var result = (trap+tan)/2;
                  if(!withMaxError) return result;
                  return {value: result, maxErr: Math.abs(trap-tan)/2};
                },
                PonceletEA: function(f, a, b, n, withMaxError) {
                  withMaxError || (withMaxError = false);
                  var trap = this.trap(f, a, b, n), tan = this.tanEA(f, a, b, n);
                  var result = (trap+tan)/2;
                  if(!withMaxError) return result;
                  return {value: result, maxErr: Math.abs(trap-tan)/2};
                },
                // n must be a multiple of 6 otherwise n will be rounded to be a multiple of 6
                Weddle: function(f, a, b, n) {
                  var r = n % 6;
                  if(r !== 0) n = Math.ceil(n / 6) * 6;
                  var step = (b-a) / n;
                  var s = 0;
                  for(var i = 1; i <= n-5; i += 6) {
                    var x = a + i * step;
                    s += 5*f(x)+f(x+step)+6*f(x+2*step)+f(x+3*step)+5*f(x+4*step)+2*f(x+5*step);
                  }
                  s += f(a) - f(b);
                  return s * step * 3 / 10;
                },
                // function must be positive on interval [a, b] integrated of f(a) != f(b)
                // for example
                // with f = 1/x, [a = 1, b = 2] we can calculate ln2 (log neperian of 2)
                // with computer random see math#alog
                random: function(f, a, b, nmax) {
                  if(nmax <= 0) return;
                  var c = 0, n = 0, ya = f(a), yb = f(b);
                  var m = Math.max(yb, ya);
                  var d = b - a, s = m * d;
                  while (n++ !== nmax) {
                    var y = f(a + d * Math.random()),
                        yr = m * Math.random();
                    if (yr < y) c++;
                  }
                  return s*c/n;
                }
                //pipnet.module.polyfill.math.function.integral.A.PonceletM(f, 0, 3, 90)
              }
            }
          },
          vector: {
            position: function(x1, x2, y1, y2) {
              return [x2 - x1, y2 - y1];
            }
          },
          // shortcuts cause max and min are in standard
          max: function() {
            return this.stats.max.apply(this.stats, arguments);
          },
          min: function() {
            return this.stats.min.apply(this.stats, arguments);
          },
          stats: {
            max: function() { // frequency and count can be ignored for max and min but not for q3 and q1
              return this.$extrenum(false, arguments, function(value) { return Number(value); });
            },
            // non number numeric value are not converted to number
            _max: function() {
              return this.$extrenum(false, arguments, function(value) { return value; });
            },
            min: function() {
              return this.$extrenum(true, arguments, function(value) { return Number(value); });
            },
            // non number numeric value are not converted to number
            _min: function() {
              return this.$extrenum(true, arguments, function(value) { return value; });
            },
            $extrenum: function(isMin, args, callback) {
              var l = args.length;
              if(l === 0) return isMin ? Infinity : -Infinity; // callback is ignored to avoid Number(Infinity) that is useless..

              var extrem = args[0];
              for(var i = 1; i < l; i++) {
                var x = args[i];
                if(isMin ? (x < extrem) : (x > extrem)) extrem = x;
              }
              return callback(extrem);
            },
            // return value is an array: [min, max] where min is Infinity and max is -Infinity when arguments are empty
            extrenum: function() {
              return this.$$extrenum(function(min, max) {
                return [Number(min), Number(max)]; // < and > operator work with numeric value so we only need to convert the result and not in loop
              }, arguments);
            },
            _extrenum: function() {
              return this.$$extrenum(function(min, max) {
                return [min, max];
              }, arguments);
            },
            $$extrenum: function(callback, args) {
              var l = args.length;
              if(l === 0) return [Infinity, -Infinity];

              var min = args[0], max = min;
              for(var i = 1; i < l; i++) {
                var x = args[i];
                if(x < min) min = x;
                if(x > max) max = x;
              }

              return callback(min, max);
            },
            // return -Infinity when arguments are empty
            et: function() { // etendu
              var ex = this.extrenum.apply(this, arguments);
              return ex[1] - ex[0];
            },
            _et: function() {
              var ex = this._extrenum.apply(this, arguments);
              return ex[1] - ex[0];
            },
            // if there are a lot of same value use emoy with {x1: count of x1, x2: count of x2...}
            moy: function() { // value
              var len = arguments.length;
              if(len === 0) return NaN;

              var l = len, total = 0;
              while(len-- !== 0) {
                var x = Number(arguments[len]);
                if(isNaN(x)) continue;
                total += x;
              }
              return total/l;
            },
            // accept only numbers otherwise return NaN
            _moy: function() {
              var len = arguments.length;
              if(len === 0) return NaN;

              var l = len, total = 0;
              while(len-- !== 0) {
                var x = arguments[len];
                if(isNaN(x) || typeof x !== 'number') return NaN;
                total += x;
              }
              return total/l;
            },
            // key value pair object: key = value, value = number of times of key in list
            // NaN count or value are ignored
            emoy: function(kvp) { // count-value
              var total = 0, len = 0;
              PL.object.iterate(kvp, function(value) {
                var nb = Number(kvp[value]);
                if(isNaN(Number(value)) || isNaN(nb) || nb < 0) return; // continue;
                len += nb;
                total += nb * value;
              });
              if(len === 0) return NaN;
              return total/len;
            },
            // throw error for zero division if length is zero and not NaN
            // accept only numeric value ([x], 'x', x) otherwise return NaN
            _emoy: function(kvp) {
              var total = 0, len = 0;
              var iterator = PL.object.iterate(kvp, function(value) {
                var nb = kvp[value];
                if(nb < 0) return NaN;
                len += nb;
                total += nb * value;
              });
              if(iterator !== undefined) return NaN;
              return total/len;
            },
            // key value pair object: key = value, value = frequency in list
            // NaN frequency or value are ignored
            fmoy: function(kvp) { // frequency-value
              var moy = 0, len = 0;
              PL.object.iterate(kvp, function(value) {
                var frequency = Number(kvp[value]);
                if(isNaN(Number(value)) || isNaN(frequency)) return; // continue;

                this.__mod(function(normalized) { // normalize invalid frequency
                  frequency = normalized;
                }, frequency, 1, 0, 1);

                moy += frequency * value;
              }, PL.math);
              if(len === 0) return NaN;
              return moy;
            },
            // accept only numeric value ([x], 'x', x) otherwise return NaN
            // frequency are between [0, 1] here otherwise NaN
            _fmoy: function(kvp) {
              var moy = 0;
              var iterator = PL.object.iterate(kvp, function(value) {
                var frequency = kvp[value];
                if(frequency < 0 || frequency > 1) return NaN;

                moy += frequency * value;
                //len += frequency * 10; // = (x << 3) + (x << 1)
              });
              if(iterator !== undefined) return NaN; // isNaN(undefined) return true
              //if(len === 0) return NaN;
              return moy;
            },
            med: function() {
              var len = arguments.length;
              if(len === 0) return NaN;
              return this.__med(Array.prototype.sort.apply(arguments), len);
            },
            _med: function() {
              var len = arguments.length;
              if(len === 0) return NaN;
              return this.__med(arguments, len);
            },
            __med: function(args, len) {
              var k1 = PL.math._floor(len / 2);
              if(len % 2 === 1) return args[k1];
              return (args[k1-1] + args[k1])/2; // k = k1-1
            },
            // key value pair object: key = value, value = number of times of key in list
            emed: function(kvp) { // count-value
              var array = [], len = 0;
              PL.object.iterate(kvp, function(value) {
                var nb = Number(kvp[value]), value = Number(value);
                if(isNaN(nb) || isNaN(value) || nb <= 0) return;
                len += nb;
                while(nb-- !== 0) array[len-1 - nb] = value;
              });
              if(len === 0) return NaN;
              return this.__med(array.sort(), len);
            },
            // accept only numeric value ([x], 'x', x) >= 0 otherwise return NaN
            _emed: function(kvp) {
              var array = [], len = 0;
              var iterator = PL.object.iterate(kvp, function(value) {
                var nb = Number(kvp[value]), value = Number(value);
                if(nb === 0) return;
                if(isNaN(nb) || isNaN(value) || nb < 0) return NaN;
                len += nb;
                while(nb-- !== 0) array[len-1 - nb] = value;
              });
              if(len === 0 || iterator !== undefined) return NaN;
              return this.__med(array.sort(), len);
            },
            fmed: function(kvp) { // frequency-value
              var len = PL.object.size(kvp);
              if(len === 0) return NaN;
              var array = Array(len);

              PL.object.iterate(kvp, function(value) {
                var frequency = Number(kvp[value]), value = Number(value);
                if(isNaN(frequency) || isNaN(value)) return;

                this.__mod(function(normalized) { // normalize invalid frequency
                  frequency = normalized;
                }, frequency, 1, 0, 1);

                var nb = frequency * len;
                while(nb-- !== 0) array[len-1 - nb] = value;
              }, PL.math);
              return this.__med(array.sort(), len);
            },
            q1: function() {
              var len = arguments.length;
              if(len === 0) return NaN;
              return this.__q1(Array.prototype.sort.apply(arguments), len);
            },
            // arguments are already sorted here
            _q1: function() {
              var len = arguments.length;
              if(len === 0) return NaN;
              return this.__q1(arguments, len);
            },
            // index are already calculed and arguments are sorted
            __q1: function(args, len) {
              return args[PL.math._floor(len * .25)];
            },
            q3: function() {
              var len = arguments.length;
              if(len === 0) return NaN;
              return this.__q3(Array.prototype.sort.apply(arguments), len);
            },
            _q3: function() {
              var len = arguments.length;
              if(len === 0) return NaN;
              return this.__q3(arguments, len);
            },
            __q3: function(args, len) {
              return args[PL.math._floor(len * .75)];
            },
            eciq: function() {
              return this.q3.apply(this, arguments) - this.q1.apply(this, arguments);
            },
            _eciq: function() {
              return this._q3.apply(this, arguments) - this._q1.apply(this, arguments);
            },
            va: function() { // variance
              var len = arguments.length;
              if(len === 0) return NaN;

              var l = len, vtotal = 0, mtotal = 0;
              while(len-- !== 0) {
                var x = Number(arguments[len]);
                if(isNaN(x)) continue;
                vtotal += Math.pow(x, 2);
                mtotal += x;
              }
              return (vtotal/l)-Math.pow(mtotal/l, 2);
            },
            // accept only numeric value ([x], 'x', x) otherwise return NaN
            _va: function() {
              var len = arguments.length;
              if(len === 0) return NaN;

              var l = len, vtotal = 0, mtotal;
              while(len-- !== 0) {
                var x = arguments[len];
                if(isNaN(x) || typeof x !== 'number') return NaN;
                vtotal += Math.pow(x, 2);
                mtotal += x;
              }
              return (vtotal/l)-Math.pow(mtotal/l, 2);
            },
            eva: function(kvp) { // count-value
              var vtotal = 0, mtotal = 0, len = 0;
              PL.object.iterate(kvp, function(value) {
                var nb = Number(kvp[value]);
                if(isNaN(Number(value)) || isNaN(nb)) return; // continue;
                len += nb;
                vtotal += nb * Math.pow(value, 2);
                mtotal += nb * value;
              });
              if(len === 0) return NaN;
              return (vtotal/len)-Math.pow(mtotal/len, 2);
            },
            // accept only numeric value ([x], 'x', x) otherwise return NaN
            _eva: function(kvp) {
              var vtotal = 0, mtotal = 0, len = 0;
              PL.object.iterate(kvp, function(value) {
                var nb = kvp[value];
                len += nb;
                vtotal += nb * Math.pow(value, 2);
                mtotal += nb * value;
              });
              if(len === 0) return NaN;
              return (vtotal/len)-Math.pow(mtotal/len, 2);
            },
            // invalid frequency are normalized
            fva: function(kvp) { // frequency-value
              var vtotal = 0, mtotal = 0;
              PL.object.iterate(kvp, function(value) {
                var frequency = Number(kvp[value]);
                if(isNaN(Number(value)) || isNaN(frequency)) return; // continue;
                
                this.__mod(function(normalized) { // normalize invalid frequency
                  frequency = normalized;
                }, frequency, 1, 0, 1);

                vtotal += frequency * Math.pow(value, 2);
                mtotal += frequency * value;
              }, PL.math);
              return vtotal-Math.pow(mtotal, 2);
            },
            // accept only numeric value ([x], 'x', x) otherwise return NaN
            // invalid frequency return also NaN
            _fva: function(kvp) {
              var mtotal = 0, vtotal = 0;
              PL.object.iterate(kvp, function(value) {
                var frequency = kvp[value];
                if(frequency < 0 || frequency > 1) return NaN;

                vtotal += frequency * Math.pow(value, 2);
                mtotal += frequency * value;
              });
              return vtotal-Math.pow(mtotal, 2);
            },
            ec: function() { // ecart-type
              return Math.sqrt(this.va.apply(this, arguments));
            },
            // accept only numeric value ([x], 'x', x) otherwise return NaN
            _ec: function() {
              return Math.sqrt(this._va.apply(this, arguments));
            },
            eec: function() {
              return Math.sqrt(this.eva.apply(this, arguments));
            },
            // accept only numeric value ([x], 'x', x) otherwise return NaN
            _eec: function() {
              return Math.sqrt(this._eva.apply(this, arguments));
            },
            fec: function() {
              return Math.sqrt(this.fva.apply(this, arguments));
            },
            // accept only numeric value ([x], 'x', x) otherwise return NaN
            _fec: function() {
              return Math.sqrt(this._fva.apply(this, arguments));
            }
          },
          inRange: function(x, min, max, threshold) {
            x = Number(x), min = Number(min), max = Number(max);
            return this._inRange(x, min, max, threshold);
          },
          _inRange: function(x, min, max, threshold) {
            threshold |= 0;
            return x + threshold >= min && x - threshold <= max;
          },
          isNear: function(x, target, threshold) {
            x = Number(x), target = Number(target);
            if(isNaN(x) || isNaN(target)) return false;
            if(threshold === undefined) {
              if(Number.isInteger(target)) threshold = 1;
              else threshold = target - this.trunc(target);
            }
            return this._isNear(x, target, threshold);
          },
          _isNear: function(x, target, threshold) {
            return this._abs(x - target) <= threshold;
          },
          clamp: function(x, min, max) {
            x = Number(x), min = Number(min), max = Number(max);
            if(isNaN(x)) return NaN;
            return this._clamp(x, min, max);
          },
          _clamp: function(x, min, max) { // inverse of loop
            return x < min ? min : (x > max ? max : x);
          },
          loop: function(x, min, max) {
            x = Number(x), min = Number(min), max = Number(max);
            if(isNaN(x)) return NaN;
            return this._loop(x, min, max);
          },
          _loop: function(x, min, max) { // inverse of clamp
            return x < min ? max : (x > max ? min : x);
          },
          // these function is used by emultiple and edivide
          // the context is that you have a number that you need to normalize
          // if decimal return toInteger otherwise x*e where e is the maxE
          // of all your numbers (e = number of decimal digit)
          powNorm: function(x, e) {
            return PL.number.isInteger(x) ? (x*e) : PL.number.___toInteger(x);
          },
          _powNorm: function(x, e) {
            return PL.number._isInteger(x) ? (x*e) : PL.number.___toInteger(x);
          },
          __powNorm: function(x, e) {
            return PL.number.__isInteger(x) ? (x*e) : PL.number.___toInteger(x);
          },
          multiple10: function(exponent1, exponent2) {
            return Number("1e"+(exponent1 + exponent2));
          },
          pow10: function(exponent) {
            return Number("1e"+exponent);
          },
          // fix stange result for bigInteger like Math.pow(10, 45)
          // native result : 1.0000000000000001e+45
          // result: 1e+45
          // by default native is false cause there are a native issue of precision with for exemple Math.pow(5e-2, -4) that return 159999.9... (native = true) instead of 160000 (native = false)
          pow: function(x, exponent, native) {
            x = Number(x), exponent = Number(exponent);
            if(isNaN(exponent)) return NaN;
            if(x === 1 || exponent === 0) return 1;
            if(exponent === 1) return x;
            if(x === 10) return this.pow10(exponent); // delegate to e(+/-)x

            var i = 2, o = x;
            if(exponent < 0) {
              exponent = -exponent;
              i = 0;
              for( ; i <= exponent; i++) x/= o;
            } else {
              for( ; i <= exponent; i++) x*= o;
            }
            
            return x;
          },
          pow2: function(x, exponent) {
            x = Number(x), exponent = Number(exponent);
            if(isNaN(exponent)) return NaN;
            if(x === 1 || exponent === 0) return 1;
            if(exponent === 1) return x;
            if(x === 10) return this.pow10(exponent);

            var i = 2, o = x;
            if(exponent < 0) {
              exponent =-exponent;
              i = 0;
              o = 1/o;
            }
            for( ; i <= exponent; i++) x*= o;
            
            return x;
          },
          pow3: function(x, exponent) {
            x = Number(x), exponent = Number(exponent);
            if(isNaN(exponent)) return NaN;
            if(x === 1 || exponent === 0) return 1;
            if(exponent === 1) return x;
            if(x === 10) return this.pow10(exponent);

            var i = 2, o = x;
            if(exponent < 0) {
              exponent = -exponent;
              i = 0;
              o = 1/o;
            }
            for( ; i <= exponent; i++) x*=o;
            
            return x;
          },
          //info
          /*
          fast math.pow but return only a rounded integer
          so you can only use it with integers and without negative exponent
          otherwise use classic Math.pow.
          you can check entries with Number.isInteger */
          pow32: function(x, exponent) {
            x = Number(x), exponent = Number(exponent);
            if(isNaN(exponent)) return NaN;
            if(x === 1 || exponent === 0) return 1;
            if(exponent === 1) return x;
            if(x === 10) return this.pow10(exponent);

            return x<<(exponent/2);
            //return exponent < 0 ? x>>(Math.abs(exponent)-1) : x<<(exponent-1);
          },
          pow322: function(x, exponent) {
            x = Number(x), exponent = Number(exponent);
            if(isNaN(exponent)) return NaN;
            if(x === 1 || exponent === 0) return 1;
            if(exponent === 1) return x;
            if(x === 10) return this.pow10(exponent);

            if(exponent < 0) {
              while(++exponent <= 0) x>>=1;
            } else {
              exponent = (x / 2) * (exponent / 2);
              while(--exponent >= 0) x<<=1;
            }

            return x;
          }
        },
        // when binary representation isn't declared in name of method it's for 64-bit binary representation
        bit: {
          O32: 1 << 31, // overflow for 32 bit
          bigint: {
            LONG_MASK: 0xffffffffn,
            toLong: function(x) {
              var result = 0n;
      
              for (var i = 1; i >= 0; i--)
                result = (result << 32n) + (x & this.LONG_MASK);

              return result;
            }
          },
          // for bigint like bit operator has range of value use long#method with Number(x) in parameter 
          // if you have a readable code or you use only long use shortcut bit#method instead of bit.long#method
          // if you have a litte number use the adapted type with the valid range to avoid useless calcul
          long: { // 64-bit
            highestOneBit: function(i) {
              i |= (i >>  1);
              i |= (i >>  2);
              i |= (i >>  4);
              i |= (i >>  8);
              i |= (i >> 16);
              i |= (i >> 32);
              return i - (i >>> 1);
            },
            numberOfLeadingZeros: function(i) {
              if (i === 0) return 64;
              var n = 1;
              var x = (i >>> 32)|0;
              if (x === 0)        n += 32, x   = i|0;
              if (x >>> 16 === 0) n += 16, x <<= 16;
              if (x >>> 24 === 0) n +=  8, x <<=  8;
              if (x >>> 28 === 0) n +=  4, x <<=  4;
              if (x >>> 30 === 0) n +=  2, x <<=  2;
              n -= x >>> 31;
              return n;
            },
            numberOfTrailingZeros: function(i) {
              var x, y;
              if (i === 0) return 64;
              var n = 63;
              y = i|0;    if (y !== 0) n = n -32, x = y; else x = (i>>>32)|0;
              y = x <<16; if (y !== 0) n = n -16, x = y;
              y = x << 8; if (y !== 0) n = n - 8, x = y;
              y = x << 4; if (y !== 0) n = n - 4, x = y;
              y = x << 2; if (y !== 0) n = n - 2, x = y;
              return n - ((x << 1) >>> 31);
            }
          },
          // warning use it only with integer no floating decimal if you want to ignore floating
          // decimal and your number is in int range you can use x|0
          // for other type than int this conversion is automatically call
          int: { // 32-bit
            highestOneBit: function(i) {
              i |= (i >>  1);
              i |= (i >>  2);
              i |= (i >>  4);
              i |= (i >>  8);
              i |= (i >> 16);
              return i - (i >>> 1);
            },
            numberOfLeadingZeros: function(i) {
              if (i === 0) return 32;
              var n = 1;
              if (i >>> 16 === 0) n += 16, i <<= 16;
              if (i >>> 24 === 0) n +=  8, i <<=  8;
              if (i >>> 28 === 0) n +=  4, i <<=  4;
              if (i >>> 30 === 0) n +=  2, i <<=  2;
              n -= i >>> 31;
              return n;
            },
            numberOfTrailingZeros: function(i) {
              var y;
              if (i === 0) return 32;
              var n = 31;
              y = i <<16; if (y !== 0) n = n -16, i = y;
              y = i << 8; if (y !== 0) n = n - 8, i = y;
              y = i << 4; if (y !== 0) n = n - 4, i = y;
              y = i << 2; if (y !== 0) n = n - 2, i = y;
              return n - ((i << 1) >>> 31);
            },
            from: function(x) {
              return x % 0x100000000;
            },
            bfrom: function(x) {
              return x % 0x100000000n;
            }
          },
          short: { // 16-bit
            highestOneBit: function(i) {
              i |= (i >>  1);
              i |= (i >>  2);
              i |= (i >>  4);
              i |= (i >>  8);
              return i - (i >>> 1);
            },
            numberOfLeadingZeros: function(i) {
              if (i === 0) return 16;
              var n = 1;
              var x = (i >>> 8)|0;
              if (x >>> 24 === 0) n +=  8, x <<=  8;
              if (x >>> 28 === 0) n +=  4, x <<=  4;
              if (x >>> 30 === 0) n +=  2, x <<=  2;
              n -= x >>> 31;
              return n;
            },
            numberOfTrailingZeros: function(i) {
              var x, y;
              if (i === 0) return 16;
              var n = 15;
              y = x << 8; if (y !== 0) n = n - 8, x = y; else x = (i>>>8)|0;
              y = x << 4; if (y !== 0) n = n - 4, x = y;
              y = x << 2; if (y !== 0) n = n - 2, x = y;
              return n - ((x << 1) >>> 31);
            },
            from: function(x) { // used for example with charCode and codePoint
              return x % 65536; // string.char.MIN_SUPPLEMENTARY_CODE_POINT
            },
            bfrom: function(x) {
              return x % 65536n;
            }
          },
          byte: { // 8-bit
            highestOneBit: function(i) {
              i |= (i >>  1);
              i |= (i >>  2);
              i |= (i >>  4);
              return i - (i >>> 1);
            },
            numberOfLeadingZeros: function(i) {
              if (i === 0) return 8;
              var n = 1;
              var x = (i >>> 4)|0;
              if (x >>> 28 === 0) n += 4, x <<= 4;
              if (x >>> 30 === 0) n += 2, x <<= 2;
              n -= x >>> 31;
              return n;
            },
            numberOfTrailingZeros: function(i) {
              var x, y;
              if (i === 0) return 8;
              var n = 7;
              y = x << 4; if (y !== 0) n = n - 4, x = y; else x = (i>>>4)|0;
              y = x << 2; if (y !== 0) n = n - 2, x = y;
              return n - ((x << 1) >>> 31);
            },
            from: function(x) {
              return x % 256;
            },
            bfrom: function(x) {
              return x % 256n;
            }
          },
          // faster than Math.trunc but have two boundaries:
          // accept value between:
          //  [-2147483648, 2147483647]
          // defined by bit operation:
          //  [1 << 31, -(1 << 31)-1]
          // these limit is due to 32-bit binary representation
          // but are also present for 64-bit binary representation
          // to normalize the OR operator and avoid unexcepted value on 64-bit
          // for bigger value use Math.trunc
          // these method are really simple
          // and when invalid value is passed return value is 0
          // you can check invalid value with trunc(x) === 0 && x !== 0 (zero is a valid value) see below:
          trunc: function(x) {
            //if((x|0) === 0 && x !== 0) return NaN;
            return x|0; // can be replaced by ~~x or x^0 but have the same limitation
          },
          // see #trunc
          floor: function(x) {
            return this._floor(x, this.trunc(x));
          },
          // use private method when you use _floor and _ceil on the same value
          // this ise used by round method to avoid redundant trunc call
          _floor: function(x, trunc) {
            if(x < 0) {
              if(trunc === x) return x; // integer
              trunc--;
            }
            return trunc;
          },
          // see #trunc
          ceil: function(x) {
            return this._ceil(x, this.trunc(x));
          },
          _ceil: function(x, trunc) {
            if(x > 0) {
              if(trunc === x) return x;
              trunc++;
            }
            return trunc;
          },
          // see #trunc
          round: function(x) {
            var trunc = this.trunc(x);
            var up = this._ceil(x, trunc), down = this._floor(x, trunc);
            return (up - x) > (x - down) ? down : up;
          },
          // the overflow is after (2^32)-1 [-2*(1<<31)-1]
          // this method doesn't work for signed zero (-0) and return true not false
          // see comment below to know how support -0
          isPositive: function(x) {
            // if(PL.number.isS0(x)) return false;
            return x >>> 0 === x;
          },
          highestOneBit: function(i) {
            return this.long.highestOneBit(i);
          },
          lowestOnebit: function(i) { // valid for all number
            return i & -i;
          },
          numberOfLeadingZeros: function(i) { // number of leading zeros in the 64-bit binary representation
            return this.long.numberOfLeadingZeros(i);
          },
          // see: Math.clz32 in standard
          clz64: function(i) { // number of leading zeros in the 64-bit binary representation
            return this.long.numberOfLeadingZeros(i);
          },
          clz32: function(i) { // number of leading zeros in the 32-bit binary representation
            return this.int.numberOfLeadingZeros(i);
          },
          numberOfTrailingZeros: function(i) {
            return this.long.numberOfTrailingZeros(i);
          },
          ctz64: function(i) { // number of trailing zeros in the 64-bit binary representation
            return this.long.numberOfTrailingZeros(i);
          },
          ctz32: function(i) { // number of trailing zeros in the 64-bit binary representation
            return this.int.numberOfTrailingZeros(i);
          },
          // see: Math.imul in standard
          // don't use this method if you know that x and y isn't NaN and is a good integer instead use directly bit operator >>> 32
          imul: function(x, y) { // multiplication in 32-bit binary representation
            x = Number(x), y = Number(y);
            if(isNaN(x) || isNaN(y)) return 0;
            return (x * y) >>> 32;
          },
          // warning for loss method:
          // when your value is masked by bit operator & these masks are represented inside a bigInt (cause greater than Number.MAX_SAFE_VALUE or MIN) but if you need an approximation you can use these methods
          // if you use it on static value check lossCount and count if it's the same value use lossCount to improve speed between conversions
          // it's recommended to not use loss method on small unsigned (bigger of zero) number (smaller of 1024)
          lossCount: function(i) {
            i -= ((i >>> 1) & 0x5555555555555555);
            i =  (i & 0x3333333333333333) + ((i >>> 2) & 0x3333333333333333);
            i =  (i + (i >>> 4)) & 0x0f0f0f0f0f0f0f0f;
            i += (i >>> 8);
            i += (i >>> 16);
            i += (i >>> 32);
            return (i|0) & 0x7f;
          },
          // - comment show that due to bigInt >>> has been replaced to >>
          count: function(i) { // -
            i = BigInt(i);
            i -= ((i >> 1n) & 0x5555555555555555n);
            i =  (i & 0x3333333333333333n) + ((i >> 2n) & 0x3333333333333333n);
            i =  (i + (i >> 4n)) & 0x0f0f0f0f0f0f0f0fn;
            i +=  i >> 8n;
            i +=  i >> 16n;
            i +=  i >> 32n;
            return Number((i|0n) & 0x7fn);
          },
          rotateLeft: function(i, distance) {
            return (i << distance) | (i >>> -distance);
          },
          rotateRight: function(i, distance) {
            return (i >>> distance) | (i << -distance);
          },
          // see: doubleCount
          doubleReverse: function(i) {
            i = (i & 0x5555555555555555) << 1 | (i >>> 1) & 0x5555555555555555;
            i = (i & 0x3333333333333333) << 2 | (i >>> 2) & 0x3333333333333333;
            i = (i & 0x0f0f0f0f0f0f0f0f) << 4 | (i >>> 4) & 0x0f0f0f0f0f0f0f0f;
            i = (i & 0x00ff00ff00ff00ff) << 8 | (i >>> 8) & 0x00ff00ff00ff00ff;
            i = (i << 48) | ((i & 0xffff0000) << 16) |
                ((i >>> 16) & 0xffff0000) | (i >>> 48);
            return i;
          },
          reverse: function(i) {
            i = BigInt(Number(BigInt(i) & 0x5555555555555555n) << 1) | BigInt(i >>> 1) & 0x5555555555555555n;
            i = BigInt(Number(i & 0x3333333333333333n) << 2) | BigInt(Number(i) >>> 2) & 0x3333333333333333n;
            i = BigInt(Number(i & 0x0f0f0f0f0f0f0f0fn) << 4) | BigInt(Number(i) >>> 4) & 0x0f0f0f0f0f0f0f0fn;
            i = BigInt(Number(i & 0x00ff00ff00ff00ffn) << 8) | BigInt(Number(i) >>> 8) & 0x00ff00ff00ff00ffn;
            i = Number(i);
            i = (i << 48) | ((i & 0xffff0000) << 16) |
                ((i >>> 16) & 0xffff0000) | (i >>> 48);
            return i;
          },
          signum: function(i) { // maybe use a part of that for Math.sign
            return ((i >> 63) | (-i >>> 63))|0;
          },
          // see: doubleCount
          doubleReverseBytes: function(i) {
            i = (i & 0x00ff00ff00ff00ff) << 8 | (i >>> 8) & 0x00ff00ff00ff00ff;
            return (i << 48) | ((i & 0xffff0000) << 16) |
                ((i >>> 16) & 0xffff0000) | (i >>> 48);
          },
          reverseBytes: function(i) {
            i = BigInt(Number(BigInt(i) & 0x00ff00ff00ff00ffn) << 8) | BigInt(i >>> 8) & 0x00ff00ff00ff00ffn;
            i = Number(i);
            return (i << 48) | ((i & 0xffff0000) << 16) |
                ((i >>> 16) & 0xffff0000) | (i >>> 48);
          },
          reverseBytes3: function(i) {
            i = (BigInt(i) & 0x00ff00ff00ff00ffn) << 8n | BigInt(i >>> 8) & 0x00ff00ff00ff00ffn;
            console.log(i << 48n| ((i & 0xffff0000n) << 16n));
            return (i << 48n) | ((i & 0xffff0000n) << 16n) |
                (BigInt(Number(i) >>> 16) & 0xffff0000n) | BigInt(Number(i) >>> 48);
            // find a way to replace x >>> y to xn >>> yn without error with other operator (^&~|<<>>)
          },
          doubleFromBits: function(bits) {
            if(bits === 0x7ff0000000000000) return Infinity;
            if(bits === 0xfff0000000000000) return -Infinity;
            if((bits >= 0x7ff0000000000001 && bits <= 0x7fffffffffffffff) ||
                bits >= 0xfff0000000000001 && bits <= 0xffffffffffffffff) return NaN; 
            var s = ((bits >> 63) === 0) ? 1 : -1;
            var e = ((bits >> 52) & 0x7ff)|0;
            var m = (e === 0) ?
              (bits & 0xfffffffffffff) << 1 :
              (bits & 0xfffffffffffff) | 0x10000000000000;
            return s * m * Math.pow(2, e-1075);
          },
          doubleFromBits2: function(bits) {
            bits = BigInt(bits);
            if(bits === 0x7ff0000000000000n) return Infinity;
            if(bits === 0xfff0000000000000n) return -Infinity;
            if((bits >= 0x7ff0000000000001n && bits <= 0x7fffffffffffffffn) ||
                bits >= 0xfff0000000000001n && bits <= 0xffffffffffffffffn) return NaN; // invalid range
            var s = ((bits >> 63n) === 0n) ? 1n : -1n;
            var e = ((bits >> 52n) & 0x7ffn)|0n;
            var m = (e === 0n) ?
              (bits & 0xfffffffffffffn) << 1n :
              (bits & 0xfffffffffffffn) | 0x10000000000000n;
            console.log(e);
            return s * m * BigInt(Math.pow(2, Number(e)-1075));
          },
          bitsFromDouble: function(d) {
            if(isNaN(d)) return 0x7ff8000000000000n;
            if(d === Infinity) return 0x7ff0000000000000n;
            if(d === -Infinity) return 0xfff0000000000000n;
          }
        },
        /*
        codePoint, surrogates and other complex stuff was translated from Java to Javascript
        Changes between the languages
          From Java:
            (int) char transform char into char code but not in Javascript that would be Number(string) #charCodeAt
            (char) int transform int into char but not in  Javascript that would be String(number) #String::fromCharCode
            [x] to charAt(x)
            operation like 'char' < 'char' was translated to (char code) < (char code) that java do internally
          Do not execute debug method that iterate over all character that exist in unicode (65536)
          if can't support a lot of calcul otherwise open your tasks manager and kill the browser
          When the documentation is inside [x] that would be original text but didn't occur in Javascript*
          eg: [@exception xxxx] => this exception return undefined in Javascript*
          * that mean for W3C
        */
        string: {
          char: {
            /* The character properties are currently encoded into 32 bits in the following manner:
              1 bit   mirrored property
              4 bits  directionality property
              9 bits  signed offset used for converting case
              1 bit   if 1, adding the signed offset converts the character to lowercase
              1 bit   if 1, subtracting the signed offset converts the character to uppercase
              1 bit   if 1, this character has a titlecase equivalent (possibly itself)
              3 bits  0  may not be part of an identifier
                      1  ignorable control; may continue a Unicode identifier or Java identifier
                      2  may continue a Java identifier but not a Unicode identifier (unused)
                      3  may continue a Unicode identifier or Java identifier
                      4  is a Java whitespace character
                      5  may start or continue a Java identifier;
                        may continue but not start a Unicode identifier (underscores)
                      6  may start or continue a Java identifier but not a Unicode identifier ($)
                      7  may start or continue a Unicode identifier or Java identifier
                      Thus:
                        5, 6, 7 may start a Java identifier
                        1, 2, 3, 5, 6, 7 may continue a Java identifier
                        7 may start a Unicode identifier
                        1, 3, 5, 7 may continue a Unicode identifier
                        1 is ignorable within an identifier
                        4 is Java whitespace
              2 bits  0  this character has no numeric property
                      1  adding the digit offset to the character code and then
                        masking with 0x1F will produce the desired numeric value
                      2  this character has a "strange" numeric value
                      3  a Java supradecimal digit: adding the digit offset to the
                        character code, then masking with 0x1F, then adding 10
                        will produce the desired numeric value
              5 bits  digit offset
              5 bits  character type

              The encoding of character properties is subject to change at any time.
            */
            __DATA: {
              "Latin1": {
                getProperties: function(ch) {
                  var offset = String.fromCharCode(ch);
                  var props = A[offset];
                  return props;
                },
                getPropertiesEx: function(ch) {
                  var offset = String.fromCharCode(ch);
                  var props = B[offset];
                  return props;
                },
                isOtherLowercase: function(ch) {
                  var props = this.getPropertiesEx(ch);
                  return (props & 0x0001) !== 0;
                },
                isOtherUppercase: function(ch) {
                  var props = this.getPropertiesEx(ch);
                  return (props & 0x0002) !== 0;
                },
                isOtherAlphabetic: function(ch) {
                  var props = this.getPropertiesEx(ch);
                  return (props & 0x0004) !== 0;
                },
                isIdeographic: function(ch) {
                  var props = this.getPropertiesEx(ch);
                  return (props & 0x0010) !== 0;
                },
                getType: function(ch) {
                  var props = this.getProperties(ch);
                  return (props & 0x1F);
                },
                isJavaIdentifierStart: function(ch) {
                  var props = this.getProperties(ch);
                  return ((props & 0x00007000) >= 0x00005000);
                },
                isJavaIdentifierPart: function(ch) {
                  var props = this.getProperties(ch);
                  return ((props & 0x00003000) !== 0);
                },
                isUnicodeIdentifierStart: function(ch) {
                  var props = this.getProperties(ch);
                  return ((props & 0x00007000) === 0x00007000);
                },
                isUnicodeIdentifierPart: function(ch) {
                  var props = this.getProperties(ch);
                  return ((props & 0x00001000) !== 0);
                },
                isIdentifierIgnorable: function(ch) {
                  var props = this.getProperties(ch);
                  return ((props & 0x00007000) === 0x00001000);
                },
                toLowerCase: function(ch) {
                  var mapChar = ch;
                  var val = this.getProperties(ch);
          
                  if (((val & 0x00020000) !== 0) && 
                      ((val & 0x07FC0000) !== 0x07FC0000)) { 
                    var offset = val << 5 >> (5+18);
                    mapChar = ch + offset;
                  }
                  return mapChar;
                },
                toUpperCase: function(ch) {
                  var mapChar = ch;
                  var val = this.getProperties(ch);
          
                  if ((val & 0x00010000) !== 0) {
                    if ((val & 0x07FC0000) !== 0x07FC0000) {
                      var offset = val << 5 >> (5+18);
                      mapChar =  ch - offset;
                    } else if (ch === 0x00B5) mapChar = 0x039C;
                  }
                  return mapChar;
                },
                toTitleCase: function(ch) {
                  return this.toUpperCase(ch);
                },
                digit: function(ch, radix) {
                  var value = -1;
                  if (radix >= Character.MIN_RADIX && radix <= Character.MAX_RADIX) {
                    var val = this.getProperties(ch);
                    var kind = val & 0x1F;
                    if (kind === Character.DECIMAL_DIGIT_NUMBER) value = ch + ((val & 0x3E0) >> 5) & 0x1F;
                    else if ((val & 0xC00) === 0x00000C00) {
                      // Java supradecimal digit
                      value = (ch + ((val & 0x3E0) >> 5) & 0x1F) + 10;
                    }
                  }
                  return (value < radix) ? value : -1;
                },
                getNumericValue: function(ch) {
                  var val = this.getProperties(ch);
                  var retval = -1;
          
                  switch (val & 0xC00) {
                    default: // cannot ochur
                    case 0x00000000: // not numeric
                      retval = -1;
                      break;
                    case 0x00000400: // simple numeric
                      retval = ch + ((val & 0x3E0) >> 5) & 0x1F;
                      break;
                    case 0x00000800: // "strange" numeric
                      retval = -2; 
                      break;
                    case 0x00000C00: // Java supradecimal
                      retval = (ch + ((val & 0x3E0) >> 5) & 0x1F) + 10;
                      break;
                  }
                  return retval;
                },
                isWhitespace: function(ch) {
                  var props = this.getProperties(ch);
                  return ((props & 0x00007000) === 0x00004000);
                },
                getDirectionality: function(ch) {
                  var val = this.getProperties(ch);
                  var directionality = (val & 0x78000000) >> 27;
                  if (directionality === 0xF) directionality = -1;
                  
                  return directionality;
                },
                isMirrored: function(ch) {
                  var props = this.getProperties(ch);
                  return ((props & 0x80000000) != 0);
                },
                toUpperCaseEx: function(ch) {
                  var mapChar = ch;
                  var val = this.getProperties(ch);
          
                  if ((val & 0x00010000) !== 0) {
                    if ((val & 0x07FC0000) !== 0x07FC0000) {
                      var offset = val  << 5 >> (5+18);
                      mapChar =  ch - offset;
                    }
                    else {
                      switch(ch) {
                        // map overflow characters
                        case 0x00B5 : mapChar = 0x039C; break;
                        default     : mapChar = Character.ERROR; break;
                      }
                    }
                  }
                  return mapChar;
                },
                sharpsMap: ['S', 'S'],
                toUpperCaseCharArray: function(ch) {
                  var upperMap = [String.fromCharCode(ch)];
                  if (ch === 0x00DF) upperMap = this.sharpsMap;
                  
                  return upperMap;
                },
                A: Array(256)/*,
                A_Data:
                "\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800"+
                "\u100F\u4800\u100F\u4800\u100F\u5800\u400F\u5000\u400F\u5800\u400F\u6000\u400F"+
                "\u5000\u400F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800"+
                "\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F"+
                "\u4800\u100F\u4800\u100F\u5000\u400F\u5000\u400F\u5000\u400F\u5800\u400F\u6000"+
                "\u400C\u6800\30\u6800\30\u2800\30\u2800\u601A\u2800\30\u6800\30\u6800"+
                "\30\uE800\25\uE800\26\u6800\30\u2000\31\u3800\30\u2000\24\u3800\30"+
                "\u3800\30\u1800\u3609\u1800\u3609\u1800\u3609\u1800\u3609\u1800\u3609\u1800"+
                "\u3609\u1800\u3609\u1800\u3609\u1800\u3609\u1800\u3609\u3800\30\u6800\30"+
                "\uE800\31\u6800\31\uE800\31\u6800\30\u6800\30\202\u7FE1\202\u7FE1\202"+
                "\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1"+
                "\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202"+
                "\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1\202\u7FE1"+
                "\202\u7FE1\uE800\25\u6800\30\uE800\26\u6800\33\u6800\u5017\u6800\33\201"+
                "\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2"+
                "\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201"+
                "\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2\201\u7FE2"+
                "\201\u7FE2\201\u7FE2\201\u7FE2\uE800\25\u6800\31\uE800\26\u6800\31\u4800"+
                "\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u5000\u100F"+
                "\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800"+
                "\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F"+
                "\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800"+
                "\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F\u4800\u100F"+
                "\u3800\14\u6800\30\u2800\u601A\u2800\u601A\u2800\u601A\u2800\u601A\u6800"+
                "\34\u6800\30\u6800\33\u6800\34\0\u7005\uE800\35\u6800\31\u4800\u1010"+
                "\u6800\34\u6800\33\u2800\34\u2800\31\u1800\u060B\u1800\u060B\u6800\33"+
                "\u07FD\u7002\u6800\30\u6800\30\u6800\33\u1800\u050B\0\u7005\uE800\36"+
                "\u6800\u080B\u6800\u080B\u6800\u080B\u6800\30\202\u7001\202\u7001\202\u7001"+
                "\202\u7001\202\u7001\202\u7001\202\u7001\202\u7001\202\u7001\202\u7001\202"+
                "\u7001\202\u7001\202\u7001\202\u7001\202\u7001\202\u7001\202\u7001\202\u7001"+
                "\202\u7001\202\u7001\202\u7001\202\u7001\202\u7001\u6800\31\202\u7001\202"+
                "\u7001\202\u7001\202\u7001\202\u7001\202\u7001\202\u7001\u07FD\u7002\201\u7002"+
                "\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201"+
                "\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002"+
                "\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\u6800"+
                "\31\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002\201\u7002"+
                "\u061D\u7002",
                B: (
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\1"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\1\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"+
                  "\0\0\0\0\0\0\0\0\0").split('')*/
              },
              "00": {
    
              },
              "01": {
    
              },
              "02": {
    
              },
              "0E": {
    
              },
              "PrivateUse": {
    
              },
              "Undefined": {
    
              },
              // Character <= 0xff (basic latin) is handled by internal fast-path
              // to avoid initializing large tables.
              // Note: performance of this "fast-path" code may be sub-optimal
              // in negative cases for some accessors due to complicated ranges.
              // Should revisit after optimization of table initialization.
              of: function(ch) {
                if (ch >>> 8 === 0) {     // fast-path
                  return this['Latin1'];
                } else {
                  switch(ch >>> 16) {  //plane 00-16
                    case 0: return this['00'];
                    case 1: return this['01'];
                    case 2: return this['02'];
                    case 14: return this['0E'];
                    case 15:   // Private Use
                    case 16:   // Private Use
                        return this['PrivateUse'];
                    default: return this['Undefined'];
                  }
                }
              }
            },
            debugChar: function(ch) {
              console.log("cases: " + (ch.toLowerCase() + " " + ch.toUpperCase()));
              console.log("specialCase: " + (ch.toLowerCase() <= ch.toUpperCase()));
              console.log("code: " + ch.charCodeAt(0));
              console.log("('low': up) code: '" + ch.toLowerCase().charCodeAt(0) + "': " + ch.toUpperCase().charCodeAt());
              console.log("diff = " + (ch.toLowerCase().charCodeAt(0) - ch.toUpperCase().charCodeAt(0)));
            },
            debugAllChars: function(length) {
              var o = {
                case: {
                  same: [], diffUp: [], diffLow: [], strange: [],
                },
                surrogate: {
                  pair: [], low: [], high: []
                }
              };
              length = length || this.MIN_SUPPLEMENTARY_CODE_POINT;
              for(var i = 0; i < length; i++) {
                var char = String.fromCharCode(i);
                if(char.charCodeAt(0) !== i) continue;
                
                var code = char.charCodeAt(0);
                var next = String.fromCharCode(i + 1);
                if(this.isSurrogatePair(code, next.charCodeAt(0))) o.surrogate.pair.push(char, next);
                if(this.isLowSurrogate(code)) o.surrogate.low.push(char);
                if(this.isHighSurrogate(code)) o.surrogate.high.push(char);
                
                var low = char.toLowerCase(), up = char.toUpperCase();
                if(low === up) {
                  o.case.same.push([code, low, up]);
                  continue;
                }
                if(low.length !== up.length) {
                  o.case.strange.push([low, up]);
                  continue;
                }
                o.case.diffUp[low.charCodeAt(0).toString()] = up.charCodeAt(0);
                o.case.diffLow[up.charCodeAt(0).toString()] = low.charCodeAt(0);
              }
              o.length = length;
              return o;
            },
            DECIMAL_DIGIT_NUMBER: 9,
            debugSurrogate: function() {
              var o = {low: [], high: []};
              for(var i = 0; i < 65536; i++) {
                var char = String.fromCodePoint(i);
                if(this.isHighSurrogate(char)) o.high.push(char);
                else if(this.isLowSurrogate(char)) o.low.push(char);
              }
              return o;
            },
            MIN_CODE_POINT: 0x000000,
            MAX_CODE_POINT: 0x10FFFF,
            isValidCodePoint: function(codePoint) {
              // Optimized form of:
              //     codePoint >= MIN_CODE_POINT && codePoint <= MAX_CODE_POINT
              var plane = codePoint >>> 16;
              return plane < ((this.MAX_CODE_POINT + 1) >>> 16);
            },
            MIN_VALUE: 0x000000, // '\u0000'
            MAX_VALUE: 0x00FFFF, // '\uFFFF'
            isBmpCodePoint: function(codePoint) {
              return codePoint >>> 16 === 0;
              // Optimized form of:
              //     codePoint >= MIN_VALUE && codePoint <= MAX_VALUE
              // We consistently use logical shift (>>>) to facilitate
              // additional runtime optimizations.
            },
            MIN_SUPPLEMENTARY_CODE_POINT: 0x010000,
            isSupplementaryCodePoint: function(codePoint) {
              return codePoint >= this.MIN_SUPPLEMENTARY_CODE_POINT
                  && codePoint < this.MAX_CODE_POINT + 1;
            },
            MIN_HIGH_SURROGATE: 0xD800, // '\uD800'
            MAX_HIGH_SURROGATE: 0xDBFF, // '\uDBFF'
            isHighSurrogate: function(ch) {
              return ch >= this.MIN_HIGH_SURROGATE && ch < (this.MAX_HIGH_SURROGATE + 1);
            },
            MIN_LOW_SURROGATE: 0xDC00, // '\uDC00'
            MAX_LOW_SURROGATE: 0xDFFF, // '\uDFFF'
            isLowSurrogate: function(ch) {
              return ch >= this.MIN_LOW_SURROGATE && ch < (this.MAX_LOW_SURROGATE + 1);
            },
            //MIN_SURROGATE: this.MIN_HIGH_SURROGATE,
            //MAX_SURROGATE: this.MAX_LOW_SURROGATE,
            isSurrogate: function(ch) {
              return ch >= this.MIN_SURROGATE && ch < (this.MAX_SURROGATE + 1);
            },
            isSurrogatePair: function(high, low) {
              return this.isHighSurrogate(high) && this.isLowSurrogate(low);
            },
            charCount: function(codePoint) {
              return codePoint >= this.MIN_SUPPLEMENTARY_CODE_POINT ? 2 : 1;
            },
            toCodePoint: function(high, low) {
              // Optimized form of:
              // return ((high - MIN_HIGH_SURROGATE) << 10)
              //         + (low - MIN_LOW_SURROGATE)
              //         + MIN_SUPPLEMENTARY_CODE_POINT;
              return ((high << 10) + low) + (this.MIN_SUPPLEMENTARY_CODE_POINT
                                          - (this.MIN_HIGH_SURROGATE << 10)
                                          - this.MIN_LOW_SURROGATE);
            },
            codePointAtImpl: function(str, index, limit) {
              var isString = typeof str === 'string';

              var c1 = isString ? str.charCodeAt(index) : str[index].charCodeAt(0);
              if (this.isHighSurrogate(c1) && ++index < limit) {
                var c2 = isString ? str.charCodeAt(index) : str[index].charCodeAt(0);
                if (this.isLowSurrogate(c2)) return this.toCodePoint(c1, c2);
              }
              return isNaN(c1) ? undefined : c1;
            },
            codePointAt: function(chs, index, limit) {
              index |= 0;

              var length = chs.length;
              limit = Number(limit);
              if(isNaN(limit)) limit = length;

              if (index >= limit || limit < 0 || limit > length) return undefined;
              return this.codePointAtImpl(chs, index, limit);
            },
            codePointBeforeImpl: function(str, index, start) {
              var isString = typeof str === 'string';

              var c2 = isString ? str.charCodeAt(--index) : str[--index].charCodeAt(0);
              if (this.isLowSurrogate(c2) && index > start) {
                var c1 = isString ? str.charCodeAt(--index) : str[--index].charCodeAt(0);
                if (this.isHighSurrogate(c1)) return this.toCodePoint(c1, c2);
              }
              return isNaN(c2) ? undefined : c2;
            },
            codePointBefore: function(chs, index, start) {
              index = index | 0;

              start = Number(start);
              if(isNaN(start)) start = 0;

              if (index <= start || start < 0 || start >= chs.length) return NaN;
              return this.codePointBeforeImpl(chs, index, start);
            },
            highSurrogate: function(codePoint) {
              return String.fromCharCode((codePoint >>> 10)
                + (this.MIN_HIGH_SURROGATE - (this.MIN_SUPPLEMENTARY_CODE_POINT >>> 10)));
            },
            lowSurrogate: function(codePoint) {
              return String.fromCharCode((codePoint & 0x3ff) + this.MIN_LOW_SURROGATE);
            },
            toSurrogates: function(codePoint, dst, index) {
              // We write elements "backwards" to guarantee all-or-nothing
              dst[index+1] = this.lowSurrogate(codePoint);
              dst[index] = this.highSurrogate(codePoint);
            },
            toChars: function(codePoint, dst, dstIndex) {
              var l = arguments.length;
              if(l === 0) return undefined;
              if (this.isBmpCodePoint(codePoint)) {
                if(l === 1) return [String.fromCharCode(codePoint)];
                dst[dstIndex] = String.fromCharCode(codePoint);
                return 1;
              } else if (this.isValidCodePoint(codePoint)) {
                if(l !== 1) {
                  this.toSurrogates(codePoint, dst, dstIndex);
                  return 2;
                } else {
                  var result = Array(2);
                  this.toSurrogates(codePoint, result, 0);
                  return result;
                }
              }
              return undefined;
            },
            codePointCountImpl: function(chs, offset, count) {
              var endIndex = offset + count;
              var n = count;
              for (var i = offset; i < endIndex; ) {
                if (this.isHighSurrogate(chs[i++]) && i < endIndex &&
                    this.isLowSurrogate(chs[i])) {
                  n--;
                  i++;
                }
              }
              return n;
            },
            codePointCount: function(chs, offset, count) {
              offset = offset | 0;
              if (count > chs.length - offset || offset < 0 || count < 0) return 0;
              return this.codePointCountImpl(chs, offset, count);
            },
            offsetByCodePointsImpl: function(chs, start, count, index, codePointOffset) {
              var x = index;
              var i;
              if (codePointOffset >= 0) {
                var limit = start + count;
                for (i = 0; x < limit && i < codePointOffset; i++) {
                  if (this.isHighSurrogate(chs[x++]) && x < limit &&
                      this.isLowSurrogate(chs[x])) {
                    sx++;
                  }
                }
                if (i < codePointOffset) return NaN;
              } else {
                for (i = codePointOffset; x > start && i < 0; i++) {
                  if (this.isLowSurrogate(chs[--x]) && x > start &&
                      this.isHighSurrogate(chs[x-1])) {
                    x--;
                  }
                }
                if (i < 0) return NaN;
              }
              return x;
            },
            offsetByCodePoints: function(chs, start, count, index, codePointOffset) {
              start = start | 0;
              index = index | 0;
              count = Number(count);
              codePointOffset = Number(codePointOffset);
              if (count > chs.length-start || start < 0 || count < 0
                  || index < start || index > start+count) return NaN;
              return offsetByCodePointsImpl(chs, start, count, index, codePointOffset);
            },
            isISOControl: function(codePoint) {
              var type = typeof codePoint;
              if(type !== 'number') {
                if(type === 'string') codePoint = codePoint.charCodeAt(0);
                else codePoint = Number(codePoint);
              }
              if(isNaN(codePoint)) return false;
                // Optimized form of:
                //     (codePoint >= 0x00 && codePoint <= 0x1F) ||
                //     (codePoint >= 0x7F && codePoint <= 0x9F);
              return codePoint <= 0x9F &&
                    (codePoint >= 0x7F || (codePoint >>> 5 === 0));
            },
            forDigit: function(digit, radix) {
              digit = Number(digit);
              radix = Number(radix);
              if(isNaN(radix)) radix = 10; // decimal
              if ((digit >= radix) || (digit < 0)) '\0';
              if ((radix < PL.string.char.MIN_RADIX) || (radix > PL.string.char.MAX_RADIX)) return '\0';
              
              if (digit < 10) return String.fromCharCode(48 + digit); // '0' => 48
              
              return String.fromCharCode(97 - 10 + digit); // 'a' => 97
            },
            reverseBytes: function(charCode) {
              charCode = Number(charCode);
              return String.fromCharCode(((charCode & 0xFF00) >> 8) | (charCode << 8));
            },
            toUnicode: function(charCode) {
              var hex = charCode.toString(16);
            }
          },
          uri: {
            encode: function(x) {

            }
          },
          __browser__proto__: String.prototype,
          // polyfill of String.trim
          trim: function(str, lchar, rchar) { // if you need a trim that work with lstring and rstring open a pull request
            /* slower way:
              //\s = ?[\s\uFEFF\xA0]
              if(lchar == null && rchar === undefined) return str.replace(/^\s+|\s+$/g, '');
              return str.replace(new RegExp("^[" + char + "]+|[" + char + "]+$", 'g'), '');
            */

           if(lchar == null) lchar = ' ';
           if(rchar === undefined) lchar = ' ';

            if(lchar === ' ' && rchar === ' ' && this.__browser__proto__.trim)
              return this.__browser__proto__.trim.call(str);

            lchar = String(lchar);
            rchar = String(rchar);
           
            var o = str.length, len = o;
            var st = 0;
            while (st < len && (str.charAt(st) === lchar)) st++;
            while (st < len && (str.charAt(len - 1) === rchar)) len--;

            return (st > 0 || len < o) ? str.substring(st, len) : str;
          },
          ltrim: function(str, char) {
            /* slower way:
              if(char === undefined) return str.replace(/^\s+/g, '');
              return str.replace(new RegExp("^[" + char + "]+", 'g'), '');
            */
            if(char === undefined) char = ' ';

            var protoTrim = this.__browser__proto__.trimStart || this.__browser__proto__.trimLeft;
            if(char === ' ' && protoTrim) return protoTrim.call(str);

            char = String(char);

            var st = 0;
            while (str.charAt(st) === char) st++;

            return st > 0 ? str.substring(st, str.length) : str;
          },
          rtrim: function(str, char) {
            /* slower way:
              if(char === undefined) return str.replace(/\s+$/g, '');
              return str.replace(new RegExp("[" + char + "]+$", 'g'), '');
            */
            if(char === undefined) char = ' ';

            var protoTrim = this.__browser__proto__.trimEnd || this.__browser__proto__.trimRight;
            if(char === ' ' && protoTrim) return protoTrim.call(str);

            char = String(char);

            var o = str.length, len = o;
            while (str.charAt(len - 1) === char) len--;

            return len < o ? str.substring(0, len) : str;
          },
          between: function(str, prefix, suffix, ignoreSpace) {
            prefix = String(prefix), suffix = String(suffix);

            if(suffix == null) suffix = prefix;
            if(ignoreSpace === undefined) ignoreSpace = false; // null is used when a you customize other parameter not available for the last one
            
            return this._startsWith(str, prefix, ignoreSpace) && this._endsWith(str, suffix, ignoreSpace);
          },
          // polyfill of String.startsWith
          startsWith: function(str, prefix, position, ignoreSpace) {
            prefix = String(prefix);
            if(ignoreSpace === undefined) ignoreSpace = false;

            return this._startsWith(str, prefix, position, ignoreSpace);
          },
          _startsWith: function(str, prefix, position, ignoreSpace) {
            if(ignoreSpace) str = this.ltrim(str);

            var protoStartsWith = this.__browser__proto__.startsWith;
            return protoStartsWith ? protoStartsWith.call(str, prefix, position) : (position | 0) === str.indexOf(prefix);
          },
          // polyfill of String.endsWith
          endsWith: function(str, suffix, endPosition, ignoreSpace) {
            suffix = String(suffix), endPosition = Number(endPosition);
            if(ignoreSpace === undefined) ignoreSpace = false;

            return this._endsWith(str, suffix, endPosition, ignoreSpace);
          },
          _endsWith: function(str, suffix, endPosition, ignoreSpace) {
            if(ignoreSpace) str = this.rtrim(str);
            
            var protoEndsWith = this.__browser__proto__.endsWith;
            return protoEndsWith ? protoEndsWith.call(str, suffix, endPosition) : (endPosition || str.length) - suffix.length === str.lastIndexOf(suffix);
          },
          nl2br: function(str, xhtml) { // suppose that html 5 is prioritary on xhtml 1.X
            // slower way: return str.replace(/\r\n|\n/mg, xhtml ? "<br/>" : "<br>");
            var len = str.length, i = 0;
            var result = "";
            var BR = xhtml ? "<br/>" : "<br>";
            var char;
            while(i != len) {
              char = str.charAt(i++);
              if(char === '\n') result += BR;
              else if(char !== '\r') result += char;
            }
            return result;
          },
          codePointAt: function(str, index) {
            index |= 0;
            var length = str.length;
            if(index < 0 || index > length-1) return undefined;
            return this.char.codePointAtImpl(str, index, length);
          },
          fromCharCode: function() {
            var result = "";
            for(var i = 0, l = arguments.length; i < l; i++) {
              var code = Number(String.arguments[i]);
              if(isNaN(code)) {
                result += '\0'; // empty char ('\u0000')
                continue;
              }
              code %= this.MIN_SUPPLEMENTARY_CODE_POINT; // allow value greater than max value but relegate to another zero
              var lZero = "";
              if(code < 16) lZero += '0'; // leading zero when code is between 0x0 - 0xF
              result += '\u0000' + lZero + code.toString(16);
            }
            return result;
          },
          fromCodePoint: function() {
            var str = String.fromCharCode.apply(null, arguments);
            var split = str.split('');
            for(var i = 0, l = split.length; i < l; i++) {
              if(split[i] !== '\0') continue;
              if(arguments[i] != 0)
                throw new RangeError(arguments[i] + " is not a valid code point");
            }
            return str;
          },
          codePointBefore: function(str, index) {
            var i = index - 1;
            if ((i < 0) || (i >= str.length)) return undefined;
            
            return this.char.codePointBeforeImpl(str, index, 0);
          },
          toCharsArray: function(str) {
            //return str.split(''); // simulate java String str === fromCharsArray(toCharsArray(str))
            var len = str.length;
            var result = Array(len);
            while(len-- !== 0) result[len] = str.charAt(len);
            return result;
          },
          toBytesArray: function(str) {
            var len = str.length;
            var result = Array(len);
            while(len-- !== 0) result[len] = str.charCodeAt(len);
            return result;
          },
          fromCharsArray: function(chs, offset, count) {
            offset |= 0;
            var count = Number(count);
            if(count === 0 || offset < 0) return "";
            
            if(isNaN(count)) count = chs.length;
            else count += offset;

            var result = "";
            while(offset !== count) result += chs[offset++];
            return result;
          },
          fromBytesArray: function(bts, offset, count) {
            offset |= 0;

            var count = Number(count);
            if(count === 0 || offset < 0) return "";

            var array;
            if(isNaN(count)) {
              count = bts.length;
              array = Array(count-offset);
            } else {
              array = Array(count);
              count += offset;
            }

            var cursor = 0;
            while(offset !== count) array[cursor++] = bts[offset++];
            return String.fromCharCode.apply(null, array);
          },
          codePointCount: function(str, beginIndex, endIndex) {
            beginIndex |= 0;

            var length = str.length;
            endIndex = Number(endIndex);
            if(isNaN(endIndex)) endIndex = length;

            if (beginIndex < 0 || endIndex > length || beginIndex > endIndex) return 0;
            var n = endIndex - beginIndex;
            for (var i = beginIndex; i < endIndex; ) {
              if (this.isHighSurrogate(str.charAt(i++)) && i < endIndex &&
                  this.isLowSurrogate(str.charAt(i))) {
                n--;
                i++;
              }
            }
            return n;
          },
          offsetByCodePoints: function(str, index, codePointOffset) {
            index |= 0;
            codePointOffset = Number(codePointOffset);
            var length = str.length;
            if (index < 0 || index > length) return NaN;

            var x = index;
            var i;
            if (codePointOffset >= 0) {
              for (i = 0; x < length && i < codePointOffset; i++) {
                if (this.isHighSurrogate(str.charAt(x++)) && x < length &&
                    this.isLowSurrogate(str.charAt(x))) {
                  x++;
                }
              }
              if (i < codePointOffset) return NaN;
            } else {
              for (i = codePointOffset; x > 0 && i < 0; i++) {
                if (this.isLowSurrogate(str.charAt(--x)) && x > 0 &&
                    this.isHighSurrogate(str.charAt(x-1))) {
                  x--;
                }
              }
              if (i < 0) return NaN;
            }
            return x;
          },
          // if you use multiple encoding to base64 with the same parameter (see below) use also class and not this method
          // to customize(allow url encoding, without padding, linemax, newline char...) use Base64.Encoder class
          // you can also call shortcut if you use common parameters with
          // Encoder#(RFC4648|RFC4648_URLSAFE|RFC2045)
          // RFC4648: no url encoding; with padding; without linemax/newline char
          // RFC4648_URLSAFE: same that RFC4648 but with url encoding (encode '+' and '/' to '-' and '_')
          // RFC2045: no url encoding; with padding; with linemax to 76 and newline char to ['\r', '\n'] = CRLF
          // RFC2045 is used to encode mime string like text/html; charset=utf8
          btoa: function(rawString) {
            return self.object.Base64.Encoder.RFC4648().encodeString(rawString, 0, rawString.length);
          },
          // Encoder#(RFC4648|RFC4648_URLSAFE|RFC2045)
          // RFC4648: no url decoding; no mime
          // RFC4648_URLSAFE: same that RFC4648 but with url decoding
          // RFC2045: no url decoding; with mime
          // RFC2045 is used to encode mime string like text/html; charset=utf8
          atob: function(encodedString) {
            return self.object.Base64.Decoder.RFC4648().decodeString(encodedString, 0, encodedString.length);
          },
          includes: function(str, searchString) {
            return str.indexOf(searchString) !== -1;
          },
          normalize: function(str, form) {

          },
          // escape => escapeHex
          // when native is false the hexadecimal code isn't uppercase to let you the choice of any modification
          escape: function(str, native) {
            if(native == null) native = true;
            str = String(str);
            var result = "";
            for(var i = 0, l = str.length; i < l; i++) {
              var code = str.charCodeAt(i);
              if((code === 42 || code === 43) || (code >= 45 && code <= 57) ||
                 (code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
                result += String.fromCharCode(code);
                continue;
              }
              var lZero = "";
              if(code < 16) lZero += '0';
              var hex = lZero + code.toString(16);
              result += "%" + (native ? hex.toUpperCase() : hex);
            }
            return result;
          },
          unescape: function(str) {
            str = String(str);
            var result = "";
            for(var i = 0, l = str.length; i < l; i++) {
              var char = str.charAt(i);
              if(char !== '%') {
                result += char;
                continue;
              }
              result += String.fromCharCode(parseInt(str.charAt(++i) + str.charAt(++i), 16));
            }
            return result;
          },
          MIN_RADIX: 2,
          MAX_RADIX: 36,
          MAX_REPEAT_SIZE: 536870911, // Math.pow(2, 29) - 1 (valid only for count param in repeat)
          // improved repeat method when native is false and when count isn't a number this return current str and not empty char \0 ""
          repeat: function(str, count, native) {
            var result = "";
            if(count < 0) throw new RangeError("repeat count must be non-negative");
            if(typeof str !== 'string' || count === 0) return result;
            if(typeof count !== 'number') {
              if(native == null) native = true;
              return native ? result : str;
            }
            if(count === Infinity || count > this.MAX_REPEAT_SIZE) throw new RangeError("repeat count must be less than infinity and not overflow maximum string size"); // strange that maximum string size isn't respecter with multiple char str
            
            count++;
            while(--count) result += str; // out of memory ???
            return result;
          },
          reverse: function(str, from, to) {
            from = Number(from);
            if(isNaN(from)) from = 0;

            var length = str.length;

            to = Number(to);
            if(isNaN(to)) to = length;

            if(from >= length || to <= -length || to === 0 || to === from) return "";

            var k = Math.max(from >= 0 ? from : length - Math.abs(from), 0);
            var m = Math.min(to > 0 ? to : length - Math.abs(to), length)-1; // -1 cause length -1 is the last index for an array (char) see: #toCharsArray

            var result = "";
            for(; m >= k; m--) result += str.charAt(m);
            return result;
          },
          forEach: function(str, runnable, thisArg) {
            for(var i = 0, l = str.length; i < l; i++) {
              if(runnable.call(thisArg, str.charAt(i), i, str) === null) break;
            }
          },
          forEachCode: function(str, runnable, includeSurrogate, thisArg) {
            method = includeSurrogate == null || !includeSurrogate ? 'charCodeAt' : 'codePointAt';
            for(var i = 0, l = str.length; i < l; i++) {
              if(runnable.call(thisArg, str[method](i), i, str) === null) break;
            }
          },
          changeCode: function(str, predicate, number, thisArg) {
            var codes = [];
            this.forEachCode(str, function(code, index) {
              if(predicate.call(this, code, index, str)) code += number;
              codes[index] = code;
            }, thisArg);
            return String.fromCharCode.apply(null, codes);
          },
          /*changeCodeCache: function(str, predicate, number, cache, thisArg) {
            var hasCache = typeof cache === 'object';
            var codes = [];
            this.forEachCode(str, function(code, index) {
              if(hasCache && code in cache) code = cache[code];
              else if(predicate.call(this, code, index, str)) code += number
              codes[index] = code;
            }, thisArg);
            return String.fromCharCode.apply(null, codes);
          },*/
          unicodeUpper: {
            '181': 924, '255': 376, '383': 83, '477': 398, '596': 390,

            '601': 399, '603': 400, '608': 403, '611': 404, '405': 502,
            
            '617': 406, '616': 407, '410': 573, '623': 412, '626': 413,
          
            '414': 544, '629': 415, '640': 422, '643': 425, '648': 430,
          
            '650': 433, '651': 434, '658': 439}
          ,
          toUpperCase: function(str) { // maybe add cache
            var codes = [];
            var _c = 0;
            for(var i = 0, l = str.length; i < l; i++) {
              var code = str.charCodeAt(i);
              if(code === 223 || code === 247 || code === 311 || code === 411 || code === 426 || code === 427) {
                codes[_c++] = code;
                continue;
              }
              if(code === 329) {
                codes[_c++] = 700; // ʼN strange but in standard
                codes[_c++] = 78;
                continue;
              }

              if((code >= 97 && code <= 122) ||
                 (code >= 224 && code <= 257)) code += 32;

              if(code in this.unicodeUpper) {
                codes[_c++] = this.unicodeUpper[code];
                continue;
              }

              if((code >= 256 && code <= 436) && code % 2 === 1) code++; // code&1
              codes[_c++] = code;
            }
          },
          toLowerCase: function(str) {
            var codes = [];
            var _c = 0;
            for(var i = 0, l = str.length; i < l; i++) {
              var code = str.charCodeAt(i);
              if(code === 376) {
                codes[_c++] = 255;
                continue;
              }
              if(code === 390) {
                codes[_c++] = 596;
                continue;
              }
              if(code === 398) {
                codes[_c++] = 477;
                continue;
              }
              if(code === 399) {
                codes[_c++] = 601;
                continue;
              }
              if(code === 400) {
                codes[_c++] = 603;
                continue;
              }
              if(code === 403) {
                codes[_c++] = 608;
                continue;
              }
              if(code === 404) {
                codes[_c++] = 611;
              }
              if(code === 924) { // not alphabetic
                codes[_c++] = 181;
                continue;
              }
              if(code === 216 || code === 329 || code === 383 || code === 411 || code === 426 || code === 427) {
                codes[_c++] = code;
                continue;
              }
              if(code === 223) {
                for(var z = 0; z < 2; z++) codes[_c++] = 115; // ss strange but in standard
                continue;
               }

              if((code >= 65 && code <= 90) ||
                 (code >= 192 && code <= 222)) code -= 32;
              codes[_c++] = code;
            }
          },
          substring: function(str, start, end) {
            start = start | 0;
            var len = str.length;

            end = Number(end);
            if(isNaN(end)) end = len;
            if(end < 0) return "";

            var result = "";
            for(; start < end; start++)
              result += str.charAt(start);
            
            return result;
          },
          substr: function(str, from, len) {
            len = Number(len);
            if(len <= 0) return "";

            var strLen = str.length;
            if(isNaN(len)) len = strLen;

            from = from | 0;
            var i = 0, k = Math.max(from >= 0 ? from : strLen - Math.abs(from), 0); // this is the difference between from and start
            var result = "";
            for(; k < strLen; k++) {
              if(++i > len) break;
              result += str.charAt(k);
            }
            return result;
          },
          match: function(str, regExp) {
            return new RegExp(regExp).exec(str);
          },
          matchAll: function(str, regExp) {
            return new RegExp(regExp, 'g').exec(str);
          },
          indexOf: function(str, searchString, fromIndex) {
            var protoIndexOf = this.__browser__proto__.indexOf;
            if(protoIndexOf) return protoIndexOf.call(str, searchString, fromIndex);
            else {
              if (str == null) throw new TypeError("String.indexOf called on null or undefined");
              str = String(str);
              var len = str.length >>> 0;
              if (len === 0) return -1;
              var n = fromIndex | 0;
              if (n >= len) return -1;
              var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
              for (; k < len; k++) {
                if (str.charAt(k) === searchString) return k;
              }
              return -1;
            }
          },
          lastIndexOf: function(str, searchString, fromIndex) {
            var protoLastIndexOf = this.__browser__proto__.lastIndexOf;
            if(protoLastIndexOf) return protoLastIndexOf.call(str, searchString, fromIndex);
            else {
              if (str == null) throw new TypeError("String.lastIndexOf called on null or undefined");
              str = String(str);
              var len = str.length >>> 0;
              if (len === 0) return -1;

              if(searchString === "") return Math.max(Math.min(n, len), 0);

              var n = Number(fromIndex); // like fromIndex | 0 convert fromIndex to number but work only when right number is 0
              if(isNaN(n)) n = len-1; // we do all internal work to avoid confusing

              var k = Math.max(Math.min(n, len-1), 0);
              
              for (; k >= 0; k--) {
                if (str.charAt(k) === searchString) return k;
              }
              return -1;
            }
          },
          testL: function(str, searchString) {
            var protoLastIndexOf = this.__browser__proto__.lastIndexOf;
            for(var i = -20; i < 20; i++) {
              console.log(protoLastIndexOf.call(str, searchString, i) === this.lastIndexOf(str, searchString, i));
            }
          },
          concat: function(str) {
            var result = str;
            for(var i = 1, l = arguments.length; i < l; i++) result += arguments[i];
            return result;
          },
          slice: function(str) {
            throw Error("Use substring instead"); // difference ???
          },
          split: function(str, delimiter, limit) {
            limit = limit === undefined ? -1 : Number(limit);
            if(limit === 0 || isNaN(limit)) return [];
            var validLimit = limit > 0;
            var rd = "[^" + delimiter + "]";
            var regExp = new RegExp(rd + delimiter + rd, 'g');
            var result = limit < 0 ? [] : Array(limit);
            var next, i = 0;
            while(next = regExp.exec(str)) {
              if(validLimit && i >= limit) break;
              result[i++] = next[0];
            }
            return result;
          },
          // improved search method that allow fromIndex like indexOf to ignore a part of starting string
          search: function(str, search, fromIndex) { // like indexOf but work with RegExp
            if(search === null) return -1;
            search = RegExp(search);
            for(var i = fromIndex | 0, l = str.length; i < l; i++) {
              if(!search.test(str.charAt(i))) continue;
              return i;
            }
            return -1;
          },
          searchRight: function(str, search, fromIndex) { // inversed search
            if(search === null) return -1;
            search = RegExp(search);
            var s = -1;
            for(var i = fromIndex | 0, l = str.length; i < l; i++) {
              if(!search.test(str.charAt(i))) continue;
              s = i;
            }
            return s;
          },
          _replace_digit_reg: /\$([0-9])/g, // reuse this regexp you can also use it for your personal script but don't forget to reset the property lastIndex to 0 after use it (like close a flux)
          // improved replace method that allow a custom this with thisArg param
          replace: function(str, searchValue, replaceValue, thisArg) { // maybe add reverseReplace and replaceIndex
            if(typeof searchValue === 'string') searchValue = this.escapeRegExp(searchValue);
            searchValue = RegExp(searchValue);
            var result = "";
            var next = searchValue.exec(str);
            if(next === null) return str;

            var isGlobal = searchValue.global;
            var index;
            if(replaceValue.indexOf("$&") !== -1) replaceValue = this.replace(replaceValue, new RegExp("\\$&", 'g'), str);
            var replaced, isFunctionReplaceValue = typeof replaceValue === 'function';
            var dnext;

            while(next) {
              var exc = next[0];
              result || (result = str);
              index = result.indexOf(exc, index | 0);
              replaced = replaceValue;
              if(isFunctionReplaceValue) replaced = replaceValue.call(thisArg, exc, index, str);
              //console.log(replaced, this._replace_digit_reg, this._replace_digit_reg.lastIndex);

              //console.log(result, replaced);
              while(dnext = this._replace_digit_reg.exec(replaced)) { // replaceValue maybe loop at end
                if(!(dnext[1] in next)) continue;
                //console.log("a>>><=< ", next, dnext);
                replaced = replaced.replace(dnext[0], next[dnext[1]]);
              }

              //console.log(dnext);
              //if(replaced.indexOf("$" + nb) !== -1) replaced = this.replaceAll(replaced, "\\$" + nb, next[nb]);
              //console.log(replaced, next, searchValue, index);
              
              //console.log(exc.length, replaced.length);
              //console.log("R-1  " + result);
              result = result.substring(0, index) + replaced + result.substring(index + exc.length);
              //console.log("R  " + result);
              
              if(!isGlobal) break;

              index += replaced.length;
              next = searchValue.exec(str);
            }
            this._replace_digit_reg.lastIndex = 0;
            return result;
          },
          // it's recommended to use this method only when you don't know the searchValue (with escape to true)
          // in a large loop, otherwise use /x/g or for string new RegExp(x, 'g') in replace method
          // it's why escapeRegexp and unescapeRegexp use /g instead of replaceAll
          replaceAll: function(str, searchValue, replaceValue, escape, thisArg) {
            if(escape == true) searchValue = this.escapeRegExp(searchValue);
            return this.replace(str, new RegExp(searchValue, 'g'), replaceValue, thisArg);
          },
          escapeRegExp: function(str) {
            return this.replace(str, /([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
          },
          unescapeRegExp: function(str) {
            return this.replace(str, /[\\](.*?)/g, "$1");
          },
          oldHTML: false, // IE only (uppercase tag and attribute: <A HREF=xxx>y</A>)
          xhtml: false, // only when there are not textContent (str) allow <a xxx />
          callHTML: function() {
            var proto = this.__browser__proto__[arguments[arguments.length]];
            if(proto) {
              arguments.length--;
              if(self.isIE && !this.oldHTML) arguments[0] = arguments[0].toLowerCase();
              proto.apply(arguments);
              return true;
            }
            return false;
          },
          // when native is false attribute like name, color, size, url when undefined there not writting <x attr="undefined">y</x> but just <x>y</x>
          anchor: function(str, name, native) {
            if(native == null) native = true;
            if(!native || !this.callHTML(str, name, 'anchor'))
              return new self.object.string2HTML('a', str).attr('name', name, native).build();
          },
          link: function(str, href, native) {
            if(native == null) native = true;
            if(!native || !this.callHTML(str, href, 'link'))
              return new self.object.string2HTML('a', str).attr('href', href, native).build();
          },
          big: function(str) {
            if(!this.callHTML(str, 'big'))
              return new self.object.string2HTML('big', str).build();
          },
          blink: function(str) {
            if(!this.callHTML(str, 'blink'))
              return new self.object.string2HTML('blink', str).build();
          },
          bold: function(str) {
            if(!this.callHTML(str, 'bold'))
              return new self.object.string2HTML('b', str).build();
          },
          fixed: function(str) {
            if(!this.callHTML(str, 'fixed'))
              return new self.object.string2HTML('tt', str).build();
          },
          // Deprecated
          fontcolor: function(str, color, native) {
            if(native == null) native = true;
            if(!native || !this.callHTML(str, 'fontcolor'))
              return new self.object.string2HTML('font', str).attr('color', color, native).build();
          },
          // Deprecated
          fontsize: function(str, size, native) {
            if(native == null) native = true;
            if(!native || !this.callHTML(str, 'fontsize'))
              return new self.object.string2HTML('font', str).attr('size', size, native).build();
          },
          italics: function(str, href) {
            if(!this.callHTML(str, href, 'italics'))
              return new self.object.string2HTML('i', str).build();
          },
          small: function(str, href) {
            if(!this.callHTML(str, href, 'small'))
              return new self.object.string2HTML('small', str).build();
          },
          strike: function(str, href) {
            if(!this.callHTML(str, href, 'strike'))
              return new self.object.string2HTML('strike', str).build();
          },
          sub: function(str, href) {
            if(!this.callHTML(str, href, 'sub'))
              return new self.object.string2HTML('sub', str).build();
          },
          sup: function(str, href) {
            if(!this.callHTML(str, href, 'sup'))
              return new self.object.string2HTML('sup', str).build();
          }
        },
        date: {
          now: Date.now || function() {
            return +(new Date());
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
              PL.object.iterate(params, function(key) { e[key] = params[key]; });
            }
            return e;
          },
          fire: function(target, e, args) {
            PL.object.iterate(args, function(key) { e[key] = args[key]; });
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

    api.class = {
      generateConstants: function(scope, constants) {
        PL.object.iterate(constants, function(key) {
          api.defineConstant(scope, key, constants[key]);
        });
      },
      generateStatics: function(scope, statics) {
        PL.object.iterate(statics, function(key) {
          scope[key] = statics[key];
        });
      }
    };
    api.defineConstant = function(scope, name, value) {
      Object.defineProperty(scope, name, {'value': value, writable: false});
    };

    self.object.Class = function(scope) {
      this.scope = scope;
    },
    self.object.Class.prototype = {
      generate: function(constants, statics) {
        if(constants != null) api.class.generateConstants(this.scope, constants);
        if(statics !== undefined) api.class.generateStatics(this.scope, statics);
      }
    };

    // Source: http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/MT2002/CODES/MTARCOK/mt19937ar-cok.c
    // advantage: have a large period: 2^19937-1 
    // used intern with PRNG mersenneTwister but maybe use it for java-type branch
    // 整数を扱うクラス
    self.object.Int32 = function(value) {
      this.bits = [0, 0, 0, 0];
      var v = value;
      if (v !== 0) {
        for (var i = 0; i < 4; ++i) {
          this.bits[i] = v & 0xff;
          v = v >> 8;
        }
      }
    },
    self.object.Int32.prototype = {
      getValue: function () {
        return (this.bits[0] | (this.bits[1] << 8) | (this.bits[2] << 16)) + ((this.bits[3] << 16) * 0x100);
      },
      getBits: function (i) { return this.bits[i & 3]; },
      setBits: function (i, val) { return (this.bits[i & 3] = val & 0xff); },
      add: function (another) {
        var tmp = new self.object.Int32(0);
        var fl = 0, b;
        for (var i = 0; i < 4; ++i) {
          b = this.bits[i] + another.getBits(i) + fl;
          tmp.setBits(i, b);
          fl = b >> 8;
        }
        return tmp;
      },
      sub: function (another) {
        var tmp = new self.object.Int32(0);
        var bb = [0, 0, 0, 0];
        for (var i = 0; i < 4; ++i) {
          bb[i] = this.bits[i] - another.getBits(i);
          if ((i > 0) && (bb[i - 1] < 0)) --bb[i];
        }
        for (i = 0; i < 4; ++i) tmp.setBits(i, bb[i]);
        return tmp;
      },
      mul: function (another) {
        var tmp = new self.object.Int32(0);
        var bb = [0, 0, 0, 0, 0];
        for (var i = 0; i < 4; ++i) {
          for (var j = 0; i + j < 4; ++j) bb[i + j] += this.bits[i] * another.getBits(j);
          tmp.setBits(i, bb[i]);
          bb[i + 1] += bb[i] >> 8;
        }
        return tmp;
      },
      and: function (another) {
        var tmp = new self.object.Int32(0);
        for (var i = 0; i < 4; ++i) tmp.setBits(i, this.bits[i] & another.getBits(i));
        return tmp;
      },
      or: function (another) {
        var tmp = new self.object.Int32(0);
        for (var i = 0; i < 4; ++i) tmp.setBits(i, this.bits[i] | another.getBits(i));
        return tmp;
      },
      xor: function (another) {
        var tmp = new self.object.Int32(0);
        for (var i = 0; i < 4; ++i) tmp.setBits(i, this.bits[i] ^ another.getBits(i));
        return tmp;
      },
      rshifta: function (s) {
        var tmp = new self.object.Int32(0);
        var bb = [0, 0, 0, 0, 0];
        var p = s >> 3;
        var i, sg = 0;
        if ((this.bits[3] & 0x80) > 0) bb[4] = sg = 0xff;
        for (i = 0; i + p < 4; ++i) bb[i] = this.bits[i + p];
        for (; i < 4; ++i) bb[i] = sg;
        p = s & 0x7;
        for (var i = 0; i < 4; ++i) tmp.setBits(i, ((bb[i] | (bb[i + 1] << 8)) >> p) & 0xff);
        return tmp;
      },
      rshiftl: function (s) {
        var tmp = new self.object.Int32(0);
        var bb = [0, 0, 0, 0, 0];
        var p = s >> 3;
        for (var i = 0; i + p < 4; ++i) bb[i] = this.bits[i + p];
        p = s & 0x7;
        for (var i = 0; i < 4; ++i) tmp.setBits(i, ((bb[i] | (bb[i + 1] << 8)) >> p) & 0xff);
        return tmp;
      },
      lshift: function (s) {
        var tmp = new self.object.Int32(0);
        var bb = [0, 0, 0, 0, 0];
        var p = s >> 3;
        for (var i = 0; i + p < 4; ++i) bb[i + p + 1] = this.bits[i];
        p = s & 0x7;
        for (var i = 0; i < 4; ++i) tmp.setBits(i, (((bb[i] | (bb[i + 1] << 8)) << p) >> 8) & 0xff);
        return tmp;
      },
      equals: function (another) {
        var i;
        for (i = 0; i < 4; ++i) {
          if (this.bits[i] !== another.getBits(i)) return false;
        }
        return true;
      },
      compare: function (another) {
        for (var i = 3; i >= 0; --i) {
          if (this.bits[i] > another.getBits(i)) return 1;
          if (this.bits[i] < another.getBits(i)) return -1;
        }
        return 0;
      }
    };
    // End of Int32

    /*
    PRNG mersenneTwister
    Usage:
      var r = new pipnet.object.MersenneTwister();
      r.init_genrand(seed);
      r.genrand_real1();
     */
    self.object.MersenneTwister = function() {};
    (function() {
      /* Period parameters */
      var N = 624;
      var M = 397;
      var MATRIX_A = new self.object.Int32(0x9908b0df); /* constant vector a */
      var UMASK = new self.object.Int32(0x80000000); /* most significant w-r bits */
      var LMASK = new self.object.Int32(0x7fffffff); /* least significant r bits */
      
      var INT32_ZERO = new self.object.Int32(0);
      var INT32_ONE = new self.object.Int32(1);

      var MIXBITS = function (u, v) {
        return (u.and(UMASK)).or(v.and(LMASK));
      };
      var TWIST = function (u, v) {
        return ((MIXBITS(u, v).rshiftl(1)).xor((v.and(INT32_ONE)).equals(INT32_ZERO) ? INT32_ZERO : MATRIX_A));
      };
      
      var state = new Array(N); /* the array for the state vector  */
      var left = 1;
      var initf = 0;
      var next = 0;
      
      for (var i = 0; i < N; ++i) state[i] = INT32_ZERO;
      
      /* initializes state[N] with a seed */
      var _init_genrand = function (s) {
        var lt1812433253 = new self.object.Int32(1812433253);
        state[0] = new self.object.Int32(s);
        for (var j = 1; j < N; ++j) {
          state[j] = ((lt1812433253.mul(state[j - 1].xor(state[j - 1].rshiftl(30)))).add(new self.object.Int32(j)))
          /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
          /* In the previous versions, MSBs of the seed affect   */
          /* only MSBs of the array state[].                        */
          /* 2002/01/09 modified by Makoto Matsumoto             */
            .and(new self.object.Int32(0xffffffff));  /* for >32 bit machines */
        }
        left = 1, initf = 1;
      };
      
      var next_state = function () {
        /* if init_genrand() has not been called, */
        /* a default initial seed is used         */
        if (initf == 0) _init_genrand(5489);
    
        left = N;
        next = 0;
        
        var p = 0;
        for (var j = N - M + 1; --j; ++p) state[p] = state[p + M].xor(TWIST(state[p], state[p + 1]));
        for (var j = M; --j; ++p) state[p] = state[p + M - N].xor(TWIST(state[p], state[p + 1]));
    
        state[p] = state[p + M - N].xor(TWIST(state[p], state[0]));
      };
  
      var lt0x9d2c5680 = new self.object.Int32(0x9d2c5680);
      var lt0xefc60000 = new self.object.Int32(0xefc60000);
  
      /* generates a random number on [0,0xffffffff]-interval */
      var _genrand_int32 = function () {
        if (--left === 0) next_state();
        
        var y = state[next];
        ++next;
    
        /* Tempering */
        y = y.xor(y.rshiftl(11));
        y = y.xor((y.lshift(7)).and(lt0x9d2c5680));
        y = y.xor((y.lshift(15)).and(lt0xefc60000));
        y = y.xor(y.rshiftl(18));
    
        return y.getValue();
      };

      self.object.MersenneTwister.prototype = {
        init_genrand: _init_genrand,
        /* initialize by an array with array-length */
        /* init_key is the array for initializing keys */
        /* key_length is its length */
        /* slight change for C++, 2004/2/26 */
        init_by_array: function (init_key, key_length) {
          var lt1664525 = new self.object.Int32(1664525);
          var lt1566083941 = new self.object.Int32(1566083941);
          _init_genrand(19650218);
          var i = 1, j = 0;
          var k = (N > key_length ? N : key_length);
          for (; k; --k) {
            state[i] = ((state[i].xor((state[i - 1].xor(state[i - 1].rshiftl(30))).mul(lt1664525)))
              .add(new self.object.Int32(init_key[j]))).add(new self.object.Int32(j)) /* non linear */
              .and(new self.object.Int32(0xffffffff)); /* for WORDSIZE > 32 machines */
            i++; j++;
            if (i >= N) { 
              state[0] = state[N - 1];
              i = 1; 
            }
            if (j >= key_length) j = 0;
          }
          for (var k = N - 1; k; --k) {
            state[i] = (state[i].xor((state[i-1].xor(state[i - 1].rshiftl(30))).mul(lt1566083941)))
              .sub(new self.object.Int32(i)) /* non linear */
              .and(new self.object.Int32(0xffffffff)); /* for WORDSIZE > 32 machines */
            i++;
            if (i >= N) {
              state[0] = state[N - 1]; 
              i = 1; 
            }
          }
      
          state[0] = new self.object.Int32(0x80000000); /* MSB is 1; assuring non-zero initial array */ 
          left = 1, initf = 1;
        },
        genrand_int32: _genrand_int32,
        /* generates a random number on [0,0x7fffffff]-interval */
        genrand_int31: function () {
          if (--left === 0) next_state();
          var y = state[next];
          ++next;
      
          /* Tempering */
          y = y.xor(y.rshiftl(11));
          y = y.xor((y.lshift(7)).and(lt0x9d2c5680));
          y = y.xor((y.lshift(15)).and(lt0xefc60000));
          y = y.xor(y.rshiftl(18));
      
          return (y.rshiftl(1)).getValue();
        },
        /* generates a random number on [0,1]-real-interval */
        genrand_real1: function () {
          if (--left === 0) next_state();
          var y = state[next];
          ++next;
      
          /* Tempering */
          y = y.xor(y.rshiftl(11));
          y = y.xor((y.lshift(7)).and(lt0x9d2c5680));
          y = y.xor((y.lshift(15)).and(lt0xefc60000));
          y = y.xor(y.rshiftl(18));
      
          return y.getValue() / 4294967295; 
          /* divided by 2^32-1 */ 
        },
        /* generates a random number on [0,1)-real-interval */
        genrand_real2: function () {
          if (--left === 0) next_state();
          
          var y = state[next];
          ++next;
      
          /* Tempering */
          y = y.xor(y.rshiftl(11));
          y = y.xor((y.lshift(7)).and(lt0x9d2c5680));
          y = y.xor((y.lshift(15)).and(lt0xefc60000));
          y = y.xor(y.rshiftl(18));
      
          return y.getValue() / 4294967296; 
          /* divided by 2^32 */
        },
        /* generates a random number on (0,1)-real-interval */
        genrand_real3: function () {
            if (--left === 0) next_state();
            
            var y = state[next];
            ++next;
        
            /* Tempering */
            y = y.xor(y.rshiftl(11));
            y = y.xor((y.lshift(7)).and(lt0x9d2c5680));
            y = y.xor((y.lshift(15)).and(lt0xefc60000));
            y = y.xor(y.rshiftl(18));
        
            return (y.getValue() + .5) / 4294967296; 
            /* divided by 2^32 */
        },
        /* generates a random number on [0,1) with 53-bit resolution*/
        genrand_res53: function () {
            var a = ((new self.object.Int32(_genrand_int32())).rshiftl(5)).getValue();
            var b = ((new self.object.Int32(_genrand_int32())).rshiftl(6)).getValue(); 
            return (a * 67108864 + b) / 900719925474099.2; 
        }
      };
      /* These real versions are due to Isaku Wada, 2002/01/09 added*/
    })();

    /* Polyfill for IE8- and feature around */
    self.object.ArrayIterator = function(type, array) {
      this.type = type;
      this.array = array;
      this.arrayLength = this.array.length; // cache like for(var i = 0, l = length;...)
      this.index = 0;
    };
    self.object.ArrayIterator.prototype = {
      _keys: function(result) {
        result.value = this.index;
      },
      _values: function(result) {
        result.value = this.array[this.index];
      },
      _entries: function(result) {
        result.value = [this.index, this.array[this.index]];
      },
      next: function() {
        var result = {done: this.index === this.arrayLength};
        if(result.done) result.value = undefined;
        else {
          this['_' + this.type](result);
          this.index++;
        }
        return result;
      }
    };

    self.object.string2HTML = function(x, str) {
      this.oldTag = self.isIE && PL.string.oldHTML;
      if(this.oldTag) x = x.toUpperCase(); // cause IE upperCase result with old synthax of xml/html 1.0)
      this.x = x;
      this.str = str;
    };
    self.object.string2HTML.prototype = {
      attr: function(key, value, native) {
        if(this.oldTag) key = key.toUpperCase();
        if(native || value !== undefined) this.attrv = " " + key + "=\"" + value + "\""; 
        return this;
      },
      build: function() {
        if(!this.str && PL.string.xhtml) return "<" + this.x + (this.attrv || "") + " />";
        return "<" + this.x + (this.attrv || "") + ">" + this.str + "</" + this.x + ">";
      }
    };

    // improved promise you can pass a custom this arg in constructor and in callback functions (then/catch/finally)
    self.object.Promise = function(executor, thisArg) {
      if('Promise' in this) throw new TypeError("calling a builtin Promise constructor without new is forbidden");
      if(typeof executor !== 'function')
        throw new TypeError((executor != null ? executor.toSource() : executor) + " is not a function");
      if(executor === Function) return self.object.Promise.reject(new SyntaxError("missing formal parameter"));
      this['<state>'] = 'pending';
      var _this = this;

      setTimeout(function() { // this hack allow to run this 'executor' method in async while the direct return state is pending (the final state (rejected/fulfilled) must be returned inside a variable and use the callback functions only after these step)
        executor.call(thisArg,
        function(value) { // resolve
          _this['<state>'] = 'fulfilled';
          _this['<value>'] = value;

          _this._callCallback('then', value);
          _this._callCallback('finally');
        },
        function(reason) { // reject
          _this['<state>'] = 'rejected';
          _this['<reason>'] = reason;
          console.error(reason instanceof Error ? reason : "uncaught exception: " + reason); // we cannot throw the real error cause finally callback must run after error

          _this._callCallback('catch', reason);
          _this._callCallback('finally');
        });
      });
    };
    self.object.Promise.prototype = {
      _callCallback: function(name, value) {
        if(!this.hasOwnProperty(name)) return;
        if(value === undefined) this[name].callback.call(this[name].context);
        else this[name].callback.call(this[name].context, value);
        delete this[name];
      },
      then: function(callback, thisArg) {
        this.then = {callback: callback, context: thisArg};
        return this;
      },
      catch: function(callback, thisArg) {
        this.catch = {callback: callback, context: thisArg};
        return this;
      },
      finally: function(callback, thisArg) {
        this.finally = {callback: callback, context: thisArg};
        return this;
      }
    };
    // these methods return always a promise even in case of error (promise state is rejected with error reason)
    self.object.Promise.resolve = function(value) {
      return new self.object.Promise(function(resolve) {
        resolve(value);
      });
    },
    self.object.Promise.reject = function(reason) {
      return new self.object.Promise(function(_, reject) {
        reject(reason);
      });
    },
    self.object.Promise.all = function(promises) {
      return new self.object.Promise(function(resolve, reject) {
        if (promises == null) return reject(new TypeError("Promise.all called on null or undefined"));
        if(!(promises instanceof Array)) return reject(new TypeError("Argument of Promise.all is not iterable"));
        
        promises = Object(promises);
        var l  = promises.length;
        if(l === 0) return resolve([]);
        
        var values = [];
        for(var i = 0; i < l; i++) {
          var promise = promises[i], state = promise['<state>'];
          switch(state) {
            case 'rejected': return resolve(promise);
            case 'pending': break;
            case 'fulfilled': values[i] = promise['<value>'];
          }
        }
        if(values.length !== 0) return resolve(values);
      });
    },
    self.object.Promise.allSettled = function(promises) {
      return new self.object.Promise(function(resolve, reject) {
        if (promises == null) return reject(new TypeError("Promise.allSettled called on null or undefined"));
        if(!(promises instanceof Array)) return reject(new TypeError("Argument of Promise.allSettled is not iterable"));
        
        promises = Object(promises);
        var l  = promises.length;
        if(l === 0) return resolve([]);
        
        var values = [];
        for(var i = 0; i < l; i++) {
          var promise = promises[i];
          if(promise['<state>'] === 'pending') continue;
          values[i] = promise;
        }
        if(values.length !== 0) return resolve(values);
      });
    },
    self.object.Promise.race = function(promises) {
      return new self.object.Promise(function(resolve, reject) {
        if (promises == null) return reject(new TypeError("Promise.race called on null or undefined"));
        if(!(promises instanceof Array)) return reject(new TypeError("Argument of Promise.race is not iterable"));
        
        promises = Object(promises);

        for(var i = 0, l = promises.length; i < l; i++) {
          var promise = promises[i];
          if(promise['<state>'] !== 'pending') return resolve(promise);
        }
      });
    };
    // slower way comment are for user that doesn't search performance you can simply replace method with this way
    // in general this will simply use more loop or a regex instead of loop
    self.object.Base64 = function() {
      throw new TypeError("calling a builtin Base64 constructor without .Encoder/.Decoder is forbidden")
    };
    /*
    newline commons value:
      ['\r', '\n'] (CRLF)
      ['\n'] (LF)
      null = def
    linemax: -1 = def
    doPadding allow result end with charCode(61) or string(=) depends of methods used (string/charCode(originally byte))
    */
    self.object.Base64.Encoder = function(isURL, newline, linemax, doPadding) {
      if(isURL == null) isURL = false;
      if(newline == null) newline = [];
      else if(typeof newline !== 'object') newline = Array(newline);
      if(linemax == null) linemax = -1;
      if(doPadding == null) doPadding = true;
      this.isURL = isURL;
      this.newline = newline;
      this.linemax = linemax;
      this.doPadding = doPadding;
    },
    // Shortcuts
    self.object.Base64.Encoder.RFC4648 = function() {
      return new self.object.Base64.Encoder(false, null, -1, true);
    },
    self.object.Base64.Encoder.RFC4648_URLSAFE = function() {
      return new self.object.Base64.Encoder(true, null, -1, true);
    },
    self.object.Base64.Encoder.RFC2045 = function() {
      return new self.object.Base64.Encoder(false, ['\r', '\n'], 76 /* MIMELINEMAX */, true);
    },
    self.object.Base64.Encoder.prototype = {
      toBase64: [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'
      ],
      toBase64URL: [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_'
      ],
      // use this to prefetch array of dst with its size
      outLength: function(srclen) {
          var len = 0;
          if (this.doPadding) len = 4 * ((srclen + 2) / 3);
          else {
            var n = srclen % 3;
            len = 4 * (srclen / 3) + (n === 0 ? 0 : n + 1);
          }
          if (this.linemax > 0) // line separators
            len += (len - 1) / this.linemax * this.newline.length;
          return len;
      },
      // encode src inside a dst or if undefined create a new byte array with optimal size
      encode: function(src, dst, off, end) {
        var il = src.length;
        if(dst !== undefined) {
          if(il === 0) return 0;
          
          off = Number(off), end = Number(end);
          if(isNaN(off)) off = 0;
          if(isNaN(end)) end = il;

          return this.encode0(src, off, end, dst);
        }
        
        if(il === 0) return [];

        off = Number(off), end = Number(end);
        if(isNaN(off)) off = 0;
        if(isNaN(end)) end = il;

        var dst = Array(this.outLength(il));
        this.encode0(src, off, end, dst);

        return dst;
      },
      // use method that ends with zero only when you're sure of paramaters that you give
      // for example with encode you can give a off parameter equals to "0" but in encode0 you can't
      // and you must use a number. if you know that you're off and dst parameters isn't null of undefined
      // and is a number or a string you can use Number(x) without isNaN check
      // change dst byte array and return number of written bytes
      encode0: function(src, off, end, dst) {
        /* slower way (1 + 1x loops => 3 + 1x loops):
          dst = PL.string.toBytesArray(this._encodeString(PL.string.fromBytesArray(src), off, end))
          return dst.length;
        */
        var base64 = this.isURL ? this.toBase64URL : this.toBase64;
        var sp = off;
        var slen = (((end - off) / 3)|0) * 3; // simulate cast to int see bit#trunc
        var sl = off + slen;
        if (this.linemax > 0 && slen > ((this.linemax / 4)|0) * 3)
          slen = ((this.linemax / 4)|0) * 3;
        var dp = 0;
        while (sp < sl) {
          var sl0 = Math.min(sp + slen, sl);
          for (var sp0 = sp, dp0 = dp ; sp0 < sl0; ) {
            var bits = (src[sp0++] & 0xff) << 16 |
                       (src[sp0++] & 0xff) <<  8 |
                       (src[sp0++] & 0xff);
            dst[dp0++] = base64[(bits >>> 18) & 0x3f].charCodeAt(0);
            dst[dp0++] = base64[(bits >>> 12) & 0x3f].charCodeAt(0);
            dst[dp0++] = base64[(bits >>> 6)  & 0x3f].charCodeAt(0);
            dst[dp0++] = base64[bits & 0x3f].charCodeAt(0);
          }
          var dlen = (((sl0 - sp) / 3)|0) << 2; // / 4
          dp += dlen;
          sp = sl0;
          var nl = this.newline.length;
          if (nl !== 0 && dlen === this.linemax && sp < end) {
            for (var i = 0; i++ < nl; ) dst[dp++] = this.newline[i].charCodeAt(0);
          }
        }
        if (sp < end) {               // 1 or 2 leftover bytes
          var b0 = src[sp++] & 0xff;
          dst[dp++] = base64[b0 >> 2].charCodeAt(0);
          if (sp === end) {
            dst[dp++] = base64[(b0 << 4) & 0x3f].charCodeAt(0);
            if (this.doPadding) {
              dst[dp++] = 61; // =
              dst[dp++] = 61;
            }
          } else {
            var b1 = src[sp++] & 0xff;
            dst[dp++] = base64[(b0 << 4) & 0x3f | (b1 >> 4)].charCodeAt(0);
            dst[dp++] = base64[(b1 << 2) & 0x3f].charCodeAt(0);
            if (this.doPadding) dst[dp++] = 61;
          }
        }
        return dp;
      },
      // improved btoa that specify off and end and finally if the string is a url
      // when off is not defined it's equals to zero
      // when end is not defined it's equals to str.length
      encodeString: function(str, off, end) {
        var il = str.length;
        if(il === 0) return "";
        
        off = Number(off), end = Number(end);
        if(isNaN(off)) off = 0;
        if(isNaN(end)) end = il;

        return this.encodeString0(str, off, end);
      },
      encodeString0: function(str, off, end) {
        var result = "";
        var base64 = this.isURL ? this.toBase64URL : this.toBase64;
        var sp = off;
        var slen = (((end - off) / 3)|0) * 3;
        var sl = off + slen;
        if (this.linemax > 0 && slen > ((this.linemax / 4)|0) * 3)
          slen = ((this.linemax / 4)|0) * 3;
        while (sp < sl) {
          var sl0 = Math.min(sp + slen, sl);
          for (var sp0 = sp; sp0 < sl0; ) {
            var bits = (str.charCodeAt(sp0++) & 0xff) << 16 |
                       (str.charCodeAt(sp0++) & 0xff) <<  8 |
                       (str.charCodeAt(sp0++) & 0xff);
            result += base64[(bits >>> 18) & 0x3f];
            result += base64[(bits >>> 12) & 0x3f];
            result += base64[(bits >>> 6)  & 0x3f];
            result += base64[bits & 0x3f];
          }
          var dlen = (((sl0 - sp) / 3)|0) << 2;
          sp = sl0;
          var nl = this.newline.length;
          if (nl !== 0 && dlen === this.linemax && sp < end) {
            for (var i = 0; i++ < nl; ) result += this.newline[i];
          }
        }
        if (sp < end) {
          var b0 = str.charCodeAt(sp++) & 0xff;
          result += base64[b0 >> 2];
          if (sp === end) {
            result += base64[(b0 << 4) & 0x3f];
            if (this.doPadding) result += '==';
          } else {
            var b1 = str.charCodeAt(sp++) & 0xff;
            result += base64[(b0 << 4) & 0x3f | (b1 >> 4)];
            result += base64[(b1 << 2) & 0x3f];
            if (this.doPadding) result += '=';
          }
        }
        
        return result;
      }
    };
    self.object.Base64.Decoder = function(isURL, isMIME) {
      this.isURL = isURL == null ? false: isURL;
      this.isMIME = isMIME == null ? false : isMIME;
    },
    self.object.Base64.Decoder.RFC4648 = function() {
      return new self.object.Base64.Decoder(false, false);
    }
    self.object.Base64.Decoder.RFC4648_URLSAFE = function() {
      return new self.object.Base64.Decoder(true, false);
    }
    self.object.Base64.Decoder.RFC2045 = function() {
      return new self.object.Base64.Decoder(false, true);
    },
    self.object.Base64.Decoder.prototype = {
      fromBase64: Array(256),
      fromBase64URL: Array(256),
      staticArrays: function() {
        this.fromBase64.fill(-1);
        this.fromBase64URL.fill(-1);

        var n = 64;
        while(--n >= 0) {
          this.fromBase64[self.object.Base64.Encoder.prototype.toBase64[n].charCodeAt(0)] = n;
          this.fromBase64URL[self.object.Base64.Encoder.prototype.toBase64URL[n].charCodeAt(0)] = n;
        }
        this.fromBase64[61] = this.fromBase64URL[61] = -2;

        delete this.staticArrays;
      },
      outLength: function(src, sp, sl) {
          var base64 = this.isURL ? this.fromBase64URL : this.fromBase64;
          var paddings = 0;
          var len = sl - sp;
          if (len === 0) return 0;
          if (len < 2) {
            if (this.isMIME && base64[0] === -1) return 0;
            throw new TypeError("Input byte[] should at least have 2 bytes for base64 bytes");
          }
          if (this.isMIME) {
            // scan all bytes to fill out all non-alphabet. a performance
            // trade-off of pre-scan or Arrays.copyOf
            var n = 0;
            while (sp < sl) {
              var b = src[sp++] & 0xff;
              if (b === 61) { // =
                len -= (sl - sp + 1);
                break;
              }
              if ((b = base64[b]) === -1) n++;
            }
            len -= n;
          } else {
            if (src[sl - 1] === 61) {
              paddings++;
              if (src[sl - 2] === 61) paddings++;
            }
          }
          if (paddings === 0 && (len & 0x3) !== 0)
            paddings = 4 - (len & 0x3);
          return 3 * (((len + 3) / 4)|0) - paddings;
      },
      decode: function(src, dst, sp, sl) {
        var il = src.length;
        if(dst !== undefined) {
          if(il === 0) return 0;
          
          sp = Number(sp), sl = Number(sl);
          if(isNaN(sp)) sp = 0;
          if(isNaN(sl)) sl = il;

          return this.decode0(src, sp, sl, dst);
        }
        
        if(il === 0) return [];

        sp = Number(sp), sl = Number(sl);
        if(isNaN(sp)) sp = 0;
        if(isNaN(sl)) sl = il;

        var dst = Array(this.outLength(src, 0, il));
        this.decode0(src, sp, sl, dst);

        return dst;
      },
      decode0: function(src, sp, sl, dst) {
        var base64 = this.isURL ? this.fromBase64URL : this.fromBase64;
        var dp = 0;
        var bits = 0;
        var shiftto = 18; // pos of first byte of 4-byte atom
        while (sp < sl) {
          var b = src[sp++] & 0xff;
          if ((b = base64[b]) < 0) {
            if (b === -2) {         // padding byte '='
              // =     shiftto==18 unnecessary padding
              // x=    shiftto==12 a dangling single x
              // x     to be handled together with non-padding case
              // xx=   shiftto==6&&sp==sl missing last =
              // xx=y  shiftto==6 last is not =
              if (shiftto === 6 && (sp === sl || src[sp++] !== 61) || // =
                shiftto === 18) {
                throw new TypeError("Input byte array has wrong 4-byte ending unit");
              }
              break;
            }
            if (this.isMIME) // skip if for rfc2045
              continue;
            else
              throw new TypeError("Illegal base64 character " + src[sp - 1].toString(16));
          }
          bits |= (b << shiftto);
          shiftto -= 6;
          if (shiftto < 0) {
            dst[dp++] = (bits >> 16) % 256; // 256 is the range of a byte ([-128, 127]) + 1 used for cast to byte
            dst[dp++] = (bits >>  8) % 256;
            dst[dp++] = bits % 256;
            shiftto = 18;
            bits = 0;
          }
        }
        // reached end of byte array or hit padding '=' characters.
        if (shiftto === 6) dst[dp++] = (bits >> 16) % 256;
        else if (shiftto === 0) {
          dst[dp++] = (bits >> 16) % 256;
          dst[dp++] = (bits >>  8) % 256;
        } else if (shiftto === 12) {
          // dangling single "x", incorrectly encoded.
          throw new TypeError("Last unit does not have enough valid bits");
        }
        // anything left is invalid, if is not MIME.
        // if MIME, ignore all non-base64 character
        while (sp < sl) {
          if (this.isMIME && base64[src[sp++]] < 0) continue;
          throw new TypeError("Input byte array has incorrect ending byte at " + sp);
        }
        return dp;
      },
      decodeString: function(str, sp, sl) {
        var il = str.length;
        if(il === 0) return "";
        
        sp = Number(sp), sl = Number(sl);
        if(isNaN(sp)) sp = 0;
        if(isNaN(sl)) sl = il;

        return this.decodeString0(str, sp, sl);
      },
      decodeString0: function(str, sp, sl) {
        /* slower way (2 loops => 5 loops):
        var dst = Array(this.outLength(str, 0, str.length));
        this.decode0(PL.string.toBytesArray(str), sp, sl, dst);
        return PL.string.fromBytesArray(dst);
        */
        var base64 = this.isURL ? this.fromBase64URL : this.fromBase64;
        var bits = 0;
        var shiftto = 18;
        var result = "";
        while (sp < sl) {
          var b = str.charCodeAt(sp++) & 0xff;
          if ((b = base64[b]) < 0) {
            if (b === -2) {
              if (shiftto === 6 && (sp === sl || str.charAt(sp++) !== '=') ||
                shiftto === 18) {
                throw new TypeError("Input byte array has wrong 4-byte ending unit");
              }
              break;
            }
            if (this.isMIME) continue;
            else
              throw new TypeError("Illegal base64 character " + str.charCodeAt(sp - 1).toString(16));
          }
          bits |= (b << shiftto);
          shiftto -= 6;
          if (shiftto < 0) {
            result += String.fromCharCode((bits >> 16) % 256);
            result += String.fromCharCode((bits >>  8) % 256);
            result += String.fromCharCode(bits % 256);
            shiftto = 18;
            bits = 0;
          }
        }
        if (shiftto === 6) result += String.fromCharCode((bits >> 16) % 256);
        else if (shiftto === 0) {
          result += String.fromCharCode((bits >> 16) % 256);
          result += String.fromCharCode((bits >>  8) % 256);
        } else if (shiftto === 12)
          throw new TypeError("Last unit does not have enough valid bits");
        while (sp < sl) {
          if (this.isMIME && base64[str.charCodeAt(sp++)] < 0) continue;
          throw new TypeError("Input byte array has incorrect ending byte at " + sp);
        }
        return result;
      }
    },
    self.object.Base64.Decoder.prototype.staticArrays();

    // wrapper of bigInt include more functions and convertions between long, int, short, byte...
    self.object.BigInteger = function() {
      var l = arguments.length;
      if(l === 1) {
        var head = arguments[0];
        switch(typeof head) {
          case 'number': this.value = head; break;
          case 'bigint': this.value = head; break;
          case 'object':
            if(head instanceof Array)
              this.__construct.fArray.call(this, head);
            break;
        }
      } else if(l === 2) {
        this.__construct.fSM.apply(this, arguments);
      } else throw new TypeError("Invalid arguments");
    },
    self.object.BigInteger.from = function(x, wrapper) {
      return wrapper === undefined || wrapper === true ? new self.object.BigInteger(x) : BigInt(x);
    },
    self.object.BigInteger.prototype = {
      __construct: {
        fSM: function(signum, magnitude) {
          this.mag = PL.number.byte.alis(magnitude) ? this._stripLeadingZeroBytes(magnitude)
                                                    : this._stripLeadingZeroInts(magnitude);

          if (signum < -1 || signum > 1)
            throw new TypeError("Invalid signum value");

          if (this.mag.length === 0) this.signum = 0;
          else {
            if (signum === 0)
              throw new TypeError("signum-magnitude mismatch");
            this.signum = signum;
          }
          if (this.mag.length >= this.MAX_MAG_LENGTH)
            throw new TypeError("BigInteger would overflow supported range");
        },
        fArray: function(array) {
          if (array.length === 0)
            throw new TypeError("Zero length BigInteger");
  
          if (array[0] < 0) {
            this.mag = this._makePositive(array);
            this.signum = -1;
          } else {
            this.mag = PL.number.byte.alis(array) ? this._stripLeadingZeroBytes(array)
                                                  : this._stripLeadingZeroInts(magnitude)
            this.signum = this.mag.length === 0 ? 0 : 1;
          }
          if (this.mag.length >= this.MAX_MAG_LENGTH)
            throw new TypeError("BigInteger would overflow supported range");
        }
      },
      LONG_MASK: 0xffffffff,
      _makePositive: function(a) { // byte array
        var keep, k;
        var byteLength = a.length;

        // Find first non-sign (0xff) byte of input
        for (keep=0; keep < byteLength && a[keep] === -1; keep++) ;

        /* Allocate output array.  If all non-sign bytes are 0x00, we must
         * allocate space for one extra output byte. */
        for (k=keep; k < byteLength && a[k] === 0; k++) ;

        var extraByte = (k === byteLength) ? 1 : 0;
        var intLength = ((byteLength - keep + extraByte) + 3) >>> 2;
        var result = Array(intLength);

        /* Copy one's complement of input into output, leaving extra
         * byte (if it exists) === 0x00 */
        var b = byteLength - 1;
        for (var i = intLength-1; i >= 0; i--) {
          result[i] = a[b--] & 0xff;
          var numBytesToTransfer = Math.min(3, b-keep+1);
          if (numBytesToTransfer < 0) numBytesToTransfer = 0;
          for (var j=8; j <= 8*numBytesToTransfer; j += 8)
            result[i] |= ((a[b--] & 0xff) << j);

          // Mask indicates which bits must be complemented
          var mask = -1 >>> (8*(3-numBytesToTransfer));
          result[i] = ~result[i] & mask;
        }

        // Add one to one's complement to generate two's complement
        for (var i=result.length-1; i >= 0; i--) {
          result[i] = PL.number.int.lfrom((result[i] & this.LONG_MASK) + 1);
          if (result[i] != 0) break;
        }

        return result;
      },
      _stripLeadingZeroInts: function(val) {
        var vlen = val.length;
        var keep;

        // Find first nonzero byte
        for (keep = 0; keep < vlen && val[keep] === 0; keep++) ;
        return PL.array.copyOfRange(val, keep, vlen);
      },
      _stripLeadingZeroBytes: function(a) { // byte array
        var byteLength = a.length;
        var keep;

        // Find first nonzero byte
        for (keep = 0; keep < byteLength && a[keep] === 0; keep++) ;

        // Allocate new array and copy relevant part of input array
        var intLength = ((byteLength - keep) + 3) >>> 2;
        var result = Array(intLength);
        var b = byteLength - 1;
        for (var i = intLength-1; i >= 0; i--) {
          result[i] = a[b--] & 0xff;
          var bytesRemaining = b - keep + 1;
          var bytesToTransfer = Math.min(3, bytesRemaining);
          for (var j=8; j <= (bytesToTransfer << 3); j += 8)
            result[i] |= ((a[b--] & 0xff) << j);
        }
        return result;
      },
      _signInt: function() {
        return this.signum < 0 ? -1 : 0;
      },
      _firstNonzeroIntNum: function() {
        var fn = firstNonzeroIntNum - 2;
        if (fn === -2) { // firstNonzeroIntNum not initialized yet
          fn = 0;

          // Search for the first nonzero int
          var i;
          var mlen = this.mag.length;
          for (i = mlen - 1; i >= 0 && this.mag[i] === 0; i--) ;
          fn = mlen - i - 1;
          firstNonzeroIntNum = fn + 2; // offset by two to initialize
        }
        return fn;
      },
      getInt: function(n) {
        if (n < 0) return 0;
        if (n >= this.mag.length) return this._signInt();

        var magInt = this.mag[this.mag.length-n-1];

        return (signum >= 0 ? magInt :
               (n <= this.firstNonzeroIntNum() ? -magInt : ~magInt));
      },
      toLong: function(x) {
        var result = 0n;

        for (var i = 1; i >= 0; i--)
          result = (result << 32n) + (this.getInt(x) & this.LONG_MASK);

        return result;
      }
    };
    (function() {
      var _ = {
        MIN_VALUE: -0x8000000000000000,
        MAX_VALUE:  0x7fffffffffffffff,
        MOD_VALUE:  0x10000000000000000
      };

      _.N_MIN_VALUE = BigInt(_.MIN_VALUE),
      _.N_MAX_VALUE = BigInt(_.MAX_VALUE),
      _.N_MOD_VALUE = BigInt(_.MOD_VALUE);
      
      self.object.Long = function(x) {
        if('Long' in this) return self.object.Long.from(x);
        this.value = self.object.Long.from(x);
      },
      // prefix signification:
      // b = bigInt
      // l = loss precision (64 bit floating decimal)
      // m(b|l) = like l but work with all number (due to boundary of Number#(MAX|MIN)_SAFE_INTEGER)
      // if you didn't know the parameter us m method instead of l
      // when m method doesn't exist it mean that l method work on all number
      // no prefix = check the range of the value and use b method or l method
      new self.object.Class(self.object.Long).generate(_, {
        // use this when you don't know the value of x
        // avoid calcul of x when x is rounded
        // for example: Number.MAX_VALUE-500000 === Number.MAX_VALUE cause 50000 is realy small and it's rounded
        // so you can use a bigInt conversion: from(BigInt(Number.MAX_VALUE)-500000n)
        // use also this conversion if x can overflow the limit of safe integer
        // if the number is know you can directly use x'n' notation
        // try to return always a number even bigint is passed as argument
        // but when args isn't in safe integer range the big associed value is returned;
        // if x isn't a number or bigint this convert it to number
        // from method are equivalent to cast in other langage
        from: function(x) {
          if(typeof x === 'bigint') {
            if(x >= PL.number.bigint.MIN_SAFE_INTEGER - 1n && x <= PL.number.bigint.MAX_SAFE_INTEGER + 1n) return this.lfrom(Number(x));
            return this.bfrom(x);
          }
          if(x >= Number.MIN_SAFE_INTEGER - 1 && x <= Number.MAX_SAFE_INTEGER + 1) return this.lfrom(x);
          return this.bfrom(BigInt(x));
        },
        // use this when your value is bigger of 9007199254740992 (2^53) to have an accurate result
        bfrom: function(x) {
          return x % _.N_MOD_VALUE;
        },
        // use this when your value is less or equals than 9007199254740992 (2^53) to avoid conversion
        lfrom: function(x) {
          return x % _.MOD_VALUE;
        },
        // see #from
        // method = Number|BigInt (normalize array)
        afrom: function(array, method) {
          var len = array.length;
          var isBigInt = method === 'BigInt';
          var result = isBigInt ? 0n : 0;
          var hasMethod = method !== undefined;
          while(len-- !== 0) result += hasMethod ? window[method](array[len]) : array[len];
          return isBigInt ? this.bfrom(result) : this.lfrom(result);
        },
        // see #bfrom
        abfrom: function(array) {
          var len = array.length;
          var result = 0n;
          while(len-- !== 0) result += array[len];
          return Number(this.bfrom(result));
        },
        // see #afrom
        alfrom: function(array) {
          var len = array.length;
          var result = 0;
          while(len-- !== 0) result += array[len];
          return this.lfrom(result);
        },
        // see #from
        is: function(x) {
          return typeof x === 'bigint' ? this.bis(x) : this.lis(x);
        },
        // see #bfrom
        bis: function(x) {
          return x >= _.N_MIN_VALUE && x <= _.N_MAX_VALUE;
        },
        // see #lfrom
        lis: function(x) {
          // for performance:
          // !(x < MIN_VALUE || x > MAX_VALUE)
          return x >= _.MIN_VALUE && x <= _.MAX_VALUE;
        },
        // see #from, value is the first element of array
        ais: function(x) {
          return this.is(x[0]);
        },
        // see #bfrom, value is the first element of array
        abis: function(x) {
          return this.bis(x[0]);
        },
        // see #lfrom, value is the first element of array
        alis: function(x) {
          return this.lis(x[0]);
        }
      });
      self.object.Long.prototype = {
      };
    })();

    (function() {
      var _ = {
        MIN_VALUE: -0x80000000,
        MAX_VALUE:  0x7fffffff,
        MOD_VALUE:  0x100000000
      };

      _.N_MIN_VALUE = BigInt(_.MIN_VALUE),
      _.N_MAX_VALUE = BigInt(_.MAX_VALUE),
      _.N_MOD_VALUE = BigInt(_.MOD_VALUE);
      
      self.object.Integer = function(x) {
        if('Integer' in this) return self.object.Integer.from(x);
        this.value = self.object.Integer.from(x);
      },
      new self.object.Class(self.object.Integer).generate(_, {
        // see long#from
        from: function(x) {
          return typeof x === 'bigint' ? this.bfrom(x) : this.lfrom(x);
        },
        bfrom: function(x) {
          return Number(x % _.N_MOD_VALUE);
        },
        lfrom: function(x) {
          return x % _.MOD_VALUE;
        },
        // see #from
        afrom: function(array) {
          var len = array.length;
          var result = 0;
          while(--len !== 0) result += Number(array[len]);
          return this.lfrom(result);
        },
        // see #bfrom
        abfrom: function(array) {
          var len = array.length;
          var result = 0n;
          while(--len !== 0) result += array[len];
          return Number(this.bfrom(result));
        },
        // see #afrom
        alfrom: function(array) {
          var len = array.length;
          var result = 0;
          while(--len !== 0) result += array[len];
          return this.lfrom(result);
        },
        // see #from
        is: function(x) {
          return typeof x === 'bigint' ? this.bis(x) : this.lis(x);
        },
        bis: function(x) {
          return x >= _.N_MIN_VALUE && x <= _.N_MAX_VALUE;
        },
        lis: function(x) {
          return x >= _.MIN_VALUE && x <= _.MAX_VALUE;
        },
        // see #from, value is the first element of array
        ais: function(x) {
          return this.is(x[0]);
        },
        // see #bfrom, value is the first element of array
        abis: function(x) {
          return this.bis(x[0]);
        },
        // see #afrom, value is the first element of array
        alis: function(x) {
          return this.lis(x[0]);
        }
      });
      self.object.Integer.prototype = {

      };
    })();

    (function() {
      var _ = {
        MIN_VALUE: -32768,
        MAX_VALUE:  32767,
        MOD_VALUE:  65536
      };

      _.N_MIN_VALUE = BigInt(_.MIN_VALUE),
      _.N_MAX_VALUE = BigInt(_.MAX_VALUE),
      _.N_MOD_VALUE = BigInt(_.MOD_VALUE);

      self.object.Short = function(x) {
        if('Short' in this) return self.object.Short.from(x);
        this.value = self.object.Short.from(x);
      },
      new self.object.Class(self.object.Short).generate(_, {
        from: function(x) {
          return typeof x === 'bigint' ? this.bfrom(x) : this.lfrom(x);
        },
        bfrom: function(x) {
          return Number(x % _.N_MOD_VALUE);
        },
        lfrom: function(x) { // used for example with charCode and codePoint
          return x % _.MOD_VALUE; // = string.char.MIN_SUPPLEMENTARY_CODE_POINT
        },
        // see #from
        afrom: function(array) {
          var len = array.length;
          var result = 0;
          while(--len !== 0) result += Number(array[len]);
          return this.lfrom(result);
        },
        // see #bfrom
        abfrom: function(array) {
          var len = array.length;
          var result = 0n;
          while(--len !== 0) result += array[len];
          return Number(this.bfrom(result));
        },
        // see #afrom
        alfrom: function(array) {
          var len = array.length;
          var result = 0;
          while(--len !== 0) result += array[len];
          return this.lfrom(result);
        },
        // see #from
        is: function(x) {
          return typeof x === 'bigint' ? this.bis(x) : this.lis(x);
        },
        bis: function(x) {
          return x >= _.N_MIN_VALUE && x <= _.N_MAX_VALUE;
        },
        lis: function(x) {
          return x >= _.MIN_VALUE && x <= _.MAX_VALUE;
        },
        // see #from, value is the first element of array
        ais: function(x) {
          return this.is(x[0]);
        },
        // see #bfrom, value is the first element of array
        abis: function(x) {
          return this.bis(x[0]);
        },
        // see #afrom, value is the first element of array
        alis: function(x) {
          return this.lis(x[0]);
        }
      });
      self.object.Short.prototype = {

      };
    })();

    (function() {
      var _ = {
        MIN_VALUE: -128,
        MAX_VALUE:  127
      };

      _.N_MIN_VALUE = BigInt(_.MIN_VALUE),
      _.N_MAX_VALUE = BigInt(_.MAX_VALUE);

      self.object.Byte = function(x) {
        if('Byte' in this) return self.object.Byte.mfrom(x);
        this.value = self.object.Byte.mfrom(x);
      },
      new self.object.Class(self.object.Byte).generate(_, {
        from: function(x) {
          return typeof x === 'bigint' ? this.bfrom(x) : this.lfrom(x);
        },
        bfrom: function(x) {
          if(this.bis(x)) return x;
          return this.prototype._bfrom(x);
        },
        lfrom: function(x) {
          if(this.lis(x)) return x;
          return this.prototype._lfrom(x);
        },
        mfrom: function(x) {
          return typeof x === 'bigint' ? this.mbfrom(x) : this.mlfrom(x);
        },
        mbfrom: function(x) {
          if(this.mbis(x)) return x;
          return this.prototype._bfrom(x);
        },
        mlfrom: function(x) {
          if(this.mlis(x)) return x;
          return this.prototype._lfrom(x);
        },
        // see #lfrom
        afrom: function(array) {
          return this.lfrom(this.prototype._afrom(array));
        },
        // see #bfrom
        abfrom: function(array) {
          return Number(this.bfrom(this.prototype._axfrom(array, 0n)));
        },
        // see #lfrom
        alfrom: function(array) {
          return this.lfrom(this.prototype._axfrom(array, 0));
        },
        // see #mlfrom, #lis
        amfrom: function(array) {
          return this.mlfrom(this.prototype._afrom(array));
        },
        // see #mbfrom, #lis
        ambfrom: function(array) {
          return Number(this.mbfrom(this.prototype._axfrom(array, 0n)));
        },
        // see #mlfrom, #lis
        amlfrom: function(array) {
          return this.mlfrom(this.prototype._axfrom(array, 0));
        },
        // see #from
        is: function(x) {
          return typeof x === 'bigint' ? this.bis(x) : this.lis(x);
        },
        bis: function(x) {
          if(x < 0n) x = -x - 1n;
          return x >> 7n === 0n;
        },
        // use this for value between boundary of Number.MAX|MIN_SAFE_INTEGER
        // otherwise use mis
        lis: function(x) {
          // optimized form of x >= _.MIN_VALUE && x <= _.MAX_VALUE;
          if(x < 0) x = -x - 1;
          return x >>> 7 === 0; // right shift 7 distance is calculed by the equation  1 << x = -MIN_VALUE (128)
        },
        // see #lis
        mis: function(x) {
          return typeof x === 'bigint' ? this.mbis(x) : this.mlis(x);
        },
        // see #lis
        mbis: function(x) {
          return x >= _.N_MIN_VALUE && x <= _.N_MAX_VALUE;
        },
        // see #lis
        mlis: function(x) {
          return x >= _.MIN_VALUE && x <= _.MAX_VALUE;
        },
        // see #from, value is the first element of array
        ais: function(x) {
          return this.is(x[0]);
        },
        // see #bfrom, value is the first element of array
        abis: function(x) {
          return this.bis(x[0]);
        },
        // see #afrom, value is the first element of array
        alis: function(x) {
          return this.lis(x[0]);
        },
        // see #from, value is the first element of array, #lis
        amis: function(x) {
          return this.mis(x[0]);
        },
        // see #bfrom, value is the first element of array, #lis
        ambis: function(x) {
          return this.mbis(x[0]);
        },
        // see #afrom, value is the first element of array, #lis
        amlis: function(x) {
          return this.mlis(x[0]);
        }
      });
      self.object.Byte.prototype = {
        _bfrom: function(x) { // used by bfrom/mbfrom
          if(x < 0) x = -x;
          return Number((x - (-_.N_MIN_VALUE<<1n)) % -_.N_MIN_VALUE);
        },
        _lfrom: function(x) { // used by lfrom/mlfrom
          if(x < 0) x = -x;
          return ((x - (-_.MIN_VALUE<<1)) % -_.MIN_VALUE)|0; // |0 is to avoid -0
        },
        _afrom: function(array) { // used by afrom/amfrom
          var len = array.length;
          var result = 0;
          while(--len !== 0) result += Number(array[len]);
          return result;
        },
        _axfrom: function(array, result) { // used by amlfrom/ambfrom/alfrom/abfrom
          var len = array.length;
          while(--len !== 0) result += array[len];
          return result;
        }
      };
    })();

    (function() {
      var _ = {
        MIN_VALUE: 0,
        MAX_VALUE: 1
      };

      _.N_MIN_VALUE = BigInt(_.MIN_VALUE),
      _.N_MAX_VALUE = BigInt(_.MAX_VALUE);

      self.object.Bit = function(x) {
        if('Bit' in this) return self.object.Bit.from(x);
        this.value = self.object.Bit.from(x);
      },
      new self.object.Class(self.object.Bit).generate(_, {
        from: function(x) {
          return typeof x === 'bigint' ? this.bfrom(x) : this.lfrom(x);
        },
        bfrom: function(x) {
          if(x < 0) x = -x;
          return Number(x % 2n);
        },
        lfrom: function(x) {
          if(x < 0) x = -x;
          return x % 2;
        },
        // see #from
        afrom: function(array) {
          var len = array.length;
          var result = 0;
          while(--len !== 0) result += Number(array[len]);
          return this.lfrom(result);
        },
        // see #bfrom
        abfrom: function(array) {
          var len = array.length;
          var result = 0n;
          while(--len !== 0) result += array[len];
          return Number(this.bfrom(result));
        },
        // see #afrom
        alfrom: function(array) {
          var len = array.length;
          var result = 0;
          while(--len !== 0) result += array[len];
          return this.lfrom(result);
        },
        // see #from
        is: function(x) {
          return typeof x === 'bigint' ? this.bis(x) : this.lis(x);
        },
        bis: function(x) {
          return x === 0n || x === 1n;
        },
        lis: function(x) {
          return x === 0 || x === 1;
        },
        // see #from, value is the first element of array
        ais: function(x) {
          return this.is(x[0]);
        },
        // see #bfrom, value is the first element of array
        abis: function(x) {
          return this.bis(x[0]);
        },
        // see #afrom, value is the first element of array
        alis: function(x) {
          return this.lis(x[0]);
        }
      });
      self.object.Bit.prototype = {

      };
    })();

    /* Arithmetic calcul result
    // you can pass number in 2nd argument a number to replace x or an object with key=>value: char key is replaced by number value
    // the third argument is passed to true if you want the native method instead of pipnet.module.polyfill.math use directly Object window.Math  
      Eval is used in intern after these transformations:
      . |x| is equivalent to Math.abs(x); (bit or operator are replaced by escaped string ||)
      . x¹ is same that x cause power of one
      . x² is equivalent to Math.pow(x, 2);
      . x³ is equivalent to Math.pow(x, 3);
      . x^y is equivalent to Math.pow(x, y); (bit xor operator are replaced by escaped string ^^)
      . x**y is quivalent to Math.pow(x, y); (polyfill of ** javascript operator for IE)
      . ½ is equivalent to 1/2
      . ¼ is equivalent to 1/4
      . ¾ is equivalent to 3/4
      . x° is used to convert value from radians to degrees (see #math.toDegrees)
      . default namespace for property and method are Math then Number and finally window: pi = Math.PI
      . allow implicit multiplication before parenthese: x(x + y) or (x + y)x
        and between a number and a letter: 5x => 5*x
        and between a number and a property or a method that result a number: 2pi or 2sqrt(5)
      Options
        mode: strict, unable to enter an invalid radian (![0, 2pi]) or degree (![0, 360])
        mode: soft, default invalid radian or degree are converted for example 361° = 1° (361%max)
    */
    self.object.ArithmeticEvaluation = function(str) {
      this.str = str;
      this.len = str.length;
      if(this.len === 0) return 0;
      this.charCache = Array(this.len); // for large input (avoid redundant charAt cause this method loop on all char of string while index isn't reached)
      this.abs = false, this.absStr = "";
      this.m = false, this.mStr = "";
      this.result = "";

      var char;
      var cursor = 0;
      do {
        char = this.charAt(cursor, true);
        if(this.m) {
          if(this.endProperty(char)) {
            this.m = false;
            this.appendOnBuffer(this.evalFunction(this.mStr, this.str)); // allow pi²
            //continue;
          }
        }

        if(char === '|' && this.charAt(cursor + 1) === '|') {
          i++;
          this.appendOnBuffer(char);
          continue;
        }
        if(char === '|') {
          this.abs = !this.abs;
          console.log(this.absStr);
          if(!this.abs) {
            this.absStr = new pipnet.object.ArithmeticEvaluation(this.absStr).result;
            if(this.absStr < 0) this.absStr = -this.absStr;
            this.result += this.absStr;
            this.absStr = "";
          }
          continue;
        }

        if(char === '¹') continue; // ignore power of 1
        
        if(char === '^' && this.charAt(cursor + 1) === '^') { // escape of ^ bit operator
          i++;
          this.appendOnBuffer(char);
          continue;
        }
        if(char === '^' || (char === '*' && this.charAt(cursor + 1) === '*') || char === '°' || char === '²' || char === '³') {
          var lf;
          var fl = this.retrieveFlux(), lfl = fl.length;
          console.log(fl);
          if(char !== '°') {
            var power = 2;
            var doubleStars = char === '*';
            if(char === '^' || doubleStars) { // search power after ^ allow (x) and x
              if(doubleStars) cursor++;
              var m = this.findPower(this.str, cursor, this.len);
              power = m.value;
              cursor += m.totalLength;
            } else if(char === '³') power = 3;
            console.log(fl, lfl);
            lf = this.evalPower(fl, lfl, lfl, power);
          } else
            lf = this.evalRadians(fl, lfl, lfl);
          
          var current = fl;

          var start = lf.start;
          if(this.abs) start--; // avoid | extra char

          if(lf.value < 0) { // avoid increment/decrement operator (--/++) before negative result of square
            var before = current.charAt(start-1);
            if(before === '-' || before === '+') start--;
          }

          console.log(current, lf);
          var newCurrent = current.substring(0, start) +
                            lf.value +
                            current.substring(lf.end);
          console.log(newCurrent, char);

          if(this.abs) this.absStr = newCurrent;
          else this.result = newCurrent;
          continue;
        }

        // rad unity
        if(char === 'r') {
          if(this.charAt(cursor + 1) === 'a' && this.charAt(cursor + 2) === 'd') {
            var fl = this.retrieveFlux(), lfl = fl.length;
            this.appendOnBuffer(this.evalDegrees(fl, lfl, lfl));
            cursor+=2;
            continue;
          }
        }

        // allow implicit multiplication x(x + y)
        if((cursor !== 0 && char === '(') || (cursor !== this.len -1 && char === ')')) {
          var left = char === '(';
          var juxt = this.charAt(cursor + (left ? -1 : 1));
          if(this.isDigit(juxt)) this.appendOnBuffer(left ? '*' + char : char + '*');
          else this.appendOnBuffer(char);
          continue;
        }

        if(!this.abs && !this.m && this.isAlphabet(char)) this.m = true;

        this.translateUnicodeSymbol(char, function(value) {
          char = value;
        });
        this.appendOnBuffer(char);
      } while(++cursor < this.len);
      if(this.m) this.result += this.evalFunction(this.mStr, this.str);
      console.log(this.result);
      this.result = eval(this.result);
    },
    self.object.ArithmeticEvaluation.prototype = {
      charAt: function(index, readCache) {
        if(!readCache) return this.charCache[index] = this.str.charAt(index);
        return this.charCache[index] || this.str.charAt(index);
      },
      // this is used to create a save of a buffer or to lock a buffer...
      appendOnBuffer: function(char) {
        if(this.abs) return this.absStr += char;
        if(this.m) return this.mStr += char;
        return this.result += char;
      },
      // retrieve the current flux temp buffer or saved buffer
      retrieveFlux: function() {
        if(this.abs) return this.absStr;
        if(this.m) return this.mStr;
        return this.result;
      },
      // retrieve the flux including saved buffer and temp buffer
      retrieveTotalFlux: function() {
        if(this.abs) return this.result + this.absStr;
        if(this.m) return this.result + this.mStr;
        return this.result;
      },
      translateUnicodeSymbol: function(char, callback) {
        if(char === '½') return callback(.5, 3);
        if(char === '¼') return callback(.25, 4);
        if(char === '¾') return callback(.75, 4);
      },
      translateUnicodeSymbolR: function(char) {
        return this.translateUnicodeSymbol(char, function(value, totalLength) {
          return {'value': value, 'totalLength': totalLength};
        });
      },
      // valid strict function with US-ASCII char and _
      // property is here: a function or a key=>value
      endProperty: function(char) {
        if(this.inParam) {
          if(char === ')') delete this.inParam;
          return false;
        }
        if(this.isAlphabet(char) || this.isDigit(char) ||
            char === '.' || char === '_') return false;

        if(char === '(') {
          this.inParam = true;
          return false;
        }
        return true;
      },
      parseProperty: function(str) { // take x(y)
        var p1 = str.lastIndexOf('('), p2 = str.lastIndexOf(')');
        if(p1 === -1 || p2 !== str.length -1) return {name: str};

        var namedKey = str.indexOf(']', p1-1);
        if(namedKey !== -1 && p1 !== -1) {
          if(namedKey + 1 < p1) return {name: str}; // isn't equals to ](
        }

        return {name: str.substring(0, p1), params: str.substring(p1 + 1, p2)};
      },
      evalFunction: function(mStr, str) {
        var property = this.parseProperty(mStr);

        var key = property.name;
        var uKey = key.toUpperCase();

        var result = key;
        var um = uKey in Math;
        if(um || uKey in Number) { // CONSTANT priority (normalized)
          if(um) result = "Math."+uKey;
          else result = "Number."+uKey;
        } else {
          if(key in Math) result = "Math."+key;
          else if(key in Number) result = "Number."+key;
        }
        if('params' in property) {
          result += '(';
          var args = property.params.split(',');
          for(var i = 0, l = args.length; i < l; i++) {
            if(i !== 0) result += ',';
            result += new pipnet.object.ArithmeticEvaluation(args[i]).result; // allow acr in 
          }
          result += ')';
        }
        console.log(result);
        var cast = Number(eval(result));
        if(isNaN(cast)) return result;

        var beforeChar = str.charAt(str.length-mStr.length-1);
        if(this.isDigit(beforeChar)) cast = '*' + cast; // when digit before method and method result is number use implicit multiplication
        return cast;
      },
      isDigit: function(char) {
        return char >= '0' && char <= '9';
      },
      isAlphabet: function(char) {
        return (char >= 'a' && char <= 'z') ||
               (char >= 'A' && char <= 'Z');
      },
      search: function(nbCallback, scCallback, usCallback, err, str, index, len, reverse, allowDecimal) {
        var char = str.charAt(index);
        if(char === '') throw new TypeError(err);

        var o = {};
        console.log("ch " + char);
        if(this.isDigit(char) || char === '-') {
          var nb = this.searchRawNumberOf(str, char, index, len, reverse, allowDecimal);
          console.log(nb);
          o.value = nb.value, nbCallback(o, nb);
        } else if(char === (reverse ? ')' : '(')) {
          var scope = this.searchScopeOf(str, index, len, reverse);
          console.log(scope);
          //if(reverse) this.cursor++; // pass ) char
          o.value = new pipnet.object.ArithmeticEvaluation(scope.value).result, scCallback(o, scope);
        } else {
          var unicode = this.translateUnicodeSymbolR(char);
          if(unicode !== undefined) o.value = unicode.value, usCallback(o, unicode);
          else throw new TypeError(err);
        }
        return o;
      },
      findPower: function(str, i, len) { // x^?
        return this.search(
          function(o, number) {
            o.totalLength = number.value.length;
          },
          function(o, scope) {
            o.totalLength = scope.length+2; /* include ( and ) of scope */
          },
          function(o, unicode) {
            o.totalLength = unicode.totalLength;
          },
          "Power on an empty number isn't allowed"
        , str, i+1, len, false, true);
      },
      evalPower: function(str, i, len, power) {
        var o = this.search(
          function(o, nb) {
            o.start = nb.limit;
          },
          function(o, scope) {
            o.start = scope.close;
          },
          function(o) {
            o.start = 0;
          },
          "Power of an empty number isn't allowed"
        , str, i-1, len, true, true);
        o.value = Math.pow(o.value, power), o.end = i;
        return o;
      },
      evalRadians: function(str, i, len) {
        var o = this.search(
          function(o, nb) {
            o.value = Number(o.value);
            o.start = nb.limit;
          },
          function(o, scope) {
            o.start = scope.close;
          },
          function(o) {
            o.start = 0;
          },
          "Degree of an empty radian number isn't allowed"
        , str, i-1, len, true, true);
        o.value = PL.math._toDegrees(o.value), o.end = i;
        return o;
      },
      evalDegrees: function(str, i, len) {
        var index = i-1, before = str.charAt(index);
        if(before === '') throw new TypeError("Degree of an empty radian number isn't allowed"); // <empty>°

        if(this.isDigit(before)) {
          var nb = this.searchRawNumberOf(str, before, index, len, true, true);
          console.log(nb);
          return {type: 'number', value: PL.math.toRadians(Number(nb.value)), start: nb.limit, end: i};
        }
        if(before === ')') {
          var scope = this.searchScopeOf(str, index, len, true);
          console.log(scope);
          return {type: 'scope', value: PL.math.toRadians(eval(scope.value)), start: scope.close, end: i};
        }
        
        var unicode = this.translateUnicodeSymbolR(before);
        if(unicode !== undefined)
          return {type: 'usymbol', value: PL.math._toRadians(unicode.value), start: 0, end: 3};

        throw new TypeError("Degree of an empty radian number isn't allowed"); 
      },
      searchRawNumberOf: function(str, char, i, len, reverse, allowDecimal) {
        var max, buff, dp;
        if(!reverse) {
          max = len -1;
          buff = char;
        } else {
          max = 0;
          buff = Array(len);
          dp = len;
          buff[dp--] = char;
        }

        var isDecimal = false;
        while(i !== max) {
          char = str.charAt(reverse ? --i : ++i);
          
          if(char === '.') {
            if(!allowDecimal || isDecimal) {
              reverse ? i++ : i--; // when break before end, ignore last char
              break;
            }
            isDecimal = true;
          } else if(char < '0' || char > '9') {
            reverse ? i++ : i--;
            break;
          }

          !reverse ? buff += char : buff[dp--] = char;
        }
        return {value: reverse ? PL.string.fromCharsArray(buff) : buff, limit: i};
      },
      searchScopeOf: function(str, i, len, reverse) {
        var open = 1;
        var max, buff, dp;
        var closure = 0;
        if(!reverse) {
          max = len -1;
          buff = "";
        } else {
          max = 0;
          buff = Array(len -1);
          dp = len -1;
        }

        while(i !== max) {
          var char = str.charAt(reverse ? --i : ++i);
          switch(char) {
            case '(': !reverse ? open++ : open--; break;
            case ')': !reverse ? open-- : open++; break;
            default: !reverse ? buff += char : buff[--dp] = char; // trick when reverse use java string char array
          }

          console.log(i, open);
          if(open < 0) throw new TypeError("Missing ) or ( in parenthetical"); // overflow to many closures
        
          if(!reverse) {
            if(i + open > max) throw new TypeError("Missing ) or ( in parenthetical"); // not the space to continue (to many open closures) 
          } else {
            if(i - open < max) throw new TypeError("Missing ) or ( in parenthetical"); // not the space to continue (to many close closures) 
          }

          if(open === 0) {
            closure = i;
            break;
          }
        }
        return {value: reverse ? PL.string.fromCharsArray(buff) : buff, close: closure};
      }
    };

    pipmodule['locate'] = {
      name: "pipnet",
      version: 1.46,
      state: "PRE-RELEASE",
      type: "standalone"
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
            var alternateContext; // avoid redundant context in large array
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
        if(!(o instanceof Array)) callback.call(this, o.f, o.context);
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
          if browser (like IE 5) doesn't have addEventListener (there are not attachEvent for XMLHttpRequest)
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
         
      // {url: URL, method: 'HEAD|GET|POST|PUT|DELETE', data: {var1: value1}, async: true|false, useStandard: true|false, context: this, on[name of event]: function(req) {}}
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
        req.send(PL.array.indexOf(['GET', 'POST'], opt.method) === -1 ? null : opt.data); // data is only for GET/POST
        
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
        PL.object.iterate(_tempSelf, function(key) {
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
      //                      with '.INT' replacement is same that INT but add an extra dot at starting (4b = 4.b = 4.2) the returned value is always a Version object
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
    };

    /* methods depends of nav var */
    // userAgent can easily be spoofed with header/library config or other so for example the getLib can return null for cUrl if cUrl change its useragent and getBrowser can return null
    // for Chrome user because header can easily be changed in server side (php, ruby, j2ee, .net) or in client side with Ajax (xhr request)
    // only Googlebot replacement cannot be spoofed cause we check in server side the user ip that replace Chrome/W.X.Y.Z to Chromium/the real version
    var uA = navigator.userAgent || navigator.appVersion;
    (function(ID, INSIDE_REG, VALUE_REG) {
      if(!ID) throw new Error("pipnet << Unknown browser; please change your browser with a valid identifier like userAgent, name or vendor");
      if(!uA) console.warn("pipnet << Deprecated browser; please use a browser with a real userAgent and not only a vendor and a name");

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
              var uVersion = self._.parseUnsignedVersion(extra, unsignedVersionReplacement);
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
              var uVersion = self._.parseUnsignedVersion(frag, unsignedVersionReplacement);
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
      // check if documentMode is smaller that the userAgent string (if true the documentMode has efficient and usefull otherwise there is no emulation it's the real browser engine and its userAgent)

      /* if you use getVersion('IE').get() after ieCompatibilityMode() do instead (to speed up):
        * var gIE = getVersion('IE'); this will return null if called on other browser
        * if(gIE && ieCompatibilityMode0(gIE.vers)) // use gIE.get() here */
      // WARNING: use ieCompatibilityMode0 only if the user run on IE browser otherwise it will return false like ieCompatibilityMode but slowly
      uAO.ieCompatibilityMode0 = function(ieUaVers) {
        return Number(ieUaVers || this.getValue('rv') || this.getValue0('MSIE', " ")) > doc.documentMode;
      },
      uAO.ieCompatibilityMode = function(ieUaVers) {
        if(!('documentMode' in doc)) return false; // ignore if browser isn't IE
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
      // this is a default method if you want to supports more browser add it: if you find a result null for this method check that with existsVersion/existsKey
      uAO.getBrowser = function() {
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
          if(this.has('Win64; x64')) return {OS: '64', browser: '64'};
          if(this.existsKey0('WOW64')) return {OS: '64', browser: '32'};
          //ARM
        }
        if(self.useLinux && this.has('x86_64')) return {OS: '64', browser: '64'};
        if(this.getOS().endsWith('BSD') && this.has('amd64')) return {OS: '64', browser: '64'};
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
          if(PL.array.indexOf(this.values, prefix) !== -1) return prefix;
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
            else PL.object.iterate(this.classLoader, function(f) { this.classLoader[f](); }, this);
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
          // return null if not supported any version of TLS or browser is unknown
          // you can supports unknown browser with:
          /* var tls = TLS();
              if(tls) return tls;
              else {
                if(has('navID')) return "1.0";
                // unknown browser
              }
          */
          // ref: https://github.com/mail-in-a-box/user-agent-tls-capabilities/blob/master/clients.csv
          self.security = {
            // return the latest TLS version supported by the browser and NOT the website
            // return null for unknown
            // this is a default method if you want to supports more browser add it: if you find a result null for this method check that with existsVersion/existsKey
            // use parseFloat(x)/parseInt(x, 10) and not Number(x) to parse this value because value can have '-' that indicate the returned version is supported but disable by default or/and partial support
            // alternatively you can use pipnet.parseNumber(str, intOnly) that use your preference defined by strict field
            // set [draftVers] to false if you want only to ignore partial support/draft/disable by default of TLS version
            // WARNING: the returned supported version does not indicate that the lower versions are also supported
            // ref: https://caniuse.com
            // need more info for deprecated TLS 1.0
            TLS: function(draftVers) {
              if(draftVers == null) draftVers = true;
              var chromVers = uAO.getVersion(uAO.existsVersion('Chromium') ? 'Chromium' : 'Chrome');
              if(chromVers) { // this detect also for all browser that use chromium (opera, lastest edge version)
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
            // return the latest SSL version supported by the browser and NOT the website
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
      // to check if the browser can supports event do: pipnet.event.type > 0
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
          var h = PL.array.indexOf(mobile, type) === -1;
          if(PL.array.indexOf(pc, type) === -1 && h) throw new Error("pipnet << " + type + " isn't supported !");
          return !h ? (e.targetTouches || e.changedTouches || e.touches)[0] : e;
        },
        basicPointer: function(e) { // Shortcut
          var tar = this.coordTarget(e);
          return {x: tar['x'], y: tar['y']};
        },
        // type = client|page|offset|screen and all other implementation in future browser JS core
        // NOTE: layerX or layerY, movementX, movementY is located at root of the event object for desktop event it's why you don't need to use this to get it
        pointer: function(e, type) {
          var tar = this.coordTarget(e);
          return {x: tar[type + 'X'], y: tar[type + 'Y']};
        }
      }
    })();
    if(self.event.type === 0) throw new Error("pipnet << Deprecated browser; please update your browser [" + self.userAgent.id + "]");
    //maybe use scrollTop detection (performance)
    self.canMeasureHTML = html.clientHeight > 0; // BUG IE5 => In this case scrollTop/Left is always equals to 0, same for clientHeight/Width and scrollHeight/Width have wrong value only for html

    var _loadModules = function() {
      isInit = true;
      var hasDebugLoading = self.debug >= 2;
      var hasGoupAndDebugLoading = self.groupLog && hasDebugLoading;
      if(hasGoupAndDebugLoading) console.group("pipnet << Loading Core modules");
      PL.object.iterate(pipmodule, function(key) {
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
    PL.object.iterate(self.module, function(key) {
      if(key.indexOf('@') === -1) return;
      temp[key] = self.module[key];
    });
    console.debug("pipnet << List of active modules", temp);
  };

  /* Static functions */
  // option is an object ({writeInGlobal: @bool = true, writeSelfModule: @bool = false, disposeOption: @bool = true})
  self.exports = function(name, object, module, option) {
    if(!isInit) throw new ReferenceError("pipnet << API isn't loaded, the compilation of new module must be called after init function");
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
          PL.object.iterate(pipmodule, function(key) {
            var afterM = key.substr(7);
            var posM = PL.array.indexOf(array, afterM);
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

      PL.object.iterate(module, function(key) {
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
  api.defaultConfig = function(config, def) { // mergeObject : config > def
    PL.object.iterate(def, function(key) {
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