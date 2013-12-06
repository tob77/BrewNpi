/**
 * JMwidgets 
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiVariables", $.hmi.hmiWidget, {

	options: {
		text: null
	},


	_create: function() {
		var options = this.options;
		var self = this;
			
		this.element
			.attr( "role", "variables" )
			;
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiVariables(wgtId, options));	
	},
	
});

}( jQuery ) );
