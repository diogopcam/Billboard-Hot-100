import express from 'express';
import fetch from 'node-fetch';
import querystring from 'querystring';
import fs from 'fs/promises';

const app = express();
const port = 8888;

const client_id = 'dbd4ec67a4fd4d68b38235d0468b493c'; // Substitua com seu Client ID
const client_secret = 'c0bbdff3f46b4d4299e260501fddcbf6'; // Substitua com seu Client Secret
const redirect_uri = `http://localhost:${port}/callback`; // URL de redirecionamento
let refresh_token = 'AQAJkY_z6AqTrjJRxQeDoeIPjJf4o7Jp9Zr6SwP422Qd-Ktw6PaBt0Cw2f9-YenloGC8WLHifiIi5_OwF5Sbodt88pW7ikiRfGyzl0JWKJrSbbuROfAz1YgqzA4eXajDFJg';
let access_token = '';

async function refreshAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64')
        },
        body: querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        })
    });

    const data = await response.json();
    if (response.ok) {
        access_token = data.access_token;
        if (data.refresh_token) {
            refresh_token = data.refresh_token;
        }
        console.log('Novo token de acesso:', access_token);
        console.log('Novo token de atualização:', refresh_token);
        return access_token;
    } else {
        throw new Error(data.error_description);
    }
}

async function fetchWithToken(url, options) {
    if (!access_token) {
        await refreshAccessToken();
    }
    
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${access_token}`
    };

    let response = await fetch(url, options);

    if (response.status === 401) { // Token expirado
        await refreshAccessToken();
        options.headers['Authorization'] = `Bearer ${access_token}`;
        response = await fetch(url, options);
    }

    return response;
}

app.get('/', (req, res) => {
    res.send('<h1>Bem-vindo ao servidor de autenticação do Spotify</h1><p><a href="/login">Clique aqui para fazer login</a></p>');
});

app.get('/login', (req, res) => {
    const scope = 'user-top-read'; // Escopos necessários para sua aplicação
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri
        }));
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;

    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    try {
        const response = await fetch(authOptions.url, {
            method: 'POST',
            headers: authOptions.headers,
            body: querystring.stringify(authOptions.form)
        });

        const text = await response.text();
        console.log('Resposta do servidor:', text); // Log da resposta do servidor

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`Erro ao analisar JSON: ${e.message}`);
        }

        access_token = data.access_token;
        if (data.refresh_token) {
            refresh_token = data.refresh_token;
        }
        res.redirect(`/success?access_token=${access_token}`);
    } catch (error) {
        res.send(`Error: ${error.message}`);
    }
});

app.get('/success', (req, res) => {
    res.send(`Access Token: ${access_token}`);
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
