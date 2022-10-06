import React from 'react';
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
          tempSongs.push(currentSong);
          didInstall = true;
        }
        return tempSongs
        // if some already installed song
        // return [...prevSongs, ]
        // return prevSongs.map(prevSong => {

        // });
        // if(!prevSong.isInstalled && (prevSong.MainMusic.Event === currentItem.name && prevSong.BossMusic.Event === currentItem.name);
      });
      if (didInstall) {
        setAvailableSongs(prevSongs => prevSongs.filter(prevSong => prevSong.MainMusic.Event !== currentItem.name && prevSong.BossMusic.Event !== currentItem.name));
        // console.log('setting available songs to filter out currentItem.type: ', currentItem.type);
      }
    } else {
      // should uninstall
      let didUninstall = false;
      setAvailableSongs(prevSongs => {
        const tempSongs = prevSongs.filter(song => song.MainMusic.Event !== currentItem.name && song.BossMusic.Event !== currentItem.name);
        const currentSong = allSongs.find(song => song.MainMusic.Event === currentItem.name && song.BossMusic.Event === currentItem.name);
        if (!!currentSong) {
          tempSongs.push(currentSong);
          didUninstall = true;
        }
        return tempSongs
      });
      if (didUninstall) {
        setInstalledSongs(prevSongs => prevSongs.filter(prevSong => prevSong.MainMusic.Event !== currentItem.name && prevSong.BossMusic.Event !== currentItem.name));
      }

    }

    // setSongs((prevState) => {
    //   // console.log('prevState: ', prevState);
    //   // let tempState = prevState;

    //   if (!isInstalled && prevState.some(prevSong => {
    //     return false;
    //     return !prevSong.isInstalled && (prevSong.MainMusic.Event === currentItem.name && prevSong.BossMusic.Event === currentItem.name);
    //   })) {
    //     return prevState;
    //     // return prevState.filter(pSong =>  !(!pSong.isInstalled && (pSong.MainMusic.Event === currentItem.name && pSong.BossMusic.Event === currentItem.name)));
    //   } else {
    //     return prevState.map(e => {
    //       return {
    //         ...e,
    //         // TODO: this is why the first load of setlist is funky sometimes, because this only gets set later, not at initial load:
    //         // isInstalled: (e.MainMusic.Event === currentItem.name && e.LevelName === currentItem.type) ? isInstalled : e.isInstalled,
    //         isInstalled: (isInstalled ? (e.MainMusic.Event === currentItem.name && e.LevelName === currentItem.type) : e.randomID === currentItem.randomID) ? isInstalled : e.isInstalled,
    //       }
    //     });
      // }
      // .filter((e) => {
      //   if (!tempState.includes(s => s.MainMusic.Event === e.MainMusic.Event || s.BossMusic.Event === e.BossMusic.Event)) {
      //     tempState.push(e);
      //     return true;
      //   }
      //   return false;
      //   // if (acc[currentItem.name] && acc[currentItem.name] > 1 && !isInstalled && !e.isInstalled && currentItem.randomID === e.randomID && (currentItem.name === e.MainMusic.Event || currentItem.name === e.BossMusic.Event)) {
      //   //   removedDupe = true;
      //   // }
      //   // else if (!tempState.includes(song => song.MainMusic.Event === currentItem.name && song.BossMusic.Event === currentItem.name)) {
      //   //   // if (acc[currentItem.name] && acc[currentItem.name] < 1) {
      //   //     acc[currentItem.name] += 1;
      //   //     tempState.push(e);
      //   //   // }
      //   //   // return true;
      //   // }
      //   // return acc
      // });
      // console.log('!?! new state: ', newState);
    // });
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
  return (
    <div title={JSON.stringify(songInfo, null, 2)} ref={dragRef} visible={isDragging ? 'hidden' : 'visible'} hidden={isDragging} className="draggable-song">
      <p>Level: {songInfo.LevelName}</p>
      <p>{songInfo.MainMusic.Bank}</p>
      {/* {JSON.stringify(songInfo)} */}
    </div>
  )
}