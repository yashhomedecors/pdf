const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer');

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
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});