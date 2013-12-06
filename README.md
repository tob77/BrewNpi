BrewNpi
=======

Raspberry Pi Home Brew Controller

This project uses a Raspberry Pi to monitor and control the process of brewing beer using a BIAB home brewery.  All of the monitoring and control logic is programmed using Python.  A WebPy webserver is used to serve the html5 brewing interface to any compatible web browser.  The Raspberry Pi's gpio is used to monitor and control the following equipment:

*16x2 LCD screen

*Control Panel Buttons

*Buzzer

*DS18B20 Temperature Sensor

*Propane Solenoid Valve

*Propane Regulator Servo Motor

*Electronic Spark Module

*Water Solenoid Valve for Counterflow Heat Exchanger

*Pump

A PID controller is used to control the mash temperature by adjusting the propane burner's output.  The burner output is controlled by using a servo motor to adjust the position of the propane regulator's valve.

References:

1) Python Code Structure - steve71's RasPiBrew python code was used extensively for the early development. https://github.com/steve71/RasPiBrew

2) Servo Motor Control - richardghirst's servo blaster software is used to operate the servo motor. https://github.com/richardghirst/PiBits/tree/master/ServoBlaster

3) 16x2 LCD - Adafruit's python LCD code is used to update the lcd using gpio. https://github.com/adafruit/Adafruit-Raspberry-Pi-Python-Code/tree/master/Adafruit_CharLCD

4) DS18B20 Temperature Sensor - Adafruit's python DS18B20 code is used to monitor the temperature sensor. http://learn.adafruit.com/adafruits-raspberry-pi-lesson-11-ds18b20-temperature-sensing/overview

5) HTML5 Widgets - The JMWidgets library was used extensively to develop the html interface. http://www.jmwidgets.com/

![Image](/images/Screenshot_1.png?raw=true)
![Image](/images/Screenshot_2.png?raw=true)
![Image](/images/Screenshot_3.png?raw=true)
![Image](/images/Screenshot_4.png?raw=true)
