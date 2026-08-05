"""
Training Pipeline for Random Forest Model using scikit-learn
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

def train_rf_pipeline():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "drug_excipient_dataset.csv")
    if not os.path.exists(dataset_path):
        print("Dataset not found. Skipping training.")
        return

    df = pd.read_csv(dataset_path)
    X = df[['diff_logp', 'diff_mw', 'diff_tpsa', 'cosine_sim', 'tanimoto_sim', 'maillard_risk', 'metal_chelation_risk', 'ester_hydrolysis_risk']]
    y = df['compatibility_status']

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X, y)

    os.makedirs("ml", exist_ok=True)
    joblib.dump(clf, "ml/random_forest.pkl")
    print("Random Forest model trained and saved to ml/random_forest.pkl")

if __name__ == "__main__":
    train_rf_pipeline()
