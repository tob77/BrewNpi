/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiString", $.hmi.hmiWidget, {

	options: {
	},
	wgtClass: "hmi-string",	

	_create: function() {

		var options = this.options;

		this.defClasses = this._calcClass(options);				
		this.element
			.addClass( this.defClasses )
			.attr( "role", "string" )
			;
			
		this.defaultOptions(options, this.element);
		
		this.initWidget(new hmiString(this.hmiElem.id,options));	
	},
	_calcClass: function( options, lastClass ) { 
		return this.wgtClass;
	}, 		
});

}( jQuery ) );
