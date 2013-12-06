/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiPage(wgtId, options, parentPage) {
    if (!wgtId)
        return;

    this.dialog = 0;
    this.pageActivateHdlrs = [];
    this.pageDeactivateHdlrs = [];
    this.pageStartHdlrs = [];
    this.pageStopHdlrs = [];
    this.pgHdlrActive = 0;
		// make sure the hmi mgr is inited
	$hmi.init();

    hmiWidget.call(this, wgtId, options, parentPage);
    // add the page to the global widgets and make us the active page
    $hmi.addWidget(wgtId, this);
    $hmi.setActivePage(this);
}
/**
 * Inheriting the base class Widget
 */
hmiPage.prototype = new hmiWidget();
/**
 * Function that binds the page events
 * @param {String} wgtEvent The event name
 * @param {Object} wgt
 */
hmiPage.prototype.bind = function (wgtEvent, wgt) {
    if (wgtEvent == "pageactivate") {
        //this.pageActivateHdlrs[this.pageActivateHdlrs.length] = wgt;
        this.pageActivateHdlrs.push(wgt);
    } else if (wgtEvent == "pagedeactivate") {
        //this.pageDeactivateHdlrs[this.pageDeactivateHdlrs.length] = wgt;
        this.pageDeactivateHdlrs.push(wgt);
    } else if (wgtEvent == "pagestart") {
        //this.pageStartHdlrs[this.pageStartHdlrs.length] = wgt;
        this.pageStartHdlrs.push(wgt);
    } else if (wgtEvent == "pagestop") {
        //this.pageStopHdlrs[this.pageStopHdlrs.length] = wgt;
        this.pageStopHdlrs.push(wgt);
    }
};
/**
 * Function that trigger a particular event associated with the page
 * @param {String} wgtEvent Event name
 */
hmiPage.prototype.trigger = function (wgtEvent) {
    wgtEvent = wgtEvent.toLowerCase();
    if (wgtEvent === "pageactivate") {
        $hmi.setActivePage(this);
        // execute page activate
        this.activate();
        // execute child activate handlers
        for (i = 0; i < this.pageActivateHdlrs.length; i++)
            this.pageActivateHdlrs[i].activate();
    } else if (wgtEvent === "pagedeactivate") {
        this.deactivate();
        for (i = 0; i < this.pageDeactivateHdlrs.length; i++)
            this.pageDeactivateHdlrs[i].deactivate();
    } else if (wgtEvent === "pagestart") {
        this.start();
        for (i = 0; i < this.pageStartHdlrs.length; i++) {
            this.pageStartHdlrs[i].start();
        }
        this.pgHdlrActive = 1;
    } else if (wgtEvent === "pagestop") {
        this.stop();
        for (i = 0; i < this.pageStopHdlrs.length; i++) {
            this.pageStopHdlrs[i].stop();
        }
        this.pgHdlrActive = 0;
    }
};
/**
 * Function that sets the dialog page's element
 */
hmiPage.prototype.setDialogElem = function () {
    this.elem = document.getElementById(this.wgtId + 'Dialog');
    this.dialog = this.elem ? 1 : 0;
};

hmiPage.prototype.getWidget = function ( id ) {
	if (this.prefix) {
		if (id.indexOf(this.prefix)<0) 
			id = this.prefix+"_"+id;
	}
    return (this.wgts) ? this.wgts[id]: null;
};

$hmi.fn.hmiPage = function (options, parentPage) {
    return new hmiPage(this.wgtId, options, parentPage);
};