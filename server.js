const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer');
const axios = require('axios');
const moment = require('moment');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { htmlContent, clientName } = req.body;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      executablePath: process.env.CHROME_BIN || null,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    const pdf = await page.pdf({ 
      format: 'A4', 
      landscape: true,
      printBackground: true,
      margin: { top: '25px', right: '25px', bottom: '25px', left: '25px' }
    });

    await browser.close();

    res.contentType('application/pdf')
       .header('Content-Disposition', `attachment; filename="${clientName}_Invoice.pdf"`)
       .send(pdf);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: error.message });
  }
});

const currDate = moment().format("DD MMM YYYY HH:mm:ss");
app.get('/health', (req, res) => {
  res.status(200).send(`Server is healthy at ${currDate}`);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  setInterval(keepServerAlive, 28 * 1000); // Check every 60 seconds
});

const keepServerAlive = async () => {
  try {
    const response = await axios.get(`http://localhost:${port}/health`);
    console.log(`Keep-alive ping: ${response.data}`);
  } catch (error) {
    console.error('Error keeping server alive:', error);
  }
};
