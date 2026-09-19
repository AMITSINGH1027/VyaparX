from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_business_id
from app.ai.insights_engine import AIInsightsEngine
from app.ai.assistant_engine import AIAssistantEngine

router = APIRouter(prefix="/ai", tags=["AI & Insights"])

class AssistantQuery(BaseModel):
    query: str

@router.get("/insights")
def get_actionable_insights(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    engine = AIInsightsEngine(business_id)
    return engine.generate_actionable_insights(db)

@router.get("/summary")
def get_dashboard_summary(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    engine = AIInsightsEngine(business_id)
    return engine.generate_dashboard_summary_text(db)

@router.post("/assistant")
def chat_with_business_assistant(
    query_in: AssistantQuery,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    engine = AIAssistantEngine(business_id)
    return engine.process_query(db, query_in.query)
