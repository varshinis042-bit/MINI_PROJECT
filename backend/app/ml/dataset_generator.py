"""Cardiovascular Research Benchmark Dataset Curator & Generator.
Generates an epidemiologically grounded cardiovascular cohort based on Framingham Heart Study
and ACC/AHA Risk Equations with realistic multi-collinearities, age-sex distributions,
blood pressure, cholesterol ratios, and clinical outcome markers.
"""
import os
from pathlib import Path
import numpy as np
import pandas as pd

def generate_cardiovascular_dataset(n_samples: int = 2500, random_state: int = 42) -> pd.DataFrame:
    np.random.seed(random_state)

    # Demographic distributions
    age = np.random.normal(loc=53.0, scale=11.0, size=n_samples).clip(22, 80).astype(int)
    sex = np.random.choice(["male", "female"], size=n_samples, p=[0.52, 0.48])

    # Anthropometrics
    height = np.where(sex == "male", np.random.normal(172, 7, n_samples), np.random.normal(159, 6, n_samples)).clip(135, 205).round(1)
    weight = np.where(
        sex == "male",
        np.random.normal(76, 12, n_samples),
        np.random.normal(64, 11, n_samples)
    ) + (age - 40) * 0.10
    weight = weight.clip(42, 135).round(1)
    bmi = (weight / ((height / 100.0) ** 2)).round(1)

    # Blood Pressure (correlated with age, bmi, stress)
    base_sbp = 110 + (age * 0.42) + (bmi * 0.65)
    sbp = np.random.normal(base_sbp, 14).clip(90, 205).astype(int)
    dbp = (sbp * 0.63 + np.random.normal(0, 5, n_samples)).clip(55, 120).astype(int)

    # Lipids & Glycemia
    base_chol = 170 + (age * 0.55) + (bmi * 0.8)
    cholesterol = np.random.normal(base_chol, 28).clip(120, 380).astype(int)

    base_glucose = 88 + (bmi * 0.75) + (age * 0.22)
    blood_glucose = np.random.normal(base_glucose, 20).clip(68, 300).astype(int)

    # Resting Heart Rate
    resting_hr = np.random.normal(73, 9, n_samples).clip(48, 120).astype(int)

    # Lifestyle & History
    smoking_status = np.random.choice(["never", "former", "current"], size=n_samples, p=[0.52, 0.24, 0.24])

    diabetes_prob = np.where(blood_glucose > 140, 0.85, np.where(blood_glucose > 110, 0.35, 0.06))
    diabetes_status = []
    for p in diabetes_prob:
        r = np.random.rand()
        if r < p * 0.1:
            diabetes_status.append("type1")
        elif r < p:
            diabetes_status.append("type2")
        elif r < p + 0.15:
            diabetes_status.append("pre_diabetes")
        else:
            diabetes_status.append("no")
    diabetes_status = np.array(diabetes_status)

    family_history = np.random.choice([0, 1], size=n_samples, p=[0.68, 0.32])
    physical_activity = np.random.choice(
        ["sedentary", "light", "moderate", "active", "very_active"],
        size=n_samples, p=[0.28, 0.30, 0.26, 0.12, 0.04]
    )
    sleep_duration = np.random.normal(6.9, 1.1, n_samples).clip(4.0, 10.0).round(1)
    stress_level = np.random.choice([1, 2, 3, 4, 5], size=n_samples, p=[0.12, 0.26, 0.34, 0.20, 0.08])
    alcohol_status = np.random.choice(["none", "occasional", "moderate", "heavy"], size=n_samples, p=[0.45, 0.30, 0.18, 0.07])

    # Cardiovascular Risk Target Calculation (Framingham / ACC-AHA aligned linear-logistic score)
    log_odds = -1.2
    log_odds += (age - 52) * 0.048
    log_odds += np.where(sex == "male", 0.32, 0.0)
    log_odds += (sbp - 128) * 0.030
    log_odds += (cholesterol - 195) * 0.016
    log_odds += (blood_glucose - 100) * 0.014
    log_odds += np.where(smoking_status == "current", 0.85, np.where(smoking_status == "former", 0.25, 0.0))
    log_odds += np.where(np.isin(diabetes_status, ["type1", "type2"]), 0.85, np.where(diabetes_status == "pre_diabetes", 0.30, 0.0))
    log_odds += family_history * 0.50
    log_odds += (bmi - 24.5) * 0.038
    log_odds += np.where(physical_activity == "sedentary", 0.35, np.where(physical_activity == "very_active", -0.45, 0.0))
    log_odds += np.where(sleep_duration < 6.0, 0.30, 0.0)
    log_odds += (stress_level - 3) * 0.12
    log_odds += np.where(alcohol_status == "heavy", 0.35, 0.0)

    # Probability via sigmoid
    prob = 1.0 / (1.0 + np.exp(-log_odds))
    # Outcome: binary classification with realistic clinical noise
    target = (prob > np.random.uniform(0.32, 0.68, n_samples)).astype(int)

    df = pd.DataFrame({
        "age": age,
        "sex": sex,
        "height_cm": height,
        "weight_kg": weight,
        "bmi": bmi,
        "systolic_bp": sbp,
        "diastolic_bp": dbp,
        "cholesterol": cholesterol,
        "blood_glucose": blood_glucose,
        "resting_hr": resting_hr,
        "smoking_status": smoking_status,
        "diabetes_status": diabetes_status,
        "family_history": family_history,
        "physical_activity": physical_activity,
        "sleep_duration": sleep_duration,
        "stress_level": stress_level,
        "alcohol_status": alcohol_status,
        "cardiovascular_risk": target
    })

    return df

if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent.parent.parent / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "cardiovascular_risk_dataset.csv"
    df = generate_cardiovascular_dataset(2500)
    df.to_csv(out_path, index=False)
    print(f"Dataset generated at: {out_path}")
    print(f"Shape: {df.shape}")
    print("Class distribution:")
    print(df["cardiovascular_risk"].value_counts(normalize=True))