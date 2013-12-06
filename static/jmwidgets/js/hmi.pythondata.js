/*!
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */

function hmiPythonData(wgtId, options, parentPage) {
		// do nothing for default constructor
	if (!wgtId) return;
	
    this.groupName = wgtId;
    this.vars = new Object();
    this.readWrite = 0;
    this.pollRate = 1000; // .5 sec poll interval
    this.pollTimer = null;
    this.active = null;
    this.writeThru = 1;
    this.tagQueue = {};
    this.writeFlag = false;
    this.doneItems = [];
    this.initRequest = null;
    this.deviceID = null;
    this.projectName = null;
    this.urlName = "/htmlComm";

	// tell the page we need to be started and stopped
	parentPage.bind('pagestart', this);
	parentPage.bind('pagestop', this);

    hmiWidget.call(this, wgtId, options, parentPage);
    // patch to set the this pointer before invoking callback
    var self = this;
    this.start();
    this.onDataReady = function (ajaxData) {
        // update the variables with the response data
        var numVars = self.decodeVars(ajaxData);
        
        // tell any jquery widgets that we changed     
        var tag;
        var newValue;
        for (var tags in self.vars) {
            tag = tags;
            newValue = self.vars[tags];
            self[tag] = newValue;
            self.sendUpdate(tag, newValue);
            // tell any jquery widgets that we changed
            $(self.elem).trigger('change.'+tag, {tag:tag, value:newValue} ); 
        }
        
        
        if (self.useTagMgr) {
            // if updating the tag mgr, write the values to the tag mgr
            for (var i in me.vars) {
                $hmi(self.wgtId).widget().setWgtValues(i, self.vars[i]);
            }
        } else {
            // update the display variables
            if (self.dataLinks){
	            for (var i = 0; i < self.dataLinks.length; i++) {
	                var strTag = self.dataLinks[i].tag;
	                self.dataLinks[i].setWgtValue(self.vars[strTag]);
	            }
	        }
	        	// trigger change event for jmwidgets
            $(self.elem).trigger('change', self.vars);
        }

    };
    this.onWriteStatus = function () {
	    self.writeFlag = false;
	    var tq = self.tagQueue;
	    if (tq.length>0) {
	       for (var i in tq) {
               self.postData(i, tq[i], null);
               tq.shift();
               break;
           }
	    }
    };
}
/**
 * Inheriting the Wiget class
 */
hmiPythonData.prototype = new hmiWidget();

/**
 * Sets the value of tag 
 * @param {String} tagName The tag name
 * @param {Number} tagValue Tag's new value
 */
hmiPythonData.prototype.setValue = function (tagName, tagValue) {
    this.vars[tagName] = tagValue;
        	// send the data to the server
    var me = this;
    if (this.writeThru) {
        if (!this.writeFlag) {
            this.writeFlag = true;
            this.postData(tagName, tagValue, null);
        } else {
            this.tagQueue[tagName] = tagValue;
        }
    }
    this.sendUpdate(tagName, tagValue);
    	// initiate jquery change events so we are compatible with jquery widgets
    $(this.elem).trigger('change.'+tagName, {tag:tagName, value:tagValue});
};
/**
 * Sets the value of tag 
 * @param {String} tagName The tag name
 * @param {Number} tagValue Tag's new value
 */
hmiPythonData.prototype.setAsyncValue = function (tagName, tagValue, cb) {
    this.vars[tagName] = tagValue;
    	// tell the world we changed
    $(this.elem).trigger('change', this.vars);
    	// send the data to the server
    var me = this;
    var jqXHR = null;
    if (this.writeThru) {
        if (!this.writeFlag) {
            this.writeFlag = true;
            this.postData(tagName, tagValue, cb);
        } else {
            this.tagQueue[tagName] = tagValue;
        }
    }
    this.sendUpdate(tagName, tagValue);
};
/**
 * Gets a tag value
 * @param {String} tagName The tag name
 * @return {Number} the tag value
 */
hmiPythonData.prototype.getValue = function (tagName) {
    return this.getTagValue(tagName);
};
/**
 * Activates groups in the page; initiates the ajax polling mechanism
 */
hmiPythonData.prototype.start = function () {
    // make sure we have a device to talk to
	// need to store this pointer on page instead of inside of frame for callback to work
    parent.$this = this;
    // do an initial request of the data
    this.requestData();
    this.initRequest = 1;
    // poll for updates
	this.startPoll();
};
/**
 * Deactivates groups in the page; initiates stopping the ajax polling mechanism
 */
hmiPythonData.prototype.stop = function () {

    this.stopPoll();
};
/**
 * Reads the readGroups CGI data from the server
 */
hmiPythonData.prototype.requestData = function () {
    var me = this;
        jQuery.ajax({
            type: "GET",
            url: this.urlName,
            dataType: "json",
            async: true, 
            cache: false,
            timeout:50000,
            success: this.onDataReady,
            error: function (jqXHR, textStatus, errorThrown) {
        },
        complete: function (jqXHR, textStatus) {
            if (me.initRequest) {
                me.initRequest = 0;
            }
        }
        });
};
/**
 * Updates the tag with a new value; writing to server
 * @param {String} tagName The tag name
 * @param  {String} tagValue The tag value
 * @param  {Object} cb Callback function, an optional parameter
 */
hmiPythonData.prototype.postData = function (tagName, tagValue, cb) { 	
    if (tagName === "") {
        var ajaxData = json.stringify(this.vars);
    } else {
        this.jsonData = new Object();
        this.jsonData[tagName] = tagValue;
        var ajaxData = JSON.stringify(this.jsonData);
    }
    //If an only if execute the anonymous function if there is a callback otherwise there is no need to do so
    var me = this;
    if (typeof cb === 'function') {
        var cbArray = [me.onWriteStatus, function (xhr, status) {
            cb();
        }]
    } else {
        var cbArray = me.onWriteStatus;
    }
    $.ajax({
        type: 'POST',
        url: this.urlName,
        dataType: 'json',
        data: ajaxData,
        cache: false,
        complete: cbArray
    });
};
/**
 * Issues a system command to the server
 * @param {String} cmdName Command name
 * @param  {String} cmdValue Command value
 */
hmiPythonData.prototype.postCmd = function (cmdName, cmdValue) {
    cmdObject = new object;
    cmdObject[cmdName] = cmdValue;
    var cmdData = json.stringify(cmdObject);
    var me = this;
    $.ajax({
        type: 'POST',
        url: self.urlName,
        dataType: 'json',
        data: cmdData,
        success: me.onWriteStatus,
        error: function (jqXHR, textStatus, errorThrown) {
            if (me.initRequest) {
                me.initRequest = 0;
            }
        },
        cache: false
    });
};
/**
 * Decodes the server response and returns the number of tags in it
 * @param {String} strText The complete data from the server
 * @return {Number} number of tags
 */
hmiPythonData.prototype.decodeVars = function (ajaxData) {
    var numVars = 0;
    var me = this;
    me.vars = ajaxData;
    numVars = ajaxData.length;
    return numVars;
};
/**
 * sets a tag value
 * @param {String} tagName The tag name
 * @param {Number} tagVlue The new tag value
 */
hmiPythonData.prototype.setTagValue = function (tagName, tagValue) {
    this.vars[tagName] = tagValue;
};
/**
 * gets a tag value
 * @param {String} tagName The tag name
 * @return {Number} The value of the tag
 */
hmiPythonData.prototype.getTagValue = function (tagName) {
    return this.vars[tagName];
};
/**
 * Starts the CGI readGroups ajax polling 
 */
hmiPythonData.prototype.startPoll = function () {
    var strPoll = "$hmi('" + this.wgtId + "').widget().requestData();";
    this.pollTimer = setInterval(strPoll, this.pollRate);
    this.active = true;
};
/**
 * Stops the CGI readGroups ajax polling 
 */
hmiPythonData.prototype.stopPoll = function () {
	if (this.pollTimer)
    	clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.active = false;
};

// override the base class hmiCgiGroup with the cloud interface
$hmi.fn.hmiPythonData = function (options, parentPage) {
    return new hmiPhpDataExample(this.wgtId, options, parentPage);
};
