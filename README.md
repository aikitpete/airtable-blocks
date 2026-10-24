# airtable-blocks

[![CI](https://github.com/aikitpete/airtable-blocks/actions/workflows/ci.yml/badge.svg)](https://github.com/aikitpete/airtable-blocks/actions/workflows/ci.yml)

Custom [Airtable](https://airtable.com) blocks (React) that connect a base to automation tools such as n8n, Make or Zapier.

## airtable-webhook-leads

Sends the records of a table to a webhook, one request per record, so an automation can take over from there: enrich a lead, notify a channel, write to a CRM.

- Pick the **table** and enter the **webhook URL** in the block's own settings. Nothing is hardcoded, so one build serves any base and any workflow.
- **Send records to webhook** POSTs each record as flat JSON and reports how many were sent and how many failed.
- Single-select and multiple-select values are sent as plain names, empty cells as empty strings.

Example request body:

```json
{
  "baseId": "appXXXXXXXXXXXXXX",
  "tableId": "tblXXXXXXXXXXXXXX",
  "recordId": "recXXXXXXXXXXXXXX",
  "Name": "Ada Lovelace",
  "Status": "New",
  "Tags": ["inbound", "dach"]
}
```

### Install

Requires Node 18+ and the [Airtable Blocks CLI](https://www.npmjs.com/package/@airtable/blocks-cli).

```bash
cd airtable-webhook-leads
npm install
npm run lint

# create a custom block in your base (Extensions → Add an extension → Build a custom extension), then:
block init <blockId>/<baseId> airtable-webhook-leads   # or: block set-api-key, block run
block run        # develop against your base
block release    # publish to your base
```

The webhook URL and table are stored in the block's configuration inside Airtable, not in this repository.

### Notes

- The block runs in the browser, so the receiving webhook has to allow cross-origin POST requests (n8n webhook nodes do by default).
- Airtable now calls blocks *extensions*; this project uses the Blocks SDK 1.8 API, which Airtable still supports for existing blocks.

MIT licence.
