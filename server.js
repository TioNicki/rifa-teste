const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const port = 3000;

// Permitir CORS apenas do seu frontend
app.use(cors({
    origin: 'https://aquamarine-bubblegum-cafe41.netlify.app' // Substitua pela URL do seu front-end
}));

app.use(bodyParser.json());

// Configuração do banco de dados PostgreSQL com o link de conexão fornecido
const client = new Client({
    connectionString: 'postgresql://postgres:eNKNDHYJvAoULq8F@delightfully-rational-kit.data-1.use1.tembo.io:5432/postgres',
    ssl: {
        rejectUnauthorized: false // Permite a conexão com SSL sem verificar a autenticidade do certificado
    }
});

client.connect()
    .then(() => {
        console.log('Conectado ao banco de dados com sucesso!');
    })
    .catch(err => {
        console.error("Erro ao conectar ao banco de dados", err);
    });

// Definições do bot do Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Rota para salvar os dados e enviar ao Telegram
app.post('/salvar', async (req, res) => {
    const { nome_completo, telefone, numero_rifa } = req.body;

    if (!nome_completo || !telefone || !numero_rifa) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    const mensagem = `\u2709 Nova Reserva de Rifa!\n\n` +
                     `\ud83d\udc64 Nome: ${nome_completo}\n` +
                     `\ud83d\udcde Telefone: ${telefone}\n` +
                     `\ud83c\udfaf Número da Rifa: ${numero_rifa}`;

    try {
        // Salva a reserva no banco de dados
        await client.query('INSERT INTO reservas (nome_completo, telefone, numero_rifa) VALUES ($1, $2, $3)', 
                           [nome_completo, telefone, numero_rifa]);

        // Envia a mensagem para o Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: mensagem,
            parse_mode: 'Markdown'
        });

        res.json({ message: 'Informações enviadas para o Telegram com sucesso' });
    } catch (error) {
        console.error("Erro ao processar a solicitação:", error);
        res.status(500).json({ message: 'Erro ao processar a solicitação' });
    }
});

// Rota para buscar todos os dados das reservas
app.get('/getdata', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM reservas');
        res.json(result.rows); // Retorna todos os registros de reservas
    } catch (error) {
        console.error("Erro ao buscar os dados:", error);
        res.status(500).json({ message: 'Erro ao buscar os dados' });
    }
});

// Rota para buscar todos os números
app.get('/get-numeros', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM numeros');
        res.json({ numeros: result.rows }); // Retorna todos os números
    } catch (error) {
        console.error("Erro ao buscar os números:", error);
        res.status(500).json({ message: 'Erro ao buscar os números' });
    }
});

// Rota para atualizar o status de um número (ex.: marcar como "comprado")
app.post('/update-number', async (req, res) => {
    const { numero, status } = req.body;

    if (!numero || !status) {
        return res.status(400).json({ message: 'Número e status são obrigatórios.' });
    }

    try {
        // Verifica se o número existe no banco de dados
        const result = await client.query('SELECT * FROM numeros WHERE numero = $1', [numero]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Número não encontrado.' });
        }

        // Verifica se o número já foi comprado
        if (result.rows[0].status === 'comprado') {
            return res.status(400).json({ message: 'Número já foi comprado.' });
        }

        // Atualiza o status do número no banco de dados
        await client.query('UPDATE numeros SET status = $1 WHERE numero = $2', [status, numero]);
        res.json({ message: 'Número atualizado com sucesso.' });
    } catch (error) {
        console.error("Erro ao atualizar número:", error);
        res.status(500).json({ message: 'Erro ao atualizar o status do número.' });
    }
});

// Rota para obter o status de um número específico
app.get('/number-status', async (req, res) => {
    const { numero } = req.query;

    if (!numero) {
        return res.status(400).json({ message: 'Número é obrigatório.' });
    }

    try {
        // Busca o status do número no banco de dados
        const result = await client.query('SELECT * FROM numeros WHERE numero = $1', [numero]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Número não encontrado.' });
        }

        res.json({ status: result.rows[0].status });
    } catch (error) {
        console.error("Erro ao buscar status do número:", error);
        res.status(500).json({ message: 'Erro ao buscar o status do número.' });
    }
});

// Inicia o servidor na porta definida
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
