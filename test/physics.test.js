/* physics.test.js — every formula in js/physics.js, exercised.
   Zero dependencies. node test/physics.test.js prints PASS/FAIL per
   assertion and exits non-zero on any failure (Contour/pac-game style). */
'use strict';

var P = require('../js/physics.js');
var t = require('./_assert.js').suite('PHYSICS');

// -----------------------------------------------------------------
// Temperature conversions
// -----------------------------------------------------------------
t.near(P.cToK(0), 273.15, 1e-9, 'cToK(0) = 273.15');
t.near(P.cToK(100), 373.15, 1e-9, 'cToK(100) = 373.15');
t.near(P.kToC(273.15), 0, 1e-9, 'kToC(273.15) = 0');
t.near(P.kToC(373.15), 100, 1e-9, 'kToC(373.15) = 100');
t.near(P.kToC(P.cToK(37)), 37, 1e-9, 'C->K->C round-trip');
t.near(P.fToC(P.cToF(98.6)), 98.6, 1e-9, 'C->F->C round-trip');
t.near(P.kToF(P.fToK(72)), 72, 1e-6, 'F->K->F round-trip');
// the famous crossover: -40 C === -40 F
t.near(P.cToF(-40), -40, 1e-9, '-40 C = -40 F (cToF)');
t.near(P.fToC(-40), -40, 1e-9, '-40 F = -40 C (fToC)');

// -----------------------------------------------------------------
// vRms — kinetic theory
// -----------------------------------------------------------------
var vN2_300 = P.vRms(300, 0.028);
t.near(vN2_300, 517, 2, 'vRms(N2, 300K) ~= 517 m/s');
var vN2_1200 = P.vRms(1200, 0.028);
t.near(vN2_1200 / vN2_300, 2, 1e-6, 'vRms scales as sqrt(T): 4x T -> 2x v');
t.eq(P.vRms(0, 0.028), 0, 'vRms(0 K) = 0 — molecules stop at absolute zero');

// -----------------------------------------------------------------
// Charles's law — every slope shares the same -273.15 C intercept
// -----------------------------------------------------------------
[1, 3, 7, 12.5].forEach(function (slope) {
  t.near(P.charlesVolume(-273.15, slope), 0, 1e-9,
    'charlesVolume(-273.15, slope=' + slope + ') = 0');
});
t.ok(P.charlesVolume(0, 2) > 0, 'charlesVolume above absolute zero is positive');

// -----------------------------------------------------------------
// carnotEfficiency — bounds + guards
// -----------------------------------------------------------------
t.near(P.carnotEfficiency(400, 300), 0.25, 1e-9, 'carnotEfficiency(400,300) = 0.25');
t.eq(P.carnotEfficiency(400, 0), 1, 'carnotEfficiency(Th,0) -> 1 (Tc->0 limit)');
t.eq(P.carnotEfficiency(300, 400), 0, 'Tc >= Th guard returns 0, not negative');
t.eq(P.carnotEfficiency(300, 300), 0, 'Tc === Th guard returns 0');
t.eq(P.carnotEfficiency(0, 100), 0, 'Th <= 0 guard returns 0');
t.eq(P.carnotEfficiency(-10, -50), 0, 'negative Th guard returns 0');
var effs = [P.carnotEfficiency(1000, 900), P.carnotEfficiency(1000, 500), P.carnotEfficiency(1000, 100)];
t.ok(effs[0] < effs[1] && effs[1] < effs[2], 'efficiency rises as Tc falls toward 0');

// -----------------------------------------------------------------
// Joule-Thomson — sign flip at the van der Waals inversion temperature
// -----------------------------------------------------------------
var a = 0.14, b = 3.9e-5, Cp = 29;
var Tinv = P.inversionTemperature(a, b);
t.ok(Tinv > 0, 'inversionTemperature > 0 for physical a,b');
t.ok(P.jouleThomsonCoefficient(Tinv * 0.5, a, b, Cp) > 0,
  'JT coefficient positive below inversion temperature (cools on throttling)');
t.ok(P.jouleThomsonCoefficient(Tinv * 1.5, a, b, Cp) < 0,
  'JT coefficient negative above inversion temperature (heats on throttling)');
t.near(P.jouleThomsonCoefficient(Tinv, a, b, Cp), 0, 1e-9,
  'JT coefficient is exactly 0 at the inversion temperature');

// -----------------------------------------------------------------
// erfc — Abramowitz & Stegun 7.1.26 approximation
// -----------------------------------------------------------------
t.near(P.erfc(0), 1, 1e-6, 'erfc(0) ~= 1');
t.near(P.erfc(1), 0.1572992070502851, 1e-4, 'erfc(1) matches reference value');
t.near(P.erfc(0.5), 0.4795001221869535, 1e-4, 'erfc(0.5) matches reference value');
t.near(P.erfc(-1), 1.8427007929497149, 1e-4, 'erfc(-1) matches reference value (odd symmetry)');
t.ok(P.erfc(5) < 1e-9, 'erfc(large z) -> ~0');

// -----------------------------------------------------------------
// Cable — Kelvin's law of squares: delay ~ L^2
// -----------------------------------------------------------------
var d1 = P.cableDelay(1, 1, 1), d2 = P.cableDelay(2, 1, 1);
t.near(d2 / d1, 4, 1e-9, 'cableDelay quadruples when L doubles');
var d3 = P.cableDelay(3, 0.02, 5e-8), d6 = P.cableDelay(6, 0.02, 5e-8);
t.near(d6 / d3, 4, 1e-9, 'cableDelay ratio holds at different r,c too');

// cableStepResponse: 0 as t -> 0+, -> 1 as t -> infinity
t.eq(P.cableStepResponse(1, 0, 1, 1), 0, 'cableStepResponse(t=0) = 0 (guarded)');
t.ok(P.cableStepResponse(1, 1e-9, 1, 1) < 0.01, 'cableStepResponse(t tiny) ~= 0');
t.ok(P.cableStepResponse(1, 1e12, 1, 1) > 0.999, 'cableStepResponse(t huge) ~= 1');

// -----------------------------------------------------------------
// Blackbody radiation — Planck vs Rayleigh-Jeans
// -----------------------------------------------------------------
var plLong = P.planck(1.0, 300), rjLong = P.rayleighJeans(1.0, 300);
t.near(plLong / rjLong, 1, 0.01, 'Planck and Rayleigh-Jeans agree within 1% at long wavelength');

var plUV = P.planck(500e-9, 300), rjUV = P.rayleighJeans(500e-9, 300);
t.ok(rjUV / plUV > 10, 'Rayleigh-Jeans diverges from Planck by >10x in the UV (the catastrophe)');

// Wien's law: the numerically-found peak of planck(lambda,T) satisfies
// lambda_max * T ~= WIEN_B to within 0.5%.
(function () {
  var T = 2.725; // CMB, keeps the peak wavelength in a scannable range
  var best = -1, bestLambda = 0;
  for (var lam = 1e-4; lam <= 1e-2; lam += 1e-6) {
    var v = P.planck(lam, T);
    if (v > best) { best = v; bestLambda = lam; }
  }
  var product = bestLambda * T;
  var relErr = Math.abs(product - P.WIEN_B) / P.WIEN_B;
  t.ok(relErr < 0.005, 'Planck peak satisfies Wien\'s law to 0.5% (rel err ' + relErr.toFixed(5) + ')');
})();

t.near(P.wienPeak(P.WIEN_B / 1), 1, 1e-9, 'wienPeak is WIEN_B/T by construction');

// -----------------------------------------------------------------
// Tides — M2/S2 spring-neap beat ~= 14.77 days
// -----------------------------------------------------------------
var m2 = P.TIDAL_CONSTITUENTS.filter(function (x) { return x.id === 'M2'; })[0];
var s2 = P.TIDAL_CONSTITUENTS.filter(function (x) { return x.id === 'S2'; })[0];
t.ok(m2 && s2, 'M2 and S2 constituents present');
var beatHours = P.beatPeriod(m2.period, s2.period);
t.near(beatHours / 24, 14.77, 0.02, 'M2/S2 beat period ~= 14.77 days');

// tideSum sanity: single constituent at t=0 with no phase reduces to its amplitude
var single = [{ id: 'X', period: 12, amp: 2.5 }];
t.near(P.tideSum(single, 0), 2.5, 1e-9, 'tideSum single constituent at t=0 = amplitude');
// a full period later, back to the same value
t.near(P.tideSum(single, 12), 2.5, 1e-6, 'tideSum periodic: back to start after one full period');

// -----------------------------------------------------------------
// Kelvin's cooling-Earth age — his own 1862 figures land in 90-100 My
// -----------------------------------------------------------------
var ageSeconds = P.kelvinEarthAge(3900, 0.0365, 1.2e-6);
var ageYears = ageSeconds / P.SECONDS_PER_YEAR;
t.ok(ageYears > 90e6 && ageYears < 100e6,
  'kelvinEarthAge(his 1862 figures) lands in 90-100 My, got ' + (ageYears / 1e6).toFixed(2) + ' My');

// -----------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------
t.eq(P.clamp(5, 0, 10), 5, 'clamp passes through mid-range value');
t.eq(P.clamp(-5, 0, 10), 0, 'clamp floors below min');
t.eq(P.clamp(15, 0, 10), 10, 'clamp ceils above max');
t.eq(P.lerp(0, 10, 0.5), 5, 'lerp midpoint');
t.eq(P.lerp(10, 20, 0), 10, 'lerp t=0 returns a');
t.eq(P.lerp(10, 20, 1), 20, 'lerp t=1 returns b');

// -----------------------------------------------------------------
// Instrument mechanisms — water dropper feedback, optical lever.
// -----------------------------------------------------------------
t.eq(P.dropperVoltage(0, 2), 0, 'water dropper starts at zero charge');
t.eq(P.dropperVoltage(-1, 2), 0, 'water dropper guards negative time');
t.eq(P.dropperVoltage(1, 0), 0, 'water dropper guards zero tau');
t.ok(P.dropperVoltage(2, 2) > P.dropperVoltage(1, 2),
  'water dropper voltage grows with time (positive feedback)');
t.ok(P.dropperVoltage(4, 2) - P.dropperVoltage(3, 2) >
     P.dropperVoltage(2, 2) - P.dropperVoltage(1, 2),
  'water dropper growth accelerates — it is feedback, not a ramp');

t.eq(P.galvanometerDeflection(0, 1, 1), 0, 'no current means no deflection');
t.near(P.galvanometerDeflection(0.01, 1, 1), Math.tan(0.02), 1e-9,
  'optical lever doubles the mirror angle on reflection');
t.ok(P.galvanometerDeflection(1e-6, 5e4, 2) > 0,
  'a microamp still produces a readable deflection on a long arm');

// -----------------------------------------------------------------
// Export shape — both module.exports and window are set (smoke check
// that the dual-export footer pattern is intact for this file).
// -----------------------------------------------------------------
t.ok(typeof P === 'object', 'physics.js exports an object via module.exports');
t.ok(typeof P.vRms === 'function', 'vRms is a function on the export');

t.done();
