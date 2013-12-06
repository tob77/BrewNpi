/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
(function( $, undefined ) {


$.widget( "hmi.hmiButton", $.hmi.hmiWidget, {

	options: {
		shape: 'rect',
		isToggle: false,
		style: undefined,
		type: 'standard',
		text: null,
		downClass: null,
		defBkImgSize: {width:150, height:150}
	},
	wgtClass: "hmi-btn",
	
	_create: function() {
		var options = this.options;
		var self = this;
	
		this.defClasses = this._calcClass(options);
		if (options.shape==="rrect") 
			options.type = "css-box";
						
		this.element
			.addClass( this.defClasses )
			.attr( "role", "button" );
			
		if (options.type==="css-box") {
			var upClass = "hmi-btn-"+options.shape;
			options.downClass = upClass+"-down";
			this._setLayout(options);

		}
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiButton(wgtId, options));	
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
		$.hmi.hmiWidget.prototype._setOption.call( this, key, value );
 
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
	_resetLayout: function(  ) {      
		var jq = $(this.element);
		jq.css('background-size','');		
		jq.css('border-radius','');
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
});

}( jQuery ) );
