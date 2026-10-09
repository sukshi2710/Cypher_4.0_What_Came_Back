import pytest

from app.services.recovery_engine import calculate_recovery


def test_recovery_calculation():
    result = calculate_recovery(
        quantity=40,
        original_cost=1400,
        new_selling_price=2500,
        refurbishment_cost=250,
        refurbishment_rate=0.75,
        vendor_credit_rate=0.60,
        vendor_eligible_quantity=24,
        liquidation_rate=0.35,
    )

    assert result["total_quantity"] == 40
    assert result["allocated_quantity"] == 40
    assert result["total_net_recovery"] == 65000.0
    assert result["average_recovery_per_unit"] == 1625.0
    assert result["requires_human_approval"] is True


def test_zero_quantity_is_rejected():
    with pytest.raises(ValueError):
        calculate_recovery(
            quantity=0,
            original_cost=1400,
            new_selling_price=2500,
            refurbishment_cost=250,
            refurbishment_rate=0.75,
            vendor_credit_rate=0.60,
            vendor_eligible_quantity=0,
            liquidation_rate=0.35,
        )


def test_invalid_vendor_quantity_is_rejected():
    with pytest.raises(ValueError):
        calculate_recovery(
            quantity=40,
            original_cost=1400,
            new_selling_price=2500,
            refurbishment_cost=250,
            refurbishment_rate=0.75,
            vendor_credit_rate=0.60,
            vendor_eligible_quantity=50,
            liquidation_rate=0.35,
        )


def test_invalid_rate_is_rejected():
    with pytest.raises(ValueError):
        calculate_recovery(
            quantity=40,
            original_cost=1400,
            new_selling_price=2500,
            refurbishment_cost=250,
            refurbishment_rate=1.5,
            vendor_credit_rate=0.60,
            vendor_eligible_quantity=24,
            liquidation_rate=0.35,
        )


def test_negative_cost_is_rejected():
    with pytest.raises(ValueError):
        calculate_recovery(
            quantity=10,
            original_cost=-100,
            new_selling_price=500,
            refurbishment_cost=50,
            refurbishment_rate=0.75,
            vendor_credit_rate=0.60,
            vendor_eligible_quantity=5,
            liquidation_rate=0.35,
        )


def test_zero_vendor_eligibility():
    result = calculate_recovery(
        quantity=10,
        original_cost=1000,
        new_selling_price=1500,
        refurbishment_cost=200,
        refurbishment_rate=0.70,
        vendor_credit_rate=0.60,
        vendor_eligible_quantity=0,
        liquidation_rate=0.30,
    )

    assert result["allocated_quantity"] == 10

    assert all(
        allocation["route"] != "vendor_return"
        for allocation in result["allocations"]
    )


def test_allocated_quantity_never_exceeds_total():
    result = calculate_recovery(
        quantity=20,
        original_cost=1000,
        new_selling_price=1500,
        refurbishment_cost=200,
        refurbishment_rate=0.70,
        vendor_credit_rate=0.60,
        vendor_eligible_quantity=8,
        liquidation_rate=0.30,
    )

    total_allocated = sum(
        allocation["quantity"]
        for allocation in result["allocations"]
    )

    assert total_allocated == 20
    assert result["allocated_quantity"] == 20
    assert result["unallocated_quantity"] == 0