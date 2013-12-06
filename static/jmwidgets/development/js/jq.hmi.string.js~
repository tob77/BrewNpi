/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiNumeric", $.hmi.hmiWidget, {

	options: {
	},
	wgtClass: "hmi-numeric",	

	_create: function() {

		var options = this.options;

		this.defClasses = this._calcClass(options);				
		this.element
			.addClass( this.defClasses )
			.attr( "role", "numeric" )
			;
			
		this.defaultOptions(options, this.element);
		
		this.initWidget(new hmiNumeric(this.hmiElem.id,options));	
	},
	_calcClass: function( options, lastClass ) { 
		return this.wgtClass;
	}, 		
});

}( jQuery ) );
