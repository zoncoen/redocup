#!/usr/bin/env node

const browserSync = require('browser-sync');
const ejs = require('ejs');
const express = require('express');
const fs = require('fs');
const path = require('path');
const program = require('commander');
const yaml = require('js-yaml');

/* eslint-disable no-console */
function checkArgs(p) {
  if (p.args.length !== 1) {
    console.error('no spec file path');
    p.help();
  }
}

function loadHTML(p) {
  let html;
  try {
    const template = fs.readFileSync(path.join(__dirname, '/../templates/index.html'), 'utf8');
    html = ejs.render(template, { spec: p.args[0] });
  } catch (e) {
    console.error(`failed to load html file: ${e.message}`);
    process.exit(1);
  }
  return html;
}

function loadSpec(p) {
  let yml;
  let json;
  if (p.match(/\.(yaml|yml)$/)) {
    try {
      yml = yaml.safeLoad(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      console.error(`failed to load spec yaml: ${e.message}`);
    }
    try {
      json = JSON.stringify(yml);
    } catch (e) {
      console.error(`failed to convert yaml to json: ${e.message}`);
    }
  } else {
    try {
      json = fs.readFileSync(p, 'utf8');
    } catch (e) {
      console.error(`failed to load spec json: ' + ${e.message}`);
    }
  }
  return json;
}

function startServer(p) {
  const app = express();
  const html = loadHTML(p);
  const port = p.port || 5000;

  app.use('/assets/redoc', express.static(path.join(__dirname, '/../node_modules/redoc/dist')));

  app.get('/spec.json', (req, res) => {
    const spec = loadSpec(p.args[0]);
    res.send(spec);
  });
  app.get('*', (req, res) => {
    res.send(html);
  });

  if (p.watch) {
    app.listen(port + 1, () => {
      const bs = browserSync.create();
      bs.init({
        files: p.args,
        proxy: `http://localhost:${port + 1}`,
        port,
        logLevel: 'silent',
        open: false,
      }, () => {
        console.log(`Server listening on port ${port}!`);
      });
    })
    .on('error', (e) => {
      console.error(`failed to start server: ${e.message}`);
      process.exit(1);
    });
  } else {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}!`);
    })
    .on('error', (e) => {
      console.error(`failed to start server: ${e.message}`);
      process.exit(1);
    });
  }
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '/../package.json'), 'utf8'));
  program
    .description('Simple way to serve OpenAPI/Swagger-generated API reference documentation with ReDoc.')
    .version(pkg.version)
    .usage('[options] spec-json-or-yaml-path')
    .option('-p, --port [value]', 'port on which the server will listen (default 5000)')
    .option('-w, --watch', 'reloding browser on spec file changes')
    .parse(process.argv);

  checkArgs(program);
  startServer(program);
}

main();
/* eslint-enable no-console */
