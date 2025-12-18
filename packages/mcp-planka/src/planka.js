export async function plankaFetch(auth, path, init) {
    const url = `${auth.plankaBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const resp = await fetch(url, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.headers || {}),
            Authorization: `Bearer ${auth.accessToken}`,
        },
    });
    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Planka API error (${resp.status}): ${text}`);
    }
    return (await resp.json());
}
export async function listProjects(auth) {
    const data = await plankaFetch(auth, '/api/projects', {
        method: 'GET',
    });
    // Planka list endpoints usually return { items: [...] }
    if (Array.isArray(data.items))
        return data.items;
    if (Array.isArray(data.item))
        return data.item;
    return data.items ?? [];
}
export async function getProject(auth, projectId) {
    return await plankaFetch(auth, `/api/projects/${encodeURIComponent(projectId)}`, { method: 'GET' });
}
export async function getBoard(auth, boardId) {
    return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}`, { method: 'GET' });
}
export async function moveCard(auth, cardId, listId, position) {
    const body = { listId };
    if (typeof position === 'number')
        body.position = position;
    return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
}
//# sourceMappingURL=planka.js.map