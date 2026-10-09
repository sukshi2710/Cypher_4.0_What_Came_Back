
def calculate_recovery(
    quantity: int,
    original_cost: float,
    new_selling_price: float,
    refurbishment_cost: float,
    refurbishment_rate: float,
    vendor_credit_rate: float,
    vendor_eligible_quantity: int,
    liquidation_rate: float,
) -> dict:
    """Calculate and compare recovery options for returned products."""

    if quantity <= 0:
        raise ValueError("Quantity must be greater than zero.")

    if min(original_cost, new_selling_price, refurbishment_cost) < 0:
        raise ValueError("Prices and costs cannot be negative.")

    if not 0 <= vendor_eligible_quantity <= quantity:
        raise ValueError("Invalid vendor-eligible quantity.")

    for name, rate in [
        ("refurbishment_rate", refurbishment_rate),
        ("vendor_credit_rate", vendor_credit_rate),
        ("liquidation_rate", liquidation_rate),
    ]:
        if not 0 <= rate <= 1:
            raise ValueError(f"{name} must be between 0 and 1.")

    routes = [
        {
            "route": "refurbish",
            "net_per_unit": round(
                new_selling_price * refurbishment_rate
                - refurbishment_cost, 2
            ),
            "capacity": quantity,
        },
        {
            "route": "vendor_return",
            "net_per_unit": round(
                original_cost * vendor_credit_rate, 2
            ),
            "capacity": vendor_eligible_quantity,
        },
        {
            "route": "liquidate",
            "net_per_unit": round(original_cost * liquidation_rate, 2),
            "capacity": quantity,
        },
    ]

    # Prioritize the route with the highest net recovery per unit.
    routes.sort(key=lambda route: route["net_per_unit"], reverse=True)

    remaining = quantity
    allocations = []
    total_recovery = 0.0

    for route in routes:
        assigned = min(remaining, route["capacity"])

        if assigned == 0:
            continue

        amount = round(assigned * route["net_per_unit"], 2)

        allocations.append({
            "route": route["route"],
            "quantity": assigned,
            "recovery_per_unit": route["net_per_unit"],
            "total_recovery": amount,
        })

        total_recovery += amount
        remaining -= assigned

        if remaining == 0:
            break

    return {
        "total_quantity": quantity,
        "allocated_quantity": quantity - remaining,
        "unallocated_quantity": remaining,
        "total_net_recovery": round(total_recovery, 2),
        "average_recovery_per_unit": round(total_recovery / quantity, 2),
        "allocations": allocations,
        "requires_human_approval": True,
    }
