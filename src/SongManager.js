import { useCallback, useEffect, useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DebounceInput } from 'react-debounce-input';
import { Searcher } from 'fast-fuzzy';
import { debounce, get } from 'lodash';

import DropTarget from './DropTarget';
import SongCard from './SongCard';



export default function SongManager({ mods, setlist, setLastSavedSetlist, curGameDirectory, warningToast}) {
  // if (savedSetlist && Object.keys(savedSetlist).length > 0) {
  //   allSongs = savedSetlist;
  // } else {
  // }
  // console.log('allSongs: ', allSongs)
  const [songs, setSongs] = useState(setlist.concat(mods));
  const [installedSongs, setInstalledSongs] = useState(setlist);
  const [availableSongs, setAvailableSongs] = useState(mods);
  const [searchTerm, setSearchTerm] = useState('');

  let songSearcher = useMemo(() => new Searcher(availableSongs || [], { keySelector: (obj) => `${get(obj, 'LevelName')}${get(obj, 'MainMusic.Bank')}${get(obj, 'MainMusic.BPM')}`}), [availableSongs])

  // const updateSongs = (newSongs) => {
  //   const installedSongs = newSongs(songs).filter(s => s.isInstalled);
  //   console.log('installedSongs: ', installedSongs);
  //   setLastSavedSetlist((prevState) => newSongs(prevState));
  //   setSongs(newSongs);
  // }
  // useEffect(() => {
  //   setLastSavedSetlist(songs.filter(s => s.isInstalled));
  // }, [songs]);

  useEffect(() => {
    const allSongs = setlist.concat(mods);
    // console.log('allSongs: ', setlist, mods);
    setSongs(allSongs);
    setAvailableSongs(allSongs && allSongs.filter(s => !s.isInstalled) || [])
    setInstalledSongs(allSongs && allSongs.filter(s => s.isInstalled) || [])
  }, [mods, setlist]);

  // useEffect(() => {
    
  //   setAvailableSongs(songs && songs.filter(s => !s.isInstalled) || [])
  //   setInstalledSongs(songs && songs.filter(s => s.isInstalled) || [])
  //   // setSongs(installedSongs.concat(availableSongs));
  // }, [songs]);

  useEffect(() => {
    setLastSavedSetlist(installedSongs);
  }, [installedSongs])

  const clearSetlist = useCallback(() => {
    const uninstalledSongs = songs.map(s => ({ ...s, isInstalled: false }));
    setSongs(uninstalledSongs);
    setAvailableSongs(uninstalledSongs);
    setInstalledSongs([]);
    // setAvailableSongs(prevSongs => {
    //   const tempSongs = prevSongs.filter(song => !installedSongs.some(iSong => song.MainMusic.Event === iSong.MainMusic.Event && song.BossMusic.Event === iSong.BossMusic.Event));
    //   return tempSongs.concat(installedSongs);
    // });
  }, [songs]);

  const returnItemsForSetlist =
  // debounce(
    useCallback(
    (isInstalled) => {
    // const searchResult = 
    // console.log('??? search result: ', searchResult, availableSongs);
    let songsToMap = isInstalled ? installedSongs :
      !!searchTerm && searchTerm.length > 0 ? (songSearcher.search(searchTerm, availableSongs) || []) : availableSongs;

    return songsToMap.map(item => (
      <SongCard key={item.LevelName + '-' + item.MainMusic.Event + '-' + item.randomID} songInfo={item} allSongs={songs} setInstalledSongs={setInstalledSongs} setAvailableSongs={setAvailableSongs} />
    ));
  }
  , [searchTerm, JSON.stringify(availableSongs), JSON.stringify(installedSongs), JSON.stringify(songs)]);
  // , 150);

  const handleSearchInput = useCallback((e) => {
    setSearchTerm(e.target.value);
  });
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="main-files">
        <div className="available-mods">
            <div className="header mods-header">
              <p>Mods Folder:</p>
              <p>{curGameDirectory && curGameDirectory.includes('/') ? curGameDirectory + '/Mods' : curGameDirectory +'\\Mods'}</p>
              <div className="title mods-title"><DebounceInput minLength={2} debounceTimeout={300} type="search" onChange={handleSearchInput} placeholder="Search Mods: e.x. Stygia, Du Hast, etc..."/></div>
            </div>
            <DropTarget title='modlist' className='modlist'>
              {returnItemsForSetlist(false)}
            </DropTarget>
        </div>
        <div className="current-setlist">
            <div className="header setlist-header">
              <p className="title setlist-title">Current Setlist:</p>
              {/* <span className="refresh-btn setlist-refresh span-btn clear-btn" onClick={refreshSetlist}>Reload from Disk</span> */}
              {installedSongs.length > 0 && (
                <span className="clear-btn setlist-clear span-btn" style={{ marginLeft: '.5em'}} onClick={clearSetlist}>Clear Setlist</span>
              ) || <span>&nbsp;</span>}
            </div>
              <DropTarget title='setlist' className='setlist' warningToast={warningToast}>
                {returnItemsForSetlist(true)}
              </DropTarget>
        </div>
      </div>
      <div className='main-files-footer'></div>
    </DndProvider>
  )
}