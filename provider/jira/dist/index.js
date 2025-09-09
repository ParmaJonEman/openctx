import { fetchIssue, searchIssues } from './api.js';
const checkSettings = (settings) => {
    const missingKeys = ['url', 'email', 'apiToken'].filter(key => !(key in settings));
    if (missingKeys.length > 0) {
        throw new Error(`Missing settings: ${JSON.stringify(missingKeys)}`);
    }
};
const maxSubTasks = 10;
const issueToItem = (issue) => ({
    url: issue.url,
    title: issue.fields.summary,
    ui: {
        hover: {
            markdown: issue.fields.description,
            text: issue.fields.description || issue.fields.summary,
        },
    },
    ai: {
        content: `The following represents contents of the JIRA issue ${issue.key}: ` +
            JSON.stringify({
                issue: {
                    key: issue.key,
                    summary: issue.fields.summary,
                    url: issue.url,
                    description: issue.fields.description,
                    labels: issue.fields.labels,
                    // Include high level details of the subissues on the primary issue, but their full content is included as separate items
                    relatedChildIssues: issue.fields.subtasks
                        ?.slice(0, maxSubTasks)
                        .map(item => item.key),
                },
            }),
    },
});
const jiraProvider = {
    meta(params, settings) {
        return { name: 'Jira Issues', mentions: { label: 'Search by name, id or paste a URL...' } };
    },
    async mentions(params, settings) {
        checkSettings(settings);
        // Uses the quick REST picker API to fuzzy match potential items
        return searchIssues(params.query, settings).then(items => items.map(item => ({
            title: item.key,
            uri: item.url,
            description: item.summaryText,
            data: { key: item.key },
        })));
    },
    async items(params, settings) {
        checkSettings(settings);
        const rateLimiter = new RateLimiter(2); // Max 2 concurrent requests
        const key = (params.mention?.data).key;
        const issue = await fetchIssue(key, settings);
        if (!issue) {
            return [];
        }
        const subtasks = issue.fields.subtasks?.slice(0, maxSubTasks);
        if (!subtasks) {
            return [issueToItem(issue)];
        }
        const childIssues = await Promise.all(subtasks.map(subtask => rateLimiter.run(() => fetchIssue(subtask.key, settings).then(childIssue => {
            return childIssue ? issueToItem(childIssue) : null;
        }))));
        const items = [issueToItem(issue), ...childIssues.filter((item) => item !== null)];
        return items;
    },
};
// Add a simple rate limiter
class RateLimiter {
    maxConcurrent;
    queue = [];
    running = 0;
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent;
    }
    async run(fn) {
        while (this.running >= this.maxConcurrent) {
            await new Promise(resolve => this.queue.push(resolve));
        }
        this.running++;
        try {
            return await fn();
        }
        finally {
            this.running--;
            const next = this.queue.shift();
            if (next)
                next();
        }
    }
}
export default jiraProvider;
//# sourceMappingURL=index.js.map