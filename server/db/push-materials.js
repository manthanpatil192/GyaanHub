import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const API_HOST = 'gyaanhub-backend.onrender.com';

const dataPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Helper function to make HTTPS requests
function makeRequest(method, endpoint, payload, token = null) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = https.request({
            hostname: API_HOST,
            port: 443,
            path: `/api${endpoint}`,
            method: method,
            headers: headers
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => resolve(JSON.parse(resData)));
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function pushMaterials() {
    try {
        console.log('Logging in to live backend...');
        const loginRes = await makeRequest('POST', '/auth/login', {
            username: 'prof_sharma',
            password: 'password123'
        });

        if (!loginRes.token) {
            console.error('Login failed:', loginRes);
            return;
        }

        const token = loginRes.token;
        console.log('Login successful! Pushing 16 materials...');

        // Push all materials from data.json except the first one if already present, but the backend uses title to differ or lets it insert dupes.
        for (const mat of data.materials) {
            console.log(`Pushing: [${mat.type}] ${mat.title}`);
            const res = await makeRequest('POST', '/materials', mat, token);
            if (res.error) {
                console.error(`Failed to push ${mat.title}: ${res.error}`);
            }
        }

        console.log('Finished pushing materials!');
    } catch (e) {
        console.error('Error:', e);
    }
}

pushMaterials();
