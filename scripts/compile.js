const { compile } = require('nexe');
const packageJson = require('../package.json');
const newVersion = packageJson.version;

compile({
  input: './scripts/serve.js',
  clean: args.includes('clean'),
  build: args.includes('build'),
  bundle: true,
  output: `./release/mhmm-v${newVersion}`,
  name: `mhmm-v${newVersion}`,
  rc: { PRODUCTVERSION: `${newVersion}` },
  targets: ['windows'],
  vcBuild: ['release'],
  verbose: true,
  temp: "./.nexe",
  ico: "./public/favicon.ico",
  resources: [
    "./build",
  ],
}).then(() => {
  console.log('compilation successful');
}).catch(err => {
  console.error('compilation err: ', err);
})