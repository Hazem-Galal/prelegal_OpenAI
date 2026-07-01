from __future__ import annotations

from app.fields import build_extraction_model, extract_field_variables, fields_to_labeled_dict


def test_extracts_link_suffixed_spans_only():
    markdown = (
        '<span class="header_2" id="1">Service</span> '
        '<span class="coverpage_link">Customer</span> and '
        '<span class="keyterms_link">Provider</span>'
    )

    assert extract_field_variables(markdown) == ["Customer", "Provider"]


def test_dedupes_repeated_variables_preserving_first_seen_order():
    markdown = (
        '<span class="coverpage_link">Customer</span> '
        '<span class="coverpage_link">Provider</span> '
        '<span class="coverpage_link">Customer</span>'
    )

    assert extract_field_variables(markdown) == ["Customer", "Provider"]


def test_matches_any_link_suffixed_class_regardless_of_attribute_order():
    markdown = (
        '<span class="orderform_link" id="1.1">Subscription Period</span> '
        '<span id="5.5.a" class="businessterms_link">Renewal Term</span>'
    )

    assert extract_field_variables(markdown) == ["Subscription Period", "Renewal Term"]


def test_ignores_spans_with_no_link_suffix():
    markdown = '<span id="13.2">no class here</span> <span class="orderform_link">Term</span>'

    assert extract_field_variables(markdown) == ["Term"]


def test_build_extraction_model_creates_optional_string_fields():
    model, slug_to_label = build_extraction_model("pilot-agreement", ["Customer", "Effective Date"])

    instance = model()
    assert instance.model_dump() == {slug: None for slug in slug_to_label}
    assert set(slug_to_label.values()) == {"Customer", "Effective Date"}


def test_build_extraction_model_handles_apostrophes_and_collisions():
    model, slug_to_label = build_extraction_model("csa", ["Customer's", "Customer's "])

    # Both labels slugify to the same base; the second must get a unique suffix.
    assert len(slug_to_label) == 2
    assert len(set(slug_to_label.keys())) == 2


def test_fields_to_labeled_dict_maps_back_to_original_variable_text():
    model, slug_to_label = build_extraction_model("pilot-agreement", ["Customer", "Effective Date"])
    instance = model(**{slug: "Acme Inc" for slug in slug_to_label if slug_to_label[slug] == "Customer"})

    labeled = fields_to_labeled_dict(instance, slug_to_label)

    assert labeled["Customer"] == "Acme Inc"
    assert labeled["Effective Date"] is None
