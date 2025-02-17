#!/bin/bash
# clone-airtable-webhook.sh
#
# This script performs the following:
#   1. Clones the contents of the master directory into any additional directories.
#   2. Recursively updates files in each directory, replacing the first occurrence of:
#         const WEBHOOK_URL = "<<SOME TEXT>>";
#      with the corresponding webhook URL.
#   3. Navigates to each directory and runs "block release".
#
# To add a new pair, update the "dir_urls" associative array and add the directory name to "ordered_dirs".

set -euo pipefail

# Base path for all directories
BASE_PATH="/home/ubuntu"

# Mapping of directory names to their corresponding webhook URLs
declare -A dir_urls=(
    ["airtable-webhook-leads"]="https://aikit.app.n8n.cloud/webhook-test/cd4470fb-2c36-4bc2-947f-dc7e23daf715-leads"
    ["airtable-webhook-replies"]="https://aikit.app.n8n.cloud/webhook-test/cd4470fb-2c36-4bc2-947f-dc7e23daf715-replies"
)

# Ordered list of directory names (first is considered master)
ordered_dirs=("airtable-webhook-leads" "airtable-webhook-replies")

# Update files in a directory: replace the first occurrence of the webhook URL line.
update_files() {
    local dir="$1"
    local url="$2"
    echo "XXXUpdating files in ${BASE_PATH}/${dir} with URL: $url"
    # The sed command uses the address range "0,/pattern/" to replace only the first occurrence.
    find "${BASE_PATH}/${dir}" -type f -exec sed -i "0,/^const WEBHOOK_URL = \".*\";/ s/^const WEBHOOK_URL = \".*\";/const WEBHOOK_URL = \"$url\";/" {} \;
}

# Run "block release" in a given directory.
release_block() {
    local dir="$1"
    echo "Running block release in ${BASE_PATH}/${dir}"
    cd "${BASE_PATH}/${dir}" || { echo "Directory ${BASE_PATH}/${dir} not found!"; return 1; }
    block release
}

# Process a directory by updating files and then running "block release".
process_directory() {
    local dir="$1"
    local url="$2"
    update_files "$dir" "$url"
    release_block "$dir"
}

# Clone the contents of the master directory into all subsequent directories.
master_dir="${ordered_dirs[0]}"
for dir in "${ordered_dirs[@]:1}"; do
    echo "Cloning content from ${BASE_PATH}/${master_dir} to ${BASE_PATH}/${dir}"
    rm -rf "${BASE_PATH}/${dir}"
    cp -a "${BASE_PATH}/${master_dir}" "${BASE_PATH}/${dir}"
done

# Process each directory (update files and run block release).
for dir in "${ordered_dirs[@]}"; do
    process_directory "$dir" "${dir_urls[$dir]}"
done

echo "All directories processed successfully."
