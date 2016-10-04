#!/usr/bin/env node

'use strict';

const browserSync = require('browser-sync');
const ejs = require('ejs');
const express = require('express');
const fs = require('fs');
const program = require('commander');
const yaml = require('js-yaml');

function main() {
  const pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'));
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

function checkArgs(program) {
  if (program.args.length != 1) {
    console.error('no spec file path');
    program.help();
  }
}

function startServer(program) {
  const app = express();
  const html = loadHTML(program);
  const port = program.port || 5000;

  app.use('/assets/redoc', express.static(__dirname + '/../node_modules/redoc/dist'))

  app.get('/spec.json', function (req, res) {
    const spec = loadSpec(program.args[0]);
    res.send(spec);
  });
  app.get('*', function (req, res) {
    res.send(html);
  });

  if (program.watch) {
    app.listen(port + 1, function () {
      const bs = browserSync.create();
      bs.init({
        files: program.args,
        proxy: `http://localhost:${port+1}`,
        port,
        logLevel: 'silent',
        open: false,
      }, function() {
        console.log(`Server listening on port ${port}!`);
      });
    })
    .on('error', function(e) {
      console.error('failed to start server: ' + e.message);
      process.exit(1);
    });
  }
  else {
    app.listen(port, function () {
      console.log(`Server listening on port ${port}!`);
    })
    .on('error', function(e) {
      console.error('failed to start server: ' + e.message);
      process.exit(1);
    });
  }
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
    }
    try {
      json = JSON.stringify(yml);
    }
    catch (e) {
      console.error('failed to convert yaml to json: ' + e.message);
    }
  }
  else {
    try {
      json = fs.readFileSync(path, 'utf8');
    }
    catch (e) {
      console.error('failed to load spec json: ' + e.message);
    }
  }
  return json;
}

function loadHTML(program) {
  let html;
    try {
      const template = fs.readFileSync(__dirname + '/../templates/index.html', 'utf8');
      html = ejs.render(template, {spec: program.args[0]});
    }
    catch (e) {
      console.error('failed to load html file: ' + e.message);
      process.exit(1);
    }
  return html;
}

main();
