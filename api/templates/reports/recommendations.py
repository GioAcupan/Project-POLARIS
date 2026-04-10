"""Recommendation blocks for POLARIS report templates.

`pick_recommendations(weakest_factor, region)` returns a markdown-formatted
bullet list of 3 hand-picked, actionable recommendations tailored to the
identified weak area of a region's underserved profile.
"""

_SUPPLY_BULLETS = """\
- **Accelerate teacher deployment:** Coordinate with the DepEd Regional Office to prioritise \
cross-regional teacher mobility arrangements for Science and Mathematics specialisations, \
targeting schools with the highest student-to-teacher ratios first.
- **Activate the Substitute Teacher Program:** Engage qualified local university graduates \
under the STP to fill critical classroom gaps while permanent recruitment is processed, \
with a target of reducing the regional ratio by at least 5 points within two quarters.
- **Fast-track scholarship endorsements:** Nominate at least 20 in-service teachers per \
division for government-funded graduate scholarships in high-need specialisations \
(Science, Mathematics, Technology) to build the region's own pipeline."""

_IMPACT_BULLETS = """\
- **Scale STAR Program reach:** Increase STAR Fellowship and CBEP enrolment targets by \
25% for the next academic year, prioritising teachers who have never participated in a \
DepEd-accredited training program within the past three years.
- **Establish school-based coaching clusters:** Form peer-coaching triads in every \
district anchored by the top 10% of NAT-performing schools, spreading evidence-based \
classroom practices laterally without requiring central budget allocation.
- **Commission targeted NAT remediation modules:** Develop region-specific supplementary \
materials for the two lowest-scoring NAT domains and deploy through school INSET days, \
with pre- and post-assessment to track improvement within the same academic year."""

_DEMAND_BULLETS = """\
- **Triage and action the top-10 needs signals:** Convene a regional training needs \
analysis committee to review the highest-frequency demand signals submitted through \
POLARIS-ME and match them to existing programs within 30 days, reducing unaddressed \
demand by at least 40%.
- **Align upcoming LAC sessions to demand hotspots:** Redirect school-level Learning \
Action Cell budgets toward the three most-requested training topics this quarter, \
ensuring at least one LAC session per month addresses a documented regional need.
- **Negotiate a regional training compact:** Work with higher education institutions \
and TESDA providers in the region to reserve cohort seats for DepEd teachers in \
high-demand skills areas, reducing lead time from need identification to training \
delivery to under 60 days."""


def pick_recommendations(weakest_factor: str, region: str) -> str:
    """Return a markdown bullet list of 3 recommendations for the weakest factor.

    Args:
        weakest_factor: One of "supply", "impact", or "demand".
        region: Full region name (used in personalised phrasing if needed).

    Returns:
        A multi-line markdown string with three bullet points.
    """
    mapping = {
        "supply": _SUPPLY_BULLETS,
        "impact": _IMPACT_BULLETS,
        "demand": _DEMAND_BULLETS,
    }
    return mapping.get(weakest_factor, _SUPPLY_BULLETS)
