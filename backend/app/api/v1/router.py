from fastapi import APIRouter

from app.api.v1.health.router import router as health_router
from app.api.v1.me.router import router as me_router
from app.api.v1.movements.router import router as movements_router
from app.api.v1.sports.router import router as sports_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(me_router)
api_router.include_router(sports_router)
api_router.include_router(movements_router)
