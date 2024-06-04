const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express(); // Create the Express application
const port = process.env.PORT || 3000; // Use environment variable or default to 3000

// Configure CORS
app.use(cors({
  origin: '*', // This allows any origin. In production, specify your client's domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
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
      margin: { top: '30px', right: '30px', bottom: '30px', left: '30px' }
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

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  // Start the keep-alive mechanism
  keepServerAlive();
});

// Function to keep the server alive
const keepServerAlive = () => {
  const interval = 45 * 1000; // 45 seconds

  setInterval(async () => {
    try {
      const response = await axios.get(`http://localhost:${port}/health`);
      console.log(`Keep-alive ping: ${response.data}`);
    } catch (error) {
      console.error('Error keeping server alive:', error);
    }
  }, interval);
};
