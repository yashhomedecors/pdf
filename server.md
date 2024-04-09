const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 8888;

// Increase payload size limit for body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors()); // Add CORS middleware
app.use(bodyParser.text({ type: 'text/html', limit: '50mb' }));

app.post('/convert', async (req, res) => {
    const htmlContent = req.body;
    const outputPath = req.query.outputPath || 'output.pdf';

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Set viewport and wait for page to load
        await page.setViewport({ width: 1200, height: 800 });
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate PDF with applied CSS
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true // Enable printing background colors and images
        });

        await browser.close();

        // Send PDF response with appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${outputPath}`); // Corrected line
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: `PDF conversion failed: ${error}` }); // Corrected line
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`); // Corrected line
});
