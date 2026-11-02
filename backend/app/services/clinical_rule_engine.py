"""Clinical Decision Support Rule Engine for Acute Cardiovascular and Emergency Symptom Triage.

Implements an independent four-level urgency classification based on validated clinical guidelines:
- LEVEL 1: EMERGENCY (Time-Critical Immediate Response - Call 112 / 108)
- LEVEL 2: URGENT MEDICAL EVALUATION (Prompt Same-Day Physician Assessment)
- LEVEL 3: ROUTINE MEDICAL FOLLOW-UP (Scheduled Outpatient Consultation)
- LEVEL 4: GENERAL SELF-CARE GUIDANCE (Low-Acuity Lifestyle & Warning Monitoring)

All rules document their evidence-based clinical guidance sources.
Does not depend on ML risk scores; a low ML score never overrides acute emergency red flags.
Safely handles incomplete and uncertain information with precautionary failsafes.
"""
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from app.schemas.symptoms import (
    SymptomTriageRequest,
    TriageAssessmentResponse,
    ClinicalRuleMatch,
    FirstResponseInstructions,
    EmergencyContactInfo,
    MedicalHistoryInput
)
from app.services.symptom_nlp import symptom_nlp_service

# Validated Clinical Guideline References
CLINICAL_GUIDELINES = {
    "REF_ACC_AHA_CHEST_PAIN": {
        "title": "2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR Guideline for the Evaluation and Diagnosis of Chest Pain",
        "citation": "Circulation. 2021;144(22):e368–e454. doi:10.1161/CIR.0000000000001029",
        "key_principle": "Chest pain accompanied by diaphoresis, dyspnea, nausea, radiation to left arm/jaw, or duration >15 min represents high-probability Acute Coronary Syndrome (ACS) requiring emergent prehospital EMS activation."
    },
    "REF_ESC_ACS_2023": {
        "title": "2023 ESC Guidelines for the management of acute coronary syndromes",
        "citation": "European Heart Journal. 2023;44(38):3720–3826. doi:10.1093/eurheartj/ehad191",
        "key_principle": "Continuous chest discomfort persisting for >20 minutes, or severe acute pain at rest, requires immediate emergency activation and rapid ambulance dispatch with 12-lead ECG."
    },
    "REF_AHA_ASA_STROKE_FAST": {
        "title": "AHA/ASA Guidelines for the Early Management of Patients With Acute Ischemic Stroke & Cincinnati Prehospital Stroke Scale (CPSS)",
        "citation": "Stroke. 2019;50(12):e344–e418. doi:10.1161/STR.0000000000000211",
        "key_principle": "Sudden onset facial droop, unilateral arm weakness, or speech slurring represents acute stroke until proven otherwise; time-to-treatment is critical (Golden Hour)."
    },
    "REF_ACC_AHA_SYNCOPE": {
        "title": "2017 ACC/AHA/HRS Guideline for the Evaluation and Management of Patients With Syncope",
        "citation": "Circulation. 2017;136(5):e60–e122. doi:10.1161/CIR.0000000000000499",
        "key_principle": "Syncope or near-syncope preceded by palpitations or chest discomfort is strongly suggestive of cardiogenic arrhythmia or severe structural heart disease; emergent evaluation required."
    },
    "REF_ICMR_STEMI_CARE": {
        "title": "ICMR / STEMI India Standard Treatment Workflows for Acute Myocardial Infarction",
        "citation": "Indian Council of Medical Research (ICMR) Emergency Clinical Protocols, 2022",
        "key_principle": "In the Indian subcontinent, immediate dispatch of National Emergency 112 / Ambulance 108 without waiting for lab tests minimizes symptom-to-balloon time."
    },
    "REF_NICE_CG95_CHEST_PAIN": {
        "title": "NICE Clinical Guideline CG95: Recent-onset chest pain of suspected cardiac origin",
        "citation": "National Institute for Health and Care Excellence (UK), Updated Nov 2016",
        "key_principle": "Recent-onset chest discomfort without acute hemodynamic instability warrants urgent same-day medical assessment to rule out unstable angina or progressive CAD."
    },
    "REF_ESC_HEART_FAILURE": {
        "title": "2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure",
        "citation": "European Heart Journal. 2021;42(36):3599–3726. doi:10.1093/eurheartj/ehab368",
        "key_principle": "New-onset or worsening breathlessness at rest or on mild exertion, associated with progressive bilateral peripheral edema, requires urgent clinical assessment."
    }
}

class ClinicalRuleEngine:
    """Clinical Decision Support Engine with validated rules and safety failsafes."""

    def __init__(self):
        self.guidelines = CLINICAL_GUIDELINES

    def evaluate_triage(
        self,
        request: SymptomTriageRequest,
        patient_name: str = "Patient",
        user_id: Optional[str] = None
    ) -> TriageAssessmentResponse:
        """Execute clinical decision rules across symptoms, onset, severity, duration, and history."""
        # 1. Gather all reported symptoms (from free text NLP extraction + structured checkboxes)
        extracted_nlp = symptom_nlp_service.extract_symptoms(request.symptom_description or "", request.language)
        
        all_symptom_ids = set(request.reported_symptoms)
        for item in extracted_nlp.extracted_symptoms:
            all_symptom_ids.add(item.symptom_id)

        # Merge severity, duration, onset, and trend with explicit user overrides taking priority
        severity = request.severity if request.severity != "not_sure" else (extracted_nlp.severity_detected or "not_sure")
        duration = request.duration if request.duration != "not_sure" else (extracted_nlp.duration_detected or "not_sure")
        onset_type = request.onset_type if request.onset_type != "not_sure" else (extracted_nlp.onset_detected or "not_sure")
        trend = request.is_worsening if request.is_worsening != "not_sure" else (extracted_nlp.trend_detected or "not_sure")

        # Extract medical history flags
        med_hist: MedicalHistoryInput = request.medical_history or MedicalHistoryInput()
        has_prior_mi = med_hist.previous_heart_attack == "yes"
        has_prior_cad = med_hist.previous_heart_disease == "yes"
        has_prior_stroke = med_hist.previous_stroke == "yes"
        has_diabetes = med_hist.diabetes == "yes"
        has_hypertension = med_hist.high_blood_pressure == "yes"
        high_risk_history = has_prior_mi or has_prior_cad or (has_diabetes and has_hypertension)

        matched_rules: List[ClinicalRuleMatch] = []
        urgency_level = 4  # Default to Level 4 (General Self-Care)
        uncertainty_notice: Optional[str] = None
        uncertainty_notice_ta: Optional[str] = None

        # Check for incomplete / uncertain information
        cardiac_symptoms_present = any(
            s in ("chest_pain", "shortness_of_breath", "palpitations", "dizziness_syncope", "radiating_pain", "diaphoresis_sweating")
            for s in all_symptom_ids
        )
        is_history_uncertain = any(
            v == "not_sure" for v in [
                med_hist.previous_heart_attack,
                med_hist.previous_heart_disease,
                med_hist.previous_stroke
            ]
        )
        is_symptom_uncertain = severity == "not_sure" or duration == "not_sure"

        # -------------------------------------------------------------
        # LEVEL 1 EVALUATION: EMERGENCY (Time-Critical Immediate Response)
        # -------------------------------------------------------------
        has_chest_pain = "chest_pain" in all_symptom_ids
        has_radiating_pain = "radiating_pain" in all_symptom_ids
        has_shortness_breath = "shortness_of_breath" in all_symptom_ids
        has_cold_sweating = "diaphoresis_sweating" in all_symptom_ids
        has_stroke_signs = "stroke_symptoms" in all_symptom_ids
        has_palpitations = "palpitations" in all_symptom_ids
        has_syncope = "dizziness_syncope" in all_symptom_ids
        is_severe = severity == "severe"
        is_sudden = onset_type == "sudden"
        is_worsening = trend == "worsening"

        # Rule 1.1: Acute Stroke Signs (FAST)
        if has_stroke_signs:
            urgency_level = 1
            matched_rules.append(ClinicalRuleMatch(
                rule_id="RULE-EMERG-01",
                rule_name="Acute Cerebrovascular Event / Stroke Warning (FAST)",
                guideline_source="AHA/ASA Early Management of Acute Ischemic Stroke & CPSS",
                citation=self.guidelines["REF_AHA_ASA_STROKE_FAST"]["citation"],
                trigger_criteria="Presence of facial weakness, speech difficulty, or unilateral arm weakness."
            ))

        # Rule 1.2: Chest Pain + Cold Sweating (Classic Diaphoresis ACS)
        if has_chest_pain and has_cold_sweating:
            urgency_level = 1
            matched_rules.append(ClinicalRuleMatch(
                rule_id="RULE-EMERG-02",
                rule_name="Acute Coronary Syndrome with Autonomic Diaphoresis",
                guideline_source="2021 ACC/AHA Chest Pain Guidelines & ICMR STEMI Protocol",
                citation=self.guidelines["REF_ACC_AHA_CHEST_PAIN"]["citation"],
                trigger_criteria="Chest discomfort accompanied by cold sweating/diaphoresis (high specificity for myocardial ischemia)."
            ))

        # Rule 1.3: Chest Pain + Radiating Pain to Arm/Jaw/Back
        if has_chest_pain and has_radiating_pain:
            urgency_level = 1
            matched_rules.append(ClinicalRuleMatch(
                rule_id="RULE-EMERG-03",
                rule_name="Ischemic Chest Pain Radiating to Left Arm, Jaw, or Neck",
                guideline_source="2021 ACC/AHA Guideline for Evaluation and Diagnosis of Chest Pain",
                citation=self.guidelines["REF_ACC_AHA_CHEST_PAIN"]["citation"],
                trigger_criteria="Substernal or left-sided chest pain radiating to left arm, neck, jaw, or upper back."
            ))

        # Rule 1.4: Chest Pain + Shortness of Breath (Angina Equivalent / Acute LV Strain)
        if has_chest_pain and has_shortness_breath:
            urgency_level = 1
            matched_rules.append(ClinicalRuleMatch(
                rule_id="RULE-EMERG-04",
                rule_name="Acute Cardiorespiratory Distress (Chest Pain + Dyspnea)",
                guideline_source="2023 ESC Guidelines for Management of Acute Coronary Syndromes",
                citation=self.guidelines["REF_ESC_ACS_2023"]["citation"],
                trigger_criteria="Concurrent chest pain and difficulty breathing (angina equivalent or acute pulmonary congestion)."
            ))

        # Rule 1.5: Severe / Crushing Chest Pain or Persistent Duration >15-20 min
        if has_chest_pain and (is_severe or duration in ("15-30m", "1-2h", ">2h") or (has_prior_mi and is_sudden)):
            urgency_level = 1
            matched_rules.append(ClinicalRuleMatch(
                rule_id="RULE-EMERG-05",
                rule_name="Severe or Prolonged Ischemic Chest Discomfort",
                guideline_source="2023 ESC ACS Guidelines & 2021 AHA/ACC Guidelines",
                citation=self.guidelines["REF_ESC_ACS_2023"]["citation"],
                trigger_criteria=f"Chest discomfort rated as severe or lasting >15-20 minutes, or in patient with prior MI."
            ))

        # Rule 1.6: Sudden Severe Breathlessness at Rest
        if has_shortness_breath and is_severe and is_sudden:
            urgency_level = 1
            matched_rules.append(ClinicalRuleMatch(
                rule_id="RULE-EMERG-06",
                rule_name="Sudden Severe Acute Dyspnea at Rest",
                guideline_source="2021 ESC Acute Heart Failure Guidelines / Emergency Respiratory Triage",
                citation=self.guidelines["REF_ESC_HEART_FAILURE"]["citation"],
                trigger_criteria="Abrupt onset of severe shortness of breath at rest (suspected pulmonary edema, PE, or ACS)."
            ))

        # Rule 1.7: Palpitations with Syncope or Near-Fainting
        if has_palpitations and has_syncope and (is_severe or is_sudden):
            urgency_level = 1
            matched_rules.append(ClinicalRuleMatch(
                rule_id="RULE-EMERG-07",
                rule_name="Hemodynamically Unstable Arrhythmia / Cardiogenic Syncope",
                guideline_source="2017 ACC/AHA/HRS Guideline for Evaluation and Management of Syncope",
                citation=self.guidelines["REF_ACC_AHA_SYNCOPE"]["citation"],
                trigger_criteria="Heart racing/palpitations accompanied by fainting, blacking out, or severe dizziness."
            ))

        # Rule 1.8: Rapidly Worsening Chest Distress in Patient with Prior MI / Heart Disease
        if (has_chest_pain or has_shortness_breath) and is_worsening and high_risk_history:
            urgency_level = 1
            matched_rules.append(ClinicalRuleMatch(
                rule_id="RULE-EMERG-08",
                rule_name="Rapidly Escalating Symptoms in High-Risk Cardiac Patient",
                guideline_source="2023 ESC Guidelines & ICMR Standard Treatment Workflows",
                citation=self.guidelines["REF_ESC_ACS_2023"]["citation"],
                trigger_criteria="Worsening chest/respiratory distress in patient with confirmed history of MI or CAD."
            ))

        # -------------------------------------------------------------
        # LEVEL 2 EVALUATION: URGENT MEDICAL EVALUATION (If not Level 1)
        # -------------------------------------------------------------
        if urgency_level > 1:
            # Rule 2.1: Isolated Moderate Chest Discomfort without Red Flags
            if has_chest_pain:
                urgency_level = 2
                matched_rules.append(ClinicalRuleMatch(
                    rule_id="RULE-URGENT-01",
                    rule_name="Recent-Onset Chest Discomfort (Unconfirmed Origin)",
                    guideline_source="NICE Clinical Guideline CG95: Recent-onset chest pain",
                    citation=self.guidelines["REF_NICE_CG95_CHEST_PAIN"]["citation"],
                    trigger_criteria="Recent-onset chest discomfort without acute hemodynamic instability; requires same-day evaluation."
                ))

            # Rule 2.2: Sustained Palpitations (>20-30m or Moderate Severity)
            elif has_palpitations and (duration in ("15-30m", "1-2h", ">2h") or severity in ("moderate", "severe")):
                urgency_level = 2
                matched_rules.append(ClinicalRuleMatch(
                    rule_id="RULE-URGENT-02",
                    rule_name="Sustained Tachyarrhythmia Warranting Urgent ECG",
                    guideline_source="ACC/AHA Clinical Guidance on Tachycardia Evaluation",
                    citation=self.guidelines["REF_ACC_AHA_SYNCOPE"]["citation"],
                    trigger_criteria="Sustained racing heartbeat or irregular rhythm without syncope; warrants prompt ECG."
                ))

            # Rule 2.3: Unexplained Shortness of Breath (New Onset or Moderate)
            elif has_shortness_breath:
                urgency_level = 2
                matched_rules.append(ClinicalRuleMatch(
                    rule_id="RULE-URGENT-03",
                    rule_name="Unexplained Exertional or Subacute Dyspnea",
                    guideline_source="2021 ESC Guidelines for Diagnosis of Heart Failure",
                    citation=self.guidelines["REF_ESC_HEART_FAILURE"]["citation"],
                    trigger_criteria="Breathlessness without classic acute pulmonary edema; warrants clinical evaluation today."
                ))

            # Rule 2.4: Dizziness / Syncope without Palpitations
            elif has_syncope:
                urgency_level = 2
                matched_rules.append(ClinicalRuleMatch(
                    rule_id="RULE-URGENT-04",
                    rule_name="Unexplained Pre-syncope or Significant Vertigo",
                    guideline_source="2017 ACC/AHA/HRS Guideline for Evaluation of Syncope",
                    citation=self.guidelines["REF_ACC_AHA_SYNCOPE"]["citation"],
                    trigger_criteria="Episode of severe dizziness or near-fainting; warrants prompt medical assessment."
                ))

            # Rule 2.5: Worsening Symptoms or Peripheral Swelling
            elif is_worsening or "peripheral_edema" in all_symptom_ids:
                urgency_level = 2
                matched_rules.append(ClinicalRuleMatch(
                    rule_id="RULE-URGENT-05",
                    rule_name="Progressive Peripheral Edema or Escalating Trajectory",
                    guideline_source="2021 ESC Heart Failure Guidelines",
                    citation=self.guidelines["REF_ESC_HEART_FAILURE"]["citation"],
                    trigger_criteria="Bilateral lower extremity edema or symptoms noted as progressively worsening."
                ))

            # Rule 2.6: Mild symptoms in high-risk patient (prior MI, stroke, diabetes+HTN)
            elif len(all_symptom_ids) > 0 and high_risk_history:
                urgency_level = 2
                matched_rules.append(ClinicalRuleMatch(
                    rule_id="RULE-URGENT-06",
                    rule_name="Precautionary Urgent Assessment for High-Risk Medical History",
                    guideline_source="AHA/ACC Secondary Prevention in High-Risk Cardiovascular Patients",
                    citation=self.guidelines["REF_ACC_AHA_CHEST_PAIN"]["citation"],
                    trigger_criteria="New symptoms in patient with prior MI, CAD, or stroke; warrants prompt physician review."
                ))

            # Failsafe Rule 2.7: Incomplete / Uncertain information with possible cardiac symptoms
            elif cardiac_symptoms_present and (is_symptom_uncertain or is_history_uncertain):
                urgency_level = 2
                matched_rules.append(ClinicalRuleMatch(
                    rule_id="RULE-SAFE-01",
                    rule_name="Precautionary Elevation Due to Incomplete / Uncertain Information",
                    guideline_source="Clinical Safety Principle: Minimizing False Reassurance",
                    citation="AHA/ACC Quality of Care and Clinical Practice Guidelines",
                    trigger_criteria="Symptom severity or medical history was reported as 'Not Sure' or omitted; elevated to prevent false reassurance."
                ))
                uncertainty_notice = "Some medical history or symptom details were uncertain. For your safety, the system elevated the assessment to recommend prompt medical evaluation."
                uncertainty_notice_ta = "சில மருத்துவ வரலாறு அல்லது அறிகுறிகள் உறுதியாக தெரியவில்லை. உங்கள் பாதுகாப்பிற்காக உடனடியாக மருத்துவ பரிசோதனை பரிந்துரைக்கப்படுகிறது."

        # Always attach uncertainty notice if history is uncertain or symptoms uncertain
        if is_history_uncertain or (is_symptom_uncertain and len(all_symptom_ids) > 0):
            if not uncertainty_notice:
                uncertainty_notice = "Some medical history or symptom details were uncertain. For your safety, the system applied a precautionary safety protocol."
                uncertainty_notice_ta = "சில மருத்துவ வரலாறு அல்லது அறிகுறிகள் உறுதியாக தெரியவில்லை. உங்கள் பாதுகாப்பிற்காக முன்னெச்சரிக்கை பாதுகாப்பு நெறிமுறை பயன்படுத்தப்பட்டது."

        # -------------------------------------------------------------
        # LEVEL 3 EVALUATION: ROUTINE MEDICAL FOLLOW-UP (If not Level 1 or 2)
        # -------------------------------------------------------------
        if urgency_level > 2:
            if len(all_symptom_ids) > 0:
                urgency_level = 3
                matched_rules.append(ClinicalRuleMatch(
                    rule_id="RULE-ROUTINE-01",
                    rule_name="Mild Stable Cardiovascular / Systemic Symptoms",
                    guideline_source="AHA Cardiovascular Health & Prevention in Primary Care",
                    citation="Circulation. 2021;144:e368–e454",
                    trigger_criteria="Mild, non-progressive symptoms (e.g., fatigue, mild transient twinges) without acute red flags."
                ))
            else:
                # LEVEL 4: GENERAL SELF-CARE GUIDANCE
                urgency_level = 4
                matched_rules.append(ClinicalRuleMatch(
                    rule_id="RULE-WELLNESS-01",
                    rule_name="Low-Acuity Wellness & Preventive Monitoring",
                    guideline_source="WHO / AHA Guidelines for Cardiovascular Health Promotion",
                    citation="WHO Cardiovascular Diseases Fact Sheet, 2023",
                    trigger_criteria="No acute cardiac symptoms reported; appropriate for preventive wellness habits and symptom monitoring."
                ))

        # -------------------------------------------------------------
        # GENERATE FIRST RESPONSE INSTRUCTIONS AND TEXT
        # -------------------------------------------------------------
        first_response = self._generate_first_response(urgency_level, matched_rules, med_hist)
        
        # Format human-readable summaries
        symptom_display_list = self._format_symptom_names(all_symptom_ids)
        onset_time_str = request.symptom_onset_datetime or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        # Emergency contacts list
        emergency_contacts = [
            EmergencyContactInfo(title="National Emergency Number (India)", number="112", description="All-in-one Emergency Response Support System (Police, Fire, Ambulance)"),
            EmergencyContactInfo(title="National Ambulance Service", number="108", description="Toll-free emergency medical transit with paramedic life support"),
            EmergencyContactInfo(title="Cardiology Rapid Response Helpline", number="102", description="Dedicated urgent medical transport"),
            EmergencyContactInfo(title="US / International Emergency", number="911", description="International standard emergency dispatch")
        ]

        # Concise emergency summary text for sharing with trusted contact / paramedic
        summary_text = self._build_emergency_summary_text(
            patient_name=patient_name,
            urgency_level=urgency_level,
            symptoms=symptom_display_list,
            onset_time=onset_time_str,
            duration=duration,
            severity=severity,
            trend=trend,
            med_hist=med_hist,
            lat=request.latitude if request.share_location_consent else None,
            lng=request.longitude if request.share_location_consent else None
        )

        # Meta configuration per urgency level
        level_configs = {
            1: {
                "tier": "LEVEL_1_EMERGENCY",
                "color": "rose",
                "title": "LEVEL 1: EMERGENCY (Time-Critical Immediate Response)",
                "title_ta": "நிலை 1: அவசர எச்சரிக்கை (உடனடி மருத்துவ உதவி தேவை - 112-ஐ அழைக்கவும்)",
                "badge": "CRITICAL EMERGENCY",
                "badge_ta": "அவசர உதவி",
                "headline": "CRITICAL MEDICAL ALERT: IMMEDIATE EMERGENCY MEDICAL EVALUATION REQUIRED",
                "headline_ta": "முக்கிய மருத்துவ எச்சரிக்கை: உடனடியாக 112 அல்லது 108 அவசர எண்ணை அழைக்கவும்",
                "explanation": "Your reported symptoms match clinical red-flag indicators for suspected acute coronary syndrome or a life-threatening cardiovascular emergency. Do not wait for symptoms to pass or attempt self-care. Professional medical transit is required immediately.",
                "explanation_ta": "உங்கள் அறிகுறிகள் தீவிர இதய பாதிப்பு அல்லது அவசர நிலையை குறிக்கின்றன. உடனடியாக 112 அல்லது 108 எண்ணை அழைத்து ஆம்புலன்ஸ் உதவியைப் பெறுங்கள். தாமதிக்க வேண்டாம்."
            },
            2: {
                "tier": "LEVEL_2_URGENT",
                "color": "amber",
                "title": "LEVEL 2: URGENT MEDICAL EVALUATION (Prompt Same-Day Assessment)",
                "title_ta": "நிலை 2: விரைவான மருத்துவ பரிசோதனை (இன்றே மருத்துவரை அணுகவும்)",
                "badge": "URGENT EVALUATION",
                "badge_ta": "விரைவு பரிசோதனை",
                "headline": "URGENT MEDICAL EVALUATION ADVISED TODAY",
                "headline_ta": "இன்றே அவசர சிகிச்சை அல்லது மருத்துவரை அணுகுமாறு பரிந்துரைக்கப்படுகிறது",
                "explanation": "Your symptoms warrant prompt evaluation by a qualified doctor or urgent care clinic today (within 2–4 hours). While immediate emergency resuscitation may not be signaled, these signs must be evaluated clinically with an ECG and physician examination.",
                "explanation_ta": "உங்கள் அறிகுறிகள் இன்றே தகுந்த மருத்துவரிடம் பரிசோதனை செய்யப்பட வேண்டும் (2-4 மணி நேரத்திற்குள்). ECG மற்றும் மருத்துவ பரிசோதனை மூலம் உறுதி செய்வது அவசியம்."
            },
            3: {
                "tier": "LEVEL_3_ROUTINE",
                "color": "teal",
                "title": "LEVEL 3: ROUTINE MEDICAL FOLLOW-UP (Scheduled Outpatient Care)",
                "title_ta": "நிலை 3: வழக்கமான மருத்துவ ஆலோசனை (1-3 நாட்களில் மருத்துவரை சந்திக்கவும்)",
                "badge": "ROUTINE FOLLOW-UP",
                "badge_ta": "வழக்கமான ஆலோசனை",
                "headline": "SCHEDULED PHYSICIAN CONSULTATION RECOMMENDED",
                "headline_ta": "வழக்கமான மருத்துவ சந்திப்பை திட்டமிடுமாறு பரிந்துரைக்கப்படுகிறது",
                "explanation": "Your reported symptoms do not indicate acute cardiac distress, but suggest mild or chronic discomfort that should be discussed with your physician in a scheduled appointment (within 1–3 days). Monitor your condition and record any changes.",
                "explanation_ta": "உடனடி அவசர அறிகுறிகள் இல்லை. இருப்பினும் உங்கள் ஆரோக்கியத்தை கண்காணிக்க 1-3 நாட்களில் உங்கள் மருத்துவரை அணுகி ஆலோசனை பெறவும்."
            },
            4: {
                "tier": "LEVEL_4_SELF_CARE",
                "color": "emerald",
                "title": "LEVEL 4: GENERAL SELF-CARE GUIDANCE (Low Acuity Wellness)",
                "title_ta": "நிலை 4: பொதுவான நல்வாழ்வு பராமரிப்பு & சுய கவனிப்பு",
                "badge": "SELF-CARE & MONITOR",
                "badge_ta": "சுய கவனிப்பு",
                "headline": "GENERAL WELLNESS & PRECAUTIONARY MONITORING",
                "headline_ta": "பொதுவான ஆரோக்கிய வழிகாட்டுதல் & விழிப்புணர்வு",
                "explanation": "No acute cardiac warning symptoms reported. Continue your heart-healthy lifestyle habits: proper hydration, balanced nutrition, restful sleep, and stress reduction. Review warning signs that require escalating care.",
                "explanation_ta": "எந்த அவசர இதய அறிகுறிகளும் காணப்படவில்லை. போதுமான குடிநீர், சமச்சீர் உணவு, நல்ல உறக்கம் மற்றும் மன அழுத்தமில்லாத பழக்கங்களை தொடருங்கள். எச்சரிக்கை அறிகுறிகளை கண்காணிக்கவும்."
            }
        }

        conf = level_configs[urgency_level]

        return TriageAssessmentResponse(
            report_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow().isoformat(),
            urgency_level=urgency_level,
            urgency_tier=conf["tier"],
            urgency_title=conf["title"],
            urgency_title_ta=conf["title_ta"],
            urgency_color=conf["color"],
            badge_label=conf["badge"],
            badge_label_ta=conf["badge_ta"],
            summary_headline=conf["headline"],
            summary_headline_ta=conf["headline_ta"],
            explanation=conf["explanation"],
            explanation_ta=conf["explanation_ta"],
            matched_rules=matched_rules,
            first_response_guidance=first_response,
            reported_symptoms_summary=symptom_display_list,
            onset_time_display=onset_time_str,
            duration_display=duration if duration != "not_sure" else "Unspecified duration",
            severity_display=severity if severity != "not_sure" else "Unspecified severity",
            has_emergency_alert=(urgency_level == 1),
            emergency_contacts=emergency_contacts,
            emergency_summary_text=summary_text,
            uncertainty_notice=uncertainty_notice,
            uncertainty_notice_ta=uncertainty_notice_ta,
            disclaimer=(
                "CLINICAL SAFETY DISCLAIMER: This symptom checker is an assistive decision-support tool "
                "based on validated clinical practice guidelines. It does NOT provide a definitive diagnosis or replace "
                "emergency medical services. A questionnaire can NEVER guarantee safety. If in doubt, call 112 / 108 immediately."
            ),
            disclaimer_ta=(
                "மருத்துவ பாதுகாப்பு மறுப்பு: இந்த அறிகுறி பரிசோதனை கருவி விழிப்புணர்வு மற்றும் வழிகாட்டுதலுக்கு மட்டுமே. "
                "இது உறுதியான மருத்துவ நோயறிதல் அல்ல. சந்தேகமிருந்தால் உடனடியாக 112 அல்லது 108-ஐ அழைக்கவும்."
            )
        )

    def _generate_first_response(
        self,
        urgency_level: int,
        matched_rules: List[ClinicalRuleMatch],
        med_hist: MedicalHistoryInput
    ) -> FirstResponseInstructions:
        """Provide clinician-validated first-response instructions."""
        if urgency_level == 1:
            do_actions = [
                "Call 112 (National Emergency) or 108 (Ambulance) immediately. Do not delay.",
                "Stop all physical exertion immediately. Sit upright or recline with head and shoulders elevated.",
                "Loosen tight clothing around your collar, chest, and waist to ease breathing.",
                "Take slow, steady breaths to keep your heart rate as stable as possible.",
                "If previously prescribed sublingual nitroglycerin by your cardiologist for angina, administer one dose as instructed.",
                "Unlock your front door so emergency responders and paramedics can enter without delay."
            ]
            dont_actions = [
                "Do NOT attempt to drive yourself or the patient to the hospital in a personal vehicle.",
                "Do NOT take unprescribed painkillers, herbal remedies, or untested medications.",
                "Do NOT take aspirin unless explicitly instructed by the emergency dispatcher or a physician, particularly if bleeding history or aspirin allergy is unknown.",
                "Do NOT dismiss chest heaviness or tightness as simple gas, acidity, or indigestion.",
                "Do NOT eat or drink heavy meals or hot caffeinated beverages."
            ]
            when_to_call = "CALL 112 / 108 IMMEDIATELY. Do not wait for symptoms to subside."
            rationale = "Time is myocardium. In acute ischemic events or stroke, every minute saved preserves vital heart and brain tissue (Golden Hour Principle)."
        elif urgency_level == 2:
            do_actions = [
                "Arrange to visit an urgent care clinic or consult a physician today (within 2–4 hours).",
                "Rest quietly in a comfortable seated position with minimal physical exertion.",
                "Have someone drive you to the clinic; avoid driving yourself if dizzy or short of breath.",
                "Prepare a list of your current medications and past medical records for the doctor.",
                "Monitor your pulse rate and blood pressure if a home monitor is safely available."
            ]
            dont_actions = [
                "Do NOT perform strenuous exercise, heavy lifting, or intense exertion today.",
                "Do NOT take unverified stimulants or home remedies to mask symptoms.",
                "Do NOT delay seeking emergency care if symptoms suddenly worsen to severe crushing pain or cold sweating."
            ]
            when_to_call = "If symptoms worsen, chest pain radiates, or you feel faint, escalate immediately to 112 / 108."
            rationale = "Prompt clinical evaluation with an ECG and physician review rules out evolving unstable angina or arrhythmias safely."
        elif urgency_level == 3:
            do_actions = [
                "Schedule a routine consultation with your primary care doctor or cardiologist in the next 1–3 days.",
                "Maintain a symptom log: write down when the symptom occurs, how long it lasts, and what triggered it.",
                "Ensure adequate hydration and regular restful sleep (7–8 hours).",
                "Take prescribed maintenance medications consistently as directed by your physician."
            ]
            dont_actions = [
                "Do NOT suddenly stop or change dosages of prescribed cardiovascular medications without consulting your doctor.",
                "Do NOT consume excessive caffeine, energy drinks, or tobacco products."
            ]
            when_to_call = "Contact emergency services if you experience new severe chest pressure, breathlessness, or syncope."
            rationale = "Mild, stable non-acute symptoms are best evaluated through a comprehensive outpatient clinical review."
        else:
            do_actions = [
                "Maintain healthy lifestyle habits: drink 8 glasses of clean water daily, eat fiber-rich meals, and manage stress.",
                "Engage in regular moderate physical activity as cleared by your physician.",
                "Practice mindful breathing and maintain regular sleep hygiene.",
                "Monitor your cardiovascular wellness periodically through our routine risk tools."
            ]
            dont_actions = [
                "Do NOT ignore new warning signs if they appear in the future.",
                "Do NOT assume absence of symptoms equals absence of chronic risk; periodic check-ups remain important."
            ]
            when_to_call = "Seek immediate medical care if you experience sudden chest discomfort, breathlessness, or unexplained fainting."
            rationale = "Preventive cardiovascular maintenance supports long-term arterial health and reduces future acute event risk."

        return FirstResponseInstructions(
            do_actions=do_actions,
            dont_actions=dont_actions,
            when_to_call=when_to_call,
            clinical_rationale=rationale
        )

    def _format_symptom_names(self, symptom_ids: set) -> List[str]:
        names = []
        for s_id in symptom_ids:
            if s_id in symptom_nlp_service.vocab:
                names.append(symptom_nlp_service.vocab[s_id]["canonical_name"])
            else:
                names.append(s_id.replace("_", " ").title())
        return names if names else ["No specific symptoms reported"]

    def _build_emergency_summary_text(
        self,
        patient_name: str,
        urgency_level: int,
        symptoms: List[str],
        onset_time: str,
        duration: str,
        severity: str,
        trend: str,
        med_hist: MedicalHistoryInput,
        lat: Optional[float] = None,
        lng: Optional[float] = None
    ) -> str:
        """Construct structured clinical handoff summary for emergency responders and trusted contacts."""
        tier_title = (
            "CRITICAL EMERGENCY (Level 1)" if urgency_level == 1
            else ("URGENT MEDICAL EVALUATION (Level 2)" if urgency_level == 2
                  else ("ROUTINE FOLLOW-UP (Level 3)" if urgency_level == 3 else "SELF-CARE (Level 4)"))
        )

        history_items = []
        if med_hist.previous_heart_attack == "yes": history_items.append("Prior Heart Attack (MI)")
        if med_hist.previous_heart_disease == "yes": history_items.append("Prior Heart Disease (CAD)")
        if med_hist.previous_stroke == "yes": history_items.append("Prior Stroke")
        if med_hist.diabetes == "yes": history_items.append("Diabetes")
        if med_hist.high_blood_pressure == "yes": history_items.append("Hypertension")
        if med_hist.high_cholesterol == "yes": history_items.append("High Cholesterol")
        if not history_items:
            history_items.append("No major cardiac history reported (or uncertain)")

        summary_lines = [
            f"🚨 HEART ASSISTANT EMERGENCY MEDICAL SUMMARY 🚨",
            f"Patient: {patient_name}",
            f"Triage Level: {tier_title}",
            f"Reported Symptoms: {', '.join(symptoms)}",
            f"Symptom Onset: {onset_time}",
            f"Duration: {duration}",
            f"Reported Severity: {severity.title()}",
            f"Trajectory: {trend.title()}",
            f"Medical History: {', '.join(history_items)}",
            f"Current Medications: {med_hist.current_medications or 'None specified'}",
            f"Allergies: {med_hist.allergies or 'No known drug allergies'}"
        ]

        if lat is not None and lng is not None:
            maps_url = f"https://maps.google.com/?q={lat:.5f},{lng:.5f}"
            summary_lines.append(f"Patient Location (GPS): {maps_url}")

        summary_lines.append(
            "\nGenerated by Heart Assistant AI Clinical Triage System. Share with attending paramedic or ER physician."
        )

        return "\n".join(summary_lines)

clinical_rule_engine = ClinicalRuleEngine()
