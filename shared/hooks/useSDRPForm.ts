/**
 * useSDRPForm() — The Master Hook
 *
 * This is the contract between Vision (form logic) and R2-D2 (UI).
 * R2-D2 builds against this interface. Vision implements the logic behind it.
 *
 * Usage in UI:
 *   const form = useSDRPForm(applicationId);
 *   form.setProducer({ name: 'John Doe', ... });
 *   form.addCropUnit({ cropName: 'Corn', ... });
 *   form.goToStep('crops_coverage');
 *   await form.save();
 *   await form.submit();
 */

import type {
  SDRPApplication,
  Producer,
  CropUnit,
  TreeBushVineData,
  SupportingDocument,
  WizardState,
  WizardStep,
  FormPath,
  ValidationError,
  PaymentCalculation,
  PaymentLimitation,
  WeatherEvent,
  CountyDisasterEligibility,
  QualifyingDisasterEvent,
  FSA504RoutingInput,
  FSA504Section,
  CoverageType,
  ApplicationStatus,
} from '../types/sdrp';

import type {
  FSA578Record,
  FSA578Summary,
  FSA578FieldCardProperties,
  GeoJSONPolygon,
  GeoJSONFeatureCollection,
} from '../types/fsa578';

// ============================================================
// HOOK RETURN TYPE — This is what R2-D2 consumes
// ============================================================

export interface UseSDRPFormReturn {
  // --- Application State ---
  application: SDRPApplication | null;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  error: string | null;

  // --- Wizard Navigation ---
  wizard: WizardState;
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  canAdvance: boolean;          // Current step passes validation
  canSubmit: boolean;           // All steps valid + signed

  // --- Producer (Step 1) ---
  setProducer: (data: Partial<Producer>) => void;
  setEntityMembers: (members: Producer['members']) => void;

  // --- Farm Info (Step 2) ---
  setRecordingCounty: (stateCode: string, countyCode: string) => void;
  setCropYear: (year: 2023 | 2024 | 2025) => void;
  setFormPath: (path: FormPath) => void;

  // --- Weather Events (Step 3) ---
  weatherEvents: WeatherEvent[];
  countyEligibility: CountyDisasterEligibility | null;
  detectWeatherEvents: (state: string, county: string, year: 2023 | 2024) => Promise<WeatherEvent[]>;
  isDetectingWeather: boolean;

  // --- Crop/Unit Management (Step 4) ---
  addCropUnit: (data: Partial<CropUnit>) => void;
  updateCropUnit: (id: string, data: Partial<CropUnit>) => void;
  removeCropUnit: (id: string) => void;
  getCropUnits: () => CropUnit[];

  /** Core routing function — determines FSA-504 section for a crop */
  routeCropToSection: (input: FSA504RoutingInput) => FSA504Section;

  /** Set disaster event for a crop/unit */
  setDisasterEvent: (cropUnitId: string, event: QualifyingDisasterEvent) => void;

  /** Set linkage agreement for a crop/unit */
  setLinkageAgreement: (cropUnitId: string, agreed: boolean) => void;

  /** Set share designation (for SBI situations) */
  setShareDesignation: (cropUnitId: string, shares: Record<string, number>) => void;

  // --- FSA-578 Map Field Cards (Step 4) ---
  /** All FSA-578 records for the application */
  fsa578Records: FSA578Record[];
  /** Summary of FSA-578 data */
  fsa578Summary: FSA578Summary | null;
  /** All drawn polygons as GeoJSON FeatureCollection */
  fieldPolygons: GeoJSONFeatureCollection;

  /** Create FSA-578 record from a drawn polygon */
  addFieldFromPolygon: (polygon: GeoJSONPolygon, calculatedAcres: number) => FSA578Record;
  /** Update an FSA-578 record (field card edit) */
  updateFSA578Record: (recordId: string, data: Partial<FSA578Record>) => void;
  /** Remove an FSA-578 record (delete polygon) */
  removeFSA578Record: (recordId: string) => void;
  /** Get field card display properties for a record */
  getFieldCardProperties: (recordId: string) => FSA578FieldCardProperties | null;
  /** Link an FSA-578 record to a CropUnit */
  linkFSA578ToCropUnit: (fsa578RecordId: string, cropUnitId: string) => void;
  /** Import FSA-578 data from an uploaded document */
  importFSA578FromDocument: (docId: string) => Promise<FSA578Record[]>;
  /** Validate all FSA-578 records */
  validateFSA578: () => { valid: boolean; errors: string[] };

  // --- Document Upload (Step 5) ---
  uploadDocument: (file: File, type: SupportingDocument['type']) => Promise<SupportingDocument>;
  removeDocument: (docId: string) => void;
  getDocuments: () => SupportingDocument[];
  isUploading: boolean;

  /** Claude-powered document extraction */
  extractDocumentData: (docId: string) => Promise<Record<string, unknown>>;
  isExtracting: boolean;

  // --- Trees/Bushes/Vines (Step 6) ---
  addTreeData: (cropUnitId: string, data: TreeBushVineData) => void;
  updateTreeData: (cropUnitId: string, stageIndex: number, data: Partial<TreeBushVineData>) => void;
  removeTreeData: (cropUnitId: string, stageIndex: number) => void;

  // --- Payment Estimation ---
  estimatePayment: (cropUnitId: string) => PaymentCalculation | null;
  estimateTotalPayment: () => {
    specialty: number;
    other: number;
    total: number;
  };
  paymentLimitation: PaymentLimitation;

  // --- Eligibility Forms Status ---
  setEligibilityFormStatus: (form: keyof SDRPApplication['eligibilityForms'], filed: boolean) => void;
  eligibilityFormsComplete: boolean;

  // --- Validation ---
  validate: () => ValidationError[];
  validateStep: (step: WizardStep) => ValidationError[];
  getFieldError: (field: string) => string | null;

  // --- Persistence ---
  save: () => Promise<void>;          // Save draft to Firestore
  submit: () => Promise<void>;        // Submit for COC review
  withdraw: (partial?: string[]) => Promise<void>;  // Withdraw (full or partial)

  // --- Duplicate Benefit Checks ---
  checkDuplicateBenefits: () => Promise<void>;
  hasDuplicateConflicts: boolean;
}

// ============================================================
// FSA-504 ROUTING FUNCTION (Pure Logic)
// ============================================================

/**
 * Routes a crop to the correct FSA-504 section based on coverage details.
 *
 * This is the brain of the form — it determines which UI section
 * and which payment calculation formula applies.
 *
 * Reference: 1-SDRP Part 4, Sections 1-7
 */
export function routeCropToFSA504Section(input: FSA504RoutingInput): FSA504Section {
  const {
    isInsured,
    isNAPCovered,
    isPuertoRico,
    planCode,
    hasApprovedNAPApplication,
    isValueLossCrop,
    isTreeBushVine,
    receivedIndemnity,
  } = input;

  // Puerto Rico provisions (Par. 188-191)
  if (isPuertoRico) {
    if (isTreeBushVine) return 'pr_tree_bush_vine';
    if (receivedIndemnity) return 'pr_indemnified';
    return 'pr_non_indemnified';
  }

  // Tree/Bush/Vine routing
  if (isTreeBushVine) {
    if (isInsured) return 'insured_tree_vine';
    return 'uninsured_tree_bush_vine';
  }

  // Insured crop routing (Par. 126, 129-132)
  if (isInsured && planCode) {
    // APH/Yield-based plans
    const aphPlans: number[] = [1, 2, 3, 21, 22, 23, 90, 91];
    if (aphPlans.includes(planCode)) return 'insured_aph_yield';

    // Area-based plans
    const areaPlans: number[] = [4, 5, 6, 13, 35, 36];
    if (areaPlans.includes(planCode)) return 'insured_area_based';

    // Value loss plans (nursery, aquaculture)
    if (isValueLossCrop) return 'insured_value_loss';

    // Dollar plans and other revenue (Par. 131)
    const dollarPlans: number[] = [41, 47, 50, 51, 55];
    if (dollarPlans.includes(planCode)) return 'insured_dollar_revenue';

    // WFRP/Micro Farm, Tree-based dollar
    if (planCode === 76) return 'insured_dollar_revenue';
    if (planCode === 40) return 'insured_tree_vine';
    if (planCode === 43) return isValueLossCrop ? 'insured_value_loss' : 'insured_dollar_revenue';
  }

  // NAP-covered crop routing (Par. 127)
  if (isNAPCovered) {
    if (isValueLossCrop) {
      return hasApprovedNAPApplication ? 'nap_value_loss_approved' : 'nap_value_loss_no_app';
    }
    return hasApprovedNAPApplication ? 'nap_yield_approved' : 'nap_yield_no_app';
  }

  // Uninsured crop routing (Par. 128)
  if (isValueLossCrop) return 'uninsured_value_loss';
  return 'uninsured_yield';
}

// ============================================================
// SDRP FACTOR LOOKUP (Par. 85B)
// ============================================================

/**
 * Returns the SDRP factor based on coverage type and level.
 * These factors are used in all payment calculations.
 */
export function getSDRPFactor(
  coverageType: 'insured' | 'nap' | 'uninsured',
  coverageLevel?: number
): number {
  if (coverageType === 'uninsured') return 0.70;

  if (coverageType === 'insured') {
    if (!coverageLevel) return 0.75; // CAT
    if (coverageLevel < 55) return 0.80;
    if (coverageLevel < 60) return 0.825;
    if (coverageLevel < 65) return 0.85;
    if (coverageLevel < 70) return 0.875;
    if (coverageLevel < 75) return 0.90;
    if (coverageLevel < 80) return 0.925;
    return 0.95; // 80%+
  }

  if (coverageType === 'nap') {
    if (!coverageLevel || coverageLevel <= 50) return 0.75; // CAT
    if (coverageLevel === 50) return 0.80;
    if (coverageLevel === 55) return 0.85;
    if (coverageLevel === 60) return 0.90;
    if (coverageLevel >= 65) return 0.95;
    return 0.75;
  }

  return 0.70;
}

// ============================================================
// PAYMENT LIMITATION HELPER (Par. 26)
// ============================================================

export function getPaymentLimits(filedFSA510: boolean, avgFarmAGIPercent?: number): PaymentLimitation {
  const qualifiesForEnhanced = filedFSA510 && (avgFarmAGIPercent ?? 0) >= 75;

  return {
    specialtyHighValue: qualifiesForEnhanced ? 900_000 : 125_000,
    otherCrops: qualifiesForEnhanced ? 250_000 : 125_000,
    filedFSA510,
    avgFarmAGIPercent,
  };
}

// ============================================================
// STUB IMPLEMENTATION (for R2-D2 to build against)
// ============================================================

/**
 * Stub hook — returns the full interface with no-op implementations.
 * R2-D2 can import this and build UI immediately.
 * Vision will replace with real Firestore-backed implementation.
 */
export function useSDRPFormStub(_applicationId?: string): UseSDRPFormReturn {
  const emptyApp: SDRPApplication = {
    id: _applicationId || 'draft-' + Date.now(),
    stage: 'stage2',
    status: 'draft',
    producer: {
      id: '', ccid: '', tin: '', name: '', entityType: 'individual',
      isCitizen: true, isSuspended: false,
      address: { line1: '', city: '', state: '', zip: '', county: '', countyCode: '', stateCode: '' },
      phone: '',
    },
    recordingState: '', recordingCounty: '',
    recordingStateCode: '', recordingCountyCode: '',
    cropYear: 2024,
    cropUnits: [],
    paymentLimitation: { specialtyHighValue: 125_000, otherCrops: 125_000, filedFSA510: false },
    linkageRequirements: [],
    duplicateBenefitChecks: [],
    documents: [],
    eligibilityForms: {
      ccc902Filed: false, ccc901Filed: false, ad1026Filed: false,
      fsa510Filed: false, fsa578Filed: false,
    },
    signatures: [],
    createdAt: new Date().toISOString(),
  };

  return {
    application: emptyApp,
    isLoading: false,
    isSaving: false,
    isSubmitting: false,
    error: null,
    wizard: {
      currentStep: 'welcome',
      completedSteps: [],
      formPath: 'path_b_manual',
      hasTBVLosses: false,
      hasQualityLosses: false,
      isValid: false,
      validationErrors: [],
      isDirty: false,
      autoSaveEnabled: true,
    },
    goToStep: () => {},
    nextStep: () => {},
    prevStep: () => {},
    canAdvance: false,
    canSubmit: false,
    setProducer: () => {},
    setEntityMembers: () => {},
    setRecordingCounty: () => {},
    setCropYear: () => {},
    setFormPath: () => {},
    weatherEvents: [],
    countyEligibility: null,
    detectWeatherEvents: async () => [],
    isDetectingWeather: false,
    addCropUnit: () => {},
    updateCropUnit: () => {},
    removeCropUnit: () => {},
    getCropUnits: () => [],
    routeCropToSection: routeCropToFSA504Section,
    setDisasterEvent: () => {},
    setLinkageAgreement: () => {},
    setShareDesignation: () => {},
    fsa578Records: [],
    fsa578Summary: null,
    fieldPolygons: { type: 'FeatureCollection', features: [] },
    addFieldFromPolygon: (_polygon, _acres) => ({
      id: '', adminStateCode: '', adminState: '', adminCountyCode: '', adminCounty: '',
      farmNumber: '', tractNumber: '', fieldNumber: '', cropName: '', intendedUse: '',
      practiceType: '', isPreventedPlanted: false, reportedAcres: 0, sharePercent: 100,
      hasNAPCoverage: false, organicStatus: 'conventional' as const, isNativeSod: false,
      cropYear: 2024 as const, isMultiCounty: false, isDoubleCrop: false, isSubsequentCrop: false,
      isHEL: false, isWetland: false, status: 'reported' as const, source: 'map_drawn' as const,
    }),
    updateFSA578Record: () => {},
    removeFSA578Record: () => {},
    getFieldCardProperties: () => null,
    linkFSA578ToCropUnit: () => {},
    importFSA578FromDocument: async () => [],
    validateFSA578: () => ({ valid: true, errors: [] }),
    uploadDocument: async () => ({ id: '', type: 'other', fileName: '', uploadedAt: '', status: 'pending' }),
    removeDocument: () => {},
    getDocuments: () => [],
    isUploading: false,
    extractDocumentData: async () => ({}),
    isExtracting: false,
    addTreeData: () => {},
    updateTreeData: () => {},
    removeTreeData: () => {},
    estimatePayment: () => null,
    estimateTotalPayment: () => ({ specialty: 0, other: 0, total: 0 }),
    paymentLimitation: { specialtyHighValue: 125_000, otherCrops: 125_000, filedFSA510: false },
    setEligibilityFormStatus: () => {},
    eligibilityFormsComplete: false,
    validate: () => [],
    validateStep: () => [],
    getFieldError: () => null,
    save: async () => {},
    submit: async () => {},
    withdraw: async () => {},
    checkDuplicateBenefits: async () => {},
    hasDuplicateConflicts: false,
  };
}
