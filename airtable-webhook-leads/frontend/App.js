import React from 'react';
import {
    Box,
    Button,
    useBase,
    useRecords,
} from '@airtable/blocks/ui';

const TABLE_NAME = 'Data';
const WEBHOOK_URL = "https://aikit.app.n8n.cloud/webhook-test/cd4470fb-2c36-4bc2-947f-dc7e23daf715-leads";

// For a given cell value, return a string for single-select fields or an array of strings for multiple-select fields.
function processFieldValue(cellValue) {
    if (cellValue === null || cellValue === undefined) {
        return "";
    }
    if (typeof cellValue === "object") {
        if (Array.isArray(cellValue)) {
            // Multiple choice: return an array of the "name" properties.
            return cellValue.map(item =>
                item && typeof item === "object" && 'name' in item ? item.name : item
            );
        } else {
            // Single choice: return the "name" property.
            return cellValue && typeof cellValue === "object" && 'name' in cellValue ? cellValue.name : cellValue;
        }
    }
    return cellValue;
}

class RecordsProcessor {
    constructor(records, table, baseId) {
        this.records = records;
        this.table = table;
        this.baseId = baseId;
    }

    // Build a flat payload for a single record.
    buildPayloadForRecord(record) {
        let payload = {
            baseId: this.baseId,
            tableId: this.table.id,
            recordId: record.id,
        };
        this.table.fields.forEach(field => {
            payload[field.name] = processFieldValue(record.getCellValue(field));
        });
        return payload;
    }

    // Iterate over each record and send it individually.
    async triggerWebhookRowByRow() {
        for (const record of this.records) {
            const payload = this.buildPayloadForRecord(record);
            try {
                const response = await fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
                console.log(`Record ${record.id} - Response status:`, response.status);
                const data = await response.json();
                console.log(`Record ${record.id} - Response data:`, data);
            } catch (error) {
                console.error(`Record ${record.id} - Fetch error:`, error);
            }
        }
    }
}

function UpdateRecordsApp() {
    const base = useBase();
    const table = base.getTableByName(TABLE_NAME);
    const records = useRecords(table);

    const cellStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '250px',
        padding: '4px'
    };

    return (
        <Box padding={3} style={{ height: "100%", overflow: "auto" }}>
            <Button
                onClick={() => {
                    const processor = new RecordsProcessor(records, table, base.id);
                    processor.triggerWebhookRowByRow();
                }}
            >
                Trigger Webhook
            </Button>
            <table
                border="1"
                cellPadding="5"
                style={{
                    marginTop: "20px",
                    borderCollapse: "collapse",
                    width: "100%"
                }}
            >
                <thead>
                    <tr>
                        {table.fields.map(field => (
                            <th key={field.id} style={cellStyle}>
                                {field.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {records.map(record => (
                        <tr key={record.id}>
                            {table.fields.map(field => (
                                <td key={field.id} style={cellStyle}>
                                    {processFieldValue(record.getCellValue(field))}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </Box>
    );
}

export default UpdateRecordsApp;
