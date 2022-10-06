import React, { useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { GameTracks } from './constants';


export default function SongCard({allSongs, setAvailableSongs, setInstalledSongs, songInfo, warningToast}) {
  // console.log('song card with info: ', songInfo)
  const installItem = (currentItem, shouldInstall) => {
    if (shouldInstall) {
      let didInstall = false;
      setInstalledSongs(prevSongs => {
        const tempSongs = prevSongs.filter(song => song.MainMusic.Event !== currentItem.name && song.BossMusic.Event !== currentItem.name);
        const currentSong = allSongs.find(song => song.MainMusic.Event === currentItem.name && song.BossMusic.Event === currentItem.name);
        if (!!currentSong) {
          tempSongs.push({...currentSong, isInstalled: true});
          didInstall = true;
        }
        return tempSongs
      });
      if (didInstall) {
        setAvailableSongs(prevSongs => prevSongs.filter(prevSong => prevSong.MainMusic.Event !== currentItem.name && prevSong.BossMusic.Event !== currentItem.name));
      }
    } else {
      // should uninstall
      let didUninstall = false;
      setAvailableSongs(prevSongs => {
        const tempSongs = prevSongs.filter(song => song.MainMusic.Event !== currentItem.name && song.BossMusic.Event !== currentItem.name);
        const currentSong = allSongs.find(song => song.MainMusic.Event === currentItem.name && song.BossMusic.Event === currentItem.name);
        if (!!currentSong) {
          tempSongs.push({...currentSong, isInstalled: false});
          didUninstall = true;
        }
        return tempSongs
      });
      if (didUninstall) {
        setInstalledSongs(prevSongs => prevSongs.filter(prevSong => prevSong.MainMusic.Event !== currentItem.name && prevSong.BossMusic.Event !== currentItem.name));
      }
    }
  }

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: songInfo.LevelName,
      item: { name: songInfo.MainMusic.Event, type: songInfo.LevelName, randomID: songInfo.randomID },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      }),
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult();
        if (dropResult && dropResult.name === 'setlist') {
          installItem(item, true);
        } else if (dropResult && dropResult.name === 'modlist') {
          installItem(item, false);
        }
      }
    }),
    []
  )
  const installedClass = false; //songInfo.isInstalled ? ` installed-song` : '';
  const editSong = useCallback(() => {
    console.log(`Editing song: ${songInfo.LevelName}`);
    window.alert('Editing of songs is not yet implemented.');
  }, [JSON.stringify(songInfo)]);

  return (
    <div title={JSON.stringify(songInfo, null, 2)} ref={dragRef} visible={isDragging ? 'hidden' : 'visible'} hidden={isDragging} className={`draggable-song ${songInfo.LevelName.toLowerCase()}-background` + installedClass}>
      {/* <p>Level: {songInfo.LevelName}</p> */}
      <p className="bank-name">{songInfo.MainMusic.Bank}</p>
      {songInfo.isInstalled && <span className='edit-cog' title='Edit Song' onClick={editSong}>⚙</span>}
      <p className="bpm">{songInfo.MainMusic.BPM} BPM</p>
      {/* {JSON.stringify(songInfo)} */}
    </div>
  )
}