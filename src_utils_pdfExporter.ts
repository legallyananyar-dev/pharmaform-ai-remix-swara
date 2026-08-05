import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompatibilityPrediction } from '../types';

/**
 * Generates an analytical PDF report for a drug-excipient compatibility prediction
 */
export function generatePDFReport(prediction: CompatibilityPrediction) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const blueColor: [number, number, number] = [2, 132, 199];   // Sky 600
  const greenColor: [number, number, number] = [16, 185, 129]; // Emerald 500
  const redColor: [number, number, number] = [239, 68, 68];    // Red 500
  const amberColor: [number, number, number] = [245, 158, 11];  // Amber 500

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 32, 'F');

  // Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PharmaForm AI', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253);
  doc.text('AI-Powered Drug–Excipient Compatibility Analytical Certificate', 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const formattedDate = new Date(prediction.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Report ID: ${prediction.id}  |  Generated: ${formattedDate}`, 14, 28);

  // Institution Box
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Pharma R&D Analytical Lab', 145, 15);
  doc.setFont('helvetica', 'normal');
  doc.text('Machine Learning Cheminformatics Unit', 145, 20);
  doc.text('Confidential Technical Document', 145, 25);

  let yPos = 40;

  // 2. Prediction Status Banner
  let statusBg = greenColor;
  if (prediction.status === 'Incompatible') statusBg = redColor;
  if (prediction.status === 'Possibly Reactive') statusBg = amberColor;

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(14, yPos, 182, 18, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`PREDICTION RESULT: ${prediction.status.toUpperCase()}`, 20, yPos + 12);

  doc.setFontSize(12);
  doc.text(`Model Confidence: ${prediction.confidenceScore}%`, 135, yPos + 12);

  yPos += 26;

  // 3. Drug & Excipient Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. Compound Chemical Profile', 14, yPos);
  yPos += 4;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Active Pharmaceutical Ingredient (API)', 'Excipient Target']],
    body: [
      ['Compound Name', prediction.drug.name, prediction.excipient.name],
      ['CAS Registry No.', prediction.drug.casNumber || 'N/A', prediction.excipient.casNumber || 'N/A'],
      ['Therapeutic / Excipient Class', prediction.drug.therapeuticCategory, prediction.excipient.category],
      ['Molecular Formula', prediction.drug.formula, prediction.excipient.formula],
      ['SMILES Notation', prediction.drug.smiles.substring(0, 32) + '...', prediction.excipient.smiles.substring(0, 32) + '...'],
      ['Molecular Weight (MW)', `${prediction.drug.descriptors.mw} g/mol`, `${prediction.excipient.descriptors.mw} g/mol`],
      ['Lipophilicity (LogP)', `${prediction.drug.descriptors.logP}`, `${prediction.excipient.descriptors.logP}`],
      ['Polar Surface Area (TPSA)', `${prediction.drug.descriptors.tpsa} Å²`, `${prediction.excipient.descriptors.tpsa} Å²`],
      ['H-Bond Donors / Acceptors', `${prediction.drug.descriptors.hbd} / ${prediction.drug.descriptors.hba}`, `${prediction.excipient.descriptors.hbd} / ${prediction.excipient.descriptors.hba}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: blueColor, textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 10;

  // 4. Engineered Interaction Descriptors Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. Engineered Pairwise Interaction Descriptors', 14, yPos);
  yPos += 4;

  autoTable(doc, {
    startY: yPos,
    head: [['Interaction Metric', 'Calculated Value', 'Impact / Interpretation']],
    body: [
      ['Delta LogP (ΔLogP)', `${prediction.features.diffLogP}`, prediction.features.diffLogP < 2.0 ? 'Favorable lipophilicity similarity' : 'High lipophilicity gap'],
      ['Delta MW (ΔMW)', `${prediction.features.diffMW} g/mol`, 'Size matrix packing difference'],
      ['Delta TPSA (ΔTPSA)', `${prediction.features.diffTPSA} Å²`, prediction.features.diffTPSA < 60 ? 'Harmonious polar surface matching' : 'Polarity mismatch'],
      ['Compatibility Coefficient (C_comp)', `${prediction.features.compatibilityCoeff}`, 'Composite physicochemical score (0 to 1)'],
      ['Descriptor Cosine Similarity', `${prediction.features.descriptorCosineSimilarity}`, 'High descriptor correlation'],
      ['Tanimoto Fingerprint Index', `${prediction.features.tanimotoSimilarity}`, 'Structural fingerprint overlap score'],
      ['Maillard Reaction Alert', prediction.features.maillardReactionRisk ? 'ALERT (HIGH RISK)' : 'PASS (No Risk)', prediction.features.maillardReactionRisk ? 'Reducing sugar + amine glycation risk' : 'No reducing sugar amine pairing'],
      ['Metal Chelation Alert', prediction.features.metalChelationRisk ? 'ALERT (HIGH RISK)' : 'PASS (No Risk)', prediction.features.metalChelationRisk ? 'Divalent metal ion complexation risk' : 'No metal chelation detected'],
      ['Esterification / Hydrolysis Alert', prediction.features.esterificationRisk ? 'ALERT (MODERATE)' : 'PASS (No Risk)', prediction.features.esterificationRisk ? 'Acid/Base catalyzed ester degradation' : 'No ester hydrolysis risk']
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 10;

  // Check if we need new page
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // 5. SHAP Feature Attribution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. Explainable AI (SHAP) Feature Attribution', 14, yPos);
  yPos += 4;

  const shapBody = prediction.shapFeatures.map(sf => [
    sf.featureName,
    `${sf.featureValue}`,
    sf.shapValue > 0 ? `+${(sf.shapValue * 100).toFixed(1)}%` : `${(sf.shapValue * 100).toFixed(1)}%`,
    sf.explanation
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Feature Name', 'Observed Value', 'SHAP Weight', 'Feature Impact Explanation']],
    body: shapBody,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 10;

  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // 6. Degradation Mechanisms & Recommendation Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, yPos, 182, 42, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, yPos, 182, 42, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('4. Formulation Scientist Recommendation & Risk Mitigation:', 18, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const splitRec = doc.splitTextToSize(prediction.recommendation, 172);
  doc.text(splitRec, 18, yPos + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Identified Degradation Pathways:', 18, yPos + 27);
  doc.setFont('helvetica', 'normal');
  const mechText = prediction.degradationMechanisms.join(' | ');
  const splitMech = doc.splitTextToSize(mechText, 172);
  doc.text(splitMech, 18, yPos + 33);

  yPos += 48;

  // 7. Footer & Sign-Off
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This prediction is generated by PharmaForm AI Random Forest + SHAP Cheminformatics Engine.', 14, 280);
  doc.text('Formulation Scientist Sign-off: ________________________', 130, 280);

  // Save PDF file
  const filename = `PharmaForm_${prediction.drug.name.replace(/\s+/g, '_')}_${prediction.excipient.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

/**
 * Generates an analytical PDF report as a Blob for Google Drive upload
 */
export function generatePDFBlob(prediction: CompatibilityPrediction): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const blueColor: [number, number, number] = [2, 132, 199];   // Sky 600
  const greenColor: [number, number, number] = [16, 185, 129]; // Emerald 500
  const redColor: [number, number, number] = [239, 68, 68];    // Red 500
  const amberColor: [number, number, number] = [245, 158, 11];  // Amber 500

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PharmaForm AI', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253);
  doc.text('AI-Powered Drug–Excipient Compatibility Analytical Certificate', 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const formattedDate = new Date(prediction.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Report ID: ${prediction.id}  |  Generated: ${formattedDate}`, 14, 28);

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Pharma R&D Analytical Lab', 145, 15);
  doc.setFont('helvetica', 'normal');
  doc.text('Machine Learning Cheminformatics Unit', 145, 20);
  doc.text('Confidential Technical Document', 145, 25);

  let yPos = 40;

  let statusBg = greenColor;
  if (prediction.status === 'Incompatible') statusBg = redColor;
  if (prediction.status === 'Possibly Reactive') statusBg = amberColor;

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(14, yPos, 182, 18, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`PREDICTION RESULT: ${prediction.status.toUpperCase()}`, 20, yPos + 12);

  doc.setFontSize(12);
  doc.text(`Model Confidence: ${prediction.confidenceScore}%`, 135, yPos + 12);

  yPos += 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. Compound Chemical Profile', 14, yPos);
  yPos += 4;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Active Pharmaceutical Ingredient (API)', 'Excipient Target']],
    body: [
      ['Compound Name', prediction.drug.name, prediction.excipient.name],
      ['CAS Registry No.', prediction.drug.casNumber || 'N/A', prediction.excipient.casNumber || 'N/A'],
      ['Therapeutic / Excipient Class', prediction.drug.therapeuticCategory, prediction.excipient.category],
      ['Molecular Formula', prediction.drug.formula, prediction.excipient.formula],
      ['SMILES Notation', prediction.drug.smiles.substring(0, 32) + '...', prediction.excipient.smiles.substring(0, 32) + '...'],
      ['Molecular Weight (MW)', `${prediction.drug.descriptors.mw} g/mol`, `${prediction.excipient.descriptors.mw} g/mol`],
      ['Lipophilicity (LogP)', `${prediction.drug.descriptors.logP}`, `${prediction.excipient.descriptors.logP}`],
      ['Polar Surface Area (TPSA)', `${prediction.drug.descriptors.tpsa} Å²`, `${prediction.excipient.descriptors.tpsa} Å²`],
      ['H-Bond Donors / Acceptors', `${prediction.drug.descriptors.hbd} / ${prediction.drug.descriptors.hba}`, `${prediction.excipient.descriptors.hbd} / ${prediction.excipient.descriptors.hba}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: blueColor, textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. Engineered Pairwise Interaction Descriptors', 14, yPos);
  yPos += 4;

  autoTable(doc, {
    startY: yPos,
    head: [['Interaction Metric', 'Calculated Value', 'Impact / Interpretation']],
    body: [
      ['Delta LogP (ΔLogP)', `${prediction.features.diffLogP}`, prediction.features.diffLogP < 2.0 ? 'Favorable lipophilicity similarity' : 'High lipophilicity gap'],
      ['Delta MW (ΔMW)', `${prediction.features.diffMW} g/mol`, 'Size matrix packing difference'],
      ['Delta TPSA (ΔTPSA)', `${prediction.features.diffTPSA} Å²`, prediction.features.diffTPSA < 60 ? 'Harmonious polar surface matching' : 'Polarity mismatch'],
      ['Compatibility Coefficient (C_comp)', `${prediction.features.compatibilityCoeff}`, 'Composite physicochemical score (0 to 1)'],
      ['Descriptor Cosine Similarity', `${prediction.features.descriptorCosineSimilarity}`, 'High descriptor correlation'],
      ['Tanimoto Fingerprint Index', `${prediction.features.tanimotoSimilarity}`, 'Structural fingerprint overlap score'],
      ['Maillard Reaction Alert', prediction.features.maillardReactionRisk ? 'ALERT (HIGH RISK)' : 'PASS (No Risk)', prediction.features.maillardReactionRisk ? 'Reducing sugar + amine glycation risk' : 'No reducing sugar amine pairing'],
      ['Metal Chelation Alert', prediction.features.metalChelationRisk ? 'ALERT (HIGH RISK)' : 'PASS (No Risk)', prediction.features.metalChelationRisk ? 'Divalent metal ion complexation risk' : 'No metal chelation detected'],
      ['Esterification / Hydrolysis Alert', prediction.features.esterificationRisk ? 'ALERT (MODERATE)' : 'PASS (No Risk)', prediction.features.esterificationRisk ? 'Acid/Base catalyzed ester degradation' : 'No ester hydrolysis risk']
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 10;

  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. Explainable AI (SHAP) Feature Attribution', 14, yPos);
  yPos += 4;

  const shapBody = prediction.shapFeatures.map(sf => [
    sf.featureName,
    `${sf.featureValue}`,
    sf.shapValue > 0 ? `+${(sf.shapValue * 100).toFixed(1)}%` : `${(sf.shapValue * 100).toFixed(1)}%`,
    sf.explanation
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Feature Name', 'Observed Value', 'SHAP Weight', 'Feature Impact Explanation']],
    body: shapBody,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 10;

  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, yPos, 182, 42, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, yPos, 182, 42, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('4. Formulation Scientist Recommendation & Risk Mitigation:', 18, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const splitRec = doc.splitTextToSize(prediction.recommendation, 172);
  doc.text(splitRec, 18, yPos + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Identified Degradation Pathways:', 18, yPos + 27);
  doc.setFont('helvetica', 'normal');
  const mechText = prediction.degradationMechanisms.join(' | ');
  const splitMech = doc.splitTextToSize(mechText, 172);
  doc.text(splitMech, 18, yPos + 33);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This prediction is generated by PharmaForm AI Random Forest + SHAP Cheminformatics Engine.', 14, 280);
  doc.text('Formulation Scientist Sign-off: ________________________', 130, 280);

  return doc.output('blob');
}
