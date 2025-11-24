const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

const upload = multer({ storage: multer.memoryStorage() });

async function processImage(url, options) {
    const { convertToWebp, optimize, prefix = '', suffix = '', filenameOverride } = options;

    try {
        const response = await axios({
            url,
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data, 'binary');

        // Extract extension or default to .jpg
        let extension = path.extname(url).split('?')[0];
        if (!extension || extension === '.') extension = '.jpg';

        let filename;
        if (filenameOverride) {
            // Sanitize filename: replace spaces with -, remove non-alphanumeric/dash
            const safeName = filenameOverride
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/gi, '')
                .toLowerCase();
            filename = `${prefix}${safeName}${suffix}`;
        } else {
            filename = `${prefix}image-${Date.now()}-${Math.floor(Math.random() * 1000)}${suffix}`;
        }

        let finalBuffer = buffer;

        if (convertToWebp) {
            extension = '.webp';
        }

        if (optimize || convertToWebp) {
            let sharpInstance = sharp(buffer);

            if (convertToWebp) {
                sharpInstance = sharpInstance.webp({ quality: optimize ? 80 : 100 });
            } else if (optimize) {
                // Optimize original format if possible
                if (extension === '.jpg' || extension === '.jpeg') {
                    sharpInstance = sharpInstance.jpeg({ quality: 80 });
                } else if (extension === '.png') {
                    sharpInstance = sharpInstance.png({ quality: 80 });
                }
            }
            finalBuffer = await sharpInstance.toBuffer();
        }

        const filePath = path.join(DOWNLOAD_DIR, `${filename}${extension}`);
        fs.writeFileSync(filePath, finalBuffer);

        return { url, status: 'success', file: `${filename}${extension}` };

    } catch (error) {
        console.error(`Error processing ${url}:`, error.message);
        return { url, status: 'error', error: error.message };
    }
}

app.post('/api/download', async (req, res) => {
    console.log('Request body:', req.body);
    const { urls, convertToWebp, optimize, prefix, suffix } = req.body;

    if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({ error: 'Invalid URLs provided' });
    }

    const results = [];
    for (const url of urls) {
        const result = await processImage(url, { convertToWebp, optimize, prefix, suffix });
        results.push(result);
    }

    res.json({ results });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { convertToWebp, optimize, prefix, suffix } = req.body;
    const results = [];

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        for (const row of data) {
            // Case insensitive key search
            const keys = Object.keys(row);
            const titleKey = keys.find(k => k.toLowerCase().trim() === 'title');
            const urlKey = keys.find(k => k.toLowerCase().trim() === 'original image url');

            if (urlKey && row[urlKey]) {
                const url = row[urlKey];
                const title = titleKey ? row[titleKey] : null;

                const result = await processImage(url, {
                    convertToWebp: convertToWebp === 'true',
                    optimize: optimize === 'true',
                    prefix,
                    suffix,
                    filenameOverride: title
                });
                results.push(result);
            }
        }

        res.json({ results });

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
