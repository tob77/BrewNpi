/*
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiBorder(wgtId, options, parentPage) {
	hmiWidget.call(this, wgtId, options, parentPage);	
	
};
hmiBorder.prototype = new hmiWidget();


$hmi.fn.hmiBorder = function(options, parentPage) {
	return new hmiBorder(this.wgtId, options, parentPage);
};


