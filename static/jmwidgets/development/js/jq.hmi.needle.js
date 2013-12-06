/**
 * JMwidgets 
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiNeedle", $.hmi.hmiWidget, {

	options: {
		type: 'round'
	},
	wgtClass: "hmi-needle",	
	imgCtr: null,
	
	_create: function() {
		var options = this.options;

		this.defClasses = this._calcClass(options);	
		this.element
			.addClass( this.defClasses )
			.attr( "role", "needle" );
		
		var	jq = $(this.element),
			w = jq.width(),
			h = jq.height();

			// init the needle center point
		options.cx = w/2;
		options.cy = h/2;
		if (options.ctr) {		
			if (options.ctr.x)
				options.cx = options.ctr.x;
			if (options.ctr.y)
				options.cy = options.ctr.y;
			if (options.ctr.dx)
				options.cx += options.ctr.dx;
			if (options.ctr.dy)
				options.cy += options.ctr.dy;
		}	
		if (options.scale) {
			options.scale.x = options.scale.x || 1;
			options.scale.y = options.scale.y || 1;
		}
		if (options.type==='round') {
				// add canvas for needle
			$(this.element).prepend('<canvas width="'+w+'" height="'+h+'"></canvas>');
				// copy css image needle to canvas image
			this._initNeedle();
			if (this.imgCtr) {
				options.imgCx = this.imgCtr.x;
				options.imgCy = this.imgCtr.y;
			}
		} else {
			var myClass = this._calcClass(options, true);
				// add div for vert and horiz needles
			$(this.element).prepend('<div class="'+myClass+'-ne"></div>');
		}
			
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiNeedle(wgtId, options));	
		
	},

	_calcClass: function( options, lastClass ) { 
		var strClass = this.wgtClass;
		if (options.type) {
			strClass += lastClass ? ("-"+options.type) : (" "+this.wgtClass+"-"+options.type) ;
		}
		return strClass;
	}, 
	
	_initNeedle: function () {
 
	    var elems = this.element[0].getElementsByTagName('canvas');
	    if (elems && elems.length>0) {
	    	var canvas = elems[0];
			if (canvas) {
		    		// needle images are stored as CSS bkgd images of a canvas element
			    	//  using CSS allows us to provide different themes for the needles in the future
			    	// (note: need to use jquery css to get true css during load time) 
			    var bkgdImgs = $(canvas).css('background-image').split(",");   	 
			    var bkgdPos = $(canvas).css('background-position').split(",");
			    if (bkgdPos.length>0)
			    	this.imgCtr = this._textToPt(bkgdPos[0]);
			    	
			   	$(canvas).css('background-image', "none");  	
			   	$(canvas).css('background-position', "none");  	
	
				$(canvas).prepend('<img src="'+this._cssUrlToFile(bkgdImgs[0])+'" />');
			}
		}	
	},

});

}( jQuery ) );
