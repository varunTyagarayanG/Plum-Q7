/**
 * Normalizer Service
 *
 * Converts raw OCR lines into standardized tests with:
 *  - canonical name
 *  - numeric value (if present)
 *  - canonical unit
 *  - reference range (low/high when applicable)
 *  - status: "low" | "normal" | "high" | "unknown"
 * Also computes a normalization confidence.
 *
 * Notes:
 *  - Aliases include common typos & alternate spellings (e.g., Hemglobin, Haemoglobin).
 *  - For WBC lines that say "10^3/uL" we rescale to "/uL" by multiplying by 1000.
 *  - Qualitative urine tests are supported with expected values (e.g., Negative, Clear).
 */

const CANONICAL = {
    // --- CBC / Hemogram ---
    "Hemoglobin": {
        aliases: ["hemoglobin", "haemoglobin", "hb", "hgb", "hemglobin", "hemoglobin level"],
        unit: "g/dL",
        ref_range: { low: 12.0, high: 15.0 },
    },
    "RBC": {
        aliases: ["rbc", "red blood cell count", "total rbc count", "r.b.c", "red blood cells"],
        unit: "10^6/uL",
        ref_range: { low: 3.5, high: 5.5 },
    },
    "HCT": {
        aliases: ["hct", "hematocrit", "packed cell volume", "pcv", "packed cell volume / hematocrit"],
        unit: "%",
        ref_range: { low: 37.0, high: 50.0 },
    },
    "MCV": {
        aliases: ["mcv", "mean corpuscular volume"],
        unit: "fL",
        ref_range: { low: 82, high: 95 },
    },
    "MCH": {
        aliases: ["mch", "mean corpuscular hemoglobin"],
        unit: "pg",
        ref_range: { low: 27, high: 31 },
    },
    "MCHC": {
        aliases: ["mchc", "mean corpuscular hemoglobin concentration"],
        unit: "g/dL",
        ref_range: { low: 32, high: 36 },
    },
    "RDW-CV": {
        aliases: ["rdw-cv", "rdw cv", "red cell distribution width cv"],
        unit: "%",
        ref_range: { low: 11.5, high: 14.5 },
    },
    "RDW-SD": {
        aliases: ["rdw-sd", "rdw sd", "red cell distribution width sd"],
        unit: "fL",
        ref_range: { low: 35, high: 56 },
    },
    "RDW": {
        aliases: ["rdw", "red cell distribution width"],
        unit: "%",
        ref_range: { low: 11.6, high: 14.0 },
    },
    "WBC": {
        aliases: [
            "wbc", "white blood cell", "white blood cells",
            "total leucocytes (wbc) count", "total leucocytes",
            "leukocytes", "total leukocyte count", "total leukocytes count",
            "tlc"
        ],
        unit: "/uL",
        ref_range: { low: 4000, high: 11000 },
        scale10e3ToPerUL: true
    },
    "NEU%": {
        aliases: ["neu%", "neutrophils", "neutrophil percentage", "neutrophil %"],
        unit: "%",
        ref_range: { low: 40, high: 70 },
    },
    "LYM%": {
        aliases: ["lym%", "lymphocytes", "lymphocyte percentage", "lymphocyte %"],
        unit: "%",
        ref_range: { low: 20, high: 45 },
    },
    "MON%": {
        aliases: ["mon%", "monocytes", "monocyte percentage", "monocyte %"],
        unit: "%",
        ref_range: { low: 2, high: 10 },
    },
    "EOS%": {
        aliases: ["eos%", "eosinophils", "eosinophil percentage", "eosinophil %"],
        unit: "%",
        ref_range: { low: 1, high: 6 },
    },
    "BAS%": {
        aliases: ["bas%", "basophils", "basophil percentage", "basophil %"],
        unit: "%",
        ref_range: { low: 0, high: 2 },
    },
    "LYM#": {
        aliases: ["lym#", "absolute lymphocyte count", "lymphocyte count"],
        unit: "10^3/uL",
        ref_range: { low: 1.5, high: 4.0 },
    },
    "GRA#": {
        aliases: ["gra#", "granulocytes", "absolute granulocyte count", "granulocyte count"],
        unit: "10^3/uL",
        ref_range: { low: 2.0, high: 7.5 },
    },
    "PLT": {
        aliases: ["plt", "platelet", "platelets", "platelet count"],
        unit: "10^3/uL",
        ref_range: { low: 150, high: 450 },
    },
    "ESR": {
        aliases: ["esr", "erythrocyte sedimentation rate", "sed rate"],
        unit: "mm/hr",
        ref_range: { low: 0, high: 15 },
    },
    "Reticulocyte Count": {
        aliases: ["reticulocyte count", "retics", "reticulocytes"],
        unit: "%",
        ref_range: { low: 0.5, high: 2.5 },
    },
    "Peripheral Smear": {
        aliases: ["peripheral smear", "ps", "peripheral blood smear", "blood smear"],
        unit: null,
        expected: "normal",
        qualitative: true
    },
    "Coagulation Profile": {
        aliases: [
            "coagulation profile", "pt/inr", "prothrombin time", "aptt",
            "a ptt", "coagulation", "pt inr", "pt", "inr", "aPTT"
        ],
        unit: null,
        ref_range: { low: 9.5, high: 13.8 },
    },
    "Bleeding Time": {
        aliases: ["bleeding time", "bt", "bleeding test"],
        unit: "minutes",
        ref_range: { low: 2, high: 7 },
    },
    "Clotting Time": {
        aliases: ["clotting time", "ct", "clotting test"],
        unit: "minutes",
        ref_range: { low: 4, high: 8 },
    },
    "D-Dimer": {
        aliases: ["d-dimer", "d dimer", "ddimer"],
        unit: "ng/mL",
        ref_range: { low: 0, high: 0.5 },
    },

    // --- Biochemistry Tests ---
    "Fasting Blood Glucose": {
        aliases: [
            "fasting blood glucose", "fbg", "fasting blood sugar",
            "fbs", "fasting glucose", "fasting sugar"
        ],
        unit: "mg/dL",
        ref_range: { low: 70, high: 100 },
    },
    "Post Prandial Glucose": {
        aliases: [
            "post prandial glucose", "ppbs", "pp blood sugar",
            "postprandial blood sugar", "pp glucose", "2 hour postprandial glucose"
        ],
        unit: "mg/dL",
        ref_range: { low: 70, high: 140 },
    },
    "Random Blood Sugar": {
        aliases: [
            "random blood sugar", "rbs", "random glucose",
            "random blood glucose"
        ],
        unit: "mg/dL",
        ref_range: { low: 70, high: 125 },
    },
    "HbA1c": {
        aliases: ["hba1c", "glycosylated hemoglobin", "glycated hemoglobin", "a1c" ,"glycated haemoglobin"],
        unit: "%",
        ref_range: { low: 4.0, high: 5.6 },
    },
    "Urea": {
        aliases: ["urea", "serum urea"],
        unit: "mg/dL",
        ref_range: { low: 19, high: 49 },
    },
    "Creatinine": {
        aliases: ["creatinine", "serum creatinine", "creat"],
        unit: "mg/dL",
        ref_range: { low: 0.6, high: 1.3 },
    },
    "Uric Acid": {
        aliases: ["uric acid", "serum uric acid"],
        unit: "mg/dL",
        ref_range: { low: 3.5, high: 7.2 },
    },
    "Blood Urea Nitrogen": {
        aliases: ["blood urea nitrogen", "bun"],
        unit: "mg/dL",
        ref_range: { low: 6, high: 20 },
    },
    "Sodium": {
        aliases: ["sodium", "na", "na+", "serum sodium"],
        unit: "mEq/L",
        ref_range: { low: 136, high: 144 },  // from RxTeach:contentReference[oaicite:3]{index=3}
    },
    "Potassium": {
        aliases: ["potassium", "k", "k+", "serum potassium"],
        unit: "mEq/L",
        ref_range: { low: 3.7, high: 5.2 },  //:contentReference[oaicite:4]{index=4}
    },
    "Chloride": {
        aliases: ["chloride", "cl", "cl-", "serum chloride"],
        unit: "mEq/L",
        ref_range: { low: 96, high: 106 },   //:contentReference[oaicite:5]{index=5}
    },
    "Bicarbonate": {
        aliases: ["bicarbonate", "co2", "hco3", "carbon dioxide"],
        unit: "mEq/L",
        ref_range: { low: 23, high: 29 },    //:contentReference[oaicite:6]{index=6}
    },
    "Calcium": {
        aliases: ["calcium", "ca", "ca2+", "serum calcium"],
        unit: "mg/dL",
        ref_range: { low: 8.5, high: 10.2 },  //:contentReference[oaicite:7]{index=7}
    },
    "Phosphorus": {
        aliases: ["phosphorus", "phosphate", "po4", "po4^3-"],
        unit: "mg/dL",
        ref_range: { low: 2.8, high: 4.5 },  // adult range:contentReference[oaicite:8]{index=8}
    },
    "Magnesium": {
        aliases: ["magnesium", "mg", "mg2+"],
        unit: "mg/dL",
        ref_range: { low: 1.7, high: 2.2 },  //:contentReference[oaicite:9]{index=9}
    },
    "Total Protein": {
        aliases: ["total protein", "protein total", "serum total protein"],
        unit: "g/dL",
        ref_range: { low: 6.0, high: 8.3 },  //:contentReference[oaicite:10]{index=10}
    },
    "Albumin": {
        aliases: ["albumin", "serum albumin"],
        unit: "g/dL",
        ref_range: { low: 3.4, high: 5.4 },  //:contentReference[oaicite:11]{index=11}
    },
    "Globulin": {
        aliases: ["globulin", "serum globulin"],
        unit: "g/dL",
        ref_range: { low: 2.1, high: 3.9 },
    },
    "A/G Ratio": {
        aliases: ["a/g ratio", "ag ratio", "a g ratio", "albumin globulin ratio"],
        unit: "ratio",
        ref_range: { low: 0.8, high: 2.1 },
    },
    "Bilirubin-Total": {
        aliases: ["bilirubin-total", "bilirubin total", "total bilirubin", "t.bil"],
        unit: "mg/dL",
        ref_range: { low: 0.1, high: 1.2 },  //:contentReference[oaicite:12]{index=12}
    },
    "Bilirubin-Direct": {
        aliases: ["bilirubin-direct", "direct bilirubin", "conjugated bilirubin"],
        unit: "mg/dL",
        ref_range: { low: 0.0, high: 0.3 },
    },
    "Bilirubin-Indirect": {
        aliases: ["bilirubin-indirect", "indirect bilirubin", "unconjugated bilirubin"],
        unit: "mg/dL",
        ref_range: { low: 0.2, high: 0.8 },
    },
    "SGPT": {
        aliases: ["sgpt", "alt", "alanine aminotransferase", "alanine"],
        unit: "U/L",
        ref_range: { low: 4, high: 36 },  //:contentReference[oaicite:13]{index=13}
    },
    "SGOT": {
        aliases: ["sgot", "ast", "aspartate aminotransferase", "aspartate" , "aspartate transaminase"],
        unit: "U/L",
        ref_range: { low: 8, high: 33 },  //:contentReference[oaicite:14]{index=14}
    },
    "SGOT/SGPT": {
        aliases: ["sgot/sgpt", "ast/alt ratio", "sgot sgpt ratio", "ast alt ratio"],
        unit: "ratio",
        ref_range: null,
    },
    "Alkaline Phosphatase": {
        aliases: ["alkaline phosphatase", "alp", "alk phos", "alk phosp"],
        unit: "U/L",
        ref_range: { low: 20, high: 130 },  //:contentReference[oaicite:15]{index=15}
    },
    "Gamma GT": {
        aliases: ["gamma gt", "ggt", "gamma-glutamyl transferase", "gamma glutamyl transferase"],
        unit: "U/L",
        ref_range: { low: 9, high: 48 },
    },
    "Amylase": {
        aliases: ["amylase", "serum amylase"],
        unit: "U/L",
        ref_range: { low: 30, high: 110 },
    },
    "Lipase": {
        aliases: ["lipase", "serum lipase"],
        unit: "U/L",
        ref_range: { low: 13, high: 60 },
    },
    "Lactate Dehydrogenase": {
        aliases: ["lactate dehydrogenase", "ldh", "ld"],
        unit: "U/L",
        ref_range: { low: 122, high: 222 },
    },
    "Creatine Kinase": {
        aliases: ["creatine kinase", "ck", "cpk"],
        unit: "U/L",
        ref_range: { low: 26, high: 192 },
    },
    "CK-MB": {
        aliases: ["ck-mb", "ck mb", "creatine kinase-mb", "ckmb", "creatine phosphokinase mb"],
        unit: "ng/mL",
        ref_range: { low: 0, high: 7 },
    },
    "Troponin I": {
        aliases: ["troponin i", "trop-i", "trop i"],
        unit: "ng/mL",
        ref_range: { low: 0, high: 0.04 },
    },
    "Troponin T": {
        aliases: ["troponin t", "trop-t", "trop t"],
        unit: "ng/mL",
        ref_range: { low: 0, high: 0.01 },
    },

    // --- Lipid Profile ---
    "Cholesterol - Total": {
        aliases: ["cholesterol - total", "total cholesterol", "total chol", "tc"],
        unit: "mg/dL",
        ref_range: { low: 0, high: 200 },
    },
    "Triglycerides": {
        aliases: ["triglycerides", "triglyceride", "tg", "triglyc", "tri glycerides"],
        unit: "mg/dL",
        ref_range: { low: 0, high: 150 },
    },
    "Cholesterol - HDL": {
        aliases: ["cholesterol - hdl", "hdl", "high density lipoprotein", "hdl cholesterol"],
        unit: "mg/dL",
        ref_range: { low: 40, high: 500 },
    },
    "Cholesterol - LDL": {
        aliases: ["cholesterol - ldl", "ldl", "low density lipoprotein", "ldl cholesterol"],
        unit: "mg/dL",
        ref_range: { low: 0, high: 100 },
    },
    "Cholesterol - VLDL": {
        aliases: ["cholesterol - vldl", "vldl", "very low density lipoprotein", "vldl cholesterol"],
        unit: "mg/dL",
        ref_range: { low: 0, high: 30 },
    },
    "Non HDL Cholesterol": {
        aliases: ["non hdl cholesterol", "non-hdl cholesterol", "non hdl", "non hdl chol"],
        unit: "mg/dL",
        ref_range: { low: 0, high: 130 },
    },
    "LDL/HDL Ratio": {
        aliases: ["ldl/hdl ratio", "ldl hdl ratio", "cholesterol ratio"],
        unit: "ratio",
        ref_range: { low: 0, high: 3.5 },
    },

    // --- Endocrine / Hormones ---
    "TSH": {
        aliases: ["tsh", "thyroid stimulating hormone"],
        unit: "uIU/mL",
        ref_range: { low: 0.55, high: 4.78 },
    },
    "Free T3": {
        aliases: ["free t3", "ft3", "free triiodothyronine"],
        unit: "pg/mL",
        ref_range: { low: 2.3, high: 4.2 },
    },
    "Free T4": {
        aliases: ["free t4", "ft4", "free thyroxine"],
        unit: "ng/dL",
        ref_range: { low: 0.8, high: 1.8 },
    },
    "Total T3": {
        aliases: ["total t3", "t3 total", "triiodothyronine"],
        unit: "ng/dL",
        ref_range: { low: 80, high: 180 },
    },
    "Total T4": {
        aliases: ["total t4", "t4 total", "thyroxine"],
        unit: "µg/dL",
        ref_range: { low: 5, high: 12 },
    },
    "Insulin": {
        aliases: ["insulin", "fasting insulin", "insulin fasting", "insulin (fasting)", "insulin (pp)"],
        unit: "µIU/mL",
        ref_range: { low: 2, high: 25 },
    },
    "Cortisol": {
        aliases: ["cortisol", "serum cortisol"],
        unit: "µg/dL",
        ref_range: { low: 6, high: 22 },
    },
    "Parathyroid Hormone": {
        aliases: ["parathyroid hormone", "pth", "intact parathyroid hormone"],
        unit: "pg/mL",
        ref_range: { low: 10, high: 65 },
    },
    "Vitamin D": {
        aliases: ["vitamin d", "25-oh vitamin d", "25 hydroxy vitamin d", "vit d", "cholecalciferol"],
        unit: "ng/mL",
        ref_range: { low: 30, high: 100 },
    },
    "Vitamin B12": {
        aliases: ["vitamin b12", "vit b12", "b12", "cobalamin", "vitamin b-12"],
        unit: "pg/mL",
        ref_range: { low: 200, high: 900 },
    },

    // --- Infectious Disease Tests ---
    "Complete Urine Examination": {
        aliases: ["complete urine examination", "cue", "urinalysis", "urine routine", "urine routine and microscopy", "urine test"],
        unit: null,
        expected: "normal",
        qualitative: true
    },
    "Urine Culture": {
        aliases: ["urine culture", "urine culture & sensitivity", "urine c/s", "urine culture and sensitivity"],
        unit: null,
        expected: "no growth",
        qualitative: true
    },
    "Blood Culture": {
        aliases: ["blood culture", "blood culture & sensitivity", "blood c/s", "blood culture and sensitivity"],
        unit: null,
        expected: "no growth",
        qualitative: true
    },
    "Sputum Culture": {
        aliases: ["sputum culture", "sputum culture & sensitivity", "sputum c/s", "sputum", "culture sputum"],
        unit: null,
        expected: "no growth",
        qualitative: true
    },
    "Widal Test": {
        aliases: ["widal test", "widal", "typhoid test", "widal titer"],
        unit: "titer",
        ref_range: { low: 0, high: 1.8 },
    },
    "Dengue NS1 Antigen": {
        aliases: ["dengue ns1", "dengue ns1 antigen", "ns1 antigen"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "Dengue IgM/IgG": {
        aliases: ["dengue igm/igg", "dengue igm", "dengue igg", "dengue antibodies"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "Malaria Antigen Test": {
        aliases: ["malaria antigen test", "malaria antigen", "malaria test", "malaria rapid test"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "Peripheral Smear for Malaria": {
        aliases: ["peripheral smear for malaria", "mp smear", "malaria smear", "malaria parasite smear"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "HBsAg": {
        aliases: ["hbsag", "hepatitis b surface antigen", "hbv surface antigen"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "Anti-HCV": {
        aliases: ["anti-hcv", "hepatitis c antibody", "hcv antibody", "anti hcv"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "HIV 1 & 2 Antibody": {
        aliases: ["hiv 1 & 2 antibody", "hiv antibody", "hiv test", "hiv 1 antibody", "hiv 2 antibody"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "VDRL": {
        aliases: ["vdrl", "syphilis test", "vdrl test"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "TB Gold": {
        aliases: ["tb gold", "quantiferon tb", "quantiferon tb gold", "tb test", "quantiferon"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "Mantoux Test": {
        aliases: ["mantoux test", "ppd skin test", "mantoux", "tb skin test", "ppd"],
        unit: "mm",
        ref_range: { low: 0, high: 4.9 },
    },
    "CRP": {
        aliases: ["crp", "c-reactive protein"],
        unit: "mg/L",
        ref_range: { low: 0, high: 5 },
    },
    "Procalcitonin": {
        aliases: ["procalcitonin", "pct", "serum procalcitonin"],
        unit: "ng/mL",
        ref_range: { low: 0, high: 0.1 },
    },
    "ASO Titer": {
        aliases: ["aso titer", "aso", "anti-streptolysin o", "anti streptolysin o", "aso titre"],
        unit: "IU/mL",
        ref_range: { low: 0, high: 200 },
    },
    "Rheumatoid Factor": {
        aliases: ["rheumatoid factor", "rf", "ra factor", "rheumatoid factor test"],
        unit: "IU/mL",
        ref_range: { low: 0, high: 14 },
    },

    // --- Urine / Stool / Body Fluid Tests ---
    "Urinalysis": {
        aliases: ["urinalysis", "urine routine", "urine examination", "urine test"],
        unit: null,
        expected: "normal",
        qualitative: true
    },
    "24-Hour Urinary Protein": {
        aliases: ["24-hour urinary protein", "24h urine protein", "urine protein 24h", "24 hour urine protein"],
        unit: "mg/day",
        ref_range: { low: 0, high: 150 },
    },
    "Microalbuminuria": {
        aliases: ["microalbuminuria", "urine microalbumin", "microalbumin", "urine albumin", "micro albumin"],
        unit: "mg/day",
        ref_range: { low: 0, high: 30 },
    },
    "Stool Routine": {
        aliases: ["stool routine", "stool routine & microscopy", "stool examination", "stool test"],
        unit: null,
        expected: "normal",
        qualitative: true
    },
    "Stool Occult Blood Test": {
        aliases: ["stool occult blood test", "fobt", "stool occult blood", "guaiac test", "fecal occult blood test"],
        unit: null,
        expected: "negative",
        qualitative: true
    },
    "Semen Analysis": {
        aliases: ["semen analysis", "semen test", "sperm analysis", "sperm count"],
        unit: null,
        expected: "normal",
        qualitative: true
    },
    "CSF Analysis": {
        aliases: ["csf analysis", "cerebrospinal fluid analysis", "csf"],
        unit: null,
        expected: "normal",
        qualitative: true
    },

    // --- Special / Tumor Markers ---
    "PSA": {
        aliases: ["psa", "prostate specific antigen", "prostate antigen"],
        unit: "ng/mL",
        ref_range: { low: 0, high: 4 },
    },
    "CA-125": {
        aliases: ["ca-125", "ca 125", "cancer antigen 125", "ovarian cancer marker"],
        unit: "U/mL",
        ref_range: { low: 0, high: 35 },
    },
    "CEA": {
        aliases: ["cea", "carcinoembryonic antigen"],
        unit: "ng/mL",
        ref_range: { low: 0, high: 3 },
    },
    "AFP": {
        aliases: ["afp", "alpha-fetoprotein", "alpha fetoprotein"],
        unit: "ng/mL",
        ref_range: { low: 0, high: 10 },
    },
    "CA 19-9": {
        aliases: ["ca 19-9", "ca19-9", "ca19.9", "carbohydrate antigen 19-9", "cancer antigen 19-9"],
        unit: "U/mL",
        ref_range: { low: 0, high: 37 },
    },
    "Beta-hCG": {
        aliases: ["beta-hcg", "beta hcg", "β-hcg", "hcg", "human chorionic gonadotropin"],
        unit: "mIU/mL",
        ref_range: { low: 0, high: 5 },
    },
    "LDH Isoenzymes": {
        aliases: ["ldh isoenzymes", "ld isoenzymes", "lactate dehydrogenase isoenzymes"],
        unit: null,
        expected: "normal distribution",
        qualitative: true
    },
    "Serum Ferritin": {
        aliases: ["serum ferritin", "ferritin", "ferritin level"],
        unit: "ng/mL",
        ref_range: { low: 20, high: 250 },
    },
    "Absolute Neutrophil Count": {
        aliases: ["absolute neutrophil count", "anc"],
        unit: "10^3/uL",
        ref_range: { low: 2.0, high: 7.0 },  // 2–7 ×10^3/µL
    },
    "Absolute Lymphocyte Count": {
        aliases: ["absolute lymphocyte count", "alc"],
        unit: "10^3/uL",
        ref_range: { low: 1.0, high: 3.0 },  // 1–3 ×10^3/µL
    },
    "Absolute Monocyte Count": {
        aliases: ["absolute monocyte count", "amc"],
        unit: "10^3/uL",
        ref_range: { low: 0.2, high: 1.0 },  // 0.2–1 ×10^3/µL
    },
    "Absolute Eosinophil Count": {
        aliases: ["absolute eosinophil count", "aec"],
        unit: "10^3/uL",
        ref_range: { low: 0.02, high: 0.5 },  // 0.02–0.5 ×10^3/µL
    },
    "Absolute Basophil Count": {
        aliases: ["absolute basophil count", "abc"],
        unit: "10^3/uL",
        ref_range: { low: 0.02, high: 0.1 },  // 0.02–0.1 ×10^3/µL
    },
    "MPV": {
        aliases: ["mpv", "mean platelet volume"],
        unit: "fL",
        ref_range: { low: 6.5, high: 12 },  // 6.5–12 fL
    },
    "PDW": {
        aliases: ["pdw", "platelet distribution width"],
        unit: "fL",
        ref_range: { low: 9, high: 17 },  // 9–17 fL
    },
    "Cholesterol : HDL Ratio": {
        aliases: [
            "cholesterol : hdl cholesterol",
            "cholesterol hdl ratio",
            "cholesterol/hdl cholesterol",
            "chol/hdl ratio",
        ],
        unit: "ratio",
        ref_range: { low: 0, high: 4.5 },  // desirable < 4.5
    },
    "Bilirubin (urine)": {
        aliases: ["bilirubin (urine)", "urine bilirubin", "bilirubin urine test"],
        unit: null,
        expected: "Negative",
        qualitative: true,  // qualitative (expected: negative)
    },
};

// src/services/normalize.js

function adjustDecimalIfOutOfRange(value, ref) {
    if (!ref || value == null) return value;

    if (ref.high != null && value > ref.high * 5) {
        const str = value.toString();

        // Try multiple possible decimal insertions
        for (let i = 1; i < str.length; i++) {
            const guess = parseFloat(str.slice(0, i) + "." + str.slice(i));
            if (guess >= ref.low && guess <= ref.high) {
                return guess;
            }
        }
    }
    return value;
}

function extractNumeric(line) {
    // captures first number like 11,200 or 10.2 or -3.5
    // normalize commas → dot
    const m = line.replace(/,/g, ".").match(/-?\d+(?:[.,]\d+)?/);
    return m ? parseFloat(m[0]) : null;
}

function detectBracketStatus(line) {
    const m = line.match(/[\(\[]\s*(low|high|normal)\s*[\)\]]/i);
    return m ? m[1].toLowerCase() : null;
}

function is10e3UnitMentioned(line) {
    return /10\^?3\s*\/\s*u?l/i.test(line) || /x?\s*10\^?3/i.test(line);
}

function toStatusByRange(value, ref) {
    if (value == null || !ref || ref.low == null || ref.high == null) return "unknown";
    if (value < ref.low) return "low";
    if (value > ref.high) return "high";
    return "normal";
}

function qualitativeStatus(raw, expected) {
    if (!expected) return "unknown";
    const r = normalizeToken(raw);
    const e = normalizeToken(expected);
    return r.includes(e) ? "normal" : "abnormal";
}

function normalizeToken(s) {
    return (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Build alias → canonical name index (lowercase).
 */
const ALIAS_INDEX = (() => {
    const idx = new Map();
    for (const [canon, meta] of Object.entries(CANONICAL)) {
        for (const alias of meta.aliases) {
            idx.set(alias.toLowerCase(), canon);
        }
    }
    return idx;
})();

function findCanonicalForLine(line) {
    const low = normalizeToken(line);
    let best = null;
    let bestLen = 0;
    for (const [alias, canon] of ALIAS_INDEX.entries()) {
        if (low.includes(alias)) {
            if (alias.length > bestLen) {
                best = canon;
                bestLen = alias.length;
            }
        }
    }
    return best;
}

function deduplicateTests(tests) {
    const byName = {};
    for (const t of tests) {
        if (!byName[t.name]) {
            byName[t.name] = t;
        } else {
            const ref = t.ref_range;
            if (t.value != null && ref) {
                const dist = Math.abs(t.value - (ref.low + ref.high) / 2);
                const existingDist = Math.abs((byName[t.name].value || 0) - (ref.low + ref.high) / 2);
                if (byName[t.name].value == null || dist < existingDist) {
                    byName[t.name] = t;
                }
            }
        }
    }
    return Object.values(byName);
}

function filterByRange(tests) {
    return tests.filter(t => {
        if (t.value == null) return false;
        if (t.ref_range && t.ref_range.low != null && t.ref_range.high != null) {
            if (t.value > t.ref_range.high * 50 || t.value < t.ref_range.low / 50) return false;
        }
        return true;
    });
}

/**
 * Normalize extracted tests into structured JSON.
 */
function normalizeTests(testsRaw) {
    const results = [];
    if (!Array.isArray(testsRaw) || testsRaw.length === 0) {
        return { tests: [], normalization_confidence: 0 };
    }

    let considered = 0;
    let strongMatches = 0;

    for (const raw of testsRaw) {
        const canon = findCanonicalForLine(raw);
        if (!canon) continue;

        considered++;
        const meta = CANONICAL[canon];
        const bracketStatus = detectBracketStatus(raw);
        let value = extractNumeric(raw);

        // Special rescale for WBC 10^3/uL
        if (canon === "WBC" && meta.scale10e3ToPerUL && value != null && is10e3UnitMentioned(raw)) {
            value = value * 1000;
        }

        // Adjust decimal if OCR dropped the dot
        value = adjustDecimalIfOutOfRange(value, meta.ref_range);

        let status = "unknown";
        if (meta.qualitative) {
            status = qualitativeStatus(raw, meta.expected);
        } else if (meta.ref_range) {
            status = toStatusByRange(value, meta.ref_range);
        }

        if (bracketStatus && (status === "unknown" || !meta.ref_range)) {
            status = bracketStatus;
        }

        const entry = {
            name: canon,
            value,
            unit: meta.unit,
            status,
            ref_range: meta.ref_range || null,
        };

        if (meta.qualitative && value == null) {
            const token = (raw.match(/\b(negative|positive|trace|few|nil|clear|normal|pale\s+yellow)\b/i) || [])[0];
            if (token) entry.value = token;
        }

        if (value != null || meta.qualitative) strongMatches++;

        results.push(entry);
    }

    // Apply cleanup steps
    let cleaned = filterByRange(results);
    cleaned = deduplicateTests(cleaned);

    const confidence = considered ? Number((strongMatches / considered).toFixed(2)) : 0;

    return {
        tests: cleaned,
        normalization_confidence: confidence,
    };
}

module.exports = {
    normalizeTests,
    CANONICAL,
    filterByRange,
    deduplicateTests
};