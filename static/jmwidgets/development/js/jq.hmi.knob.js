/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiKnob", $.hmi.hmiWidget, {

	options: {
		type: 'round'
	},
	wgtClass: "hmi-knob",	
	imgCtr: null,
	
	_create: function() {
		var options = this.options;

		this.defClasses = this._calcClass(options);	
		this.element
			.addClass( this.defClasses )
			.attr( "role", "knob" );
		
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
			// knob image size in CSS is based on 150 x 150
		options.viewScale = { x:w/150, y:h/150 };
			// add canvas for the thumb
		jq.prepend('<canvas width="'+w+'" height="'+h+'"></canvas>');
			// copy css image needle to canvas image
		this._initKnob(options, w, h);
		if (this.imgCtr) {
			options.imgCx = this.imgCtr.x;
			options.imgCy = this.imgCtr.y;
		}
		this.defaultOptions(options, this.element);
			
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiKnob(wgtId, options));	
		
	},
	_calcClass: function( options, lastClass ) { 
		var strClass = this.wgtClass;
		if (options.type) {
			strClass += lastClass ? ("-"+options.type) : (" "+this.wgtClass+"-"+options.type) ;
		}
		return strClass;
	}, 
	_initKnob: function (options, w, h) {
	 
	    var elems = this.element[0].getElementsByTagName('canvas');
	    if (elems && elems.length>0) {
	    	var canvas = elems[0];
			if (canvas) {
				var jqCanv = $(canvas);
		    		// needle images are stored as CSS bkgd images of a canvas element
			    	//  using CSS allows us to provide different themes for the needles in the future
			    	// (note: need to use jquery css to get true css during load time) 
			    var bkgdImg = jqCanv.css('background-image');   	 
			    var strBkgdPos = jqCanv.css('background-position');
			    if (strBkgdPos)
			    	this.imgCtr = this._textToPt(strBkgdPos);
		    	
				jqCanv.css('background-image', "none");  	
				jqCanv.css('background-position', "none");  	
	
				jqCanv.prepend('<img src="'+this._cssUrlToFile(bkgdImg)+'" />');
			}
		}	
	},
	
});

}( jQuery ) );
