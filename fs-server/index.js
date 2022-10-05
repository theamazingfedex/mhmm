const express = require('express');
const fs = require('fs');
const path = require('path');
const { omit } = require('lodash');
const bodyParser = require('body-parser');
const { debugLog, getCustomsongData, corsMiddleware, badRequestMiddleware, isAuthorized, getFilenamesFromDir } = require('./helpers');

const app = express();
const port = 24069;

const defaultPath = './public';
const examplePath = 'J:\SteamLibrary\steamapps\common\Metal Hellsinger\Metal_Data\StreamingAssets'
const deploySlug = '\\Metal_Data\\StreamingAssets\\'

function MhmmFileserver() {

  app.options('/api/listFiles', corsMiddleware);
  app.use(corsMiddleware);
  app.use(isAuthorized);
  app.use(badRequestMiddleware);

  app.get("/api/listFiles", function (req, res) {
    const gameDirPath = decodeURIComponent(req.query.path);
    debugLog('listFiles connection!!');

    const files = getFilenamesFromDir(gameDirPath, ['.bank', '.json']);
    debugLog('returning files: ', JSON.stringify(files))
    // res.header('Content-Type', 'application/json');
    res.json(JSON.stringify(files.flat(100)));
  });

  app.get('/api/getSetlist', function (req, res) {
    const gameDirPath = decodeURIComponent(req.query.path);
    const customsongsPath = path.join(gameDirPath, deploySlug);
    debugLog('getSetlist connection!!');

    // res.header('Content-Type', 'application/json');
    res.json(JSON.stringify(getCustomsongData(customsongsPath)));
  });

  app.post('/api/updateSetlist', bodyParser.json({ type: "application/json" }), function (req, res) {
    const gameDirPath = decodeURIComponent(req.query.path);
    debugLog('gamedirpath: ', gameDirPath);
    const streamingAssetsPath = path.join(gameDirPath, deploySlug);
    debugLog('streamingAssetsPath: ', streamingAssetsPath);
    const customsongsPath = path.join(streamingAssetsPath, 'customsongs.json');
    debugLog('customsongsPath: ', customsongsPath);
    const newCustomsongs = req.body;
    debugLog('setting customsongsjson to: ', newCustomsongs);

    if (newCustomsongs.customLevelMusic) {
        // if they exist, lets clean up StreamingAssets of any old customsongs .bank files
        let existingCustomsongsjson = undefined

        if (fs.existsSync(customsongsPath)) {
          existingCustomsongsjson =  JSON.parse(fs.readFileSync(customsongsPath));
          // create backup of customsongs.json
          fs.renameSync(customsongsPath, customsongsPath + `.${Date.now()/1000}.bak`);
          const customsongsBackups = fs.readdirSync(streamingAssetsPath).filter(f => f.includes('.bak'));
          if (customsongsBackups.length > 5) {
            customsongsBackups.sort((a, b) => Number(a.split('.').slice(-2, -1)[0]) - Number(b.split('.').slice(-2, -1)[0])).slice(5)
            .forEach(extraneousBackup => fs.unlinkSync(path.join(streamingAssetsPath, extraneousBackup)));
          }
          if (newCustomsongs.customLevelMusic.length < 1) {
            // fs.unlinkSync(customsongsPath);
            debugLog('customsongs.json deleted. Backups located in StreamingAssets folder.');
          }
        }
        // TODO: first:
        // TODO: check the existing customsongsjson and move any Banks found to a new folder under the Mods folder (one folder per bank?) unless it already exists, along with the customsongs.json
        // TODO: 
        // TODO: per song:
        // TODO: check the customLevelMusic[i].MainMusic.isInstalled to see if we even have to do anything
        // TODO: then if isInstalled === false, check the MainMusic.bankPath and create a hardlink in StreamingAssets to bankPath (if StreamingAssets doesn't already include the bank)
        if (!!existingCustomsongsjson) {
          // try to back up the banks into /Mods folder
          existingCustomsongsjson.customLevelMusic.forEach((oldSong) => {
            if (newCustomsongs.customLevelMusic.some(newSong => newSong.MainMusic.Event === oldSong.MainMusic.Event && newSong.BossMusic.Event === oldSong.BossMusic.Event )) {
              return;
            }
            try {
              const possibleMainBankPath = oldSong.MainMusic.bankPath || path.join(gameDirPath, 'Mods', oldSong.MainMusic.Bank, (oldSong.MainMusic.Bank + '.bank'));
              debugLog('possibleMainBankPath: ', possibleMainBankPath);
              if (!fs.existsSync(possibleMainBankPath)) {
                if (!fs.existsSync(path.dirname(possibleMainBankPath))) {
                  fs.mkdirSync(path.dirname(possibleMainBankPath));
                }
                try {
                  fs.linkSync(path.join(streamingAssetsPath, oldSong.MainMusic.Bank + '.bank'), possibleMainBankPath)
                  fs.unlinkSync(path.join(streamingAssetsPath, oldSong.MainMusic.Bank + '.bank'));
                } catch (e) {
                  if (!JSON.stringify(e).includes('file already exists')) {
                    throw e;
                  }
                  fs.unlinkSync(path.join(streamingAssetsPath, oldSong.MainMusic.Bank + '.bank'));
                }
                const customsongsModpath = path.join(path.dirname(possibleMainBankPath), 'customsongs.json');
                debugLog('backup-main-customsongsModpath: ', customsongsModpath);
                if (!fs.existsSync(customsongsModpath)) {
                  fs.writeFileSync(customsongsModpath, JSON.stringify({ customLevelMusic: [omit(oldSong, ['MainMusic.bankPath', 'BossMusic.bankPath', 'isInstalled'])]}, null, 2));
                }
              } else if (fs.existsSync(path.join(streamingAssetsPath, oldSong.MainMusic.Bank + '.bank'))) {
                fs.unlinkSync(path.join(streamingAssetsPath, oldSong.MainMusic.Bank + '.bank'));
              }
              const possibleBossBankPath = oldSong.BossMusic.bankPath || path.join(gameDirPath, 'Mods', oldSong.BossMusic.Bank, (oldSong.BossMusic.Bank + '.bank'));
              debugLog('possibleBossBankPath: ', possibleBossBankPath);
              if (!fs.existsSync(possibleBossBankPath)) {
                if (!fs.existsSync(path.dirname(possibleBossBankPath))) {
                  fs.mkdirSync(path.dirname(possibleBossBankPath));
                }
                try {
                  fs.linkSync(path.join(streamingAssetsPath, oldSong.BossMusic.Bank + '.bank'), possibleBossBankPath);
                  fs.unlinkSync(path.join(streamingAssetsPath, oldSong.BossMusic.Bank + '.bank'));
                } catch (e) {
                  if (!JSON.stringify(e).includes('file already exists')) {
                    throw e;
                  }
                  fs.unlinkSync(path.join(streamingAssetsPath, oldSong.BossMusic.Bank + '.bank'));
                }
                const customsongsModpath = path.join(path.dirname(possibleBossBankPath), 'customsongs.json');
                debugLog('backup-boss-customsongsModpath: ', customsongsModpath);
                if (!fs.existsSync(customsongsModpath)) {
                  fs.writeFileSync(customsongsModpath, JSON.stringify({ customLevelMusic: [oldSong]}, null, 2));
                }
              } else if (fs.existsSync(path.join(streamingAssetsPath, oldSong.BossMusic.Bank + '.bank'))) {
                  fs.unlinkSync(path.join(streamingAssetsPath, oldSong.BossMusic.Bank + '.bank'));
              }
              // if (possibleBossBankPath === possibleMainBankPath) {
              //   fs.writeFileSync(path.join(path.dirname(possibleMainBankPath), 'customsongs.json'), JSON.stringify(existingCustomsongsjson, null, 2));
              // } else {
              //   // fs.writeFileSync(path.join(path.dirname(possibleMainBankPath), 'customsongs.json'), JSON.stringify({ customLevelMusic: [song]}, null, 2));
              //   // fs.writeFileSync(path.join(path.dirname(possibleBossBankPath), 'customsongs.json'), JSON.stringify({ customLevelMusic: [song]}, null, 2));
              // }
              // remove existing
              // fs.rmSync(path.join(streamingAssetsPath, song.MainMusic.Bank, '.bank'));
              // fs.rmSync(path.join(streamingAssetsPath, song.BossMusic.Bank, '.bank'));
            } catch (error) {
              if (!JSON.stringify(error).includes('file already exists')) {
                throw error;
              }
            }
            // song.
          })
        }
          newCustomsongs.customLevelMusic.forEach(song => {
        try {
            const mainPath = song.MainMusic.bankPath;
            const bossPath = song.BossMusic.bankPath;

            const mainDeploymentPath = path.join(streamingAssetsPath, path.basename(mainPath));
            const bossDeploymentPath = path.join(streamingAssetsPath, path.basename(bossPath))

            if (mainPath !== bossPath) {
              const mainMusicBankSourceDir = path.dirname(mainPath);
              const bossMusicBankSourceDir = path.dirname(bossPath);

              if (!mainMusicBankSourceDir.includes('StreamingAssets') && !fs.existsSync(mainDeploymentPath)) {
                // do the hardlink stuff
                fs.linkSync(mainPath, mainDeploymentPath);
              }
              if (!bossMusicBankSourceDir.includes('StreamingAssets') && !fs.existsSync(bossDeploymentPath)) {
                // do the hardlink stuff
                fs.linkSync(bossPath, bossDeploymentPath);
              }
            } else {
              // const mainMusicBankSourceDir = path.dirname(song.MainMusic.bankPath);
              // do the hardlink stuff
              if (!mainPath.includes('StreamingAssets') && !fs.existsSync(mainDeploymentPath)) {
                // do the hardlink stuff
                fs.linkSync(mainPath, mainDeploymentPath);
              }
            }
        } catch (error) {
          if (!JSON.stringify(error).includes('file already exists')) {
            throw error;
          }
        }
          });

        if (newCustomsongs.customLevelMusic.length > 0) {
          fs.writeFileSync(customsongsPath, JSON.stringify({
            ...newCustomsongs,
            customLevelMusic: newCustomsongs.customLevelMusic.map(song =>
              omit(song, [/*'BossMusic.bankPath', 'MainMusic.bankPath',*/ 'isInstalled'])
            )}, null, 2));

          console.log('customsongs.json updated and .banks deployed to StreamingAssets. Time to shred!');
        } else {
          console.log('Nothing deployed. Hmm, maybe something went wrong? If errors continue, run the app from a terminal with the debug flag `./mhmm.exe --debug` and open an issue on GitHub.');
        }
    }

    res.json(true)
  });

  // read streamingAssets/customsongs.json to determine which songs are currently modded.

  // write streamingAssets/customsongs.json with custom payload from client.

  // suicide endpoint -- to shut down via a button in the UI.
  app.listen(port, function() {
    console.log('Filesystem API Ready');
  });
};

module.exports = MhmmFileserver;