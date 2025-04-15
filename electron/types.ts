export interface SqlResult {
    columns: string[];
    rows: Record<string, unknown>[];
    affectedRows?: number;
    error?: string;
}

export interface Column {
    name: string;
    type: string;
    nullable: boolean;
    default: string | null;
}

export interface Table {
    schema: string;
    name: string;
    columns: Column[];
}
