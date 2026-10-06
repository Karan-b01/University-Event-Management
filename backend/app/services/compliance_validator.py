from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.proposal import EventProposal
from app.models.resource import Venue, Resource
from app.models.approval import RiskAssessment


class ComplianceValidatorService:
    """
    Automated pre-screening service executing regulatory, safety, and logistical compliance checks.
    Evaluates EventProposal data without crashing or rejecting, generating actionable RiskAssessment insights.
    """

    @staticmethod
    def evaluate(db: Session, proposal: EventProposal) -> Dict[str, Any]:
        """
        Runs programmatic pre-screening checks:
        1. Venue Capacity vs Expected Participants check.
        2. Overnight / Extended Schedule security evaluation.
        3. High-density crowd safety (>400 participants) evaluation.
        
        Returns a dictionary with:
        - risk_score (0 - 100)
        - is_high_risk (bool)
        - flag_details (List[Dict[str, str]])
        """
        flags: List[Dict[str, str]] = []
        risk_score = 10  # Base standard review score
        is_high_risk = False

        details = proposal.event_details
        schedule = proposal.schedule

        # 1. Venue Capacity Check
        if details and details.expected_participants and schedule and schedule.venue_preference:
            venue = (
                db.query(Venue)
                .filter(Venue.name.ilike(f"%{schedule.venue_preference.strip()}%"))
                .first()
            )
            if not venue:
                # Also check general Resource table if polymorphic filter misses
                venue = (
                    db.query(Resource)
                    .filter(Resource.name.ilike(f"%{schedule.venue_preference.strip()}%"))
                    .first()
                )

            if venue and venue.capacity:
                if details.expected_participants > venue.capacity:
                    is_high_risk = True
                    risk_score += 45
                    flags.append({
                        "category": "Venue Capacity Violation",
                        "severity": "HIGH",
                        "warning": (
                            f"Expected audience of {details.expected_participants} exceeds "
                            f"'{venue.name}' sanctioned capacity of {venue.capacity}."
                        ),
                        "suggestion": (
                            f"Suggest moving event to Open Grounds / Stadium or reducing participant cap to {venue.capacity}."
                        )
                    })

        # 2. Overnight / Extended Event Duration Check
        if schedule and schedule.start_date and schedule.end_date:
            duration_hours = (schedule.end_date - schedule.start_date).total_seconds() / 3600.0
            is_overnight = (
                schedule.start_date.date() != schedule.end_date.date() 
                or schedule.end_date.hour >= 22 
                or schedule.start_date.hour < 6
            )
            if duration_hours > 12 or is_overnight:
                is_high_risk = True
                risk_score += 25
                flags.append({
                    "category": "Overnight / Extended Schedule Protocol",
                    "severity": "MEDIUM",
                    "warning": (
                        f"Event duration ({duration_hours:.1f} hours) extends overnight or past 22:00."
                    ),
                    "suggestion": (
                        "Mandatory addition of Campus Security Officer and Late-Night Transportation in dynamic workflow routing."
                    )
                })

        # 3. High-Density Crowd Safety (> 400 Participants)
        if details and details.expected_participants and details.expected_participants >= 400:
            is_high_risk = True
            risk_score += 20
            flags.append({
                "category": "Mass Gathering Safety Standard",
                "severity": "MEDIUM",
                "warning": (
                    f"Mass gathering of {details.expected_participants} participants triggers university crowd management protocols."
                ),
                "suggestion": (
                    "Deploy designated paramedic station and arrange fire extinguisher inspections."
                )
            })

        # Cap risk score at 100
        risk_score = min(risk_score, 100)

        return {
            "risk_score": risk_score,
            "is_high_risk": is_high_risk,
            "flag_details": flags
        }

