/**
 * SDRP Types — American Crop Recovery Platform
 * Based on FSA Handbook 1-SDRP Amendment 2 (March 18, 2026)
 * Authority: American Relief Act, 2025 (Pub. L. 118-158)
 *
 * These types define the data model for the SDRP Master Form (FSA-504/FSA-526)
 * and all payment calculation logic.
 */

// ============================================================
// ENUMS & CONSTANTS
// ============================================================

/** SDRP Stage */
export type SDRPStage = 'stage1' | 'stage2';

/** Application status lifecycle */
export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pending_documentation'
  | 'approved'
  | 'disapproved'
  | 'withdrawn'
  | 'payment_issued'
  | 'payment_calculated_zero';

/** Qualifying disaster events (Par. 27B) */
export type QualifyingDisasterEvent =
  | 'qualifying_drought'
  | 'derecho'
  | 'excessive_heat'
  | 'excessive_moisture'
  | 'flooding'
  | 'freeze'
  | 'hurricane'
  | 'smoke_exposure'
  | 'tornado'
  | 'wildfire'
  | 'winter_storm';

/** Related conditions that may accompany a qualifying event */
export type RelatedCondition =
  | 'excessive_wind'
  | 'storm_surge'
  | 'tropical_storm'
  | 'tropical_depression'
  | 'silt_and_debris'
  | 'blizzard';

/** Coverage type determines which FSA-504 section to use */
export type CoverageType =
  | 'insured_aph_yield'       // Part C: APH/Yield Based Plans
  | 'insured_area_based'      // Part D: Area Based Plans
  | 'insured_dollar_revenue'  // Part E: Dollar Plans and Other Revenue
  | 'insured_value_loss'      // Part F: Value Loss Plans
  | 'insured_tree_vine'       // Part G: Tree and Vine Plans
  | 'nap_value_loss_approved' // Part H: NAP with approved app - Value Loss
  | 'nap_yield_approved'      // Part I: NAP with approved app - APH/Yield
  | 'nap_yield_no_app'        // Part J: NAP without approved app - APH/Yield
  | 'nap_value_loss_no_app'   // Part K: NAP without approved app - Value Loss
  | 'uninsured_yield'         // Part L: Uninsured - APH/Yield Based
  | 'uninsured_value_loss'    // Part M: Uninsured - Value Loss
  | 'uninsured_tree_bush_vine'// Part N: Uninsured - Tree, Bush, Vine
  | 'pr_indemnified'          // Part O: Puerto Rico - Indemnified
  | 'pr_non_indemnified'      // Part P: Puerto Rico - Non-Indemnified
  | 'pr_tree_bush_vine';      // Part Q: Puerto Rico - Tree, Bush, Vine

/** Crop category for payment limitation purposes (Par. 26) */
export type CropCategory = 'specialty_high_value' | 'other';

/** Entity type for eligible producer determination (Par. 27D) */
export type EntityType =
  | 'individual'
  | 'partnership'
  | 'corporation'
  | 'llc'
  | 'joint_venture'
  | 'trust'
  | 'indian_tribe'
  | 'estate';

/** Harvest stage for production */
export type HarvestStage = 'harvested' | 'unharvested' | 'prevented_planted';

/** Tree/vine damage status */
export type TreeDamageStatus = 'destroyed' | 'damaged' | 'undamaged';

/** RMA Plan Codes eligible for SDRP (Par. 49C) */
export type RMAPlanCode =
  | 1  | 2  | 3  | 4  | 5  | 6   // Yield/Revenue/Area
  | 13 | 21 | 22 | 23            // Rainfall Index, PRH
  | 35 | 36                        // STAX (base only)
  | 40 | 41 | 43 | 47            // Tree/Pecan/Aquaculture/ARH
  | 50 | 51 | 55                  // Dollar Amount plans
  | 76 | 90 | 91;                 // WFRP/Micro Farm, APH

// ============================================================
// CORE DATA MODELS
// ============================================================

/** Producer identity and eligibility */
export interface Producer {
  id: string;
  ccid?: string;               // FSA Common Customer ID
  tin: string;                  // Tax ID (SSN or EIN)
  name: string;
  entityType: EntityType;
  isCitizen: boolean;           // US citizen or resident alien
  isSuspended: boolean;         // Suspended/debarred from federal programs
  address: Address;
  phone: string;
  altPhone?: string;
  email?: string;
  members?: EntityMember[];     // For legal entities
}

export interface EntityMember {
  id: string;
  name: string;
  tin: string;
  sharePercent: number;         // Ownership percentage
  isCitizen: boolean;
  entityType: EntityType;
  filedFSA510: boolean;         // Requested enhanced payment limit
  avgFarmAGIPercent?: number;   // Percent of AGI from farming
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  countyCode: string;
  stateCode: string;
}

/** Crop/unit on the application */
export interface CropUnit {
  id: string;
  cropName: string;
  cropType?: string;
  intendedUse?: string;
  practice?: string;
  organicStatus?: 'organic' | 'transitional' | 'conventional';
  nativeSod?: boolean;
  unitNumber: string;
  physicalState: string;
  physicalCounty: string;
  physicalStateCode: string;
  physicalCountyCode: string;
  adminState?: string;          // For NAP crops
  adminCounty?: string;
  cropYear: 2023 | 2024 | 2025;
  coverageType: CoverageType;
  planCode?: RMAPlanCode;
  cropCategory: CropCategory;
  plantingPeriod?: number;

  // Acreage & Production
  acres?: number;
  sdrpAcres?: number;           // From FSA-578
  harvestStage?: HarvestStage;
  production?: number;          // Producer certified
  rmaProduction?: number;       // RMA pre-filled (share-adjusted)
  cocAdjustedProduction?: number;
  unitOfMeasure?: string;
  qualityLossPercent?: number;
  cocAdjustedQualityPercent?: number;
  crushingDistrict?: string;    // CA grapes only
  salvageValue?: number;

  // Value loss specific
  dollarValueBeforeDisaster?: number;
  dollarValueAfterDisaster?: number;
  cocAdjustedValueBefore?: number;
  cocAdjustedValueAfter?: number;

  // Area-based specific
  rmaInsuredAcres?: number;
  eligibleAcrePercent?: number;
  cocAdjustedEligiblePercent?: number;
  estimatedSDRPPayment?: number;

  // Tree/Bush/Vine specific
  treeData?: TreeBushVineData[];

  // Shares & Linkage
  sharePercent: number;
  cocAdjustedShare?: number;
  agreedToLinkage: boolean;     // Must be true to receive payment
  disasterEvent: QualifyingDisasterEvent;
  relatedConditions?: RelatedCondition[];

  // SBI (Substantial Beneficial Interest)
  primaryPolicyholder?: string;
  sbiProducers?: SBIProducer[];

  // COC Action
  cocAction?: 'approved' | 'disapproved';
  cocActionDate?: string;
  cocRemarks?: string;

  // Payment
  calculatedPayment?: number;
  sdrpLiability?: number;
  potentialIndemnity?: number;
}

export interface SBIProducer {
  id: string;
  name: string;
  ccid?: string;
  sharePercent: number;
  agreedToLinkage: boolean;
  signatureDate?: string;
}

export interface TreeBushVineData {
  treeStage: string;            // e.g., "Stage 1", "Stage 2", "Stage 3"
  crop: string;
  cropType?: string;
  totalTrees: number;
  destroyedTrees: number;
  damagedTrees: number;
  pricePerTree: number;         // FSA-determined
  damageFactor: number;         // 0-1, varies by stage
  salvageValue?: number;
  sharePercent: number;
}

// ============================================================
// PAYMENT CALCULATIONS (Par. 85, 244-249)
// ============================================================

/** SDRP Factor lookup (Par. 85B) */
export interface SDRPFactorTable {
  insured: Record<string, number>;  // Coverage level range → factor
  nap: Record<string, number>;
  uninsured: 0.70;
}

/** Payment limitation per program year (Par. 26) */
export interface PaymentLimitation {
  specialtyHighValue: number;   // $125K default, $900K with FSA-510
  otherCrops: number;           // $125K default, $250K with FSA-510
  filedFSA510: boolean;
  avgFarmAGIPercent?: number;
}

/** Stage 2 payment calculation result */
export interface PaymentCalculation {
  cropUnitId: string;
  coverageType: CoverageType;
  sdrpLiability: number;
  calculatedLoss: number;
  potentialIndemnity: number;   // For insured/NAP crops
  premiums: number;
  adminFees: number;
  servicesFee: number;
  paymentFactor: 0.35;          // 35% payment factor (Par. 244)
  sdrpFactor: number;           // Based on coverage level
  unharvstedFactor?: number;
  sharePercent: number;
  grossPayment: number;
  netPayment: number;           // After payment limitation
}

// ============================================================
// FSA-504 APPLICATION (Stage 2)
// ============================================================

export interface SDRPApplication {
  id: string;
  applicationNumber?: string;   // Assigned by system (Item 4)
  stage: SDRPStage;
  status: ApplicationStatus;

  // Part A: Producer Information
  producer: Producer;
  recordingState: string;
  recordingCounty: string;
  recordingStateCode: string;
  recordingCountyCode: string;
  cropYear: 2023 | 2024 | 2025;

  // Crop/Unit entries (Parts C-Q)
  cropUnits: CropUnit[];

  // Payment Limitation
  paymentLimitation: PaymentLimitation;

  // Linkage tracking
  linkageRequirements: LinkageRequirement[];

  // Duplicate benefit checks (Par. 29)
  duplicateBenefitChecks: DuplicateBenefitCheck[];

  // Supporting documents
  documents: SupportingDocument[];

  // Eligibility forms status
  eligibilityForms: {
    ccc902Filed: boolean;       // Farm Operating Plan
    ccc901Filed?: boolean;      // Member Info (entities only)
    ad1026Filed: boolean;       // Conservation Compliance
    fsa510Filed?: boolean;      // Payment Limitation Exception
    fsa578Filed?: boolean;      // Acreage Report
  };

  // Signatures
  signatures: ApplicationSignature[];

  // Dates
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  dateStamp?: string;           // County Office date stamp

  // COC Review
  cocReview?: {
    reviewedBy: string;
    reviewDate: string;
    ccc770Completed: boolean;
    findings?: string;
  };

  // Calculated totals
  totalSpecialtyPayment?: number;
  totalOtherPayment?: number;
  totalPayment?: number;
}

export interface LinkageRequirement {
  cropUnitId: string;
  crop: string;
  county: string;
  coverageRequired: 'crop_insurance' | 'nap' | 'wfrp_micro_farm';
  minimumLevel: '60/100';
  linkageYear1: number;
  linkageYear2: number;
  year1Met?: boolean;
  year2Met?: boolean;
}

export interface DuplicateBenefitCheck {
  type: 'nap_and_insurance' | 'elap_aquaculture' | 'erp_track1_2023' | 'erp_track2_2023' | 'block_grant_state';
  cropUnitId: string;
  status: 'clear' | 'conflict_found' | 'resolved' | 'unresolved';
  resolution?: string;
  notificationSent?: boolean;
}

export interface SupportingDocument {
  id: string;
  type: 'production_record' | 'inventory_record' | 'lease' | 'sales_receipt'
    | 'insurance_doc' | 'nap_doc' | 'quality_grade' | 'tree_appraisal'
    | 'fsa_578' | 'ccc_902' | 'ccc_901' | 'ad_1026' | 'fsa_510' | 'other';
  fileName: string;
  uploadedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  extractedData?: Record<string, unknown>;
}

export interface ApplicationSignature {
  producerId: string;
  producerName: string;
  role: 'applicant' | 'primary_policyholder' | 'sbi';
  signatureDate: string;
  signatureMethod: 'in_person' | 'electronic' | 'fax' | 'mail';
}

// ============================================================
// FSA-504 ROUTING MATRIX
// ============================================================

/**
 * Determines which section of FSA-504 a crop/unit should be routed to.
 * This is the core logic that drives the form's conditional rendering.
 *
 * Based on:
 *   1. Was the crop insured, NAP-covered, or uninsured?
 *   2. What type of insurance plan?
 *   3. Was there a prior application for payment (NAP)?
 *   4. Is this a yield-based, area-based, dollar, value-loss, or tree/vine crop?
 *   5. Is this Puerto Rico?
 */
export interface FSA504RoutingInput {
  isInsured: boolean;
  isNAPCovered: boolean;
  isPuertoRico: boolean;
  planCode?: RMAPlanCode;
  hasApprovedNAPApplication: boolean;
  isValueLossCrop: boolean;
  isTreeBushVine: boolean;
  receivedIndemnity: boolean;    // For PR provisions
}

export type FSA504Section = CoverageType;

// ============================================================
// WEATHER & DISASTER DATA
// ============================================================

export interface WeatherEvent {
  type: QualifyingDisasterEvent;
  relatedConditions?: RelatedCondition[];
  startDate: string;
  endDate?: string;
  county: string;
  state: string;
  fipsCode: string;
  severity?: string;            // e.g., D2, D3, D4 for drought
  consecutiveWeeks?: number;    // For drought: ≥8 weeks at D2 or any at D3+
  source: 'us_drought_monitor' | 'noaa_storm_events' | 'fema' | 'manual';
  isQualifying: boolean;        // Meets SDRP criteria
}

export interface CountyDisasterEligibility {
  state: string;
  county: string;
  fipsCode: string;
  calendarYear: 2023 | 2024;
  qualifyingEvents: QualifyingDisasterEvent[];
  droughtDetails?: {
    maxSeverity: 'D2' | 'D3' | 'D4';
    consecutiveWeeksAtD2Plus: number;
    meetsQualifyingDrought: boolean;
  };
}

// ============================================================
// FORM WIZARD STATE
// ============================================================

/** Wizard step definition */
export type WizardStep =
  | 'welcome'              // Step 1: Personal info, entity type
  | 'farm_info'            // Step 2: Farm details, FSA-578 data
  | 'weather_events'       // Step 3: Disaster event selection + auto-detection
  | 'crops_coverage'       // Step 4: Crop/unit entries, coverage routing
  | 'document_upload'      // Step 5: Supporting docs, Claude extraction
  | 'trees_bushes_vines'   // Step 6: TBV module (if applicable)
  | 'review_submit';       // Step 7: Review all, sign, submit

/** Two-path routing for the form */
export type FormPath =
  | 'path_a_prefilled'    // Producer has RMA/NAP data → pre-filled sections
  | 'path_b_manual';      // Uninsured or no prior data → manual entry

export interface WizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  formPath: FormPath;
  hasTBVLosses: boolean;        // Determines if Step 6 shows
  hasQualityLosses: boolean;
  isValid: boolean;
  validationErrors: ValidationError[];
  isDirty: boolean;
  lastSavedAt?: string;
  autoSaveEnabled: boolean;
}

export interface ValidationError {
  field: string;
  step: WizardStep;
  message: string;
  severity: 'error' | 'warning';
}
