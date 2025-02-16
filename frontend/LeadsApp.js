import React from 'react';
import {
    Box,
    Button,
    useBase,
    useRecords,
} from '@airtable/blocks/ui';

const TABLE_NAME = 'Data';

class RecordsProcessor {
    constructor(records, table) {
        this.records = records;
        this.table = table;
    }

    getPayload() {
        // Construct a payload with all records and all their field values.
        const recordsData = this.records.map(record => {
            const fieldsData = {};
            this.table.fields.forEach(field => {
                fieldsData[field.name] = record.getCellValue(field);
            });
            return { id: record.id, fields: fieldsData };
        });
        return { records: recordsData };
    }

    async triggerWebhook() {
        const payload = this.getPayload();
        try {
            const response = await fetch(
                "https://aikit.app.n8n.cloud/webhook-test/0ea6274f-c425-4ad0-9ac2-4d7059d68028",
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

    // Optimized cell style: prevent wrapping and use ellipsis to save vertical space.
    const cellStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '250px', // Adjust as needed to allow dynamic width.
        padding: '4px'
    };

    return (
        <Box padding={3} style={{ height: "100%", overflow: "auto" }}>
            <Button
                onClick={() => {
                    const processor = new RecordsProcessor(records, table);
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
                                    {record.getCellValue(field) !== null
                                        ? record.getCellValue(field).toString()
                                        : "(empty)"}
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
