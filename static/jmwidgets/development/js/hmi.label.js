/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiLabel(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;
    
    this.text = null;
    this.clickWgtId = null;
    hmiWidget.call(this, wgtId, options, parentPage);
    
    var me = this;
    this.elem = document.getElementById(wgtId);
    if (this.elem) {
        $(me.elem).mousedown(function (evt) {
            // redirect mouse clics to the click widget
            if (me.clickWgtId) {
                var clickWgt = $hmi(me.clickWgtId).widget();
                if (clickWgt) {
                    $hmi.handleMouse(clickWgt);
                }
            }
        });
        $(me.elem).bind("touchstart", function (evt) {
            // redirect touches to the click wgt
            if (me.clickWgtId) {
                var clickWgt = $hmi(me.clickWgtId).widget();
                if (clickWgt) {
                    $hmi.handleMouse(clickWgt);
                }
            }
        });
	    if (this.masked) 
	    	this.setMaskedValue($(this.elem).html());
   }

}
/**
 * Inheriting the base class Widget
 */
hmiLabel.prototype = new hmiWidget();

/**
 * Setting the value of the label widget
 * @param {String} tag The tag name
 * @param {String} newValue The widget value
 */
hmiLabel.prototype.setValue = function (tag, newValue) {

    if (tag === 'value' || tag === 'text') {
	    if (this.isBadValue(newValue)) {
	        return false;
	    }
        newValue = newValue.toString();
        if (this.text === newValue) {
            return false;
        }
        this.text = newValue;
        if (!this.masked) {
            $(this.elem).html(newValue);
        } else {
            this.setMaskedValue(newValue);
        }
    } else {
        hmiWidget.prototype.setValue.call(this, tag, newValue);
    }
}
/**
 * Function to get the value of the Widget
 * @param {String} tag tag name will be the property name
 */
hmiLabel.prototype.getValue = function (tag) {
    if (tag == "value") {
        return this.text;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};
$hmi.fn.hmiLabel = function (options, parentPage) {
    return new hmiLabel(this.wgtId, options, parentPage);
};