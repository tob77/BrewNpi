/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiIndicator2", $.hmi.hmiWidget, {

	options: {
		shape: 'round'
	},
	wgtClass: "hmi-ind",
	
	_create: function() {
		var options = this.options;
		
		this.defClasses = this._calcClass(options);
		this.element
			.addClass( this.defClasses )
			.attr( "role", "indicator" );
					
		this._setLayout(options);
		options.type="color";
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiIndicator2(wgtId, options));	
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
	_setLayout: function( options, strClass ) {      
			// recalc bkgd size if we are not round
		if (options.shape==='rrect') {
			var strBkSize = this._calcBkSizeCSS( this.element.css('background-size'), this.element.outerWidth() );
			if (strBkSize)
				this.element.css('background-size', strBkSize);
		}
			// adjust border radius
		if (!options.radius && (options.shape==='rrect')) {
				// need to assume border is 20px by default since browsers do not return border radius reliably
//				var strCurRad = this.element.css('border-radius');
			var strRad = this._calcBorderRadCSS("20px", options.defBkImgSize);
			this.element.css('border-radius', strRad);
		}		
	},	

	_setOption: function( key, value ) {
		if ((key==='shape')||(key==='style')) {
				// handle style or shape changes
			this.options.shape = (key==='shape') ? value : this.options.shape;
			this.options.style = (key==='style') ? value : this.options.style;
				
			this._resetLayout();
			this.element.removeClass(this.defClasses);
			this.defClasses = this._calcClass(this.options);
			this.element.addClass(this.defClasses);
			this._setLayout(this.options);
			return this;
		}else if ( key === "state" ) {
            this.hmiObj.setValue('value', value);
			return;
		} 
		$.hmi.widget.prototype._setOption.apply( this, key, value );

	},	
		
});

}( jQuery ) );
