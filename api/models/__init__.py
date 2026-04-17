"""POLARIS ORM model package (v3.4).

Import order matters: Base must be imported first so all subclasses register
before any metadata operations are attempted. Models with no FK dependencies
on other ORM classes are imported before models that reference them.
"""

from .base import Base  # noqa: F401 — must be first
from .program import Program, SubjectAreaEnum  # noqa: F401
from .teacher import QualificationLevelEnum, Teacher  # noqa: F401
from .profile_extended import TeacherProfileExtended  # noqa: F401
from .regional_demand_metric import RegionalDemandMetric  # noqa: F401
from .regional_impact_series import RegionalImpactSeries  # noqa: F401
from .regional_score import RegionalScore, TrafficLightEnum  # noqa: F401
from .regional_supply_metric import RegionalSupplyMetric  # noqa: F401
from .training_event import TrainingEvent  # noqa: F401
from .event_registration import EventRegistration, RegistrationStatusEnum  # noqa: F401

__all__ = [
    "Base",
    "EventRegistration",
    "Program",
    "QualificationLevelEnum",
    "RegionalDemandMetric",
    "RegionalImpactSeries",
    "RegionalScore",
    "RegionalSupplyMetric",
    "RegistrationStatusEnum",
    "SubjectAreaEnum",
    "Teacher",
    "TeacherProfileExtended",
    "TrafficLightEnum",
    "TrainingEvent",
]
