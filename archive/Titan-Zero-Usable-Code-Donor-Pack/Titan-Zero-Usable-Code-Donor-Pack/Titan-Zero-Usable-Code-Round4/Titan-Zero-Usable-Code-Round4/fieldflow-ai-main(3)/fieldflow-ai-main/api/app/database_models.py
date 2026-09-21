from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, Index, Integer
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.app.database import Base


class EquipmentRecord(Base):
    __tablename__ = "equipment"

    equipment_id: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
    )
    model: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(100))
    serial_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
    )
    location: Mapped[str] = mapped_column(String(100))
    assigned_dealer: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20))
    engine_hours: Mapped[float] = mapped_column(Float)
    fuel_level: Mapped[float] = mapped_column(Float)
    health_score: Mapped[int] = mapped_column(Integer)
    last_service_date: Mapped[date] = mapped_column(Date)

    service_cases: Mapped[list[ServiceCaseRecord]] = relationship(
        back_populates="equipment",
        cascade="all, delete-orphan",
    )
    automation_events: Mapped[list[AutomationEventRecord]] = relationship(
        back_populates="equipment",
        cascade="all, delete-orphan",
    )


class ServiceCaseRecord(Base):
    __tablename__ = "service_cases"
    __table_args__ = (
        Index(
            "idx_service_cases_status_priority",
            "status",
            "priority",
        ),
    )

    case_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    equipment_id: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("equipment.equipment_id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(
        String(20),
        default="open",
    )
    source: Mapped[str] = mapped_column(
        String(30),
        default="manual",
    )
    assigned_to: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    equipment: Mapped[EquipmentRecord] = relationship(
        back_populates="service_cases",
    )
    automation_events: Mapped[list[AutomationEventRecord]] = relationship(
        back_populates="service_case",
    )


class AutomationEventRecord(Base):
    __tablename__ = "automation_events"
    __table_args__ = (
        Index(
            "idx_automation_events_equipment_created",
            "equipment_id",
            "created_at",
        ),
    )

    event_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    equipment_id: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("equipment.equipment_id", ondelete="CASCADE"),
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(50))
    outcome: Mapped[str] = mapped_column(String(40))
    details: Mapped[str] = mapped_column(Text)
    service_case_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("service_cases.case_id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    equipment: Mapped[EquipmentRecord] = relationship(
        back_populates="automation_events",
    )
    service_case: Mapped[ServiceCaseRecord | None] = relationship(
        back_populates="automation_events",
    )


class AgentInteractionRecord(Base):
    __tablename__ = "agent_interactions"
    __table_args__ = (
        Index(
            "idx_agent_interactions_created",
            "created_at",
        ),
    )

    interaction_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    equipment_id: Mapped[str | None] = mapped_column(
        String(20),
        ForeignKey("equipment.equipment_id", ondelete="SET NULL"),
        nullable=True,
    )
    user_message: Mapped[str] = mapped_column(Text)
    detected_intent: Mapped[str] = mapped_column(String(50))
    confidence: Mapped[float] = mapped_column(Float)
    agent_response: Mapped[str] = mapped_column(Text)
    action_status: Mapped[str] = mapped_column(String(40))
    service_case_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("service_cases.case_id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )