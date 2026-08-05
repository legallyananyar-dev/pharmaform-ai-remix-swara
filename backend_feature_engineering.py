"""
Feature Engineering Module for PharmaForm AI
Computes pairwise drug-excipient interaction features and reaction alert matrix.
"""
import math
from typing import Dict, Any

def extract_interaction_features(drug_desc: Dict[str, Any], excipient_desc: Dict[str, Any], excipient_name: str, drug_name: str) -> Dict[str, Any]:
    diff_logp = round(abs(drug_desc.get('logP', 0) - excipient_desc.get('logP', 0)), 2)
    diff_mw = round(abs(drug_desc.get('mw', 0) - excipient_desc.get('mw', 0)), 2)
    diff_tpsa = round(abs(drug_desc.get('tpsa', 0) - excipient_desc.get('tpsa', 0)), 2)
    diff_hbd = abs(drug_desc.get('hbd', 0) - excipient_desc.get('hbd', 0))
    diff_hba = abs(drug_desc.get('hba', 0) - excipient_desc.get('hba', 0))

    polarity_diff = round(diff_tpsa / max(drug_desc.get('tpsa', 1), excipient_desc.get('tpsa', 1), 1), 2)
    lipophilicity_diff = round(diff_logp / 5.0, 2)

    # Reaction alerts
    exc_lower = excipient_name.lower()
    drug_lower = drug_name.lower()

    maillard_risk = ("lactose" in exc_lower) and any(kw in drug_lower for kw in ["fluoxetine", "metformin", "amoxicillin", "amine"])
    metal_chelation_risk = ("stearate" in exc_lower or "magnesium" in exc_lower or "talc" in exc_lower) and ("ciprofloxacin" in drug_lower or "quinolone" in drug_lower)
    esterification_risk = ("citric" in exc_lower or "acid" in exc_lower) and ("aspirin" in drug_lower or "ester" in drug_lower)

    # Compatibility Coefficient C_comp
    penalty = 0.0
    if maillard_risk: penalty += 0.45
    if metal_chelation_risk: penalty += 0.35
    if esterification_risk: penalty += 0.30

    comp_coeff = max(0.05, min(0.98, round(0.88 - (diff_logp * 0.05) - (polarity_diff * 0.10) - penalty, 2)))

    return {
        "diff_logp": diff_logp,
        "diff_mw": diff_mw,
        "diff_tpsa": diff_tpsa,
        "diff_hbd": diff_hbd,
        "diff_hba": diff_hba,
        "polarity_diff": polarity_diff,
        "lipophilicity_diff": lipophilicity_diff,
        "compatibility_coeff": comp_coeff,
        "maillard_risk": maillard_risk,
        "metal_chelation_risk": metal_chelation_risk,
        "esterification_risk": esterification_risk
    }
