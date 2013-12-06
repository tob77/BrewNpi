
from multiprocessing import Process, Pipe, Queue, current_process, Manager
from subprocess import Popen, PIPE, call
from collections import deque
from datetime import datetime
import web, time, random, json, serial, os, math, glob, copy, atexit, numpy, RPi.GPIO as GPIO
from brewTimer import brewTimer
from pid import pid, sim
from lcd import charLcd
from movingAverage import movingAverage

#GPIO Assignment
# 0(SDA)---Start Button	
# 1(SCL)---Reset Button
# 4--------DS18B20 Temperature Sensor		
# 7--------Next Step Button
# 8--------Alt Switch
# 9(MISO)--LCD Registr Select
#10(MOSI)--LCD Clock (Enable)
#11(SCKL)--LCD Data Bit 0
#14(TXD)---LCD Data Bit 1
#15(RXD)---LCD Data Bit 2
#17--------LCD Data Bit 3
#18(PWM)---Servoblaster
#21(PWM)---Buzzer
#22--------Spark module
#23--------Gas Solenoid Valve
#24--------Water Solenoid Valve
#25--------Pump
class gpioPins:
    startButton = 0
    resetButton = 1
    nextButton = 7
    altSwitch = 8
    buzzer = 21
    sparkModule = 22
    gasValve = 23
    waterValve = 24
    pump = 25

class param:
    dataLoggingStatus = "Off"
    pumpStatus = 0
    waterValveStatus = "Closed"
    burnerStatus = "Off"
    temperature = 0.0
    brewMessage = "Ready"
    trendData = ""
    timerString = 0
    pidMode = "Auto"
    pidPv = 100.0
    pidCv = 18.9
    pidSp = 100.0
    pidKpSp = 14.0
    pidKiSp = 27.5
    pidKdSp = 0.0
    strikeTempSp = 160.0
    acidMashTempSp = 0.0
    acidMashTimeSp = 0
    proteinMashTempSp = 0.0
    proteinMashTimeSp = 0
    sacchMashTempSp = 153.0
    sacchMashTimeSp = 60
    sacch2MashTempSp = 0.0
    sacch2MashTimeSp = 0
    mashOutTempSp = 168.0
    mashOutTimeSp = 10.0
    hotBreakTempSp = 206.0
    hotBreakTimeSp = 5.0
    hotBreakCvSp = 20.0
    boilTimeSp = 60
    boilCvSp = 40.0
    hopStandTempSp = 160.0
    hopStandTimeSp = 30
    counterFlowTempSp = 90
    trendDurationSp = 15
    cvMinSp = 10.0
    cvMaxSp = 80.0
    pidDbSp = 0.0
    shutOffTempSp = 0.5    
    cmdStart = False
    cmdStepIncrement = False
    cmdPidManual = False
    cmdPidAuto = False
    cmdReset = False
    cmdStartDataLog = False
    cmdStopDataLog = False
    cmdStartPump = False
    cmdStopPump = False
    cmdOpenWaterValve = False
    cmdCloseWaterValve = False
    cmdStartBurner = False
    cmdStopBurner = False
    
#Global Variables 
cmdStartButton = False
cmdResetButton = False
cmdNextButton = False
cmdResetLcd = False
buttonTimeStamp = time.time()

def startButton(channel):
    #Debounce the input to make sure that there are no false button presses
    global cmdStartButton
    global buttonTimeStamp  
    #Do not allow duplicate button presses within .2 sec of each other
    if (time.time() - buttonTimeStamp) >= 0.2:
        buttonTimeStamp = time.time()
        count = 0
        #Make sure that the button is maintained for 5 samples inorder to filter out signal noise
        while (time.time() - buttonTimeStamp) <= 0.3 and count < 5:
            if GPIO.input(channel) == GPIO.LOW:
                count += 1
            time.sleep(0.01)   
        if count == 5:
            cmdStartButton = True
            print "Start Button Pressed"

def resetButton(channel):
    #Debounce the input to make sure that there are no false button presses
    global cmdResetButton
    global buttonTimeStamp  
    #Do not allow duplicate button presses within .2 sec of each other
    if (time.time() - buttonTimeStamp) >= 0.2:
        buttonTimeStamp = time.time()
        count = 0
        #Make sure that the button is maintained for 5 samples inorder to filter out signal nois
        while (time.time() - buttonTimeStamp) <= 0.3 and count < 5:
            if GPIO.input(channel) == GPIO.LOW:
                count += 1
            time.sleep(0.01)   
        if count == 5:
            cmdResetButton = True
            print "Reset Button Pressed"

def nextButton(channel):
    #Debounce the input to make sure that there are no false button presses
    global cmdNextButton
    global buttonTimeStamp 
    #Do not allow duplicate button presses within .2 sec of each other 
    if (time.time() - buttonTimeStamp) >= 0.2:
        buttonTimeStamp = time.time()
        count = 0
        #Make sure that the button is maintained for 5 samples inorder to filter out signal nois
        while (time.time() - buttonTimeStamp) <= 0.3 and count < 5:
            if GPIO.input(channel) == GPIO.LOW:
                count += 1
            time.sleep(0.01)   
        if count == 5:
            cmdNextButton = True
            print "Next Button Pressed"

def cleanUp():
    # clean up GPIO on exit 
    print "Brew N Pi is now shutting down."
    GPIO.cleanup()

def add_global_hook(parent_conn, statusQ):
    
    g = web.storage({"parent_conn" : parent_conn, "statusQ" : statusQ})
    def _wrapper(handler):
        web.ctx.globals = g
        return handler()
    return _wrapper
      
class burner:
    def __init__(self):
        global cmdResetLcd
        #Configure the gas solenoid valve and spark module GPIO pins for output
        GPIO.setup(gpioPins.sparkModule, GPIO.OUT, initial=GPIO.HIGH)
        GPIO.setup(gpioPins.gasValve, GPIO.OUT, initial=GPIO.HIGH)
        self.burnerStatus = 'Off'

    def ignite(self):
        print "Fire Spark Module"
        GPIO.output(gpioPins.sparkModule, GPIO.LOW)
        time.sleep(3)
        print "Stop Spark Module"
        GPIO.output(gpioPins.sparkModule, GPIO.HIGH)
        time.sleep(3)
        #Send a command to reset the LCD after turning off the spark module in case some EMI screwed up the LCD
        cmdResetLcd = True
        
    def start(self):      
        print "Start Burner"
        #open the gas solenoid valve
        GPIO.output(gpioPins.gasValve, GPIO.LOW)
        #Start and Stop the Spark Module.  Use a sepperate process to prevent interuptions
        Spark = Process(name = "Spark", target=self.ignite)
        Spark.start() 
        self.burnerStatus = 'On'
        
    def stop(self):
        print "Stop Burner"
        #Close the gas solenoid valve
        GPIO.output(gpioPins.gasValve, GPIO.HIGH)
        self.burnerStatus = 'Off'
        
    def getStatus(self):
        return self.burnerStatus
        
class waterValve:
    def __init__(self):
        #Configure the water solenoid valve GPIO pin for output
        GPIO.setup(gpioPins.waterValve, GPIO.OUT, initial=GPIO.HIGH)
        self.openStatus = 'Closed'
        
    def open(self):      
        print "Open Water Valve"
        #open the water solenoid valve
        GPIO.output(gpioPins.waterValve, GPIO.LOW)
        self.openStatus = 'Open'
        
    def close(self):
        print "Close Water Valve"
        #Close the water solenoid valve
        GPIO.output(gpioPins.waterValve, GPIO.HIGH)
        self.openStatus = 'Closed'
        
    def getStatus(self):
        return self.openStatus
        
class buzzer:
    def __init__(self):
        #Configure the buzzer GPIO pin for output
        GPIO.setup(gpioPins.buzzer, GPIO.OUT, initial=GPIO.HIGH)
        
    def buzz(self):
        print "Start Buzzer"
        GPIO.output(gpioPins.buzzer, GPIO.LOW)
        time.sleep(2)
        print "Stop Buzzer"
        GPIO.output(gpioPins.buzzer, GPIO.HIGH)
        
    def start(self):      
        #Start and Stop the Buzzer.  Use a sepperate process to prevent interuptions
        buzz = Process(name = "buzz", target=self.buzz)
        buzz.start() 
        
class pump:
    def __init__(self):
        #Configure the pump GPIO pin for output
        GPIO.setup(gpioPins.pump, GPIO.OUT, initial=GPIO.HIGH)
        self.runningStatus = 'Off'
        
    def start(self):      
        print "Start Pump"
        #Start the Pump
        GPIO.output(gpioPins.pump, GPIO.LOW)
        self.runningStatus = 'Running'
        
    def stop(self):
        print "Stop Pump"
        #Stop the pump
        GPIO.output(gpioPins.pump, GPIO.HIGH)
        self.runningStatus = 'Off'
        
    def getStatus(self):
        return self.runningStatus
        
class servo:
    def __init__(self):
            self.lastPwm = 0.0
            self.servoTimer = brewTimer(0.05)
            self.lastPwmString = "0=0"
            self.servoArray = [81.6, 82.5, 83.4, 84.3, 85.2, 86.1, 87, 87.9, 88.8, 89.7, 90.6, 91.5, 92.4, 93.3, 94.2, 95.1, 96, 96.9, 97.8, 98.7, 99.6, 100.5, 101.4, 102.3, 103.2, 104.1, 105, 105.9, 106.8, 107.7, 108.6, 109.5, 110.4, 111.3, 112.2, 113.1, 114, 114.9, 115.8, 116.7, 117.6, 118.5, 119.4, 120.3, 121.2, 122.1, 123, 123.9, 124.8, 125.7, 126.6, 127.5, 128.4, 129.3, 130.2, 131.1, 132, 132.9, 133.8, 134.7, 135.6, 136.5, 137.4, 138.3, 139.2, 140.1, 141, 141.9, 142.8, 143.7, 144.6, 145.5, 146.4, 147.3, 148.2, 149.1, 150, 150.9, 151.8, 152.7, 153.6, 154.5, 155.4, 156.3, 157.2, 158.1, 159, 159.9, 160.8, 161.7, 162.6, 163.5, 164.4, 165.3, 166.2, 167.1, 168, 168.9, 169.8, 170.7, 171.6, 172.5, 173.4, 174.3, 175.2, 176.1, 177, 177.9, 178.8, 179.7, 180.6, 181.5, 182.4, 183.3, 184.2, 185.1, 186, 186.9, 187.8, 188.7, 189.6, 190.5, 191.4, 192.3, 193.2, 194.1, 195, 195.9, 196.8, 197.7, 198.6, 199.5, 200.4, 201.3, 202.2, 203.1, 204, 204.9, 205.8, 206.7, 207.6, 208.5, 209.4, 210.3, 211.2, 212.1, 213, 213.9, 214.8, 215.7, 216.6, 217.5, 218.4, 219.3, 220.2, 221.1, 222, 222.9, 223.8, 224.7, 225.6, 226.5, 227.4, 228.3, 229.2, 230.1, 231, 231.9, 232.8, 233.7, 234.6, 235.5, 236.4, 237.3, 238.2, 239.1, 240]
            self.pidOutputArray = [0, 1.3036970989, 3.2092900545, 5.0688080436, 6.8834821031, 8.6545195541, 10.3831042193, 12.0703966407, 13.717534298, 15.3256318259, 16.8957812321, 18.429052115, 19.9264918818, 21.3891259662, 22.8179580461, 24.2139702613, 25.578123432, 26.9113572758, 28.2145906259, 29.488721649, 30.734628063, 31.9531673548, 33.1451769983, 34.3114746719, 35.4528584767, 36.5701071539, 37.6639803031, 38.7352185998, 39.7845440133, 40.8126600245, 41.8202518437, 42.8079866286, 43.776513702, 44.7264647694, 45.6584541375, 46.573078931, 47.4709193113, 48.3525386941, 49.218483967, 50.0692857074, 50.9054584004, 51.7275006567, 52.5358954304, 53.3311102365, 54.113597369, 54.8837941191, 55.642122992, 56.3889919258, 57.1247945088, 57.8499101971, 58.5647045332, 59.2695293627, 59.9647230534, 60.6506107121, 61.3275044028, 61.9957033648, 62.6554942298, 63.3071512406, 63.9509364683, 64.5871000304, 65.2158803083, 65.8375041657, 66.4521871659, 67.0601337898, 67.6615376538, 68.2565817275, 68.8454385515, 69.4282704556, 70.005229776, 70.5764590735, 71.1420913515, 71.7022502733, 72.2570503803, 72.8065973099, 73.3509880131, 73.8903109721, 74.4246464187, 74.9540665519, 75.4786357553, 75.9984108156, 76.51344114, 77.023768974, 77.5294296196, 78.0304516526, 78.5268571407, 79.0186618617, 79.5058755204, 79.9885019673, 80.466539416, 80.939980661, 81.4088132959, 81.8730199306, 82.3325784097, 82.78746203, 83.2376397586, 83.6830764503, 84.1237330657, 84.5595668892, 84.9905317463, 85.4165782221, 85.8376538783, 86.2537034719, 86.6646691725, 87.07049078, 87.4711059428, 87.8664503756, 88.2564580769, 88.6410615471, 89.0201920063, 89.3937796119, 89.7617536766, 90.1240428865, 90.4805755183, 90.8312796576, 91.1760834165, 91.5149151516, 91.8477036816, 92.1743785055, 92.4948700197, 92.8091097369, 93.1170305028, 93.4185667146, 93.7136545388, 94.0022321288, 94.2842398427, 94.5596204613, 94.828319406, 95.0902849562, 95.3454684676, 95.5938245898, 95.835311484, 96.0698910412, 96.2975290996, 96.5181956627, 96.7318651169, 96.9385164497, 97.1381334671, 97.3307050117, 97.5162251804, 97.6946935421, 97.866115356, 98.0305017888, 98.1878701329, 98.3382440242, 98.4816536598, 98.618136016, 98.7477350659, 98.8705019973, 98.9864954308, 99.095781637, 99.1984347549, 99.2945370098, 99.3841789303, 99.467459567, 99.5444867101, 99.6153771068, 99.6802566796, 99.7392607441, 99.7925342265, 99.8402318816, 99.8825185108, 99.9195691795, 99.9515694355, 99.9787155262, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
            
    def cmdPosition(self, value):
        #convert from percentage to pwm value.  pwm is in units of 10 microseconds
        #pwm = value * (180.0 / 100.0) + 60.0
        
        #Interpolate the servo and PID CV arrays to determine the proper pwm value for the servo
        pwm = numpy.interp(value, self.pidOutputArray, self.servoArray)
        
        #Round the servo pwm value to the nearest integer.
        pwmInt = int(pwm + .5)
        #print 'servo = {0}'.format(pwmInt)
        
        if pwmInt <> self.lastPwm:
            #Start a 3 second tiemr whenever a new value is written to the servo
            self.servoTimer = brewTimer(0.05)
        self.lastPwm = pwmInt        
        
        if self.servoTimer.isDone():
            #Deactivate the servo if the command hasn't changed for more than 3 seconds
            pwmString = "0=0"
        else:
            pwmString = '0={0}'.format(pwmInt)
        
        if pwmString <> self.lastPwmString:
            try:
                f = open("/dev/servoblaster","w")
                f.write(pwmString + "\n")
                f.flush()
                f.close()
                print("Writing to servoblaster: " + pwmString)
            except:
                print("Error writing to servoblaster: " + pwmString)
        self.lastPwmString = pwmString
            
    def cmdStop(self):
        pwmString = "0=0"
        try:
            f = open("/dev/servoblaster","w")
            f.write(pwmString + "\n")
            f.flush()
            f.close()    
        except:
            print("Error writing to servoblaster: " + pwmString)

class ds18b20:
    def __init__(self):
        os.system('modprobe w1-gpio')
        os.system('modprobe w1-therm')
        self.tempLast = 0.0
        ##--- create a dictionary via Manager
        manager = Manager()
        self.probe = manager.dict()
        self.probe["temperature"] = 0.0
        #use a moving average to average the last 14 tmperature readings.
        self.mAvg = movingAverage(14)
        
        ##---  start process and send dictionary
        p = Process(target=self.readLoop, args=(self.probe, ))
        p.start()
 
    def readRaw(self, device_file):
        f = open(device_file, 'r')
        lines = f.readlines()
        f.close()
        return lines
 
    def readLoop(self, probe):
        base_dir = '/sys/bus/w1/devices/'
        device_folder = glob.glob(base_dir + '28*')[0]
        device_file = device_folder + '/w1_slave'
        
        while (True):
            lines = self.readRaw(device_file)
            #print lines
            while lines[0].strip()[-3:] != 'YES':
                time.sleep(0.2)
                lines = self.readRaw(device_file)
            equals_pos = lines[1].find('t=')
            if equals_pos != -1:
                temp_string = lines[1][equals_pos+2:]
                temp_c = float(temp_string) / 1000.0
                temp_f = temp_c * 9.0 / 5.0 + 32.0
                #The DS18B20 will return 185 deg if it is reset.  Therefore, filter out the 185 if it is not real
                if temp_f == 185.0 and math.fabs(self.tempLast - 185.0) > 2.0:
                    probe["temperature"] = self.mAvg(self.tempLast)
                else:
                    probe["temperature"] = self.mAvg(temp_f)
                    self.tempLast = temp_f
            time.sleep(.75)
    
    def read(self):
        #The DS18B20 will return 185 deg if it is reset.  Therefore, filter out the 185 if it is not real
        if self.probe["temperature"] == 185.0 and math.fabs(self.tempLast - 185.0) > 2.0:
            return self.tempLast
        self.tempLast = self.probe["temperature"]
        return self.probe["temperature"]
    
    
class dataLogging:
    def __init__(self):
        self.logFileStatus = "Off"
        self.currentTimeLast = 0.0
        self.sysTimeLast = 0.0
        self.tempLast = 0.0
        self.trendTempLast = 0.0
        self.spLast = 0.0
        self.trendSpLast = 0.0
        self.cvLast = 0.0
        self.trendCvLast = 0.0
        self.brewStepLast = " "
        self.timerStringLast = " "
        self.logWriteFlag = False
        self.trendWriteFlag = False
        self.startTime = time.time()
        self.fileName = "loggFileName"
        self.dataQueue = deque(maxlen=5000)
    
    def cmdStartLogFile(self):
        if self.logFileStatus != "On":
            self.logFileStatus = "On"
            self.startTime = time.time()
            localTime = time.localtime()
            self.fileName = '/home/pi/Python/DataLogs/{0:04d}-{1:02d}-{2:02d} {3:02d}_{4:02d}_{5:02d} BrewNpi Data Log.csv'.format(localTime.tm_year, localTime.tm_mon, localTime.tm_mday, localTime.tm_hour, localTime.tm_min, localTime.tm_sec)
            self.writeData("Time", "Brew Step", "Brew Timer", "Temperature", "PID SP", "PID CV")
        
    def cmdStopLogFile(self):
        self.logFileStatus = "Off"
        
    def getLogFileStatus(self):
        return self.logFileStatus
        
    def writeData(self, time, brewStep, timerString, temperature, sp, cv):
        #write Data to log file
        logString = '{0},{1},{2},{3},{4},{5}'.format(time, brewStep, timerString, temperature, sp, cv)
        f = open(self.fileName, 'a')
        f.write(logString + "\n")
        f.flush()
        f.close()
        
    def getTrendJson(self, trendDurationSp):
        timeList = []
        tempList = []
        spList = []
        cvList = []
        
        #Multiply the python time in seconds by 1000 to get millisecons for javascript
        currentTime = time.time() * 1000
        
        #iterate  through all of the data
        index = 0
        for dataSet in self.dataQueue:
            #calculate how many dada sets are within the time duration
            if (currentTime - dataSet[0]) <= (trendDurationSp * 60000.0):            
                index += 1
        
        #set the index to the most resent data if there is not any data within the duration setpoint
        if index == 0:
            index = len(self.dataQueue) - 1
        #Do not allow the index to be greater than or equal to the dataQueue size
        elif index >= len(self.dataQueue):
            index = 0
        else:
            #subtract the number of data sets that are within the time duration from the total number of data sets 
            index = len(self.dataQueue) - index

        #The first and last datasets will be added to the json string so the duration will exactly equal the duration setpoint
        #Add the oldest dataset to the begining of the list that corresponds to the current time minus the duration setpoint        
        timeList.append(currentTime - (trendDurationSp * 60000.0))
        tempList.append(copy.copy(self.dataQueue[index][1]))
        spList.append(copy.copy(self.dataQueue[index][2]))
        cvList.append(copy.copy(self.dataQueue[index][3]))

        #iterate  through all of the data
        index = 0
        for dataSet in self.dataQueue:
            #Create seperate lists for each type of data
            if (currentTime - dataSet[0]) <= (trendDurationSp * 60000.0):
                timeList.append(copy.copy(dataSet[0]))
                tempList.append(copy.copy(dataSet[1]))
                spList.append(copy.copy(dataSet[2]))
                cvList.append(copy.copy(dataSet[3]))              
                index += 1
        
        #Add the latest data set to the end of the lists 
        index = len(self.dataQueue) - 1
        timeList.append(copy.copy(currentTime))
        tempList.append(copy.copy(self.dataQueue[index][1]))
        spList.append(copy.copy(self.dataQueue[index][2]))
        cvList.append(copy.copy(self.dataQueue[index][3]))
        
        #create the json string
        jsonString = """[{"label": "Temperature = xxx.xx @hh:mm:ss xM", "data": ["""
        for index in range(len(timeList)):
            if index != 0:
                jsonString += ", "
            jsonString += '[{0:.0f},{1}]'.format(timeList[index], tempList[index])
        
        jsonString += """]}, {"label": "Setpoint = xxx.xx", "data": ["""
        for index in range(len(timeList)):
            if index != 0:
                jsonString += ", "
            jsonString += '[{0:.0f},{1}]'.format(timeList[index], spList[index])
            
        jsonString += """]}, {"label": "CV = xxx.xx", "data": ["""
        for index in range(len(timeList)):
            if index != 0:
                jsonString += ", "
            jsonString += '[{0:.0f},{1}]'.format(timeList[index], cvList[index])
            
        jsonString += '], "yaxis": 2}]'
              
        return jsonString
     
        
    def logData(self, brewStep, timerString, temperature, sp, cv):
        currentTime = time.time() - self.startTime
        sysTime = time.time()
        #Log data for the lof file
        #Log the Current and last data sets if any of the data has changed
        if temperature != self.tempLast or sp != self.spLast or abs(cv - self.cvLast) >= 0.1:
            #Only write the last data if the same data was not written the last time the function was called
            if self.logWriteFlag:
                if self.logFileStatus == "On":
                    self.writeData(self.currentTimeLast, self.brewStepLast, self.timerStringLast, self.tempLast, self.spLast, self.cvLast)
                
            if self.logFileStatus == "On":    
                self.writeData(currentTime, brewStep, timerString, temperature, sp, cv)
           
            #set a write flag to eliminate double entries when the data is changing every time the log function is called
            self.logWriteFlag = False
        else:
            self.logWriteFlag = True
            
        self.currentTimeLast = copy.copy(currentTime)
        self.brewStepLast = copy.copy(brewStep)
        self.timerStringLast = copy.copy(timerString)
        self.tempLast = copy.copy(temperature)
        self.spLast = copy.copy(sp)
        self.cvLast = copy.copy(cv)
        
        #Log data for trending    
        #Log the Current and last data sets if any of the data has changed
        if (temperature != self.trendTempLast or sp != self.trendSpLast or abs(cv - self.trendCvLast) >= 0.1) and (sysTime - self.sysTimeLast) >= 1.0:
            #Only write the last data if the same data was not written the last time the function was called
            if self.trendWriteFlag:
                self.dataQueue.append([copy.copy(self.sysTimeLast * 1000), copy.copy(self.trendTempLast), copy.copy(self.trendSpLast), copy.copy(self.trendCvLast)])
              
            self.dataQueue.append([copy.copy(sysTime * 1000), copy.copy(temperature), copy.copy(sp), copy.copy(cv)])
            
            #set a write flag to eliminate double entries when the data is changing every time the log function is called
            self.trendWriteFlag = False
        else:
            self.trendWriteFlag = True
        
        if (sysTime - self.sysTimeLast) >= 1.0:    
            self.sysTimeLast = copy.copy(sysTime)
            self.trendTempLast = copy.copy(temperature)
            self.trendSpLast = copy.copy(sp)
            self.trendCvLast = copy.copy(cv)

class brewNpi: 
        
    def GET(self):
       
        return render.brewNpi()  
    
class brewControl: 
        
    def GET(self):
       
        return render.brewControl()

class brewTrend: 
        
    def GET(self):
       
        return render.brewTrend()
    
class brewSetup: 
        
    def GET(self):
       
        return render.brewSetup()

def ProcessControl(dataLoggingStatus, pumpStatus, waterValveStatus, burnerStatus, temperature, brewMessage, trendData, timerString, pidMode, pidPv, pidCv, pidSp, pidKpSp, \
                   pidKiSp, pidKdSp, strikeTempSp, acidMashTempSp, acidMashTimeSp, proteinMashTempSp, proteinMashTimeSp, sacchMashTempSp, sacchMashTimeSp, \
                   sacch2MashTempSp, sacch2MashTimeSp, mashOutTempSp, mashOutTimeSp, hotBreakTempSp, hotBreakTimeSp, hotBreakCvSp, boilTimeSp, boilCvSp, \
                   hopStandTempSp, hopStandTimeSp, counterFlowTempSp, trendDurationSp, cvMinSp, cvMaxSp, pidDbSp, shutOffTempSp, cmdStart, cmdStepIncrement, cmdPidManual, cmdPidAuto, cmdReset, cmdStartDataLog, \
                   cmdStopDataLog, cmdStartPump, cmdStopPump, cmdOpenWaterValve, cmdCloseWaterValve, cmdStartBurner, cmdStopBurner, statusQ, conn):
            
        p = current_process() 
        #Set the GPIO to use the BCM pin numbers
        GPIO.setmode(GPIO.BCM)
        
        #register the cleanUp routine to be executed on exit
        atexit.register(cleanUp)
        
        incDec = 1   
        brewStep = "Ready"
        brewStepLast = " " 
        timerString = "00:00:00"
        lcdMessage = "Brew N Pi"
        lcdLabel = "Temp.        SP "
        lcdTimerLable = "Temp.      Timer"
        lcdTempLable = "Temp.        SP "
        lcdData = " "
        lcdString = " "
        lcdStringLast = " "
        burner1 = burner()
        pump1 = pump()
        waterValve1 = waterValve()
        buzzer1 = buzzer()
        temperature1 = ds18b20()
        pvMin = 32.0
        pvMax = 212.0
        ignitionCv = 40.0
        tempLast = 0.0
        degree = chr(223)
        burnerShutOff = False
        burnerTurnDown = False
        global cmdStartButton
        global cmdResetButton
        global cmdNextButton
        global cmdResetLcd
        
        pidController = pid(pvMin, pvMax)
        pvSim = sim()
        
        dataLogger = dataLogging()
        
        servoController = servo()
        
        lcd = charLcd()
        #lcd.writeMsg("Brew N Pi" + "\n" + "Testing")
        
        #Configure the button and switch gpio pins for pull up inputs
        GPIO.setup(gpioPins.startButton, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(gpioPins.nextButton, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(gpioPins.resetButton, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(gpioPins.altSwitch, GPIO.IN, pull_up_down=GPIO.PUD_UP)                  
        
        #add detections events to the buttons and the switch           
        GPIO.add_event_detect(gpioPins.startButton, GPIO.FALLING, callback=startButton, bouncetime=500)
        GPIO.add_event_detect(gpioPins.nextButton, GPIO.FALLING, callback=nextButton, bouncetime=500)
        GPIO.add_event_detect(gpioPins.resetButton, GPIO.FALLING, callback=resetButton, bouncetime=500)
          
        while (True):
            while conn.poll(): #POST settings
                dataLoggingStatus, pumpStatus, waterValveStatus, burnerStatus, temperature, brewMessage, trendData, timerString, pidMode, pidPv, pidCv, pidSp, pidKpSp, \
                pidKiSp, pidKdSp, strikeTempSp, acidMashTempSp, acidMashTimeSp, proteinMashTempSp, proteinMashTimeSp, sacchMashTempSp, sacchMashTimeSp, \
                sacch2MashTempSp, sacch2MashTimeSp, mashOutTempSp, mashOutTimeSp, hotBreakTempSp, hotBreakTimeSp, hotBreakCvSp, boilTimeSp, boilCvSp, \
                hopStandTempSp, hopStandTimeSp, counterFlowTempSp, trendDurationSp, cvMinSp, cvMaxSp, pidDbSp, shutOffTempSp, cmdStart, cmdStepIncrement, cmdPidManual, cmdPidAuto, cmdReset, cmdStartDataLog, \
                cmdStopDataLog, cmdStartPump, cmdStopPump, cmdOpenWaterValve, cmdCloseWaterValve, cmdStartBurner, cmdStopBurner = conn.recv()           

            temperature = temperature1.read()
            pidPv = temperature
            
            #if tempLast != temperature:
            #    lcd.writeMsg('Temperature \n{0:.1f}{1}F\n'.format(temperature,degree))
            #tempLast = copy.copy(temperature)

            #Update the PID calc and set the cv in auto mode. Only update the calc in manual mode
            if pidController.getMode() == "Auto" or pidController.getMode() == "Initialize":
                pidCv = pidController.doCalc(pidPv, pidSp, pidKpSp, pidKiSp, pidKdSp, cvMinSp, cvMaxSp, pidDbSp)
            else:
                pidController.doCalc(pidPv, pidSp, pidKpSp, pidKiSp, pidKdSp, cvMinSp, cvMaxSp, pidDbSp) 
            
            #turn on the data logger
            if cmdStartDataLog:
                dataLogger.cmdStartLogFile()
                cmdStartDataLog = False
            #turn off the data logger
            if cmdStopDataLog:
                dataLogger.cmdStopLogFile()
                cmdStopDataLog = False
            
            dataLoggingStatus = dataLogger.getLogFileStatus()    
             
            #Log data for trending and to csv file
            dataLogger.logData(brewStep, timerString, temperature, pidSp, pidCv)
            
            #Get the JSON string for trending
            trendData = dataLogger.getTrendJson(trendDurationSp)
                        
            #Write the pidCv to the servo   
            servoController.cmdPosition(pidCv)
            
            if cmdPidManual:
                pidController.cmdManual(pidCv)
                cmdPidManual = False
                
            if cmdPidAuto:
                pidController.cmdAuto()
                cmdPidAuto = False
            
            pidMode = pidController.getMode()
            
            #Send updated CV values to the PID controller while in Manual mode
            if pidMode == "Manual":
                pidController.cmdManual(pidCv)
            
            #Handle web start and stop commands    
            if cmdStartPump:
                pump1.start()
                cmdStartPump = False
            
            if cmdStopPump:
                pump1.stop()
                cmdStopPump = False
                
            if cmdStartBurner:
                pidController.cmdInitialize(ignitionCv, pidCv)
                burner1.start()
                cmdStartBurner = False
                
            if cmdStopBurner:
                burner1.stop()
                cmdStopBurner = False
                
            if cmdOpenWaterValve:
                waterValve1.open()
                cmdOpenWaterValve = False
                
            if cmdCloseWaterValve:
                waterValve1.close()
                cmdCloseWaterValve = False
            
            #Temperature Simulation.  Uncomment to simulate a temp response from the PID CV
            #pidPv = pvSim.getTemp(pidCv)
            #temperature = pidPv
            
            #Handle the physical button press events
            if cmdStartButton:
                cmdStart = True
                cmdStartButton = False
            if cmdResetButton:
                cmdReset = True
                cmdResetButton = False
            if cmdNextButton:
                cmdStepIncrement = True
                cmdNextButton = False    
                
            #Reinitialize the LCD if the start or reset commands are presed multiple times, or after the spark module is fired    
            if (cmdStart and brewStep != "Ready") or (cmdReset and brewStep == "Ready") or cmdResetLcd: 
                lcd = charLcd()
                lcd.writeMsg(lcdString)
                cmdStart = False
                cmdResetLcd = False
            
            if brewStep == "Ready":
                cmdStepIncrement = False
                if cmdStart:
                    pidSp = strikeTempSp
                    #pidCv = copy.copy(ignitionCv)
                    pidController.cmdInitialize(ignitionCv, cvMaxSp)
                    pump1.start()
                    burner1.start()
                    cmdStart = False
                    brewStep = "Heat for Strike"
            
            if brewStep == "Heat for Strike":
                #Turn down the burner to minimum when the temperature is within .7 deg of the setpoint.
                if temperature >= (strikeTempSp - 0.7) and burnerTurnDown == False:
                    pidController.cmdAuto()
                    pidController.cmdInitialize(cvMinSp, cvMinSp)
                    burnerTurnDown = True
                if temperature >= strikeTempSp or cmdStepIncrement:
                    burner1.stop()
                    cmdStepIncrement = False
                    buzzer1.start()
                    burnerTurnDown = False
                    brewStep = "Dough In"
                    
            if brewStep == "Dough In":
                if cmdStepIncrement:
                    pidSp = acidMashTempSp
                    acidMashTimer = brewTimer(acidMashTimeSp)
                    #pidCv = copy.copy(ignitionCv)
                    pidController.cmdInitialize(ignitionCv, cvMinSp)
                    burner1.start()
                    cmdStepIncrement = False
                    brewStep = "Acid Rest Mash"
            
            if brewStep == "Acid Rest Mash":
                if cmdStepIncrement:
                    acidMashTimer.cmdIncrement()
                    cmdStepIncrement = False
                timerString = acidMashTimer.getTimerString()
                if acidMashTimer.isDone():
                    pidSp = proteinMashTempSp
                    brewStep = "Heat for Protein Rest"
                    
            if brewStep == "Heat for Protein Rest":
                if temperature >= proteinMashTempSp or cmdStepIncrement:
                     proteinMashTimer = brewTimer(proteinMashTimeSp)
                     cmdStepIncrement = False
                     brewStep = "Protein Rest Mash"
                     
            if brewStep == "Protein Rest Mash":
                if cmdStepIncrement:
                    proteinMashTimer.cmdIncrement()
                    cmdStepIncrement = False
                timerString = proteinMashTimer.getTimerString()
                if proteinMashTimer.isDone():
                    pidSp = sacchMashTempSp
                    brewStep = "Heat for Sacch Rest"
                    
            if brewStep == "Heat for Sacch Rest":
                if temperature >= sacchMashTempSp or cmdStepIncrement:
                     sacchMashTimer = brewTimer(sacchMashTimeSp)
                     cmdStepIncrement = False
                     brewStep = "Sacch Rest Mash"
                     
            if brewStep == "Sacch Rest Mash":
                if cmdStepIncrement:
                    sacchMashTimer.cmdIncrement()
                    cmdStepIncrement = False
                timerString = sacchMashTimer.getTimerString()
                if sacchMashTimer.isDone():
                    pidSp = sacch2MashTempSp
                    brewStep = "Heat for Sacch Rest 2"
                    
            if brewStep == "Heat for Sacch Rest 2":
                if temperature >= sacch2MashTempSp or cmdStepIncrement:
                     sacch2MashTimer = brewTimer(sacch2MashTimeSp)
                     cmdStepIncrement = False
                     brewStep = "Sacch Rest 2 Mash"
                     
            if brewStep == "Sacch Rest 2 Mash":
                if cmdStepIncrement:
                    sacch2MashTimer.cmdIncrement()
                    cmdStepIncrement = False
                timerString = sacch2MashTimer.getTimerString()
                if sacch2MashTimer.isDone():
                    pidSp = mashOutTempSp
                    brewStep = "Heat for Mash Out"
                    
            if brewStep == "Heat for Mash Out":
                #Turn down the burner to minimum when the temperature is within .7 deg of the setpoint.
                if temperature >= (mashOutTempSp - 0.7) and burnerTurnDown == False:
                    pidController.cmdInitialize(cvMinSp, cvMinSp)
                    burnerTurnDown = True
                if temperature >= mashOutTempSp or cmdStepIncrement:
                     mashOutTimer = brewTimer(mashOutTimeSp)
                     cmdStepIncrement = False
                     burnerTurnDown = False
                     brewStep = "Mash Out"
                     
            if brewStep == "Mash Out":
                if cmdStepIncrement:
                    mashOutTimer.cmdIncrement()
                    cmdStepIncrement = False
                timerString = mashOutTimer.getTimerString()
                if mashOutTimer.isDone():
                    burner1.stop()
                    pump1.stop()
                    buzzer1.start()
                    brewStep = "Squeeze"
                    
            if brewStep == "Squeeze":
                if cmdStepIncrement:
                    pidCv = copy.copy(ignitionCv)
                    pidController.cmdManual(pidCv)
                    pidController.cmdInitialize(ignitionCv, cvMaxSp)
                    pump1.start()
                    burner1.start()
                    cmdStepIncrement = False
                    brewStep = "Heat for Boil"
                    
            if brewStep == "Heat for Boil":
                if temperature >= hotBreakTempSp or cmdStepIncrement:
                    cmdStepIncrement = False
                    buzzer1.start()
                    pidCv = copy.copy(hotBreakCvSp)
                    hotBreakTimer = brewTimer(hotBreakTimeSp)
                    brewStep = "Hot Break Control"
                    
            if brewStep == "Hot Break Control":
                if cmdStepIncrement:
                    hotBreakTimer.cmdIncrement()
                    cmdStepIncrement = False
                timerString = hotBreakTimer.getTimerString()
                if hotBreakTimer.isDone():
                    buzzer1.start()
                    pidCv = copy.copy(boilCvSp)
                    brewStep = "Bring to Boil"
                    
            if brewStep == "Bring to Boil":
                if temperature >= 212.0 or cmdStepIncrement:
                    cmdStepIncrement = False
                    pump1.stop()
                    buzzer1.start()
                    brewStep = "Boil"
                     
            if brewStep == "Boil":
                if cmdStepIncrement:
                    boilTimer = brewTimer(boilTimeSp)
                    boilPumpOffTimer = brewTimer(5.0)
                    boilPumpOnTimer = brewTimer(0.15)
                    cmdStepIncrement = False
                    brewStep = "Timed Boil"
            
            if brewStep == "Timed Boil":
                if cmdStepIncrement:
                    boilTimer.cmdIncrement()
                    cmdStepIncrement = False
                timerString = boilTimer.getTimerString()
                #Start the pump every 5 minutes for 6 seconds to mix the wort in the tube
                if boilPumpOffTimer.isDone() and pump1.getStatus() == "Off":
                    pump1.start()
                    boilPumpOffTimer = brewTimer(5.0)
                    boilPumpOnTimer = brewTimer(0.15)
                if boilPumpOnTimer.isDone() and pump1.getStatus() == "Running":
                    pump1.stop()
                if boilTimer.isDone():
                    burner1.stop()
                    pump1.start()
                    buzzer1.start()
                    immersionDelayTimer = brewTimer(0.5)
                    brewStep = "Immersion Chiller"
                    
            if brewStep == "Immersion Chiller":
                if (temperature <= hopStandTempSp and immersionDelayTimer.isDone()) or cmdStepIncrement:
                    cmdStepIncrement = False
                    hopStandTimer = brewTimer(hopStandTimeSp)
                    if hopStandTimeSp != 0.0:
                        buzzer1.start()                    
                    brewStep = "Hop Stand"
                    
            if brewStep == "Hop Stand":
                if cmdStepIncrement:
                    hopStandTimer.cmdIncrement()
                    cmdStepIncrement = False
                timerString = hopStandTimer.getTimerString()
                if hopStandTimer.isDone():
                    brewStep = "Immersion Chilling"
                    
            if brewStep == "Immersion Chilling":
                if temperature <= counterFlowTempSp or cmdStepIncrement:
                    cmdStepIncrement = False
                    buzzer1.start() 
                    pump1.stop()
                    brewStep = "Connect CF Heat Exchanger"
                    
            if brewStep == "Connect CF Heat Exchanger":
                if cmdStepIncrement:
                    cmdStepIncrement = False
                    waterValve1.open()
                    pump1.start()
                    brewStep = "Wort Transfer"
                    
            if cmdReset:
                burner1.stop()
                waterValve1.close()
                pump1.stop()
                brewStep = "Ready"
                timerString = "00:00:00"
                cmdReset = False
                cmdStart = False
                cmdStepIncrement = False
                
            #Create the Brew Message based on the brew step
            if brewStep == "Ready":
                brewMessage = "Press Start<br>to Begin"
            elif brewStep == "Heat for Strike":
                brewMessage = "Heat the Strike Water<br>to {0}&deg;F".format(strikeTempSp)
            elif brewStep == "Dough In":
                brewMessage = "Dough In and Stir Well<br>Press Next Step to Continue"
            elif brewStep == "Acid Rest Mash":
                brewMessage = "Acid Rest<br>Timed Mash"
            elif brewStep == "Heat for Protein Rest":
                brewMessage = "Heat the Mash to {0}&deg;F<br>For the Protein Rest".format(proteinMashTempSp)
            elif brewStep == "Protein Rest Mash":
                brewMessage = "Protein Rest<br>Timed Mash"
            elif brewStep == "Heat for Sacch Rest":
                brewMessage = "Heat the Mash to {0}&deg;F<br>For the Sacch Rest".format(sacchMashTempSp)
            elif brewStep == "Sacch Rest Mash":
                brewMessage = "Sacch Rest<br>Timed Mash"
            elif brewStep == "Heat for Sacch Rest 2":
                brewMessage = "Heat the Mash to {0}&deg;F<br>For the 2nd Sacch Rest".format(sacch2MashTempSp)
            elif brewStep == "Sacch Rest 2 Mash":
                brewMessage = "Second Sacch Rest<br>Timed Mash"
            elif brewStep == "Heat for Mash Out":
                brewMessage = "Heat the Mash to {0}&deg;F<br>For the Mash Out".format(mashOutTempSp)
            elif brewStep == "Mash Out":
                brewMessage = "Hold Temperature<br>for Timed Mash Out"
            elif brewStep == "Squeeze":
                brewMessage = "Remove the Grains from<br>the Wort and Squeeze!!!"
            elif brewStep == "Heat for Boil":
                brewMessage = "Heat the Wort<br>for the Boil"
            elif brewStep == "Hot Break Control":
                brewMessage = "Reduce the Burner Output<br>to Control the Hot Break"
            elif brewStep == "Bring to Boil":
                brewMessage = "Heat the Wort<br>for the Boil"
            elif brewStep == "Boil":
                brewMessage = "The Wort is boiling<br>Press Next for Timed Boil"
            elif brewStep == "Timed Boil":
                brewMessage = "Timed Boil"
            elif brewStep == "Immersion Chiller":
                if hopStandTimeSp == 0.0:
                    brewMessage = "Chill to {0}&deg;F Using<br>the Immersion Chiller".format(counterFlowTempSp)
                else:
                    brewMessage = "Chill to {0}&deg;F Using<br>the Immersion Chiller".format(hopStandTempSp)
            elif brewStep == "Hop Stand":
                brewMessage = "Hold the Temperature<br>for a Timed Hop Stand"
            elif brewStep == "Immersion Chilling":
                brewMessage = "Chill to {0}&deg;F Using<br>the Immersion Chiller".format(counterFlowTempSp)
            elif brewStep == "Connect CF Heat Exchanger":
                brewMessage = "Connect CF Heat Exchanger<br>Press Next Step to Continue"
            elif brewStep == "Wort Transfer":
                brewMessage = "Transfer the Wort<br>to the Fermenter"
            else:
                brewMessage = "Oh Shit!!!<br>The Program is Fucked!!!"
                
            #Create the LCD Message based on the brew step
            if brewStep == "Ready":
                lcdMessage = "  Press Start   \n    to Begin    \n"
                lcdData = ""
            elif brewStep == "Heat for Strike":
                lcdMessage = "  Heat Strike   \n Water to {0}{1}F \n".format(strikeTempSp,degree)
                lcdLabel = copy.copy(lcdTempLable)
                lcdData = "{0}{1}F".format(strikeTempSp,degree)
            elif brewStep == "Dough In":
                lcdMessage = "    Dough In    \n    and Stir    \n"
                lcdData = ""
            elif brewStep == "Acid Rest Mash":
                lcdMessage = "   Acid Rest    \n   Timed Mash   \n"
                lcdLabel = copy.copy(lcdTimerLable)
                lcdData = acidMashTimer.getSmallTimerString()
            elif brewStep == "Heat for Protein Rest":
                lcdMessage = " Heat to {0}{1}F  \nFor Protein Rest\n".format(proteinMashTempSp,degree)
                lcdLabel = copy.copy(lcdTempLable)
                lcdData = "{0}{1}F".format(proteinMashTempSp,degree)
            elif brewStep == "Protein Rest Mash":
                lcdMessage = "  Protein Rest  \n   Timed Mash   \n"
                lcdLabel = copy.copy(lcdTimerLable)
                lcdData = proteinMashTimer.getSmallTimerString()
            elif brewStep == "Heat for Sacch Rest":
                lcdMessage = " Heat to {0}{1}F  \n For Sacch Rest \n".format(sacchMashTempSp,degree)
                lcdLabel = copy.copy(lcdTempLable)
                lcdData = "{0}{1}F".format(sacchMashTempSp,degree)
            elif brewStep == "Sacch Rest Mash":
                lcdMessage = "   Sacch Rest   \n   Timed Mash   \n"
                lcdLabel = copy.copy(lcdTimerLable)
                lcdData = sacchMashTimer.getSmallTimerString()
            elif brewStep == "Heat for Sacch Rest 2":
                lcdMessage = " Heat to {0}{1}F  \nFor Sacch Rest 2\n".format(sacch2MashTempSp,degree)
                lcdLabel = copy.copy(lcdTempLable)
                lcdData = "{0}{1}F".format(sacch2MashTempSp,degree)
            elif brewStep == "Sacch Rest 2 Mash":
                lcdMessage = " 2nd Sacch Rest \n   Timed Mash   \n"
                lcdLabel = copy.copy(lcdTimerLable)
                lcdData = sacch2MashTimer.getSmallTimerString()
            elif brewStep == "Heat for Mash Out":
                lcdMessage = " Heat to {0}{1}F  \n  For Mash Out  \n".format(mashOutTempSp,degree)
                lcdLabel = copy.copy(lcdTempLable)
                lcdData = "{0}{1}F".format(mashOutTempSp,degree)
            elif brewStep == "Mash Out":
                lcdMessage = "Hold at {0}{1}F  \n Timed Mash Out \n".format(mashOutTempSp,degree)
                lcdLabel = copy.copy(lcdTimerLable)
                lcdData = mashOutTimer.getSmallTimerString()
            elif brewStep == "Squeeze":
                lcdMessage = " Remove Grains  \n and Squeeze!!! \n"
                lcdData = ""
            elif brewStep == "Heat for Boil":
                lcdMessage = "   Heat Wort    \n  for the Boil  \n"
                lcdLabel = copy.copy(lcdTempLable)
                lcdData = "{0}{1}F".format(hotBreakTempSp,degree)
            elif brewStep == "Hot Break Control":
                lcdMessage = " Reduce Burner  \n for Hot Break  \n"
                lcdLabel = copy.copy(lcdTimerLable)
                lcdData = hotBreakTimer.getSmallTimerString()
            elif brewStep == "Bring to Boil":
                lcdMessage = "   Heat Wort    \n  for the Boil  \n"
                lcdLabel = copy.copy(lcdTempLable)
                lcdData = "{0}{1}F".format(212,degree)
            elif brewStep == "Boil":
                lcdMessage = "    The Wort    \n   Is Boiling   \n"
                lcdData = ""
            elif brewStep == "Timed Boil":
                lcdMessage = "   Timed Boil   \n                \n"
                lcdLabel = copy.copy(lcdTimerLable)
                lcdData = boilTimer.getSmallTimerString()
            elif brewStep == "Immersion Chiller":
                lcdLabel = copy.copy(lcdTempLable)
                if hopStandTimeSp == 0.0:
                    lcdMessage = " Chill to {0}{1}F \n  with Chiller  \n".format(counterFlowTempSp,degree)
                    lcdData = "{0}{1}F".format(counterFlowTempSp,degree)
                else:
                    lcdMessage = " Chill to {0}{1}F \n  with Chiller  \n".format(hopStandTempSp,degree)
                    lcdData = "{0}{1}F".format(hopStandTempSp,degree)
            elif brewStep == "Hop Stand":
                lcdMessage = " Hold Temp for  \nTimed Hop Stand \n"
                lcdLabel = copy.copy(lcdTimerLable)
                lcdData = hopStandTimer.getSmallTimerString()
            elif brewStep == "Immersion Chilling":
                lcdMessage = " Chill to {0}{1}F  \n  with Chiller  \n".format(counterFlowTempSp,degree)
                lcdLabel = copy.copy(lcdTempLable)
                lcdData = "{0}{1}F".format(counterFlowTempSp,degree)
            elif brewStep == "Connect CF Heat Exchanger":
                lcdMessage = "   Connect CF   \n Heat Exchanger \n"
                lcdData = ""
            elif brewStep == "Wort Transfer":
                lcdMessage = " Transfer Wort  \n  to Fermenter  \n"
                lcdLabel = copy.copy(lcdTempLable)
                lcdData = "{0}{1}F".format(70,degree)
            else:
                lcdMessage = "Oh Shit!!!/nProgram Fucked!!/n"
                
            if brewStep != brewStepLast:
                lcdMsgTimer = brewTimer(0.1)
            brewStepLast = copy.copy(brewStep)
            
            if lcdMsgTimer.isDone() and lcdData != "":
                lcdString = lcdLabel + "\n" + "{0:.1f}{1}F".format(temperature,degree) + "    " + lcdData + "\n"
            else:
                lcdString = copy.copy(lcdMessage)
            
            if lcdString != lcdStringLast:
                lcd.writeMsg(lcdString)
            lcdStringLast = copy.copy(lcdString)
            
            #Shut off the burner if the temp gets too high
            if pidMode == "Auto":
                if brewStep == "Acid Rest Mash" or brewStep == "Protein Rest Mash" or brewStep == "Sacch Rest Mash" or brewStep == "Sacch Rest 2 Mash" or brewStep == "Mash Out":
                    if temperature >= (pidSp + shutOffTempSp):
                        burnerShutOff = True
                        burner1.stop()
                    if burnerShutOff and temperature < pidSp:
                        burnerShutOff = False
                        pidController.cmdInitialize(ignitionCv, cvMinSp)
                        burner1.start()
                else:
                    if burnerShutOff == True:
                        burnerShutOff = False
                        pidController.cmdInitialize(ignitionCv, pidCv)
                        burner1.start()
            else:
                 burnerShutOff = False       
            
            #Get the pump, burner, and water valve status    
            pumpStatus = pump1.getStatus()
            burnerStatus = burner1.getStatus()
            waterValveStatus = waterValve1.getStatus()
            
            if (not statusQ.full()):    
                statusQ.put([dataLoggingStatus, pumpStatus, waterValveStatus, burnerStatus, temperature, brewMessage, trendData, timerString, pidMode, pidPv, pidCv, pidSp, pidKpSp, \
                             pidKiSp, pidKdSp, strikeTempSp, acidMashTempSp, acidMashTimeSp, proteinMashTempSp, proteinMashTimeSp, sacchMashTempSp, sacchMashTimeSp, \
                             sacch2MashTempSp, sacch2MashTimeSp, mashOutTempSp, mashOutTimeSp, hotBreakTempSp, hotBreakTimeSp, hotBreakCvSp, boilTimeSp, boilCvSp, \
                             hopStandTempSp, hopStandTimeSp, counterFlowTempSp, trendDurationSp, cvMinSp, cvMaxSp, pidDbSp, shutOffTempSp, cmdStart, cmdStepIncrement, cmdPidManual, cmdPidAuto, cmdReset, cmdStartDataLog, \
                             cmdStopDataLog, cmdStartPump, cmdStopPump, cmdOpenWaterValve, cmdCloseWaterValve, cmdStartBurner, cmdStopBurner]) #GET request
                
            time.sleep(.25)


class htmlComm:
    
    def __init__(self):
        
        self.dataLoggingStatus = param.dataLoggingStatus
        self.pumpStatus = param.pumpStatus
        self.waterValveStatus = param.waterValveStatus
        self.burnerStatus = param.burnerStatus
        self.temperature = param.temperature
        self.brewMessage = param.brewMessage
        self.trendData = param.trendData
        self.timerString = param.timerString
        self.pidMode = param.pidMode
        self.pidPv = param.pidPv
        self.pidCv = param.pidCv
        self.pidSp = param.pidSp
        self.pidKpSp = param.pidKpSp
        self.pidKiSp = param.pidKiSp
        self.pidKdSp = param.pidKdSp
        self.strikeTempSp = param.strikeTempSp
        self.acidMashTempSp = param.acidMashTempSp
        self.acidMashTimeSp = param.acidMashTimeSp
        self.proteinMashTempSp = param.proteinMashTempSp
        self.proteinMashTimeSp = param.proteinMashTimeSp
        self.sacchMashTempSp = param.sacchMashTempSp
        self.sacchMashTimeSp = param.sacchMashTimeSp
        self.sacch2MashTempSp = param.sacch2MashTempSp
        self.sacch2MashTimeSp = param.sacch2MashTimeSp
        self.mashOutTempSp = param.mashOutTempSp
        self.mashOutTimeSp = param.mashOutTimeSp
        self.hotBreakTempSp = param.hotBreakTempSp
        self.hotBreakTimeSp = param.hotBreakTimeSp
        self.hotBreakCvSp = param.hotBreakCvSp
        self.boilTimeSp = param.boilTimeSp
        self.boilCvSp = param.boilCvSp
        self.hopStandTempSp = param.hopStandTempSp
        self.hopStandTimeSp = param.hopStandTimeSp
        self.counterFlowTempSp = param.counterFlowTempSp
        self.trendDurationSp = param.trendDurationSp
        self.cvMinSp = param.cvMinSp
        self.cvMaxSp = param.cvMaxSp
        self.pidDbSp = param.pidDbSp
        self.shutOffTempSp = param.shutOffTempSp
        self.cmdStart = param.cmdStart
        self.cmdStepIncrement = param.cmdStepIncrement
        self.cmdPidManual = param.cmdPidManual
        self.cmdPidAuto = param.cmdPidAuto
        self.cmdReset = param.cmdReset
        self.cmdStartDataLog = param.cmdStartDataLog
        self.cmdStopDataLog = param.cmdStopDataLog
        self.cmdStartPump = param.cmdStartPump
        self.cmdStopPump = param.cmdStopPump
        self.cmdOpenWaterValve = param.cmdOpenWaterValve
        self.cmdCloseWaterValve = param.cmdCloseWaterValve
        self.cmdStartBurner = param.cmdStartBurner
        self.cmdStopBurner = param.cmdStopBurner

    def GET(self):
 
        if (statusQ.full()): #remove old data
            for i in range(statusQ.qsize()):
                dataLoggingStatus, pumpStatus, waterValveStatus, burnerStatus, temperature, brewMessage, trendData, timerString, pidMode, pidPv, pidCv, pidSp, pidKpSp, \
                pidKiSp, pidKdSp, strikeTempSp, acidMashTempSp, acidMashTimeSp, proteinMashTempSp, proteinMashTimeSp, sacchMashTempSp, sacchMashTimeSp, \
                sacch2MashTempSp, sacch2MashTimeSp, mashOutTempSp, mashOutTimeSp, hotBreakTempSp, hotBreakTimeSp, hotBreakCvSp, boilTimeSp, boilCvSp, \
                hopStandTempSp, hopStandTimeSp, counterFlowTempSp, trendDurationSp, cvMinSp, cvMaxSp, pidDbSp, shutOffTempSp, cmdStart, cmdStepIncrement, cmdPidManual, cmdPidAuto, cmdReset, cmdStartDataLog, \
                cmdStopDataLog, cmdStartPump, cmdStopPump, cmdOpenWaterValve, cmdCloseWaterValve, cmdStartBurner, cmdStopBurner = web.ctx.globals.statusQ.get() 
        dataLoggingStatus, pumpStatus, waterValveStatus, burnerStatus, temperature, brewMessage, trendData, timerString, pidMode, pidPv, pidCv, pidSp, pidKpSp, \
        pidKiSp, pidKdSp, strikeTempSp, acidMashTempSp, acidMashTimeSp, proteinMashTempSp, proteinMashTimeSp, sacchMashTempSp, sacchMashTimeSp, \
        sacch2MashTempSp, sacch2MashTimeSp, mashOutTempSp, mashOutTimeSp, hotBreakTempSp, hotBreakTimeSp, hotBreakCvSp, boilTimeSp, boilCvSp, \
        hopStandTempSp, hopStandTimeSp, counterFlowTempSp, trendDurationSp, cvMinSp, cvMaxSp, pidDbSp, shutOffTempSp, cmdStart, cmdStepIncrement, cmdPidManual, cmdPidAuto, cmdReset, cmdStartDataLog, \
        cmdStopDataLog, cmdStartPump, cmdStopPump, cmdOpenWaterValve, cmdCloseWaterValve, cmdStartBurner, cmdStopBurner \
        = web.ctx.globals.statusQ.get() 
            
        out = json.dumps({"dataLoggingStatus" : dataLoggingStatus,
                                 "pumpStatus" : pumpStatus,
                           "waterValveStatus" : waterValveStatus,
                               "burnerStatus" : burnerStatus,
                                "temperature" : temperature,
                                "brewMessage" : brewMessage,
                                  "trendData" : trendData,
                                "timerString" : timerString,
                                    "pidMode" : pidMode,
                                      "pidPv" : pidPv,
                                      "pidCv" : pidCv,
                                      "pidSp" : pidSp,
                                    "pidKpSp" : pidKpSp,
                                    "pidKiSp" : pidKiSp,
                                    "pidKdSp" : pidKdSp,
                               "strikeTempSp" : strikeTempSp,
                             "acidMashTempSp" : acidMashTempSp,
                             "acidMashTimeSp" : acidMashTimeSp,
                          "proteinMashTempSp" : proteinMashTempSp,
                          "proteinMashTimeSp" : proteinMashTimeSp,
                            "sacchMashTempSp" : sacchMashTempSp,
                            "sacchMashTimeSp" : sacchMashTimeSp,
                           "sacch2MashTempSp" : sacch2MashTempSp,
                           "sacch2MashTimeSp" : sacch2MashTimeSp,
                              "mashOutTempSp" : mashOutTempSp,
                              "mashOutTimeSp" : mashOutTimeSp,
                             "hotBreakTempSp" : hotBreakTempSp,
                             "hotBreakTimeSp" : hotBreakTimeSp,
                               "hotBreakCvSp" : hotBreakCvSp,
                                 "boilTimeSp" : boilTimeSp,
                                   "boilCvSp" : boilCvSp,
                             "hopStandTempSp" : hopStandTempSp,
                             "hopStandTimeSp" : hopStandTimeSp,
                          "counterFlowTempSp" : counterFlowTempSp,
                            "trendDurationSp" : trendDurationSp,
                                    "cvMinSp" : cvMinSp,
                                    "cvMaxSp" : cvMaxSp,
                                    "pidDbSp" : pidDbSp,
                              "shutOffTempSp" : shutOffTempSp})
        return out
       
    def POST(self):
        if (statusQ.full()): #remove old data
            for i in range(statusQ.qsize()):
                self.dataLoggingStatus, self.pumpStatus, self.waterValveStatus, self.burnerStatus, self.temperature, self.brewMessage, self.trendData, self.timerString, self.pidMode, self.pidPv, self.pidCv, self.pidSp, self.pidKpSp, \
                self.pidKiSp, self.pidKdSp, self.strikeTempSp, self.acidMashTempSp, self.acidMashTimeSp, self.proteinMashTempSp, self.proteinMashTimeSp, self.sacchMashTempSp, self.sacchMashTimeSp, \
                self.sacch2MashTempSp, self.sacch2MashTimeSp, self.mashOutTempSp, self.mashOutTimeSp, self.hotBreakTempSp, self.hotBreakTimeSp, self.hotBreakCvSp, self.boilTimeSp, self.boilCvSp, \
                self.hopStandTempSp, self.hopStandTimeSp, self.counterFlowTempSp, self.trendDurationSp, self.cvMinSp, self.cvMaxSp, self.pidDbSp, self.shutOffTempSp, self.cmdStart, self.cmdStepIncrement, self.cmdPidManual, self.cmdPidAuto, self.cmdReset, self.cmdStartDataLog, \
                self.cmdStopDataLog, self.cmdStartPump, self.cmdStopPump, self.cmdOpenWaterValve, self.cmdCloseWaterValve, self.cmdStartBurner, self.cmdStopBurner = web.ctx.globals.statusQ.get() 
        self.dataLoggingStatus, self.pumpStatus, self.waterValveStatus, self.burnerStatus, self.temperature, self.brewMessage, self.trendData, self.timerString, self.pidMode, self.pidPv, self.pidCv, self.pidSp, self.pidKpSp, \
        self.pidKiSp, self.pidKdSp, self.strikeTempSp, self.acidMashTempSp, self.acidMashTimeSp, self.proteinMashTempSp, self.proteinMashTimeSp, self.sacchMashTempSp, self.sacchMashTimeSp, \
        self.sacch2MashTempSp, self.sacch2MashTimeSp, self.mashOutTempSp, self.mashOutTimeSp, self.hotBreakTempSp, self.hotBreakTimeSp, self.hotBreakCvSp, self.boilTimeSp, self.boilCvSp, \
        self.hopStandTempSp, self.hopStandTimeSp, self.counterFlowTempSp, self.trendDurationSp, self.cvMinSp, self.cvMaxSp, self.pidDbSp, self.shutOffTempSp, self.cmdStart, self.cmdStepIncrement, self.cmdPidManual, self.cmdPidAuto, self.cmdReset, self.cmdStartDataLog, \
        self.cmdStopDataLog, self.cmdStartPump, self.cmdStopPump, self.cmdOpenWaterValve, self.cmdCloseWaterValve, self.cmdStartBurner, self.cmdStopBurner \
        = web.ctx.globals.statusQ.get()
        
        jsonData = web.data()
        webData = json.loads(jsonData)
        for key in webData:
            if key == "pidCv":
                print webData[key]
                self.pidCv = webData[key]
            if key == "pidSp":
                print webData[key]
                self.pidSp = webData[key]
            if key == "pidKpSp":
                print webData[key]
                self.pidKpSp = webData[key]
            if key == "pidKiSp":
                print webData[key]
                self.pidKiSp = webData[key]
            if key == "pidKdSp":
                print webData[key]
                self.pidKdSp = webData[key]
            if key == "strikeTempSp":
                print webData[key]
                self.strikeTempSp = webData[key]                
            if key == "acidMashTempSp":
                print webData[key]
                self.acidMashTempSp = webData[key]
            if key == "acidMashTimeSp":
                print webData[key]
                self.acidMashTimeSp = webData[key]
            if key == "proteinMashTempSp":
                print webData[key]
                self.proteinMashTempSp = webData[key]
            if key == "proteinMashTimeSp":
                print webData[key]
                self.proteinMashTimeSp = webData[key]
            if key == "sacchMashTempSp":
                print webData[key]
                self.sacchMashTempSp = webData[key]
            if key == "sacchMashTimeSp":
                print webData[key]
                self.sacchMashTimeSp = webData[key]
            if key == "sacch2MashTempSp":
                print webData[key]
                self.sacch2MashTempSp = webData[key]
            if key == "sacch2MashTimeSp":
                print webData[key]
                self.sacch2MashTimeSp = webData[key]            
            if key == "mashOutTempSp":
                print webData[key]
                self.mashOutTempSp = webData[key]
            if key == "mashOutTimeSp":
                print webData[key]
                self.mashOutTimeSp = webData[key]                
            if key == "hotBreakTempSp":
                print webData[key]
                self.hotBreakTempSp = webData[key]
            if key == "hotBreakTimeSp":
                print webData[key]
                self.hotBreakTimeSp = webData[key]
            if key == "hotBreakCvSp":
                print webData[key]
                self.hotBreakCvSp = webData[key]            
            if key == "boilTimeSp":
                print webData[key]
                self.boilTimeSp = webData[key]                
            if key == "boilCvSp":
                print webData[key]
                self.boilCvSp = webData[key]
            if key == "hopStandTempSp":
                print webData[key]
                self.hopStandTempSp = webData[key]
            if key == "hopStandTimeSp":
                print webData[key]
                self.hopStandTimeSp = webData[key]              
            if key == "counterFlowTempSp":
                print webData[key]
                self.counterFlowTempSp = webData[key]
            if key == "trendDurationSp":
                print webData[key]
                self.trendDurationSp = webData[key]
            if key == "cvMinSp":
                print webData[key]
                self.cvMinSp = webData[key]
            if key == "cvMaxSp":
                print webData[key]
                self.cvMaxSp = webData[key]
            if key == "pidDbSp":
                print webData[key]
                self.pidDbSp = webData[key]
            if key == "shutOffTempSp":
                print webData[key]
                self.shutOffTempSp = webData[key]
            if key == "cmdStart":
                print webData[key]
                self.cmdStart = webData[key]
            if key == "cmdStepIncrement":
                print webData[key]
                self.cmdStepIncrement = webData[key]
            if key == "cmdPidManual":
                print webData[key]
                self.cmdPidManual = webData[key]
            if key == "cmdPidAuto":
                print webData[key]
                self.cmdPidAuto = webData[key]
            if key == "cmdReset":
                print webData[key]
                self.cmdReset = webData[key]           
            if key == "cmdStartDataLog":
                print webData[key]
                self.cmdStartDataLog = webData[key]
            if key == "cmdStopDataLog":
                print webData[key]
                self.cmdStopDataLog = webData[key]
            if key == "cmdStartPump":
                print webData[key]
                self.cmdStartPump = webData[key]
            if key == "cmdStopPump":
                print webData[key]
                self.cmdStopPump = webData[key]
            if key == "cmdOpenWaterValve":
                print webData[key]
                self.cmdOpenWaterValve = webData[key]
            if key == "cmdCloseWaterValve":
                print webData[key]
                self.cmdCloseWaterValve = webData[key]
            if key == "cmdStartBurner":
                print webData[key]
                self.cmdStartBurner = webData[key]
            if key == "cmdStopBurner":
                print webData[key]
                self.cmdStopBurner = webData[key]
            
         
        web.ctx.globals.parent_conn.send([self.dataLoggingStatus, self.pumpStatus, self.waterValveStatus, self.burnerStatus, self.temperature, self.brewMessage, self.trendData, self.timerString, self.pidMode, self.pidPv, self.pidCv, self.pidSp, self.pidKpSp, \
                                          self.pidKiSp, self.pidKdSp, self.strikeTempSp, self.acidMashTempSp, self.acidMashTimeSp, self.proteinMashTempSp, self.proteinMashTimeSp, self.sacchMashTempSp, self.sacchMashTimeSp, \
                                          self.sacch2MashTempSp, self.sacch2MashTimeSp, self.mashOutTempSp, self.mashOutTimeSp, self.hotBreakTempSp, self.hotBreakTimeSp, self.hotBreakCvSp, self.boilTimeSp, self.boilCvSp, \
                                          self.hopStandTempSp, self.hopStandTimeSp, self.counterFlowTempSp, self.trendDurationSp, self.cvMinSp, self.cvMaxSp, self.pidDbSp, self.shutOffTempSp, self.cmdStart, self.cmdStepIncrement, self.cmdPidManual, self.cmdPidAuto, self.cmdReset, self.cmdStartDataLog, \
                                          self.cmdStopDataLog, self.cmdStartPump, self.cmdStopPump, self.cmdOpenWaterValve, self.cmdCloseWaterValve, self.cmdStartBurner, self.cmdStopBurner])

class trendComm:
    
    def GET(self):
 
        if (statusQ.full()): #remove old data
            for i in range(statusQ.qsize()):
                dataLoggingStatus, pumpStatus, waterValveStatus, burnerStatus, temperature, brewMessage, trendData, timerString, pidMode, pidPv, pidCv, pidSp, pidKpSp, \
                pidKiSp, pidKdSp, strikeTempSp, acidMashTempSp, acidMashTimeSp, proteinMashTempSp, proteinMashTimeSp, sacchMashTempSp, sacchMashTimeSp, \
                sacch2MashTempSp, sacch2MashTimeSp, mashOutTempSp, mashOutTimeSp, hotBreakTempSp, hotBreakTimeSp, hotBreakCvSp, boilTimeSp, boilCvSp, \
                hopStandTempSp, hopStandTimeSp, counterFlowTempSp, trendDurationSp, cvMinSp, cvMaxSp, pidDbSp, shutOffTempSp, cmdStart, cmdStepIncrement, cmdPidManual, cmdPidAuto, cmdReset, cmdStartDataLog, \
                cmdStopDataLog, cmdStartPump, cmdStopPump, cmdOpenWaterValve, cmdCloseWaterValve, cmdStartBurner, cmdStopBurner = web.ctx.globals.statusQ.get() 
        dataLoggingStatus, pumpStatus, waterValveStatus, burnerStatus, temperature, brewMessage, trendData, timerString, pidMode, pidPv, pidCv, pidSp, pidKpSp, \
        pidKiSp, pidKdSp, strikeTempSp, acidMashTempSp, acidMashTimeSp, proteinMashTempSp, proteinMashTimeSp, sacchMashTempSp, sacchMashTimeSp, \
        sacch2MashTempSp, sacch2MashTimeSp, mashOutTempSp, mashOutTimeSp, hotBreakTempSp, hotBreakTimeSp, hotBreakCvSp, boilTimeSp, boilCvSp, \
        hopStandTempSp, hopStandTimeSp, counterFlowTempSp, trendDurationSp, cvMinSp, cvMaxSp, pidDbSp, shutOffTempSp, cmdStart, cmdStepIncrement, cmdPidManual, cmdPidAuto, cmdReset, cmdStartDataLog, \
        cmdStopDataLog, cmdStartPump, cmdStopPump, cmdOpenWaterValve, cmdCloseWaterValve, cmdStartBurner, cmdStopBurner \
        = web.ctx.globals.statusQ.get() 
          
        return trendData
        

if __name__ == '__main__':

    #os.chdir("/var/www")    Raspberry Pi web server location
    
    urls = ("/", "brewNpi", 
            "/brewControl", "brewControl",
            "/brewTrend", "brewTrend",
            "/trendComm", "trendComm",
            "/brewSetup", "brewSetup",
            "/htmlComm", "htmlComm"
    )

    render = web.template.render('templates/')

    app = web.application(urls, globals()) 
    
    statusQ = Queue(2)       
    parent_conn, child_conn = Pipe()
    p = Process(name = "ProcessControl", target=ProcessControl, args=(param.dataLoggingStatus, param.pumpStatus, param.waterValveStatus, param.burnerStatus, param.temperature, param.brewMessage, param.trendData, param.timerString, param.pidMode, param.pidPv, param.pidCv, param.pidSp, param.pidKpSp, \
                                                                      param.pidKiSp, param.pidKdSp, param.strikeTempSp, param.acidMashTempSp, param.acidMashTimeSp, param.proteinMashTempSp, param.proteinMashTimeSp, param.sacchMashTempSp, param.sacchMashTimeSp, \
                                                                      param.sacch2MashTempSp, param.sacch2MashTimeSp, param.mashOutTempSp, param.mashOutTimeSp, param.hotBreakTempSp, param.hotBreakTimeSp, param.hotBreakCvSp, param.boilTimeSp, param.boilCvSp, \
                                                                      param.hopStandTempSp, param.hopStandTimeSp, param.counterFlowTempSp, param.trendDurationSp, param.cvMinSp, param.cvMaxSp, param.pidDbSp, param.shutOffTempSp, param.cmdStart, param.cmdStepIncrement, param.cmdPidManual, param.cmdPidAuto, param.cmdReset, param.cmdStartDataLog, \
                                                                      param.cmdStopDataLog, param.cmdStartPump, param.cmdStopPump, param.cmdOpenWaterValve, param.cmdCloseWaterValve, param.cmdStartBurner, param.cmdStopBurner, \
                                                                      statusQ, child_conn))
    p.start()
    
    app.add_processor(add_global_hook(parent_conn, statusQ))
     
    app.run()

