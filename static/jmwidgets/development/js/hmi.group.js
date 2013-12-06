/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiGroup(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;

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
    }
}
/**
 * Inheriting the base class Widget
 */
hmiGroup.prototype = new hmiWidget();

$hmi.fn.hmiGroup = function (options, parentPage) {
    return new hmiGroup(this.wgtId, options, parentPage);
};