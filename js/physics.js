/* =================================================================
   KELVIN — physics.js
   PURE FUNCTIONS ONLY. No DOM, no canvas, no globals besides the
   export below. Every numeric formula used anywhere on the site
   lives here — rendering modules must never inline a formula.

   Exposed as window.KelvinPhysics (browser) and module.exports
   (Node, for test/physics.test.js) via the dual-export footer.
   ================================================================= */

(function (root) {
  'use strict';

  // ---------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------
  var ABS_ZERO_C = -273.15;
  var k_B = 1.380649e-23;        // J/K, exact (2019 SI redefinition)
  var h = 6.62607015e-34;        // J·s, exact
  var c = 299792458;             // m/s, exact
  var R = 8.314462618;           // J/(mol·K)
  var SIGMA = 5.670374419e-8;    // W/(m^2 K^4), Stefan-Boltzmann
  var WIEN_B = 2.897771955e-3;   // m·K, Wien displacement constant
  var N_A = 6.02214076e23;       // 1/mol, exact
  var SECONDS_PER_YEAR = 3.15576e7;

  // ---------------------------------------------------------------
  // Small generic helpers
  // ---------------------------------------------------------------
  function clamp(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ---------------------------------------------------------------
  // Temperature conversions
  // ---------------------------------------------------------------
  function cToK(x) { return x + 273.15; }
  function kToC(x) { return x - 273.15; }
  function cToF(x) { return x * 9 / 5 + 32; }
  function fToC(x) { return (x - 32) * 5 / 9; }
  function kToF(x) { return cToF(kToC(x)); }
  function fToK(x) { return cToK(fToC(x)); }

  // ---------------------------------------------------------------
  // Kinetic theory — RMS molecular speed
  // v_rms = sqrt(3RT/M), M = molar mass in kg/mol
  // N2, M = 0.028 kg/mol -> ~517 m/s at 300 K
  // ---------------------------------------------------------------
  function vRms(T, M) {
    if (T <= 0 || M <= 0) return 0;
    return Math.sqrt(3 * R * T / M);
  }

  // ---------------------------------------------------------------
  // Charles's law — V = slope * (T_C + 273.15). Every slope crosses
  // V = 0 at the same -273.15 C intercept, which is the whole point
  // of the chart this feeds.
  // ---------------------------------------------------------------
  function charlesVolume(tempC, slope) {
    return slope * (tempC + 273.15);
  }

  // ---------------------------------------------------------------
  // Carnot efficiency — eta = 1 - Tc/Th, both in Kelvin.
  // Guarded: undefined/negative Th, or Tc >= Th (no engine possible)
  // both read as 0 rather than a negative or infinite number.
  // ---------------------------------------------------------------
  function carnotEfficiency(Th, Tc) {
    if (Th <= 0 || Tc >= Th) return 0;
    return 1 - Tc / Th;
  }

  // ---------------------------------------------------------------
  // Joule-Thomson (van der Waals approximation)
  // ---------------------------------------------------------------
  function inversionTemperature(a, b) {
    if (b <= 0) return 0;
    return 2 * a / (R * b);
  }

  // mu_JT = (1/Cp) * (2a/RT - b) — positive (cools on throttling)
  // below the inversion temperature, negative (heats) above it.
  function jouleThomsonCoefficient(T, a, b, Cp) {
    if (T <= 0 || Cp <= 0) return 0;
    return (1 / Cp) * (2 * a / (R * T) - b);
  }

  // ---------------------------------------------------------------
  // erfc — complementary error function.
  // Abramowitz & Stegun 7.1.26 rational approximation (|error| < 1.5e-7).
  // ---------------------------------------------------------------
  function erfc(z) {
    var sign = z < 0 ? -1 : 1;
    var x = Math.abs(z);
    var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    var t = 1 / (1 + p * x);
    var poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
    var erf = 1 - poly * Math.exp(-x * x);
    if (sign < 0) erf = -erf;
    return 1 - erf;
  }

  // ---------------------------------------------------------------
  // Cable — Kelvin's law of squares. Semi-infinite RC line, step
  // input. delay ~ r*c*L^2/2 (r, c per-unit-length resistance /
  // capacitance); response is a function of the same diffusion
  // variable, 1 at t -> infinity, 0 at t -> 0.
  // ---------------------------------------------------------------
  function cableDelay(L, r, c_) {
    return r * c_ * L * L / 2;
  }

  function cableStepResponse(x, t, r, c_) {
    if (t <= 0) return 0;
    return erfc(x * Math.sqrt(r * c_ / (4 * t)));
  }

  // ---------------------------------------------------------------
  // Blackbody radiation
  // ---------------------------------------------------------------
  function planck(lambda, T) {
    if (lambda <= 0 || T <= 0) return 0;
    var num = 2 * h * c * c / Math.pow(lambda, 5);
    var expTerm = Math.exp(h * c / (lambda * k_B * T));
    return num / (expTerm - 1);
  }

  function rayleighJeans(lambda, T) {
    if (lambda <= 0) return 0;
    return 2 * c * k_B * T / Math.pow(lambda, 4);
  }

  function wienPeak(T) {
    if (T <= 0) return 0;
    return WIEN_B / T;
  }

  // ---------------------------------------------------------------
  // Tides — harmonic constituents, periods in hours (exact values).
  // ---------------------------------------------------------------
  var TIDAL_CONSTITUENTS = [
    { id: 'M2', name: 'Principal lunar semidiurnal', period: 12.4206012, amp: 1.00 },
    { id: 'S2', name: 'Principal solar semidiurnal', period: 12.0, amp: 0.46 },
    { id: 'N2', name: 'Larger lunar elliptic', period: 12.6583475, amp: 0.19 },
    { id: 'K1', name: 'Lunisolar diurnal', period: 23.9344697, amp: 0.58 },
    { id: 'O1', name: 'Principal lunar diurnal', period: 25.8193417, amp: 0.41 },
    { id: 'P1', name: 'Principal solar diurnal', period: 24.0658902, amp: 0.19 }
  ];

  function tideSum(constituents, tHours) {
    var sum = 0;
    for (var i = 0; i < constituents.length; i++) {
      var con = constituents[i];
      var phase = con.phase || 0;
      sum += con.amp * Math.cos(2 * Math.PI * tHours / con.period + phase);
    }
    return sum;
  }

  // beat period between two constituents' periods (hours) -> hours.
  // M2 vs S2: 1/|1/12.4206012 - 1/12| -> ~354.37 h ~= 14.77 days.
  function beatPeriod(p1, p2) {
    var diff = Math.abs(1 / p1 - 1 / p2);
    if (diff === 0) return Infinity;
    return 1 / diff;
  }

  // ---------------------------------------------------------------
  // Kelvin's cooling-Earth age — semi-infinite solid, surface held
  // at 0, initial uniform temperature T0. age (seconds) such that
  // the geothermal gradient at the surface matches `gradient`.
  //   age = T0^2 / (pi * kappa * gradient^2)
  // Kelvin's own 1862 figures: T0=3900 K, gradient=0.0365 K/m,
  // kappa=1.2e-6 m^2/s -> ~9.6e7 years.
  // ---------------------------------------------------------------
  function kelvinEarthAge(T0, gradient, kappa) {
    if (gradient === 0 || kappa <= 0) return 0;
    return (T0 * T0) / (Math.PI * kappa * gradient * gradient);
  }

  // ---------------------------------------------------------------
  // Instrument mechanisms (ch. 06/07) — two small, genuine formulas
  // with no other home: the water dropper's positive-feedback
  // charge buildup, and the mirror galvanometer's optical lever.
  // ---------------------------------------------------------------

  // Kelvin water dropper — each falling drop induces slightly more
  // charge on the opposite can than the last drop did, so the
  // voltage races away exponentially with time (positive feedback)
  // until a spark discharges it. tau is the feedback time-constant —
  // smaller tau means faster growth, i.e. a higher drop rate in the
  // physical device. Unitless "voltage" proxy, 0 at t=0.
  function dropperVoltage(t, tau) {
    if (t <= 0 || tau <= 0) return 0;
    return Math.exp(t / tau) - 1;
  }

  // Mirror galvanometer — the optical lever. A current rotates the
  // suspended mirror by theta = current * sensitivity; reflection
  // doubles that rotation in the reflected beam (angle of incidence
  // = angle of reflection), and a long lever arm (the distance to
  // the scale) turns the doubled angle into a large displacement.
  function galvanometerDeflection(current, sensitivity, armLength) {
    var theta = current * sensitivity;
    return armLength * Math.tan(2 * theta);
  }

  // ---------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------
  var api = {
    // constants
    ABS_ZERO_C: ABS_ZERO_C, k_B: k_B, h: h, c: c, R: R, SIGMA: SIGMA,
    WIEN_B: WIEN_B, N_A: N_A, SECONDS_PER_YEAR: SECONDS_PER_YEAR,
    TIDAL_CONSTITUENTS: TIDAL_CONSTITUENTS,

    // helpers
    clamp: clamp, lerp: lerp,

    // temperature
    cToK: cToK, kToC: kToC, cToF: cToF, fToC: fToC, kToF: kToF, fToK: fToK,

    // kinetic theory / gas laws
    vRms: vRms, charlesVolume: charlesVolume, carnotEfficiency: carnotEfficiency,

    // Joule-Thomson
    inversionTemperature: inversionTemperature,
    jouleThomsonCoefficient: jouleThomsonCoefficient,

    // cable
    erfc: erfc, cableDelay: cableDelay, cableStepResponse: cableStepResponse,

    // blackbody
    planck: planck, rayleighJeans: rayleighJeans, wienPeak: wienPeak,

    // tides
    tideSum: tideSum, beatPeriod: beatPeriod,

    // earth age
    kelvinEarthAge: kelvinEarthAge,

    // instrument mechanisms
    dropperVoltage: dropperVoltage,
    galvanometerDeflection: galvanometerDeflection
  };

  root.KelvinPhysics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

})(typeof window !== 'undefined' ? window : this);
