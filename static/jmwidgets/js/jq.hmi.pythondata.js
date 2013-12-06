/*!
 * JMwidgets 
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiPythonData", $.hmi.hmiWidget, {

	options: {

	},

	_create: function() {
		var options = this.options;
		var self = this;
			
		this.element
			.attr( "role", "PythonData" )
			;
		var wgtId = this.hmiElem.id;
		var parentPage = $hmi.activePage;
		this.initWidget(new hmiPythonData(wgtId, options, parentPage));	
	},
	
});

}( jQuery ) );
