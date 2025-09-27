const { MedicalDocParser } = require('./parser_generic');

/**
 * Parser for lab test reports.
 *
 * This parser searches for a wide variety of common lab test names and
 * values within the OCR‑ed text using lenient regular expressions.
 * It returns an object keyed by test name, with each value containing
 * the measured value, unit and reference range.  If a test is not
 * found in the document, it will simply be omitted from the result.
 */
class LabTestParser extends MedicalDocParser {
  constructor(text) {
    super(text);
  }

  /**
   * Parse the lab report into structured test results.
   *
   * @returns {Object} An object whose keys are test names and values
   *   contain "value", "unit" and "normal_range".
   */
  parse() {
    const testDict = {
      "Hemoglobin": {
        "pattern": "(?:\\\\bhemoglobin\\\\b|\\\\bhaemoglobin\\\\b|\\\\bhb\\\\b|\\\\bhgb\\\\b|\\\\bhemglobin\\\\b|\\\\bhemoglobin[\\\\s\\\\-]*level\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "g/dL",
        "range": "12.0-15.0"
      },
      "RBC": {
        "pattern": "(?:\\\\brbc\\\\b|\\\\bred[\\\\s\\\\-]*blood[\\\\s\\\\-]*cell[\\\\s\\\\-]*count\\\\b|\\\\btotal[\\\\s\\\\-]*rbc[\\\\s\\\\-]*count\\\\b|\\\\br[\\\\s\\\\-]*b[\\\\s\\\\-]*c\\\\b|\\\\bred[\\\\s\\\\-]*blood[\\\\s\\\\-]*cells\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "10^6/uL",
        "range": "3.5-5.5"
      },
      "HCT": {
        "pattern": "(?:\\\\bhct\\\\b|\\\\bhematocrit\\\\b|\\\\bpacked[\\\\s\\\\-]*cell[\\\\s\\\\-]*volume\\\\b|\\\\bpcv\\\\b|\\\\bpacked[\\\\s\\\\-]*cell[\\\\s\\\\-]*volume[\\\\s\\\\-]*hematocrit\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "37.0-50.0"
      },
      "MCV": {
        "pattern": "(?:\\\\bmcv\\\\b|\\\\bmean[\\\\s\\\\-]*corpuscular[\\\\s\\\\-]*volume\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "fL",
        "range": "82-95"
      },
      "MCH": {
        "pattern": "(?:\\\\bmch\\\\b|\\\\bmean[\\\\s\\\\-]*corpuscular[\\\\s\\\\-]*hemoglobin\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "pg",
        "range": "27-31"
      },
      "MCHC": {
        "pattern": "(?:\\\\bmchc\\\\b|\\\\bmean[\\\\s\\\\-]*corpuscular[\\\\s\\\\-]*hemoglobin[\\\\s\\\\-]*concentration\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "g/dL",
        "range": "32-36"
      },
      "RDW-CV": {
        "pattern": "(?:\\\\brdw[\\\\s\\\\-]*cv\\\\b|\\\\brdw[\\\\s\\\\-]*cv\\\\b|\\\\bred[\\\\s\\\\-]*cell[\\\\s\\\\-]*distribution[\\\\s\\\\-]*width[\\\\s\\\\-]*cv\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "11.5-14.5"
      },
      "RDW-SD": {
        "pattern": "(?:\\\\brdw[\\\\s\\\\-]*sd\\\\b|\\\\brdw[\\\\s\\\\-]*sd\\\\b|\\\\bred[\\\\s\\\\-]*cell[\\\\s\\\\-]*distribution[\\\\s\\\\-]*width[\\\\s\\\\-]*sd\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "fL",
        "range": "35-56"
      },
      "RDW": {
        "pattern": "(?:\\\\brdw\\\\b|\\\\bred[\\\\s\\\\-]*cell[\\\\s\\\\-]*distribution[\\\\s\\\\-]*width\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "11.6-14.0"
      },
      "WBC": {
        "pattern": "(?:\\\\bwbc\\\\b|\\\\bwhite[\\\\s\\\\-]*blood[\\\\s\\\\-]*cell\\\\b|\\\\bwhite[\\\\s\\\\-]*blood[\\\\s\\\\-]*cells\\\\b|\\\\btotal[\\\\s\\\\-]*leucocytes[\\\\s\\\\-]*wbc[\\\\s\\\\-]*count\\\\b|\\\\btotal[\\\\s\\\\-]*leucocytes\\\\b|\\\\bleukocytes\\\\b|\\\\btotal[\\\\s\\\\-]*leukocyte[\\\\s\\\\-]*count\\\\b|\\\\btotal[\\\\s\\\\-]*leukocytes[\\\\s\\\\-]*count\\\\b|\\\\btlc\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "/uL",
        "range": "4000-11000"
      },
      "NEU%": {
        "pattern": "(?:\\\\bneu\\\\b|\\\\bneutrophils\\\\b|\\\\bneutrophil[\\\\s\\\\-]*percentage\\\\b|\\\\bneutrophil\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "40-70"
      },
      "LYM%": {
        "pattern": "(?:\\\\blym\\\\b|\\\\blymphocytes\\\\b|\\\\blymphocyte[\\\\s\\\\-]*percentage\\\\b|\\\\blymphocyte\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "20-45"
      },
      "MON%": {
        "pattern": "(?:\\\\bmon\\\\b|\\\\bmonocytes\\\\b|\\\\bmonocyte[\\\\s\\\\-]*percentage\\\\b|\\\\bmonocyte\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "2-10"
      },
      "EOS%": {
        "pattern": "(?:\\\\beos\\\\b|\\\\beosinophils\\\\b|\\\\beosinophil[\\\\s\\\\-]*percentage\\\\b|\\\\beosinophil\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "1-6"
      },
      "BAS%": {
        "pattern": "(?:\\\\bbas\\\\b|\\\\bbasophils\\\\b|\\\\bbasophil[\\\\s\\\\-]*percentage\\\\b|\\\\bbasophil\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "0-2"
      },
      "LYM#": {
        "pattern": "(?:\\\\blym\\\\b|\\\\babsolute[\\\\s\\\\-]*lymphocyte[\\\\s\\\\-]*count\\\\b|\\\\blymphocyte[\\\\s\\\\-]*count\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "10^3/uL",
        "range": "1.5-4.0"
      },
      "GRA#": {
        "pattern": "(?:\\\\bgra\\\\b|\\\\bgranulocytes\\\\b|\\\\babsolute[\\\\s\\\\-]*granulocyte[\\\\s\\\\-]*count\\\\b|\\\\bgranulocyte[\\\\s\\\\-]*count\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "10^3/uL",
        "range": "2.0-7.5"
      },
      "PLT": {
        "pattern": "(?:\\\\bplt\\\\b|\\\\bplatelet\\\\b|\\\\bplatelets\\\\b|\\\\bplatelet[\\\\s\\\\-]*count\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "10^3/uL",
        "range": "150-450"
      },
      "ESR": {
        "pattern": "(?:\\\\besr\\\\b|\\\\berythrocyte[\\\\s\\\\-]*sedimentation[\\\\s\\\\-]*rate\\\\b|\\\\bsed[\\\\s\\\\-]*rate\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mm/hr",
        "range": "0-15"
      },
      "Reticulocyte Count": {
        "pattern": "(?:\\\\breticulocyte[\\\\s\\\\-]*count\\\\b|\\\\bretics\\\\b|\\\\breticulocytes\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "0.5-2.5"
      },
      "Peripheral Smear": {
        "pattern": "\\\\bperipheral[\\\\s\\\\-]*smear\\\\b|\\\\bps\\\\b|\\\\bperipheral[\\\\s\\\\-]*blood[\\\\s\\\\-]*smear\\\\b|\\\\bblood[\\\\s\\\\-]*smear\\\\b",
        "unit": null,
        "range": "normal"
      },
      "Coagulation Profile": {
        "pattern": "(?:\\\\bcoagulation[\\\\s\\\\-]*profile\\\\b|\\\\bpt[\\\\s\\\\-]*inr\\\\b|\\\\bprothrombin[\\\\s\\\\-]*time\\\\b|\\\\baptt\\\\b|\\\\ba[\\\\s\\\\-]*ptt\\\\b|\\\\bcoagulation\\\\b|\\\\bpt[\\\\s\\\\-]*inr\\\\b|\\\\bpt\\\\b|\\\\binr\\\\b|\\\\baptt\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": null,
        "range": "9.5-13.8"
      },
      "Bleeding Time": {
        "pattern": "(?:\\\\bbleeding[\\\\s\\\\-]*time\\\\b|\\\\bbt\\\\b|\\\\bbleeding[\\\\s\\\\-]*test\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "minutes",
        "range": "2-7"
      },
      "Clotting Time": {
        "pattern": "(?:\\\\bclotting[\\\\s\\\\-]*time\\\\b|\\\\bct\\\\b|\\\\bclotting[\\\\s\\\\-]*test\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "minutes",
        "range": "4-8"
      },
      "D-Dimer": {
        "pattern": "(?:\\\\bd[\\\\s\\\\-]*dimer\\\\b|\\\\bd[\\\\s\\\\-]*dimer\\\\b|\\\\bddimer\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "0-0.5"
      },
      "Fasting Blood Glucose": {
        "pattern": "(?:\\\\bfasting[\\\\s\\\\-]*blood[\\\\s\\\\-]*glucose\\\\b|\\\\bfbg\\\\b|\\\\bfasting[\\\\s\\\\-]*blood[\\\\s\\\\-]*sugar\\\\b|\\\\bfbs\\\\b|\\\\bfasting[\\\\s\\\\-]*glucose\\\\b|\\\\bfasting[\\\\s\\\\-]*sugar\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "70-100"
      },
      "Post Prandial Glucose": {
        "pattern": "(?:\\\\bpost[\\\\s\\\\-]*prandial[\\\\s\\\\-]*glucose\\\\b|\\\\bppbs\\\\b|\\\\bpp[\\\\s\\\\-]*blood[\\\\s\\\\-]*sugar\\\\b|\\\\bpostprandial[\\\\s\\\\-]*blood[\\\\s\\\\-]*sugar\\\\b|\\\\bpp[\\\\s\\\\-]*glucose\\\\b|\\\\b2[\\\\s\\\\-]*hour[\\\\s\\\\-]*postprandial[\\\\s\\\\-]*glucose\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "70-140"
      },
      "Random Blood Sugar": {
        "pattern": "(?:\\\\brandom[\\\\s\\\\-]*blood[\\\\s\\\\-]*sugar\\\\b|\\\\brbs\\\\b|\\\\brandom[\\\\s\\\\-]*glucose\\\\b|\\\\brandom[\\\\s\\\\-]*blood[\\\\s\\\\-]*glucose\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "70-125"
      },
      "HbA1c": {
        "pattern": "(?:\\\\bhba1c\\\\b|\\\\bglycosylated[\\\\s\\\\-]*hemoglobin\\\\b|\\\\bglycated[\\\\s\\\\-]*hemoglobin\\\\b|\\\\ba1c\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "%",
        "range": "4.0-5.6"
      },
      "Urea": {
        "pattern": "(?:\\\\burea\\\\b|\\\\bserum[\\\\s\\\\-]*urea\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "19-49"
      },
      "Creatinine": {
        "pattern": "(?:\\\\bcreatinine\\\\b|\\\\bserum[\\\\s\\\\-]*creatinine\\\\b|\\\\bcreat\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "0.6-1.3"
      },
      "Uric Acid": {
        "pattern": "(?:\\\\buric[\\\\s\\\\-]*acid\\\\b|\\\\bserum[\\\\s\\\\-]*uric[\\\\s\\\\-]*acid\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "3.5-7.2"
      },
      "Blood Urea Nitrogen": {
        "pattern": "(?:\\\\bblood[\\\\s\\\\-]*urea[\\\\s\\\\-]*nitrogen\\\\b|\\\\bbun\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "6-20"
      },
      "Sodium": {
        "pattern": "(?:\\\\bsodium\\\\b|\\\\bna\\\\b|\\\\bna\\\\b|\\\\bserum[\\\\s\\\\-]*sodium\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mEq/L",
        "range": "136-144"
      },
      "Potassium": {
        "pattern": "(?:\\\\bpotassium\\\\b|\\\\bk\\\\b|\\\\bk\\\\b|\\\\bserum[\\\\s\\\\-]*potassium\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mEq/L",
        "range": "3.7-5.2"
      },
      "Chloride": {
        "pattern": "(?:\\\\bchloride\\\\b|\\\\bcl\\\\b|\\\\bcl\\\\b|\\\\bserum[\\\\s\\\\-]*chloride\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mEq/L",
        "range": "96-106"
      },
      "Bicarbonate": {
        "pattern": "(?:\\\\bbicarbonate\\\\b|\\\\bco2\\\\b|\\\\bhco3\\\\b|\\\\bcarbon[\\\\s\\\\-]*dioxide\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mEq/L",
        "range": "23-29"
      },
      "Calcium": {
        "pattern": "(?:\\\\bcalcium\\\\b|\\\\bca\\\\b|\\\\bca2\\\\b|\\\\bserum[\\\\s\\\\-]*calcium\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "8.5-10.2"
      },
      "Phosphorus": {
        "pattern": "(?:\\\\bphosphorus\\\\b|\\\\bphosphate\\\\b|\\\\bpo4\\\\b|\\\\bpo4[\\\\s\\\\-]*3\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "2.8-4.5"
      },
      "Magnesium": {
        "pattern": "(?:\\\\bmagnesium\\\\b|\\\\bmg\\\\b|\\\\bmg2\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "1.7-2.2"
      },
      "Total Protein": {
        "pattern": "(?:\\\\btotal[\\\\s\\\\-]*protein\\\\b|\\\\bprotein[\\\\s\\\\-]*total\\\\b|\\\\bserum[\\\\s\\\\-]*total[\\\\s\\\\-]*protein\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "g/dL",
        "range": "6.0-8.3"
      },
      "Albumin": {
        "pattern": "(?:\\\\balbumin\\\\b|\\\\bserum[\\\\s\\\\-]*albumin\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "g/dL",
        "range": "3.4-5.4"
      },
      "Globulin": {
        "pattern": "(?:\\\\bglobulin\\\\b|\\\\bserum[\\\\s\\\\-]*globulin\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "g/dL",
        "range": "2.1-3.9"
      },
      "A/G Ratio": {
        "pattern": "(?:\\\\ba[\\\\s\\\\-]*g[\\\\s\\\\-]*ratio\\\\b|\\\\bag[\\\\s\\\\-]*ratio\\\\b|\\\\ba[\\\\s\\\\-]*g[\\\\s\\\\-]*ratio\\\\b|\\\\balbumin[\\\\s\\\\-]*globulin[\\\\s\\\\-]*ratio\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ratio",
        "range": "0.8-2.1"
      },
      "Bilirubin-Total": {
        "pattern": "(?:\\\\bbilirubin[\\\\s\\\\-]*total\\\\b|\\\\bbilirubin[\\\\s\\\\-]*total\\\\b|\\\\btotal[\\\\s\\\\-]*bilirubin\\\\b|\\\\bt[\\\\s\\\\-]*bil\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "0.1-1.2"
      },
      "Bilirubin-Direct": {
        "pattern": "(?:\\\\bbilirubin[\\\\s\\\\-]*direct\\\\b|\\\\bdirect[\\\\s\\\\-]*bilirubin\\\\b|\\\\bconjugated[\\\\s\\\\-]*bilirubin\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "0.0-0.3"
      },
      "Bilirubin-Indirect": {
        "pattern": "(?:\\\\bbilirubin[\\\\s\\\\-]*indirect\\\\b|\\\\bindirect[\\\\s\\\\-]*bilirubin\\\\b|\\\\bunconjugated[\\\\s\\\\-]*bilirubin\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "0.2-0.8"
      },
      "SGPT": {
        "pattern": "(?:\\\\bsgpt\\\\b|\\\\balt\\\\b|\\\\balanine[\\\\s\\\\-]*aminotransferase\\\\b|\\\\balanine\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/L",
        "range": "4-36"
      },
      "SGOT": {
        "pattern": "(?:\\\\bsgot\\\\b|\\\\bast\\\\b|\\\\baspartate[\\\\s\\\\-]*aminotransferase\\\\b|\\\\baspartate\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/L",
        "range": "8-33"
      },
      "SGOT/SGPT": {
        "pattern": "(?:\\\\bsgot[\\\\s\\\\-]*sgpt\\\\b|\\\\bast[\\\\s\\\\-]*alt[\\\\s\\\\-]*ratio\\\\b|\\\\bsgot[\\\\s\\\\-]*sgpt[\\\\s\\\\-]*ratio\\\\b|\\\\bast[\\\\s\\\\-]*alt[\\\\s\\\\-]*ratio\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ratio",
        "range": "\u2014"
      },
      "Alkaline Phosphatase": {
        "pattern": "(?:\\\\balkaline[\\\\s\\\\-]*phosphatase\\\\b|\\\\balp\\\\b|\\\\balk[\\\\s\\\\-]*phos\\\\b|\\\\balk[\\\\s\\\\-]*phosp\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/L",
        "range": "20-130"
      },
      "Gamma GT": {
        "pattern": "(?:\\\\bgamma[\\\\s\\\\-]*gt\\\\b|\\\\bggt\\\\b|\\\\bgamma[\\\\s\\\\-]*glutamyl[\\\\s\\\\-]*transferase\\\\b|\\\\bgamma[\\\\s\\\\-]*glutamyl[\\\\s\\\\-]*transferase\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/L",
        "range": "9-48"
      },
      "Amylase": {
        "pattern": "(?:\\\\bamylase\\\\b|\\\\bserum[\\\\s\\\\-]*amylase\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/L",
        "range": "30-110"
      },
      "Lipase": {
        "pattern": "(?:\\\\blipase\\\\b|\\\\bserum[\\\\s\\\\-]*lipase\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/L",
        "range": "13-60"
      },
      "Lactate Dehydrogenase": {
        "pattern": "(?:\\\\blactate[\\\\s\\\\-]*dehydrogenase\\\\b|\\\\bldh\\\\b|\\\\bld\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/L",
        "range": "122-222"
      },
      "Creatine Kinase": {
        "pattern": "(?:\\\\bcreatine[\\\\s\\\\-]*kinase\\\\b|\\\\bck\\\\b|\\\\bcpk\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/L",
        "range": "26-192"
      },
      "CK-MB": {
        "pattern": "(?:\\\\bck[\\\\s\\\\-]*mb\\\\b|\\\\bck[\\\\s\\\\-]*mb\\\\b|\\\\bcreatine[\\\\s\\\\-]*kinase[\\\\s\\\\-]*mb\\\\b|\\\\bckmb\\\\b|\\\\bcreatine[\\\\s\\\\-]*phosphokinase[\\\\s\\\\-]*mb\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "0-7"
      },
      "Troponin I": {
        "pattern": "(?:\\\\btroponin[\\\\s\\\\-]*i\\\\b|\\\\btrop[\\\\s\\\\-]*i\\\\b|\\\\btrop[\\\\s\\\\-]*i\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "0-0.04"
      },
      "Troponin T": {
        "pattern": "(?:\\\\btroponin[\\\\s\\\\-]*t\\\\b|\\\\btrop[\\\\s\\\\-]*t\\\\b|\\\\btrop[\\\\s\\\\-]*t\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "0-0.01"
      },
      "Cholesterol - Total": {
        "pattern": "(?:\\\\bcholesterol[\\\\s\\\\-]*total\\\\b|\\\\btotal[\\\\s\\\\-]*cholesterol\\\\b|\\\\btotal[\\\\s\\\\-]*chol\\\\b|\\\\btc\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "0-200"
      },
      "Triglycerides": {
        "pattern": "(?:\\\\btriglycerides\\\\b|\\\\btriglyceride\\\\b|\\\\btg\\\\b|\\\\btriglyc\\\\b|\\\\btri[\\\\s\\\\-]*glycerides\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "0-150"
      },
      "Cholesterol - HDL": {
        "pattern": "(?:\\\\bcholesterol[\\\\s\\\\-]*hdl\\\\b|\\\\bhdl\\\\b|\\\\bhigh[\\\\s\\\\-]*density[\\\\s\\\\-]*lipoprotein\\\\b|\\\\bhdl[\\\\s\\\\-]*cholesterol\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "40-500"
      },
      "Cholesterol - LDL": {
        "pattern": "(?:\\\\bcholesterol[\\\\s\\\\-]*ldl\\\\b|\\\\bldl\\\\b|\\\\blow[\\\\s\\\\-]*density[\\\\s\\\\-]*lipoprotein\\\\b|\\\\bldl[\\\\s\\\\-]*cholesterol\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "0-100"
      },
      "Cholesterol - VLDL": {
        "pattern": "(?:\\\\bcholesterol[\\\\s\\\\-]*vldl\\\\b|\\\\bvldl\\\\b|\\\\bvery[\\\\s\\\\-]*low[\\\\s\\\\-]*density[\\\\s\\\\-]*lipoprotein\\\\b|\\\\bvldl[\\\\s\\\\-]*cholesterol\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "0-30"
      },
      "Non HDL Cholesterol": {
        "pattern": "(?:\\\\bnon[\\\\s\\\\-]*hdl[\\\\s\\\\-]*cholesterol\\\\b|\\\\bnon[\\\\s\\\\-]*hdl[\\\\s\\\\-]*cholesterol\\\\b|\\\\bnon[\\\\s\\\\-]*hdl\\\\b|\\\\bnon[\\\\s\\\\-]*hdl[\\\\s\\\\-]*chol\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/dL",
        "range": "0-130"
      },
      "LDL/HDL Ratio": {
        "pattern": "(?:\\\\bldl[\\\\s\\\\-]*hdl[\\\\s\\\\-]*ratio\\\\b|\\\\bldl[\\\\s\\\\-]*hdl[\\\\s\\\\-]*ratio\\\\b|\\\\bcholesterol[\\\\s\\\\-]*ratio\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ratio",
        "range": "0-3.5"
      },
      "TSH": {
        "pattern": "(?:\\\\btsh\\\\b|\\\\bthyroid[\\\\s\\\\-]*stimulating[\\\\s\\\\-]*hormone\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "uIU/mL",
        "range": "0.55-4.78"
      },
      "Free T3": {
        "pattern": "(?:\\\\bfree[\\\\s\\\\-]*t3\\\\b|\\\\bft3\\\\b|\\\\bfree[\\\\s\\\\-]*triiodothyronine\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "pg/mL",
        "range": "2.3-4.2"
      },
      "Free T4": {
        "pattern": "(?:\\\\bfree[\\\\s\\\\-]*t4\\\\b|\\\\bft4\\\\b|\\\\bfree[\\\\s\\\\-]*thyroxine\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/dL",
        "range": "0.8-1.8"
      },
      "Total T3": {
        "pattern": "(?:\\\\btotal[\\\\s\\\\-]*t3\\\\b|\\\\bt3[\\\\s\\\\-]*total\\\\b|\\\\btriiodothyronine\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/dL",
        "range": "80-180"
      },
      "Total T4": {
        "pattern": "(?:\\\\btotal[\\\\s\\\\-]*t4\\\\b|\\\\bt4[\\\\s\\\\-]*total\\\\b|\\\\bthyroxine\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "\u00b5g/dL",
        "range": "5-12"
      },
      "Insulin": {
        "pattern": "(?:\\\\binsulin\\\\b|\\\\bfasting[\\\\s\\\\-]*insulin\\\\b|\\\\binsulin[\\\\s\\\\-]*fasting\\\\b|\\\\binsulin[\\\\s\\\\-]*fasting\\\\b|\\\\binsulin[\\\\s\\\\-]*pp\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "\u00b5IU/mL",
        "range": "2-25"
      },
      "Cortisol": {
        "pattern": "(?:\\\\bcortisol\\\\b|\\\\bserum[\\\\s\\\\-]*cortisol\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "\u00b5g/dL",
        "range": "6-22"
      },
      "Parathyroid Hormone": {
        "pattern": "(?:\\\\bparathyroid[\\\\s\\\\-]*hormone\\\\b|\\\\bpth\\\\b|\\\\bintact[\\\\s\\\\-]*parathyroid[\\\\s\\\\-]*hormone\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "pg/mL",
        "range": "10-65"
      },
      "Vitamin D": {
        "pattern": "(?:\\\\bvitamin[\\\\s\\\\-]*d\\\\b|\\\\b25[\\\\s\\\\-]*oh[\\\\s\\\\-]*vitamin[\\\\s\\\\-]*d\\\\b|\\\\b25[\\\\s\\\\-]*hydroxy[\\\\s\\\\-]*vitamin[\\\\s\\\\-]*d\\\\b|\\\\bvit[\\\\s\\\\-]*d\\\\b|\\\\bcholecalciferol\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "30-100"
      },
      "Vitamin B12": {
        "pattern": "(?:\\\\bvitamin[\\\\s\\\\-]*b12\\\\b|\\\\bvit[\\\\s\\\\-]*b12\\\\b|\\\\bb12\\\\b|\\\\bcobalamin\\\\b|\\\\bvitamin[\\\\s\\\\-]*b[\\\\s\\\\-]*12\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "pg/mL",
        "range": "200-900"
      },
      "Complete Urine Examination": {
        "pattern": "\\\\bcomplete[\\\\s\\\\-]*urine[\\\\s\\\\-]*examination\\\\b|\\\\bcue\\\\b|\\\\burinalysis\\\\b|\\\\burine[\\\\s\\\\-]*routine\\\\b|\\\\burine[\\\\s\\\\-]*routine[\\\\s\\\\-]*and[\\\\s\\\\-]*microscopy\\\\b|\\\\burine[\\\\s\\\\-]*test\\\\b",
        "unit": null,
        "range": "normal"
      },
      "Urine Culture": {
        "pattern": "\\\\burine[\\\\s\\\\-]*culture\\\\b|\\\\burine[\\\\s\\\\-]*culture[\\\\s\\\\-]*sensitivity\\\\b|\\\\burine[\\\\s\\\\-]*c[\\\\s\\\\-]*s\\\\b|\\\\burine[\\\\s\\\\-]*culture[\\\\s\\\\-]*and[\\\\s\\\\-]*sensitivity\\\\b",
        "unit": null,
        "range": "no growth"
      },
      "Blood Culture": {
        "pattern": "\\\\bblood[\\\\s\\\\-]*culture\\\\b|\\\\bblood[\\\\s\\\\-]*culture[\\\\s\\\\-]*sensitivity\\\\b|\\\\bblood[\\\\s\\\\-]*c[\\\\s\\\\-]*s\\\\b|\\\\bblood[\\\\s\\\\-]*culture[\\\\s\\\\-]*and[\\\\s\\\\-]*sensitivity\\\\b",
        "unit": null,
        "range": "no growth"
      },
      "Sputum Culture": {
        "pattern": "\\\\bsputum[\\\\s\\\\-]*culture\\\\b|\\\\bsputum[\\\\s\\\\-]*culture[\\\\s\\\\-]*sensitivity\\\\b|\\\\bsputum[\\\\s\\\\-]*c[\\\\s\\\\-]*s\\\\b|\\\\bsputum\\\\b|\\\\bculture[\\\\s\\\\-]*sputum\\\\b",
        "unit": null,
        "range": "no growth"
      },
      "Widal Test": {
        "pattern": "(?:\\\\bwidal[\\\\s\\\\-]*test\\\\b|\\\\bwidal\\\\b|\\\\btyphoid[\\\\s\\\\-]*test\\\\b|\\\\bwidal[\\\\s\\\\-]*titer\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "titer",
        "range": "0-1.8"
      },
      "Dengue NS1 Antigen": {
        "pattern": "\\\\bdengue[\\\\s\\\\-]*ns1\\\\b|\\\\bdengue[\\\\s\\\\-]*ns1[\\\\s\\\\-]*antigen\\\\b|\\\\bns1[\\\\s\\\\-]*antigen\\\\b",
        "unit": null,
        "range": "negative"
      },
      "Dengue IgM/IgG": {
        "pattern": "\\\\bdengue[\\\\s\\\\-]*igm[\\\\s\\\\-]*igg\\\\b|\\\\bdengue[\\\\s\\\\-]*igm\\\\b|\\\\bdengue[\\\\s\\\\-]*igg\\\\b|\\\\bdengue[\\\\s\\\\-]*antibodies\\\\b",
        "unit": null,
        "range": "negative"
      },
      "Malaria Antigen Test": {
        "pattern": "\\\\bmalaria[\\\\s\\\\-]*antigen[\\\\s\\\\-]*test\\\\b|\\\\bmalaria[\\\\s\\\\-]*antigen\\\\b|\\\\bmalaria[\\\\s\\\\-]*test\\\\b|\\\\bmalaria[\\\\s\\\\-]*rapid[\\\\s\\\\-]*test\\\\b",
        "unit": null,
        "range": "negative"
      },
      "Peripheral Smear for Malaria": {
        "pattern": "\\\\bperipheral[\\\\s\\\\-]*smear[\\\\s\\\\-]*for[\\\\s\\\\-]*malaria\\\\b|\\\\bmp[\\\\s\\\\-]*smear\\\\b|\\\\bmalaria[\\\\s\\\\-]*smear\\\\b|\\\\bmalaria[\\\\s\\\\-]*parasite[\\\\s\\\\-]*smear\\\\b",
        "unit": null,
        "range": "negative"
      },
      "HBsAg": {
        "pattern": "\\\\bhbsag\\\\b|\\\\bhepatitis[\\\\s\\\\-]*b[\\\\s\\\\-]*surface[\\\\s\\\\-]*antigen\\\\b|\\\\bhbv[\\\\s\\\\-]*surface[\\\\s\\\\-]*antigen\\\\b",
        "unit": null,
        "range": "negative"
      },
      "Anti-HCV": {
        "pattern": "\\\\banti[\\\\s\\\\-]*hcv\\\\b|\\\\bhepatitis[\\\\s\\\\-]*c[\\\\s\\\\-]*antibody\\\\b|\\\\bhcv[\\\\s\\\\-]*antibody\\\\b|\\\\banti[\\\\s\\\\-]*hcv\\\\b",
        "unit": null,
        "range": "negative"
      },
      "HIV 1 & 2 Antibody": {
        "pattern": "\\\\bhiv[\\\\s\\\\-]*1[\\\\s\\\\-]*2[\\\\s\\\\-]*antibody\\\\b|\\\\bhiv[\\\\s\\\\-]*antibody\\\\b|\\\\bhiv[\\\\s\\\\-]*test\\\\b|\\\\bhiv[\\\\s\\\\-]*1[\\\\s\\\\-]*antibody\\\\b|\\\\bhiv[\\\\s\\\\-]*2[\\\\s\\\\-]*antibody\\\\b",
        "unit": null,
        "range": "negative"
      },
      "VDRL": {
        "pattern": "\\\\bvdrl\\\\b|\\\\bsyphilis[\\\\s\\\\-]*test\\\\b|\\\\bvdrl[\\\\s\\\\-]*test\\\\b",
        "unit": null,
        "range": "negative"
      },
      "TB Gold": {
        "pattern": "\\\\btb[\\\\s\\\\-]*gold\\\\b|\\\\bquantiferon[\\\\s\\\\-]*tb\\\\b|\\\\bquantiferon[\\\\s\\\\-]*tb[\\\\s\\\\-]*gold\\\\b|\\\\btb[\\\\s\\\\-]*test\\\\b|\\\\bquantiferon\\\\b",
        "unit": null,
        "range": "negative"
      },
      "Mantoux Test": {
        "pattern": "(?:\\\\bmantoux[\\\\s\\\\-]*test\\\\b|\\\\bppd[\\\\s\\\\-]*skin[\\\\s\\\\-]*test\\\\b|\\\\bmantoux\\\\b|\\\\btb[\\\\s\\\\-]*skin[\\\\s\\\\-]*test\\\\b|\\\\bppd\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mm",
        "range": "0-4.9"
      },
      "CRP": {
        "pattern": "(?:\\\\bcrp\\\\b|\\\\bc[\\\\s\\\\-]*reactive[\\\\s\\\\-]*protein\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/L",
        "range": "0-5"
      },
      "Procalcitonin": {
        "pattern": "(?:\\\\bprocalcitonin\\\\b|\\\\bpct\\\\b|\\\\bserum[\\\\s\\\\-]*procalcitonin\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "0-0.1"
      },
      "ASO Titer": {
        "pattern": "(?:\\\\baso[\\\\s\\\\-]*titer\\\\b|\\\\baso\\\\b|\\\\banti[\\\\s\\\\-]*streptolysin[\\\\s\\\\-]*o\\\\b|\\\\banti[\\\\s\\\\-]*streptolysin[\\\\s\\\\-]*o\\\\b|\\\\baso[\\\\s\\\\-]*titre\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "IU/mL",
        "range": "0-200"
      },
      "Rheumatoid Factor": {
        "pattern": "(?:\\\\brheumatoid[\\\\s\\\\-]*factor\\\\b|\\\\brf\\\\b|\\\\bra[\\\\s\\\\-]*factor\\\\b|\\\\brheumatoid[\\\\s\\\\-]*factor[\\\\s\\\\-]*test\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "IU/mL",
        "range": "0-14"
      },
      "Urinalysis": {
        "pattern": "\\\\burinalysis\\\\b|\\\\burine[\\\\s\\\\-]*routine\\\\b|\\\\burine[\\\\s\\\\-]*examination\\\\b|\\\\burine[\\\\s\\\\-]*test\\\\b",
        "unit": null,
        "range": "normal"
      },
      "24-Hour Urinary Protein": {
        "pattern": "(?:\\\\b24[\\\\s\\\\-]*hour[\\\\s\\\\-]*urinary[\\\\s\\\\-]*protein\\\\b|\\\\b24h[\\\\s\\\\-]*urine[\\\\s\\\\-]*protein\\\\b|\\\\burine[\\\\s\\\\-]*protein[\\\\s\\\\-]*24h\\\\b|\\\\b24[\\\\s\\\\-]*hour[\\\\s\\\\-]*urine[\\\\s\\\\-]*protein\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/day",
        "range": "0-150"
      },
      "Microalbuminuria": {
        "pattern": "(?:\\\\bmicroalbuminuria\\\\b|\\\\burine[\\\\s\\\\-]*microalbumin\\\\b|\\\\bmicroalbumin\\\\b|\\\\burine[\\\\s\\\\-]*albumin\\\\b|\\\\bmicro[\\\\s\\\\-]*albumin\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mg/day",
        "range": "0-30"
      },
      "Stool Routine": {
        "pattern": "\\\\bstool[\\\\s\\\\-]*routine\\\\b|\\\\bstool[\\\\s\\\\-]*routine[\\\\s\\\\-]*microscopy\\\\b|\\\\bstool[\\\\s\\\\-]*examination\\\\b|\\\\bstool[\\\\s\\\\-]*test\\\\b",
        "unit": null,
        "range": "normal"
      },
      "Stool Occult Blood Test": {
        "pattern": "\\\\bstool[\\\\s\\\\-]*occult[\\\\s\\\\-]*blood[\\\\s\\\\-]*test\\\\b|\\\\bfobt\\\\b|\\\\bstool[\\\\s\\\\-]*occult[\\\\s\\\\-]*blood\\\\b|\\\\bguaiac[\\\\s\\\\-]*test\\\\b|\\\\bfecal[\\\\s\\\\-]*occult[\\\\s\\\\-]*blood[\\\\s\\\\-]*test\\\\b",
        "unit": null,
        "range": "negative"
      },
      "Semen Analysis": {
        "pattern": "\\\\bsemen[\\\\s\\\\-]*analysis\\\\b|\\\\bsemen[\\\\s\\\\-]*test\\\\b|\\\\bsperm[\\\\s\\\\-]*analysis\\\\b|\\\\bsperm[\\\\s\\\\-]*count\\\\b",
        "unit": null,
        "range": "normal"
      },
      "CSF Analysis": {
        "pattern": "\\\\bcsf[\\\\s\\\\-]*analysis\\\\b|\\\\bcerebrospinal[\\\\s\\\\-]*fluid[\\\\s\\\\-]*analysis\\\\b|\\\\bcsf\\\\b",
        "unit": null,
        "range": "normal"
      },
      "PSA": {
        "pattern": "(?:\\\\bpsa\\\\b|\\\\bprostate[\\\\s\\\\-]*specific[\\\\s\\\\-]*antigen\\\\b|\\\\bprostate[\\\\s\\\\-]*antigen\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "0-4"
      },
      "CA-125": {
        "pattern": "(?:\\\\bca[\\\\s\\\\-]*125\\\\b|\\\\bca[\\\\s\\\\-]*125\\\\b|\\\\bcancer[\\\\s\\\\-]*antigen[\\\\s\\\\-]*125\\\\b|\\\\bovarian[\\\\s\\\\-]*cancer[\\\\s\\\\-]*marker\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/mL",
        "range": "0-35"
      },
      "CEA": {
        "pattern": "(?:\\\\bcea\\\\b|\\\\bcarcinoembryonic[\\\\s\\\\-]*antigen\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "0-3"
      },
      "AFP": {
        "pattern": "(?:\\\\bafp\\\\b|\\\\balpha[\\\\s\\\\-]*fetoprotein\\\\b|\\\\balpha[\\\\s\\\\-]*fetoprotein\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "0-10"
      },
      "CA 19-9": {
        "pattern": "(?:\\\\bca[\\\\s\\\\-]*19[\\\\s\\\\-]*9\\\\b|\\\\bca19[\\\\s\\\\-]*9\\\\b|\\\\bca19[\\\\s\\\\-]*9\\\\b|\\\\bcarbohydrate[\\\\s\\\\-]*antigen[\\\\s\\\\-]*19[\\\\s\\\\-]*9\\\\b|\\\\bcancer[\\\\s\\\\-]*antigen[\\\\s\\\\-]*19[\\\\s\\\\-]*9\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "U/mL",
        "range": "0-37"
      },
      "Beta-hCG": {
        "pattern": "(?:\\\\bbeta[\\\\s\\\\-]*hcg\\\\b|\\\\bbeta[\\\\s\\\\-]*hcg\\\\b|\\\\bhcg\\\\b|\\\\bhcg\\\\b|\\\\bhuman[\\\\s\\\\-]*chorionic[\\\\s\\\\-]*gonadotropin\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "mIU/mL",
        "range": "0-5"
      },
      "LDH Isoenzymes": {
        "pattern": "\\\\bldh[\\\\s\\\\-]*isoenzymes\\\\b|\\\\bld[\\\\s\\\\-]*isoenzymes\\\\b|\\\\blactate[\\\\s\\\\-]*dehydrogenase[\\\\s\\\\-]*isoenzymes\\\\b",
        "unit": null,
        "range": "normal distribution"
      },
      "Serum Ferritin": {
        "pattern": "(?:\\\\bserum[\\\\s\\\\-]*ferritin\\\\b|\\\\bferritin\\\\b|\\\\bferritin[\\\\s\\\\-]*level\\\\b)[:\\s\\-]*([0-9]+(?:\\.[0-9]+)?)",
        "unit": "ng/mL",
        "range": "20-250"
      },
      "Absolute Neutrophil Count": {
        pattern: "(?:absolute\\s*neutrophil\\s*count|anc)[:\\s\\-]*([\\d\\.]+)",
        unit: "10^3/uL",
        range: "2-7"
      },
      "Absolute Lymphocyte Count": {
        pattern: "(?:absolute\\s*lymphocyte\\s*count|alc)[:\\s\\-]*([\\d\\.]+)",
        unit: "10^3/uL",
        range: "1-3"
      },
      "Absolute Monocyte Count": {
        pattern: "(?:absolute\\s*monocyte\\s*count|amc)[:\\s\\-]*([\\d\\.]+)",
        unit: "10^3/uL",
        range: "0.2-1"
      },
      "Absolute Eosinophil Count": {
        pattern: "(?:absolute\\s*eosinophil\\s*count|aec)[:\\s\\-]*([\\d\\.]+)",
        unit: "10^3/uL",
        range: "0.02-0.5"
      },
      "Absolute Basophil Count": {
        pattern: "(?:absolute\\s*basophil\\s*count|abc)[:\\s\\-]*([\\d\\.]+)",
        unit: "10^3/uL",
        range: "0.02-0.1"
      },
      "MPV": {
        pattern: "(?:mpv|mean\\s*platelet\\s*volume)[:\\s\\-]*([\\d\\.]+)",
        unit: "fL",
        range: "6.5-12"
      },
      "PDW": {
        pattern: "(?:pdw|platelet\\s*distribution\\s*width)[:\\s\\-]*([\\d\\.]+)",
        unit: "fL",
        range: "9-17"
      },
      "Cholesterol : HDL Ratio": {
        pattern: "(?:cholesterol\\s*[:/]\\s*hdl\\s*cholesterol|cholesterol\\s*hdl\\s*ratio|chol\\/hdl\\s*ratio)[:\\s\\-]*([\\d\\.]+)",
        unit: "Ratio",
        range: "3.5-4.5"
      },
      "Bilirubin (urine)": {
        pattern: "(?:urine\\s*bilirubin|bilirubin\\s*\\(urine\\))[:\\s\\-]*([A-Za-z]+)",
        unit: null,
        range: "Negative"
      }
    }

  const results = {};
  for(const [test, info] of Object.entries(testDict)) {
  const regex = new RegExp(info.pattern, 'i');
  const match = regex.exec(this.text);
  if (match) {
    // If there are capturing groups, use the last one; otherwise undefined
    const value = match[match.length - 1] || undefined;
    results[test] = {
      value,
      unit: info.unit || null,
      normal_range: info.range,
    };
  }
}
return results;
  }
}

module.exports = { LabTestParser };