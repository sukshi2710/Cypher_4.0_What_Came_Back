import csv
from pathlib import Path
from typing import Any

from app.services.recovery_engine import calculate_recovery
from app.services.supplier_analysis import analyze_supplier_batches


# Project root:
# E:\AIT\Hackathon\Cypher_4.0_What_Came_Back
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"


def load_csv(filename: str) -> list[dict[str, str]]:
    """Load a CSV file from the project's data directory."""

    file_path = DATA_DIR / filename

    if not file_path.is_file():
        raise FileNotFoundError(
            f"Required dataset not found: {file_path}"
        )

    with file_path.open(
        mode="r",
        encoding="utf-8-sig",
        newline="",
    ) as csv_file:
        return list(csv.DictReader(csv_file))


def load_project_datasets() -> dict[str, list[dict[str, str]]]:
    """Load all datasets required by the recovery platform."""

    filenames = [
        "products.csv",
        "returns.csv",
        "inventory.csv",
        "vendor_terms.csv",
        "refurbishment.csv",
        "liquidation.csv",
    ]

    return {
        filename.removesuffix(".csv"): load_csv(filename)
        for filename in filenames
    }


def analyze_project_data() -> dict[str, Any]:
    """
    Analyze supplier batches and calculate recovery recommendations.

    The output uses the synthetic demonstration datasets supplied
    with the project.
    """

    datasets = load_project_datasets()

    products = {
        row["sku"]: row
        for row in datasets["products"]
    }

    inventory = {
        row["sku"]: row
        for row in datasets["inventory"]
    }

    vendor_terms = {
        row["sku"]: row
        for row in datasets["vendor_terms"]
    }

    refurbishment = {
        row["category"]: row
        for row in datasets["refurbishment"]
    }

    liquidation = {
        (row["category"], row["grade"]): row
        for row in datasets["liquidation"]
    }

    # Supplier batch analysis uses the original return records.
    supplier_analysis = analyze_supplier_batches(
        datasets["returns"]
    )

    recovery_recommendations = []

    for returned in datasets["returns"]:
        sku = returned["sku"]

        if sku not in products:
            raise ValueError(
                f"No product information found for SKU {sku}."
            )

        if sku not in inventory:
            raise ValueError(
                f"No inventory information found for SKU {sku}."
            )

        if sku not in vendor_terms:
            raise ValueError(
                f"No vendor terms found for SKU {sku}."
            )

        product = products[sku]
        stock = inventory[sku]
        terms = vendor_terms[sku]

        category = product["category"]
        grade = returned["grade"]
        quantity = int(returned["quantity"])

        if category not in refurbishment:
            raise ValueError(
                f"No refurbishment rules found for {category}."
            )

        liquidation_rule = liquidation.get((category, grade))

        if liquidation_rule is None:
            raise ValueError(
                f"No liquidation rule for category={category}, "
                f"grade={grade}."
            )

        refurb_rule = refurbishment[category]

        original_cost = float(product["cost_price"])
        selling_price = float(product["selling_price"])
        refurb_cost = float(refurb_rule["cost"])

        # CSV percentages are expressed as 60, 70, etc.
        # Convert them to fractions such as 0.60 and 0.70.
        vendor_credit_rate = float(terms["credit_pct"]) / 100
        refurbishment_rate = (
            float(refurb_rule["resale_pct_of_new"]) / 100
        )
        liquidation_rate = (
            float(liquidation_rule["recovery_pct_of_cost"]) / 100
        )

        vendor_eligible = (
            terms["rtv_allowed"].strip().lower() == "true"
        )

        # The return must also fall inside the vendor's return window.
        return_date = returned["return_date"]
        from datetime import date

        return_age_days = (
            date.today() - date.fromisoformat(return_date)
        ).days

        within_window = (
            vendor_eligible
            and return_age_days >= 0
            and return_age_days <= int(terms["window_days"])
        )

        vendor_eligible_quantity = quantity if within_window else 0

        recovery = calculate_recovery(
            quantity=quantity,
            original_cost=original_cost,
            new_selling_price=selling_price,
            refurbishment_cost=refurb_cost,
            refurbishment_rate=refurbishment_rate,
            vendor_credit_rate=vendor_credit_rate,
            vendor_eligible_quantity=vendor_eligible_quantity,
            liquidation_rate=liquidation_rate,
        )

        recovery_recommendations.append({
            "return_id": returned["return_id"],
            "sku": sku,
            "product_name": product["product_name"],
            "supplier": product["supplier"],
            "supplier_batch": returned["supplier_batch"],
            "reason_code": returned["reason_code"],
            "grade": grade,
            "quantity": quantity,
            "return_age_days": return_age_days,
            "vendor_return_eligible": within_window,
            "new_stock": int(stock["new_stock"]),
            "average_daily_demand": float(
                stock["avg_daily_demand"]
            ),
            "refurbishment_days": int(
                refurb_rule["days_required"]
            ),
            "recovery": recovery,
        })

    return {
        "data_source": "synthetic_demo_datasets",
        "returns_analyzed": len(recovery_recommendations),
        "supplier_analysis": supplier_analysis,
        "recovery_recommendations": recovery_recommendations,
        "requires_human_approval": True,
    }