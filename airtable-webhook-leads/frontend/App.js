import React from 'react';
import {
    Box,
    Button,
    useBase,
    useRecords,
} from '@airtable/blocks/ui';

const TABLE_NAME = 'Data';
const WEBHOOK_URL = "https://aikit.app.n8n.cloud/webhook-test/cd4470fb-2c36-4bc2-947f-dc7e23daf715-leads";

// Helper function to format cell values.
function formatCellValue(cellValue) {
    if (cellValue === null || cellValue === undefined) {
        return "";
    }
    if (typeof cellValue === "object") {
        if (Array.isArray(cellValue)) {
            // Join array items, showing the "name" property if present.
            return cellValue
                .map(item => (typeof item === "object" && item && 'name' in item ? item.name : String(item)))
                .join(", ");
        } else {
            // For objects, display the "name" property if available.
            return "name" in cellValue ? cellValue.name : JSON.stringify(cellValue);
        }
    }
    return String(cellValue);
}

class RecordsProcessor {
    constructor(records, table, baseId) {
        this.records = records;
        this.table = table;
        this.baseId = baseId;
    }

    getPayload() {
        const records = [this.records[this.records.length-1]];
        const recordsData = records.map(record => {
            const fieldsData = {};
            this.table.fields.forEach(field => {
                fieldsData[field.name] = record.getCellValue(field);
            });
            return { id: record.id, fields: fieldsData };
        });
        return { baseId: this.baseId, tableId: this.table.id, records: recordsData };
    }

    async triggerWebhook() {
        const payload = this.getPayload();
        try {
            const response = await fetch(
                WEBHOOK_URL,
                {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );
            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);
        } catch (error) {
            console.error("Fetch error:", error);
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
                    processor.triggerWebhook();
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
                                    {formatCellValue(record.getCellValue(field))}
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
