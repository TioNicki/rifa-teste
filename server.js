const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors({
    origin: 'https://aquamarine-bubblegum-cafe41.netlify.app'
}));


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

// Função para garantir que o arquivo numeros.json exista
function carregarNumeros() {
    try {
        if (fs.existsSync(NUMEROS_FILE)) {
            const data = fs.readFileSync(NUMEROS_FILE, 'utf8');
            return JSON.parse(data);
        } else {
            const numerosIniciais = { numeros: [] };
            fs.writeFileSync(NUMEROS_FILE, JSON.stringify(numerosIniciais, null, 2));
            return numerosIniciais;
        }
    } catch (error) {
        console.error("Erro ao carregar numeros.json:", error);
        return { numeros: [] };
    }
}

// Carrega os números uma vez na inicialização do servidor
let numeros = carregarNumeros();

// Rota para buscar os números sempre atualizados
app.get('/update-number', (req, res) => {
    // Sempre carregar os números do arquivo antes de enviar a resposta
    numeros = carregarNumeros();
    res.json(numeros);
});

// Rota para atualizar o status de um número corretamente
app.post('/update-number', (req, res) => {
    const { numero, status } = req.body;

    if (!numero || !status) {
        return res.status(400).json({ message: 'Número e status são obrigatórios.' });
    }

    // Certifique-se de carregar os números mais recentes antes de atualizar
    numeros = carregarNumeros();

    const numeroIndex = numeros.numeros.findIndex(n => n.numero == numero);

    if (numeroIndex === -1) {
        return res.status(404).json({ message: 'Número não encontrado.' });
    }

    if (numeros.numeros[numeroIndex].status === 'comprado') {
        return res.status(400).json({ message: 'Número já foi comprado.' });
    }

    // Atualiza o status do número
    numeros.numeros[numeroIndex].status = status;

    // Salvar os números no arquivo JSON sem sobrescrevê-lo incorretamente
    try {
        fs.writeFileSync(NUMEROS_FILE, JSON.stringify(numeros, null, 2));
        res.json({ message: 'Número atualizado com sucesso.' });
    } catch (err) {
        console.error("Erro ao salvar numeros.json:", err);
        res.status(500).json({ message: 'Erro ao atualizar o arquivo de números.' });
    }
});
// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
