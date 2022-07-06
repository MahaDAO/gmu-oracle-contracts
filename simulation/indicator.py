def arth_indicator(pricesLongTerm, pricesShortTerm, startingPrice, longTermDuration = 30, dampeningFactor = 0.1):
  '''
  An indicator to algorithimatically calculate ARTH's price
  '''
  trend = [startingPrice] * longTermDuration

  # Ptn will help us attain the memory part of thresholds
  # assuming we start in the middle region
  for i in range(longTermDuration, len(pricesLongTerm)):
    # If we are going to change the price, check if both the 30d and 7d price are
    # appreciating
    if (pricesLongTerm[i] > pricesLongTerm[i - 1] and pricesShortTerm[i] > pricesShortTerm[i - 1]):
      delta = pricesLongTerm[i] - pricesLongTerm[i - 1]
      percentageChange = delta / pricesLongTerm[i - 1]

      # dampen the change; say we will only appreciate ARTH by 10% of the bitcoin appreciation
      dampnedChange = percentageChange * dampeningFactor
      trend.append(trend[i -1] * (1 + dampnedChange))

    # don't change the price
    else:
      trend.append(trend[i - 1])

  return trend
