import React, { Component, useState, useCallback, useEffect, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toast';
import { has, debounce, omit } from 'lodash';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';

import './App.css';
import SongManager from './SongManager';
import RawCustomsongsjson from './RawCustomsongsjson';
import loadingGif from './loading.gif';
import mhsLogo from './metalhellsinger-mm-logo-2022.png';
import mhsIcon from './mhs-icon.png';
// import { version } from '../package.json';
const version = require('../package.json').version;
// const loadingGif = 'http://localhost:3000/public/loading.gif';

const uuid = require('uuid').v4;

const levelNames = ['Voke', 'Stygia', 'Incaustis', 'Yhelm', 'Gehenna', 'Nihil', 'Acheron', 'Sheol'];
const githubReleasesUrl = 'https://api.github.com/repos/theamazingfedex/mhmm/releases/latest';
const toastTimeout = 5000;
const toastDebounce = 150;
const initialState = {
  installDirInput: "",
  mods: [],
  curGameDirectory: '',
  setlist: [],
};
const normalizePath = path => path.replace(/[\\/]+/g, '/');

let needsToUpdatePromise =
  fetch(githubReleasesUrl, { method: 'GET', headers: { Accept: 'application/vnd.github+json' }})
    .then((res) => {
      return res.json().then(latestRelease => {
        // console.log('latestReleases: ', latestRelease);
        let needsToUpdate = false;
        const latestVersion = latestRelease.tag_name.split('-')[0];

        let latestExtra = '';
        const [latestMajor, latestMinor, latestPatch] = latestVersion.split('.');
        [latestPatch, latestExtra = ''] = latestPatch.split('-');

        let curExtra = '';
        const [curMajor, curMinor, curPatch] = version.split('.');
        [curPatch, curExtra = ''] = curPatch.split('-');

        if (Number(latestMajor) > Number(curMajor)) {
          needsToUpdate = true;
        } else if (Number(latestMinor) > Number(curMinor)) {
          needsToUpdate = true;
        } else if (Number(latestPatch) > Number(curPatch)) {
          needsToUpdate = true;
        } else if (latestExtra.length < curExtra.length) {
          needsToUpdate = true;
        }

        console.log(`Latest Version: ${latestVersion}`);
        console.log(`Current Version: v${version}`);
        console.log('Needs to update?: ', needsToUpdate)
        return needsToUpdate;
      }).catch(e => console.log('ERROR: ', e));
    })
    .catch(e => console.log('ERROR: ', e));

function App() {
// class App extends Component {
  // constructor(args) {
  //   super(args);
  //   this.setState(initialState);
  // }
  const [installDirInput, setInstallDirInput] = useState(initialState.installDirInput);
  const [mods, setAvailableMods] = useState(initialState.mods);
  const [curGameDirectory, setCurGameDirectory] = useState(localStorage.getItem('curGameDirectory') || initialState.curGameDirectory);
  const [setlist, setSetlist] = useState(initialState.setlist)
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedSetlist, setLastSavedSetlist] = useState(JSON.parse(localStorage.getItem('lastSavedSetlist') || '[]') || []);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    (async () => {
      const value = await needsToUpdatePromise;
      // console.log('needs update??? ', value);
      setNeedsUpdate(value);
    })();
  }, []);

  // const reloadLastSavedSetlist = useCallback(() => {
  //   setLastSavedSetlist(JSON.parse(localStorage.getItem('lastSavedSetlist') || '{}'));
  // }, []);

  const handleInput = event => {
    setInstallDirInput(event.target.value);
  }

  const logValue = () => {
    console.log(installDirInput);
  }
  const showSaveFailureToast = debounce((message) => toast.error('ERROR: Saving \'customsongs.json\' failed.\n' + message), toastDebounce, { maxWait: toastTimeout+1});
  const showSaveSuccessToast = debounce(() => toast.success(`Saved 'customsongs.json' successfully.`), toastDebounce, { maxWait: toastTimeout+1});
  const showDupeSongInSetlistToast = debounce((level) => toast.warn(`Remove the setlist item for the level ${level} and try again.`), toastDebounce, {maxWait: toastTimeout+1});
  const showEditSuccessToast = debounce((songName) => toast.success(`Track: "${songName}" has been updated in the Setlist.`), toastDebounce, {maxWait: toastTimeout+1});

  const saveSetlistToDisk = useCallback(async () => {
    const gameDirPath = encodeURIComponent(curGameDirectory);
    const setlist = lastSavedSetlist.map(song => omit(song, 'randomID'));
    // const setlist = lastSavedSetlist.map(song => ({ ...song, isInstalled: undefined, randomID: undefined, bankPath: undefined}));
    await fetch(`http://localhost:24069/api/updateSetlist?path=${gameDirPath}`, { body: JSON.stringify({ customLevelMusic: setlist }), method: 'POST', headers: { "Content-Type": "application/json", Accept: "application/json", "X-I-Am-A": "Potato" }}).then(async res => {
      if (await res.json()) {
        showSaveSuccessToast();
      } else {
        showSaveFailureToast(`Response Code: ${res.status}`);
      }
    }).catch((e) => {
      showSaveFailureToast(JSON.stringify(e))
    });
  }, [curGameDirectory, curGameDirectory !== '', lastSavedSetlist]);

  const getSetList = useCallback(async () => {
    const gameDirPath = encodeURIComponent(curGameDirectory);
    const files = await fetch(`http://localhost:24069/api/getSetlist?path=${gameDirPath}`, { method: 'GET', headers: { Accept: "application/json", "X-I-Am-A": "Potato" }}).then(async res => {
      if (res.status !== 200) {
        return [];
      }
      // console.log('res: ', res);
      const { customLevelMusic } = JSON.parse(await res.json());
      // console.log('res.body: ', customLevelMusic);
      // TODO: build the setlist based on the base game setlist, overridden by customsongs.json
      // return customLevelMusic;
      return customLevelMusic.map((s, _, arr) => {
        s.isInstalled = true;
        s.randomID = uuid();
        // s.bankPath = normalizePath(curGameDirectory).concat('/Metal_Data/StreamingAssets/', s.MainMusic.Bank, '.bank');
        // p.customsongsjson.customLevelMusic.forEach(s => s.isInstalled = false);
        return s;
      })
    }).catch(err => {
      console.log('Failed to connect to Filesystem API', err);
      return [];
    });
    // console.log('setting setlist: ', files);
    setSetlist(files);
    // this.setState({ files: files || [] });
  }, [curGameDirectory, curGameDirectory !== '', mods]);

  const getAvailableMods = useCallback(async () => {
    const path = encodeURIComponent(curGameDirectory);
    const files = await fetch(`http://localhost:24069/api/listFiles?path=${path}`, { method: 'GET', headers: { Accept: "application/json", "X-I-Am-A": "Potato" }}).then(async res => {
      if (res.status !== 200) {
        return [];
      }
      const response = await res.json();
      // console.log(`res: ${response}`);

      let foundMods = response; //JSON.parse(await res.json());
      if (foundMods.length < 1) {
        return [];
      }
      foundMods = JSON.parse(response);
      // while (typeof modPaths === 'array' || typeof modPaths === 'object') {
        // console.log('typeof modpaths; ', typeof modPaths)
        // modPaths = modPaths.flat();
        // modPaths = modPaths.flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat()
      // }
      // modPaths = modPaths.map((mp) => ({ banks: mp.filter(p => p.includes('.bank')), customsongs: mp.find(p => p.includes('customsongs.json')) }))

      // console.log('foundMods: ', foundMods);
      // console.log('foundMods.type: ', typeof foundMods);
      return foundMods.map((p, _, arr) => {
        // console.log('iterating mod: ', p);
        // return { ...p, isInstalled: false, randomID: uuid() };
        let customsongs = JSON.parse(p.customsongsjson).customLevelMusic;
        // console.log('p:: ', customsongs);
        // if (!has(p, 'customsongsjson.customLevelMusic') && p.customsongsjson.customLevelMusic.length < 1) {
        //   return p;
        // }
        customsongs = customsongs.map(s => {
          s.isInstalled = false;
          // if (!arr.includes(p => p.MainMusic.Event === s.MainMusic.Event && p.BossMusic.Event === s.BossMusic.Event)) {
          s.randomID = uuid();
          // }
          // if (!s.bankPath) {
          //   s.bankPath = p.filename
            // s.bankPath = normalizePath(curGameDirectory).concat('/Metal_Data/StreamingAssets/', s.MainMusic.Bank, '.bank');
          // }
          return s;
        });
        return customsongs;
      }).flat();
      // .filter(f => {
      //   return !!f.customsongsjson && f.customsongsjson.length > 0;
      //   // if (!!s.randomID)
      //   // console.log('S:: ', s);
      //   // return !!s.randomID
      // });
    }).catch(err => {
      console.log('Failed to connect to Filesystem API', err);
      return [];
    });
    // console.log('setting modlist: ', files);
    setAvailableMods(files);
    // this.setState({ files: files || [] });
  }, [curGameDirectory, curGameDirectory !== '']);

  useMemo(async () => {
    if (isLoading || curGameDirectory !== undefined) {
      getAvailableMods();
      getSetList();
      setIsLoading(false);
    }
  }, [curGameDirectory, isLoading]);

  useEffect(() => {
    // console.log('curGameDirectory: ', curGameDirectory);
    if (curGameDirectory !== undefined && curGameDirectory.length > 0) {
      localStorage.setItem('curGameDirectory', curGameDirectory);
    }
  }, [curGameDirectory]);

  // render() {
    return (
      <div className="App">
          <img src={mhsLogo} className="logo" alt="Metal: Hellsinger" />
          <div className="content-wrapper">
            {needsUpdate && (
              <div className="update-required-banner" onClick={() => {window.location.href='https://github.com/theamazingfedex/mhmm/releases'}} style={{cursor: 'pointer'}} title="Download latest version">
                UPDATE AVAILABLE &nbsp;-&nbsp;
                <a href="https://github.com/theamazingfedex/mhmm/releases">Click HERE to go to latest releases</a>
                <span className="dismiss-update" title="Dismiss" onClick={(e) => {setNeedsUpdate(false); e.stopPropagation();}}>&nbsp;x&nbsp;</span>
              </div>
              )}
            {!!curGameDirectory ? (
              <div>
                <p>Current Game Directory:  </p>
                <p>{curGameDirectory} &nbsp;&nbsp;<span className="clear-btn" title="Reset and choose a new directory" onClick={() => setCurGameDirectory(undefined)}>X</span></p>
              </div>
            ) : (
              <div className="game-dir-picker">
                <p>
                  Choose your Metal: Hellsinger installation directory:
                </p>
                <input className="install-dir-input" onChange={handleInput} placeholder="e.x. C:\SteamLibrary\steamapps\common\Metal Hellsinger"/>
                <button className="btn btn-background" onClick={() => {setCurGameDirectory(installDirInput); setInstallDirInput(undefined); setIsLoading(false);}}>Load Game Directory</button>
              </div>
            )}
            <div className="files-wrapper">
              <button className="btn btn-background" onClick={() => {getAvailableMods(); getSetList();}}>Reload All</button>
              {/* {<button onClick={() => {reloadLastSavedSetlist()}}>Load Previous Setlist</button>} */}
              {/* {!!lastSavedSetlist && Object.keys(lastSavedSetlist).length > 0 && <button onClick={() => {setLastSavedSetlist()}}>Load Previous Setlist</button>} */}
              <SongManager mods={mods} setlist={setlist} curGameDirectory={curGameDirectory} setLastSavedSetlist={setLastSavedSetlist} warningToast={showDupeSongInSetlistToast} showEditSuccessToast={showEditSuccessToast}/>
            </div>
          </div>
          {!isExportOpen && (
            <div className="export-toggle btn-background" onClick={() => { setIsExportOpen(true); window.scrollTo(0,0);}}><img src={mhsIcon}className="export-icon export-icon-left"/><span>Export Setlist</span><img src={mhsIcon}className="export-icon export-icon-right"/></div>
          )}
          <Drawer
            open={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            direction='bottom'
            className='background export-drawer'
          >
            {/* <img src={mhsIcon} className="App-logo"/> */}
            <span className="clear-btn" onClick={() => setIsExportOpen(false)}>X</span>
            <p>Generated customsongs.json:</p>
            <RawCustomsongsjson lastSavedSetlist={lastSavedSetlist} persistSetlist={saveSetlistToDisk}/>
          </Drawer>
        <ToastContainer position="bottom-center" delay={toastTimeout}/>
      </div>
    );
  // }
}

export default App;
