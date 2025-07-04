const express = require('express');
const PDFMake = require('pdfmake');
const app = express();

app.use(express.json());

app.post('/webhook', async (req, res) => {
  try {
    const jsonData = req.body;
    console.log('Received JSON:', jsonData);

    const docDefinition = {
      content: [
        { text: 'AppSheet Webhook PDF', style: 'header' },
        { text: JSON.stringify(jsonData, null, 2), style: 'body' }
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        body: { fontSize: 12 }
      }
    };

    const fonts = {
      Roboto: {
        normal: 'https://raw.githubusercontent.com/pdfmake/pdfmake/master/examples/fonts/Roboto-Regular.ttf',
        bold: 'https://raw.githubusercontent.com/pdfmake/pdfmake/master/examples/fonts/Roboto-Bold.ttf'
      }
    };
    const printer = new PDFMake(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const chunks = [];
    await new Promise((resolve, reject) => {
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', resolve);
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="output.pdf"'
    });
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Optional: Route để test
app.get('/', (req, res) => {
  res.send('Webhook server is running');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));