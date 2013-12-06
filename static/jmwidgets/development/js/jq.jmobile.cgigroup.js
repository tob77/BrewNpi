/*!
 * JMwidgets 
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "jmobile.jmobileCgiGroup", $.hmi.hmiWidget, {

	options: {

	},


	_create: function() {
		var options = this.options;
		var self = this;
			
		this.element
			.attr( "role", "jmobileCgiGroup" )
			;
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiCgiGroup(wgtId, options));	
	},
	
});

}( jQuery ) );
