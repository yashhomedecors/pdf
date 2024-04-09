const puppeteer = require('puppeteer');

exports.handler = async function(event, context) {
    const htmlContent = event.body;
    const outputPath = event.queryStringParameters.outputPath || 'output.pdf';

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
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=${outputPath}`
            },
            body: pdfBuffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `PDF conversion failed: ${error}` })
        };
    }
};
