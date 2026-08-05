import { Drug } from '../types';

export const INITIAL_DRUGS: Drug[] = [
  {
    id: 'drug-paracetamol',
    name: 'Paracetamol (Acetaminophen)',
    casNumber: '103-90-2',
    smiles: 'CC(=O)NC1=CC=C(O)C=C1',
    formula: 'C8H9NO2',
    therapeuticCategory: 'Analgesic & Antipyretic',
    descriptors: {
      mw: 151.16,
      logP: 0.46,
      tpsa: 49.33,
      hbd: 2,
      hba: 2,
      heavyAtoms: 11,
      rotatableBonds: 1,
      fractionCsp3: 0.125,
      ringCount: 1,
      aromaticRings: 1,
      formalCharge: 0,
      functionalGroups: ['Phenol', 'Amide', 'Aromatic Ring']
    }
  },
  {
    id: 'drug-ibuprofen',
    name: 'Ibuprofen',
    casNumber: '15687-27-1',
    smiles: 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O',
    formula: 'C13H18O2',
    therapeuticCategory: 'NSAID / Anti-inflammatory',
    descriptors: {
      mw: 206.28,
      logP: 3.5,
      tpsa: 37.3,
      hbd: 1,
      hba: 2,
      heavyAtoms: 15,
      rotatableBonds: 4,
      fractionCsp3: 0.538,
      ringCount: 1,
      aromaticRings: 1,
      formalCharge: 0,
      functionalGroups: ['Carboxylic Acid', 'Aromatic Ring', 'Alkyl Chain']
    }
  },
  {
    id: 'drug-aspirin',
    name: 'Aspirin (Acetylsalicylic acid)',
    casNumber: '50-78-2',
    smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
    formula: 'C9H8O4',
    therapeuticCategory: 'Antiplatelet / Analgesic',
    descriptors: {
      mw: 180.16,
      logP: 1.19,
      tpsa: 63.6,
      hbd: 1,
      hba: 4,
      heavyAtoms: 13,
      rotatableBonds: 3,
      fractionCsp3: 0.111,
      ringCount: 1,
      aromaticRings: 1,
      formalCharge: 0,
      functionalGroups: ['Ester', 'Carboxylic Acid', 'Aromatic Ring']
    }
  },
  {
    id: 'drug-metformin',
    name: 'Metformin HCl',
    casNumber: '1115-70-4',
    smiles: 'CN(C)C(=N)NC(=N)N',
    formula: 'C4H11N5',
    therapeuticCategory: 'Antidiabetic (Biguanide)',
    descriptors: {
      mw: 129.16,
      logP: -1.43,
      tpsa: 88.99,
      hbd: 4,
      hba: 3,
      heavyAtoms: 9,
      rotatableBonds: 2,
      fractionCsp3: 0.5,
      ringCount: 0,
      aromaticRings: 0,
      formalCharge: 0,
      functionalGroups: ['Guanidine', 'Amine']
    }
  },
  {
    id: 'drug-atorvastatin',
    name: 'Atorvastatin',
    casNumber: '134523-00-5',
    smiles: 'CC(C)C1=C(C(=C(N1CCC(CC(CC(=O)O)O)O)C2=CC=C(F)C=C2)C3=CC=CC=C3)C(=O)NC4=CC=CC=C4',
    formula: 'C33H35FN2O5',
    therapeuticCategory: 'Statin / Antihyperlipidemic',
    descriptors: {
      mw: 558.64,
      logP: 5.7,
      tpsa: 111.79,
      hbd: 4,
      hba: 5,
      heavyAtoms: 41,
      rotatableBonds: 12,
      fractionCsp3: 0.303,
      ringCount: 4,
      aromaticRings: 3,
      formalCharge: 0,
      functionalGroups: ['Pyrrole', 'Fluorobenzene', 'Amide', 'Carboxylic Acid', 'Secondary Hydroxyl']
    }
  },
  {
    id: 'drug-amoxicillin',
    name: 'Amoxicillin',
    casNumber: '26787-78-0',
    smiles: 'CC1(C(N2C(S1)C(C2=O)NC(=O)C(C3=CC=C(O)C=C3)N)C(=O)O)C',
    formula: 'C16H19N3O5S',
    therapeuticCategory: 'Beta-lactam Antibiotic',
    descriptors: {
      mw: 365.4,
      logP: 0.87,
      tpsa: 158.33,
      hbd: 4,
      hba: 7,
      heavyAtoms: 25,
      rotatableBonds: 4,
      fractionCsp3: 0.313,
      ringCount: 3,
      aromaticRings: 1,
      formalCharge: 0,
      functionalGroups: ['Beta-lactam', 'Primary Amine', 'Phenol', 'Thiazolidine', 'Carboxylic Acid']
    }
  },
  {
    id: 'drug-fluoxetine',
    name: 'Fluoxetine HCl',
    casNumber: '54910-89-3',
    smiles: 'CNCCC(C1=CC=CC=C1)OC2=CC=C(C=C2)C(F)(F)F',
    formula: 'C17H18F3NO',
    therapeuticCategory: 'Antidepressant (SSRI)',
    descriptors: {
      mw: 309.33,
      logP: 4.05,
      tpsa: 21.26,
      hbd: 1,
      hba: 2,
      heavyAtoms: 22,
      rotatableBonds: 6,
      fractionCsp3: 0.353,
      ringCount: 2,
      aromaticRings: 2,
      formalCharge: 0,
      functionalGroups: ['Secondary Amine', 'Ether', 'Trifluoromethyl', 'Aromatic Ring']
    }
  },
  {
    id: 'drug-ciprofloxacin',
    name: 'Ciprofloxacin',
    casNumber: '85721-33-1',
    smiles: 'C1CC1N2C=C(C(=O)C3=CC(=C(C=C32)N4CCNCC4)F)C(=O)O',
    formula: 'C17H18FN3O3',
    therapeuticCategory: 'Fluoroquinolone Antibiotic',
    descriptors: {
      mw: 331.34,
      logP: 0.28,
      tpsa: 72.88,
      hbd: 2,
      hba: 6,
      heavyAtoms: 24,
      rotatableBonds: 3,
      fractionCsp3: 0.353,
      ringCount: 4,
      aromaticRings: 2,
      formalCharge: 0,
      functionalGroups: ['Carboxylic Acid', 'Fluoroquinolone', 'Piperazine', 'Cyclopropyl']
    }
  },
  {
    id: 'drug-omeprazole',
    name: 'Omeprazole',
    casNumber: '73590-58-6',
    smiles: 'CC1=CN=C(C(=C1OC)C)CS(=O)C2=NC3=C(N2)C=CC(=C3)OC',
    formula: 'C17H19N3O3S',
    therapeuticCategory: 'Proton Pump Inhibitor',
    descriptors: {
      mw: 345.42,
      logP: 2.23,
      tpsa: 77.95,
      hbd: 1,
      hba: 5,
      heavyAtoms: 24,
      rotatableBonds: 5,
      fractionCsp3: 0.294,
      ringCount: 3,
      aromaticRings: 2,
      formalCharge: 0,
      functionalGroups: ['Sulfoxide', 'Benzimidazole', 'Pyridine', 'Methoxy']
    }
  }
];
