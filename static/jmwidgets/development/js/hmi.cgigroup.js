/**
 * JMwidgets version 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
 function hmiCgiGroup(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;

    this.groupName = wgtId;
    this.vars = new Object;
    this.prevVars = new Object;
    this.readWrite = 0;
    this.pollRate = 4000; // 2 sec poll interval
    this.dataLinks = [];
    this.pollTimer = null;
    this.active = null;
    this.writeThru = 1;
    this.tagQueue = {};
    this.writeFlag = !1;
    this.doneItems = [];
    this.initRequest = null;
    this.enabled = 1;
    // tell the page we need to be started and stopped
    if (parentPage) {
	    parentPage.bind('pagestart', this);
	    parentPage.bind('pagestop', this);
	}
    // It should be true if TagMgrWgt is used
    this.useTagMgr = false;
    hmiWidget.call( this, wgtId, options, parentPage );
    // patch to set the this pointer before invoking callback
    var me = this;
    $hmi.setActiveTagMgrs( this );
    this.onDataReady = function ( strResult ) {
        var res = $.trim( strResult );
        /*Validate the server response*/
        /*Proceed further only if the server response is valid*/
        if (!me.validateResponse(res)) {
            return false;
        }
        var decimalRegex = /^\-?[0-9]*\.?[0-9]+$/;
        var numVars = me.decodeVars(strResult);
        if (me.useTagMgr) {
            // if updating the tag mgr, write the values to the tag mgr
            for (var i in me.vars) {
                //Update the widget only if there is a change in the tag value
                //For the first tag reads even if the values are null we need to go to setWgtValue so that
                //the isBadValue function can trigger and show the badvalue icons
                if ((me.initRequest && me.prevVars[i] === null && me.vars[i] === null) || me.prevVars[i] !== me.vars[i]) {
                    //The following checking is needed becoz the server returns the numeric values in different format eg: 2.0, 2.000, 2 as string
                    if (decimalRegex.test(me.vars[i])) {
                        me.dataLinks[i].setWgtValue(me.vars[i])
                    } else {
                        if (parseFloat(me.vars[i]) !== parseFloat(me.prevVars[i])) {
                            me.dataLinks[i].setWgtValue(parseFloat(me.vars[i]))
                        }
                    }
                }
            }
        } else {
            // update the display variables
            for (var i = 0; i < me.dataLinks.length; i++) {
                var strTag = me.dataLinks[i].tag;
                //Update the widget only if there is a change in the tag value
                if ((me.initRequest && me.prevVars[strTag] === null && me.vars[strTag] === null) || me.prevVars[strTag] !== me.vars[strTag]) {
                    if (!decimalRegex.test(me.vars[strTag])) {
                        me.dataTime[strTag] = new Date().getTime();
                        me.dataLinks[i].setWgtValue(me.vars[strTag]);
                    } else {
                        if (parseFloat(me.vars[strTag]) !== parseFloat(me.prevVars[strTag])) {
                            me.dataTime[strTag] = new Date().getTime();
                            me.dataLinks[i].setWgtValue(parseFloat(me.vars[strTag]));
                        }
                    }
                }
            }
        }
    };
    this.onWriteStatus = function (strResult, status, xhr) {
        if (!me.validateResponse($.trim(strResult))) {
            me.initRequest = 0;
            return false;
        }
        me.writeFlag = !1;
        var tq = me.tagQueue;
        if ($.isEmptyObject(tq)) {
            //This is here because we'd like to issue the first ajax polling request as quickly as possible ie without waiting for the first timer based ajax polling call
            //so that the tag reading and embedding in the page can be done more fastly during the initial page.
            if (me.initRequest) {
                me.requestData();
            }
        } else {
            this.processQueue();
        }
    };
}
/**
 * Inheriting the Wiget class
 */
hmiCgiGroup.prototype = new hmiWidget();
/**
 * Initialization. It sets the props as variables of the object.
 * @param {Object} props The properties of the widget.
 */
hmiCgiGroup.prototype.setOptions = function (props) {
    // set the props as variables of the object
    if (props != null) {
		hmiWidget.prototype.setOptions.call(this, props);
        if (props.vars != undefined) {
            for (var i in props.vars) {
                this.vars[i] = props.vars[i];
            }
        }
    }
};
/**
 * adding the DataLink widget
 * @param {Object} DataLink object
 */
hmiCgiGroup.prototype.addDataLink = function (newLink) {
    this.dataLinks.push(newLink);
    // add the tag to the variable list.  This provides initial values for the tags on the page
    var tagName = newLink.tag
    this.vars[tagName] = null; //Earlier the value was 0 but we cant use that because 0 can be a meaningfull value and it should not be use as a start point we use null
};
/**
 * Sets the value of tag
 * @param {String} tagName The tag name
 * @param {Number} tagValue Tag's new value
 */
hmiCgiGroup.prototype.setValue = function (tagName, tagValue) {
    this.setPrevTags();
    this.vars[tagName] = tagValue;
    if (this.writeThru) {
        if (typeof this.tagQueue[tagName] === 'undefined') {
            this.writeFlag = !1;
            this.postData(tagName, tagValue, null);
        } else {
            this.tagQueue[tagName] = tagValue;
        }
    }
    	// tell any jquery widgets that we changed
	$(this.elem).trigger('change', {tag:tagName, value:tagValue});   	    
    this.sendUpdate(tagName, tagValue);
};
/**
 * Sets the value of tag
 * @param {String} tagName The tag name
 * @param {Number} tagValue Tag's new value
 */
hmiCgiGroup.prototype.setAsyncValue = function ( tagName, tagValue, cb ) {
    this.setPrevTags();
    this.vars[tagName] = tagValue;
    if (this.writeThru) {
        if (typeof this.tagQueue[tagName] === 'undefined') {
            this.writeFlag = !0;
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
hmiCgiGroup.prototype.getValue = function ( tagName ) {
    return this.getTagValue( tagName );
};
/**
 * Activates groups in the page; initiates the ajax polling mechanism
 */
hmiCgiGroup.prototype.start = function () {
    // start requesting data
    if (this.enabled) {
	    var strRequest = "n=1&gr1=" + this.groupName;
	    this.initRequest = 1;
	    this.postCmd("activateGroups", strRequest);
	    this.startPoll();
	  }
};
/**
 * Deactivates groups in the page; initiates stopping the ajax polling mechanism
 */
hmiCgiGroup.prototype.stop = function () {
    var strRequest = "n=1&gr1=" + this.groupName;
    this.postCmd("deactivateGroups", strRequest);
    this.stopPoll();
};
/**
 * Reads the readGroups CGI data from the server
 */
hmiCgiGroup.prototype.requestData = function () {
    this.setPrevTags();
    var strURL = "http://" + window.location.host + "/cgi/readGroups";
    // dataset name is the group name
    var strRequest = "n=1&gr1=" + this.groupName;
    var me = this;
    $.ajax({
        type: 'GET',
        url: strURL,
        data: strRequest,
        cache: false,
        timeout: 12000,
        success: this.onDataReady,
        error: function (jqXHR, textStatus, errorThrown) {
            me.stopPoll();
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
hmiCgiGroup.prototype.validateResponse = function (res) {
    /*Normalizing the response to lowercase so that the checking can be done more easilty without case sensitivity*/
    res = res.toLowerCase();
    /*Handling the E_INACTIVEGROUP response.*/
    /*Stop the polling and restart it including the group activation*/
    if (res.indexOf('e_inactivegroup') !== -1) {
        this.stop();
        this.start();
        return false;
    }
    /*Handling the E_UNKNOWNGROUP response*/
    /*Stop the polling*/
    if (res.indexOf('e_unknowngroup') !== -1) {
        this.stopPoll();
        return false;
    }
    /*Return true if none of the above cases are true*/
    return true;
};
hmiCgiGroup.prototype.processQueue = function () {
    var processFlag = !1;
    for (var i in this.tagQueue) {
        var tag = i;
        //Chcek whether we have got any tag updates from server that came after we stored some updateds in the tag queue
        // if so ignore it
        var timeFlag = this.tagQueue[tag] && typeof this.queueTime[tag] !== 'undefined' && typeof this.dataTime[tag] !== 'undefined'
        if (timeFlag) {
            if (this.queueTime[tag] > this.dataTime[tag]) {
                var value = this.tagQueue[tag];
                delete this.tagQueue[tag];
                processFlag = !0;
                break;
            } else {
                delete this.tagQueue[tag];
            }
        }
    }
    if (processFlag) {
        this.postData(tag, value, null);
    }
};
/**
 * Updates the tag with a new value; writing to server
 * @param {String} tagName The tag name
 * @param  {String} tagValue The tag value
 * @param  {Object} cb Callback function, an optional parameter
 */
hmiCgiGroup.prototype.postData = function (tagName, tagValue, cb) {
	if (this.enabled) {
	    var strURL = "http://" + window.location.host + "/cgi/writeTags", strRequest, me = this;
	    if (tagName) {
	        strRequest = 'n=1&t1=' + tagName + '&v1=' + tagValue;
	    } else {
	        strRequest = 'n=' + (this.vars.length - 1);
	        for (var i in this.vars) {
	        	var tagName = i;
	            strRequest += '&t' + (i + 1) + '=' + tagName + '&v' + (i + 1) + '=' + this.vars[tagName];
	        }
	    }
	    //If an only if execute the anonymous function if there is a callback otherwise there is no need to do so
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
	 }
};
/**
 * Issues a system command to the server
 * @param {String} cmdName Command name
 * @param  {String} cmdValue Command value
 */
hmiCgiGroup.prototype.postCmd = function (cmdName, cmdValue) {
	if (this.enabled) {
	    var strURL = "http://" + window.location.host;
	    // tag name should be 'activateGroups' or 'deactivateGroups'
	    strURL += "/cgi/" + cmdName;
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
            me.active = !1;
	        },
	        cache: false
	    });
	}
};
/**
 * Decodes the server response and returns the number of tags in it
 * @param {String} strText The complete data from the server
 * @return {Number} number of tags
 */
hmiCgiGroup.prototype.decodeVars = function (strText) {
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
                        strValue = strValue === 'BAD_VALUE' ? null: strValue;
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
hmiCgiGroup.prototype.setTagValue = function (tagName, tagValue) {
    this.setPrevTags();
    this.vars[tagName] = tagValue;
};
/**
 * gets a tag value
 * @param {String} tagName The tag name
 * @return {Number} The value of the tag
 */
hmiCgiGroup.prototype.getTagValue = function (tagName) {
    return this.vars[tagName];
};
/**
 * Starts the CGI readGroups ajax polling
 */
hmiCgiGroup.prototype.startPoll = function () {
	if (this.enabled) {
	    var strPoll = "$hmi('" + this.wgtId + "').widget().requestData();";
	    this.pollTimer = setInterval(strPoll, this.pollRate);
	    this.active = true;
	}
};
/**
 * Stops the CGI readGroups ajax polling
 */
hmiCgiGroup.prototype.stopPoll = function () {
    clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.active = false;
};
/**
 * method that updates all the widgets that are linked to a particular tag/property of another widget
 * @param {String} tag The tag/property name
 * @param {Number} value The tag/property value
 */
hmiCgiGroup.prototype.sendUpdate = function (tag, value) {
    // update the attached variables
    	// tag values are not just numbers.  do not force it
//    var decimalRegex = /^\-?[0-9]*\.?[0-9]+$/;
    for (var i = 0; i < this.dataLinks.length; i++) {
        if ( this.dataLinks[i].tag === tag/* && this.vars[tag] !== this.prevVars[tag]*/ ) {
            this.dataLinks[i].setWgtValue(value)
        }
    }
};
/**
 * This function updates the previous tag values
 */
hmiCgiGroup.prototype.setPrevTags = function () {
    this.prevVars = {};
    for (var item in this.vars) {
        this.prevVars[item] = this.vars[item];
    }
};

$hmi.fn.hmiCgiGroup = function (options, parentPage) {
    return new hmiCgiGroup(this.wgtId, options, parentPage);
};