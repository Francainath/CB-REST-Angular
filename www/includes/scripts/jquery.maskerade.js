/*!
 * Maskerade jQuery Plug-in
 *
 * Copyright 2012 Giva, Inc. (http://www.givainc.com/labs/) 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * 	http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Date: 2012-02-03
 * Rev:  1.0.01
 */
;(function($){
	// set the version of the link select
	$.maskerade = {
		version: "1.0.01"
		, defaults: {
			  style: "maskerade"                // 
			, mask: ""                          // 
			, lang: "en"                        // i18n language package to use
			, keyBufferDelay: 1250              // delay to reset the keyboard buffer after mask input
			, init: null                        // callback that occurs when initialization starts
			, ready: null                       // callback that occurs once the plug-in is ready for use
			, changed: null                     // 
			, completed: null                   // 
			, corrected: null                   // 
			, invalid: null                     // 
			, keydown: null                     // 
			, keyup: null                       // 
			, keypress: null                    // 
			, formatMask: null                  // callback to format the mask (can be a string of toLowerCase() or toUpperCase())
		}
	};
	
	$.fn.maskerade = function(options) {
		var method = typeof arguments[0] == "string" && arguments[0];
		var args = method && Array.prototype.slice.call(arguments, 1) || arguments;

		// if a method is supplied, execute it for non-empty results
		if( method && this.length ){
			// get a reference to the first mask found
			var self = $.data(this[0], "maskerade");
			
			// if request a copy of the object, return it			
			if( method.toLowerCase() == "object" ) return self;
			// if method is defined, run it and return either it's results or the chain
			else if( self[method] ){
				// define a result variable to return to the jQuery chain
				var result;
				this.each(function (i){
					// apply the method to the current element
					var o = $.data(this, "maskerade"), r = o[method].apply(o, args);
					// if first iteration we need to check if we're done processing or need to add it to the jquery chain
					if( i == 0 && r ){
						// if this is a jQuery item, we need to store them in a collection
						if( !!r.jquery ){
							result = $([]).add(r);
						// otherwise, just store the result and stop executing
						} else {
							result = r;
							// since we're a non-jQuery item, just cancel processing further items
							return false;
						}
					// keep adding jQuery objects to the results
					} else if( !!r && !!r.jquery ){
						result = result.add(r);
					}
				});

				// return either the results (which could be a jQuery object) or the original chain
				return result;
			// everything else, return the chain
			} else return this;
		// initializing request
		} else {
			// create a new mask for each object found
			return this.each(function (){
				new Maskerade(this, options);
			});
		};
	};

	/*
	 * Configuration for multiple lanaguages
	 */
	$.maskerade.i18n = {
		en: {
			date: {
				  defaultMask:   "mm/dd/yyyy"
				, monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
				, monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
			}
		}
	};

	/*
	 * Maskerade
	 */
	var UNDEFINED, gid = 0;
	var Maskerade = function (el, options){
		// store a reference to this object w/the element
		$.data(el, "maskerade", this);

		// get options
		options = $.extend({}, $.maskerade.defaults, options);
		
		var self = this
			, cid = ++gid
			, $input = $(el)
			, hasClickEvent = false
			, hasFocus = false
			, hasPaste = false
			, previousValue
				;
		
		// invoke the init callback
		if( $.isFunction(options.init) ) options.init.apply(this, [$input, options]);
		
		// get/set the value of the field
		this.val = function (val){
			// set the value
			if( arguments.length ) return this.mask.setValue(val);
			return this.mask.getValue();
		};
		
		// destroy the plug-in
		this.destroy = function (callback){
			// trigger the callback
			if( $.isFunction(callback) ) callback.apply(this, [$input]);

			if( "destroy" in this.mask ) this.mask.destroy();

			$input.unbind(".maskerade");
			// delete the maskerade object
			$.data(el, "maskerade", null);
		};
		
		// checks if the input has focus
		this.hasFocus = function (val){
			return hasFocus;
		};
		
		// determines if the value is clean
		this.isDirty = function (val){
			return $input.val() !== previousValue;
		};
		
		// get the clear value
		this.previousValue = function (){
			return previousValue;
		};
		
		var allowKeyPropagation = true;
		// stop keyboard monitoring for future events on this key event
		this.stopKeyPropagation = function (){
			allowKeyPropagation = false;
		};
		
		// attach the masking behavior
		this.mask = new $.maskerade.parsers.DateMask(this, $input, options);
		this.parser = this.mask.getParser();
		
		// add placeholder text		
		if( !$input.attr("placeholder") ) $input.attr("placeholder", this.parser.getDisplayMask());

		// grab the current value
		previousValue = $input.val();
		
		$input
			// turn off autocomplete
			.attr("autocomplete", "off")
			.bind("focus.maskerade", function (e){
				// mark as having focus
				hasFocus = true;
				
				// if the value is empty, replace with mask
				if( $.trim($input.val()).length === 0 ){
					// we need to asynchronously select the mask to prevent Chrome from selecting all text
					setTimeout(function (){
						$input.val(self.parser.getDisplayMask());
						// set the first token
						self.parser.selectFirstMaskToken();
					}, 0);

					// to prevent tabbing to this field selecting all text
					e.preventDefault();
				} else {
					// set the first token if not coming from a mouse click (do async, see above)
					if( !hasClickEvent ) setTimeout(function (){ self.parser.selectFirstMaskToken(); }, 0);
					e.preventDefault();
				}
			})
			.bind("blur.maskerade", function (e){
				// mark as not having focus
				hasFocus = false;

				if( self.mask.hasCompleted() === false ){
					// clear the mask value
					self.mask.setValue("");
					// clear the input
					$input.val("");
					// don't repaint after clearing values
					self.parser.resetMaskValues(false);
				}

				// grab the current value
				previousValue = $input.val();
			})
			.bind("mousedown.maskerade", function (e){
				// flag this event occurs from mouseclick
				hasClickEvent = true;
				setTimeout(function (){
					// reset the flag automatically
					hasClickEvent = false;
				}, 200);
			})
			// this is to refresh the field if it changes from an outside source
			.bind("input.maskerade", function (e){
				// if a paste option was register, skip processing
				if( hasPaste ) return;
				// update the mask with the new value
				self.mask.setValue($input.val());
				// set the first token
//				if( hasFocus ) self.parser.selectFirstMaskToken();
			})
			// the paste event if for IE7-9 (but used by all browsers)
			.bind("paste.maskerade", function (e){
				hasPaste = true;
				setTimeout(function (){
					hasPaste = false;
					$input.triggerHandler("input.maskerade", arguments);
				}, 0);
			})
			// this is to refresh the field if it changes from an outside source
			.bind("change.maskerade", function (e){
				$input.triggerHandler("input.maskerade", arguments);
			})
			.bind("click.maskerade", function (e){
				e.preventDefault();
				var selection = Selection.get($input[0]);
				// don't change the selection if the user has selected the entire text
				if( (selection.end - selection.start) !== $input.val().length ) self.parser.selectMaskTokenByCaret();
				// reset the keyboard buffer when user clicks in the box
				if( self.mask.getKeyboard() ) self.mask.getKeyboard().reset();
			})
			.bind("keydown.maskerade keypress.maskerade keyup.maskerade", function (e){
				// reset the allowKeyPropagation when user releases the key
				if( e.type === "keyup" ){
					setTimeout(function (){
						allowKeyPropagation = true;
					}, 0);
				}
				// if keyboard propagation has stopped, halt processing
				if( allowKeyPropagation === false ) return;

				var handler = e.type + "Handler";
				
				// if a custom event handler is defined (cancel if event returns false)
				if( options[e.type] ) if( options[e.type].apply(this, [e, self.mask]) === false ) 
					// prevent the default keyboard handler for Chrome
					return e.preventDefault();
				
				// if no handler, stop processing
				if( !self.mask[handler] ) return;

				var allow = self.mask[handler].apply(this, [e]);

				// create global keyboard monitoring to allow generic browser keyboard shortcuts
				if(
					(typeof allow != "boolean")
						&&
					(
						// if [CTRL] was pressed
						e.ctrlKey 
							|| 
						// if [ALT] was pressed
						e.altKey
							||
						// if F1-F12 was pressed
						((e.which >= 112) && (e.which <=123))
					)
				) return;

				if( allow !== true ) e.preventDefault();
								
/*
				console.log({
					  which: e.which
					, keyCode: e.keyCode
					, charCode: e.charCode
					, altKey: e.altKey
					, ctrlKey: e.ctrlKey
					, shiftKey: e.shiftKey
				});
*/
			})
		;

		// invoke the ready callback
		if( $.isFunction(options.ready) ) options.ready.apply(this, [$input, options, mask]);
		
		return this;
	};

	/*
	 * Keyboard
	 */
	$.maskerade.Keyboard = function (allow, delay){
		var buffer = "", delay = (Helper.Number.isNumeric(delay)) ? delay: 1250;

		this.monitor = function (e, onsuccess, context){
			var chr = String.fromCharCode(e.which);
			
			// add the value to the buffer if we have a valid character and no special keys are pressed
			if( (!allow || allow.test(chr)) && !e.ctrlKey && !e.altKey ) this.add(chr);
			// if we're not processed, skip processing
			else return false;

			// clear buffer after a short delay
			this.reset(delay);
			
			// if callback exists, run it
			if( onsuccess ) onsuccess.apply(context || this, [this, chr]);

			return true;
		};
		
		this.getBuffer = function (){
			return buffer;
		};
		
		this.add = function (str){
			buffer += str;
		};
		
		this.clear = function (){
			var old = buffer;
			buffer = "";

			// if callback exists, run it
			if( this.onclear ) this.onclear.apply(this, [old]);
		};
		
		this.cancelReset = function (){
			// stop previously scheduled clearing
			if( this.cancelId ){
				window.clearTimeout(this.cancelId);
				delete this.cancelId;
			}
		};
		
		this.reset = function (x){
			if( !x ) return this.clear();

			// cancel previous requests
			this.cancelReset();
			
			var self = this;
			// schedule a new clear
			this.cancelId = window.setTimeout(function (){
				self.clear();
			}, x);
		};
	};
	
	/*
	 * MaskParser
	 */
	$.maskerade.MaskParser = function (mask, $input, options){
		// create the regex to break up the string
		var maskerade = $input.data("maskerade")
			, currentToken = 0
			, tokens = []
			, tokenCount = 0
			, maskTokens = []
			, completed = false
			, displayMask
			, id = 0;
			
		// use either the default mask or the mask defined on the input element
		mask = $input.data("mask") || mask;
		
		// check if we have some formatting rules for displaying the mask
		if( options.formatMask === "toLowerCase" ) displayMask = mask.toLowerCase();
		else if( options.formatMask === "toUpperCase" ) displayMask = mask.toUpperCase();
		else if( options.formatMask && $.isFunction(options.formatMask) ) displayMask = options.formatMask.apply(this, [mask, $input, options]);
		else displayMask = mask;
		
		this.getMask = function (){
			return mask;
		};
			
		this.getDisplayMask = function (){
			return displayMask;
		};
			
		this.isCompleted = function (){
			return completed;
		};
			
		this.setCompleted = function (b){
			var previous = completed;
			completed = b;
			
			// trigger the completed callback
			if( options.completed && (completed !== previous) ) options.completed.apply(this, [completed, $input, options]);
		};

		this.getMaskValue = function (updateCompleted){
			var value = "", uncompleted = [];
			for( var i=0, tokenCount = tokens.length; i < tokenCount; i++ ){
				value += (tokens[i].value || tokens[i].display);
				if( !tokens[i].delim && !tokens[i].value ) uncompleted.push(tokens[i]);
			}

			// check if we've completed all the mask portions
			if( updateCompleted === true ) this.setCompleted(uncompleted.length === 0);
			
			return value;
		};

		this.repaint = function (){
			// update the value in the text box
			$input.val(this.getMaskValue(true));
			
			// update the selection
			if( maskerade.hasFocus() ) this.selectCurrentMaskToken();
		};
			
		this.parse = function (Rules){
			// create the regex to break up the string
			var regex = new RegExp(Rules.getRegEx(), "g")
				, match = mask.match(regex)
				, matchLen = match.length;
				
			// loop through the string and find the tokens
			for( var i=0; i < mask.length; i++ ){
				var part = mask.substring(i), maskToken = match[tokenCount];
				
				// find the first mask match or the end of the string if no more tokens exist
				var maskPos = maskToken ? part.indexOf(maskToken) : part.length;
				
				// if mask token not in first position, we have a delimiter
				if( maskPos ){
					tokens.push({
						  mask: part.substring(0, maskPos)
						, display: displayMask.substring(i, i+maskPos)
						, delim: true
						, pos: {start: i, end: i+maskPos}
						, id: id++
					});
					// advance the next parsing loop past delimiter
					i += maskPos;
				} 

				// if a token exists, grab it				
				if( maskToken ){
					// create a reference to the token
					maskTokens.push(tokens.length);
				
					tokens.push({
						  mask: maskToken
						, display: displayMask.substring(i, i+maskToken.length)
						, rule: Rules.get(maskToken)
						, delim: false
						, pos: {start: i, end: i+maskToken.length}
						, id: id++
						, tokenId: maskTokens.length-1
						, value: UNDEFINED
					});
					
					// advance the next parsing past the token
					i += (maskToken.length-1);
				}

				// find the next token
				tokenCount++;
			}

			return this;
		};
		
		this.getMaskTokens = function (){
			var masks = [];
			for( var i=0, count=maskTokens.length; i < count; i++ ){
				masks.push(tokens[maskTokens[i]]);
			}
			
			return masks;
		};
	
		this.setCurrentToken = function (idx){
			if( !idx || idx < 0 ) idx = 0;
			else if( idx > tokens.length ) idx = tokens.length-1;

			currentToken = idx;
		};
	
		this.getCurrentToken = function (){
			return tokens[currentToken];
		};
	
		this.getFirstMaskToken = function (){
			return tokens[maskTokens[0]];
		};
	
		this.isFirstMaskToken = function (){
			return this.getCurrentToken().id === tokens[maskTokens[0]].id;
		};
	
		this.getLastMaskToken = function (){
			return tokens[maskTokens[maskTokens.length-1]];
		};
	
		this.isLastMaskToken = function (){
			return this.getCurrentToken().id === tokens[maskTokens[maskTokens.length-1]].id;
		};
	
		this.getPrevMaskToken = function (){
			var next = this.getCurrentToken();
			
			// as long as we're not the last token, find it
			if( next.id !== this.getFirstMaskToken().id ){
				var i = next.id;
				while( i-- ){
					// find the next mask
					if( !tokens[i].delim ){
						next = tokens[i];
						break;
					}
				}
			}

			return next;
		};
	
		this.getNextMaskToken = function (){
			var next = this.getCurrentToken();
			
			// as long as we're not the last token, find it
			if( next.id !== this.getLastMaskToken().id ){
				for( var i=next.id+1; i < tokens.length; i++ ){
					// find the next mask
					if( !tokens[i].delim ){
						next = tokens[i];
						break;
					}
				}
			}

			return next;
		};
	
		this.getMaskToken = function (idx){
			if( !idx || idx < 0 ) idx = 0;
			else if( idx > maskTokens.length ) idx = maskTokens.length-1;
			
			return tokens[maskTokens[idx]];
		};

		this.setMaskValue = function (token, value, repaint){
			if( typeof token == "number" ) token = this.getMaskToken(token);
			else if( !token ) token = this.getCurrentToken();
			
			var isCompleted = ((value != UNDEFINED) && (value != null));
			
			// update the value
			token.value = (isCompleted) ? value.toString() : value;
			
			// if the value was erased and the mask was previously completed, mark it as uncompleted
			if( !isCompleted && this.isCompleted() ) this.setCompleted(false);

			// update the mask positions
			this.refreshTokenPositions(token.id);

			// redraw the text box
			if( repaint !== false ) this.repaint();
		};

		this.resetMaskValues = function (repaint){
			// clear all the mask value
			for( var i=0, maskCount = maskTokens.length; i < maskCount; i++ ){
				tokens[maskTokens[i]].value = UNDEFINED;
			}
			
			this.setCompleted(false);
			
			// update the mask positions
			this.refreshTokenPositions();
			// redraw the text box
			if( repaint !== false ) this.repaint();
		};

		this.refreshTokenPositions = function (idx){
			var idx = idx || 0, start = tokens[idx].pos.start, len = 0;
			for( var i=idx, tokenCount = tokens.length; i < tokenCount; i++ ){
				len = (tokens[i].value || tokens[i].display).length;

				tokens[i].pos.start = start;
				tokens[i].pos.end = start + len;
				start = tokens[i].pos.end;
			}
		};

		this.findTokenByMask = function (mask){
			var match;
			if( typeof mask == "string" ) mask = [mask];

			for( var i=0, tokenLen = tokens.length; i < tokenLen; i++ ){
				if( $.inArray(tokens[i].mask, mask) !== -1 ){
					match = tokens[i];
					break;
				}
			}
			// if a match, return the matching token
			if( match ) return match;
		};

		this.findTokenByPosition = function (pos){
			var match, lastToken;
			for( var i=0, tokenLen = tokens.length; i < tokenLen; i++ ){
				if( (pos >= tokens[i].pos.start) && (pos < tokens[i].pos.end) ){
					// if the current position is a delim, get the next token
					if( tokens[i].delim ){
						if( lastToken ) i = lastToken.id;
						else i++;
					}
					match = tokens[i];
					break;
				}
				if( !tokens[i].delim ) lastToken = tokens[i];
			}
			// if no match, get last token
			if( !match ) match = lastToken;
			return match;
		};
		
		this.selectMaskToken = function (pos){
			var token = this.getMaskToken(pos), maskPos = token.pos;
			Selection.set($input[0], maskPos.start, maskPos.end);
			this.setCurrentToken(token.id);
		};
		
		this.selectMaskTokenByPosition = function (pos){
			var token = this.findTokenByPosition(pos), maskPos = token.pos;
			Selection.set($input[0], maskPos.start, maskPos.end);
			this.setCurrentToken(token.id);
		};
		
		this.selectMaskTokenByCaret = function (){
			var token = this.findTokenByPosition(Selection.get($input[0]).start), maskPos = token.pos;
			Selection.set($input[0], maskPos.start, maskPos.end);
			this.setCurrentToken(token.id);
		};

		this.selectCurrentMaskToken = function (pos){
			this.selectMaskToken(this.getCurrentToken().tokenId);
		};

		this.selectFirstMaskToken = function (pos){
			this.selectMaskToken(this.getFirstMaskToken().tokenId);
		};

		this.selectPrevMaskToken = function (pos){
			this.selectMaskToken(this.getPrevMaskToken().tokenId);
		};

		this.selectNextMaskToken = function (pos){
			this.selectMaskToken(this.getNextMaskToken().tokenId);
		};

		this.selectLastMaskToken = function (pos){
			this.selectMaskToken(this.getLastMaskToken().tokenId);
		};
		
		return this;
	};

	/*
	 * MaskRule
	 */
	$.maskerade.MaskRule = function(){
		var masks = {}, maskOrder = [];
		
		this.add = function (mask, type, options){
			masks[mask] = {mask: mask, maskChr: mask.substring(0, 1), type: type, options: options};
			maskOrder.push(masks[mask]);
		};
		
		this.get = function (mask){
			return masks[mask];
		};
		
		this.getRegEx = function (){
			var regex = [], i=maskOrder.length;
			// loop through the array backwards, so longer mask tokens are found first
			while( i-- ){
				regex.push("(?:" + maskOrder[i].mask + ")");
			}
			return "(" + regex.join("|") + ")";
		};

		return this;
	};
	
	// define the rules for a DateMask
	var DateMaskRules = new $.maskerade.MaskRule();
	DateMaskRules.add("d",    "day");     // 1 or 2 digit numeric day of the month (1-31)
	DateMaskRules.add("dd",   "day");     // 2 digit numeric day of the month (01-31)
	DateMaskRules.add("m",    "month");   // 1 or 2 digit numeric month (1-12)
	DateMaskRules.add("mm",   "month");   // 2 digit numeric month (01-12)
	DateMaskRules.add("mmm",  "month");   // abbreviated name of month
	DateMaskRules.add("mmmm", "month");   // full name of month
	DateMaskRules.add("qq",   "quarter"); // start of quarter (Q1, Q2, Q3, Q4)
	DateMaskRules.add("qqq",  "quarter"); // start of quarter w/date (Q1 - Jan 1, Q2 - Apr 1, Q3 - Jul 1, Q4 - Oct 1)
	DateMaskRules.add("qqqq", "quarter"); // start of quarter w/full date (Q1 - January 1, Q2 - April 1, Q3 - July 1, Q4 - October 1)
	DateMaskRules.add("QQ",   "quarter"); // end of quarter (Q1, Q2, Q3, Q4)
	DateMaskRules.add("QQQ",  "quarter"); // end of quarter w/date (Q1 - Mar 31, Q2 - Jun 30, Q3 - Sep 31, Q4 - Dec 31)
	DateMaskRules.add("QQQQ", "quarter"); // end of quarter w/full date (Q1 - March 31, Q2 - June 30, Q3 - September 31, Q4 - December 31)
	DateMaskRules.add("yy",   "year");    // 2 digit numeric year (00-99)
	DateMaskRules.add("yyyy", "year");    // 4 digit numeric year
	DateMaskRules.add("h",    "hour");    // 1 or 2 digit numeric 12 hour clock (1-12)
	DateMaskRules.add("hh",   "hour");    // 2 digit numeric 12 hour clock (01-12)
	DateMaskRules.add("H",    "hour");    // 1 or 2 digit numeric 24 hour clock (1-24)
	DateMaskRules.add("HH",   "hour");    // 2 digit numeric 24 hour clock (01-24)
	DateMaskRules.add("M",    "minute");  // 1 or 2 digit numeric minute (0-59)
	DateMaskRules.add("MM",   "minute");  // 2 digit numeric minute (00-59)
	DateMaskRules.add("s",    "second");  // 1 or 2 digit numeric seconds (0-59)
	DateMaskRules.add("ss",   "second");  // 2 digit numeric seconds (00-59)
	DateMaskRules.add("t",    "ampm");    // first chracter of am/pm
	DateMaskRules.add("tt",   "ampm");    // am/pm

	/*
	 * Maskerade Parsers 
	 */
	$.maskerade.parsers = {
		DateMask: function (maskerade, $input, options){
			var self = this, defaultMask = Helper.i18n.get(options.lang, "date.defaultMask");
			
			// creating the masking object
			var parser = new $.maskerade.MaskParser(options.mask || defaultMask, $input, options);
			// parse the mask into a new object
			parser.parse(DateMaskRules);
			// get the mask tokens found
			var tokens = parser.getMaskTokens();
			
			var Keyboard = new $.maskerade.Keyboard(/\w/, options.keyBufferDelay);
			
			var bufferStartDate;
			// track when Keyboard buffer is cleared
			Keyboard.onclear = function (){
				// track the date when user starts typing
				bufferStartDate = self.getDate();
			};
			
			// define the initialization code
			var init = function (){
				// get default value
				var value = $input.data("value");

				// check attributes for directives
				var minValue = $input.data("min")
					, maxValue = $input.data("max");
				
				// set options based on directives
				if( minValue && minValue.length ) options.min = Helper.Date.convertISO8601(minValue);
				if( maxValue && maxValue.length ) options.max = Helper.Date.convertISO8601(maxValue);
				
				// bind all the misc bindings
				options = $.extend(true, {}, options, {bindings: {
					  min: $input.data("min-bind")
					, max: $input.data("max-bind")
				}});
				
				// if we have specified an ISO-8601 date, use it instead of the string
				if( value && value.length ){
					self.setValue(Helper.Date.convertISO8601(value));
				// otherwise try and grab the time from the input element
				} else if( $input.val().length ){
					self.setValue($input.val());
				}
				
				return self;
			};

			// destroy any special bindings/variables for this mask type
			this.destroy = function (){
				// store the date object w/the input
				$.data($input[0], "date", null);
			};
			
			this.getValue = function (){
				return this.hasDate() ? this.getDate() : UNDEFINED;
			};
			
			this.setValue = function (value, mask){
				// if the value is an empty string, reset value
				if( ((typeof value == "string") && (value.length === 0)) || (value == UNDEFINED) ){
					value = UNDEFINED;
					// clear the date parts
					initDateParts();
				} else if( !(value instanceof Date) ){
					// try to convert the input into a date object
					value = Helper.Date.getDateFromString(value.toString(), mask || parser.getMask(), options.lang);
				}
				
				// update the date
				this.setDate(value);
				// update the date parts
				this.updateDateParts("init");
				// update the mask
				this.maskUpdate();
			};

			this.getParser = function (){
				return parser;
			};

			this.getKeyboard = function (){
				return Keyboard;
			};
			
			this.getMaskByType = function (type){
				// loop through the mask tokens and update each one
				for( var i=0, count=tokens.length; i < count; i++ ){
					if( getDatePart(tokens[i].mask).type === type ){
						return tokens[i];
					}
				};
				return;
			};
			
			this.hasCompleted = function (){
				return this.hasDate();
			};
			
			this.keydownHandler = function (e){
				// determines if we're going to allow the keyboard action to take place--normally the event is prevented
				var allow;
				
				// [SHIFT] + [TAB]
				if( e.shiftKey && (e.which === 9) ){
					maskerade.stopKeyPropagation();
					// clear the existing keyboard buffer
					Keyboard.reset();
					// if in last position, go ahead and allow default keyboard action
					if( parser.isFirstMaskToken() ) return true;
					// go back one mask position
					parser.selectPrevMaskToken();
				// [TAB]
				} else if( e.which === 9 ){
					maskerade.stopKeyPropagation();
					// clear the existing keyboard buffer
					Keyboard.reset();
					// if in last position, go ahead and allow default keyboard action
					if( parser.isLastMaskToken() ) return true;
					// go forward one mask position
					parser.selectNextMaskToken();
				// [HOME]
				} else if( e.which === 36 ){
					maskerade.stopKeyPropagation();
					// clear the existing keyboard buffer
					Keyboard.reset();
					// select first token
					parser.selectFirstMaskToken();
				// [END]
				} else if( e.which === 35 ){
					maskerade.stopKeyPropagation();
					// clear the existing keyboard buffer
					Keyboard.reset();
					// select first token
					parser.selectLastMaskToken();
				// [LEFT ARROW]
				} else if( e.which === 37 ){
					maskerade.stopKeyPropagation();
					// clear the existing keyboard buffer
					Keyboard.reset();
					// go back one mask position
					parser.selectPrevMaskToken();
				// [RIGHT ARROW]
				} else if( e.which === 39 ){
					maskerade.stopKeyPropagation();
					// clear the existing keyboard buffer
					Keyboard.reset();
					// go forward one mask position
					parser.selectNextMaskToken();
				// [UP ARROW]
				} else if( e.which === 38 ){
					// clear the existing keyboard buffer
					Keyboard.reset();
					self.maskAdd(1);
				// [DOWN ARROW]
				} else if( e.which === 40 ){
					// clear the existing keyboard buffer
					Keyboard.reset();
					self.maskAdd(-1);
				// [DEL] or [BACKSPACE]
				} else if( (e.which === 8) || (e.which === 46) ){
					maskerade.stopKeyPropagation();
					// clear the existing keyboard buffer
					Keyboard.reset();
					self.maskDelete(false);
				// [CTRL] + [A, C or V]
				} else if( e.ctrlKey && ($.inArray(e.which, [65,67,86]) > -1) ){
					maskerade.stopKeyPropagation();
					// clear the existing keyboard buffer
					Keyboard.reset();
					allow = true;
				// [ESC] NOTE: we process this more in the keyup handler
				} else if( e.which === 27 ){
					// clear the existing keyboard buffer
					Keyboard.reset();
				// allow any other keypress to work
				} else {
					allow = true;
				}
	
				return allow;
			}
			
			// monitor all other keyboard activity
			this.keypressHandler = function (e){
				// we need to monitoring keyboard input at the keypress level so that the NUM PAD works
				var validInput = false, buffer;
				// add to the keyboard buffer
				Keyboard.monitor(e, function (Keyboard, chr){
					var currentToken = parser.getCurrentToken();
					buffer = Keyboard.getBuffer();
					validInput = self.maskSet(buffer, true);
				});
				
				if( !validInput && options.invalid ) options.invalid.apply(self, [buffer, parser.getCurrentToken()]);
			}

			/* 
			 * Some browsers (i.e. Firefox 9) trigger an oninput event when the [ESC] is triggered
			 * the oninput event occurs after the keypress, but before the keyup. So we capture the
			 * [ESC] key during the keyup event to clear the value
			 * 
			 * https://bugzilla.mozilla.org/show_bug.cgi?id=651956
			 */
			this.keyupHandler = function (e){
				// determines if we're going to allow the keyboard action to take place--normally the event is prevented
				var allow;
				
				// [ESC]
				if( e.which === 27 ){
					// if we've change the field, reset the value
					if( maskerade.isDirty() ){
						self.setValue(maskerade.previousValue());
						// if no valid date, go to first token
						if( !self.hasDate() ) parser.selectFirstMaskToken();
					}
				} 
	
				return allow;
			}
			
			// define mask values
			var date
				, previousDate
				, dateParts
				, initDateParts = function (){
					dateParts = {
						  month: UNDEFINED
						, day: UNDEFINED
						, year: UNDEFINED
						, quarter: UNDEFINED
						, hour: UNDEFINED
						, minute: UNDEFINED
						, second: UNDEFINED
						, millisecond: UNDEFINED
						, ampm: UNDEFINED
					};
				};

			this.getDate = function (){
				return date;
			}

			var bindingValue = function (bind){
				// if no binding, return default attribute value
				if( !options.bindings[bind] ) return options[bind];

				// look up the bound element					
				var $el = $(options.bindings[bind]), maskerade = $el.data("maskerade");
				
				// if no match, return default attribute value
				if( $el.length === 0 || !maskerade ) return options[bind];
				
				return maskerade.mask.getDate();
			};
			
			this.setDate = function (val){
				// check to see if we have a valid date object
				if( !Helper.Date.isDate(val) ){
					// if value isn't a date, create an invalid date object
					val = new Date(UNDEFINED);
				} else {
					if( options.bindings.min ) options.min = bindingValue("min");
					if( options.bindings.max ) options.max = bindingValue("max");

					// if the time is less than the min date, reset to min date
					if( Helper.Date.isDate(options.min) && (val.getTime() < options.min.getTime()) ){
						// change the value
						return this.setValue(options.min);
					// if the time is greater than the max date, reset to max date
					} else if( Helper.Date.isDate(options.max) && (val.getTime() > options.max.getTime()) ){
						// change the value
						return this.setValue(options.max);
					}
				}

				// set previous date
				previousDate = date;
				// update current date
				date = val;
				// store the date object w/the input
				$.data($input[0], "date", date);
				
				// trigger the callback if we've had a change in the date object
				if( options.change && (!Helper.Date.isDate(date) || ((Helper.Date.isDate(previousDate) && previousDate.getTime() || previousDate) != (Helper.Date.isDate(date) && date.getTime() || date))) ) options.change.apply(this, [date, $input]);
			}

			// create the date parts
			initDateParts();

			this.hasDate = function (){
				return Helper.Date.isDate(date); 
			};
	
			var getDatePart = function (mask){
				try {
					var datePart = DateMaskRules.get(mask);
					datePart.value = dateParts[datePart.type];
					
					return datePart;
				} catch (e){
					throw "Invalid date type detected";
				}
			};
			
			this.updateDate = function (part){
				// special handling for parts
				if( part ){
					// if updating quarters
					if( (part.maskChr === "q") && (dateParts.quarter) ){
						dateParts.month = (dateParts.quarter-1) * 3;
						dateParts.day = 1;
					} else if( (part.maskChr === "Q") && (dateParts.quarter) ){
						dateParts.month = ((dateParts.quarter-1) * 3) + 2;
						dateParts.day = [31,30,30,31][dateParts.quarter-1];
					} else if( (part.type === "quarter") && (dateParts.quarter == UNDEFINED) ){
						dateParts.month = UNDEFINED;
						dateParts.day = UNDEFINED;
					}
				}

				// if parser is completed, we need to define default parts for the unneeded portions of the date
				if( parser.isCompleted() ){
					if( !dateParts.year ) dateParts.year = 1970; 
					if( !dateParts.month ) dateParts.month = 0; 
					if( !dateParts.day ) dateParts.day = 1;
				}
				
				// store the current date
				var date = new Date(dateParts.year, dateParts.month, dateParts.day);
				
				if( Helper.Date.isDate(date) ){
					// check if we need to fix the date (this happens if we specify a day greater than the days in the month)
					var fixedDate = Helper.Date.fixDate(date, new Date(dateParts.year, dateParts.month), "day", dateParts.day);
					// if the fixed date doesn't match the current date, update references
					if( fixedDate.getTime() != date.getTime() ){
						if( options.corrected ) options.corrected.apply(this, [date, fixedDate, $input]);

						date = fixedDate;
						// update the day
						dateParts.day = date.getDate();
					}
				}
				
				// update time
				if( dateParts.hour != UNDEFINED ){
					date.setHours(dateParts.hour);
					dateParts.ampm = (dateParts.hour < 12) ? "am" : "pm";
				}
				if( dateParts.minute != UNDEFINED ) date.setMinutes(dateParts.minute);
				if( dateParts.second != UNDEFINED ) date.setSeconds(dateParts.second);
				if( dateParts.millisecond != UNDEFINED ) date.setMilliseconds(dateParts.millisecond);

				// store the current date
				this.setDate(date);
			};
			
			this.updateDateParts = function (part){
				if( !this.hasDate() ) return;
				
				dateParts.year = date.getFullYear();
				dateParts.month = date.getMonth();
				dateParts.day = date.getDate();

				// if we're tracking quarters, update the quarter
				if( dateParts.quarter || (part === "init") ) dateParts.quarter = Helper.Date.getQuarter(date);

				var setTime = ($.inArray(part, ["init", "hour", "minute", "second"]) > -1);
				
				// update time
				if( dateParts.hour || setTime ){
					dateParts.hour = date.getHours();
					// set the am/pm mask
					dateParts.ampm = (dateParts.hour/12 < 1) ? "am" : "pm";
				}
				if( dateParts.minute || setTime ) dateParts.minute = date.getMinutes();
				if( dateParts.second || setTime ) dateParts.second = date.getSeconds();
				if( dateParts.millisecond || setTime ) dateParts.millisecond = date.getMilliseconds();
			};
			
			this.dateAdd = function (maskText, i){
				var datePart = getDatePart(maskText);
				
				// process am/pm mask separately
				if( datePart.type === "ampm" ){
					// do nothing on empty am/pm
					if( dateParts.hour == UNDEFINED || dateParts.ampm == UNDEFINED ) return;
					
					// get the current hour part
					datePart = getDatePart(this.getMaskByType("hour").mask);
					
					// if we have a valid date, just add to the date object
					if( this.hasDate() ){
						var hour = (date.getHours() + Math.abs(i * 12)) % 24;
						date.setHours(hour);
						this.updateDateParts(datePart.type);
					// if not a valid date object, make sure we stick to our base constraints
					} else {
						var hour = (datePart.value + Math.abs(i * 12)) % 24;
						dateParts[datePart.type] = Helper.Date.setValidRange(datePart.maskChr, hour);
						// update the date object
						this.updateDate(datePart);
					}
					
					// stop processing
					return;
				}
				
				if( datePart.value == UNDEFINED ){
					// reset the increment to 0
					i = 0;
					// default year to current year
					if( datePart.type === "year" ){
						datePart.value = (new Date()).getFullYear();
					// default day to first day of month
					} else if( datePart.type === "month" ){
						datePart.value = 0;
					// default day to first day of month
					} else if( datePart.type === "day" ){
						datePart.value = 1;
					// default day to first quarter
					} else if( datePart.type.indexOf("quarter") == 0 ){
						datePart.value = 1;
					// default day to first day of month
					} else if( datePart.maskChr === "h" ){
						datePart.value = 12;
					// everything else defaults to zero
					} else {
						datePart.value = 0;
					}
				}

				// if we have a valid date, just add to the date object
				if( this.hasDate() ){
					this.setDate(Helper.Date.dateAdd(date, datePart.maskChr, i));
					this.updateDateParts(datePart.type);
				// if not a valid date object, make sure we stick to our base constraints
				} else {
					dateParts[datePart.type] = Helper.Date.setValidRange(datePart.maskChr, (datePart.value + i));
					// update the date object
					this.updateDate(datePart);
				}
			};
			
			var monthAsString = function (value, useShort){
				var months = Helper.i18n.get(options.lang, ((useShort === true) ? "date.monthNamesShort" : "date.monthNames"));
				try {
					return months[value];
				} catch (e){
					throw "No month name found!"
				}
			}
			
			var to12Hour = function (value){
				value = Number(value);
				if( value === 0 ) return 12;
				else if( value > 12 ) return value % 12;
				return value;
			};

			var getQuarterDisplay = function (quarter, month, day, useShort){
				// cache the which comes first the day or month
				if( getQuarterDisplay.firstToken == null ) getQuarterDisplay.firstToken = defaultMask.substring(defaultMask.search(/(d{1,2})|(m{1,4})/), 1);

				return "Q" + quarter + " - " + ((getQuarterDisplay.firstToken === "m") ? monthAsString(month, useShort) + " " + day : day + " " + monthAsString(month, useShort));
			};
			getQuarterDisplay.firstToken = null;
			
			this.maskValue = function (mask, value){
				// if value not a simple value
				if( value == UNDEFINED ) return value;
				
				var result;
				
				switch( mask ){
					case "dd":
					case "HH":
					case "MM":
					case "ss":
						return Helper.String.padLeft(value, 2, "0");
					
					case "m":
						return value + 1;
					
					case "mm":
						return Helper.String.padLeft(value + 1, 2, "0");
					
					case "mmm":
						return monthAsString(value, true);
					
					case "mmmm":
						return monthAsString(value);

					
					case "qq":
					case "QQ":
						return "Q" + value;
					
					case "qqq":
					case "QQQ":
					case "qqqq":
					case "QQQQ":
						var useShort = (mask.length === 3);
						return getQuarterDisplay(value, dateParts.month, dateParts.day, useShort);
					
					case "yy":
						return Helper.String.padLeft(value, 4, "0").substring(2);

					case "yyyy":
						return Helper.String.padLeft(value, 4, "0").substring(0, 4);

					case "h":
						return to12Hour(value);
					case "hh":
						return Helper.String.padLeft(to12Hour(value), 2, "0");

					case "t":
						return value.substring(0, 1);
					case "tt":
						return value;
					
					default:
						return value;
				}
				
				return value;
			};
			
			this.maskUpdate = function (){
				// loop through the mask tokens and update each one
				for( var i=0, count=tokens.length; i < count; i++ ){
					var parts = getDatePart(tokens[i].mask);
					// update the mask, but skip repaint--we'll do this manually when we're done
					parser.setMaskValue(tokens[i], this.maskValue(parts.mask, parts.value), false);
				};

				// check if the mask is completed				
				var completed = parser.isCompleted();
				
				// repaint the input
				parser.repaint();
				
				// if we've finished updating the mask, update the date again
				if( !completed && parser.isCompleted() ) this.updateDate();
			};
			
			this.maskAdd = function (i){
				var mask = parser.getCurrentToken()
					, value = this.dateAdd(mask.mask, i);
				// update the mask text
				this.maskUpdate();
			};

			this.valueLookup = function(datePart, value){
				var isNumber = Helper.Number.isNumeric(value);

				// update value (make number if numeric)	
				datePart.value = (isNumber ? value*1 : value);
				
				// adjust month to actual range
				if (datePart.type === "month" && isNumber) {
					datePart.value -= 1;
				} else if( datePart.mask === "yyyy" && (value.length <= 2) ){
					var year = (new Date()).getFullYear(), century = Math.round(year/100) * 100;
					// make the year in the current century
					datePart.value = century + (value*1);
					
					// if more than 5 years in the future, assume it's from the past century
					if( datePart.value > (year + 5) ) datePart.value -= 100;
				// if adjust a string month
				} else if( $.inArray(datePart.mask, ["mmm", "mmmm"]) > -1 ){
					var month = Helper.i18n.findIndex(options.lang, "date." + (datePart.mask === "mmm" ? "monthNamesShort" : "monthNames"), value, true);
					// check if we have a month
					datePart.valid = Helper.Number.isNumeric(month);
					if( datePart.valid ) datePart.value = month;
					
					return datePart;
				// process am/pm mask separately
				} else if( datePart.type === "ampm" ){
					datePart.valid = /^[ap]m?$/i.test(datePart.value);
					if( datePart.valid ){
						if( datePart.value.substring(0, 1).toLowerCase() === "a" ) datePart.value = "am";
						else  datePart.value = "pm";
					}
					
					return datePart;
				}
				
				// check if the value is value for all other use cases
				datePart.valid = isNumber && Helper.Date.isValidRange(datePart.maskChr, datePart.value);
				
				return datePart;
			}
			
			this.isCompletedValue = function (datePart, value){
				var checkLength = function (len){ return ( (value.length === len) && (datePart.value == value) ) };

				switch( datePart.mask ){
					case "mmm":
					case "mmmm":
						// if an alpha mask is supplied, make sure it's the best match
						if( !Helper.Number.isNumeric(value) ){
							return (Helper.i18n.findAll(options.lang, "date." + (datePart.mask === "mmm" ? "monthNamesShort" : "monthNames"), value, true).length === 1);
						}
						// fallback to numeric testing

					case "m":
					case "mm":
						// advance if input is greater than 2 characters or the month is between 1 - 11 (Feb - Dec)
						return (((value.length === 2) && (datePart.value+1 === (value*1))) || (datePart.value > 0));
					break;

					case "d":
					case "dd":
						// advance day if 2 digits or day is greater than 3rd, but the mask value must also match the actual day (don't advance on invalid input)
						return (checkLength(2) || (datePart.value > 3)) && (datePart.value === value*1);
					break;

					case "h":
					case "hh":
						var hour = datePart.value % 12;
						// advance hour if 2 digits or hour is greater than 1, but the mask value must also match the actual hour (don't advance on invalid input)
						return ((checkLength(2) || (hour > 1)) && (hour === value*1)) || (value == 12);
					break;

					case "H":
					case "HH":
						// advance hour if 2 digits or hour is greater than 2, but the mask value must also match the actual hour (don't advance on invalid input)
						return (checkLength(2) || (datePart.value > 2)) && (datePart.value === value*1);
					break;

					case "M":
					case "MM":
					case "s":
					case "ss":
						// advance if 2 digits or value is greater than 5, but the mask value must also match (don't advance on invalid input)
						return (checkLength(2) || (datePart.value > 5)) && (datePart.value === value*1);
					break;

					case "yy":
						return checkLength(2);
					break;

					case "qq":
					case "qqq":
					case "qqqq":
					case "QQ":
					case "QQQ":
					case "QQQQ":
						return (datePart.value == value);
					break;

					case "t":
					case "tt":
						return ($.inArray(value, ["a", "p"]) > -1);
					break;

					case "yyyy":
						return checkLength(4);
					break;
				}

				return false;
			};
			
			this.maskDelete = function (keyboard){
				if( Selection.isAllSelected($input[0]) ){
					// select the first token
					parser.selectFirstMaskToken();
					// reset the value
					this.setValue(UNDEFINED);
				} else {
					this.maskSet(UNDEFINED, keyboard);
				} 
			}
			
			this.maskSet = function (value, keyboard){
				var mask = parser.getCurrentToken()
					, datePart = getDatePart(mask.mask);
					
				// if the value is undefined, we need to remove the date part				
				if( value == UNDEFINED ){
					// update the mask value, but reset the value (skip repainting the value, as we'll do in the maskUpdate())
					parser.setCompleted(false);

					dateParts[datePart.type] = value;

					// update the date object
					this.updateDate(datePart);
					
					// update the mask text
					this.maskUpdate();

					return true;
				};
				
				// is a valid match?
				var lookup = this.valueLookup(datePart, value);
				
				if( lookup.valid ){
					/* update mask value */

					// if we have a valid date, just add to the date object
					if( this.hasDate() ){
						// if handling the am/pm mask
						if( lookup.type === "ampm" ){
							// get the new hour
							var hour = ((dateParts.hour + 12) % 24 % 12) + (lookup.value === "pm" ? 12 : 0);
							dateParts.ampm = lookup.value;
							date.setHours(hour);
							this.updateDateParts("hours");
						} else {
							// if setting US hours, multiple the entry by the am/pm value
							if( lookup.maskChr === "h" ) lookup.value = ((lookup.value + 12) % 24 % 12) + (dateParts.ampm === "pm" ? 12 : 0);
							// attempt to update the date using the original buffer's date (that way if a date because valid again, we reset the original value)
							this.setDate(Helper.Date.dateSet(keyboard && Helper.Date.isDate(bufferStartDate) && bufferStartDate || date, datePart.maskChr, lookup.value));
							this.updateDateParts(datePart.type);
						}

					// if not a valid date object, make sure we stick to our base constraints
					} else {
						// if handling the am/pm mask
						if( lookup.type === "ampm" ){
							// if no hour, set to 12am
							if( isNaN(dateParts.hour) ) dateParts.hour = 0;
							// get the new hour
							var hour = ((dateParts.hour + 12) % 24 % 12) + (lookup.value === "pm" ? 12 : 0);
							dateParts.ampm = lookup.value;
							dateParts.hour = hour;
						} else {
							// if setting US hours, multiple the entry by the am/pm value
							if( lookup.maskChr === "h" ) lookup.value = ((lookup.value + 12) % 24 % 12) + (dateParts.ampm === "pm" ? 12 : 0);
							dateParts[datePart.type] = lookup.value;
						}
						// update the date object
						this.updateDate(datePart);
					}
					
					// update the mask text
					this.maskUpdate();
						
					// check if we should auto advance to the next position
					if( (keyboard === true) && this.isCompletedValue(datePart, value) ){
						// clear the keyboard buffer
						Keyboard.reset();
						// go to next mask
						parser.selectNextMaskToken();
					}
					
				} else if( keyboard === true ){
					// clear the keyboard buffer if we're invalid an not just leading zeros
					if( !(/^[0]+$/.test(value)) ) Keyboard.reset();
				}
				
				return lookup.valid;
			};
			
			// initialize the object
			return init();
		}
		
	};
	
	/*
	 * Helper Functions
	 */
	var Helper = {
		i18n: {
			get: function (lang, key){
				// get the language package or default to English
				var i18n = $.maskerade.i18n[lang] || $.maskerade.i18n.en
					, keys = key.split(".");
				// parse the hash tree
				for( var i=0, count=keys.length; i < count; i++ ){
					i18n = i18n[keys[i]];
				}
				
				return i18n;
			}
			, findIndex: function (lang, key, value, partial){
				// get the language package or default to English
				var values = this.get(lang, key), value = value.toLowerCase();
				
				// parse the hash tree
				for( var i=0, count=values.length; i < count; i++ ){
					var current = values[i].toLowerCase();
					if( (current === value) || ((partial === true) && (current.indexOf(value) === 0)) ) return i;
				}
				
				return;
			}
			, findAll: function (lang, key, value, partial){
				// get the language package or default to English
				var matches = [], values = this.get(lang, key), value = value.toLowerCase();
				
				// parse the hash tree
				for( var i=0, count=values.length; i < count; i++ ){
					var current = values[i].toLowerCase();
					if( (current === value) || ((partial === true) && (current.indexOf(value) === 0)) ) matches.push([i, values[i]]);
				}
				
				return matches;
			}
		}
		, String: {
			padLeft: function (value, count, pad){
				var value = value.toString(), len = value.length, pad = pad || " ";
				// pad the string w/any needed characters
				for( var i = len; i < count; i++ ){
					value = pad + value;
				}
				return value;
			}
		}
		, Number: {
			inRange: function (value, start, end){
				return ((value >= start) && (value <= end));
			}
			, setInRange: function (value, start, end){
				if( value < start ) return end;
				else if( value > end ) return start;
				return value;
			}
			, isNumeric: function (value){
				// multiple by one will try to convert to a number, if value doesn't convert it will be NaN
				return !isNaN(value * 1);
			}
		}
		, Date: {
			isDate: function (date){
				return ((null != date) && (typeof date.getDate !== "getTime") && !isNaN(date.getTime())); 
			}
			, isValidRange: function (part, value){
				switch( part ){
					case "m": // month
						return Helper.Number.inRange(value, 0, 11);
					case "d": // day
						return Helper.Number.inRange(value, 1, 31);
					case "q": // quarter
					case "Q": // quarter
						return Helper.Number.inRange(value, 1, 4);
					case "h": // 12-hour
						return Helper.Number.inRange(value, 1, 12);
					case "H": // 24-hour
						return Helper.Number.inRange(value, 0, 23);
					case "M": // minute
					case "s": // second
						return Helper.Number.inRange(value, 0, 59);
				}
				
				return Helper.Number.inRange(value, 0, 9999);
			}
			, setValidRange: function (part, value){
				switch( part ){
					case "m": // month
						return Helper.Number.setInRange(value, 0, 11);
					case "d": // day
						return Helper.Number.setInRange(value, 1, 31);
					case "q": // quarter
					case "Q": // quarter
						return Helper.Number.setInRange(value, 1, 4);
					case "h": // 12-hour
					case "H": // 24-hour
						return Helper.Number.setInRange(value, 0, 23);
					case "M": // minute
					case "s": // second
						return Helper.Number.setInRange(value, 0, 59);
				}
				
				return Helper.Number.setInRange(value, 0, 9999);
			}
			, daysInMonth: function(date){
				var year = date.getYear(), month = date.getMonth();
				return 32 - (new Date(year, month, 32)).getDate();
			}
			, getQuarter: function(date){
				var time = date.getTime()
					, start = new Date(date.valueOf())
					, end = new Date(date.valueOf())
					, quarters = [
						  [0, 1, 2, 31]
						, [3, 1, 5, 30]
						, [6, 1, 8, 30]
						, [9, 1, 11, 31]
					];
					
				for( var i=0, count=quarters.length; i < count; i++ ){
					// update the start date of quarter
					start.setMonth(quarters[i][0]); start.setDate(quarters[i][1]);
					// update the end date of quarter (NOTE: we need to set the date to 1 before changing month to prevent any shifting of days)
					end.setDate(1); end.setMonth(quarters[i][2]); end.setDate(quarters[i][3]); 

					if( (start.getTime() <= time) && (time <= end.getTime()) ){
						return i+1;
					}
				}
				
				return;
			}
			, fixDate: function(current, original, type, expected){
					var result = new Date(current.valueOf())
						, currentDay = current.getDate()
						, originalDay = ((type === "day") && (expected != UNDEFINED)) ? expected : current.getDate();

					// if the day has changed, correct date
					if( currentDay !== originalDay ){
						// if the date has changed, then the new month had less days so we need to go back to the last day of the previous month
						result.setTime(result.getTime() - (currentDay * 86400000));
					// if was set to the last day of the month, keep on last day of the month 
					// (exception: we skip resetting last day of month if changing from Feb 28 to Feb 29 on a year change)
					} else if( (originalDay === Helper.Date.daysInMonth(original)) && (!this.isFebruaryEOMYearChange(current, original)) ){
						result.setDate(Helper.Date.daysInMonth(result));
					}
					
					// if the month isn't what is expected, it's because the day was greater than the days in the month
					if( (type === "month") && (result.getMonth() !== expected) ){
						result.setMonth(expected);
						result.setDate(Helper.Date.daysInMonth(result));
					// if the year has changed, but the month changed, we need to go back to the previous month's last day (this happens when Feb has 29 days)
					} else if( (type === "year") && (result.getMonth() !== original.getMonth()) ){
						result.setMonth(original.getMonth());
						result.setDate(Helper.Date.daysInMonth(result));
					}
					
					return result;
			}
			// check to see if we're changing years on the last day of February (if so, we don't generally want to change Feb 28 to Feb 29)
			, isFebruaryEOMYearChange: function(current, original){
					return ((current.getFullYear() !== original.getFullYear()) && (original.getMonth() === 1) && (original.getDate() === 28));
			}
			, dateSet: function (date, type, value){
				var result = new Date(date.valueOf());

				switch( type ){
					case "y": // year
						result.setFullYear(value);
						// correct the date if the "day" has changed
						result = this.fixDate(result, date, "year", value);
					break;
					case "m": // month
						result.setMonth(value);
						// correct the date if the "day" has changed
						result = this.fixDate(result, date, "month", value);
					break;
					case "d": // day
						result.setDate(value);
						// correct the date if the "day" has changed
						result = this.fixDate(result, date, "day", value);
					break;
					case "q": // quarter (start)
						// set day to first day of the month
						result.setDate(1);
						// convert value to an INT and base on 0-3
						result.setMonth(((value*1)-1) * 3);
					break;
					case "Q": // quarter (end)
						// set to first day of month so we don't switch months
						result.setDate(1); 
						// convert value to an INT and based on 2,5,8,11
						result.setMonth((((value*1)) * 3)-1);
						result.setDate([31,30,30,31][((value*1)-1)]);
					break;
					case "h": // hour
					case "H": // hour
						result.setHours(value);
					break;
					case "M": // minute
						result.setMinutes(value);
					break;
					case "s": // second
						result.setSeconds(value);
					break;
				};
				
				return result;
			}
			, dateAdd: function (date, type, value){
				if( !value || (value === 0) ) return date;
				var result = new Date(date.valueOf());
				
				switch( type ){
					case "y": // year
						result.setFullYear(result.getFullYear() + value);
						// correct the date if the "day" has changed
						result = this.fixDate(result, date, "year", result.getMonth());
					break;
					case "m": // month
						var month = result.getMonth() + value;
						result.setMonth(month);
						// correct the date if the "day" has changed
						result = this.fixDate(result, date, "month", ((month + 12) % 12 % 12)); // make sure month is always in 0-11 format
					break;
					case "d": // day
						result.setDate(result.getDate() + value);
					break;
					case "q": // quarter (start)
					case "Q": // quarter (end)
						var month = result.getMonth() + (value * 3);
						result.setMonth(month);
						// correct the date if the "day" has changed
						result = this.fixDate(result, date, "month", month);
						// now we must manually set the date part, so we're at the correct start/ending values
						result = this.dateSet(result, type, this.getQuarter(result));
					break;
					case "h": // hour
					case "H": // hour
						result.setHours(result.getHours() + value);
					break;
					case "M": // minute
						result.setMinutes(result.getMinutes() + value);
					break;
					case "s": // second
						result.setSeconds(result.getSeconds() + value);
					break;
				};
				
				return result;
			}
			, getDateFromString: function (input, mask, lang){
				var i = 0
					, validMasks = /((?:tt)|(?:t)|(?:ss)|(?:s)|(?:MM)|(?:M)|(?:HH)|(?:H)|(?:hh)|(?:h)|(?:QQQQ)|(?:QQQ)|(?:QQ)|(?:qqqq)|(?:qqq)|(?:qq)|(?:yyyy)|(?:yy)|(?:mmmm)|(?:mmm)|(?:mm)|(?:m)|(?:dd)|(?:d))/g
					, match = mask.match(validMasks)
					, matchPos = 0
					, parsed = input
					, tokens = []
					, maskCount = -1
				;

				// loop through the string and find the tokens
				for( var i=0, count=mask.length; i < count; i++ ){
					var part = mask.substring(i), maskToken = match[matchPos];
					
					// find the first mask match or the end of the string if no more tokens exist
					var maskPos = maskToken ? part.indexOf(maskToken) : part.length;
					
					// if mask token not in first position, we have a delimiter
					if( maskPos ){
						// get the delimiter to find in the value string
						var delim = part.substring(0, maskPos)
							, valueEnd = parsed.indexOf(delim);
						
						// look for existing mask value and store in array
						if( tokens.length ){
							var maskLC = tokens[maskCount].mask.toLowerCase();

							// special handlers for complex masks

							// if quarter w/abbr month
							if( maskLC === "qqq" || maskLC === "qqqq" ){
								// remove the extra quarter string data
								parsed = parsed.replace(new RegExp("(^[Qq][1-4]) - \\w{3,} \\d+(" + delim + ")"), "$1$2");
								// find the new ending position
								valueEnd = parsed.indexOf(delim);
							}

							// store the value for the masked token value
							tokens[maskCount].value = parsed.substring(0, valueEnd);
						}
						
						// trim the parsed value string
						parsed = parsed.substring(valueEnd + delim.length);

						// advance the next parsing loop past delimiter
						i += maskPos;
					}
	
					// if a token exists, grab it				
					if( maskToken ){
						// increase the mask counter
						maskCount++;

						tokens.push({
							  mask: maskToken
								, value: null
						});
						
						// advance the next parsing past the token
						i += (maskToken.length-1);
					}
	
					// find the next token
					matchPos++;
				}
				
				// if the last mask value hasn't been found, grab it now
				if( tokens.length && (tokens[maskCount].value == null) ){
					tokens[maskCount].value = parsed;
				}
				
				// now that we've processed the string into an array of mask/values convert to a real date object
				var year=1970, month=0, day=1, hours=0, minutes=0, seconds=0, ampm; // epoch time

				// loop through the mask value/tokens
				for( var i=0, count=tokens.length; i < count; i++ ){
					var value = tokens[i].value;
					// get the mask
					switch( tokens[i].mask ){
						case "yy":
						case "yyyy":
							if( value.length == 2 ){
								// convert to a number
								year = parseInt(value, 10);
								// if more than 5 years in the future, assume it's from the past century
								year += (year > ((new Date().getFullYear() - 2000) + 5)) ? 1900 : 2000;
							} else {
								year = value;
							}
						break;
						
						case "m":
						case "mm":
							month = parseInt(value, 10)-1;
						break;
						
						case "mmm":
						case "mmmm":
							var names = Helper.i18n.get(lang, "date." + (tokens[i].mask === "mmm" ? "monthNamesShort" : "monthNames"));
							// loop through the names and find the match
							for( var j=0, jc = names.length; j < jc; j++ ){
								if( names[j] === value ){
									month = j;
									break;
								}
							}
						break;
						
						case "d":
						case "dd":
							day = value;
						break;
						
						case "qq":
						case "qqq":
						case "qqqq":
							if (value == 1 || (value.toUpperCase() === "Q1")) {
								month = 0;
								day = 1;
							} else if( value == 2 || (value.toUpperCase() === "Q2") ){
								month = 3;
								day = 1;
							} else if( value == 3 || (value.toUpperCase() === "Q3") ){
								month = 6;
								day = 1;
							} else if( value == 4 || (value.toUpperCase() === "Q4") ){
								month = 9;
								day = 1;
							}
						break;
						
						case "QQ":
						case "QQQ":
						case "QQQQ":
							if (value == 1 || (value.toUpperCase() === "Q1")) {
								month = 2;
								day = 31;
							} else if( value == 2 || (value.toUpperCase() === "Q2") ){
								month = 5;
								day = 30;
							} else if( value == 3 || (value.toUpperCase() === "Q3") ){
								month = 8;
								day = 30;
							} else if( value == 4 || (value.toUpperCase() === "Q4") ){
								month = 11;
								day = 31;
							}
						break;
						
						case "h":
						case "hh":
						case "H":
						case "HH":
							hours = parseInt(value, 10);
						break;
						
						case "M":
						case "MM":
							minutes = value;
						break;
						
						case "s":
						case "ss":
							seconds = value;
						break;
						
						case "t":
						case "tt":
							ampm = (value.toLowerCase().indexOf("p") > -1) ? "pm" : "am";
						break;
					}
				}
				
				// if we have an am/pm indicator, we need to adjust the hours
				if( (ampm === "pm") && (hours < 12) ) hours += 12;
				else if( (ampm === "am") && (hours >= 12) ) hours -= 12;
				
				return new Date(year, month, day, hours, minutes, seconds);
			}
			, convertISO8601: function (string, convertTZD){
				var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})"
				           + "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?"
				           + "(Z?(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
				var d = string.match(new RegExp(regexp));
				
				var offset = 0;
				var date = new Date(d[1], 0, 1);
				
				if( d[3] ){ date.setMonth(d[3] - 1); }
				if( d[5] ){ date.setDate(d[5]); }
				if( d[7] ){ date.setHours(d[7]); }
				if( d[8] ){ date.setMinutes(d[8]); }
				if( d[10] ){ date.setSeconds(d[10]); }
				if( d[12] ){ date.setMilliseconds(Number("0." + d[12]) * 1000); }
				
				// if not converting timezone, then return date as-is
				if( convertTZD === false || !d[14] ) return date;
				
				// if TZD information is present, use it
				if( d[14] ){
					offset = (Number(d[16]) * 60) + Number(d[17]);
					offset *= ((d[15] == '-') ? 1 : -1);
				}
				
				// adjust the original timezone offset to the browsers' timezone offset
				offset -= date.getTimezoneOffset();
				time = (Number(date) + (offset * 60 * 1000));

				date.setTime(Number(time));
				return date;
			}
		}
	};
	
	// store a global reference to the Helper library for use outside of the Maskerade plugin
	$.maskerade.Helper = Helper;

	/*
	 * Selection Functions
	 */
	var Selection = {
		// get the text currently selected by the user in a field
		text: function (field){
			var text = "";
			if( field.setSelectionRange ){
				text = field.value.substring(field.selectionStart, field.selectionEnd);
			} else if( document.selection ){
				var range = document.selection.createRange();
				if( range.parentElement() == field ){
					text = range.text;
				}
			}
			return text;
		}
		// get the position of the selected text
		, get: function (field){
			var pos = {};

			if( field.createTextRange ){
				var r = document.selection.createRange().duplicate();

				// get the starting position
				r.moveEnd("character", field.value.length);
				if( r.text.length === 0) pos.start = field.value.length;
				else pos.start = field.value.lastIndexOf(r.text);
				
				// get the ending position
				r.moveStart("character", -field.value.length);
				pos.end = r.text.length;
				
			} else {
				pos = {start: field.selectionStart, end: field.selectionEnd};
			}

			return pos;
		}
		// set the text selected in a field
		, set: function (field, start, end){
			if( field.setSelectionRange ){
				field.setSelectionRange(start, end);
			} else if( field.createTextRange ){
				var selRange = field.createTextRange();
				selRange.collapse(true);
				selRange.moveStart("character", start);
				selRange.moveEnd("character", end-start);
				selRange.select();
			} else {
				if( field.selectionStart ){
					field.selectionStart = start;
					field.selectionEnd = end;
				}
			}
			field.focus();
		}
		// determines if the entire field is selected
		, isAllSelected: function (field){
			var range = this.get(field);
			return ((range.start === 0) && (range.end && field.value.length));
		}
		// set the text selected in a field asynchronously--which makes sure that it happens after the browser updates the field
		, setAsync: function (field, start, end){
			var self = this, args = arguments;
			setTimeout(function (){
				self.set.apply(self, args);
			}, 0);
		}
	};

})(jQuery);
