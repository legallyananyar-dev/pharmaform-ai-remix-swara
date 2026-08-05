export interface DrugDescriptors {
  mw: number;
  logP: number;
  tpsa: number;
  hbd: number;
  hba: number;
  heavyAtoms: number;
  rotatableBonds: number;
  fractionCsp3: number;
  ringCount: number;
  aromaticRings: number;
  formalCharge: number;
  morganFingerprint?: string; // Hex or Bitstring representation
  maccsKeys?: string;
  functionalGroups?: string[];
}

export interface Drug {
  id: string;
  name: string;
  casNumber?: string;
  smiles: string;
  formula: string;
  therapeuticCategory: string;
  descriptors: DrugDescriptors;
  structure2DUrl?: string;
}

export interface Excipient {
  id: string;
  name: string;
  casNumber?: string;
  smiles: string;
  formula: string;
  category: 'Binder' | 'Diluent' | 'Disintegrant' | 'Lubricant' | 'Glidant' | 'Coating' | 'Buffer' | 'Surfactant' | 'Preservative';
  typicalConcentration: string; // e.g. "5 - 20%"
  dosageForms: string[];
  reactiveRiskGroups: string[];
  descriptors: DrugDescriptors;
  description?: string;
}

export interface EngineeredFeatures {
  diffLogP: number;
  diffMW: number;
  diffTPSA: number;
  diffHBD: number;
  diffHBA: number;
  polarityDiff: number;
  lipophilicityDiff: number;
  compatibilityCoeff: number;
  descriptorCosineSimilarity: number;
  tanimotoSimilarity: number;
  maillardReactionRisk: boolean;
  esterificationRisk: boolean;
  saltFormationRisk: boolean;
  acidBaseRisk: boolean;
  metalChelationRisk: boolean;
}

export type CompatibilityStatus = 'Compatible' | 'Possibly Reactive' | 'Incompatible';

export interface SHAPFeature {
  featureName: string;
  featureValue: string | number;
  shapValue: number; // Positive = increases compatibility, Negative = decreases compatibility
  explanation: string;
}

export interface CompatibilityPrediction {
  id: string;
  timestamp: string;
  drug: Drug;
  excipient: Excipient;
  features: EngineeredFeatures;
  status: CompatibilityStatus;
  confidenceScore: number; // 0 to 100
  shapFeatures: SHAPFeature[];
  shapExplanationSummary: string;
  degradationMechanisms: string[];
  recommendation: string;
}

export interface DashboardMetrics {
  totalPredictions: number;
  compatibleCount: number;
  reactiveCount: number;
  incompatibleCount: number;
  avgConfidence: number;
  mostUsedExcipients: { name: string; count: number; category: string }[];
  recentAnalyses: CompatibilityPrediction[];
}

export interface FormulationCopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendations?: {
    suggestedExcipients?: string[];
    suggestedMethod?: string;
    riskMitigation?: string;
  };
}
