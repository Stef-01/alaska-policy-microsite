#!/usr/bin/env python3

from __future__ import annotations

import json
import math
import ssl
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "src" / "data" / "generated" / "alaska-data-pack.json"
FETCH_TIMEOUT_SECONDS = 60
UNVERIFIED_SSL_CONTEXT = ssl._create_unverified_context()

CENSUS_URL = (
    "https://api.census.gov/data/2023/acs/acs5"
    "?get=NAME,B01003_001E&for=county:*&in=state:02"
)
PLACES_URL = "https://data.cdc.gov/resource/i46a-9kgh.json?$limit=200&stateabbr=AK"

REGION_FIPS: dict[str, list[str]] = {
    "anchorage": ["02020"],
    "gulf-coast": ["02063", "02066", "02122", "02150"],
    "interior": ["02068", "02090", "02240", "02290"],
    "mat-su": ["02170"],
    "northern": ["02180", "02185", "02188"],
    "southeast": [
        "02100",
        "02105",
        "02110",
        "02130",
        "02195",
        "02198",
        "02220",
        "02230",
        "02275",
        "02282",
    ],
    "southwest": ["02013", "02016", "02050", "02060", "02070", "02158", "02164"],
}


@dataclass(frozen=True)
class RegionProfile:
    name: str
    current_eye_screening_rate_pct: float
    eligible_primary_care_sites: int
    provider_label: str
    provider_note: str
    provider_score: float
    broadband_label: str
    broadband_note: str
    broadband_score: float


REGION_PROFILES: dict[str, RegionProfile] = {
    "anchorage": RegionProfile(
        name="Anchorage",
        current_eye_screening_rate_pct=61.0,
        eligible_primary_care_sites=24,
        provider_label="Specialty anchor available",
        provider_note=(
            "Anchorage has the strongest specialty depth and referral coordination capacity "
            "in the state, so v1 treats it as the natural reading and scheduling hub."
        ),
        provider_score=86.0,
        broadband_label="Reliable connected workflows",
        broadband_note=(
            "Urban connectivity makes image transfer, AI support, and centralized routing "
            "materially easier than in frontier regions."
        ),
        broadband_score=82.0,
    ),
    "gulf-coast": RegionProfile(
        name="Gulf Coast",
        current_eye_screening_rate_pct=56.0,
        eligible_primary_care_sites=8,
        provider_label="Regional primary care network",
        provider_note=(
            "Primary care coverage is present, but retinal specialty access still depends on "
            "coordinated referral pathways and selective hub support."
        ),
        provider_score=64.0,
        broadband_label="Mostly connected with fragile edges",
        broadband_note=(
            "Core corridors are workable for fundus-first deployment, but outlying facilities "
            "still need staged connectivity support."
        ),
        broadband_score=61.0,
    ),
    "interior": RegionProfile(
        name="Interior",
        current_eye_screening_rate_pct=54.0,
        eligible_primary_care_sites=9,
        provider_label="Regional anchor with sparse spokes",
        provider_note=(
            "The Fairbanks-area delivery system can anchor a rollout, but surrounding communities "
            "still rely on routed referral management."
        ),
        provider_score=66.0,
        broadband_label="Mixed reliability outside core hubs",
        broadband_note=(
            "Connected workflows are feasible in the interior hub, though smaller remote sites "
            "still face transfer and support constraints."
        ),
        broadband_score=56.0,
    ),
    "mat-su": RegionProfile(
        name="Mat-Su",
        current_eye_screening_rate_pct=58.0,
        eligible_primary_care_sites=10,
        provider_label="Growing primary care base",
        provider_note=(
            "A growing clinic footprint supports earlier deployment, while specialty follow-up "
            "still benefits from Anchorage coordination."
        ),
        provider_score=68.0,
        broadband_label="Connected corridor advantages",
        broadband_note=(
            "Road-system connectivity and population concentration support faster implementation "
            "than in frontier regions."
        ),
        broadband_score=69.0,
    ),
    "northern": RegionProfile(
        name="Northern",
        current_eye_screening_rate_pct=43.0,
        eligible_primary_care_sites=7,
        provider_label="Sparse workforce coverage",
        provider_note=(
            "Primary care coverage is thin and specialty referral logistics are difficult, "
            "pushing this region toward infrastructure-first sequencing."
        ),
        provider_score=38.0,
        broadband_label="Fragile remote connectivity",
        broadband_note=(
            "Remote connectivity and image-transfer reliability are variable enough that workflow "
            "support should precede broad scale-out."
        ),
        broadband_score=32.0,
    ),
    "southeast": RegionProfile(
        name="Southeast",
        current_eye_screening_rate_pct=57.0,
        eligible_primary_care_sites=10,
        provider_label="Distributed network with referral dependence",
        provider_note=(
            "A distributed coastal network can support rollout, but consistent referral routing is "
            "still necessary across island and marine geographies."
        ),
        provider_score=62.0,
        broadband_label="Mixed marine and island connectivity",
        broadband_note=(
            "Several communities are workable for connected imaging, but the region still needs "
            "careful workflow design around geography and transport."
        ),
        broadband_score=58.0,
    ),
    "southwest": RegionProfile(
        name="Southwest",
        current_eye_screening_rate_pct=46.0,
        eligible_primary_care_sites=8,
        provider_label="Frontier access constraints",
        provider_note=(
            "Primary care access is constrained across a dispersed frontier geography, so device "
            "deployment must be paired with stronger referral and implementation support."
        ),
        provider_score=41.0,
        broadband_label="Patchy remote connectivity",
        broadband_note=(
            "Connectivity is workable in selected sites, but a region-wide rollout would outrun "
            "the current transfer and support environment."
        ),
        broadband_score=35.0,
    ),
}

SOURCE_NOTES: list[dict[str, str]] = [
    {
        "id": "alaska_health_geographies",
        "name": "Alaska Health Data Geographic Definitions",
        "year": "2026",
        "url": "https://health.alaska.gov/en/education/alaska-health-data-geographic/",
        "scope": "Geography",
        "evidenceTier": "source-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Official Alaska Department of Health public health region definitions used to roll "
            "borough and census-area data into the seven policy regions."
        ),
    },
    {
        "id": "acs_population_2023",
        "name": "ACS 5-Year County Population",
        "year": "2023",
        "url": CENSUS_URL,
        "scope": "Population baseline",
        "evidenceTier": "source-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "County-level ACS population counts used as the public population baseline for each "
            "Alaska public health region."
        ),
    },
    {
        "id": "cdc_places_2025",
        "name": "CDC PLACES County Data",
        "year": "2025",
        "url": "https://data.cdc.gov/resource/i46a-9kgh.json?$limit=200&stateabbr=AK",
        "scope": "Disease baseline",
        "evidenceTier": "source-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "County-level adult prevalence estimates for diabetes and access barriers used to "
            "construct the Alaska regional need baseline."
        ),
    },
    {
        "id": "ada_retinopathy_2026",
        "name": "ADA 2026 Retinopathy Guidance",
        "year": "2026",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12690177/",
        "scope": "Clinical guidance",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Guidance anchor for diabetic retinopathy screening strategy, including the strength "
            "of fundus-first workflows and autonomous AI screening pathways."
        ),
    },
    {
        "id": "la_county_teleretinal",
        "name": "LA County Teleretinal Implementation",
        "year": "2017",
        "url": "https://pubmed.ncbi.nlm.nih.gov/28346590/",
        "scope": "Implementation evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Large-scale public health implementation study used to inform throughput, referral "
            "completion, and wait-time improvement assumptions."
        ),
    },
    {
        "id": "i_site_telemedicine",
        "name": "I-SITE Telemedicine Sustainability Study",
        "year": "2021",
        "url": "https://pubmed.ncbi.nlm.nih.gov/33216697/",
        "scope": "Implementation evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Teleophthalmology implementation evidence used to ground screening uptake and "
            "sustained delivery assumptions."
        ),
    },
    {
        "id": "tele_economics",
        "name": "Telehealth Screening Economic Model",
        "year": "2022",
        "url": "https://pubmed.ncbi.nlm.nih.gov/35073213/",
        "scope": "Economic evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Economic modeling reference used to bound reimbursement, avoided cost, and ROI "
            "assumptions for tele-retinal screening."
        ),
    },
    {
        "id": "topcon_oct_fundus",
        "name": "Primary Care Retinal Disease Detection Study",
        "year": "2022",
        "url": "https://pubmed.ncbi.nlm.nih.gov/37008662/",
        "scope": "Device evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Supports the fundus-first public default while treating OCT as an adjunct or advanced "
            "scenario rather than the main production baseline."
        ),
    },
    {
        "id": "nursing_teleophthalmology",
        "name": "Nursing-Teleophthalmology Integration Study",
        "year": "2025",
        "url": "https://pubmed.ncbi.nlm.nih.gov/40235053/",
        "scope": "Workflow evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Used to support the trained MA or RN staffing model and assumptions about reduced "
            "unnecessary specialist referrals."
        ),
    },
    {
        "id": "cost_analysis",
        "name": "Teleophthalmology Cost Analysis",
        "year": "2020",
        "url": "https://pubmed.ncbi.nlm.nih.gov/32484898/",
        "scope": "Economic evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Billing-code and cost-analysis reference used to keep program economics within a "
            "realistic range for the public ROI model."
        ),
    },
    {
        "id": "primary_care_payback",
        "name": "Primary Care Teleophthalmology Access Evaluation",
        "year": "2022",
        "url": "https://pubmed.ncbi.nlm.nih.gov/36287608/",
        "scope": "Economic evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Primary-care implementation evidence used to calibrate funded value per screen and "
            "practical rollout performance."
        ),
    },
    {
        "id": "blindness_prevention_screening",
        "name": "Prevention of Blindness by Diabetic Retinopathy Screening",
        "year": "1989",
        "url": "https://pubmed.ncbi.nlm.nih.gov/2513049/",
        "scope": "Outcomes evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Classic quantitative screening assessment used here only as a conservative anchor for "
            "the proposition that earlier identification can materially reduce preventable vision loss."
        ),
    },
    {
        "id": "laser_photocoagulation_review",
        "name": "Laser Photocoagulation for Proliferative Diabetic Retinopathy",
        "year": "2014",
        "url": "https://pubmed.ncbi.nlm.nih.gov/25420029/",
        "scope": "Treatment evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Treatment review used to support the idea that moving patients into timely retinal "
            "management can reduce severe visual loss and late-stage rescue burden."
        ),
    },
    {
        "id": "retinopathy_quality_of_life",
        "name": "Impact of Diabetic Retinopathy on Quality of Life",
        "year": "2012",
        "url": "https://pubmed.ncbi.nlm.nih.gov/22537275/",
        "scope": "Quality-of-life evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Quality-of-life study used to justify explicit QALY-style and well-being assumptions "
            "for progressive vision loss and blindness."
        ),
    },
    {
        "id": "economic_burden_vision_loss_us",
        "name": "Annual Economic Burden of Vision Loss in the United States",
        "year": "2022",
        "url": "https://pubmed.ncbi.nlm.nih.gov/34560128/",
        "scope": "Economic evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Used to bound productivity and broader economic burden assumptions tied to severe "
            "vision loss in working-age and older adults."
        ),
    },
    {
        "id": "broader_economic_value_dme",
        "name": "Broader Economic Value of Diabetic Macular Edema Treatment",
        "year": "2023",
        "url": "https://pubmed.ncbi.nlm.nih.gov/37186032/",
        "scope": "Economic evidence",
        "evidenceTier": "literature-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Economic value reference used to keep productivity and late-stage consequence "
            "assumptions tied to the real burden of avoidable retinal disease."
        ),
    },
    {
        "id": "who_vision_fact_sheet",
        "name": "WHO Blindness and Vision Impairment Fact Sheet",
        "year": "2025",
        "url": "https://www.who.int/news-room/fact-sheets/detail/blindness-and-vision-impairment",
        "scope": "Public health burden",
        "evidenceTier": "source-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "World Health Organization framing for the functional, social, and health burden of "
            "avoidable vision impairment and blindness."
        ),
    },
    {
        "id": "fcc_broadband",
        "name": "FCC Broadband Data Collection",
        "year": "2025",
        "url": "https://www.fcc.gov/BroadbandData",
        "scope": "Connectivity context",
        "evidenceTier": "source-backed",
        "lastRefreshDate": "2026-03-12",
        "summary": (
            "Connectivity reference used to justify explicit broadband and cybersecurity cost and "
            "readiness assumptions for rural implementation."
        ),
    },
]


def fetch_json(url: str) -> Any:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "alaska-policy-microsite/0.1",
        },
    )
    with urllib.request.urlopen(
        request,
        timeout=FETCH_TIMEOUT_SECONDS,
        context=UNVERIFIED_SSL_CONTEXT,
    ) as response:
        return json.loads(response.read().decode("utf-8"))


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(value, upper))


def round1(value: float) -> float:
    return round(value, 1)


def parse_float(value: Any) -> float:
    if value in (None, ""):
        return 0.0
    return float(value)


def fetch_census_population() -> dict[str, dict[str, Any]]:
    payload = fetch_json(CENSUS_URL)
    header, *rows = payload
    records: dict[str, dict[str, Any]] = {}

    for row in rows:
        record = dict(zip(header, row))
        fips = f"{record['state']}{record['county']}"
        records[fips] = {
            "name": record["NAME"].replace(", Alaska", ""),
            "population": int(record["B01003_001E"]),
        }

    return records


def fetch_places_rows() -> dict[str, dict[str, Any]]:
    rows = fetch_json(PLACES_URL)
    return {str(row["countyfips"]): row for row in rows}


def weighted_average(
    rows: list[dict[str, Any]],
    value_key: str,
    weight_key: str,
) -> float:
    total_weight = sum(parse_float(row.get(weight_key)) for row in rows)
    if total_weight <= 0:
        return 0.0

    weighted_total = sum(
        parse_float(row.get(value_key)) * parse_float(row.get(weight_key)) for row in rows
    )
    return weighted_total / total_weight


def scale_to_band(values: dict[str, float], lower: float = 18, upper: float = 92) -> dict[str, float]:
    min_value = min(values.values())
    max_value = max(values.values())
    midpoint = (lower + upper) / 2

    if math.isclose(min_value, max_value):
        return {key: midpoint for key in values}

    return {
        key: lower + (value - min_value) * (upper - lower) / (max_value - min_value)
        for key, value in values.items()
    }


def build_region_rows(
    census_population: dict[str, dict[str, Any]],
    places_rows: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    missing_census = sorted(
        fips for fips_list in REGION_FIPS.values() for fips in fips_list if fips not in census_population
    )
    missing_places = sorted(
        fips for fips_list in REGION_FIPS.values() for fips in fips_list if fips not in places_rows
    )

    if missing_census or missing_places:
        raise RuntimeError(
            "Missing source rows for Alaska regions: "
            f"census={missing_census or 'none'} places={missing_places or 'none'}"
        )

    provisional: dict[str, dict[str, Any]] = {}

    for slug, county_fips in REGION_FIPS.items():
        profile = REGION_PROFILES[slug]
        county_census = [census_population[fips] for fips in county_fips]
        county_places = [places_rows[fips] for fips in county_fips]

        population = sum(item["population"] for item in county_census)
        adult_population = round(sum(parse_float(item["totalpop18plus"]) for item in county_places))
        diabetes_prevalence = weighted_average(county_places, "diabetes_crudeprev", "totalpop18plus")
        access_gap = weighted_average(county_places, "access2_crudeprev", "totalpop18plus")
        estimated_adults_with_diabetes = round(adult_population * diabetes_prevalence / 100)
        unmet_screening_share = 100 - profile.current_eye_screening_rate_pct
        referable_dr_prevalence = clamp(
            14.0
            + (diabetes_prevalence - 8.0) * 0.7
            + (unmet_screening_share - 35.0) * 0.08,
            12.5,
            23.5,
        )

        provisional[slug] = {
            "slug": slug,
            "name": profile.name,
            "population": population,
            "adultPopulation": adult_population,
            "diabetesPrevalencePct": diabetes_prevalence,
            "estimatedAdultsWithDiabetes": estimated_adults_with_diabetes,
            "accessGapPct": access_gap,
            "currentEyeScreeningRatePct": profile.current_eye_screening_rate_pct,
            "referableDrPrevalencePct": referable_dr_prevalence,
            "eligiblePrimaryCareSites": profile.eligible_primary_care_sites,
            "provider_score": profile.provider_score,
            "providerContext": {
                "label": profile.provider_label,
                "note": profile.provider_note,
                "evidenceTier": "synthetic",
            },
            "broadband_score": profile.broadband_score,
            "broadbandContext": {
                "label": profile.broadband_label,
                "note": profile.broadband_note,
                "evidenceTier": "synthetic",
            },
            "sourceNoteIds": [
                "alaska_health_geographies",
                "acs_population_2023",
                "cdc_places_2025",
                "ada_retinopathy_2026",
                "la_county_teleretinal",
                "i_site_telemedicine",
                "fcc_broadband",
            ],
            "evidenceMap": {
                "population": "source-backed",
                "adultPopulation": "source-backed",
                "diabetesPrevalencePct": "source-backed",
                "estimatedAdultsWithDiabetes": "source-backed",
                "accessGapPct": "source-backed",
                "currentEyeScreeningRatePct": "literature-backed",
                "referableDrPrevalencePct": "literature-backed",
                "eligiblePrimaryCareSites": "synthetic",
                "severityScore": "synthetic",
                "readinessScore": "synthetic",
                "providerContext": "synthetic",
                "broadbandContext": "synthetic",
            },
        }

    diabetes_scale = scale_to_band(
        {slug: row["diabetesPrevalencePct"] for slug, row in provisional.items()}
    )
    access_scale = scale_to_band(
        {slug: row["accessGapPct"] for slug, row in provisional.items()}
    )
    unmet_scale = scale_to_band(
        {
            slug: 100 - row["currentEyeScreeningRatePct"]
            for slug, row in provisional.items()
        }
    )
    burden_scale = scale_to_band(
        {slug: row["estimatedAdultsWithDiabetes"] for slug, row in provisional.items()}
    )
    site_scale = scale_to_band(
        {slug: row["eligiblePrimaryCareSites"] for slug, row in provisional.items()},
        lower=30,
        upper=100,
    )

    output_rows: list[dict[str, Any]] = []

    for slug in REGION_FIPS:
        row = provisional[slug]
        severity_score = (
            diabetes_scale[slug] * 0.35
            + access_scale[slug] * 0.20
            + unmet_scale[slug] * 0.20
            + burden_scale[slug] * 0.25
        )
        readiness_score = (
            row["provider_score"] * 0.38
            + row["broadband_score"] * 0.32
            + row["currentEyeScreeningRatePct"] * 0.18
            + site_scale[slug] * 0.12
        )

        if slug == "anchorage":
            recommended_pathway = "Statewide coordination hub"
        elif readiness_score >= 56:
            recommended_pathway = "Fast-start"
        else:
            recommended_pathway = "Build-first"

        output_rows.append(
            {
                "slug": row["slug"],
                "name": row["name"],
                "population": row["population"],
                "adultPopulation": row["adultPopulation"],
                "diabetesPrevalencePct": round1(row["diabetesPrevalencePct"]),
                "estimatedAdultsWithDiabetes": row["estimatedAdultsWithDiabetes"],
                "accessGapPct": round1(row["accessGapPct"]),
                "currentEyeScreeningRatePct": round1(row["currentEyeScreeningRatePct"]),
                "referableDrPrevalencePct": round1(row["referableDrPrevalencePct"]),
                "eligiblePrimaryCareSites": row["eligiblePrimaryCareSites"],
                "severityScore": round1(severity_score),
                "readinessScore": round1(readiness_score),
                "recommendedPathway": recommended_pathway,
                "providerContext": row["providerContext"],
                "broadbandContext": row["broadbandContext"],
                "evidenceMap": row["evidenceMap"],
                "sourceNoteIds": row["sourceNoteIds"],
            }
        )

    return output_rows


def main() -> None:
    census_population = fetch_census_population()
    places_rows = fetch_places_rows()
    regions = build_region_rows(census_population, places_rows)
    generated_at = datetime.now(tz=UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generatedAt": generated_at,
        "regions": regions,
        "sourceNotes": SOURCE_NOTES,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)} with {len(regions)} regions.")


if __name__ == "__main__":
    main()
