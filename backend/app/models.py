from pydantic import BaseModel, Field
from typing import List, Optional

# ==========================================
# INPUT SCHEMAS (Supplied to Gemini Service)
# ==========================================

class RouteOption(BaseModel):
    route: str = Field(..., description="vendor_return, refurbish, liquidate, scrap")
    units: int
    net_recovery_per_unit: float
    total_net_recovery: float
    time_to_cash_days: int
    feasible: bool
    reason: Optional[str] = None

class DefectInsight(BaseModel):
    sku: str
    supplier_batch: Optional[str] = None
    supplier: str
    total_returns: int
    primary_reason: str
    defect_rate_pct: float
    alert_level: str  # LOW, MEDIUM, HIGH

class RecoveryAnalysisContext(BaseModel):
    sku: str
    product_name: Optional[str] = "Unknown Product"
    total_returned_units: int
    condition_grade: str  # A, B, C, or D
    cost_price: float
    selling_price: float
    current_inventory_units: int
    avg_daily_demand: float
    days_of_supply: float
    routes: List[RouteOption]
    defect_insight: Optional[DefectInsight] = None

class AgentAnalysisRequest(BaseModel):
    user_query: str
    context: RecoveryAnalysisContext

# ==========================================
# OUTPUT SCHEMAS (Returned to React Frontend)
# ==========================================

class ProposedAction(BaseModel):
    route: str
    quantity: int
    target_partner_or_department: str
    expected_recovery: float
    time_to_cash_days: int

class AgentAnalysisResponse(BaseModel):
    answer: str = Field(..., description="Executive summary addressing user query.")
    evidence: List[str] = Field(..., description="Bullet points referencing validated calculations.")
    route_explanations: List[str] = Field(..., description="Detailed trade-offs for each route.")
    proposed_actions: List[ProposedAction] = Field(..., description="Simulated allocation plan.")
    risks_and_assumptions: List[str] = Field(..., description="Identified risks like overstock or window expiry.")
    requires_human_approval: bool = True
    fallback_used: bool = False
    error: Optional[str] = None