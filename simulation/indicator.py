import numpy as np

def indicator(price):
  output = []
  lower_T = -450
  upper_T = 230
  ptn = 0

  meanSlope = np.array(price)
  startingPrice = price[0]

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
      else: output.append('start_ambiguity')
    if ptn == 1:
      if meanSlope[i] <= lower_T:
        ptn = -1
        # c.append(['downtrend',i])
      else: output.append('uptrend')
    if ptn == -1:
      if meanSlope[i] >= upper_T:
        ptn = 1
        output.append('uptrend')
      else: output.append('downtrend')

  return output
