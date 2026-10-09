import pytest
from app.services.supplier_analysis import analyze_supplier_batches
def test_detects_high_defect_batch():
    returns = [
        {"supplier_batch": "BATCH-01", "reason_code": "DEFECTIVE", "quantity": 8},
        {"supplier_batch": "BATCH-01", "reason_code": "NOT_WORKING", "quantity": 2},
    ]
    result = analyze_supplier_batches(returns)
    assert result["batch_count"] == 1
    assert result["flagged_batch_count"] == 1
    assert result["batches"][0]["flagged"] is True
    assert result["batches"][0]["defective_rate"] == 1.0
def test_does_not_flag_non_defective_batch():
    returns = [
        {"supplier_batch": "BATCH-02", "reason_code": "WRONG_ITEM", "quantity": 10}
    ]
    result = analyze_supplier_batches(returns)
    assert result["flagged_batch_count"] == 0
    assert result["batches"][0]["flagged"] is False
def test_groups_multiple_records_for_same_batch():
    returns = [
        {"supplier_batch": "BATCH-03", "reason_code": "DEFECTIVE", "quantity": 4},
        {"supplier_batch": "BATCH-03", "reason_code": "WRONG_ITEM", "quantity": 6},
    ]
    result = analyze_supplier_batches(returns)
    batch = result["batches"][0]
    assert batch["return_records"] == 2
    assert batch["total_quantity"] == 10
    assert batch["defective_quantity"] == 4
    assert batch["defective_rate"] == 0.4
def test_rejects_invalid_minimum_returns():
    with pytest.raises(ValueError):
        analyze_supplier_batches([], min_returns=0)
def test_rejects_negative_quantity():
    returns = [
        {"supplier_batch": "BATCH-04", "reason_code": "DEFECTIVE", "quantity": -5}
    ]
    with pytest.raises(ValueError):
        analyze_supplier_batches(returns)
