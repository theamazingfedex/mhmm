const fs = require('fs');
const path = require('path');


const IS_DEBUGGING = process.argv.slice(2).includes('debug') || process.env.DEBUG;
function debugLog(...message) {
  if (IS_DEBUGGING) {
    console.log(new Date().toISOString(), ...message);
  }
}

const isAuthorized = (req, res, next) => {
  const error = new Error('Not Authorized.');
  try {
    // console.log(JSON.stringify(req.headers, null, 2))
    if (req.headers['x-i-am-a'] && req.headers['x-i-am-a'] === "Potato") {
      return next();
    } else {
      error.status = 401;
      console.log('Failed authorization attempt: ', JSON.stringify(req.headers));
      res.status(401).send(error.message);
      // return next(error);
    }
  } catch (e) {
    error.status = 403;
    console.log('Forbidden authorization attempt');
    res.status(403).send(error.message);
    // return next(error);
  }
};

const corsMiddleware = function (req, res, next) {
  // console.log('headers: ', Object.keys(req.headers));
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Expose-Headers", "Accept, X-I-Am-A");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, DNT, Referer, User-Agent, Content-Type, Accept, Authorization, X-I-Am-A" + (req.headers && req.headers.length > 0 ? ', ' + req.headers.join(', ') : ''));
  // res.header("Access-Control-Allow-Headers", );
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }
  return next();
}

// 400 bad-request middleware
const badRequestMiddleware = (req, res, next) => {
  if (!req.query || !req.query.path || req.query.path === undefined || req.query.path === null) {
    return res.status(400).send({ status: 400, message: 'Bad Request: Missing path query parameter' });
  }
  const pathQuery = req.query.path;
  if (pathQuery.length < 10 || !(pathQuery.includes('/') || pathQuery.includes('\\'))) {
    return res.status(400).send({ status: 400, message: 'Bad Request: Impossible path query parameter'});
  }
  next();
}

const getCustomsongData = (assetPath) => {
  const customsongsPath = path.join(assetPath, 'customsongs.json');
  let customsongsData = {};
  try {
    const data = fs.readFileSync(customsongsPath, 'utf-8')
    customsongsData = JSON.parse(data);

    const filesInPath = fs.readdirSync(assetPath)
    customsongsData.customLevelMusic = customsongsData.customLevelMusic.filter(song => {
      return filesInPath.some(file => {
        if (!path.basename(file).endsWith('.bank')) {
          return false;
        }
        // const bankName = path.basename(file).split('.').slice(0, -1).join('');
        // return song.MainMusic.Bank === bankName || song.BossMusic.Bank === bankName
        return file.includes(song.MainMusic.Bank) || file.includes(song.BossMusic.Bank);
      });
    });

  //   try {
  //   customsongsData.customLevelMusic = customsongsData.customLevelMusic.map(level => {
  //     level.MainMusic.bankPath = path.join(assetPath, level.MainMusic.Bank + '.bank');
  //     level.BossMusic.bankPath = path.join(assetPath, level.BossMusic.Bank + '.bank');
  //     level.isInstalled = assetPath.includes('StreamingAssets');
  //     return level;
  //   });
  // }catch(e){console.log('=======setting bankPath Failed')}
    // console.log('customsongdata.after: ', JSON.stringify(customsongsData, null, 2));
  } catch (e) {
    debugLog('getCustomsongData caught error: ', e);
  }
  return customsongsData;
};

const getFilenamesFromDir = (dirPath, extFilters) => {
    // console.log('Starting from dir '+dirPath+'/');
  let filesToReturn = [];

  if (!fs.existsSync(dirPath)) {
    console.log("no dir ", dirPath);
    return filesToReturn;
  }

  var files = fs.readdirSync(dirPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(dirPath, files[i]);
    // console.log('filename: ', filename);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory() && filename.includes('Mods')) {
        const foundFilesInDir = getFilenamesFromDir(filename, extFilters); //recurse

        if (foundFilesInDir.length > 0) filesToReturn = filesToReturn.concat(foundFilesInDir);

    // } else if (filename.endsWith('.bank') || filename.endsWith('customsongs.json')) {
    } else if (filename.endsWith('.bank')) {
      // try {
        let customsongdata = getCustomsongData(dirPath);
        if (customsongdata.customLevelMusic && customsongdata.customLevelMusic.length > 0) {

          customsongdata.customLevelMusic = customsongdata.customLevelMusic.map(level => {
            level.MainMusic.bankPath = path.join(dirPath, level.MainMusic.Bank + '.bank');
            level.BossMusic.bankPath = path.join(dirPath, level.BossMusic.Bank + '.bank');
            level.isInstalled = false;
            return level;
          });
        }
        console.log('!!!FindFiles returns: ', JSON.stringify(customsongdata, null, 2))
        if (customsongdata.customLevelMusic.length > 0) {
          filesToReturn.push({ filename, customsongsjson: JSON.stringify(customsongdata)});
        }
        // filesToReturn.push(customsongdata);

      // }catch(e) {
      // console.log('!!!ERROR: ', e);
      // }
      // console.log('pushing: ', filename);
    };
  };

  // console.log('returning files: ', filesToReturn);
  return filesToReturn//.flat(3);
};


module.exports = { IS_DEBUGGING, debugLog, getCustomsongData, corsMiddleware, badRequestMiddleware, isAuthorized, getFilenamesFromDir };