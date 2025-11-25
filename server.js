const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8092;
const publicDir = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const safePath = req.url.split('?')[0].replace(/\.\.+/g, '');
  let filePath = path.join(publicDir, safePath);

  if (safePath === '/' || !path.extname(filePath)) {
    filePath = path.join(publicDir, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const type = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', type);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Local preview available at http://localhost:${PORT}/`);
});

