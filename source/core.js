var DashJS = DashJS || {};

(function( core ){

	// ------------------------------------------------------------------------------------------------------------------------------
	// POLYFILLS
	// ------------------------------------------------------------------------------------------------------------------------------

		// Object.assign polyfill
		if( Object !== undefined && typeof Object.assign !== 'function' ) {
			Object.assign = function( t , o ) {
				for( var p in o ) {
					t[p] = o[p];
				}
			}
		}
		// Object.keys polyfill
		if( Object !== undefined && typeof Object.keys !== 'function') {
			Object.keys = function( o ) {
				var a = [];
				for( var p in o ) {
					a.push(p);
				}
				return a;
			}
		}

		// Polyfill for requestAnimationFrame
		var timestep = 1000/60;
		window.requestAnimationFrame = window.requestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| window.msRequestAnimationFrame
		|| (function() {
	        var lastTimestamp = Date.now(),
	            now,
	            timeout;
	        return function(callback) {
	            now = Date.now();
	            timeout = Math.max(0, timestep - (now - lastTimestamp));
	            lastTimestamp = now + timeout;
	            return setTimeout(function() {
	                callback(now + timeout);
	            }, timeout);
	        };
	    })(); // https://github.com/underscorediscovery/realtime-multiplayer-in-html5

		// Polyfill for cancelAnimationFrame
		window.cancelAnimationFrame = window.cancelAnimationFrame
		|| window.mozCancelAnimationFrame
		|| function(requestID){clearTimeout(requestID)} //fall back

	// ------------------------------------------------------------------------------------------------------------------------------
	// UTILITY FUNCTIONS
	// ------------------------------------------------------------------------------------------------------------------------------

	var _exists = function( o , p ) {
		if( o[p] == undefined ) { return false; }
		return true;
	}

	var _uuid = ( function () {

		// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

		var lut = [];

		for ( var i = 0; i < 256; i ++ ) {

			lut[ i ] = ( i < 16 ? '0' : '' ) + ( i ).toString( 16 );

		}

		return function generateUUID() {

			var d0 = Math.random() * 0xffffffff | 0;
			var d1 = Math.random() * 0xffffffff | 0;
			var d2 = Math.random() * 0xffffffff | 0;
			var d3 = Math.random() * 0xffffffff | 0;
			var uuid = lut[ d0 & 0xff ] + lut[ d0 >> 8 & 0xff ] + lut[ d0 >> 16 & 0xff ] + lut[ d0 >> 24 & 0xff ] + '-' +
				lut[ d1 & 0xff ] + lut[ d1 >> 8 & 0xff ] + '-' + lut[ d1 >> 16 & 0x0f | 0x40 ] + lut[ d1 >> 24 & 0xff ] + '-' +
				lut[ d2 & 0x3f | 0x80 ] + lut[ d2 >> 8 & 0xff ] + '-' + lut[ d2 >> 16 & 0xff ] + lut[ d2 >> 24 & 0xff ] +
				lut[ d3 & 0xff ] + lut[ d3 >> 8 & 0xff ] + lut[ d3 >> 16 & 0xff ] + lut[ d3 >> 24 & 0xff ];

			// .toUpperCase() here flattens concatenated strings to save heap memory space.
			return uuid.toUpperCase();

		};

	})();

	var _applyProperties = function( cfg , obj ) {
		
		for( var i in obj ) {
			if( cfg[i] == undefined ) { continue; }
			cfg[i] = obj[i];
		}
	
	};

	var _query = function( str ) {
			
		var res = typeof $ === 'function' ? $(str) : document.querySelector(str);
		return res;

	};

	var _remove = function( t , o ) {
			
		if( typeof $ === 'object' && typeof t.remove === 'function' ) {
			o.remove();
		} else {
			t.removeChild(o);
		}

	};

	// ------------------------------------------------------------------------------------------------------------------------------
	// DASHBOARD
	// ------------------------------------------------------------------------------------------------------------------------------

	core.dash = function( cfg ) {

		cfg = cfg || {};
		this.target = typeof cfg.target == 'string' ? _query(cfg.target) : cfg.target;
		this.gauges = {};

	}

	Object.assign( core.dash.prototype , {

		// --------------------------------------- GAUGE METHODS ------------------------------------------------

		gaugeExists: function(id) {

			return this.gauges[id] == undefined ? false : true;

		},

		getGauge: function(id) {

			return this.gaugeExists(id) ? this.gauges[id] : false;

		},

		addGauge: function(id,cfg){

			if( id == undefined || id == null ) { id = _uuid(); }
			if( _exists(this.gauges,id) ) { return false; }

			cfg = cfg || {};
			cfg.target = this.target;
			var gauge = new core.gauge(cfg);
			this.gauges[id] = gauge;

			return id;

		},

		removeGauge: function(id){

			if( !_exists(this.gauges,id) ) { return false; }

			this.gauges[id].destroy();
			delete this.gauges[id];

			return true;

		},

		// --------------------------------------- LAYERE METHODS ------------------------------------------------

		layerExists: function(gauge,id){

			return !this.gaugeExists(gauge) || this.gauges[gauge].layers[id] == undefined ? false : true;

		},

		getLayer: function(gauge,id){

			if( !this.layerExists(gauge,id) ) { return false; }
			return this.gauges[gauge].layers[id];

		},

		addLayer: function(gauge,id){

			if( id == undefined ) { id = _uuid(); }
			if( this.layerExists(gauge,id) ) { return false; }

			g = this.gauges[gauge];
			return g.addLayer(id);
			 
		},

		removeLayer: function(gauge,id){

			if( !this.gaugeExists(gauge) ) { return false; }
			var g = this.gauges[gauge];
			return g.removeLayer(id);

		},

		// --------------------------------------- ELEMENT METHODS ------------------------------------------------

		elementExists: function(gauge,layer,id) {

			return !this.layerExists(gauge,layer) || this.gauges[gauge].layers[layer].elements[id] == undefined ? false : true;

		},

		getElement: function() {

			if( !this.elementExists(gauge,layer,id) ){ return false; }
			return this.gauges[gauge].layers[layer].elements[id];

		},

		addElement: function(gauge,layer,id,type,config,exportCustomMethods){

			if( this.elementExists(gauge,layer,id) ){ return false; }
		
			gauge = this.gauges[gauge];
			layer = gauge.layers[layer];
			return layer.addElement( id , type , config , exportCustomMethods );
 

		},

		removeElement: function(gauge,layer,id){

			if( !this.layerExists(gauge,layer) ){ return false; }
			return this.gauges[gauge].layers[layer].removeElement(id);

		},

		updateElement: function(gauge,layer,id,property,value) {

			if( !this.layerExists(gauge,layer) ){ return false; }
			return this.gauges[gauge].layers[layer].updateElement(id,property,value);

		},

		reset: function() {

			for( var id in this.gauges ) {
				this.gauges[id].reset();
			}

		},

		destroy: function() {
 
			for( var id in this.gauges ) {
				this.gauges[id].destroy();
				delete this.gauges[id];
			}

		},

		// --------------------------------------- EXPORT/IMPORT METHODS ------------------------------------------------

		export: function() {

			var res = {};
			var o;
			for( var id in this.gauges ) {
				o = this.gauges[id];
				res[id] = {
					cfg: o.cfg,
					layers: o.export()
				};
			}
			return res;

		},

		import: function(data) {

			if( typeof data == 'string' ) {
				data = JSON.parse(data);
			}

			var o;
			for( var id in data ) {
				o = data[id];
				if( !this.addGauge( id , o.cfg ) ) { continue; }
				this.gauges[id].import( o.layers );
			}

		}

	});

	// ------------------------------------------------------------------------------------------------------------------------------
	// GAUGE
	// ------------------------------------------------------------------------------------------------------------------------------

	core.elements = {};

	core.gauge = function( cfg ) {

		// Configuration file. See defaultSettings() for available properties
		cfg = cfg || {};
		this.cfg = this.defaultSettings();
		_applyProperties( this.cfg , cfg );
		// The layers object holding all data for the layers and elements within each layer
		this.layers = {};
		// The target where this gauge will be injected in the DOM
		this.target = typeof cfg.target == 'string' ? _query(cfg.target) : cfg.target;
		// The container created to store the SVG elements for this gauge (layers)
		this.container = false;
		this.build();

		// Create one base layer by default
		this.addLayer("base");
 
	}
 
	Object.assign( core.gauge.prototype , {

		defaultSettings: function(){
			return {
				width: "400px",
				height: "400px",
				class: false
			};
		},
 
		build: function() {

			var div = document.createElement("div");
			//div.style.position = "relative";
			div.style.width = this.cfg.width;
			div.style.height = this.cfg.height;
			if( typeof this.cfg.class == 'string' ) { 
				div.className = this.cfg.class;
			}
			this.container = div;
			this.inject();

		},

		inject: function() {

			if( typeof this.target !== 'object' || typeof this.container !== 'object' ) { return false; }
			// Implement vanilla JS and JQuery support
			var call = 'appendChild';
			if( typeof this.target.appendChild !== 'function' && typeof this.target.append == 'function' ) {
				call = 'append';
			}
			
			this.target[call]( this.container );
			return true;

		},

		reset: function() {

			for( var id in this.layers ) {
				this.removeLayer( id );
			}

		},

		destroy: function() {

			this.reset();
			_remove(this.target,this.container);
			this.container = false;

		},

		export: function() {

			var res = {};
			var o;
			for( var id in this.layers ) {
				o = this.layers[id];
				res[id] = o.export();
			}
			return res;

		},

		import: function(data) {

			if( typeof data == 'string' ) {
				data = JSON.parse(data);
			}

			var o;
			for( var id in data ) {

				o = data[id];
				if( !this.addLayer(id) && this.layers[id] == undefined ) { continue; }
				this.layers[id].import( o );
			}

		},

		addLayer: function(id) {

			if( _exists(this.layers,id) ) { return false; }
			this.layers[id] = new core.layer(this);
			return true;

		},

		removeLayer: function(id) {

			if( !_exists(this.layers,id) ) { return false; }
			var l = this.layers[id];
			// Remove all elements in the layer first, then remove the SVG
			l.destroy();
			delete this.layers[id];
			return true;

		},

		getLayer: function(id) {

			if( !_exists(this.layers,id) ) { return false; }
			return this.layers[id];

		}

	});

	// ------------------------------------------------------------------------------------------------------------------------------
	// LAYER
	// ------------------------------------------------------------------------------------------------------------------------------

	core.layer = function( gauge ) {

		this.gauge = gauge;
		this.svg = false;
		this.defs = false;
		this.elements = {};
		this.build();

	}

	Object.assign( core.layer.prototype , {

		build: function() {

			if( typeof this.gauge.container !== 'object' ) { return false; }
			if( typeof this.svg == 'object' ) {
				this.gauge.container.removeChild( this.svg );
			}

			var spec = "http://www.w3.org/2000/svg";

			var svg = document.createElementNS(spec, "svg");
			svg.setAttribute( 'width' , "100%" );
			svg.setAttribute( 'height' , "100%" );
			svg.style.position = "absolute";

			var defs = document.createElementNS(spec, "defs");
			svg.appendChild( defs );
  
			this.svg = svg;
			this.defs = defs;

			this.gauge.container.appendChild( this.svg );

		},

		// Merge the elements of a specified layer with this one. Once merging is done, the old layer is discarded.
		merge: function( layer ) {},
		 
		// Reset the layer to an empty SVG
		reset: function() {

			for( var id in this.elements ) {
				this.removeElement(id);
			}

		},
		// Remove all DOM elements. Remove elements then, get rid of SVG
		destroy: function() {

			this.reset();
			_remove( this.gauge.container , this.svg );
			this.svg = false;
			this.defs = false;

		},

		export: function() {

			var res = {};
			var o;
			for( var id in this.elements ) {
				o = this.elements[id];
				res[id] = {
					type: o.type,
					config: o.config,
					customMethods: o.customMethods
				}
			}
			return res;

		},

		import: function(data) {

			if( typeof data == 'string' ) {
				data = JSON.parse(data);
			}

			var o;
			for( var id in data ) {
				o = data[id];
				this.addElement( id , o.type , o.config , o.customMethods );
			}

		},

		addElement: function( id , type , config , exportCustomMethods ) {

			type = type.trim().toLowerCase();
			var element = core.elements[ type ];
			 
			// Check to see if the element
			if( element == undefined ) { return false; }
		 
			var filtered = core.verify.filter( config , element.Schema.Properties );
			if( !filtered ) { return false; }

			var uuid = ( !core.tools.isEmptyString( id ) && !core.tools.propertyExists( this.elements , id ) ) ? id : _uuid();
			this.elements[uuid] = {
				type: type,
				config: filtered,
				customMethods: false
			};

			var fType = element.Schema, SVG_Type = fType.SVG_Elem, nElem = 1 , SVG_Data;
			var instance = this.elements[uuid];
			instance.Object = ''; 

			if( fType[ "Quantifier" ] !== undefined && fType.Properties[ fType.Quantifier ] !== undefined && filtered[ fType.Quantifier ] !== undefined ) {
		
				instance.Object = [];
				
				nElem = filtered[ fType.Quantifier ];
				if( DashJS.tools.isArray( nElem ) ) { 
					nElem = nElem.length;				
				}
				
			} 
			
			for( var i = 0; i < nElem; i++ ) {
				
				SVG_Data = document.createElementNS("http://www.w3.org/2000/svg", SVG_Type );
				
				if( typeof instance.Object === "string" ) {
					instance.Object = SVG_Data;
				} else {
					instance.Object.push( SVG_Data );
				}
				
				this.svg.appendChild( SVG_Data );
				
			}
		 	
		 	// Call update/drawing function for this element type
			DashJS.elements[ type ].Update.bind( { element: instance , layer: this , gauge: this.gauge } )();

			var RetObj = {};
			RetObj.Reference = uuid;

			if( exportCustomMethods === true && DashJS.tools.propertyExists( DashJS.elements[ type ] , 'Methods' ) ) {
				 
				RetObj.Methods = {};
				this.elements[uuid].customMethods = true;

				// Recursive function, cycle through the element's custom methods and assign them
				var Iterate = function( Obj , Target ) {

					for( var p in Obj ) {

						if( DashJS.tools.isObject( Obj[ p ] ) ) {

							Target[ p ] = {};
							Iterate( Obj[ p ] , Target[ p ] );

						} else if( DashJS.tools.isFunction( Obj[ p ] ) ) {

							// Bind essential variables to the function's 'this' component
							Target[ p ] = Obj[ p ].bind( { element: instance, layer: this, gauge: this.gauge } );

						}

					}

				};

				Iterate.bind(this)( DashJS.elements[ type ].Methods , RetObj.Methods );

			}
 
			return RetObj;


		},

		updateElement: function( id , Property , NewValue ) {

			var instance = this.elements[id];

			if( instance == undefined ) { return false; }
			if( Property == undefined || typeof Property !== "string" || NewValue == undefined ) {
				return false;	
			}
		  
			var type = instance.type;
			var Prop = Property.trim();
			 
			var element = DashJS.elements[type];
			var eFilterType = element.Schema.Properties;
			 
			if( DashJS.tools.propertyExists( eFilterType , Prop ) && DashJS.verify.type( eFilterType[ Prop ].Type , NewValue ) ){
				
				if( instance.config[ Prop ] !== NewValue ) {
					 
					instance.config[ Prop ] = NewValue;
					element.Update.bind( { element: instance , layer: this , gauge: this.gauge } )();

					return true;
				
				}
		 
			}

			return false;

		},

		// Remove a specific element from the layer
		removeElement: function(id) {

			if( !_exists(this.elements,id) ) { return false; }

			var el = this.elements[id];
			var o = el.Object;
			// Quick hack to convert a single object to an array with one element
			if( !o.length ) { o = [o]; }  
			// Go through all objects and remove them from SVG
			for( var i = 0 ; i < o.length; i++ ) {
				_remove(this.svg , o[i]);
			}
			// Finally, delete property from elements object AFTER the HTML is removed
			delete this.elements[id];
			return true;

		},

	});
	 

})( DashJS );



DashJS.verify = (function( _pub ){

	_pub.type = function( type , item ) {
	 
		var Filter = {
			
			"integer" : "isInteger",
			"number" : "isNumber",
			"hex" : "isHexColor",
			"array" : "isArray",
			"string" : "isString",
			"boolean" : "isBoolean",
			"object" : "isObject"
			
		};
		 
		return ( !Filter.hasOwnProperty( type ) || !DashJS.tools[ Filter[ type ] ]( item ) ) ? false : true;
		
	};

	_pub.filter = function( Config , Filter ) {
 
		if( !DashJS.tools.isObject( Config ) || !DashJS.tools.isObject( Filter ) ) {
			return false;
		}

		var newConfig = JSON.parse( JSON.stringify( Config ) );

		var cfgProp , fProp;
		var hasDefault , hasType , hasMin , hasMax , cfgHasProp;

		for( var p in Filter ) {

			fProp = Filter[ p ];

			if( DashJS.tools.isArray( fProp ) && fProp.indexOf( Config[ p ] ) === -1 ) {

				return false;
			
			} else if( DashJS.tools.isObject( fProp ) ) {

				hasDefault = fProp.hasOwnProperty("Default");
				hasType = fProp.hasOwnProperty("Type");
				hasMin = fProp.hasOwnProperty("Min");
				hasMax = fProp.hasOwnProperty("Max");
				cfgHasProp = Config.hasOwnProperty( p );
				 
				if( hasDefault && !cfgHasProp ) {
	 			 
					newConfig[ p ] = fProp.Default;
	  
				} else if( !hasDefault && !cfgHasProp ) {
	 
					return false;

				}

				cfgProp = newConfig[ p ];
			 
				if( hasType && !_pub.type( fProp.Type , cfgProp ) ) {

					return false;

				}

				if( ( hasMin && cfgProp < fProp.Min ) || ( hasMax && cfgProp > fProp.Max ) ) {

					if( hasDefault ) {

						newConfig[ p ] = fProp.Default;

					} else {

						return false;
						
					}

				}
			 
			}
			 

		}

		return newConfig;

	};

	return _pub;

})( {} );


DashJS.tools = (function( _pub ){
 
	_pub.isFunction = function( val ) {

		return typeof val !== 'function' ? false : true;

	};

	_pub.isObject = function( val ) {
	 
		return (val == undefined || Object.prototype.toString.call( val ) !== "[object Object]") ? false : true;
		
	};

	_pub.isEmptyObject = function( obj ) {
		
		for( var i in obj ) {
			if( obj.hasOwnProperty( i ) ) { return false; }
		}
		return true;
	 
	};

	_pub.isArray = function( val ) {
	 
		return ( val == undefined || val.constructor !== Array ) ? false : true;
		
	};


	_pub.isInteger = function( val ) {
		 
		return val === parseInt( val , 10 ) ? true : false;
		
	};

	_pub.isNumber = function( o ) {

		return ! isNaN (o-0) && o !== null && o !== "" && o !== false;
	  
	};

	_pub.isString = function( val ) {
		 
		return ( val == undefined || typeof val !== "string" ) ? false : true; 
		
	};

	_pub.isBoolean = function( val ) {
		 
		return ( val == undefined || typeof val !== "boolean" ) ? false : true; 
		
	};


	_pub.isHexColor = function( val ) {
		
		return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test( val );
		
	};

	_pub.isRGBColor = function( val ) {
	 
		// If the value passed is not in string format, return false
		if( typeof val !== 'string' ) { return false; }
		
		// Remove whitespace from left/right
		var c = val.trim();
		
		// Bare minimum expression : rgb(0,0,0) => Minimum length of an rgb expression is 10 symbols
		// If length of expression is less than 10 symbols or the first 3 symbols do not state 'rgb' -> return false
		if( c.length < 10 || c.substring( 0 , 3 ).toLowerCase() !== 'rgb' ) { return false; }
		
		c = c.substring( 3 , c.length );
		c = c.trim();
		
		if( c.substring( 0 , 1 ) !== "(" || c.substring( c.length-1 , c.length ) !== ")" ) { return false; }
		
		c = c.substring( 1 , c.length-1 );
		c = c.split(",");
		 
		if( c.constructor !== Array || c.length !== 3 ) { return false; }
		
		var n;
		for( var i = 0; i < c.length; i++ ) {
			
			n = parseInt( c[ i ] );
			if( n < 0 || n > 255 ) {
				
				return false;
				
			}
			
		}
	 
		return true;
		
	};

	_pub.DegToRad = function( degrees ) {

		return degrees * Math.PI / 180;
	  
	};

	_pub.CheckIndex = function( Arr , Ind ) {
	 
		return ( Arr == undefined || Arr.constructor !== Array || Ind == undefined || !this.isInt( Ind ) || Ind < 0 || Ind >= Arr.length ) ? false : true;
		
	};

	_pub.indexOfProperty = function( Arr , Attr , Val ) {

	    for( var i = 0; i < Arr.length; i += 1 ) {
		
	        if( Arr[ i ][ Attr ] === Val ) {
			
	            return i;
				
	        }
			
	    }
		
	    return -1;
		
	};

	_pub.HexToRGB = function( hex ) {

	    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
	        return r + r + g + g + b + b;
	    });

	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
		
	};

	_pub.randomInt = function(min, max) {

	    return Math.floor(Math.random() * (max - min + 1)) + min;
		
	};

	_pub.propertyExists = function( obj , prop ) {

		if( obj === undefined || prop === undefined || obj[ prop ] === undefined ) {

			return false;

		}

		return true;

	};

	_pub.isEmptyObject = function( obj ) {
		
		if( !this.isObject( obj ) ) { return false; }
		if( Object.keys(obj).length <= 0 ) { return false; } 
		return true;
	 
	};

	_pub.isEmptyString = function( val ) {

		if( this.isString( val ) && val.trim().length > 0 ) {

			return false;

		}

		return true;

	};

	_pub.Clamp = function( val , min , max ) {

		return Math.min( Math.max( val , min ) , max );

	};

	return _pub;


})( {} );


DashJS.shapes = (function( _pub ){
 
	_pub.SVG_Circle = function( X , Y, Rad , StartAngle , EndAngle , Closed ) {
    
		var sX , sY , eX , eY , L;
		
		var sAng = DashJS.tools.DegToRad( StartAngle );
		var eAng = DashJS.tools.DegToRad( EndAngle );

		var ClosePath = ( Closed !== undefined && Closed === true ) ? ' Z' : '';

		sX = X - Rad * Math.cos( eAng );
		sY = Y - Rad * Math.sin( eAng );
		eX = X - Rad * Math.cos( sAng );
		eY = Y - Rad * Math.sin( sAng );

		L = ( EndAngle - StartAngle ) <= 180 ? '0' : '1';

		return 'M '+sX+' '+sY+' A '+Rad+' '+Rad+' 0 '+L+' 0 '+eX+' '+eY+ClosePath;
	  
	   
	};


	_pub.SVG_PolyArc = function( X , Y , Rad , StartAngle , EndAngle , Iterations ) {
	
	    var minIter = 5;
		
	    var Iter = Iterations < minIter ? minIter : Iterations;
	    var aRange = EndAngle - StartAngle;
	    var aInt =  aRange / ( Iter-1 );
		
		var pts = '';
	    var cAng, pcos, psin;
		
	    for( var i = 0; i < Iter; i++ ) {
	    	
	        cAng = DashJS.tools.DegToRad( StartAngle + aInt*i );
	        
	        pcos = X - Math.cos( cAng ) * Rad;
	        psin = Y - Math.sin( cAng ) * Rad;
	        
	        pts += pcos+','+psin+' ';
	        
	    }
		
		return pts;
		
	};


	return _pub;

})( {} );