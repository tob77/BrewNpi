/**
 * JMwidgets
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiVariables(wgtId, options, parentPage) {
	hmiWidget.call(this, wgtId, options, parentPage);	
}
hmiVariables.prototype = new hmiWidget();

hmiVariables.prototype.setValue = function (tag, newValue) {
	this[tag] = newValue;
	this.sendUpdate(tag, newValue);
    	// tell any jquery widgets that we changed
	$(this.elem).trigger('change.'+tag, {tag:tag, value:newValue} );   	
};
hmiVariables.prototype.getValue = function (tag) {
	return this[tag];
};
hmiVariables.prototype.addVar = function (varName, value) {
	if (arguments.length == 2)
   		this[varName] = value;
   	else
   		this[varName] = null;
};

$hmi.fn.hmiVariables = function(options, parentPage) {
	return new hmiVariables(this.wgtId, options, parentPage);
};

