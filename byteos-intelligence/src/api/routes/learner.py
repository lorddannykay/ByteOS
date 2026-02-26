"""
ByteOS Intelligence — Learner Profile Routes
Handles Digital Learner Twin updates and Next Best Action computation.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    user_id: str
    session_events: list[dict]  # learning_events from the session


class ProfileUpdateResponse(BaseModel):
    modality_scores_updated: dict
    engagement_score: float
    streak_days: int


class NextActionRequest(BaseModel):
    user_id: str
    current_enrollment_ids: list[str]


class NextActionResponse(BaseModel):
    action_type: str   # 'continue_course' | 'start_new' | 'try_modality' | 'review_skill'
    target_id: str
    reason: str
    confidence: float


@router.post("/profile", response_model=ProfileUpdateResponse)
async def update_learner_profile(request: ProfileUpdateRequest):
    """
    Processes session events and updates the Digital Learner Twin.
    Called at end of each learning session from byteos-learn.
    Updates: modality_scores, engagement_score, streak_days in Supabase.
    """
    # TODO: Implement adaptive scoring algorithm
    # 1. Parse session_events
    # 2. Compute modality engagement scores (time, completion, replay rates)
    # 3. Update learner_profiles in Supabase
    # 4. Trigger skill gap analysis if quiz events present

    return ProfileUpdateResponse(
        modality_scores_updated={},
        engagement_score=0.5,
        streak_days=1,
    )


@router.post("/next-action", response_model=NextActionResponse)
async def compute_next_action(request: NextActionRequest):
    """
    Computes the learner's Next Best Action.
    Reads learner_profiles, enrollments, skill_gaps from Supabase.
    """
    # TODO: Implement Next Best Action algorithm
    return NextActionResponse(
        action_type="continue_course",
        target_id="",
        reason="You're making great progress — keep going!",
        confidence=0.8,
    )
