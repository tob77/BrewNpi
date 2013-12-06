/**
 * JMwidgets 
 * Copyright (c) 2012, BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
(function( $, undefined ) {


$.widget( "hmi.hmiPage", $.hmi.hmiWidget, {

	options: {

	},
	wgtClass: "hmi-page",	
	
	_create: function() {
		var options = this.options;
			
		this.defClasses = this._calcClass(options);	
		this.element
			.addClass( this.defClasses )
			.attr( "role", "page" )
			;
			// handle page events
		$(this.element).bind('pagestart', function() {
			if (self.hmiObj)
				self.hmiObj.trigger('pagestart');
		});
		
		var wgtId = this.hmiElem.id;
		this.initWidget(new hmiPage(wgtId,options));	
	},

});

}( jQuery ) );
