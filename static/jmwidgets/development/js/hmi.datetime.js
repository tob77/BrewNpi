/**
 * JMwidgets
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiDateTime(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;

    this.format = 'HH:mm:ss AP';
    this.rw = null;
    this.timeSpec = 'local';
    this.interval = 1000;
    this.timer = null;
    this.needsInterval = false;
    this.value = null;
    this.dataLinks = [];
    this.serverTime = null;
    hmiWidget.call(this, wgtId, options, parentPage);
    
	if (this.timeSpec !== 'server') {
        this.updateValue();
    }   
    var me = this;
    	// start tick thread for local time updates
    if (this.timeSpec==='local') {
	    this.timer = setInterval(function () {
	        me.updateValue();
	    }, me.interval);    
	}
}
/**
 * Inheriting the base class Widget
 */
hmiDateTime.prototype = new hmiWidget();


/**
 * function formats the date/time value
 * @param {String} format date/time format string
 * @param {Object} serverDate JS Date object that comes for the Server date
 * @return {String} formatted date/time string
 */
hmiDateTime.prototype.formatValue = function (strFormat, dt) {

    var strValue=strFormat;
    	// support time/date in any format
    var params = this.computeTimeParams(dt, this.timeSpec);
    strValue = strValue.replace('MM', params.cmonth);
    strValue = strValue.replace('DD', params.cdate);
    strValue = strValue.replace('YYYY', params.cyear4);
    strValue = strValue.replace('YY', params.cyear2);
    strValue = strValue.replace('mmm', params.months[params.dt.getMonth()]);
    strValue = strValue.replace('HH', params.hrs12);
    strValue = strValue.replace('hh', params.hrs);
    strValue = strValue.replace('mm', params.mts);
    strValue = strValue.replace('ss', params.sec);
    strValue = strValue.replace('AP', params.amPm);           

	return strValue;
};
// return the format based on the date or time string
hmiDateTime.prototype.computeTimeParams = function(dt, timeSpec) {
	var params = {};
	
    params.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	if ($.type(dt).toLowerCase() !== 'date')
		return;
		
	params.dt = dt;        
    if (timeSpec === 'local') {

    	params.cdate = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
        params.cmonth = (dt.getMonth() + 1) < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
        params.cyear2 = dt.getFullYear().toString().slice(2);
        params.cyear4 = dt.getFullYear();
        params.hrs = dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours();
        params.mts = dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes();
        params.sec = dt.getSeconds() < 10 ? '0' + dt.getSeconds() : dt.getSeconds();
        params.amPm = parseInt(params.hrs) < 12 ? 'AM' : 'PM';
        params.hrs12 = parseInt(params.hrs) < 13 ? params.hrs : (parseInt(params.hrs) - 12) < 10 ? '0' + (parseInt(params.hrs) - 12) : (parseInt(params.hrs) - 12);
    } else if (timeSpec === 'global') {
       	params.cdate = dt.getUTCDate() < 10 ? '0' + dt.getUTCDate() : dt.getUTCDate();
        params.cmonth = (dt.getUTCMonth() + 1) < 10 ? '0' + (dt.getUTCMonth() + 1) : dt.getUTCMonth() + 1;
        params.cyear2 = dt.getUTCFullYear().toString().slice(2);
        params.cyear4 = dt.getUTCFullYear();
        params.hrs = dt.getUTCHours() < 10 ? '0' + dt.getUTCHours() : dt.getUTCHours();
        params.mts = dt.getUTCMinutes() < 10 ? '0' + dt.getUTCMinutes() : dt.getUTCMinutes();
        params.sec = dt.getUTCSeconds() < 10 ? '0' + dt.getUTCSeconds() : dt.getUTCSeconds();
        params.amPm = parseInt(params.hrs) < 12 ? 'AM' : 'PM';
        params.hrs12 = parseInt(params.hrs) < 13 ? params.hrs : (parseInt(params.hrs) - 12) < 10 ? '0' + (parseInt(params.hrs) - 12) : (parseInt(params.hrs) - 12);
    } else  {
        params.cdate = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
        params.cmonth = (dt.getMonth() + 1) < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
        params.cyear2 = dt.getFullYear().toString().slice(2);
        params.cyear4 = dt.getFullYear();
        params.hrs = dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours();
        params.mts = dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes();
        params.sec = dt.getSeconds() < 10 ? '0' + dt.getSeconds() : dt.getSeconds();
        params.amPm = parseInt(params.hrs) < 12 ? 'AM' : 'PM';
        params.hrs12 = parseInt(params.hrs) < 13 ? params.hrs : (parseInt(params.hrs) - 12) < 10 ? '0' + (parseInt(params.hrs) - 12) : (parseInt(params.hrs) - 12);
    }
    return params;
}

// return the format based on the date or time string
hmiDateTime.prototype.computeFormatString = function(strFormat, params) {
	var value = strFormat;
 
    switch (strFormat) {
    case 'MM/DD/YY':
        value = params.cmonth + '/' + params.cdate + '/' + params.cyear2;
        break;
    case 'MM/DD/YYYY':
        value = params.cmonth + '/' + params.cdate + '/' + params.cyear4;
        break;
    case 'DD/MM/YY':
        value = params.cdate + '/' + params.cmonth + '/' + params.cyear2;
        break;
    case 'DD/MM/YYYY':
        value = params.cdate + '/' + params.cmonth + '/' + params.cyear4;
        break;
    case 'MM.DD.YY':
        value = params.cmonth + '.' + params.cdate + '.' + params.cyear2;
        break;
    case 'MM.DD.YYYY':
        value = params.cmonth + '.' + params.cdate + '.' + params.cyear4;
        break;
    case 'DD.MM.YY':
        value = params.cdate + '.' + params.cmonth + '.' + params.cyear2;
        break;
    case 'DD.MM.YYYY':
        value = params.cdate + '.' + params.cmonth + '.' + params.cyear4;
        break;
    case 'mmm DD YYYY':
        value = params.months[dt.getMonth()] + ' ' + params.cdate + ' ' + params.cyear4;
        break;
    case 'DD mmm YYYY':
        value = params.cdate + ' ' + params.months[dt.getMonth()] + ' ' + params.cyear4;
        break;
    case 'hh:mm:ss':
        value = params.hrs + ":" + params.mts + ":" + params.sec;
        break;
    case 'HH:mm:ss AP':
        value = params.hrs12 + ':' + params.mts + ':' + params.sec + ' ' + params.amPm;
        break;
    case 'hh:mm':
        value = params.hrs + ":" + params.mts;
        break;
    case 'HH:mm AP':
        value = params.hrs12 + ':' + params.mts + ' ' + params.amPm;
        break;
    };
    return value;
}	
/**
 * Updates the local time
 */
hmiDateTime.prototype.updateValue = function () {
	var dt = new Date();
	this.setValue('value', dt);
};

/**
 * Setting the value of the DateTime widget
 * @param {String} the The tag name
 * @param {Object} newValue The new value of widget
 */
hmiDateTime.prototype.setValue = function (tag, newValue) {

    if (tag == 'value') {
		if ($.type(newValue).toLowerCase() !== 'date')
			return false;
			
        if (this.value !== newValue) {
		    var strValue = this.formatValue(this.format, newValue);
        		// store date object
        	this.value = newValue;
        	$(this.elem).html(strValue);
        }
    } else {
        hmiWidget.prototype.setValue.call(this, tag, newValue);
    }
};
/**
 * Function to get the value of the Widget
 * @param {String} tag tag name will be the property name
 */
hmiDateTime.prototype.getValue = function (tag) {
    if (tag == "value") {
    		// return Date object
        return this.value;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};
/**
 * Setting the value of the DateTime widget; custom setValue funcition for special purpsoe. Applicable only for Server based dates/times
 * @param {String} tag The tag name
 * @param {Object} newValue The new value of widget
 */
hmiDateTime.prototype.setValueFromServer = function (tag, newValue) {
    if (this.isBadValue(newValue)) {
        return false;
    }
    if (this.value === newValue) {
        this.restartTimer();
        return false;
    }
    this.setValue('value', newValue);
};
/**
 * Restarts the timer
 */
hmiDateTime.prototype.restartTimer = function () {
    if (this.timer) {
        clearTimeout(this.timer);
    }
    var me = this;
    me.timer = setInterval(function () {
        me.updateValue();
    }, me.interval);
};

$hmi.fn.hmiDateTime = function (options, parentPage) {
    return new hmiDateTime(this.wgtId, options, parentPage);
};