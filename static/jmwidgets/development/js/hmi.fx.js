/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiShadowFx() { 
}
hmiShadowFx.prototype.effect = function (options, element) {
		// add a bottom div to show the shadow
	if (options.shape==='round')
		$(element).addClass("hmi-fx-shadow-round");
	else
		$(element).addClass("hmi-fx-shadow");

}
$hmi.addFx('shadow', new hmiShadowFx());

// float effect
function hmiFloatFx() { 
}
hmiFloatFx.prototype.effect = function (options, element) {

	$(element).wrap("<div class='hmi-fx-float' ></div>");
}
$hmi.addFx('float', new hmiFloatFx());