/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
(function( $, undefined ) {


$.widget( "hmi.hmiBarGraph", $.hmi.hmiWidget, {

	options: {
		type: 'horiz',
		min: 0,
		max: 100
	},
	wgtClass: "hmi-bar",
		
	_create: function() {
		var options = this.options;
		
		this.defClasses = this._calcClass(options);	
		this.element
			.addClass( this.defClasses )
			.attr( "role", "bargraph" );
		
		var myClass = this._calcClass(options, true);
		$(this.element).prepend('<div class="'+myClass+'-bar"></div>');

		this.defaultOptions(options, this.element);

		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiBarGraph(wgtId, options));	
	},
	_calcClass: function( options, lastClass ) { 
		var strClass = this.wgtClass;
		if (options.type) {
			strClass += lastClass ? ("-"+options.type) : (" "+this.wgtClass+"-"+options.type) ;
		}
		return strClass;
	}, 
	_setOption: function( key, value ) {      
		if (key==='type') {
				// handle type changes
			this.options.type = value;
				
			this._resetLayout();
			this.element.removeClass(this.defClasses);
			this.defClasses = this._calcClass(this.options);
			this.element.addClass(this.defClasses);
			this._setLayout(this.options);
			return this;
		}
	
		$.hmi.hmiWidget.prototype._setOption.call( this, key, value );
 
	},	
	destroy: function() {
		this.element
			.removeClass( this.defClasses )
			.removeAttr( "role" );

		$.hmi.widget.prototype.destroy.call( this );
	},
	
});

}( jQuery ) );
