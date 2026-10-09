import os
import json
import logging
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.models import (
    AgentAnalysisRequest,
    AgentAnalysisResponse,
    ProposedAction,
)


# ============================================================
# LOGGING CONFIGURATION
# ============================================================

logger = logging.getLogger(__name__)


# ============================================================
# ENVIRONMENT CONFIGURATION
# ============================================================

def load_backend_environment() -> None:
    """
    Load the backend .env file independently of the current
    working directory.

    Expected project structure:

        backend/
            .env
            app/
                services/
                    gemini_service.py
    """

    current_file = Path(__file__).resolve()

    # Search the current file's parent directories for .env.
    for directory in current_file.parents:
        env_file = directory / ".env"

        if env_file.is_file():
            load_dotenv(dotenv_path=env_file, override=False)

            logger.info(
                "Environment configuration loaded from: %s",
                env_file.parent,
            )
            return

    # Fallback to the normal dotenv lookup.
    load_dotenv(override=False)

    logger.warning(
        "No .env file was found in the parent directories. "
        "Environment variables will be read from the process."
    )


load_backend_environment()


# ============================================================
# SYSTEM INSTRUCTIONS
# ============================================================

SYSTEM_INSTRUCTION = """
You are the Intelligent Recovery & Defect Agent for
'WHAT CAME BACK', an e-commerce returns recovery platform.

CRITICAL INSTRUCTIONS:

1. Do not calculate, modify, or independently estimate
   financial totals. Explain only the pre-calculated numbers
   supplied in the backend context.

2. Clearly explain trade-offs, including:
   - Time-to-cash versus net recovery value.
   - Vendor return-window expiration dates.
   - New inventory demand cannibalization.
   - Supplier defect patterns.
   - Operational risks and recovery assumptions.

3. Never perform actual inventory, financial, supplier,
   or recovery transactions.

4. All recovery allocations are simulated proposals.

5. Always set requires_human_approval to true.

6. Use only information supported by the supplied context.
   Do not invent supplier data, financial figures, or
   inventory information.

7. If information is missing, explicitly acknowledge it.

8. Return a response matching the provided JSON schema.
"""


# ============================================================
# PYDANTIC COMPATIBILITY HELPERS
# ============================================================

def model_to_dict(model: Any) -> Dict[str, Any]:
    """
    Convert a Pydantic model to a dictionary.

    Supports Pydantic v1 and v2.
    """

    if hasattr(model, "model_dump"):
        return model.model_dump()

    if hasattr(model, "dict"):
        return model.dict()

    if isinstance(model, dict):
        return model

    raise TypeError(
        f"Unsupported model type: {type(model).__name__}"
    )


def validate_analysis_response(
    data: Any,
) -> AgentAnalysisResponse:
    """
    Validate Gemini's response against the application's
    AgentAnalysisResponse model.
    """

    if isinstance(data, AgentAnalysisResponse):
        result = data

    elif isinstance(data, dict):

        if hasattr(AgentAnalysisResponse, "model_validate"):
            result = AgentAnalysisResponse.model_validate(data)
        else:
            result = AgentAnalysisResponse(**data)

    else:
        raise ValueError(
            "Gemini returned an unsupported response type: "
            f"{type(data).__name__}"
        )

    # Recovery actions must always require human approval.
    result.requires_human_approval = True

    # This method is used only for successfully processed
    # Gemini responses, not rule-based fallback responses.
    result.fallback_used = False

    return result


# ============================================================
# GEMINI RECOVERY AGENT
# ============================================================

class GeminiRecoveryAgent:
    """
    Gemini-powered recovery analysis service.

    Responsibilities:
    - Receive validated backend recovery context.
    - Send the context and user question to Gemini.
    - Validate the structured response.
    - Return a safe fallback response if Gemini fails.

    This class does not fetch the original dataset or execute
    real inventory or financial transactions.
    """

    def __init__(self):

        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()

        self.model_name = os.getenv(
            "GEMINI_MODEL",
            "gemini-2.5-flash",
        ).strip()

        self.client = None

        if not self.api_key:

            logger.error(
                "GEMINI_API_KEY is missing. "
                "Gemini requests will use fallback mode."
            )

            return

        try:

            self.client = genai.Client(
                api_key=self.api_key
            )

            logger.info(
                "Gemini client initialized successfully. "
                "Configured model: %s",
                self.model_name,
            )

        except Exception:

            # Do not log the API key or other credentials.
            logger.exception(
                "Failed to initialize the Gemini client."
            )

            self.client = None

    # ========================================================
    # MAIN ANALYSIS METHOD
    # ========================================================

    def analyze_returns(
        self,
        request: AgentAnalysisRequest,
    ) -> AgentAnalysisResponse:
        """
        Analyze return-recovery information using Gemini.

        The backend supplies the calculations. Gemini explains
        the supplied information and proposes recovery actions.
        """

        logger.info(
            "Recovery analysis requested. SKU: %s",
            request.context.sku,
        )

        # ----------------------------------------------------
        # CHECK 1: GEMINI CLIENT
        # ----------------------------------------------------

        if self.client is None:

            logger.warning(
                "Gemini client is unavailable. "
                "Using rule-based fallback."
            )

            return self._generate_fallback_response(
                request,
                reason=(
                    "Gemini client unavailable. "
                    "Check GEMINI_API_KEY and client initialization."
                ),
            )

        # ----------------------------------------------------
        # CHECK 2: PREPARE BACKEND CONTEXT
        # ----------------------------------------------------

        try:

            context_data = model_to_dict(
                request.context
            )

            prompt = f"""
USER QUESTION:
{request.user_query}

VALIDATED BACKEND CALCULATIONS AND CONTEXT:
{json.dumps(context_data, indent=2, default=str)}

INSTRUCTIONS:
1. Explain the supplied recovery information clearly.
2. Do not recalculate or modify financial totals.
3. Compare feasible recovery routes using the supplied values.
4. Explain operational risks and relevant assumptions.
5. Propose simulated recovery actions only.
6. Do not invent missing information.
7. Set requires_human_approval to true.
8. Return a response matching the required JSON schema.
"""

        except Exception as exc:

            logger.exception(
                "Failed to prepare the Gemini request context."
            )

            return self._generate_fallback_response(
                request,
                reason=(
                    "Failed to prepare the analysis context: "
                    f"{type(exc).__name__}: {exc}"
                ),
            )

        # ----------------------------------------------------
        # CHECK 3: SEND REQUEST TO GEMINI
        # ----------------------------------------------------

        try:

            logger.info(
                "Sending recovery analysis request to Gemini. "
                "Model: %s",
                self.model_name,
            )

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=AgentAnalysisResponse,
                    temperature=0.2,
                    max_output_tokens=4096,
                ),
            )

            logger.info(
                "Gemini API request completed."
            )

            # ------------------------------------------------
            # CHECK 4: EXTRACT STRUCTURED RESPONSE
            # ------------------------------------------------

            parsed_data = getattr(
                response,
                "parsed",
                None,
            )

            # Prefer the SDK's parsed response when available.
            if parsed_data is not None:

                if isinstance(
                    parsed_data,
                    AgentAnalysisResponse,
                ):

                    result = parsed_data

                elif isinstance(parsed_data, dict):

                    result = validate_analysis_response(
                        parsed_data
                    )

                else:

                    # Handle SDK versions that expose parsed
                    # structured output in another model type.
                    parsed_data = model_to_dict(
                        parsed_data
                    )

                    result = validate_analysis_response(
                        parsed_data
                    )

            else:

                # Fall back to parsing the returned JSON text.
                response_text = getattr(
                    response,
                    "text",
                    None,
                )

                if not response_text or not response_text.strip():

                    raise ValueError(
                        "Gemini returned neither parsed data "
                        "nor usable response text."
                    )

                raw_text = response_text.strip()

                # Remove optional Markdown code fences.
                if raw_text.startswith("```json"):

                    raw_text = raw_text[len("```json"):]

                elif raw_text.startswith("```"):

                    raw_text = raw_text[3:]

                if raw_text.rstrip().endswith("```"):

                    raw_text = raw_text.rstrip()[:-3]

                raw_text = raw_text.strip()

                parsed_data = json.loads(raw_text)

                result = validate_analysis_response(
                    parsed_data
                )

            # ------------------------------------------------
            # CHECK 5: ENFORCE APPLICATION SAFETY RULES
            # ------------------------------------------------

            result.requires_human_approval = True
            result.fallback_used = False

            # Clear any stale fallback error.
            result.error = None

            logger.info(
                "Recovery analysis completed successfully. "
                "SKU: %s",
                request.context.sku,
            )

            return result

        # ----------------------------------------------------
        # CHECK 6: HANDLE GEMINI AND PARSING ERRORS
        # ----------------------------------------------------

        except APIError as exc:

            status_code = getattr(
                exc,
                "code",
                None,
            )

            logger.exception(
                "Gemini API error. HTTP/API code: %s",
                status_code,
            )

            return self._generate_fallback_response(
                request,
                reason=(
                    f"Gemini API error: {exc}"
                ),
            )

        except Exception as exc:

            logger.exception(
                "Gemini analysis failed during response "
                "processing or validation."
            )

            return self._generate_fallback_response(
                request,
                reason=(
                    f"{type(exc).__name__}: {exc}"
                ),
            )

    # ========================================================
    # RULE-BASED FALLBACK
    # ========================================================

    def _generate_fallback_response(
        self,
        request: AgentAnalysisRequest,
        reason: str,
    ) -> AgentAnalysisResponse:
        """
        Produce a rule-based recovery explanation when Gemini
        is unavailable or its response cannot be processed.

        No external financial or inventory transactions occur.
        """

        logger.warning(
            "Generating fallback recovery response. "
            "Reason: %s",
            reason,
        )

        ctx = request.context

        # ----------------------------------------------------
        # IDENTIFY FEASIBLE ROUTES
        # ----------------------------------------------------

        feasible_routes = [
            route
            for route in ctx.routes
            if route.feasible
        ]

        sorted_routes = sorted(
            feasible_routes,
            key=lambda route: route.total_net_recovery,
            reverse=True,
        )

        proposed_actions = []
        route_explanations = []

        # ----------------------------------------------------
        # EXPLAIN AVAILABLE ROUTES
        # ----------------------------------------------------

        for route in ctx.routes:

            if route.feasible:

                status = "Feasible"

            else:

                status = (
                    f"Infeasible ({route.reason})"
                )

            explanation = (
                f"Route '{route.route}': "
                f"{route.units} units at "
                f"${route.net_recovery_per_unit:.2f}/unit. "
                f"Total net recovery: "
                f"${route.total_net_recovery:.2f}. "
                f"Estimated time to cash: "
                f"{route.time_to_cash_days} days. "
                f"Status: {status}."
            )

            route_explanations.append(
                explanation
            )

        # ----------------------------------------------------
        # PROPOSE THE HIGHEST-NET-RECOVERY FEASIBLE ROUTE
        # ----------------------------------------------------

        if sorted_routes:

            top_route = sorted_routes[0]

            proposed_actions.append(
                ProposedAction(
                    route=top_route.route,
                    quantity=top_route.units,
                    target_partner_or_department=(
                        "Standard destination for "
                        f"{top_route.route}"
                    ),
                    expected_recovery=(
                        top_route.total_net_recovery
                    ),
                    time_to_cash_days=(
                        top_route.time_to_cash_days
                    ),
                )
            )

        else:

            logger.warning(
                "No feasible recovery routes were found "
                "for SKU %s.",
                ctx.sku,
            )

        # ----------------------------------------------------
        # BUILD SUPPORTING EVIDENCE
        # ----------------------------------------------------

        evidence = [
            (
                f"Evaluated {ctx.total_returned_units} "
                f"returned units for SKU {ctx.sku}, "
                f"with condition grade {ctx.condition_grade}."
            ),
            (
                f"Current stock level satisfies "
                f"{ctx.days_of_supply:.1f} days of demand."
            ),
        ]

        if ctx.defect_insight:

            defect = ctx.defect_insight

            evidence.append(
                f"Supplier batch alert ({defect.alert_level}): "
                f"{defect.defect_rate_pct}% of returns are "
                f"linked to the defect "
                f"'{defect.primary_reason}' from supplier "
                f"{defect.supplier}."
            )

        # ----------------------------------------------------
        # BUILD FINAL FALLBACK RESPONSE
        # ----------------------------------------------------

        return AgentAnalysisResponse(
            answer=(
                "Gemini analysis was unavailable. "
                "A rule-based recovery analysis was generated "
                f"for {ctx.total_returned_units} returned "
                f"units of SKU {ctx.sku}. "
                "Review the route explanations and proposed "
                "actions before making any decisions."
            ),
            evidence=evidence,
            route_explanations=route_explanations,
            proposed_actions=proposed_actions,
            risks_and_assumptions=[
                (
                    "Fallback mode selects the feasible route "
                    "with the highest supplied net recovery value."
                ),
                (
                    "Verify vendor deadlines, route eligibility, "
                    "and operational constraints before execution."
                ),
                (
                    "Recovery actions are proposals only and "
                    "require human manager approval."
                ),
            ],
            requires_human_approval=True,
            fallback_used=True,
            error=reason,
        )