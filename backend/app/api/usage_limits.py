from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List, Optional
from pydantic import BaseModel
from app.auth.auth_bearer import JWTBearer
from app.auth.auth_handler import get_user_id_from_token
from app.db.database import get_db
from app.models.user import UserRole
from app.utils.role_decorators import role_required
import uuid

router = APIRouter(
    prefix="/usage",
    tags=["usage"],
    dependencies=[Depends(JWTBearer())],
)


class FeatureUsage(BaseModel):
    feature_type: str
    current_count: int
    limit_count: int
    usage_percentage: float


class UsageResponse(BaseModel):
    user_id: str
    subscription_plan: str
    subscription_status: str
    trial_days_left: Optional[int]
    features: Dict[str, FeatureUsage]


class CheckLimitRequest(BaseModel):
    feature_type: str


class CheckLimitResponse(BaseModel):
    feature_type: str
    can_use: bool
    current_count: int
    limit_count: int
    usage_percentage: float


@router.get("/", response_model=UsageResponse)
async def get_usage_limits(db=Depends(get_db), token=Depends(JWTBearer())):
    """Get the current usage limits for the authenticated user"""
    user_id = get_user_id_from_token(token)
    
    # Get user subscription details
    user_query = """
    SELECT id, subscription_plan, subscription_status, trial_days_left 
    FROM users 
    WHERE id = $1
    """
    user = await db.fetch_one(user_query, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get feature usage for current period
    usage_query = """
    SELECT 
        feature_type, 
        current_count, 
        limit_count,
        CASE 
            WHEN limit_count = 0 THEN 0
            ELSE ROUND((current_count::numeric / limit_count::numeric) * 100, 2) 
        END AS usage_percentage
    FROM 
        feature_usage
    WHERE 
        user_id = $1 AND
        period_start <= CURRENT_TIMESTAMP AND
        period_end > CURRENT_TIMESTAMP
    """
    
    usage_records = await db.fetch_all(usage_query, user_id)
    
    # Convert to dictionary with feature_type as key
    features = {}
    for record in usage_records:
        features[record["feature_type"]] = FeatureUsage(
            feature_type=record["feature_type"],
            current_count=record["current_count"],
            limit_count=record["limit_count"],
            usage_percentage=record["usage_percentage"]
        )
    
    # Ensure all feature types are included
    feature_types = ["invoices", "expenses", "sales", "products"]
    for feature_type in feature_types:
        if feature_type not in features:
            # Get the limit for this feature and plan
            limit_query = """
            SELECT limit_count
            FROM subscription_plan_limits
            WHERE plan_name = $1
            AND feature_type = $2
            AND (
                CASE
                    WHEN $1 = 'weekly' OR $1 = 'silver_weekly' THEN period_type = 'weekly'
                    WHEN $1 = 'yearly' OR $1 = 'silver_yearly' THEN period_type = 'yearly'
                    ELSE period_type = 'monthly'
                END
            )
            """
            
            limit_record = await db.fetch_one(
                limit_query, 
                user["subscription_plan"] or "free", 
                feature_type
            )
            
            limit_count = 999999  # Default high limit
            if limit_record:
                limit_count = limit_record["limit_count"]
            elif user["subscription_plan"] == "free" or not user["subscription_plan"]:
                # Default limits for free plan
                if feature_type == "invoices":
                    limit_count = 5
                elif feature_type == "expenses":
                    limit_count = 20
                elif feature_type == "sales":
                    limit_count = 50
                elif feature_type == "products":
                    limit_count = 20
            
            features[feature_type] = FeatureUsage(
                feature_type=feature_type,
                current_count=0,
                limit_count=limit_count,
                usage_percentage=0.0
            )
    
    return UsageResponse(
        user_id=str(user["id"]),
        subscription_plan=user["subscription_plan"] or "free",
        subscription_status=user["subscription_status"] or "inactive",
        trial_days_left=user["trial_days_left"],
        features=features
    )


@router.post("/check", response_model=CheckLimitResponse)
async def check_feature_limit(request: CheckLimitRequest, db=Depends(get_db), token=Depends(JWTBearer())):
    """Check if a user can use a specific feature based on their current usage"""
    user_id = get_user_id_from_token(token)
    feature_type = request.feature_type
    
    # Validate feature type
    if feature_type not in ["invoices", "expenses", "sales", "products"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid feature type"
        )
    
    # Check if user has reached their limit
    check_query = """
    SELECT check_usage_limit($1, $2) as limit_reached
    """
    
    result = await db.fetch_one(check_query, user_id, feature_type)
    limit_reached = result["limit_reached"] if result else False
    
    # Get current usage details
    usage_query = """
    SELECT 
        current_count, 
        limit_count,
        CASE 
            WHEN limit_count = 0 THEN 0
            ELSE ROUND((current_count::numeric / limit_count::numeric) * 100, 2) 
        END AS usage_percentage
    FROM 
        feature_usage
    WHERE 
        user_id = $1 AND
        feature_type = $2 AND
        period_start <= CURRENT_TIMESTAMP AND
        period_end > CURRENT_TIMESTAMP
    """
    
    usage = await db.fetch_one(usage_query, user_id, feature_type)
    
    if not usage:
        # Get the limit for this feature and plan
        user_query = "SELECT subscription_plan FROM users WHERE id = $1"
        user = await db.fetch_one(user_query, user_id)
        subscription_plan = user["subscription_plan"] if user else "free"
        
        limit_query = """
        SELECT limit_count
        FROM subscription_plan_limits
        WHERE plan_name = $1
        AND feature_type = $2
        AND (
            CASE
                WHEN $1 = 'weekly' OR $1 = 'silver_weekly' THEN period_type = 'weekly'
                WHEN $1 = 'yearly' OR $1 = 'silver_yearly' THEN period_type = 'yearly'
                ELSE period_type = 'monthly'
            END
        )
        """
        
        limit_record = await db.fetch_one(limit_query, subscription_plan, feature_type)
        
        limit_count = 999999  # Default high limit
        if limit_record:
            limit_count = limit_record["limit_count"]
        elif subscription_plan == "free" or not subscription_plan:
            # Default limits for free plan
            if feature_type == "invoices":
                limit_count = 5
            elif feature_type == "expenses":
                limit_count = 20
            elif feature_type == "sales":
                limit_count = 50
            elif feature_type == "products":
                limit_count = 20
        
        return CheckLimitResponse(
            feature_type=feature_type,
            can_use=True,  # No usage yet, so can use
            current_count=0,
            limit_count=limit_count,
            usage_percentage=0.0
        )
    
    return CheckLimitResponse(
        feature_type=feature_type,
        can_use=not limit_reached,
        current_count=usage["current_count"],
        limit_count=usage["limit_count"],
        usage_percentage=usage["usage_percentage"]
    )


@router.post("/increment")
@role_required([UserRole.OWNER, UserRole.ADMIN])
async def increment_usage(request: CheckLimitRequest, db=Depends(get_db), token=Depends(JWTBearer())):
    """Manually increment usage for a specific feature (admin/owner only)"""
    user_id = get_user_id_from_token(token)
    feature_type = request.feature_type
    
    # Validate feature type
    if feature_type not in ["invoices", "expenses", "sales", "products"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid feature type"
        )
    
    # Increment usage counter
    increment_query = """
    SELECT increment_usage_counter($1, $2) as success
    """
    
    result = await db.fetch_one(increment_query, user_id, feature_type)
    success = result["success"] if result else False
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to increment usage counter"
        )
    
    return {"status": "success", "message": f"{feature_type} usage counter incremented"}