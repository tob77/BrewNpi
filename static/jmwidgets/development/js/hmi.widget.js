/**
 * JMwidgets
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 
function hmiWidget(wgtId, options, parentPage) {
    // do nothing for an empty constructor
    if (!wgtId)
        return;
    this.wgtId = wgtId;
    this.opacity = null;
    this.visibility = null;
    this.x = null;
    this.y = null;
    this.parentPage = parentPage;
    this.elem = document.getElementById(wgtId);
		// not sure why this is in the base class (most widgets do not have text)
	this.masked = false;
    this.maskChar = '*';

    if (options)
        this.setOptions(options);

    if (!this.parentPage)
        this.parentPage = $hmi.activePage;

    if (this.parentPage!==null)
        this.parentPage.addWidget(this.wgtId, this);
     
};

/**
 * Sets the widget id
 * @param {String} strId A string representing the Id of the widget
 */
hmiWidget.prototype.setId = function ( strId ) {
    this.wgtId = strId;
};
/**
 * Sets the element
 * @param {Object} elem An HTML element
 */
hmiWidget.prototype.setElem = function ( elem ) {
    this.elem = elem;
};
/**
 * Initialization. It sets the props as variables of the object.
 * @param {Object} props The properties of the widget.
 */
hmiWidget.prototype.setOptions = function ( options ) {
    if ( options != null ) {
        for ( var i in options ) {
            this[i] = options[i];
        }
    }
};
	// provide jquery ui style interfaces
hmiWidget.prototype.setOption = function ( key, value ) {
	this.setValue(key, value);
};
hmiWidget.prototype.getOption = function ( key, value ) {
	return this.getValue(key);
};

/**
 * Empty function that can be override by the child widgets
 */
hmiWidget.prototype.init = function () {
};
/**
 * method sets the widget's property value that depends on another widget's property value
 * @param {String} tag The attribute name
 * @param {string/Number} newValue The value of the property
 */
hmiWidget.prototype.setValue = function ( tag, newValue ) {
    var changed = !1;
    if ( tag === 'visibility') {
        if ( !newValue && this.elem.style.display !== 'none' ) {
            this.elem.style.display = 'none';
            this.visibility = 0;
            changed = !0;
        } else if ( newValue && this.elem.style.display === 'none' ) {
            this.elem.style.display = 'block';
            this.visibility = 1;
            changed = !0;
        }
    } else if ( tag === 'opacity' || tag === 'fill-opacity') {
        if ( this.opacity != newValue ) {
            this.opacity = newValue;
            $( this.elem ).fadeTo( 0, newValue );
            changed = !0;
        }
    } else if ( tag === 'x' ) {
        if ( this.x != newValue ) {
            this.x = newValue;
            this.elem.style.left = newValue + 'px';
            changed = !0;
        }
    } else if ( tag === 'y' ) {
        if ( this.y != newValue ) {
            this.y = newValue;
            this.elem.style.top = newValue + 'px';
            changed = !0;
        }
    } else {
    		//  store the value by default
    	this[tag] = newValue;
    }
    if ( changed ) {
        this.sendUpdate( tag, newValue );
    }
};

/**
 * This function will mask the original visual widget value with the mask characters
 * @param {Number/String} val The widget value
 */
hmiWidget.prototype.setMaskedValue = function ( val ) {
    var len = val.toString().length, msk = '';
    for ( var i = 0; i < len; i++ ) {
        msk += this.maskChar;
    }
    if ( this.elem ) {
        this.elem.innerHTML = msk;
    }
};

/**
 * This function sets widget's property  to the provided value, if the property exist in the widget
 * @param {String} tag The attribute/property name of the widget
 * @param {string/Number} newValue Teh value of the widget property
 */
hmiWidget.prototype.setWgtProperty = function ( tag, newValue ) {
    if ( typeof this[tag] !== 'undefined' && this[tag] != newValue ) {
        this[tag] = newValue;
        return 1;
    }
    return 0;
};
/**
 * Empty function that can be override by the child widgets
 */
hmiWidget.prototype.getValue = function ( tag ) {
    if ( tag === 'visibility' ) {
        return this.elem.style.display === null || this.elem.style.display == 'none' ? 0: 1;
    } else {
        return this[tag];
    }
    return null;
};
/**
 * Empty function that can be override by the child widgets. This can be used for starting the widget
 */
hmiWidget.prototype.start = function () {
};
/**
 * Empty function that can be override by the child widgets. This can be used for stopping the widget
 */
hmiWidget.prototype.stop = function () {
};
/**
 * Empty function that can be override by the child widgets. This can be used for activating the widget
 */
hmiWidget.prototype.activate = function () {
    // handle actions attached to the widget
    var actionFlag = 0;
    if ( this.onActivate ) {
        actionFuncs = this.onActivate.split( ';' );
        for ( var i = 0; i < actionFuncs.length; i++ ) {
            $hmi.doAction( this.wgtId, actionFuncs[i] );
        }
    }
};
/**
 * Empty function that can be override by the child widgets. This can be used for deactivating the widget
 */
hmiWidget.prototype.deactivate = function () {
    // handle actions attached to the widget
    var actionFlag = 0;
    if ( this.onDeactivate ) {
        actionFuncs = this.onDeactivate.split( ';' );
        for ( var i = 0; i < actionFuncs.length; i++ ) {
            $hmi.doAction( this.wgtId, actionFuncs[i] );
        }
    }
};
hmiWidget.prototype.bind = function ( wgtEvent, wgt ) {
};
hmiWidget.prototype.trigger = function ( wgtEvent ) {
};
/**
 * Adds the DatLink widgets
 * @param {object} newlink A DataLink widget instance
 */
hmiWidget.prototype.addDataLink = function ( newLink ) {
    if ( this.dataLinks == undefined ) {
        this.dataLinks = [];
    }
    this.dataLinks.push( newLink );
};
/**
 * Tells any widgets attached to this widget that the data has changed
 * @param {String} tag The tag name
 * @param {String/Number} value The tah value
 */
hmiWidget.prototype.sendUpdate = function ( tag, value ) {
    // update the attached variables
    var dataLink;
    if ( this.dataLinks ) {
        for ( var i = 0; i < this.dataLinks.length; i++ ) {
            dataLink = this.dataLinks[i];
            if ( (dataLink.tag === tag) && (dataLink.tgtWgt !== this) ) {
                dataLink.setWgtValue( value );
            }
        }
    }
};
/**
 * Tells writes the value from widget to datasource
 * @param {String} attr The attribute name
 * @param {String/Number} value The value of attribute.
 */
hmiWidget.prototype.doWriteValue = function ( attr, newValue ) {
    // update the attached variables
    var dataLink;
    if ( this.dataLinks ) {
        for ( var i = 0; i < this.dataLinks.length; i++ ) {
            dataLink = this.dataLinks[i];
            if ( (dataLink.attr === attr) && (dataLink.dataSrc !== this) ) {
                dataLink.setTagValue( newValue );
            }
        }
    }
    	// initiate jquery change events so we are compatible with jquery widgets
    $(this.elem).trigger('change.'+attr, {tag:attr, value:newValue});
};
/**
 * Function that determines whether the incoming value is invalid or not
 * @param {String/Number} newValue The new value the widget is going to have
 * @return {Boolean} true if it is a invalid value otherwise false
 */
hmiWidget.prototype.isBadValue = function ( newValue ) {
    if ( $( this.elem ).css( 'display' ) === 'none' ) {
        return false;
    }

    if (newValue === null || isNaN(newValue)) {
        if ( !$( this.elem ).hasClass( 'bad-a' ) ) {
            $( this.elem ).addClass( 'bad-a' ); //a dummy class assignment just to identify the element on which we've enabled the bad value icons.
            this.showBadValueIcon();
        }
        return true;
    } else {
        if ( $( this.elem ).hasClass( 'bad-a' ) ) {
            this.removeBadValueIcon();
            $( this.elem ).removeClass( 'bad-a' );
        }
        return false;
    }
};
/**
 * Function that shows the bad value icon on the associated widgets
 */
hmiWidget.prototype.showBadValueIcon = function () {
    var badId = this.wgtId + '_bad', badClass = 'bad', badElemWidth = 16, sHtml = '<div id="' + badId + '" class="' + badClass + '"></div>';
    //New element creation
    var $badElem = $( sHtml );
    //Appending it to Body
    $( 'body' ).append( $badElem );
    //Computation of bad element position
    var offset = $( this.elem ).offset(), posX = (offset.left + $( this.elem ).width()) - badElemWidth, posY = offset.top;
    $badElem = document.getElementById( badId );
    if ( $badElem ) {
        $badElem.style.left = posX + 'px';
        $badElem.style.top = posY + 'px';
        $badElem.style.width = badElemWidth + 'px';
        $badElem.style.height = badElemWidth + 'px';
    }
};
/**
 * Function that removes the bad value icon from the associated widget
 */
hmiWidget.prototype.removeBadValueIcon = function () {
    $( '#' + this.wgtId + '_bad' ).remove();
};
// add widget to the lst based on the namespace
hmiWidget.prototype.addWidget = function ( id, wgtObj ) {
    if ( !this.wgts ) {
        this.wgts = [];
    }
    this.wgts[id] = wgtObj;
    this.initPagePrefixes( id );
};
hmiWidget.prototype.initPagePrefixes = function ( id ) {
    if ( id.indexOf( '_' ) !== -1 ) {
        var prefix = id.substring( 0, id.indexOf( '_' ) );
        $hmi.setActivePagePrefixes( prefix );
    }
}
// remove a widget from the list
hmiWidget.prototype.removeWidget = function ( id ) {
    if ( this.wgts ) {
        this.wgts[id] = null;
    }
};
hmiWidget.prototype.getWidget = function ( id ) {
    return (this.wgts) ? this.wgts[id]: null;
};