/*!
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */

function hmiPhpExampleData(wgtId, options, parentPage) {
		// do nothing for default constructor
	if (!wgtId) return;
	
    this.groupName = wgtId;
    this.vars = new Object;
    this.readWrite = 0;
    this.pollRate = 2000; // 2 sec poll interval
    this.pollTimer = null;
    this.active = null;
    this.writeThru = 1;
    this.tagQueue = {};
    this.writeFlag = false;
    this.doneItems = [];
    this.initRequest = null;
    this.deviceID = null;
    this.projectName = null;
    	// get the deviceID and projectName from the parent page (it is a property for cloud projects)
    if (parentPage) {
	    if (parentPage.deviceID)
	    	this.deviceID = parentPage.deviceID;
	    if (parentPage.projectName)
	    	this.projectName = parentPage.projectName;

	    	    // tell the page we need to be started and stopped
	    parentPage.bind('pagestart', this);
	    parentPage.bind('pagestop', this);
    }
    hmiWidget.call(this, wgtId, options, parentPage);
    // patch to set the this pointer before invoking callback
    var self = this;
    this.onDataReady = function (strResult) {
        var res = $.trim(strResult);
        /*Validate the server response*/
        /*Proceed further only if the server response is valid*/
        if (!self.validateResponse(res)) {
            return false;
        }
        // update the variables with the response data
        var numVars = self.decodeVars(strResult);
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
    this.onWriteStatus = function (result, status, xhr) {
        if (result && (result.responseText.indexOf("OK")>=0)) {
	        self.writeFlag = false;
	        var tq = self.tagQueue;
	        if (tq.length>0) {
	        	for (var i in tq) {
            		self.postData(i, tq[i], null);
            		tq.shift();
            		break;
            	}
	        }
        }
    };
}
/**
 * Inheriting the Wiget class
 */
hmiPhpExampleData.prototype = new hmiWidget();

/**
 * Sets the value of tag 
 * @param {String} tagName The tag name
 * @param {Number} tagValue Tag's new value
 */
hmiPhpExampleData.prototype.setValue = function (tagName, tagValue) {
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
hmiPhpExampleData.prototype.setAsyncValue = function (tagName, tagValue, cb) {
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
hmiPhpExampleData.prototype.getValue = function (tagName) {
    return this.getTagValue(tagName);
};
/**
 * Activates groups in the page; initiates the ajax polling mechanism
 */
hmiPhpExampleData.prototype.start = function () {
		// make sure we are running from a website
	if (!window.location.host)
		return;
		// make sure we have a device to talk to
	if (this.deviceID!=null) {
			// need to store this pointer on page instead of inside of frame for callback to work
		parent.$this = this;
			// do an initial request of the data
		this.requestData();
		this.initRequest = 1;
			// poll for updates
		this.startPoll();
	}
};
/**
 * Deactivates groups in the page; initiates stopping the ajax polling mechanism
 */
hmiPhpExampleData.prototype.stop = function () {

    this.stopPoll();
};
/**
 * Reads the readGroups CGI data from the server
 */
hmiPhpExampleData.prototype.requestData = function () {
	if (!window.location.host)
		return;
 	var strURL = "http://" + window.location.host + "/dgi/web.php";
    strURL = strURL + "?cmd=readGroup"+ "&id=" + this.deviceID;

    // dataset name is the group name
 	var strRequest = "g="+this.groupName+"&project="+this.projectName;
    var me = this;
    $.ajax({
        type: 'POST',
        url: strURL,
        data: strRequest,
        cache: false,
        timeout: 12000,
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
 * Validate the server response to see whether the server had sent any invalid results
 * @param {String} res The server response
 * @return {boolean} true if it is a valid response else false
 */
hmiPhpExampleData.prototype.validateResponse = function (res) {
    /*Normalizing the response to lowercase so that the checking can be done more easilty without case sensitivity*/
	if (res.indexOf("S_OK")>=0)
		return true;
	else
    	return false;
};
/**
 * Updates the tag with a new value; writing to server
 * @param {String} tagName The tag name
 * @param  {String} tagValue The tag value
 * @param  {Object} cb Callback function, an optional parameter
 */
hmiPhpExampleData.prototype.postData = function (tagName, tagValue, cb) {
		// make sure we are running from a website
	if (!window.location.host)
		return;
		// make sure we have a device
	if (this.deviceID==null)
		return;	

    var strURL = "http://" + window.location.host + "/dgi/web.php?cmd=writeTags&id="+this.deviceID;
    var strRequest; 
    	
    if (tagName === "") {
        strRequest = 'n=' + (this.vars.length - 1);
        var i = 0;
        for (var itag in this.vars) {
            strRequest += '&t' + (i + 1) + '=' + itag + '&v' + (i + 1) + '=' + this.vars[itag];
            i++;
        }
    } else {
        strRequest = 'n=1&t1=' + tagName + '&v1=' + tagValue;
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
        url: strURL,
        data: strRequest,
        cache: false,
        complete: cbArray
    });
};
/**
 * Issues a system command to the server
 * @param {String} cmdName Command name
 * @param  {String} cmdValue Command value
 */
hmiPhpExampleData.prototype.postCmd = function (cmdName, cmdValue) {
		// make sure we are running from a website
	if (!window.location.host)
		return;
		// make sure we have a device
	if (this.deviceID==null)
		return;	
    var strURL = "http://" + window.location.host + "/dgi/web.php";
    strURL += "?cmd=" + cmdName + "&id=" + this.deviceID;
    var strData = cmdValue;
    var me = this;
    $.ajax({
        type: 'POST',
        url: strURL,
        data: cmdValue,
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
hmiPhpExampleData.prototype.decodeVars = function (strText) {
    var idx1 = strText.indexOf("#" + this.groupName); // find the group name
    var idx2 = strText.indexOf("\n", idx1);
    var nextIdx;
    var strValue;
    var strName;
    var numVars = 0;
    // get group status
    var strLine = strText.substring(idx1, idx2);
    var strTokens = strLine.split("\t");
    var strCode = strTokens[1];
    var me = this;
    // if group status is okay
    if (strCode == "S_OK") {
        nextIdx = idx2 + 1; // next line
        while (nextIdx > 0) {
            idx1 = strText.indexOf("#", nextIdx); // find the tag name
            idx2 = strText.indexOf("\n", idx1);
            nextIdx = idx1;
            if ((idx1 >= 0) && (idx2 > 0)) {
                strLine = strText.substring(idx1 + 1, idx2);
                strTokens = strLine.split("\t");
                var strCode = strTokens[1];
                // is tag status ok
                if (strCode == "S_OK") {
                    strName = strTokens[0];
                    // next line
                    idx3 = strText.indexOf("\n", idx2 + 1);
                    if (idx3 > 0) {
                        strLine = strText.substring(idx2 + 1, idx3);
                        strTokens = strLine.split("\t");
                        strValue = strTokens[1];
                        // store the name and value in the vars object
                        strValue = strValue === 'BAD_VALUE' ? null : strValue;
                        me.vars[strName] = strValue;
                        numVars++;
                        // set next line pointer
                        nextIdx = idx3 + 1;
                    }
                } else {
                    //Keep the invalid tags as null
                    me.vars[strTokens[0]] = null;
                    // next line
                    idx3 = strText.indexOf("\n", idx2 + 1);
                    idx3++;
                    nextIdx = idx3;
                }
            }
        }
    }
    return numVars;
};
/**
 * sets a tag value
 * @param {String} tagName The tag name
 * @param {Number} tagVlue The new tag value
 */
hmiPhpExampleData.prototype.setTagValue = function (tagName, tagValue) {
    this.vars[tagName] = tagValue;
};
/**
 * gets a tag value
 * @param {String} tagName The tag name
 * @return {Number} The value of the tag
 */
hmiPhpExampleData.prototype.getTagValue = function (tagName) {
    return this.vars[tagName];
};
/**
 * Starts the CGI readGroups ajax polling 
 */
hmiPhpExampleData.prototype.startPoll = function () {
    var strPoll = "$hmi('" + this.wgtId + "').widget().requestData();";
    this.pollTimer = setInterval(strPoll, this.pollRate);
    this.active = true;
};
/**
 * Stops the CGI readGroups ajax polling 
 */
hmiPhpExampleData.prototype.stopPoll = function () {
	if (this.pollTimer)
    	clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.active = false;
};

// override the base class hmiCgiGroup with the cloud interface
$hmi.fn.hmiPhpExampleData = function (options, parentPage) {
    return new hmiPhpDataExample(this.wgtId, options, parentPage);
};