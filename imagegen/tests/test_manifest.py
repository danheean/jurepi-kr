from imagegen.manifest import find_entry, merge_entry, slugify_id


def test_merge_appends_new_entry_without_mutating_input():
    entries = [{"id": "a", "v": 1}]
    out = merge_entry(entries, {"id": "b", "v": 2})
    assert [e["id"] for e in out] == ["a", "b"]
    assert entries == [{"id": "a", "v": 1}]  # original untouched


def test_merge_replaces_entry_with_same_id():
    entries = [{"id": "a", "v": 1}, {"id": "b", "v": 2}]
    out = merge_entry(entries, {"id": "a", "v": 99})
    assert find_entry(out, "a") == {"id": "a", "v": 99}
    assert len(out) == 2  # replaced, not duplicated


def test_find_entry_missing_returns_none():
    assert find_entry([{"id": "a"}], "z") is None


def test_slugify_id():
    assert slugify_id("Howto Cover 2!") == "howto-cover-2"
    assert slugify_id("  spaced  out  ") == "spaced-out"
    assert slugify_id("") == "image"
    assert slugify_id("---") == "image"
