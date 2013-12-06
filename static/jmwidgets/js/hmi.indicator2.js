/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiIndicator2(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;

    this.dataLinks = [];
    this.type = "image";
    this.colors=['red','yellow', 'lime'];
    this.numStates = 3;
    this.imgWidth = 32;
    this.imgX = 0;
    this.imgY = 0;
    this.curState = 0;
    hmiWidget.call(this, wgtId, options, parentPage);
    
         // set the initial state     
	this.setValue('value', this.curState);
}
/**
 * Inheriting the base class Widget
 */
hmiIndicator2.prototype = new hmiWidget();

/**
 * Setting the value of the Indicator(Light) widget
 * @param {String} tag The tag name
 * @param {Number} newValue The new widget value
 */
hmiIndicator2.prototype.setValue = function (tag, newValue) {
    if (tag == 'value') {
        if (newValue == 'Off' || newValue == 'Not Running' || newValue == 'Closed'){
            newValue = '0';
        }
        if (newValue == 'On' || newValue == 'Running' || newValue == 'Open'){
            newValue = '1';
        }
	    if (this.isBadValue(newValue)) {
	        return false;
	    }
        newValue = parseFloat(newValue);
        if (isNaN(newValue)) {
            return false
        }
		this.setState(newValue);
    } else {
        hmiWidget.prototype.setValue.call(this, tag, newValue);
    }
};

/**
 * Function to get the value of the Widget
 * @param {String} tag tag name will be the property name
 */
hmiIndicator2.prototype.getValue = function (tag) {
    if (tag == "value") {
        return this.curState;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};

hmiIndicator2.prototype.setState = function (newValue) {
    var value = parseInt(newValue) % this.numStates;
    var index = value;
    
    if (this.disabled)
    	return;
    	// support for not consecutive indicies
    if (this.states)
    	index = this.states.indexOf(value);
    	
    if (this.type==="color") {
    	var color = this.colors[index];
    	var isOff = ((color=='none')||(color==='off')) ? 1 : 0;
     	this.elem.style.backgroundColor = isOff ? '#555' : color;
    	if (isOff) {
    		$(this.elem).css('box-shadow', 'none');
    		$(this.elem).css('-webkit-box-shadow', 'none');
    	} else {
   			$(this.elem).css('box-shadow', '0px 0px 20px 1px '+color);
   			$(this.elem).css('-webkit-box-shadow', '0px 0px 20px 1px '+color);
		}    		
    } else {
        var absValue = Math.abs(index);
        // select the image in the image list (use neg values for images)
        var imgOffset = -this.imgX - (absValue * this.imgWidth);
        if (this.curState != absValue) {
            this.curState = absValue;
            $(this.elem).css('background-position', imgOffset + 'px ' + -this.imgY + 'px');
        }
    }
};

$hmi.fn.hmiIndicator2 = function (options, parentPage) {
    return new hmiIndicator2(this.wgtId, options, parentPage);
};