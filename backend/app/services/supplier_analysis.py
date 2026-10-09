from collections import defaultdict
from typing import Any
def analyze_supplier_batches(
    returns: list[dict[str, Any]],
    min_returns: int = 1,
) -> dict[str, Any]:
    """Flag potentially problematic supplier batches using return reasons."""
    if min_returns < 1:
        raise ValueError("min_returns must be at least 1.")
    batches = defaultdict(
        lambda: {
            "return_records": 0,
            "total_quantity": 0,
            "defective_quantity": 0,
            "reasons": defaultdict(int),
        }
    )
    for record in returns:
        batch = str(record.get("supplier_batch", "")).strip()
        if not batch:
            continue
        try:
            quantity = int(record.get("quantity", 1))
        except (TypeError, ValueError):
            raise ValueError(f"Invalid quantity in batch {batch}.")
        if quantity < 0:
            raise ValueError(f"Negative quantity in batch {batch}.")
        reason = str(record.get("reason_code", "UNKNOWN")).strip().upper()
        batches[batch]["return_records"] += 1
        batches[batch]["total_quantity"] += quantity
        batches[batch]["reasons"][reason] += quantity
        if reason in {"DEFECTIVE", "NOT_WORKING"}:
            batches[batch]["defective_quantity"] += quantity
    results = []
    for batch, data in batches.items():
        total = data["total_quantity"]
        if total < min_returns:
            continue
        defective = data["defective_quantity"]
        rate = defective / total if total else 0.0
        results.append({
            "supplier_batch": batch,
            "return_records": data["return_records"],
            "total_quantity": total,
            "defective_quantity": defective,
            "defective_rate": round(rate, 4),
            "reasons": dict(data["reasons"]),
            "flagged": rate >= 0.5,
            "requires_human_review": True,
        })
    results.sort(
        key=lambda item: (
            item["flagged"],
            item["defective_rate"],
            item["total_quantity"],
        ),
        reverse=True,
    )
    return {
        "batch_count": len(results),
        "flagged_batch_count": sum(
            item["flagged"] for item in results
        ),
        "batches": results,
        "requires_human_review": True,
    }
