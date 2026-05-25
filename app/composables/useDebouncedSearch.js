import debounce from "lodash.debounce";

export function useDebouncedSearch(options = {}) {
  const { initialValue = "", delay = 500, onApply } = options;

  const searchInput = ref(initialValue);
  const appliedSearch = ref(normalizeSearch(initialValue));
  let skipNextInputWatch = false;

  function normalizeSearch(value) {
    return value?.toString().trim() || "";
  }

  function applyValue(value) {
    const nextValue = normalizeSearch(value);

    if (appliedSearch.value === nextValue) return false;

    appliedSearch.value = nextValue;
    onApply?.(nextValue);

    return true;
  }

  const debouncedApplySearch = debounce((value) => {
    applyValue(value);
  }, delay);

  watch(searchInput, (value) => {
    if (skipNextInputWatch) {
      skipNextInputWatch = false;
      return;
    }

    debouncedApplySearch(value);
  });

  function applySearchNow() {
    debouncedApplySearch.cancel();

    return applyValue(searchInput.value);
  }

  function resetSearch() {
    debouncedApplySearch.cancel();

    if (searchInput.value !== "") {
      skipNextInputWatch = true;
      searchInput.value = "";
    }

    return applyValue("");
  }

  onBeforeUnmount(() => {
    debouncedApplySearch.cancel();
  });

  return {
    searchInput,
    appliedSearch,
    applySearchNow,
    resetSearch,
  };
}
