#!/user/bin/env node

'use strict';

const express = require('express');
const fs = require('fs');
const program = require('commander');
const yaml = require('js-yaml');

function main() {
  program
    .description('Simple way to serve OpenAPI/Swagger-generated API reference dcumentation with ReDoc.')
    .version('1.0.0')
    .usage('[options] spec-file-path')
    .option('-p, --port [value]', 'port on which the server will listen (default 5000)')
    .parse(process.argv);

  checkArgs(program);
  startServer(program);
}

function checkArgs(program) {
  if (program.args.length != 1) {
    console.error('no spec file path');
    program.help();
  }
}

function startServer(program) {
  const app = express();
  const spec = loadSpec(program.args[0]);
  const html = loadHTML();
  const port = program.port || 5000;

  app.use('/assets/redoc', express.static(__dirname + '/../node_modules/redoc/dist'))

  app.get('/spec.json', function (req, res) {
    res.send(spec);
  });
  app.get('*', function (req, res) {
    res.send(html);
  });

  app.listen(port, function () {
    console.log(`Server listening on port ${port}!`);
  })
  .on('error', function(e) {
    console.error('failed to start server: ' + e.message);
    process.exit(1);
  });
}

function loadSpec(path) {
  let yml;
  let json;
  if (path.match(/\.(yaml|yml)$/)) {
    try {
      yml = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
    }
    catch (e) {
      console.error('failed to load spec yaml: ' + e.message);
      process.exit(1);
    }
    try {
      json = JSON.stringify(yml);
    }
    catch (e) {
      console.error('failed to convert yaml to json: ' + e.message);
      process.exit(1);
    }
  }
  else {
    try {
      json = fs.readFileSync(path, 'utf8');
    }
    catch (e) {
      console.error('failed to load spec json: ' + e.message);
      process.exit(1);
    }
  }
  return json;
}

function loadHTML(path) {
  let html;
    try {
      html = fs.readFileSync(__dirname + '/../assets/index.html', 'utf8');
    }
    catch (e) {
      console.error('failed to load html file: ' + e.message);
      process.exit(1);
    }
  return html;
}

main();
