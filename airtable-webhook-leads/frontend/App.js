import React, {useState} from 'react';
import {
    Box,
    Button,
    FormField,
    InputSynced,
    TablePickerSynced,
    Text,
    useBase,
    useGlobalConfig,
    useRecords,
} from '@airtable/blocks/ui';

const TABLE_KEY = 'tableId';
const WEBHOOK_KEY = 'webhookUrl';

// Single-select fields give {name}, multiple-select fields give [{name}], everything else is passed through.
export function processFieldValue(cellValue) {
    if (cellValue === null || cellValue === undefined) {
        return '';
    }
    if (Array.isArray(cellValue)) {
        return cellValue.map((item) => (item && typeof item === 'object' && 'name' in item ? item.name : item));
    }
    if (typeof cellValue === 'object') {
        return 'name' in cellValue ? cellValue.name : cellValue;
    }
    return cellValue;
}

// One flat JSON object per record: ids first, then one key per field name.
export function buildPayload(record, table, baseId) {
    const payload = {baseId, tableId: table.id, recordId: record.id};
    table.fields.forEach((field) => {
        payload[field.name] = processFieldValue(record.getCellValue(field));
    });
    return payload;
}

function displayValue(value) {
    if (Array.isArray(value)) {
        return value.map(displayValue).join(', ');
    }
    return value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function isHttpUrl(value) {
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch (error) {
        return false;
    }
}

async function sendRecords(records, table, baseId, url, onProgress) {
    let sent = 0;
    let failed = 0;
    for (const record of records) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                body: JSON.stringify(buildPayload(record, table, baseId)),
            });
            response.ok ? sent++ : failed++;
        } catch (error) {
            failed++;
        }
        onProgress({sent, failed, total: records.length});
    }
    return {sent, failed, total: records.length};
}

function App() {
    const base = useBase();
    const globalConfig = useGlobalConfig();
    const tableId = globalConfig.get(TABLE_KEY);
    const table = typeof tableId === 'string' ? base.getTableByIdIfExists(tableId) : null;
    const records = useRecords(table);
    const url = globalConfig.get(WEBHOOK_KEY);

    const [progress, setProgress] = useState(null);
    const [running, setRunning] = useState(false);

    const ready = Boolean(table) && typeof url === 'string' && isHttpUrl(url);

    async function trigger() {
        setRunning(true);
        setProgress({sent: 0, failed: 0, total: records.length});
        await sendRecords(records, table, base.id, url, setProgress);
        setRunning(false);
    }

    const cellStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '250px',
        padding: '4px',
    };

    return (
        <Box padding={3} style={{height: '100%', overflow: 'auto'}}>
            <FormField label="Table">
                <TablePickerSynced globalConfigKey={TABLE_KEY} />
            </FormField>
            <FormField label="Webhook URL" description="Each record is POSTed to this address as flat JSON.">
                <InputSynced globalConfigKey={WEBHOOK_KEY} placeholder="https://example.com/webhook/leads" />
            </FormField>

            <Button onClick={trigger} disabled={!ready || running} variant="primary">
                {running ? 'Sending…' : 'Send records to webhook'}
            </Button>
            {progress && (
                <Text marginTop={2}>
                    Sent {progress.sent} of {progress.total}
                    {progress.failed > 0 ? `, ${progress.failed} failed` : ''}
                </Text>
            )}

            {table && records && (
                <table border="1" cellPadding="5" style={{marginTop: '20px', borderCollapse: 'collapse', width: '100%'}}>
                    <thead>
                        <tr>
                            {table.fields.map((field) => (
                                <th key={field.id} style={cellStyle}>
                                    {field.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record.id}>
                                {table.fields.map((field) => (
                                    <td key={field.id} style={cellStyle}>
                                        {displayValue(processFieldValue(record.getCellValue(field)))}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Box>
    );
}

export default App;
