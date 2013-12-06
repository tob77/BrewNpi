/**
 * JMwidgets version 
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiSlider", $.hmi.hmiWidget, {

	options: {
		type: 'horiz',
		min: 0,
		max: 100
	},
	wgtClass: "hmi-slider",	
	
	_create: function() {
		var options = this.options;
			
		this.defClasses = this._calcClass(options);	
		this.element
			.addClass( this.defClasses )
			.attr( "role", "slider" );
			// note: need to set bkdg size before adding thumb
		this._setLayout(options);	
			
		var myClass = this._calcClass(options, true);
		$(this.element).prepend('<div class="'+myClass+'-thmb"></div>');
		
			// set background color
	    if (options.fill) 
	        this.element.css('background-color', options.fill);
				
		this.defaultOptions(options, this.element);

		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiSlider(wgtId, options));	
	},
	_calcClass: function( options, lastClass ) { 
		var strClass = this.wgtClass,
			strTypeClass = strClass;
		if (options.type) {
			strTypeClass += "-"+options.type;
			strClass += " "+strTypeClass;
		}
		if (options.style && (options.style!=="default")) 
			strClass +="-"+options.style;
			
		return lastClass ? strTypeClass : strClass;
	},	
	_resetLayout: function(  ) {      
		var jq = $(this.element);
		jq.css('background-size','');		
	},	
	_setLayout: function( options, strClass ) {      
			// adjust bkgd image width if we are using not using content box images
		var strBkOrigin = this.element.css('background-origin');
		if (strBkOrigin.indexOf('content-box')<0) {
			var strBkSize = this.element.css('background-size');
			if (options.type==='vert')
			 	strBkSize = this._calcBkSizeCSS( strBkSize, this.element.outerHeight(), 1 );
			else
			 	strBkSize = this._calcBkSizeCSS( strBkSize, this.element.outerWidth() );
			 	
			if (strBkSize)
				this.element.css('background-size', strBkSize);
		}	
	},	
	_setOption: function( key, value ) {
		if ((key==='type')||(key==='style')) {
				// handle type or shape changes
			this.options.type = (key==='type') ? value : this.options.type;
			this.options.style = (key==='style') ? value : this.options.style;
				
			this._resetLayout();
			this.element.removeClass(this.defClasses);
			this.defClasses = this._calcClass(this.options);
			this.element.addClass(this.defClasses);
			this._setLayout(this.options);
			return this;
		}
		$.hmi.widget.prototype._setOption.apply( this, arguments );
	},		
});

}( jQuery ) );
