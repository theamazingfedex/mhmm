const { compile } = require('nexe');
const packageJson = require('../package.json');
const fs = require('fs');
const version = packageJson.version;

const args = process.argv.slice(2);
let [major, minor, patch, extra] = version.split('.');
[patch, extra = ''] = patch.split('-');
if (args.includes('major')) { major = Number(major) + 1; minor = 0; patch = 0; extra = ''; }
if (args.includes('minor')) { minor = Number(minor) + 1; patch = 0; extra = ''; }
if (args.includes('patch')) { patch = Number(patch) + 1; extra = ''; }
if (args.includes('beta')) { extra = '-beta' }
if (args.includes('alpha')) { extra = '-alpha' }
const newVersion = `${major}.${minor}.${patch}${extra}`;
console.log('newVersion: ', newVersion);
if (version !== newVersion) {
  fs.writeFileSync('./package.json', JSON.stringify({...packageJson, version: newVersion}, null, 2));
}

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