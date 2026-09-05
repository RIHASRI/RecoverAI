from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from database import engine, Base, SessionLocal
from models import Customer, Transaction
from seed import generate_seed_data
from api.routes import router as api_router

app = FastAPI(
    title="RecoverAI — Autonomous Revenue Recovery Agent",
    description="Full-stack AI revenue recovery engine with ML probability scoring, guardrails, and Razorpay simulation.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    customer_count = db.query(Customer).count()
    txn_count = db.query(Transaction).count()
    db.close()

    if customer_count == 0 or txn_count == 0:
        print("Database empty or missing seed data. Seeding initial database now...")
        generate_seed_data()
    else:
        print(f"RecoverAI DB active with {customer_count} customers and {txn_count} transactions.")

@app.get("/")
def root():
    return {
        "name": "RecoverAI API Server",
        "status": "ONLINE",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
