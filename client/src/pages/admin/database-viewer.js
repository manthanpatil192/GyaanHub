const API_BASE = 'https://gyaanhub-backend.onrender.com/api';

export async function renderDatabaseViewer() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div style="padding: 20px; font-family: monospace; background: #fff; min-height: 100vh;">
            <h2>🗄️ PostgreSQL Cloud Database View</h2>
            <p style="color: #666; margin-bottom: 20px;">Live direct dump from Supabase connected to Render.</p>
            <div id="db-content">
                <h3>Loading live tables...</h3>
            </div>
            <button onclick="window.history.back()" style="margin-top: 20px; padding: 8px 16px;">Go Back</button>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/admin/dump`);
        if (!res.ok) throw new Error('API Error: ' + res.status);
        const db = await res.json();
        
        const content = document.getElementById('db-content');
        content.innerHTML = '';
        
        ['users', 'modules', 'quizzes', 'materials'].forEach(tableName => {
            const data = db[tableName] || [];
            if (data.length === 0) return;
            
            const columns = Object.keys(data[0]);
            
            let html = `
            <div style="margin-bottom: 40px; border: 1px solid #ccc; padding: 15px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow-x: auto;">
                <h3 style="margin-top:0; border-bottom: 1px solid #eee; padding-bottom: 10px; color: #2c3e50;">Table: <strong>public.${tableName}</strong></h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #f8f9fc;">
                            ${columns.map(c => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${c}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${columns.map(c => {
                                    let cellData = row[c];
                                    if (cellData === null || cellData === undefined) cellData = '<span style="color:#aaa;font-style:italic">NULL</span>';
                                    else if (typeof cellData === 'object') cellData = JSON.stringify(cellData).substring(0, 40) + '...';
                                    else cellData = String(cellData).length > 40 ? String(cellData).substring(0, 40) + '...' : cellData;
                                    
                                    return `<td style="border: 1px solid #ddd; padding: 8px;">${cellData}</td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p style="margin-top: 10px; font-size: 12px; color: #888;">${data.length} row(s) fetched</p>
            </div>
            `;
            
            content.innerHTML += html;
        });

    } catch (err) {
        document.getElementById('db-content').innerHTML = `<p style="color:red">Error fetching database: ${err.message}</p>`;
    }
}
