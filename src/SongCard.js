import React, { useState, useCallback, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { GameTracks } from './constants';
import EditSongModal from './EditSongModal';


export default function SongCard({allSongs, setAvailableSongs, setInstalledSongs, songInfo, showEditSuccessToast}) {
  // console.log('song card with info: ', songInfo)
  const installItem = useCallback((currentItem, shouldInstall) => {
    if (shouldInstall) {
      let didInstall = false;
      setInstalledSongs(prevSongs => {
        const tempSongs = prevSongs.filter(song => song.MainMusic.Event !== currentItem.name && song.BossMusic.Event !== currentItem.bossname);
        const currentSong = allSongs.find(song => song.MainMusic.Event === currentItem.name && song.BossMusic.Event === currentItem.bossname);
        if (!!currentSong) {
          tempSongs.push({...currentSong, isInstalled: true});
          didInstall = true;
        }
        return tempSongs
      });
      if (didInstall) {
        setAvailableSongs(prevSongs => prevSongs.filter(prevSong => prevSong.MainMusic.Event !== currentItem.name && prevSong.BossMusic.Event !== currentItem.bossname));
      }
    } else {
      // should uninstall
      setAvailableSongs(prevSongs => {
        const songAlreadyAvailable = prevSongs.some(song => song.MainMusic.Event !== currentItem.name && song.BossMusic.Event !== currentItem.bossname);
        const tempSongs = [...prevSongs];
        if (songAlreadyAvailable) {
          const currentSong = allSongs.find(song => song.MainMusic.Event === currentItem.name && song.BossMusic.Event === currentItem.bossname);
          if (!currentSong) {
            tempSongs.push({...currentSong, isInstalled: false});
          }
        }
        return tempSongs
      });
      setInstalledSongs(prevSongs => prevSongs.filter(prevSong => prevSong.MainMusic.Event !== currentItem.name && prevSong.BossMusic.Event !== currentItem.bossname));
    }
  }, [allSongs]);

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: songInfo.LevelName,
      item: { name: songInfo.MainMusic.Event, bossname: songInfo.BossMusic.Event, type: songInfo.LevelName, randomID: songInfo.randomID },
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
    [songInfo]
  )

  const [isModalOpen, setIsModalOpen] = useState(false);
  const installedClass = songInfo.isInstalled ? ` installed-song` : '';
  const editSong = useCallback(() => {
    // console.log(`Editing song: ${songInfo.MainMusic.Bank}`);
    // window.alert('Editing of songs is not yet implemented.');
    setIsModalOpen(true);
  }, [JSON.stringify(songInfo)]);

  const updateSong = useCallback((updatedSong) => {
    const installedSongs = allSongs.filter(s => s.isInstalled);

    installedSongs.push(updatedSong);
    setInstalledSongs(prevSongs => {
      const tempSongs = prevSongs.filter(s => s.MainMusic.Event !== updatedSong.MainMusic.Event && s.BossMusic.Event !== updatedSong.BossMusic.Event)
      tempSongs.push(updatedSong);
      return tempSongs;
    });
    showEditSuccessToast(updatedSong.MainMusic.Bank);
  }, [JSON.stringify(songInfo), allSongs]);

  const levelName = useMemo(() => songInfo.LevelName.toLowerCase(), [songInfo]);

  return (
    <div title={JSON.stringify(songInfo, null, 2)} ref={dragRef} visible={isDragging ? 'hidden' : 'visible'} hidden={isDragging} className={`draggable-song ${levelName}-background` + installedClass}>
      {/* <p>Level: {songInfo.LevelName}</p> */}
      <p className="bank-name">{songInfo.MainMusic.Bank}</p>
      {songInfo.isInstalled && <span className='edit-cog' title='Edit Song' onClick={editSong}>⚙</span>}
      <p className="bpm">{songInfo.MainMusic.BPM} BPM</p>
      {/* {JSON.stringify(songInfo)} */}
      <EditSongModal songInfo={songInfo} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} updateSong={updateSong} />
    </div>
  )
}