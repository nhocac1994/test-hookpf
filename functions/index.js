const PDFMake = require('pdfmake');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      const jsonData = JSON.parse(event.body);
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
      const pdfBase64 = pdfBuffer.toString('base64');

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="output.pdf"'
        },
        body: pdfBase64,
        isBase64Encoded: true
      };
    } else if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Webhook server is running',
          endpoints: {
            webhook: '/.netlify/functions/index.js (POST)'
          }
        })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to generate PDF' })
    };
  }
}; 