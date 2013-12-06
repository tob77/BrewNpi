import time, copy
from brewTimer import brewTimer

class pid:
    def __init__(self, pvMin, pvMax):
        self.pvMin = pvMin
        self.pvMax = pvMax
        self.mode = "Manual"
        self.lastMode = "Manual"
        self.cv = 18.9
        self.initCv = 10
        self.time = [0.0, 0.0]
        self.error = [0.0,0.0]
        self.pv = [0.0, 0.0]
        self.dPv = [0.0, 0.0, 0.0]
        self.initTimer = brewTimer(0.05)
        self.dbStatus = "Null"
        
    def doCalc(self, pv, sp, kp, ki, kd, cvMin, cvMax, db):
        self.pv.pop(0)                                                      #remove the oldest pv
        self.pv.append(pv)                                                  #add the latest pv to the list
        self.error.pop(0)                                                   #remove the oldest error
        error = (sp - self.pv[1]) * 100.0 / (self.pvMax - self.pvMin)       #calculate error in % of span
        self.error.append(error)                                            #add the latest error to the list
        dPv = (self.pv[0] - self.pv[1]) * 100.0 /(self.pvMax - self.pvMin)  #calculate dPv in % of span
        self.dPv.pop(0)                                                     #remove the oldest dPv
        self.dPv.append(dPv)
        dE = self.error[1]-self.error[0]                                    #calculate the dE
        self.time.pop(0)                                                    #remove the last time value from the list
        self.time.append(time.time())
        dT = self.time[1] - self.time[0]                                    #calculate the dT
        
        #Zero crossing DeadBand
        if self.dbStatus == "Low" and pv >= sp:
            self.dbStatus = "Active"
        if self.dbStatus == "High" and pv <= sp:
            self.dbStatus = "Active"
        if pv < (sp - db):
            self.dbStatus = "Low"
        if pv > (sp + db):
            self.dbStatus = "High"
        
        if self.time[0] <> 0.0 and self.mode == "Auto":   
            dP = kp * dE
            dI = ki * error * dT / 60.0
            dD = kd * (-dPv + 2 * self.dPv[1] - self.dPv[0]) * 60.0 / dT
#            print "self.cv ", self.cv, ", dP ", dP, ", dI ", dI, ", dD ", dD
            if self.dbStatus != "Active":
                self.cv += dP + dI + dD
            
            #Check the limits of the CV     
            if self.cv > cvMax:
                self.cv = copy.copy(cvMax)
            if self.cv < cvMin:
                self.cv = copy.copy(cvMin) 
        
        #Restore the mode to its' previous state after the initialization timer is done
        if self.mode == "Initialize" and self.initTimer.isDone():
            self.mode = self.lastMode
            self.cv = self.initCv
            self.error = [0.0,0.0]
            self.dPv = [0.0,0.0,0.0]
              
        return self.cv
    
    def getMode(self):
        return self.mode
    
    def cmdAuto(self):
        self.mode = "Auto"
        
    def cmdManual(self, cv):
        self.mode = "Manual"
        self.cv = cv
        self.error = [0.0,0.0]
        self.dPv = [0.0,0.0,0.0]
    
    def cmdInitialize(self, startCv, endCv):
        self.lastMode = self.mode
        self.mode = "Initialize"
        self.cv = startCv
        self.initCv = endCv
        self.error = [0.0,0.0]
        self.dPv = [0.0,0.0,0.0]
        #Start 3 second initialization timer
        self.initTimer = brewTimer(0.05)
    
class sim:
    def __init__(self):
        self.temp = 100.0
        self.heatRate = 40.0           #Max heat rate in temp / calc
        self.coolRate = .2            #cooling rate constant
        self.ambTemp = 32             #ambient temperature
        self.cvList = []
        
        while len(self.cvList) < 25:                              #preset the heat list with 25 deg celcius
            self.cvList.append(0.0)
    
    def getTemp(self,cv):
        #remove the last value and add a new value to the cvList to form a moving average.
        self.cvList.pop(0)
        self.cvList.append(cv)
        
        #Calculate the average of the cvList
        total = 0.0
        for value in self.cvList:
            total += value
        
        cvMave = total / len(self.cvList)                          #calculate the cv moving average
        
        dTempHeat = self.heatRate * cvMave / 100.0
        dTempCool = self.coolRate * (self.temp - self.ambTemp)
        
        self.temp = self.temp + dTempHeat - dTempCool
        if self.temp > 212.0:
            self.temp = 212.0
        if self.temp < 32.0:
            self.temp = 32.0
        
        return self.temp