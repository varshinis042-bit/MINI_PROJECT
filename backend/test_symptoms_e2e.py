"""End-to-end API validation test for AI Symptom-Based Triage, Clinical Rule Engine,
Emergency Response, NLP Extraction, and Trusted Contacts.
"""
import requests

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("\n=== STARTING AI SYMPTOM TRIAGE E2E TESTS ===")

    # 1. NLP Extraction in English
    print("1. Testing NLP Extraction (English)...")
    r = requests.post(f"{BASE_URL}/symptoms/extract-nlp", json={
        "text": "I have sudden severe crushing chest pain radiating to my left arm with cold sweating for 25 minutes",
        "language": "en"
    })
    assert r.status_code == 200, f"NLP extraction failed: {r.text}"
    nlp_data = r.json()
    extracted_ids = [s["symptom_id"] for s in nlp_data["extracted_symptoms"]]
    assert "chest_pain" in extracted_ids, "Failed to extract chest_pain"
    assert "radiating_pain" in extracted_ids, "Failed to extract radiating_pain"
    assert "diaphoresis_sweating" in extracted_ids, "Failed to extract diaphoresis_sweating"
    assert nlp_data["has_emergency_keywords"] is True, "Emergency keywords flag failed"
    print("   [PASS] Extracted symptoms:", extracted_ids, "| Emergency flag:", nlp_data["has_emergency_keywords"])

    # 2. NLP Extraction in Tamil
    print("2. Testing NLP Extraction (Tamil)...")
    r = requests.post(f"{BASE_URL}/symptoms/extract-nlp", json={
        "text": "எனக்கு கடுமையான நெஞ்சு வலி மற்றும் குளிர்ந்த வியர்வை உள்ளது",
        "language": "ta"
    })
    assert r.status_code == 200, f"Tamil NLP extraction failed: {r.text}"
    nlp_ta = r.json()
    extracted_ta_ids = [s["symptom_id"] for s in nlp_ta["extracted_symptoms"]]
    assert "chest_pain" in extracted_ta_ids, "Failed to extract chest_pain in Tamil"
    assert "diaphoresis_sweating" in extracted_ta_ids, "Failed to extract diaphoresis_sweating in Tamil"
    print("   [PASS] Extracted Tamil symptoms:", extracted_ta_ids, "| Language:", nlp_ta["detected_language"])

    # 3. Clinical Triage Evaluation: Level 1 Emergency
    print("3. Testing Clinical Triage (Level 1: Emergency)...")
    r = requests.post(f"{BASE_URL}/symptoms/triage", json={
        "symptom_description": "Sudden crushing chest pain radiating to jaw and cold sweating",
        "reported_symptoms": ["chest_pain", "radiating_pain", "diaphoresis_sweating"],
        "severity": "severe",
        "onset_type": "sudden",
        "duration": "15-30m",
        "medical_history": {
            "previous_heart_attack": "yes",
            "diabetes": "yes",
            "high_blood_pressure": "yes"
        },
        "latitude": 13.0827,
        "longitude": 80.2707,
        "share_location_consent": True
    })
    assert r.status_code == 200, f"Triage request failed: {r.text}"
    triage_1 = r.json()
    assert triage_1["urgency_level"] == 1, f"Expected Level 1, got {triage_1['urgency_level']}"
    assert triage_1["urgency_tier"] == "LEVEL_1_EMERGENCY"
    assert triage_1["has_emergency_alert"] is True
    assert len(triage_1["emergency_contacts"]) > 0
    assert len(triage_1["first_response_guidance"]["do_actions"]) > 0
    assert len(triage_1["first_response_guidance"]["dont_actions"]) > 0
    report_id = triage_1["report_id"]
    print("   [PASS] Level 1 Emergency Triage verified. Report ID:", report_id)

    # 4. Clinical Triage Evaluation: Level 2 Urgent
    print("4. Testing Clinical Triage (Level 2: Urgent Evaluation)...")
    r = requests.post(f"{BASE_URL}/symptoms/triage", json={
        "symptom_description": "Heart beating fast for 45 minutes without fainting",
        "reported_symptoms": ["palpitations"],
        "severity": "moderate",
        "duration": "15-30m"
    })
    assert r.status_code == 200
    triage_2 = r.json()
    assert triage_2["urgency_level"] == 2, f"Expected Level 2, got {triage_2['urgency_level']}"
    print("   [PASS] Level 2 Urgent Evaluation verified:", triage_2["summary_headline"])

    # 5. Clinical Triage Evaluation: Level 4 Self-Care
    print("5. Testing Clinical Triage (Level 4: General Self-Care)...")
    r = requests.post(f"{BASE_URL}/symptoms/triage", json={
        "symptom_description": "General heart wellness inquiry, feeling healthy",
        "reported_symptoms": [],
        "severity": "mild"
    })
    assert r.status_code == 200
    triage_4 = r.json()
    assert triage_4["urgency_level"] == 4, f"Expected Level 4, got {triage_4['urgency_level']}"
    print("   [PASS] Level 4 Self-Care Guidance verified:", triage_4["summary_headline"])

    # 6. Retrieve Symptom History
    print("6. Testing Symptom History Retrieval...")
    r = requests.get(f"{BASE_URL}/symptoms/history")
    assert r.status_code == 200
    history = r.json()
    assert len(history) > 0, "Expected non-empty symptom history"
    print(f"   [PASS] Retrieved {len(history)} symptom history reports.")

    # 7. Retrieve Report By ID
    print("7. Testing Get Report by ID...")
    r = requests.get(f"{BASE_URL}/symptoms/{report_id}")
    assert r.status_code == 200
    single_rep = r.json()
    assert single_rep["_id"] == report_id
    print("   [PASS] Successfully retrieved report by ID:", single_rep["urgency_tier"])

    # 8. Emergency Summary Generation
    print("8. Testing Emergency Summary Generation (WhatsApp & SMS)...")
    r = requests.post(f"{BASE_URL}/symptoms/emergency-summary", json={
        "report_id": report_id,
        "include_location": True,
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert r.status_code == 200
    summ = r.json()
    assert "https://wa.me/?text=" in summ["whatsapp_share_url"]
    assert "sms:?body=" in summ["sms_share_url"]
    assert summ["maps_url"] is not None
    print("   [PASS] Emergency summary URLs generated successfully.")

    # 9. Trusted Contacts CRUD
    print("9. Testing Trusted Contacts Management...")
    # Create contact
    r = requests.post(f"{BASE_URL}/symptoms/trusted-contacts", json={
        "name": "Karthik Raja",
        "relationship": "Brother",
        "phone": "+919876543210",
        "email": "karthik@example.com",
        "is_primary": True
    })
    assert r.status_code == 200
    contact = r.json()
    contact_id = contact["id"]
    assert contact_id is not None
    print("   [PASS] Created trusted contact:", contact["name"], f"(ID: {contact_id})")

    # List contacts
    r = requests.get(f"{BASE_URL}/symptoms/trusted-contacts")
    assert r.status_code == 200
    contacts = r.json()
    assert any(c["id"] == contact_id for c in contacts)
    print(f"   [PASS] Listed {len(contacts)} trusted contact(s).")

    # Delete contact
    r = requests.delete(f"{BASE_URL}/symptoms/trusted-contacts/{contact_id}")
    assert r.status_code == 200
    print("   [PASS] Deleted trusted contact successfully.")

    print("\n=======================================================")
    print("ALL AI SYMPTOM TRIAGE E2E TESTS PASSED WITH 100% SUCCESS!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()
