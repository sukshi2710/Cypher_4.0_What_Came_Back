from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.database import init_db, get_db_connection
from app.models import AgentAnalysisRequest, AgentAnalysisResponse
from app.services.gemini_service import GeminiRecoveryAgent
from app.services.recovery_engine import calculate_recovery
from app.services.dataset_service import (
    load_project_datasets,
    analyze_project_data,
)

app = FastAPI(
    title="What Came Back API",
    description="Intelligent E-Commerce Returns and Recovery Platform",
    version="1.0.0",
)

# Allow React development server & local clients to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # Permissive for development/demo ease
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini reasoning service agent
agent_service = GeminiRecoveryAgent()


# Database startup event listener
@app.on_event("startup")
def startup_event():
    """Initializes SQLite database tables from CSV dataset files on app startup."""
    try:
        init_db()
    except Exception as error:
        print(f"[STARTUP WARNING] SQLite initialization failed: {error}")


class RecoveryRequest(BaseModel):
    quantity: int = Field(gt=0)
    original_cost: float = Field(ge=0)
    new_selling_price: float = Field(ge=0)
    refurbishment_cost: float = Field(ge=0)
    refurbishment_rate: float = Field(ge=0, le=1)
    vendor_credit_rate: float = Field(ge=0, le=1)
    vendor_eligible_quantity: int = Field(ge=0)
    liquidation_rate: float = Field(ge=0, le=1)


@app.get("/")
def home():
    tables = []
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()
    except Exception:
        tables = ["Database uninitialized"]

    return {
        "project": "What Came Back",
        "message": "Returns Recovery Platform API is running",
        "version": "1.0.0",
        "database_tables": tables,
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/products")
def list_products():
    try:
        datasets = load_project_datasets()
        products = datasets["products"]

        return {
            "count": len(products),
            "products": products,
        }

    except (FileNotFoundError, ValueError, KeyError) as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load product data: {error}",
        ) from error


@app.post("/api/recovery/calculate")
def recovery_endpoint(request: RecoveryRequest):
    if request.vendor_eligible_quantity > request.quantity:
        raise HTTPException(
            status_code=422,
            detail="Vendor-eligible quantity cannot exceed total quantity.",
        )

    try:
        return calculate_recovery(**request.model_dump())

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error


@app.get("/api/dashboard")
def dashboard():
    try:
        result = analyze_project_data()
        recommendations = result["recovery_recommendations"]

        total_quantity = sum(
            item["quantity"]
            for item in recommendations
        )

        total_recovery = sum(
            item["recovery"]["total_net_recovery"]
            for item in recommendations
        )

        return {
            "data_source": result["data_source"],
            "returns_analyzed": result["returns_analyzed"],
            "total_returned_quantity": total_quantity,
            "total_net_recovery": round(total_recovery, 2),
            "flagged_batch_count": (
                result["supplier_analysis"]["flagged_batch_count"]
            ),
            "requires_human_approval": True,
        }

    except (FileNotFoundError, ValueError, KeyError) as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate dashboard: {error}",
        ) from error


@app.get("/api/recovery")
def recovery_recommendations():
    try:
        result = analyze_project_data()

        return {
            "data_source": result["data_source"],
            "returns_analyzed": result["returns_analyzed"],
            "recommendations": result["recovery_recommendations"],
            "requires_human_approval": True,
        }

    except (FileNotFoundError, ValueError, KeyError) as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate recovery recommendations: {error}",
        ) from error


@app.get("/api/suppliers")
def supplier_analysis():
    try:
        result = analyze_project_data()
        return result["supplier_analysis"]

    except (FileNotFoundError, ValueError, KeyError) as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to analyze supplier batches: {error}",
        ) from error


# =======================================================
# GEMINI REASONING AGENT ENDPOINT (Member 1 Responsibility)
# =======================================================
@app.post(
    "/api/agent/analyze",
    response_model=AgentAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate AI reasoning for return recovery choices"
)
def analyze_returns_with_agent(request: AgentAnalysisRequest):
    """
    Receives user prompts along with backend-validated financial and defect facts,
    returning structured reasoning, trade-offs, and proposals for human approval.
    """
    try:
        return agent_service.analyze_returns(request)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing agent analysis: {str(error)}"
        ) from error