const { compile } = require('nexe');
const { version } = require('./package.json');

const args = process.argv.slice(2);
compile({
  input: './serve.js',
  clean: args.includes('clean'),
  build: args.includes('build'),
  bundle: true,
  output: `./release/mhmm-v${version}`,
  name: `mhmm-v${version}`,
  rc: { PRODUCTVERSION: `${version}` },
  targets: ['windows'],
  vcBuild: ['release'],
  verbose: true,
  // targets: ['windows-x64-14.15.3', 'windows-x86-14.15.3'],
  temp: "./.nexe",
  ico: "./public/favicon.ico",
  resources: [
    "./build",
    // "./public",
  ],
}).then(() => {
  console.log('compilation successful')
}).catch(err => {
  console.error('compilation err: ', err);
})