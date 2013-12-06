/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiSlider(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;
    this.type='vert';
    this.min = 0;
    this.max = 100;
    this.range = 100;
    this.thumbElem = null;
    this.imgW = 50;
    this.imgH = 37;
    this.value = 0;
    this.numFormat = "#";
    this._clickOffset = null;
    this.dragging = 0;
    hmiWidget.call(this, wgtId, options, parentPage);
		// need to get the margin values to position the thumb correctly
    this.marginX = parseInt($(this.elem).css('margin-left'));	
    this.marginY = parseInt($(this.elem).css('margin-top'));
    	
    this.thumbElem = this.elem.children[0];

    if (this.type=='horiz')
    	this.isVert=false;
    else
    	this.isVert=true;
    	

    if (this.length===undefined) {
    	if (this.isVert)
    		this.length = this.elem.clientHeight;
    	else
     		this.length = this.elem.clientWidth;
    }
    if (this.thumbElem) {
        this.imgW = this.thumbElem.clientWidth;
        this.imgH = this.thumbElem.clientHeight;
	}
	this.range = this.max - this.min;

	this.render();	
            // event handler assignments	
	var self = this;	
	if (this.parentPage) {
		// if parent page, handle mouse clicks globally
		$(self.elem).bind( "mousedown.button", function (evt) {
			$hmi.handleMouse(self);
		});
		$(self.elem).bind("touchstart", function (evt) {
			evt.preventDefault();
			$hmi.handleMouse(self);
		});
	} else {
		// if no parent page, need to handle the mouse clicks in the widget
		$(self.elem).bind( "mousedown.button", function( event ) {
			if ( options.disabled ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if (self) {
           		if (event && event.preventDefault) event.preventDefault(); // need to disable dragging in Firefox
				var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
				self.doMouseDown(evtInfo, event);
			}
		});
		$(self.elem).bind( "mouseup.button", function( event ) {
			if ( options.disabled ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if (self) {
            	if (event && event.preventDefault) event.preventDefault(); 
				var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
				self.doMouseUp(evtInfo, event);
			}
		});
		$(self.elem).bind( "mousemove.button", function( event ) {
			if ( options.disabled ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if (self && self.dragging) {
            	if (event && event.preventDefault) event.preventDefault(); 
				var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
				self.doMouseMove(evtInfo, event);
			}
		});	
		$(self.elem).bind("touchstart", function (event) {
            if (event && event.preventDefault) event.preventDefault(); 
			var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
			self.doMouseDown(evtInfo, event);
		});			
		$(self.elem).bind("touchmove", function (event) {
            if (event && event.preventDefault) event.preventDefault(); // need to disable dragging in Firefox
			var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
			self.doMouseMove(evtInfo, event);
		});	
	}    
}
/**
 * Inheriting the base class Widget
 */
hmiSlider.prototype = new hmiWidget();

/**
 * Setting the value of the Slider widget
 * @param {String} tag The tag name
 * @param {Number} newValue The new widget value
 * @param {[Number]} isDragging An optional parameter to distinguish setValue calls from within the onmousemove and onmousedown routines with other ones
 */
hmiSlider.prototype.setValue = function (tag, newValue) {

    if (tag == "value") {
	    if (this.isBadValue(newValue)) {
	        return false;
	    }
        newValue = parseFloat(newValue);
        if (isNaN(newValue)) {
            return false;
        }
        if (newValue > this.max) {
            newValue = this.max
        } else {
            if (newValue < this.min) {
                newValue = this.min
            }
        }
        if (this.value != newValue) {
            this.value = newValue;
			this.render();
            this.sendUpdate(tag, newValue)
        }
    } else {
        hmiWidget.prototype.setValue.call(this, tag, newValue)
    }
};
hmiSlider.prototype.render = function () {
    var valPercent = (this.value - this.min) / (this.range) * 100;
    if (this.thumbElem) {
    	if (this.isVert) {
    			// vert starts from the bottom
        	var px = this.length - (this.length * valPercent / 100) - this.imgH/2;
	    	this.thumbElem.style['top'] = px + 'px';
        } else {
        	var px = (this.length * valPercent / 100) - this.imgW/2;
        	this.thumbElem.style['left'] = px + 'px';
        }
    }
}
/**
 * Function to get the value of the Widget
 * @param {String} tag tag name will be the property name
 */
hmiSlider.prototype.getValue = function (tag) {
    if (tag == "value") {
        return this.value;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};
/**
 * Function that sets the initial value of the widget need not be accountable as this should not invoke onDataUpdate event
 * @param {Number} value The initial widget value set in the JM project
 */
hmiSlider.prototype.setInitialValue = function (value) {
    if (value > this.max) {
        value = this.max
    } else {
        if (value < this.min) {
            value = this.min
        }
    }
    if (this.value === null) {
        this.value = parseFloat(value);
        this.render();
    }
};
/**
 * function that handles the onmousedown event on a hmiSlider's thumb element.
 * @param {Object} evtInfo The event object, custom made one
 * @param {Object} e The original event object
 */
hmiSlider.prototype.doMouseDown = function (evtInfo, e) {

    this.dragging = 1;
    var pos;
    if (evtInfo.isInThumb) {
		this._clickOffset = {x:evtInfo.cx-this.imgW/2, y:evtInfo.cy-this.imgH/2 };
		pos = {
	        x: evtInfo.x-this._clickOffset.x,
	        y: evtInfo.y-this._clickOffset.y
	    };
	} else {

			// if clicking outside the thumb, subtract offset so thumb is in center of click point
		this._clickOffset = {x:0, y:0 };
	    pos = {
	        x: evtInfo.x-this._clickOffset.x,
	        y: evtInfo.y-this._clickOffset.y
	    };		
	}
    var normValue = this._normValueFromMouse(pos);

	// need to set value if clicked outside the thumb
    this.setValue("value", normValue);
    this.doWriteValue("value", this.value);

};
/**
 * function that handles the onmouseUp event on a hmiSlider's thumb element.
 * @param {Object} evtInfo The event object, custom made one
 * @param {Object} e The original event object
 */
hmiSlider.prototype.doMouseUp = function (evtInfo, e) {
    this.dragging = 0;
    this._clickOffset = null;
};
/**
 * function that handles the onmouseMove event on a hmiSlider's thumb element.
 * @param {Object} evtInfo The event object, custom made one
 * @param {Object} e The original event object
 */
hmiSlider.prototype.doMouseMove = function (evtInfo, e) {

    this.dragging = 1;
    var position = {
       x: evtInfo.x - this._clickOffset.x,
       y: evtInfo.y - this._clickOffset.y
    };
	var normValue = this._normValueFromMouse(position);
    this.setValue("value", normValue);
    this.doWriteValue("value", this.value);
};

/**
 * Function that computes the value based on the clicked position
 * @param {Object} position Contains left and top values of the clicked position
 * @return {Number} The value computed
 */
hmiSlider.prototype._normValueFromMouse = function (pos) {

	var pxMouse = this.isVert ? pos.y : pos.x;
	var pctMouse = pxMouse / this.length;
    if (pctMouse > 1) {
        pctMouse = 1;
    } else if (pctMouse < 0) {
        pctMouse = 0;
    }
    if (this.isVert) {
        pctMouse = 1 - pctMouse;
    }

    var value = this.min + (pctMouse * this.range);
    return value.toFixed(2);

};
$hmi.fn.hmiSlider = function (options, parentPage) {
    return new hmiSlider(this.wgtId, options, parentPage);
};