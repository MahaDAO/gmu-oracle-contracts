import numpy as np

def indicator(price):
  output = []
  lower_T = -450
  upper_T = 230
  ptn = 0

  meanSlope = np.array(price)

  # Ptn will help us attain the memory part of thresholds
  # assuming we start in the middle region
  for i in range(len(meanSlope)):
    if ptn == 0:
      if meanSlope[i] <= lower_T:
        ptn = -1
        # c.append(['downtrend',i])
        # it will append the same, when it goes to the bottom if conditions
      elif meanSlope[i] >= upper_T:
        ptn = 1
      else: slopeOutput.append('start_ambiguity')
    if ptn == 1:
      if meanSlope[i] <= lower_T:
        ptn = -1
        # c.append(['downtrend',i])
      else: slopeOutput.append('uptrend')
    if ptn == -1:
      if meanSlope[i] >= upper_T:
        ptn = 1
        slopeOutput.append('uptrend')
      else: slopeOutput.append('downtrend')

  return output
