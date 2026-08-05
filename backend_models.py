"""
SQLAlchemy Models for Drug, Excipient, Prediction, and PredictionHistory
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from datetime import datetime
from backend.database import Base

class DrugModel(Base):
    __tablename__ = "drugs"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    cas_number = Column(String, nullable=True)
    smiles = Column(Text)
    formula = Column(String)
    therapeutic_category = Column(String)
    mw = Column(Float)
    logp = Column(Float)
    tpsa = Column(Float)
    hbd = Column(Integer)
    hba = Column(Integer)

class ExcipientModel(Base):
    __tablename__ = "excipients"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    cas_number = Column(String, nullable=True)
    smiles = Column(Text)
    formula = Column(String)
    category = Column(String)
    typical_concentration = Column(String)
    mw = Column(Float)
    logp = Column(Float)
    tpsa = Column(Float)

class PredictionHistoryModel(Base):
    __tablename__ = "prediction_history"
    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    drug_name = Column(String)
    excipient_name = Column(String)
    status = Column(String)
    confidence_score = Column(Float)
    recommendation = Column(Text)
