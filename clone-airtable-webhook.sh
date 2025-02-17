#!/bin/bash
# clone-airtable-webhook.sh
#
# This script clones a master directory into additional directories,
# updates each directory’s files by replacing the first occurrence of:
#    const WEBHOOK_URL = "<<ANY TEXT>>";
# with a directory-specific webhook URL, creates a .block/remote.json file
# containing the corresponding blockId and baseId, and finally runs "block release".
#
# To add a new set, update the associative arrays below and include the new key in ordered_dirs.

set -euo pipefail

# Base path for all directories.
BASE_PATH="/home/ubuntu/airtable-blocks"

# Mappings for each directory.
declare -A dir_urls=(
    ["airtable-webhook-leads"]="https://aikit.app.n8n.cloud/webhook-test/cd4470fb-2c36-4bc2-947f-dc7e23daf715-leads"
    ["airtable-webhook-replies"]="https://aikit.app.n8n.cloud/webhook-test/cd4470fb-2c36-4bc2-947f-dc7e23daf715-replies"
)

declare -A dir_blockIds=(
    ["airtable-webhook-leads"]="blkNMW6wRbL32MfyE"
    ["airtable-webhook-replies"]="blkHcvgXZERf1Dw2x"
)

declare -A dir_baseIds=(
    ["airtable-webhook-leads"]="appViZLpnoAkfE0gH"
    ["airtable-webhook-replies"]="app0Ysx3agImFTQ3Q"
)

# Ordered list of directories (first is the master directory).
ordered_dirs=("airtable-webhook-leads" "airtable-webhook-replies")

# Replace the first occurrence of the WEBHOOK_URL in files.
update_webhook_url() {
    local dir="$1"
    local url="${dir_urls[$dir]}"
    # Use '#' as the delimiter to avoid conflicts with '/' in the URL.
    find "${BASE_PATH}/${dir}" -type f -exec sed -i "0,/^const WEBHOOK_URL = \".*\";/ s#^const WEBHOOK_URL = \".*\";#const WEBHOOK_URL = \"$url\";#" {} \;
}

# Create (or overwrite) .block/remote.json with the given blockId and baseId.
create_remote_json() {
    local dir="$1"
    local blockId="${dir_blockIds[$dir]}"
    local baseId="${dir_baseIds[$dir]}"
    local target_dir="${BASE_PATH}/${dir}/.block"
    mkdir -p "$target_dir"
    cat > "${target_dir}/remote.json" <<EOF
{
    "blockId": "$blockId",
    "baseId": "$baseId"
}
EOF
}

# Change to the directory and run "block release".
release_block() {
    local dir="$1"
    (cd "${BASE_PATH}/${dir}" && block release)
}

# Process one directory: update URL, create remote.json, run block release, then echo summary.
process_directory() {
    local dir="$1"
    update_webhook_url "$dir"
    create_remote_json "$dir"
    release_block "$dir"
    echo "$dir: WEBHOOK_URL=${dir_urls[$dir]}, blockId=${dir_blockIds[$dir]}, baseId=${dir_baseIds[$dir]}"
}

# Clone the master directory into all subsequent directories.
master_dir="${ordered_dirs[0]}"
for dir in "${ordered_dirs[@]:1}"; do
    rm -rf "${BASE_PATH}/${dir}"
    cp -a "${BASE_PATH}/${master_dir}" "${BASE_PATH}/${dir}"
done

# Process each directory.
for dir in "${ordered_dirs[@]}"; do
    process_directory "$dir"
done

echo "Processing complete."
