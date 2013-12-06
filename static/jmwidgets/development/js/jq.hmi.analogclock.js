/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
(function( $, undefined ) {


$.widget( "hmi.hmiAnalogClock", $.hmi.hmiWidget, {

	options: {
		shape: 'round'
	},
	wgtClass: "hmi-analogclock",
		
	_create: function() {
		var options = this.options;
		
		this.defClasses =this._calcClass(options);
				
		this.element
			.addClass( this.defClasses )
			.attr( "role", "analogclock" );	
					
		var	jq = $(this.element),
			w = jq.width(),
			h = jq.height(),
			bkgdImgSize = this._textToPt(jq.css('background-size'));		
		
		if (bkgdImgSize) {
			options.scale = {x:w/bkgdImgSize.x, y:h/bkgdImgSize.y};
			jq.css('background-size', "100%");
		} 
			// add canvas for needles
		$(this.element).prepend('<canvas width="'+w+'" height="'+h+'"></canvas>');
		
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiAnalogClock(wgtId, options));	
	},
	_calcClass: function( options , lastClass) { 
		var strLastClass;
		if (options.style)	{
			strLastClass = this.wgtClass+"-"+options.shape+"-"+options.style;
		} else {	
			strLastClass = this.wgtClass+"-"+options.shape;
		}
		var strClass = lastClass ? strLastClass : this.wgtClass+" "+strLastClass;
		return strClass;
	}, 		
});

}( jQuery ) );
