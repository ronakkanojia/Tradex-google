/**
 * Black-Scholes formula for European Option theoretical pricing and Greeks
 */

/**
 * Standard normal cumulative distribution function
 */
function cumulativeDistribution(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.39894228 * Math.exp((-x * x) / 2);
  const probabilities =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

  return x > 0 ? 1 - probabilities : probabilities;
}

/**
 * Standard normal probability density function
 */
function normalDensity(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface BlackScholesResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

/**
 * Calculates Black-Scholes theoretical price and Greeks
 * @param S Underlying price
 * @param K Strike price
 * @param T Time to expiry (in years)
 * @param r Risk-free rate (decimal, e.g., 0.065 for 6.5%)
 * @param v Volatility (decimal, e.g., 0.15 for 15%)
 * @param isCall boolean
 */
export function calculateBlackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  v: number,
  isCall: boolean = true
): BlackScholesResult {
  if (T <= 0) {
    const intrinsicValue = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
    return {
      price: intrinsicValue,
      delta: isCall ? (S > K ? 1 : 0) : S < K ? -1 : 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  const d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);

  const N_d1 = cumulativeDistribution(d1);
  const N_d2 = cumulativeDistribution(d2);
  const n_d1 = normalDensity(d1);

  let price: number;
  let delta: number;
  let theta: number;
  let rho: number;

  const expRT = Math.exp(-r * T);

  if (isCall) {
    price = S * N_d1 - K * expRT * N_d2;
    delta = N_d1;
    theta =
      (- (S * n_d1 * v) / (2 * Math.sqrt(T)) - r * K * expRT * N_d2) / 365;
    rho = (K * T * expRT * N_d2) / 100;
  } else {
    const N_minus_d1 = cumulativeDistribution(-d1);
    const N_minus_d2 = cumulativeDistribution(-d2);
    price = K * expRT * N_minus_d2 - S * N_minus_d1;
    delta = N_minus_d1 - 1;
    theta =
      (- (S * n_d1 * v) / (2 * Math.sqrt(T)) + r * K * expRT * N_minus_d2) / 365;
    rho = (-K * T * expRT * N_minus_d2) / 100;
  }

  const gamma = n_d1 / (S * v * Math.sqrt(T));
  const vega = (S * Math.sqrt(T) * n_d1) / 100;

  return {
    price: Math.max(0, price),
    delta,
    gamma,
    theta,
    vega,
    rho,
  };
}
