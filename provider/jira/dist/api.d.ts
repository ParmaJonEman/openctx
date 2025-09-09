import type { Settings } from './index.ts';
export interface IssuePickerItem {
    key: string;
    summaryText: string;
    url: string;
}
export interface Issue {
    key: string;
    url: string;
    fields: {
        summary: string;
        description: string;
        labels: string[];
        subtasks?: Issue[];
    };
}
export declare const searchIssues: (query: string | undefined, settings: Settings) => Promise<IssuePickerItem[]>;
export declare const fetchIssue: (issueId: string, settings: Settings, attempt?: number) => Promise<Issue | null>;
//# sourceMappingURL=api.d.ts.map