require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.memoryStorage(); //No vamos a bregar con archivos, por ahora
const upload = multer({ storage: storage });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const generationConfig = {
    temperature: 0.9,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
};

app.use(express.static('public'));
app.use(cors());
app.use(express.json());


// Ruta para analizar hechos
app.post('/analizar_hechos', async (req, res) => {
    try {
        const textoHechos = req.body.texto;

        if (!textoHechos) {
            return res.status(400).json({ error: 'No se proporcionó texto.' });
        }

        const pythonProcess = spawn('python', [path.join(__dirname, 'python_scripts', 'analizador_hechos.py'), textoHechos]);

        let resultadoAnalisis = '';
        pythonProcess.stdout.on('data', (data) => {
            resultadoAnalisis += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            // Considera enviar esto al cliente como parte del mensaje de error
        });

        pythonProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (code === 0) {
                res.json({ resultado: resultadoAnalisis });
            } else {
                res.status(500).json({ error: `El script de Python terminó con código de error ${code}` });
            }
        });

    } catch (error) {
        console.error("Error en la ruta /analizar_hechos:", error);
        res.status(500).json({ error: error.message || "Error interno del servidor." });
    }
});

// Ruta para generar apercibimientos
app.post('/generar_apercibimiento', async (req, res) => {
    try {
        const { hechos, sanciones } = req.body; // Recibe hechos y sanciones

        if (!hechos) {
            return res.status(400).json({ error: 'No se proporcionaron los hechos.' });
        }
        //Formato de las sanciones: fecha1,tipo1,motivo1;fecha2,tipo2,motivo2...
        const sancionesStr = sanciones.map(s => `${s.fecha},${s.tipo},${s.motivo}`).join(';');

        const pythonProcess = spawn('python', [
            path.join(__dirname, 'python_scripts', 'generador_apercibimientos.py'),
            hechos,
            sancionesStr  // Pasa las sanciones como una cadena
        ]);

        let resultadoApercibimiento = '';

        pythonProcess.stdout.on('data', (data) => {
            resultadoApercibimiento += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (code === 0) {
                res.json({ resultado: resultadoApercibimiento });
            } else {
                res.status(500).json({ error: `El script de Python terminó con código de error ${code}` });
            }
        });

    } catch (error) {
        console.error("Error en la ruta /generar_apercibimiento:", error);
        res.status(500).json({ error: error.message || "Error interno del servidor." });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});