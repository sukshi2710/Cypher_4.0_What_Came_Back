from app.services.dataset_service import analyze_project_data
def test_all_return_records_are_analyzed():
    result = analyze_project_data()
    assert result["returns_analyzed"] == 6
def test_recommendation_count_matches_return_count():
    result = analyze_project_data()
    assert len(result["recovery_recommendations"]) == 6
def test_every_recommendation_has_recovery_details():
    result = analyze_project_data()
    for recommendation in result["recovery_recommendations"]:
        assert "return_id" in recommendation
        assert "sku" in recommendation
        assert "recovery" in recommendation
        assert recommendation["recovery"]["requires_human_approval"] is True
def test_supplier_analysis_is_included():
    result = analyze_project_data()
    assert "supplier_analysis" in result
    assert result["supplier_analysis"]["batch_count"] > 0
def test_demo_data_is_identified():
    result = analyze_project_data()
    assert result["data_source"] == "synthetic_demo_datasets"
