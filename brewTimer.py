import time, math

class brewTimer:
    def __init__(self, timerSp):
        self.sp = timerSp * 60.0
        self.startTime = time.time()
        self.incrementTime = 0
        
    def getElapsed(self):
        elapsed = time.time() - self.startTime + self.incrementTime
        return elapsed
    
    def getTimeLeft(self):
        if self.getElapsed() <= self.sp:
            time = self.sp - self.getElapsed()
        else:
            time = 0           
        return time
    
    def getHrs(self):
        timeLeft = self.getTimeLeft()
        hrs = math.trunc(timeLeft/3600)
        return hrs
    
    def getMin(self):
        timeLeft = self.getTimeLeft()
        min = math.trunc(timeLeft/60)-self.getHrs()*60
        return min
    
    def getSec(self):
        timeLeft = self.getTimeLeft()
        sec = timeLeft-self.getHrs()*3600-self.getMin()*60
        return sec
    
    def getTimerString(self):
        timerString = '{0:02d}:{1:02d}:{2:02d}'.format(int(self.getHrs()), int(self.getMin()), int(self.getSec()))
        return timerString
    
    def getSmallTimerString(self):
        timerString = '{0:02d}:{1:02d}'.format(int(self.getHrs())*60 + int(self.getMin()), int(self.getSec()))
        return timerString
    
    def isDone(self):
        done = False
        if self.getElapsed() >= self.sp:
            done = True
        return done
    
    def cmdIncrement(self):
        self.incrementTime += 60
        
