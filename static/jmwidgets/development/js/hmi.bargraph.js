/*
 * JMwidgets
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiBarGraph(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;

    this.value = undefined;
    this.min = 0.0;
    this.max = 100.0;
    this.length = null;
    this.imgWidth = 32;
    this.imgHeight = 32;
    this.imgX = 0;
    this.imgY = 0;
    this.imgYbase = 0;
    this.nodes = 0;
    this.reverse = 0;
    this.majorTickWidthInPx = 5;
    this.majorTickWidth = 2;
    this.orientation = "h";
    this.BarTypes = {
        kVert              : 0,
        kHoriz             : 1,
        kVertImageClip     : 2,
        kHorizImageClip    : 3,
        kVertImageStretch  : 4,
        kHorizImageStretch : 5,
        kSegments          : 6
    };
    this.barType = this.BarTypes.kVert;
    hmiWidget.call(this, wgtId, options, parentPage);
    
    this.barElem = this.elem.children[0];
    this.range = (this.max - this.min);
    if (this.range <= 0) this.range = 1;

    if (this.type.indexOf("horiz") >= 0)
        this.barType = this.BarTypes.kHoriz;
    if (this.type.indexOf("segment") >= 0)
        this.barType = this.BarTypes.kSegments;
	
	if (this.fill) {
		$(this.elem).children(":first").css('background-color', this.fill)
	}	
    	// make sure this.length is set
    this.length = this.length || ((this.type=="vert") ? this.elem.clientHeight : this.elem.clientWidth);
		// set the initial value
	if (this.value!==undefined)
    	this.setValue('value', this.value); 
}


hmiBarGraph.prototype = new hmiWidget();

/**
 * Setting the value of the hmiBarGraph widget
 * @param {String} tag The tag name
 * @param {Number} newValue The widget value
 */
hmiBarGraph.prototype.setValue = function (tag, newValue) {

    if (tag === 'value') {
	    if (this.isBadValue(newValue)) {
	        return false;
	    }
    	newValue = parseFloat(newValue)
        if (isNaN(newValue)) {
            return false
        }
        // make sure we do not exceed the limits
        this.setState(newValue);
    } else if (tag === 'fill') {
    	if (typeof(newValue)==='number') {
	        if (isNaN(newValue)) {
	            return false
	        }
	        this.imgY = this.imgYbase + (newValue + 1) * this.imgHeight;
	        // refresh the widget
	        this.redraw();
	    } else {
	    	this.fill = newValue;
	    }
    } else {
        hmiWidget.prototype.setValue.call(this, tag, newValue);
    }
};
/**
 * Function to get the value of the Widget
 * @param {String} tag tag name will be the property name
 */
hmiBarGraph.prototype.getValue = function (tag) {
    if (tag == "value") {
        return this.value;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};
/**
 * Function to set the bargraph value to a new state
 * @param {Number} newValue
 */
hmiBarGraph.prototype.setState = function (newValue) {
	if (this.disabled)
		return;
		
    if (newValue > this.max) newValue = this.max;
    if (newValue < this.min) newValue = this.min;
    this.value = newValue;
    this.redraw()
};
/**
 * Function that draws the bargraph's current state
 */
hmiBarGraph.prototype.redraw = function () {
    var barElem = this.barElem;
    if (barElem) {
        if ((this.barType === this.BarTypes.kVert) || (this.barType === this.BarTypes.kVertImageStretch) || (this.barType === this.BarTypes.kVertImageClip)) {
            // vertical
            var pos = this.length - (this.value * this.length / this.range);
            //Vertical bar graph does not sync with the scale and this part will fix that.
            var height = (this.length - pos) + 'px';
            pos = this.orientation === 'v' && parseFloat(this.value) > parseFloat(this.min) && parseFloat(this.value) < parseFloat(this.max) ? pos - 8 : pos;
            var cssStyle = this.reverse ? {
                'top'    : '0px',
                'height' : height
            } : {
                'top'    : pos + 'px',
                'height' : height
            };
            barElem.style.top = cssStyle['top'];
            barElem.style.height = cssStyle['height'];
        } else if ((this.barType === this.BarTypes.kHoriz) || (this.barType === this.BarTypes.kHorizImageStretch) || (this.barType === this.BarTypes.kHorizImageClip)) {
            // horizontal
            pos = this.value * this.length / this.range;
            var cssStyle = this.reverse ? {
                'width' : pos + 'px',
                'left'  : (this.length - pos) + 'px'
            } : {
                'width' : pos + 'px'
            };
            barElem.style.width = cssStyle['width'];
            if (typeof cssStyle['left'] !== 'undefined') {
                barElem.style.left = cssStyle['left'];
            }
        } else if (this.barType === this.BarTypes.kSegments) {
            // shift the image in the image list (use neg values for images)
            var state = Math.ceil(this.value / this.range * this.nodes);
            var imgOffset = -this.imgX - (state * this.imgWidth);
            barElem.style.backgroundPosition = imgOffset + 'px ' + -this.imgY + 'px';
        }
    }
};
$hmi.fn.hmiBarGraph = function (options, parentPage) {
    return new hmiBarGraph(this.wgtId, options, parentPage);
};