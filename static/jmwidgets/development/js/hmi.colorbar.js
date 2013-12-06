/**
 * JMwidgets
 * Copyright (c) 2012, Exor International, SpA & BitMethods, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.jmwidgets.com
 */

function hmiColorBar(wgtId, options, parentPage) {
    /**
     *    The ID of Widget
     *    @type String
     */

    this.reverse = 1; // 1 = clockwise
    this.min = 0.0;
    this.max = 500.0;
    this.majorTicks = 10;
    this.minorTicks = 10;
    this.startAngle = 0.0;
    this.stopAngle = 90.0;
    this.cx = 0.0;
    this.cy = 0.0;
    this.range = 500.0;
    this.alarmColor = 'rgb(255,0,0)';
    this.alarmSize = 180;
    this.radius = 85;
    this.transform = new Array(6);
	hmiWidget.call(this, wgtId, options, parentPage);    
}

/**
 * Inheriting the base class Widget
 */
hmiColorBar.prototype = new hmiWidget();

/**
 * Initializing the widget with the provided properties
 * @param {Object} props The properties of the widget
 */
hmiColorBar.prototype.setOptions = function (props) {
    if (props != null) {
        if (props.needleWgt != undefined) {
            var needleWgt = $wgt[props.needleWgt]; //Global access
            this.reverse = needleWgt.reverse;
            this.min = needleWgt.min;
            this.max = needleWgt.max;
            this.startAngle = needleWgt.startAngle;
            this.stopAngle = needleWgt.stopAngle;
            this.cx = needleWgt.cx;
            this.cy = needleWgt.cy;
            this.transform = needleWgt.transform;
        }
        if (props.reverse != undefined) this.reverse = props.reverse;
        if (props.min != undefined) this.min = props.min;
        if (props.max != undefined) this.max = props.max;
        if (props.majorTicks != undefined) this.majorTicks = props.majorTicks;
        if (props.minorTicks != undefined) this.minorTicks = props.minorTicks;
        if (props.startAngle != undefined) this.startAngle = props.startAngle;
        if (props.stopAngle != undefined) this.stopAngle = props.stopAngle;
        if (props.startBar != undefined) this.startBar = props.startBar;
        if (props.endBar != undefined) this.endBar = props.endBar;
        if (props.cx != undefined) this.cx = props.cx;
        if (props.cy != undefined) this.cy = props.cy;
        if (props.alarmColor != undefined) this.alarmColor = props.alarmColor;
        if (props.alarmSize != undefined) this.alarmSize = props.alarmSize;
        if (props.radius != undefined) this.radius = props.radius;
        if (props.transform != undefined) {
            this.transform = props.transform;
        } else {
            if (props.needleWgt == undefined) {
                this.transform = [1, 0, 0, 1, 0, 0];
            }
        }
        this.range = (this.max - this.min);
        if (this.range <= 0) this.range = 1;
        this.render();
    }
};

/**
 * ColorBar widget's canvas rendering
 */
hmiColorBar.prototype.render = function () {
    var canvas = document.getElementById(this.wgtId + "-canvas");
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        ctx.save();
        // Put origin in the center of pivot and rotate 90 degrees clockwise
        var cos = Math.cos(Math.PI / 2);
        var sin = Math.sin(Math.PI / 2);
        ctx.setTransform(cos, sin, -sin, cos, this.cx, this.cy);
        // User custom transformation
        ctx.transform(this.transform[0], this.transform[1], this.transform[2], this.transform[3], this.transform[4], this.transform[5]);
        ctx.rotate(Math.PI / 2 + this.startAngle);
        ctx.beginPath();
        ctx.lineWidth = this.alarmSize;
        ctx.strokeStyle = this.alarmColor;
        if (this.reverse == 1) {
            ctx.arc(0, 0, this.radius, (this.stopAngle - this.startAngle) / (this.max - this.min) * (this.startBar - this.min), (this.stopAngle - this.startAngle) / (this.max - this.min) * (this.endBar - this.min), false);
        } else {
            ctx.arc(0, 0, this.radius, (this.stopAngle - this.startAngle) / (this.max - this.min) * (this.max - this.startBar), (this.stopAngle - this.startAngle) / (this.max - this.min) * (this.endBar - this.max), true);
        }
        ctx.stroke();
        ctx.restore();
    } else {
        // canvas-unsupported code here
    }
};

$hmi.fn.hmiColorBar = function(options, parentPage) {
	return new hmiColorBar(this.wgtId, options, parentPage);
};