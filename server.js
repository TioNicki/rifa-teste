const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors'); // Importando CORS
const fs = require('fs');  // Para simular o armazenamento de dados (pode ser substituído por um banco de dados real)

const app = express();
const port = 3000;

app.use(express.static(__dirname));
// Habilita CORS para todas as origens
app.use(cors());

// Configuração do body-parser
app.use(bodyParser.json());

// Simulando um banco de dados em memória
let reservas = [];

// Token do Bot e ID do Chat (substitua pelos seus valores)
const TELEGRAM_BOT_TOKEN = "7633525229:AAHVUDMK5vDPqcI8L7OiKRDR_zRrk0l667Y";
const TELEGRAM_CHAT_ID = "6991171828";

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
        // Adicionando a reserva ao "banco de dados"
        reservas.push({ nome_completo, telefone, numero_rifa });

        // Enviando a mensagem para o Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: mensagem,
            parse_mode: 'Markdown'
        });

        res.json({ message: 'Informações enviadas para o Telegram com sucesso' });
    } catch (error) {
        console.error("Erro ao enviar mensagem para o Telegram:", error);
        res.status(500).json({ message: 'Erro ao enviar os dados para o Telegram' });
    }
});

// Rota para buscar os dados (exemplo de endpoint para retornar as reservas)
app.get('/getdata', (req, res) => {
    res.json(reservas);
});

const NUMEROS_FILE = './numeros.json';

// Rota para buscar os números
app.get('/numbers', (req, res) => {
    fs.readFile(NUMEROS_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao ler o arquivo de números.' });
        }
        const numeros = JSON.parse(data);
        res.json(numeros);
    });
});

// Rota para atualizar o status de um número
app.post('/update-number', (req, res) => {
    const { numero, status } = req.body;

    if (!numero || !status) {
        return res.status(400).json({ message: 'Número e status são obrigatórios.' });
    }

    // Lê o arquivo numeros.json
    fs.readFile(NUMEROS_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao ler o arquivo de números.' });
        }

        const numeros = JSON.parse(data);
        const numeroIndex = numeros.numeros.findIndex(n => n.numero === numero);

        if (numeroIndex === -1) {
            return res.status(404).json({ message: 'Número não encontrado.' });
        }

        // Atualiza o status do número
        numeros.numeros[numeroIndex].status = status;

        // Grava as mudanças no arquivo JSON
        fs.writeFile(NUMEROS_FILE, JSON.stringify(numeros, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao atualizar o arquivo de números.' });
            }

            res.json({ message: 'Número atualizado com sucesso.' });
        });
    });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
