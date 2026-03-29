/**
 * SDRP Constants — American Crop Recovery Platform
 * Reference: 1-SDRP Amendment 2, March 18, 2026
 */

// ============================================================
// PROGRAM DATES
// ============================================================

export const SDRP_DATES = {
  stage1SignupStart: '2025-07-10',
  stage2SignupStart: '2025-11-24',
  signupDeadline: '2026-04-30',
  authoritySignedDate: '2024-12-21',
} as const;

// ============================================================
// PAYMENT FACTORS
// ============================================================

/** All Stage 2 payments multiplied by this (Par. 244) */
export const STAGE2_PAYMENT_FACTOR = 0.35;

/** All Stage 1 payments multiplied by this (Par. 85C) */
export const STAGE1_PAYMENT_FACTOR = 0.35;

// ============================================================
// PAYMENT LIMITS (Par. 26)
// ============================================================

export const PAYMENT_LIMITS = {
  base: {
    specialtyHighValue: 125_000,
    otherCrops: 125_000,
  },
  enhanced: {
    specialtyHighValue: 900_000,
    otherCrops: 250_000,
  },
  enhancedAGIThreshold: 75, // Percent of AGI from farming
} as const;

// ============================================================
// SDRP FACTORS BY COVERAGE LEVEL (Par. 85B)
// ============================================================

export const SDRP_FACTORS_INSURED: [number, number, number][] = [
  // [minCoverage, maxCoverage, factor]
  [0,   0,  0.75],   // CAT
  [1,  54,  0.80],
  [55, 59,  0.825],
  [60, 64,  0.85],
  [65, 69,  0.875],
  [70, 74,  0.90],
  [75, 79,  0.925],
  [80, 100, 0.95],
];

export const SDRP_FACTORS_NAP: Record<number, number> = {
  0:  0.75,  // CAT
  50: 0.80,
  55: 0.85,
  60: 0.90,
  65: 0.95,
};

export const SDRP_FACTOR_UNINSURED = 0.70;

// ============================================================
// LINKAGE REQUIREMENTS (Par. 14)
// ============================================================

export const LINKAGE_COVERAGE_LEVEL = '60/100';
export const LINKAGE_YEARS_REQUIRED = 2;

// ============================================================
// DOCUMENT RETENTION (Par. 4G)
// ============================================================

export const DOCUMENT_RETENTION_YEARS = 3;

// ============================================================
// SUPPORTING DOC DEADLINE (Par. 66B)
// ============================================================

export const SUPPORTING_DOC_DEADLINE_DAYS = 60;

// ============================================================
// QUALIFYING DISASTER EVENTS (Par. 27B)
// ============================================================

export const QUALIFYING_DISASTER_EVENTS = [
  { value: 'qualifying_drought', label: 'Qualifying Drought', note: 'D2 for 8 consecutive weeks or D3+' },
  { value: 'derecho', label: 'Derecho', relatedConditions: ['excessive_wind'] },
  { value: 'excessive_heat', label: 'Excessive Heat' },
  { value: 'excessive_moisture', label: 'Excessive Moisture' },
  { value: 'flooding', label: 'Flooding', relatedConditions: ['silt_and_debris'] },
  { value: 'freeze', label: 'Freeze (including Polar Vortex)' },
  { value: 'hurricane', label: 'Hurricane (must be named)', relatedConditions: ['excessive_wind', 'storm_surge', 'tropical_storm', 'tropical_depression'] },
  { value: 'smoke_exposure', label: 'Smoke Exposure' },
  { value: 'tornado', label: 'Tornado' },
  { value: 'wildfire', label: 'Wildfire' },
  { value: 'winter_storm', label: 'Winter Storm', relatedConditions: ['excessive_wind', 'blizzard'] },
] as const;

// ============================================================
// BLOCK GRANT STATES (Par. 29F)
// ============================================================

export const BLOCK_GRANT_STATES = ['HI', 'CT', 'MA', 'ME'] as const;

// ============================================================
// CROPS EXCLUDED FROM STAGE 1 (Par. 47F)
// ============================================================

export const STAGE1_EXCLUDED_CROPS = [
  'crops intended for grazing',
  'volunteer crops',
  'experimental crops',
  'by-products (e.g., cotton seed)',
  'first year seeding of forage crops',
  'tobacco (in counties without insurance)',
  'banana plants',
] as const;

// ============================================================
// VALUE LOSS CROPS (Par. 132B)
// ============================================================

export const VALUE_LOSS_CROPS = [
  'Christmas trees',
  'Aquaculture (including tropical fish)',
  'Cut flowers',
  'Mushrooms',
  'Ornamental nursery',
  'Turfgrass sod',
] as const;

// ============================================================
// CROP YEAR DEFINITIONS FOR VALUE LOSS (Par. 132D)
// ============================================================

export const VALUE_LOSS_CROP_YEARS: Record<string, string> = {
  'insured clams': 'December 1 through November 30',
  'nursery': 'June 1 through May 31',
  'other value loss': 'October 1 through September 30',
};

// ============================================================
// ELIGIBLE RMA PLAN CODES (Par. 49C)
// ============================================================

export const ELIGIBLE_RMA_PLAN_CODES = [
  { code: 1,  name: 'Yield Protection', category: 'aph_yield' },
  { code: 2,  name: 'Revenue Protection', category: 'aph_yield' },
  { code: 3,  name: 'Revenue Protection – HPE', category: 'aph_yield' },
  { code: 4,  name: 'Area Yield Protection', category: 'area_based' },
  { code: 5,  name: 'Area Revenue Protection', category: 'area_based' },
  { code: 6,  name: 'Area Revenue Protection – HPE', category: 'area_based' },
  { code: 13, name: 'Rainfall Index', category: 'area_based' },
  { code: 21, name: 'PRH Yield Protection', category: 'aph_yield' },
  { code: 22, name: 'PRH Plus', category: 'aph_yield' },
  { code: 23, name: 'PRH Revenue', category: 'aph_yield' },
  { code: 35, name: 'STAX (base only)', category: 'area_based' },
  { code: 36, name: 'STAX – HPE (base only)', category: 'area_based' },
  { code: 40, name: 'Tree Based Dollar Amount', category: 'tree_vine' },
  { code: 41, name: 'Pecan Revenue', category: 'dollar_revenue' },
  { code: 43, name: 'Aquaculture Dollar Plan', category: 'dollar_revenue' },
  { code: 47, name: 'Actual Revenue History', category: 'dollar_revenue' },
  { code: 50, name: 'Dollar Amount of Insurance', category: 'dollar_revenue' },
  { code: 51, name: 'Fixed Dollar Amount', category: 'dollar_revenue' },
  { code: 55, name: 'Yield-Based Dollar Amount', category: 'dollar_revenue' },
  { code: 76, name: 'WFRP/Micro Farm', category: 'dollar_revenue' },
  { code: 90, name: 'Actual Production History', category: 'aph_yield' },
  { code: 91, name: 'APH – Price Component', category: 'aph_yield' },
] as const;

// ============================================================
// INELIGIBLE POLICIES (Par. 49E)
// ============================================================

export const INELIGIBLE_POLICIES = [
  'Forage seeding policies',
  'Policies for crops with intended use of grazing',
  'Livestock policies',
  'Controlled environment policies',
  'Margin protection plan policies',
  'Banana plants under Hawaii Tropical Trees',
  'Supplemental endorsements with base policy',
  'Cottonseed endorsements',
  'Policies issued in Puerto Rico (Stage 1 only)',
] as const;

// ============================================================
// WIZARD STEPS
// ============================================================

export const WIZARD_STEPS = [
  { key: 'welcome',            label: 'Personal Info',       number: 1 },
  { key: 'farm_info',          label: 'Farm Details',        number: 2 },
  { key: 'weather_events',     label: 'Disaster Events',     number: 3 },
  { key: 'crops_coverage',     label: 'Crops & Coverage',    number: 4 },
  { key: 'document_upload',    label: 'Documents',           number: 5 },
  { key: 'trees_bushes_vines', label: 'Trees/Bushes/Vines',  number: 6, conditional: true },
  { key: 'review_submit',      label: 'Review & Submit',     number: 7 },
] as const;

// ============================================================
// FUNDING
// ============================================================

export const TOTAL_FUNDING_BILLIONS = 30.78;
export const AUTHORITY = 'American Relief Act, 2025 (Pub. L. 118-158)';
export const REGULATIONS = '7 CFR Part 760, Subpart V';
