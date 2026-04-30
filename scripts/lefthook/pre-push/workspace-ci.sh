#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/../../.." && pwd)

run_backend=0
run_frontend=0
run_both_on_uncertain=0

backend_patterns=(
    "backend/"
    "docker-compose.yml"
    "backend/railway.toml"
    "backend/.dockerignore"
    ".github/workflows/backend-ci.yml"
)

frontend_patterns=(
    "frontend/"
    ".github/workflows/frontend-ci.yml"
)

shared_patterns=(
    "lefthook.yml"
    ".github/workflows/"
    "backend/scripts/ci/"
    "frontend/scripts/ci/"
    "scripts/lefthook/"
    "scripts/git-hooks/"
)

is_zero_sha() {
    local sha="$1"
    [[ "$sha" =~ ^0+$ ]]
}

mark_targets_for_file() {
    local file="$1"

    for pattern in "${shared_patterns[@]}"; do
        if [[ "$file" == "$pattern"* ]]; then
            run_backend=1
            run_frontend=1
            return
        fi
    done

    for pattern in "${backend_patterns[@]}"; do
        if [[ "$file" == "$pattern"* ]]; then
            run_backend=1
            return
        fi
    done

    for pattern in "${frontend_patterns[@]}"; do
        if [[ "$file" == "$pattern"* ]]; then
            run_frontend=1
            return
        fi
    done
}

collect_files_from_upstream() {
    if git -C "$repo_root" rev-parse --verify '@{upstream}' >/dev/null 2>&1; then
        git -C "$repo_root" diff --name-only '@{upstream}...HEAD'
        return 0
    fi

    return 1
}

collect_files_from_push_refs() {
    local refs=()

    if [[ -t 0 ]]; then
        return 1
    fi

    mapfile -t refs || true
    if [[ "${#refs[@]}" -eq 0 ]]; then
        return 1
    fi

    local line local_ref local_sha remote_ref remote_sha
    local collected_any=0

    for line in "${refs[@]}"; do
        [[ -z "$line" ]] && continue

        read -r local_ref local_sha remote_ref remote_sha <<<"$line"

        if is_zero_sha "$local_sha"; then
            continue
        fi

        if is_zero_sha "$remote_sha"; then
            run_both_on_uncertain=1
            return 1
        fi

        git -C "$repo_root" diff --name-only "$remote_sha..$local_sha"
        collected_any=1
    done

    [[ "$collected_any" -eq 1 ]]
}

classify_changed_files() {
    local file
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        mark_targets_for_file "$file"
    done
}

run_selected_checks() {
    if [[ "$run_backend" -eq 0 && "$run_frontend" -eq 0 ]]; then
        echo "[pre-push] No backend or frontend changes detected. Skipping local CI checks."
        return 0
    fi

    echo "[pre-push] Selected checks:"
    echo "[pre-push] backend=$run_backend frontend=$run_frontend"

    if [[ "${MORATA_PRE_PUSH_DRY_RUN:-0}" == "1" ]]; then
        return 0
    fi

    if [[ "$run_backend" -eq 1 ]]; then
        bash "$repo_root/backend/scripts/ci/run-backend-ci-checks.sh"
    fi

    if [[ "$run_frontend" -eq 1 ]]; then
        bash "$repo_root/frontend/scripts/ci/run-frontend-ci-checks.sh"
    fi
}

main() {
    local changed_files

    if [[ -n "${MORATA_CHANGED_FILES:-}" ]]; then
        changed_files="${MORATA_CHANGED_FILES}"
    elif changed_files="$(collect_files_from_push_refs)"; then
        :
    elif changed_files="$(collect_files_from_upstream)"; then
        :
    else
        run_both_on_uncertain=1
        changed_files=""
    fi

    if [[ "$run_both_on_uncertain" -eq 1 ]]; then
        echo "[pre-push] Unable to determine an exact push diff safely. Running both backend and frontend checks."
        run_backend=1
        run_frontend=1
    else
        classify_changed_files <<<"$changed_files"
    fi

    run_selected_checks
}

main "$@"
