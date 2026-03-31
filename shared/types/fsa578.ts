/**
 * FSA-578 (Report of Acreage) — Complete Column Definitions
 * American Crop Recovery Platform
 *
 * Reference: FSA Handbook 2-CP (Revised), Exhibit 15
 * The FSA-578 is the official acreage report filed by producers.
 * Every column must be captured when a farmer draws a polygon on the map.
 *
 * This file defines the complete FSA-578 data model used in Step 4
 * (Crops & Coverage) of the SDRP wizard.
 */

// ============================================================
// FSA-578 RECORD — One row per crop/field combination
// ============================================================

export interface FSA578Record {
  id: string;

  // --- Administrative Location ---
  /** State FSA code (2-digit) */
  adminStateCode: string;
  /** State name */
  adminState: string;
  /** County FSA code (3-digit) */
  adminCountyCode: string;
  /** County name */
  adminCounty: string;

  // --- Farm/Tract/Field Identification (Columns 1-3) ---
  /** FSA Farm Serial Number */
  farmNumber: string;
  /** Tract Number */
  tractNumber: string;
  /** Field Number (CLU ID from Common Land Unit) */
  fieldNumber: string;
  /** Sub-field designation (if split) */
  subFieldId?: string;

  // --- Crop Information (Columns 4-8) ---
  /** Crop name (e.g., "Corn", "Soybeans", "Cotton") */
  cropName: string;
  /** Crop code (FSA/RMA crop code) */
  cropCode?: string;
  /** Crop type/variety (e.g., "Yellow", "Upland") */
  cropType?: string;
  /** Crop type code */
  cropTypeCode?: string;
  /** Intended use (e.g., "Grain", "Silage", "Seed", "Grazing") */
  intendedUse: string;
  /** Intended use code */
  intendedUseCode?: string;
  /** Practice type (e.g., "Irrigated", "Non-Irrigated", "Organic") */
  practiceType: string;
  /** Practice code */
  practiceCode?: string;

  // --- Planting Information (Columns 9-11) ---
  /** Planting date (YYYY-MM-DD) */
  plantingDate?: string;
  /** Final planting date for the crop/county */
  finalPlantingDate?: string;
  /** Late planting indicator */
  isLatePlanted?: boolean;
  /** Prevented planted indicator */
  isPreventedPlanted: boolean;
  /** Prevented planted acreage (if applicable) */
  preventedPlantedAcres?: number;

  // --- Acreage (Columns 12-16) ---
  /** Total reported acreage for this crop/field */
  reportedAcres: number;
  /** Net determined acreage (after COC review) */
  determinedAcres?: number;
  /** CLU calculated acreage (from GIS) */
  cluAcres?: number;
  /** Cropland acreage on the field */
  croplandAcres?: number;
  /** Total field acreage (including non-cropland) */
  totalFieldAcres?: number;

  // --- Shares (Column 17) ---
  /** Producer's share percentage (0-100) */
  sharePercent: number;
  /** Share type (e.g., "Owner", "Tenant", "Sharecrop") */
  shareType?: 'owner' | 'tenant' | 'sharecrop' | 'other';

  // --- Insurance/Coverage (Columns 18-22) ---
  /** RMA policy number */
  rmaPolicyNumber?: string;
  /** RMA unit number */
  rmaUnitNumber?: string;
  /** Insurance plan code */
  insurancePlanCode?: number;
  /** Coverage level percentage */
  coverageLevelPercent?: number;
  /** NAP coverage indicator */
  hasNAPCoverage: boolean;
  /** NAP policy number */
  napPolicyNumber?: string;

  // --- Organic Status (Column 23) ---
  /** Organic certification status */
  organicStatus: 'certified_organic' | 'transitional' | 'conventional' | 'exempt' | 'buffer_zone';
  /** Organic certifier name */
  organicCertifier?: string;
  /** Organic certification number */
  organicCertificationNumber?: string;
  /** Organic certification date */
  organicCertificationDate?: string;

  // --- Native Sod (Column 24) ---
  /** Native sod indicator (first time broken out) */
  isNativeSod: boolean;
  /** Date native sod was broken */
  nativeSodBreakDate?: string;

  // --- Crop Year & Season (Column 25) ---
  /** Crop year */
  cropYear: 2023 | 2024 | 2025;
  /** Crop season (spring, fall, winter, etc.) */
  season?: 'spring' | 'fall' | 'winter' | 'summer' | 'annual';

  // --- Production Evidence (Columns 26-28) ---
  /** Expected yield per acre */
  expectedYield?: number;
  /** Approved APH yield */
  aphYield?: number;
  /** T-yield (transitional yield) */
  tYield?: number;
  /** Unit of measure for yield */
  yieldUnitOfMeasure?: string;
  /** Production reported */
  reportedProduction?: number;

  // --- Multi-County / Multi-Planting ---
  /** Whether crop spans multiple counties */
  isMultiCounty: boolean;
  /** Related county codes if multi-county */
  relatedCountyCodes?: string[];
  /** Whether this is a double-crop */
  isDoubleCrop: boolean;
  /** Prior crop if double-cropped */
  priorCrop?: string;
  /** Whether this is a subsequent crop (relay, double, etc.) */
  isSubsequentCrop: boolean;

  // --- Conservation & Compliance ---
  /** Highly erodible land (HEL) indicator */
  isHEL: boolean;
  /** Wetland indicator */
  isWetland: boolean;
  /** CRP (Conservation Reserve Program) contract number */
  crpContractNumber?: string;

  // --- Geospatial Data (from map polygon) ---
  /** GeoJSON polygon geometry drawn by the farmer */
  geometry?: GeoJSONPolygon;
  /** Calculated acreage from polygon */
  calculatedPolygonAcres?: number;
  /** Centroid coordinates [lng, lat] */
  centroid?: [number, number];
  /** CLU boundary (if available from FSA GIS) */
  cluBoundary?: GeoJSONPolygon;

  // --- Status & Metadata ---
  /** Record status */
  status: 'reported' | 'filed' | 'determined' | 'revised' | 'void';
  /** Filing date */
  filingDate?: string;
  /** Determination date (COC action) */
  determinationDate?: string;
  /** Remarks/comments */
  remarks?: string;

  // --- Source & Linkage ---
  /** Source of data */
  source: 'manual_entry' | 'fsa_import' | 'rma_import' | 'document_extraction' | 'map_drawn';
  /** Linked CropUnit ID in the SDRP application */
  linkedCropUnitId?: string;
  /** Original FSA-578 document ID (if uploaded) */
  sourceDocumentId?: string;
}

// ============================================================
// GeoJSON Types for Map Polygons
// ============================================================

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];  // [[[lng, lat], [lng, lat], ...]]
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONPolygon;
  properties: FSA578FieldCardProperties;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ============================================================
// FIELD CARD — UI representation when polygon is drawn
// ============================================================

/**
 * Properties displayed in a field card when a farmer draws a polygon
 * on the Step 4 map. Each polygon = one field card = one FSA-578 row.
 */
export interface FSA578FieldCardProperties {
  /** Unique card ID */
  cardId: string;

  // --- Identification ---
  farmNumber: string;
  tractNumber: string;
  fieldNumber: string;

  // --- Crop Details ---
  cropName: string;
  cropType?: string;
  intendedUse: string;
  practiceType: string;
  plantingDate?: string;

  // --- Acreage ---
  reportedAcres: number;
  calculatedPolygonAcres: number;
  /** Discrepancy between reported and polygon-calculated */
  acreageDiscrepancy?: number;

  // --- Share ---
  sharePercent: number;

  // --- Coverage ---
  coverageType: 'insured' | 'nap' | 'uninsured';
  insurancePlanCode?: number;
  coverageLevelPercent?: number;
  rmaPolicyNumber?: string;

  // --- Organic/Sod ---
  organicStatus: FSA578Record['organicStatus'];
  isNativeSod: boolean;

  // --- Status Flags ---
  isPreventedPlanted: boolean;
  isDoubleCrop: boolean;
  isMultiCounty: boolean;
  isHEL: boolean;

  // --- Disaster Link ---
  /** Qualifying disaster event for this field */
  disasterEvent?: string;

  // --- Validation ---
  isComplete: boolean;
  missingFields: string[];
}

// ============================================================
// FSA-578 SUMMARY — Aggregated view for the application
// ============================================================

export interface FSA578Summary {
  /** Total reported acreage across all fields */
  totalReportedAcres: number;
  /** Total polygon-calculated acreage */
  totalCalculatedAcres: number;
  /** Number of fields/polygons */
  fieldCount: number;
  /** Number of unique crops */
  uniqueCropCount: number;
  /** Crops by acreage (for display) */
  cropBreakdown: Array<{
    cropName: string;
    acres: number;
    fieldCount: number;
    coverageType: 'insured' | 'nap' | 'uninsured';
  }>;
  /** Any validation warnings */
  warnings: string[];
  /** All FSA-578 records */
  records: FSA578Record[];
}

// ============================================================
// FSA-578 COLUMN LABELS — For UI rendering
// ============================================================

export const FSA578_COLUMN_LABELS: Record<keyof FSA578Record, string> = {
  id: 'Record ID',
  adminStateCode: 'State Code',
  adminState: 'State',
  adminCountyCode: 'County Code',
  adminCounty: 'County',
  farmNumber: 'Farm Number',
  tractNumber: 'Tract Number',
  fieldNumber: 'Field Number',
  subFieldId: 'Sub-Field ID',
  cropName: 'Crop Name',
  cropCode: 'Crop Code',
  cropType: 'Crop Type/Variety',
  cropTypeCode: 'Crop Type Code',
  intendedUse: 'Intended Use',
  intendedUseCode: 'Intended Use Code',
  practiceType: 'Practice',
  practiceCode: 'Practice Code',
  plantingDate: 'Planting Date',
  finalPlantingDate: 'Final Planting Date',
  isLatePlanted: 'Late Planted',
  isPreventedPlanted: 'Prevented Planted',
  preventedPlantedAcres: 'Prevented Planted Acres',
  reportedAcres: 'Reported Acreage',
  determinedAcres: 'Determined Acreage',
  cluAcres: 'CLU Acreage',
  croplandAcres: 'Cropland Acreage',
  totalFieldAcres: 'Total Field Acreage',
  sharePercent: 'Share %',
  shareType: 'Share Type',
  rmaPolicyNumber: 'RMA Policy Number',
  rmaUnitNumber: 'RMA Unit Number',
  insurancePlanCode: 'Insurance Plan Code',
  coverageLevelPercent: 'Coverage Level %',
  hasNAPCoverage: 'NAP Coverage',
  napPolicyNumber: 'NAP Policy Number',
  organicStatus: 'Organic Status',
  organicCertifier: 'Organic Certifier',
  organicCertificationNumber: 'Organic Cert. Number',
  organicCertificationDate: 'Organic Cert. Date',
  isNativeSod: 'Native Sod',
  nativeSodBreakDate: 'Native Sod Break Date',
  cropYear: 'Crop Year',
  season: 'Season',
  expectedYield: 'Expected Yield',
  aphYield: 'APH Yield',
  tYield: 'T-Yield',
  yieldUnitOfMeasure: 'Yield Unit',
  reportedProduction: 'Reported Production',
  isMultiCounty: 'Multi-County',
  relatedCountyCodes: 'Related Counties',
  isDoubleCrop: 'Double Crop',
  priorCrop: 'Prior Crop',
  isSubsequentCrop: 'Subsequent Crop',
  isHEL: 'Highly Erodible Land',
  isWetland: 'Wetland',
  crpContractNumber: 'CRP Contract Number',
  geometry: 'Map Polygon',
  calculatedPolygonAcres: 'Polygon Acreage',
  centroid: 'Centroid',
  cluBoundary: 'CLU Boundary',
  status: 'Status',
  filingDate: 'Filing Date',
  determinationDate: 'Determination Date',
  remarks: 'Remarks',
  source: 'Data Source',
  linkedCropUnitId: 'Linked Crop Unit',
  sourceDocumentId: 'Source Document',
};

// ============================================================
// REQUIRED FIELDS — Minimum for valid FSA-578 entry
// ============================================================

export const FSA578_REQUIRED_FIELDS: (keyof FSA578Record)[] = [
  'adminStateCode',
  'adminCountyCode',
  'farmNumber',
  'tractNumber',
  'fieldNumber',
  'cropName',
  'intendedUse',
  'practiceType',
  'reportedAcres',
  'sharePercent',
  'organicStatus',
  'isNativeSod',
  'isPreventedPlanted',
  'cropYear',
  'isMultiCounty',
  'isDoubleCrop',
  'isHEL',
  'hasNAPCoverage',
];

// ============================================================
// FIELD CARD SECTIONS — Grouping for UI display
// ============================================================

export const FSA578_FIELD_CARD_SECTIONS = [
  {
    key: 'location',
    label: 'Location & Identification',
    fields: ['adminState', 'adminCounty', 'farmNumber', 'tractNumber', 'fieldNumber', 'subFieldId'],
  },
  {
    key: 'crop',
    label: 'Crop Information',
    fields: ['cropName', 'cropType', 'intendedUse', 'practiceType', 'plantingDate', 'season'],
  },
  {
    key: 'acreage',
    label: 'Acreage',
    fields: ['reportedAcres', 'calculatedPolygonAcres', 'determinedAcres', 'cluAcres', 'croplandAcres', 'totalFieldAcres'],
  },
  {
    key: 'planting',
    label: 'Planting Status',
    fields: ['isPreventedPlanted', 'preventedPlantedAcres', 'isLatePlanted', 'isDoubleCrop', 'priorCrop', 'isSubsequentCrop'],
  },
  {
    key: 'share',
    label: 'Producer Share',
    fields: ['sharePercent', 'shareType'],
  },
  {
    key: 'coverage',
    label: 'Insurance & Coverage',
    fields: ['rmaPolicyNumber', 'rmaUnitNumber', 'insurancePlanCode', 'coverageLevelPercent', 'hasNAPCoverage', 'napPolicyNumber'],
  },
  {
    key: 'organic',
    label: 'Organic & Native Sod',
    fields: ['organicStatus', 'organicCertifier', 'organicCertificationNumber', 'organicCertificationDate', 'isNativeSod', 'nativeSodBreakDate'],
  },
  {
    key: 'production',
    label: 'Yield & Production',
    fields: ['expectedYield', 'aphYield', 'tYield', 'yieldUnitOfMeasure', 'reportedProduction'],
  },
  {
    key: 'conservation',
    label: 'Conservation & Compliance',
    fields: ['isHEL', 'isWetland', 'crpContractNumber'],
  },
] as const;

// ============================================================
// HELPER: Create empty FSA-578 record from polygon
// ============================================================

export function createFSA578RecordFromPolygon(
  geometry: GeoJSONPolygon,
  calculatedAcres: number,
  defaults: {
    adminStateCode: string;
    adminState: string;
    adminCountyCode: string;
    adminCounty: string;
    cropYear: 2023 | 2024 | 2025;
  }
): FSA578Record {
  return {
    id: `fsa578-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    adminStateCode: defaults.adminStateCode,
    adminState: defaults.adminState,
    adminCountyCode: defaults.adminCountyCode,
    adminCounty: defaults.adminCounty,
    farmNumber: '',
    tractNumber: '',
    fieldNumber: '',
    cropName: '',
    intendedUse: '',
    practiceType: '',
    isPreventedPlanted: false,
    reportedAcres: calculatedAcres,
    sharePercent: 100,
    hasNAPCoverage: false,
    organicStatus: 'conventional',
    isNativeSod: false,
    cropYear: defaults.cropYear,
    isMultiCounty: false,
    isDoubleCrop: false,
    isSubsequentCrop: false,
    isHEL: false,
    isWetland: false,
    geometry,
    calculatedPolygonAcres: calculatedAcres,
    centroid: calculateCentroid(geometry),
    status: 'reported',
    source: 'map_drawn',
  };
}

// ============================================================
// HELPER: Calculate polygon centroid
// ============================================================

function calculateCentroid(polygon: GeoJSONPolygon): [number, number] {
  const coords = polygon.coordinates[0]; // Outer ring
  if (!coords || coords.length === 0) return [0, 0];

  let sumLng = 0;
  let sumLat = 0;
  // Exclude closing coordinate (same as first)
  const n = coords.length - 1;
  for (let i = 0; i < n; i++) {
    sumLng += coords[i][0];
    sumLat += coords[i][1];
  }
  return [sumLng / n, sumLat / n];
}

// ============================================================
// HELPER: Calculate polygon area in acres
// ============================================================

/**
 * Approximate area calculation using the Shoelace formula
 * on projected coordinates. For production, use Turf.js.
 */
export function calculatePolygonAcres(polygon: GeoJSONPolygon): number {
  const coords = polygon.coordinates[0];
  if (!coords || coords.length < 4) return 0; // Need at least 3 points + closing

  // Use Shoelace formula with rough lat/lng to meters conversion
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const midLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(toRadians(midLat));

  let area = 0;
  const n = coords.length - 1;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = coords[i][0] * metersPerDegreeLng;
    const yi = coords[i][1] * metersPerDegreeLat;
    const xj = coords[j][0] * metersPerDegreeLng;
    const yj = coords[j][1] * metersPerDegreeLat;
    area += xi * yj - xj * yi;
  }
  area = Math.abs(area) / 2;

  // Convert square meters to acres (1 acre = 4046.86 m²)
  return Math.round((area / 4046.86) * 100) / 100;
}

// ============================================================
// VALIDATION: Check FSA-578 record completeness
// ============================================================

export interface FSA578ValidationResult {
  isValid: boolean;
  missingRequired: string[];
  warnings: string[];
}

export function validateFSA578Record(record: FSA578Record): FSA578ValidationResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  for (const field of FSA578_REQUIRED_FIELDS) {
    const value = record[field];
    if (value === undefined || value === null || value === '') {
      missingRequired.push(FSA578_COLUMN_LABELS[field] || field);
    }
  }

  // Acreage checks
  if (record.reportedAcres <= 0) {
    missingRequired.push('Reported Acreage must be > 0');
  }

  if (record.calculatedPolygonAcres && record.reportedAcres) {
    const discrepancy = Math.abs(record.calculatedPolygonAcres - record.reportedAcres);
    const discrepancyPercent = (discrepancy / record.reportedAcres) * 100;
    if (discrepancyPercent > 10) {
      warnings.push(
        `Polygon acreage (${record.calculatedPolygonAcres}) differs from reported (${record.reportedAcres}) by ${discrepancyPercent.toFixed(1)}%`
      );
    }
  }

  // Share validation
  if (record.sharePercent < 0 || record.sharePercent > 100) {
    missingRequired.push('Share % must be between 0 and 100');
  }

  // Organic validation
  if (record.organicStatus !== 'conventional' && !record.organicCertifier) {
    warnings.push('Organic certifier recommended for non-conventional status');
  }

  // Prevented planted checks
  if (record.isPreventedPlanted && !record.preventedPlantedAcres) {
    warnings.push('Prevented planted acreage should be specified');
  }

  // Double crop checks
  if (record.isDoubleCrop && !record.priorCrop) {
    warnings.push('Prior crop should be specified for double-crop');
  }

  // Insurance checks
  if (record.insurancePlanCode && !record.rmaPolicyNumber) {
    warnings.push('RMA policy number should be provided with insurance plan code');
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings,
  };
}
