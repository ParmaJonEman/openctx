const authHeaders = (settings) => ({
    Authorization: `Basic ${Buffer.from(`${settings.email}:${settings.apiToken}`).toString('base64')}`,
});
const buildUrl = (settings, path, searchParams = {}) => {
    // Avoid double / if settings.url ends with '/' and path starts with '/'
    const url = new URL(settings.url.replace(/\/$/, '') + path);
    url.search = new URLSearchParams(searchParams).toString();
    return url;
};
export const searchIssues = async (query, settings) => {
    const pickerResponse = await fetch(buildUrl(settings, '/rest/api/2/issue/picker', {
        query: query || '',
    }), {
        method: 'GET',
        headers: authHeaders(settings),
    });
    if (!pickerResponse.ok) {
        throw new Error(`Error fetching recent JIRA issues (${pickerResponse.status} ${pickerResponse.statusText}): ${await pickerResponse.text()}`);
    }
    const pickerJSON = (await pickerResponse.json());
    return (pickerJSON.sections?.[0]?.issues?.map(json => {
        return {
            ...json,
            url: buildUrl(settings, `/browse/${json.key}`).toString(),
        };
    }) || []);
};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const fetchIssue = async (issueId, settings, attempt = 1) => {
    const maxAttempts = 3;
    try {
        const issueResponse = await fetch(buildUrl(settings, '/rest/api/2/search/', {
            jql: `key="${issueId}"`,
            fields: 'key,summary,description,labels,subtasks'
        }), {
            method: 'GET',
            headers: authHeaders(settings),
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        // Handle rate limiting and server errors
        if (issueResponse.status === 429 || issueResponse.status >= 500) {
            if (attempt < maxAttempts) {
                const retryAfter = issueResponse.headers.get('Retry-After');
                const waitTime = retryAfter
                    ? parseInt(retryAfter) * 1000
                    : Math.pow(2, attempt) * 1000; // exponential backoff: 2s, 4s, 8s
                console.warn(`Jira returned ${issueResponse.status} for ${issueId}, retrying in ${waitTime}ms...`);
                await delay(waitTime);
                return fetchIssue(issueId, settings, attempt + 1);
            }
        }
        if (!issueResponse.ok) {
            throw new Error(`Error fetching JIRA issue (${issueResponse.status} ${issueResponse.statusText}): ${await issueResponse.text()}`);
        }
        const responseJSON = (await issueResponse.json());
        const issue = responseJSON.issues?.[0];
        if (!issue && attempt < maxAttempts) {
            // Sometimes Jira returns empty results under load, retry
            console.warn(`No issue found for ${issueId}, retrying...`);
            await delay(1000 * attempt);
            return fetchIssue(issueId, settings, attempt + 1);
        }
        if (!issue) {
            return null;
        }
        return {
            ...issue,
            url: buildUrl(settings, `/browse/${issue.key}`).toString(),
        };
    }
    catch (error) {
        if (attempt < maxAttempts) {
            console.warn(`Error fetching ${issueId} (attempt ${attempt}):`, error);
            await delay(Math.pow(2, attempt) * 1000);
            return fetchIssue(issueId, settings, attempt + 1);
        }
        throw error;
    }
};
//# sourceMappingURL=api.js.map