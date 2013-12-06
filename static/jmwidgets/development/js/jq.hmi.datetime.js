/**
 * JMwidgets
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiDateTime", $.hmi.hmiWidget, {

	options: {
	},
	wgtClass: "hmi-datetime",	
	_create: function() {

		var options = this.options;
		
		this.defClasses = this._calcClass(options);	
		this.element
			.addClass( this.defClasses )
			.attr( "role", "datetime" )
			;
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiDateTime(wgtId,options));	
	},
	_calcClass: function( options, lastClass ) { 
		return this.wgtClass;
	}, 	
});

}( jQuery ) );
