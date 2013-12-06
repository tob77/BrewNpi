/**
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiButton(wgtId, options, parentPage) {
    // do nothing for default constructor
    if (!wgtId) return;
    // default property values
    this.imgX = 0;
    this.imgY = 0;
    this.imgYbase = 0;
    this.imgWidth = null;
    this.imgHeight = null;
    this.curState = 0;
    this.toggle = false;
    this.action = "write";
    // local vars
    this.numStates = 2;
    this.clickDelay = 0;
    this.clickDx = 2;
    this.clickDy = 2;
    this.isOffset = 0;
    this.type = "standard";
    this.strokeWidth = 1;
    hmiWidget.call(this, wgtId, options, parentPage);
    //  need to have good values for imgWidth and imgHeight for button to work
    if (!this.imgWidth && this.elem)
        this.imgWidth = this.elem.clientWidth;
    if (!this.imgHeight && this.elem)
        this.imgHeight = this.elem.clientHeight;
    	
    this.imgYbase = this.imgY;    	

     if (this.fill != undefined) {
        this.setValue('fill', this.fill);
    }         	   
    
    var self = this;
		//Event handler assignments	
	if (this.parentPage) {
		// if parent page, handle mouse clicks globally
		$(self.elem).bind( "mousedown.button", function (evt) {
			if ( !options.disabled ) 
				$hmi.handleMouse(self);
		});
		$(self.elem).bind("touchstart", function (evt) {
			evt.preventDefault();
			if ( !options.disabled ) 
				$hmi.handleMouse(self);
		});
	} else {
		// if no parent page, need to handle the mouse clicks in the widget
		$(self.elem).bind( "mousedown.button", function( event ) {
			if ( options.disabled ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if (self) {
				var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
				self.doMouseDown(evtInfo);
			}
		});
		$(self.elem).bind( "mouseup.button", function( event ) {
			if ( options.disabled ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if (self) {
				var evtInfo = $hmi.mouseMgr.wgtEventInfo(self, event);
				self.doMouseUp(evtInfo);
			}
		});
	}

}

/**
 * Inheriting the base class Widget
 */
hmiButton.prototype = new hmiWidget();

/**
 * function that handles the onmousedown event for a Button widget. 
 * @param {Object} evtInfo The event object, custom one
 */
hmiButton.prototype.doMouseDown = function (evtInfo) {
    var newState = (!this.toggle ? 1 : (this.curState === 1 ? 0 : 1));
    this.setValue('value', newState);
    // need to update tag attached to button
    this.doWriteValue('value', this.curState);

};

/**
 * function that handles the onmouseup event for a Button widget.
 * @param {Object} evtInfo The event object, custom one
 */
hmiButton.prototype.doMouseUp = function (evtInfo) {
    if (!this.toggle) {
        this.setValue('value', 0);     
	    // need to update tag attached to button
	    this.doWriteValue('value', this.curState);
    }
};

/**
 * Changes the state of button.
 */
hmiButton.prototype.updateValue = function () {
    this.setState(this.curState === 1 ? 0: 1);
};

/**
 * Setting the value of the Button widget
 * @param {String} tag The tag name
 * @param {Number} newValue The widget value
 */
hmiButton.prototype.setValue = function (tag, newValue) {

    if (tag == 'value') {
	    if (this.isBadValue(newValue)) {
	        return false;
	    }
		newValue = parseFloat(newValue);
        if (isNaN(newValue)) {
            return false;
        }
       // click delay is so we don't update after we clicked on the button
        // need to give time for the write value to get to the panel
        if (this.clickDelay <= 0) {
        	var oldState = this.curState;
            this.setState(newValue);
		    	// store value in the element for compat with jquery interface
		    this.elem.value = newValue;
            // update any widgets attached to us only if there is change in the curState values
            if (oldState !== this.curState) {
                this.sendUpdate(tag, this.curState);
            }
       } else {
            this.clickDelay--;
        }
    } else if (tag == 'fill') {
		var indexValue = parseInt(newValue)
		if (indexValue) {
			// palette colors are below the base color
			this.imgY = this.imgYbase + (indexValue + 1) * this.imgHeight;
			this.fill = newValue;
			// refresh the widget
			this.redraw();
		} else {
			this.elem.style.backgroundColor	= newValue;
			this.fill = newValue;
		}
	} else {
 //		$.hmi.hmiWidget.prototype.setValue.call( this, tag, newValue );
       hmiWidget.prototype.setValue.call(this, tag, newValue);
    }
};

/**
 * Function to get the value of the Widget
 * @param {String} tag tag name will be the property name
 */
hmiButton.prototype.getValue = function (tag) {
    if (tag == "value") {
        return this.curState;
    } else {
        return hmiWidget.prototype.getValue.call(this, tag);
    }
};

/**
 * Set the state of button.
 * @param {Number} newState New state value
 */
hmiButton.prototype.setState = function (newState) {
    //The button has only two states either 0 or 1. The button will be shown in pressed state only if its value is 1 in all other case it maintains 0 state
    //if you use this.curState for this purpose the button will show pressed and release state for every value that we dont want
    var value = newState > 1 || newState < 0 ? 0: newState;
    //if we don't use Math.abs then it will return negated reminders if the value is < 0
    newState = Math.abs(newState % this.numStates);
    if (this.curState != newState) {
        this.curState = newState;
        if (this.type === "standard") {
            // shift the image in the image list (use neg values for images)
            var imgOffset = -this.imgX - (value * this.imgWidth);
            $(this.elem).css('background-position', imgOffset + 'px ' + -this.imgY + 'px');
        } else if ((this.type === "rectangle") || (this.type === "oval")) {
            if (this.curState) {
                if (this.dwnFill) this.elem.style.backgroundColor = this.dwnFill;
                if (this.dwnStroke) this.elem.style.borderColor = this.dwnStroke;
            } else {
                if (this.upFill) this.elem.style.backgroundColor = this.upFill;
                if (this.upStroke) this.elem.style.borderColor = this.upStroke;
            }
        } else if ((this.type === "css-box")&&this.downClass) {
        	if (this.curState) {
				$(this.elem).addClass(this.downClass);
			} else {
				$(this.elem).removeClass(this.downClass);				
			}
        }
        // offset the widgets inside of the group
        // only works if element is visible (use offsetWidth to determine if element is visible)
        if ((this.type!=='hotspot') && (this.elem.offsetWidth != 0)) {
            if ((this.curState == 0) && this.isOffset) {
                this.offsetWgts(-this.clickDx, -this.clickDy);
                this.isOffset = 0;
            } else if ((this.curState == 1) && (this.isOffset == 0)) {
                this.offsetWgts(this.clickDx, this.clickDy);
                this.isOffset = 1;
            }
        }
    }
};

/**
 * Function readraws the button image based on the current state
 */
hmiButton.prototype.redraw = function () {
    // shift the image in the image list (use neg values for images)
	if (this.type==="standard") {
	    var imgOffset = -this.imgX - (this.curState * this.imgWidth);
	    $(this.elem).css('background-position', imgOffset + 'px ' + -this.imgY + 'px');
	}
};

/**
 * Handles Button widget offsetX and offsetY animation while clicking on it
 * @param {Number} dx The x value that needs to be applied on the animation
 * @param {Number} dy The y value that needs to be applied on the animation
 */
hmiButton.prototype.offsetWgts = function (dx, dy) {
    var intersectsElem = function (elem1, elem2) {
        return !((elem2.offsetLeft > (elem1.offsetLeft + elem1.offsetWidth)) || ((elem2.offsetLeft + elem2.offsetWidth) < elem1.offsetLeft) || (elem2.offsetTop > (elem1.offsetTop + elem1.offsetHeight)) || ((elem2.offsetTop + elem2.offsetHeight) < elem1.offsetTop));
    }
    var pel = this.elem.parentNode;
    if (pel.className.indexOf('GroupWgt') !== -1) {
        var bEnableOffset = false;
        var divs = pel.getElementsByTagName('div');
        for (var i = 0, l = divs.length; i < l; i++) {
            var elem = divs[i];
            // use offsetWidth to determine if the element is visible (offsetWidth is 0 when element is not shown)
            if (bEnableOffset && (elem.offsetWidth != 0) && intersectsElem(elem, this.elem)) {
                elem.style.left = (elem.offsetLeft + dx) + "px";
                elem.style.top = (elem.offsetTop + dy) + "px";
            }
            // wait till we pass the button in the list.  We only want to shift widgets after (higher z-order) the button
            if (elem == this.elem) bEnableOffset = true;
        }
    } else {
    	// if we are not in a group, then offest this element
        	// use offsetWidth to determine if the element is visible (offsetWidth is 0 when element is not shown)
        if (this.elem.offsetWidth != 0) {
        	var elem = this.elem;
        	if (dx>0) {
        		this.savePadLeft = $(elem).css("padding-left");
       			this.savePadTop = $(elem).css("padding-top");	
	            elem.style.paddingLeft = (parseInt(this.savePadLeft) + dx) + "px";
	            elem.style.paddingTop = (parseInt(this.savePadTop) + dy) + "px";
	        } else {
	            elem.style.paddingLeft = this.savePadLeft;
	            elem.style.paddingTop = this.savePadTop;	        	
	        }
        }
    }
};

$hmi.fn.hmiButton = function (options, parentPage) {
    return new hmiButton(this.wgtId, options, parentPage);
};