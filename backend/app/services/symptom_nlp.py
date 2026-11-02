"""Natural Language Processing (NLP) Symptom Extraction Service.

Extracts structured clinical symptom entities, anatomical locations, onset,
duration, severity, and trends from everyday descriptions in English and Tamil.
Uses a controlled medical symptom vocabulary and does not make medical urgency decisions.
"""
import re
from typing import List, Dict, Any, Optional, Tuple
from app.schemas.symptoms import (
    ExtractedSymptomItem,
    SymptomExtractionResponse
)

# Controlled Medical Symptom Vocabulary Mapping
VOCABULARY_DEFINITIONS = {
    "chest_pain": {
        "canonical_name": "Chest Discomfort / Anginal Pain",
        "canonical_name_ta": "நெஞ்சு வலி / மார்பு அசௌகரியம்",
        "default_location": "chest",
        "is_cardiac_warning": True,
        "keywords_en": [
            r"\bchest\s+pain\b", r"\bchest\s+pressure\b", r"\bchest\s+tightness\b",
            r"\bsqueezing\s+chest\b", r"\bheavy\s+chest\b", r"\bchest\s+heaviness\b",
            r"\bcrushing\s+pain\b", r"\bchest\s+burning\b", r"\bangina\b",
            r"\bheart\s+hurting\b", r"\bpain\s+in\s+my\s+chest\b", r"\bpain\s+in\s+chest\b",
            r"\bchest\s+discomfort\b", r"\bchest\s+ache\b", r"\bhurting\s+in\s+chest\b"
        ],
        "keywords_ta": [
            "நெஞ்சு வலி", "மார்பு வலி", "நெஞ்சு அடைப்பு", "நெஞ்சு இறுக்கம்",
            "நெஞ்சு பாரம்", "நெஞ்சில் வலி", "மார்பில் வலி", "நெஞ்சு எரியுது",
            "மார்பு இறுக்கம்", "நெஞ்சு அழுத்துகிறது"
        ],
        "keywords_translit": [
            r"\bnenju\s+vali\b", r"\bmarbu\s+vali\b", r"\bnenju\s+adaippu\b",
            r"\bnenjil\s+vali\b", r"\bnenju\s+erichal\b", r"\bnenju\s+baram\b"
        ]
    },
    "shortness_of_breath": {
        "canonical_name": "Shortness of Breath / Dyspnea",
        "canonical_name_ta": "மூச்சுத் திணறல் / மூச்சு விடுவதில் சிரமம்",
        "default_location": "lungs/chest",
        "is_cardiac_warning": True,
        "keywords_en": [
            r"\bdifficulty\s+breathing\b", r"\bshortness\s+of\s+breath\b", r"\bbreathless\b",
            r"\bout\s+of\s+breath\b", r"\btrouble\s+breathing\b", r"\bhard\s+to\s+breathe\b",
            r"\bgasping\b", r"\bsuffocating\b", r"\bcan\'?t\s+catch\s+my\s+breath\b",
            r"\bdyspnea\b", r"\bpanting\b", r"\bcannot\s+breathe\b"
        ],
        "keywords_ta": [
            "மூச்சு விட சிரமம்", "மூச்சுத் திணறல்", "மூச்சு வாங்குதல்",
            "மூச்சு திணறுகிறது", "மூச்சு முட்டுகிறது", "மூச்சு விட முடியவில்லை",
            "மூச்சு வாங்குது"
        ],
        "keywords_translit": [
            r"\bmoochu\s+thinaral\b", r"\bmoochu\s+vida\s+siramam\b", r"\bmoochu\s+vanguthu\b",
            r"\bmoochu\s+muttuthu\b"
        ]
    },
    "palpitations": {
        "canonical_name": "Palpitations / Tachycardia",
        "canonical_name_ta": "இதய படபடப்பு / வேகமான துடிப்பு",
        "default_location": "heart",
        "is_cardiac_warning": True,
        "keywords_en": [
            r"\bheart\s+beating\s+very\s+fast\b", r"\bheart\s+beating\s+fast\b",
            r"\bracing\s+heart\b", r"\bpalpitation(s)?\b", r"\bfluttering\b",
            r"\bpounding\s+heart\b", r"\bskipping\s+beats\b", r"\birregular\s+heartbeat\b",
            r"\bheart\s+racing\b", r"\brapid\s+pulse\b", r"\bpounding\s+chest\b"
        ],
        "keywords_ta": [
            "இதயம் வேகமாக துடிக்கிறது", "படபடப்பு", "நெஞ்சு படபடப்பு",
            "இதயம் படபடக்கிறது", "இதயத் துடிப்பு அதிகம்", "நெஞ்சு எகிறுகிறது"
        ],
        "keywords_translit": [
            r"\bpadapadapu\b", r"\bnenju\s+padapadapu\b", r"\bidhayam\s+vegama\b"
        ]
    },
    "dizziness_syncope": {
        "canonical_name": "Dizziness / Lightheadedness / Syncope",
        "canonical_name_ta": "தலைச்சுற்றல் / மயக்கம்",
        "default_location": "head",
        "is_cardiac_warning": True,
        "keywords_en": [
            r"\bdizzy\b", r"\bdizziness\b", r"\blightheaded(ness)?\b",
            r"\bfeeling\s+faint\b", r"\bfainted\b", r"\bpassed\s+out\b",
            r"\bvertigo\b", r"\bblacking\s+out\b", r"\bsyncope\b",
            r"\bhead\s+spinning\b", r"\bunsteady\b", r"\bgiddy\b"
        ],
        "keywords_ta": [
            "தலைச்சுற்றல்", "மயக்கம்", "தலை சுற்றுகிறது",
            "மயங்கி விழுதல்", "மயக்கம் வருகிறது", "கண்கள் இருட்டுகிறது",
            "தலை சுத்துது"
        ],
        "keywords_translit": [
            r"\bthalaisutral\b", r"\bmayakkam\b", r"\bthalai\s+suthuthu\b",
            r"\bmayangi\s+vizhunthen\b"
        ]
    },
    "radiating_pain": {
        "canonical_name": "Radiating Pain (Arm / Jaw / Neck / Back)",
        "canonical_name_ta": "கை / தாடை / கழுத்து / முதுகுக்கு பரவும் வலி",
        "default_location": "left_arm",
        "is_cardiac_warning": True,
        "keywords_en": [
            r"\bpain\s+in\s+(my\s+)?left\s+arm\b", r"\bleft\s+arm\s+pain\b",
            r"\bpain\s+radiating\b", r"\bpain\s+spreading\b", r"\bjaw\s+pain\b",
            r"\bneck\s+pain\b", r"\bupper\s+back\s+pain\b", r"\bshoulder\s+pain\b",
            r"\bleft\s+shoulder\s+pain\b", r"\bpain\s+in\s+arm\b", r"\bpain\s+in\s+jaw\b"
        ],
        "keywords_ta": [
            "இடது கையில் வலி", "இடது கை வலி", "தோள்பட்டை வலி",
            "தாடை வலி", "கழுத்து வலி", "முதுகு வலி", "கை வலி"
        ],
        "keywords_translit": [
            r"\bidathu\s+kai\s+vali\b", r"\btholpattai\s+vali\b", r"\bthadai\s+vali\b",
            r"\bkazhuthu\s+vali\b"
        ]
    },
    "diaphoresis_sweating": {
        "canonical_name": "Diaphoresis / Cold Sweating",
        "canonical_name_ta": "குளிர்ந்த வியர்வை / அதிக வியர்வை",
        "default_location": "generalized",
        "is_cardiac_warning": True,
        "keywords_en": [
            r"\bcold\s+sweat(ing)?\b", r"\bsweating\b", r"\bprofuse\s+sweating\b",
            r"\bsoaked\s+in\s+sweat\b", r"\bbreaking\s+into\s+a\s+sweat\b",
            r"\bclammy\b", r"\bclamminess\b", r"\bdiaphoresis\b", r"\bsweaty\b"
        ],
        "keywords_ta": [
            "குளிர்ந்த வியர்வை", "அதிக வியர்வை", "வியர்த்து கொட்டுதல்",
            "உடம்பு வேர்க்கிறது", "வியர்வை", "வியர்க்கிறது"
        ],
        "keywords_translit": [
            r"\bviyarthu\s+kottuthu\b", r"\bviyarvai\b", r"\bkulirntha\s+viyarvai\b"
        ]
    },
    "nausea_vomiting": {
        "canonical_name": "Nausea / Vomiting / Gastric Distress",
        "canonical_name_ta": "குமட்டல் / வாந்தி",
        "default_location": "stomach",
        "is_cardiac_warning": False,
        "keywords_en": [
            r"\bnausea\b", r"\bvomiting\b", r"\bthrowing\s+up\b",
            r"\bupset\s+stomach\b", r"\bnauseous\b", r"\bfeel\s+like\s+vomiting\b",
            r"\bsick\s+to\s+(my\s+)?stomach\b", r"\bsevere\s+indigestion\b"
        ],
        "keywords_ta": [
            "குமட்டல்", "வாந்தி", "வாந்தி வருகிறது", "வாந்தி உணர்வு",
            "வயிறு குமட்டுகிறது"
        ],
        "keywords_translit": [
            r"\bkumattal\b", r"\bvanthi\b", r"\bvanthi\s+varuthu\b"
        ]
    },
    "fatigue_weakness": {
        "canonical_name": "Extreme Fatigue / Generalized Weakness",
        "canonical_name_ta": "உடல் சோர்வு / பலவீனம்",
        "default_location": "generalized",
        "is_cardiac_warning": False,
        "keywords_en": [
            r"\bvery\s+weak\b", r"\bextreme\s+weakness\b", r"\bextreme\s+fatigue\b",
            r"\bexhausted\b", r"\btotal\s+exhaustion\b", r"\bno\s+energy\b",
            r"\blethargic\b", r"\bcannot\s+walk\b", r"\bweakness\b"
        ],
        "keywords_ta": [
            "உடல் சோர்வு", "மிகுந்த பலவீனம்", "சோர்வாக உள்ளது",
            "உடல் பலவீனமாக உள்ளது", "அசதி", "நடக்க முடியவில்லை", "மிகவும் சோர்வு"
        ],
        "keywords_translit": [
            r"\budambula\s+thembu\s+illa\b", r"\bsorvu\b", r"\bbalaveenam\b", r"\basathi\b"
        ]
    },
    "stroke_symptoms": {
        "canonical_name": "Acute Neurological / Stroke Signs (FAST)",
        "canonical_name_ta": "பக்கவாத அறிகுறிகள் (முகம் கோணல் / பேச்சு சிரமம்)",
        "default_location": "face/arm/speech",
        "is_cardiac_warning": True,
        "keywords_en": [
            r"\bfacial\s+droop(ing)?\b", r"\bface\s+droop\b", r"\bslurred\s+speech\b",
            r"\bcannot\s+speak\b", r"\bspeech\s+difficulty\b", r"\barm\s+weakness\b",
            r"\bnumbness\s+on\s+one\s+side\b", r"\bsudden\s+confusion\b", r"\bweak\s+arm\b",
            r"\bone\s+side\s+of\s+face\b", r"\bface\s+weakness\b"
        ],
        "keywords_ta": [
            "முகம் கோணலாகிறது", "பேச முடியவில்லை", "வாய் குழறுகிறது",
            "ஒரு பக்க கை மரத்துப்போதல்", "பக்கவாதம்", "கை கால் செயல் இழப்பு",
            "பேச்சு குழறல்"
        ],
        "keywords_translit": [
            r"\bvaai\s+kuzharuthu\b", r"\bmugam\s+konal\b", r"\bkai\s+marathuppochu\b"
        ]
    },
    "peripheral_edema": {
        "canonical_name": "Peripheral Swelling / Leg Edema",
        "canonical_name_ta": "கால் வீக்கம் / பாத வீக்கம்",
        "default_location": "legs",
        "is_cardiac_warning": False,
        "keywords_en": [
            r"\bswollen\s+legs\b", r"\bleg\s+swelling\b", r"\bswollen\s+feet\b",
            r"\bswollen\s+ankles\b", r"\bfluid\s+in\s+legs\b", r"\bpuffy\s+ankles\b"
        ],
        "keywords_ta": [
            "கால் வீக்கம்", "காலில் வீக்கம்", "பாத வீக்கம்", "நீர் கோர்த்தல்"
        ],
        "keywords_translit": [
            r"\bkaal\s+veekkam\b", r"\bpaatha\s+veekkam\b"
        ]
    }
}

class SymptomNLPExtractor:
    """Bilingual (English & Tamil) NLP-based symptom extraction service."""

    def __init__(self):
        self.vocab = VOCABULARY_DEFINITIONS

    def detect_language(self, text: str) -> str:
        """Detect whether text contains Tamil unicode script or English."""
        # Tamil Unicode range: \u0B80-\u0BFF
        tamil_chars = re.findall(r"[\u0B80-\u0BFF]", text)
        if len(tamil_chars) >= 2:
            return "ta"
        return "en"

    def extract_onset(self, text: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract whether onset is sudden vs gradual, and timing descriptor."""
        t_lower = text.lower()
        sudden_patterns = [
            r"\bsudden(ly)?\b", r"\babrupt(ly)?\b", r"\ball\s+of\s+a\s+sudden\b",
            r"\bjust\s+started\b", r"\bright\s+now\b", r"\bout\s+of\s+the\s+blue\b",
            r"திடீரென", r"திடீரென்று", r"திடீர்", r"உடனடி"
        ]
        gradual_patterns = [
            r"\bgradual(ly)?\b", r"\bslowly\b", r"\bover\s+days\b", r"\bover\s+weeks\b",
            r"படிப்படியாக", r"மெதுவாக", r"சில நாட்களாக"
        ]

        for p in sudden_patterns:
            if re.search(p, t_lower):
                return "sudden", "Started suddenly"

        for p in gradual_patterns:
            if re.search(p, t_lower):
                return "gradual", "Started gradually"

        return "not_sure", None

    def extract_duration(self, text: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract reported duration (e.g. 20 minutes, 2 hours, 3 days)."""
        t_lower = text.lower()
        
        # Check Tamil duration phrases
        ta_min_match = re.search(r"(\d+)\s*(நிமிடம்|நிமிடங்கள்)", text)
        if ta_min_match:
            mins = int(ta_min_match.group(1))
            tier = "<15m" if mins < 15 else ("15-30m" if mins <= 30 else ("1-2h" if mins <= 120 else ">2h"))
            return tier, f"{mins} minutes"

        ta_hr_match = re.search(r"(\d+)\s*(மணி|மணிநேரம்)", text)
        if ta_hr_match:
            hrs = int(ta_hr_match.group(1))
            tier = "1-2h" if hrs <= 2 else ">2h"
            return tier, f"{hrs} hours"

        # Check English regex
        # minutes
        m = re.search(r"(\d+)\s*(minute|minutes|min|mins)\b", t_lower)
        if m:
            mins = int(m.group(1))
            tier = "<15m" if mins < 15 else ("15-30m" if mins <= 30 else ("1-2h" if mins <= 120 else ">2h"))
            return tier, f"{mins} minutes"

        # hours
        h = re.search(r"(\d+)\s*(hour|hours|hr|hrs)\b", t_lower)
        if h:
            hrs = int(h.group(1))
            tier = "1-2h" if hrs <= 2 else ">2h"
            return tier, f"{hrs} hours"

        # days
        d = re.search(r"(\d+)\s*(day|days)\b", t_lower)
        if d:
            days = int(d.group(1))
            return "days", f"{days} days"

        # qualitative duration phrases
        if re.search(r"\b(just\s+now|past\s+few\s+minutes|<15\s*min)\b", t_lower):
            return "<15m", "Less than 15 minutes"
        if re.search(r"\b(all\s+day|since\s+morning|few\s+hours)\b", t_lower):
            return ">2h", "Several hours"

        return "not_sure", None

    def extract_severity(self, text: str) -> Optional[str]:
        """Extract reported severity: mild, moderate, severe, not_sure."""
        t_lower = text.lower()
        severe_words = [
            r"\bsevere\b", r"\bunbearable\b", r"\bcrushing\b", r"\bintense\b",
            r"\bworst\b", r"\bextreme\b", r"\bexcruciating\b", r"\b10/10\b",
            r"கடுமையான", r"தீவிரமான", r"தாங்க\s*முடியாத", r"மிகவும்\s*அதிக"
        ]
        moderate_words = [
            r"\bmoderate\b", r"\bmedium\b", r"\bnoticeable\b",
            r"மிதமான", r"ஓரளவு"
        ]
        mild_words = [
            r"\bmild\b", r"\bslight\b", r"\blittle\b", r"\bfaint\b",
            r"லேசான", r"சிறிதளவு"
        ]

        for p in severe_words:
            if re.search(p, t_lower):
                return "severe"

        for p in moderate_words:
            if re.search(p, t_lower):
                return "moderate"

        for p in mild_words:
            if re.search(p, t_lower):
                return "mild"

        return "not_sure"

    def extract_trend(self, text: str) -> Optional[str]:
        """Extract trajectory: worsening, improving, stable, not_sure."""
        t_lower = text.lower()
        worsening_words = [
            r"\bworse\b", r"\bworsening\b", r"\bgetting\s+worse\b", r"\bincreasing\b",
            r"\bspreading\b", r"\bintensifying\b", r"அதிகமாகிறது", r"மோசமாகிறது", r"கூடுகிறது"
        ]
        improving_words = [
            r"\bbetter\b", r"\bimproving\b", r"\bgetting\s+better\b", r"\bdecreasing\b",
            r"\bsubsiding\b", r"குறைகிறது", r"குணமாகிறது"
        ]

        for p in worsening_words:
            if re.search(p, t_lower):
                return "worsening"

        for p in improving_words:
            if re.search(p, t_lower):
                return "improving"

        return "not_sure"

    def _is_negated(self, text: str, match_start: int, match_end: int) -> bool:
        """Check if symptom mention is in a negated context (e.g., 'no chest pain', 'நெஞ்சு வலி இல்லை')."""
        # Look behind up to 35 chars
        prefix = text[max(0, match_start - 35):match_start].lower()
        neg_prefixes = [
            r"\bno\b", r"\bnot\b", r"\bwithout\b", r"\bdenies\b", r"\bno\s+signs\s+of\b",
            r"\bnever\s+had\b", r"\bfree\s+of\b", r"\bnegative\s+for\b"
        ]
        for np in neg_prefixes:
            if re.search(np + r"\s*$", prefix) or re.search(np + r"\s+\w+\s*$", prefix):
                return True

        # Look ahead up to 25 chars (especially for Tamil 'இல்லை', 'கிடையாது', 'இல்ல')
        suffix = text[match_end:min(len(text), match_end + 25)]
        neg_suffixes = [
            r"^\s*இல்லை", r"^\s*கிடையாது", r"^\s*இல்ல", r"^\s*illa\b", r"^\s*illai\b"
        ]
        for ns in neg_suffixes:
            if re.search(ns, suffix, re.IGNORECASE):
                return True

        return False

    def extract_symptoms(self, text: str, user_lang: Optional[str] = "auto") -> SymptomExtractionResponse:
        """Core NLP extraction pipeline scanning input text against medical vocabulary."""
        if not text or not text.strip():
            return SymptomExtractionResponse(
                raw_text="",
                detected_language="en",
                extracted_symptoms=[],
                has_emergency_keywords=False,
                emergency_flags=[]
            )

        detected_lang = self.detect_language(text) if user_lang == "auto" else user_lang
        t_clean = text.strip()
        t_lower = t_clean.lower()

        extracted_items: List[ExtractedSymptomItem] = []
        emergency_flags: List[str] = []

        onset_tier, _ = self.extract_onset(t_clean)
        duration_tier, duration_desc = self.extract_duration(t_clean)
        severity_tier = self.extract_severity(t_clean)
        trend_tier = self.extract_trend(t_clean)

        for sym_id, definition in self.vocab.items():
            matched = False
            matched_via = None

            # 1. Match English regexes with negation check
            for kw in definition["keywords_en"]:
                for m in re.finditer(kw, t_lower):
                    if not self._is_negated(t_lower, m.start(), m.end()):
                        matched = True
                        matched_via = "en"
                        break
                if matched:
                    break

            # 2. Match Tamil strings with negation check
            if not matched:
                for kw_ta in definition["keywords_ta"]:
                    idx = 0
                    while True:
                        found_idx = t_clean.find(kw_ta, idx)
                        if found_idx == -1:
                            break
                        end_idx = found_idx + len(kw_ta)
                        if not self._is_negated(t_clean, found_idx, end_idx):
                            matched = True
                            matched_via = "ta"
                            break
                        idx = end_idx
                    if matched:
                        break

            # 3. Match Transliterated patterns with negation check
            if not matched:
                for kw_tr in definition.get("keywords_translit", []):
                    for m in re.finditer(kw_tr, t_lower):
                        if not self._is_negated(t_lower, m.start(), m.end()):
                            matched = True
                            matched_via = "translit"
                            break
                    if matched:
                        break

            if matched:
                item = ExtractedSymptomItem(
                    symptom_id=sym_id,
                    symptom_name=definition["canonical_name"],
                    symptom_name_ta=definition["canonical_name_ta"],
                    location=definition["default_location"],
                    severity=severity_tier,
                    onset=onset_tier,
                    duration=duration_desc,
                    is_worsening=True if trend_tier == "worsening" else False,
                    confidence=0.98 if matched_via in ("en", "ta") else 0.90
                )
                extracted_items.append(item)

                if definition.get("is_cardiac_warning"):
                    emergency_flags.append(sym_id)

        # High-risk acute combinations detection & associated symptoms link
        symptom_ids = {s.symptom_id for s in extracted_items}
        for itm in extracted_items:
            itm.associated_symptoms = [sid for sid in symptom_ids if sid != itm.symptom_id]

        has_chest_pain = "chest_pain" in symptom_ids
        has_sweat = "diaphoresis_sweating" in symptom_ids
        has_breath = "shortness_of_breath" in symptom_ids
        has_stroke = "stroke_symptoms" in symptom_ids
        has_syncope = "dizziness_syncope" in symptom_ids

        has_emergency_keywords = False
        if has_stroke or (has_chest_pain and (has_sweat or has_breath)) or (severity_tier == "severe" and has_chest_pain):
            has_emergency_keywords = True

        return SymptomExtractionResponse(
            raw_text=t_clean,
            detected_language=detected_lang,
            extracted_symptoms=extracted_items,
            associated_symptoms=[s.symptom_name for s in extracted_items],
            has_emergency_keywords=has_emergency_keywords,
            emergency_flags=emergency_flags,
            onset_detected=onset_tier if onset_tier != "not_sure" else None,
            duration_detected=duration_desc,
            severity_detected=severity_tier if severity_tier != "not_sure" else None,
            trend_detected=trend_tier if trend_tier != "not_sure" else None
        )

symptom_nlp_service = SymptomNLPExtractor()
