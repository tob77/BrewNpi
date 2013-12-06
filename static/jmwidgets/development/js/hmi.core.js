/*!
 * JMwidgets 
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */
 	// css caching
window.$hmicss = [];

var hmiMgr = function (selector) {
    // use jquery's approach to create an object for each selector
    return new hmiMgr.fn.instantiate(selector);
};
hmiMgr.xforms = {};
hmiMgr.activePage = null;
hmiMgr.wgts = {};
hmiMgr.activeTagMgrs = [];
hmiMgr.activePagePrefixes = [];
hmiMgr.isInited = false;
hmiMgr.globalMouse = false;
hmiMgr.fx = {};

	// this method caches a css parameter for a widget
hmiMgr.cacheCSS = function (strClass, valueMap) {
	var cacheVal = window.$hmicss[strClass];
		// if cached value aready exists, append to it
	if (cacheVal) {
		for (i in valueMap) {
			cacheVal[i] = valueMap[i];
		}		
	} else {
		window.$hmicss[strClass] = valueMap;
	}
}

// this method inialized the mouse handlers for the page
// needs to be called after document is loaded
hmiMgr.init = function () {
    // only init once
    if (this.isInited === false) {
        this.mouseMgr.init();
		this.globalMouse = true;
        // disable highlighting in webkit (selection flash)
        document.documentElement.style.webkitTapHighlightColor = "rgba(0,0,0,0)";
        // disable image save in webkit
        document.documentElement.style.webkitTouchCallout = "none";
        // disable save dialog when tap held down
        document.documentElement.style.webkitUserSelect = "none";
        this.isInited = true;
    }
};

// finds the widget in the set of page
hmiMgr.getWidget = function (wgtId) {
    var retWgt = null;

    // first check if widget is in the active page
    if (this.activePage)
        retWgt = this.activePage.getWidget(wgtId);
    if (!retWgt && this.wgts && this.wgts.length>0) {
        // next check the global widgets
        retWgt = this.wgts[wgtId];
        if (!retWgt) {
            // if not in global space, check all pages
            for (i in this.wgts) {
                if (this.wgts[i].getWidget) retWgt = this.wgts[i].getWidget(wgtId);
                if (retWgt) break;
            }
        }
    }
    	// use jquery to get the widget (for jmwidgets support)
    if (!retWgt) {
    	retWgt = $("#"+wgtId).data('hmiWgt');
    }
    	
    return retWgt;
};
// add widget to the lst based on the namespace
hmiMgr.addWidget = function (id, wgtObj) {
    if (wgtObj && wgtObj.wgtPage) {
        wgtObj.wgtPage.addWidget(id, wgtObj);
    } else {
        this.wgts[id] = wgtObj;
    }
};
// store hmi widgets with a div element if we are using namespaces
hmiMgr.setActivePage = function (pageWgt) {
    this.activePage = pageWgt;
};
hmiMgr.setActiveTagMgrs = function (activeTagMgr) {
    this.activeTagMgrs.push(activeTagMgr);
};
hmiMgr.setActiveTagMgrsEmpty = function () {
    this.activeTagMgrs.length = 0
};
hmiMgr.setActivePagePrefixes = function (prefix) {
    if ($.trim(prefix) !== '' && $.inArray(prefix, this.activePagePrefixes) === -1) {
        this.activePagePrefixes.push(prefix);
    }
};
hmiMgr.setActivePagePrefixesEmpty = function (prefix) {
    this.activePagePrefixes.length = 0;
};

/**
 * This method is used to return the deviceID of device assigned to the given window. When used in the cloud, each window represents a device.  This method will extract the
 * deviceID from the window frame deviceID attribute or from the deviceID parameter in the url
 * @return {String}
 */
hmiMgr.getDeviceID = function () {
    var id = null;
    // first check in the parent frame attribute
    if (window.frameElement != null) {
        var strAttr = window.frameElement.getAttribute('deviceID');
        if (strAttr != null) {
            id = strAttr;
        }
    }
    if (id == null) {
        var strLocation = window.location.href;
        var locList = strLocation.split("?");
        if (locList[1] != null) {
            var paramList = locList[1].split("&");
            if (paramList[0] != null) {
                var var1 = paramList[0];
                var param1 = var1.split("=");
                if ((param1.length > 1) && (param1[0] == "deviceID") && (param1[1] != "")) {
                    id = param1[1];
                }
            }
        }
    }
    return id;
};
hmiMgr.actionMgr = {
    actions:[],
    que:[],
    execute:function (objAction, params, wgtId, strAction) {
        var me = this;
        this.que.push(function () {
            objAction.addActionListener(me);
            objAction.execute(wgtId, params, strAction);
        });
        // if this is the first item in the que, execute it
        //  it will get removed from the que when it is done
        if (this.que.length === 1) {
            //console.log('action started');
            this.que.shift()();
        }
    },
    done:function () {
        //console.log("Action Done");
        // remove the current action from the que
        //this.que.shift();
        // if we have more in the que, execute them
        if (this.que.length > 0) {
            //Do the action only if the function is available
            this.que.shift()();
        }
    }
};
// mouse handling methods
hmiMgr.handleMouse = function (wgt) {
    // set the new capture
    this.mouseMgr.mouseWgt = wgt;
};
hmiMgr.mouseMgr = {
    startX         : 0,
    startY         : 0,
    scrollLeft     : 0,
    scrollTop      : 0,
    mouseWgt       : null,
    wgtPagePos	   : {left:0, top:0},
    wgtIsMouseDown : false,
    init           : function () {
        // needed to handle mouse capture correctly
        var me = this;
        $(document).mousedown(function (e) {
            me.doMouseDown(e);
        });
        $(document).mouseup(function (e) {
            me.doMouseUp(e);
        });
        $(document).mousemove(function (e) {
            var bHandled = me.doMouseMove(e);
            if (!bHandled && this.wgtIsMouseDown) me.doPageScroll(e);
        });
        //Touch events needs here especially the iPad loads the web part in it
        if ('ontouchstart' in window && 'ontouchend' in document) {
            $(document).mousemove(function (e) {
                me.doMouseMove(e);
            });
            //Touch events
            $(document).bind("touchstart", function (event) {
                me.doMouseDown(event);
            });
            $(document).bind("touchend", function (event) {
                me.doMouseUp(event);
            });
            $(document).bind("touchcancel", function (event) {
                me.doMouseUp(event);
            });
            $(document).bind("touchmove", function (event) {
                me.doMouseMove(event);
                /*var bHandled = me.doMouseMove(event);
                 if (!bHandled) {
                 me.doPageScroll(event);
                 }*/
            });
        }
    },
    doMouseDown:function (e) {
        var evt;
        if (e && e.originalEvent && typeof e.originalEvent.touches === "object") {
            if (e.originalEvent.touches.length <= 0) return;
            evt = e.originalEvent.touches[0];
        } else {
            evt = e || event;
        }
        var mouseWgt = this.mouseWgt;
        var evtTgt = evt.target || evt.srcElement;
        this.startY = evt.pageY;
        this.startX = evt.pageX;
        this.wgtIsMouseDown = true;
        if (mouseWgt != null) {
            if (e && e.preventDefault) e.preventDefault(); // need to disable dragging in Firefox and safari
            var objPos = $hmi.wgtPagePos(evtTgt);
            wgtClickCx = evt.pageX ? evt.pageX + this.scrollLeft - objPos.left : (evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft) - objPos.left;
            wgtClickCy = evt.pageY ? evt.pageY + this.scrollTop - objPos.top : (evt.clientY + document.body.scrollTop + document.documentElement.scrollTop) - objPos.top;
            this.wgtPagePos = $hmi.wgtPagePos(mouseWgt.elem);
            // handle internal routine
            if (mouseWgt.doMouseDown) {
                var evtInfo = this.wgtEventInfo(mouseWgt, e);
                mouseWgt.doMouseDown(evtInfo, e); //Sending the original event object too
            }
            // handle actions attached to the widget
            if (mouseWgt && mouseWgt.onMousePress) {
                var lstActionFuncs = mouseWgt.onMousePress.split(';');
                for (var i = 0; i < lstActionFuncs.length; i++) {
                    $hmi.doAction(mouseWgt.wgtId, lstActionFuncs[i]);
                }
            }
        }
    },
    doMouseUp:function (e) {
        if (e) {
            e.stopPropagation();
        }
        this.wgtIsMouseDown = false;
        if (this.mouseWgt != null) {
            var wgt = this.mouseWgt;
            // release capture
            this.mouseWgt = null; // set this first incase there is an exception in the action
            // handle internal routine
            if (wgt.doMouseUp) {
                var evtInfo = this.wgtEventInfo(wgt, e);
                wgt.doMouseUp(evtInfo, e); //Sending the original event object too
            }
            if (wgt && wgt.onMouseRelease) {
                // multiple functions are separated by a ;
                var lstActionFuncs = wgt.onMouseRelease.split(';');
                for (var i = 0; i < lstActionFuncs.length; i++) {
                    $hmi.doAction(wgt.wgtId, lstActionFuncs[i]);
                }
            }
        }
    },
    doMouseMove:function (e) {
        var bHandled = false;
        var evt;
        var mouseWgt = this.mouseWgt;
        if (mouseWgt != null) {
            if (e && e.originalEvent && typeof e.originalEvent.touches === "object") {
                if (e.originalEvent.touches.length <= 0) return;
                evt = e.originalEvent.touches[0];
            } else {
                evt = e || event;
            }
            if (e && e.preventDefault) e.preventDefault(); // need to disable dragging in Firefox
            var wgt = mouseWgt;
            if (mouseWgt.doMouseMove) {
                var evtInfo = this.wgtEventInfo(mouseWgt, e);
                mouseWgt.doMouseMove(evtInfo, e); //Sending the original event object too);
                bHandled = true;
            }
            //Studio does not support onmouseMove event. So commenting the following section
            /*if (wgt && wgt.onMouseMove) {
             // multiple functions are separated by a ;
             actionFuncs = wgt.onMouseMove.split(';');
             for (var i = 0; i < actionFuncs.length; i++) {
             this.doAction(wgt.wgtId, actionFuncs[i]);
             }
             }*/
        }
        return bHandled;
    },
    doPageScroll:function (e) {
        if (e && e.originalEvent && typeof e.originalEvent.touches === "object") {
            if (e.originalEvent.touches.length <= 0) return;
            evt = e.originalEvent.touches[0];
        } else {
            evt = e || event;
        }
        if (e && e.preventDefault) e.preventDefault(); // need to disable dragging in Firefox
        var posX = evt.pageX;
        var posY = evt.pageY;
        var pageBlock = document.getElementById("pageBlock");
        if (pageBlock) {
            var topY = pageBlock.scrollLeft;
            var topX = pageBlock.scrollTop;
            var scrollX = topY - (posX - this.startX);
            var scrollY = topX - (posY - this.startY);
            if (scrollX != 0) $(pageBlock).scrollLeft(scrollX);
            if (scrollY != 0) $(pageBlock).scrollTop(scrollY);
            this.scrollLeft = pageBlock.scrollLeft;
            this.scrollTop = pageBlock.scrollTop;
        }
        this.startY = posY;
        this.startX = posX;
    },
    wgtEventInfo:function (obj, e) {
        var evt;
        var evtTgt;
        if (e && e.originalEvent && typeof e.originalEvent.touches === "object") {
            if (e.originalEvent.touches.length <= 0) return;
            evt = e.originalEvent.touches[0];
            evtTgt = evt.target;
        } else {
            evt = e || event;
            evtTgt = evt.srcElement || evt.target;
        }

        var posx = 0;
        var posy = 0;
        if ((evt.pageX!==undefined) || (evt.pageY!==undefined)) {
            posx = evt.pageX + this.scrollLeft;
            posy = evt.pageY + this.scrollTop;
        } else if ((evt.clientX!==undefined) || (evt.clientY!==undefined)) {
            posx = evt.clientX + this.scrollLeft + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = evt.clientY + this.scrollTop + document.body.scrollTop + document.documentElement.scrollTop;
        }
			// wgtPagePos is set in the doMouseDown method
        var localX = posx - this.wgtPagePos.left;
        var localY = posy - this.wgtPagePos.top;
/*        
        if (obj) {
            if (obj.pageX!==undefined) localX = posx - obj.pageX;
            if (obj.pageY!==undefined) localY = posy - obj.pageY;	         	
        }
*/
         	// check if we are in a child elem.  If so assume it is the thumb element
		var inThumb = false;
		var thmbCx =0,
        	thmbCy=0;
		if (obj.elem != evtTgt) {
            if (obj.elem == evtTgt.parentNode) {
            	 inThumb = true;
            	 	// determine click position within the thumb
            	 if (evtTgt.offsetLeft!==undefined) thmbCx = localX - evtTgt.offsetLeft;
            	 if (evtTgt.offsetTop!==undefined) thmbCy = localY - evtTgt.offsetTop;
            }
        }       
        return {
            wgt: obj,
            isInThumb: inThumb,
            isMouseDown: this.wgtIsMouseDown,
            pageX: posx,
            pageY: posy,
            x: localX,
            y: localY,
            cx: thmbCx,
            cy: thmbCy
        };
    },
};
hmiMgr.scrubId = function (selector) {
    var wgtId = selector;
    // only supports '#' for now
    if (selector.indexOf("#") == 0) {
        wgtId = selector.substring(1, selector.length);
    }
    return wgtId;
};
hmiMgr.wgtPagePos = function (obj) {
    var curleft = 0;
    var curtop = 0;
    do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
        obj = obj.offsetParent;
    } while (obj && (obj.nodeName != 'BODY'));
    return {
        left:curleft,
        top:curtop
    };
};
// add widget to the lst based on the namespace
hmiMgr.addAction = function (id, actionObj) {
    this.actionMgr.actions[id] = actionObj;
};
// return an xform
hmiMgr.getAction = function (id) {
    return this.actionMgr.actions[id];
};
// add widget to the lst based on the namespace
hmiMgr.doAction = function (wgtId, strAction) {
    var delim = "js:";
    var isJS = (strAction.indexOf(delim) >= 0) ? true : false;
    if (isJS) strAction = strAction.split(delim)[1];
    var idx1 = strAction.indexOf("(");
    var idx2 = strAction.indexOf(")");
    var params = [];
    if (idx1 > 0) {
        var actionName = strAction.substring(0, idx1);
        var strParams = strAction.substring(idx1 + 1, idx2);
        params = strParams.split(",");
        if (actionName != null) {
            if (isJS) {
                var objAction = this.actionMgr.actions['JS'];
                if (objAction) {
                    this.actionMgr.execute(objAction, params, wgtId, actionName);
                }
            } else {
                var objAction = this.actionMgr.actions[actionName];
                if (objAction) {
                    this.actionMgr.execute(objAction, params, wgtId, actionName);
                }
            }
        }
    }
};
// add xform to the lst based on the namespace
hmiMgr.addXform = function (id, xformObj) {
    this.xforms[id] = xformObj;
};
// return an xform
hmiMgr.getXform = function (id) {
    return this.xforms[id];
};
// add special effect to the list
hmiMgr.addFx = function (id, fxOb) {
    this.fx[id] = fxOb;
};
// return an effect
hmiMgr.getFx = function (id) {
    return this.fx[id];
};
// create a data link
hmiMgr.createDataLink = function (tgtWgt, dataSrcWgt, tagProps) {
    var dataLink = new hmiDataLink();
    if (tagProps != null) {
        dataLink.dataSrc = dataSrcWgt;
        dataLink.dataSrcId = dataSrcWgt.wgtId;
        dataLink.tgtWgt = tgtWgt;
        if (tagProps.tag != undefined) dataLink.tag = tagProps.tag;
        if (tagProps.rw != undefined) dataLink.rw = tagProps.rw;
        if (tagProps.attr != undefined) dataLink.attr = tagProps.attr;
        if (tagProps.xforms != undefined) dataLink.addXform(tagProps.xforms);
    }
    return dataLink;
};
hmiMgr.addPagePrefixId = function (wgtId) {
    if (this.activePage) {
        wgtId = this.activePage + "_" + wgtId;
    }
    return wgtId;
};

hmiMgr.parseOptions = function (strOptions) {
	var value, name;
	var opts = { };
	strOptions = strOptions.replace(/['"<>!]/g,''); 
	strOptions = strOptions.replace(/--/g,''); 
    var optLst = strOptions.split(',');
    for (var i=0; i<optLst.length; i++) {
   		parts = optLst[i].split(':');
   		if (parts.length>=2) {
	   		name = parts[0].trim();
	   		value = parts[1].trim();
	   		num = parseFloat(value);
	   		if (isNaN(num))
	    		opts[name] = value;
	    	else
	    		opts[name] = num;
	    }
    }
    return opts;
};

hmiMgr.fn = hmiMgr.prototype = {
    constructor:hmiMgr,
    instantiate:function (selector) {
        if (selector != undefined) {
            // check if widget passed in as a selector
            if (selector.wgtId) {
                this.wgtId = selector.wgtId;
                this.hmiWgt = selector;
            } else {
                this.wgtId = $hmi.scrubId(selector);
                this.hmiWgt = $hmi.getWidget(this.wgtId);
            }
            this.hmiElem = null; // do not initialize yet (not sure if it is needed yet)	
        }
    },
    widget:function () {
        return this.hmiWgt;
    },
    // attaches a datalink to the widget
    hmiAttach:function (dataSrcId, tagOptions) {    	
        if (tagOptions != null) {
            var dataSrcWgt = $hmi.getWidget(dataSrcId);
            if (dataSrcWgt && this.hmiWgt) {
                var dataLink = $hmi.createDataLink(this.hmiWgt, dataSrcWgt, tagOptions);
                // connect the widget and the data source
                this.hmiWgt.addDataLink(dataLink);
                dataSrcWgt.addDataLink(dataLink);
            }
        }
    },
    trigger:function (type) {
        // forward to the wiget
        if (this.hmiWgt) this.hmiWgt.trigger(type);
    },
    bind:function (type) {
        // forward to the wiget
        if (this.hmiWgt) this.hmiWgt.bind(type);
    },
    getValue:function (tag) {
        if (this.hmiWgt) return this.hmiWgt.getValue(tag);
        else return null;
    },
    setValue:function (tag, newValue) {
        if (this.hmiWgt) this.hmiWgt.setValue(tag, newValue);
    },
    findPageElem:function (elem) {
        // check all parent nodes until we find a parent with hmi-page class
        var pageElem = null;
        if (elem.tag == "body") {
            pageElem = null;
        } else if (elem.className && elem.className.indexOf("hmi-page") !== -1) {
            pageElem = elem;
        } else {
            pageElem = this.findPageElem(elem.getParentNode());
        }
        return pageElem;
    }
};
hmiMgr.fn.instantiate.prototype = hmiMgr.fn;
// Expose $hmi as a global object
var $hmi = hmiMgr;
/**
 * hmiDataLink - creates a data link object
 */
function hmiDataLink() {
    this.tag = "";
    this.dataSrcId = "";
    this.dataSrc = null;
    this.rw = "r";
    this.tgtWgt = null;
    this.numXforms = 0;
    this.attr = "";
    this.sysCmd = "";
};
hmiDataLink.prototype.init = function (tagProps, wgt) {
    this.tgtWgt = wgt;
    if (tagProps != null) {
        if (tagProps.dataSrcId) {
            this.dataSrcId = tagProps.dataSrcId;
        }
        if (tagProps.tag) {
            this.tag = tagProps.tag;
        }
        if (tagProps.rw) {
            this.rw = tagProps.rw;
        }
        if (tagProps.attr) {
            this.attr = tagProps.attr;
        }
        if (tagProps.sysCmd) {
            this.sysCmd = tagProps.sysCmd;
        }
        if (tagProps.xforms) {
            this.addXform(tagProps.xforms);
        }
    }
};
hmiDataLink.prototype.getDataSrcValue = function () {
    var value;
    if (this.dataSrc == null) {
        this.dataSrc = $hmiWgts[this.dataSrcId];
    }
    if (this.dataSrc != null) {
        // do the xform
        value = this.dataSrc.getValue(this.tag);
        if (this.numXforms > 0) {
            value = this.doXform(value, "r");
        }
    }
    return value;
};
hmiDataLink.prototype.setWgtValue = function (newValue) {

    // don't set if widget is write only
    if (this.rw != "w") {
        var oldValue = this.tgtWgt.getValue(this.attr);
        var value = newValue;
        if (this.numXforms > 0) {
            value = this.doXform(value, "r");
        }

        if (typeof this.tgtWgt.onDataUpdate != 'undefined') {
            this.doOnDataUpdate(value, oldValue);
        }
        // pass it on to the widget if the current value is not equal to the new value
        if (typeof oldValue === 'undefined' || oldValue === null) {
            this.tgtWgt.setValue(this.attr, value)
        } else {
            if (oldValue.toString() !== value.toString()) {
                this.tgtWgt.setValue(this.attr, value)
            }
        }
    }
};

hmiDataLink.prototype.doOnDataUpdate = function (newValue, oldValue) {
    if ((this.tgtWgt != undefined) && (this.tgtWgt.onDataUpdate != undefined)) {
        //var curValue = this.tgtWgt!=null ? this.tgtWgt.getValue(this.attr) : 0;
        // pass in standard parameters to the JS function
        var eventInfo = {
            attribute: this.attr,
            oldValue: oldValue,
            newValue: newValue,
            index: 0
        };
        var actionFuncs = this.tgtWgt.onDataUpdate.split(';');
        for (var i = 0; i < actionFuncs.length; i++) {
            $hmi.doAction(this.tgtWgt.wgtId, actionFuncs[i], eventInfo); //Global access
        }
    }
};
hmiDataLink.prototype.setTagValue = function (newValue) {
    if (this.dataSrc == null) {
        this.dataSrc = $hmi(this.dataSrcId).widget();
    }
    if (this.dataSrc != null) {
        // do the xform
        var value = newValue;
        if (this.numXforms > 0) {
            value = this.doXform(value, "w");
        }
        // pass it on to the widget
        this.dataSrc.setValue(this.tag, value);
    }
};
hmiDataLink.prototype.addXform = function (xform) {
    if (this.numXforms == 0) {
        this.xform = [];
    }
    this.xform[this.numXforms] = xform;
    this.numXforms++;
};
hmiDataLink.prototype.doXform = function (value, readWrite) {
    var retValue = value;
    var strXform;
    for (i = 0; i < this.numXforms; i++) {
        strXform = this.xform[i];
        var idx1 = strXform.indexOf("(");
        var idx2 = strXform.indexOf(")");
        var params = [];
        if (idx1 > 0) {
            var xformName = strXform.substring(0, idx1);
            var strParams = strXform.substring(idx1 + 1, idx2);
            params = strParams.split(",");
            if (xformName != null) {
                var objXform = $hmi.getXform(xformName);
                if (objXform != undefined) {
                    retValue = objXform.execute(this, retValue, readWrite, params);
                }
            }
        }
    }
    return retValue;
};