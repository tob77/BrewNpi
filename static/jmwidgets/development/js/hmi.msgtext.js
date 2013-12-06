/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiMsgText(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;

    this.dataLinks = [];
    this.value = null;
    this.numStates = 0;
    hmiWidget.call(this, wgtId, options, parentPage);
    // set initial state
    this.msgElems = this.elem.getElementsByTagName('span');
    if (this.msgElems) {
        this.numStates = this.msgElems.length;
    }

    // set a default message value
    if (!this.value) {
        this.setValue('value', 0);
    }

}
/**
 * Inheriting the base class Widget
 */
hmiMsgText.prototype = new hmiWidget();

/**
 * Setting the value of the MessageText widget
 * @param {String} tag The tag name
 * @param {Number} newValue The widget value
 */
hmiMsgText.prototype.setValue = function (tag, newValue) {
    if (tag == "value") {
	    if (this.isBadValue(newValue)) {
	        return false;
	    }
	    newValue = parseFloat(newValue);
        if (isNaN(newValue)) {
            return false
        }
        if (this.value === parseInt(newValue)) {
            return false;
        }
        this.value = parseInt(newValue);
        if (this.numStates > 0) {
            $(this.msgElems).hide();
            if (this.value >= 0 && this.value < this.numStates && this.elem) {
                this.elem.getElementsByTagName('span')[this.value].style.display = 'block';
            }
        }
        this.sendUpdate( tag, this.value );
    } else {
        hmiWidget.prototype.setValue.call(this, tag, newValue)
    }
};
/**
 * Function to get the value of the Widget
 * @param {String} tag tag name will be the property name
 */
hmiMsgText.prototype.getValue = function (tag) {
    if (tag == "value") {
        return this.value;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};
$hmi.fn.hmiMsgText = function (options, parentPage) {
    return new hmiMsgText(this.wgtId, options, parentPage);
};