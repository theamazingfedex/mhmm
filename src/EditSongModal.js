import React, { useState, useCallback } from 'react';
import Modal from 'react-modal';
import { levelNamesArr } from './constants';
import { debounce } from 'lodash';

export default function EditSongModal({ songInfo, isModalOpen, setIsModalOpen, updateSong }) {

  const [customOffsetMain, setCustomOffsetMain] = useState(songInfo.MainMusic.BeatInputOffset || 0.0);
  const [customOffsetBoss, setCustomOffsetBoss] = useState(songInfo.BossMusic.BeatInputOffset || 0.0);
  const [customBPMMain, setCustomBPMMain] = useState(songInfo.MainMusic.BPM || 0);
  const [customBPMBoss, setCustomBPMBoss] = useState(songInfo.BossMusic.BPM || 0);
  const [customLevel, setCustomLevel] = useState(songInfo.LevelName || 'Stygia');
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setCustomLevel(songInfo.LevelName || 'Stygia');
    setCustomOffsetMain(songInfo.MainMusic.BeatInputOffset || 0.0);
    setCustomOffsetBoss(songInfo.BossMusic.BeatInputOffset || 0.0);
    setCustomBPMMain(songInfo.MainMusic.BPM || 0);
    setCustomBPMBoss(songInfo.BossMusic.BPM || 0);
  }, [customOffsetMain, customLevel, songInfo]);

  const clearLevelInput = useCallback((e) => {
    e.target.value = '';
    setCustomLevel(songInfo.LevelName);
  }, [songInfo]);

  const doSave = useCallback(() => {
    const newSong = { ...songInfo };
    let updated = false;

    if (songInfo.LevelName !== customLevel && levelNamesArr.includes(customLevel)) {
      newSong.oldLevelName = songInfo.oldLevelName || songInfo.LevelName;
      newSong.LevelName = customLevel;
      updated = true;
    }
    if (Number(songInfo.MainMusic.BeatInputOffset) !== Number(customOffsetMain)) {
      newSong.MainMusic.oldBeatInputOffset = songInfo.MainMusic.oldBeatInputOffset || songInfo.MainMusic.BeatInputOffset;
      newSong.MainMusic.BeatInputOffset = customOffsetMain;
      updated = true;
      // if (songInfo.BossMusic.Event === songInfo.MainMusic.Event) {
      //   newSong.BossMusic.BeatInputOffset = customOffsetMain;
      // }
    }
    if (Number(songInfo.BossMusic.BeatInputOffset) !== Number(customOffsetBoss)) {
      newSong.MainMusic.oldBeatInputOffset = songInfo.MainMusic.oldBeatInputOffset || songInfo.MainMusic.BeatInputOffset;
      newSong.MainMusic.BeatInputOffset = customOffsetMain;
      updated = true;
    }
    if (Number(songInfo.MainMusic.BPM) !== Number(customBPMMain)) {
      newSong.MainMusic.oldBPM = songInfo.MainMusic.oldBPM || songInfo.MainMusic.BPM;
      newSong.MainMusic.BPM = customBPMMain;
      updated = true;
    }
    if (Number(songInfo.BossMusic.BPM) !== Number(customBPMBoss)) {
      newSong.BossMusic.oldBPM = songInfo.BossMusic.oldBPM || songInfo.BossMusic.BPM;
      newSong.BossMusic.BPM = customBPMBoss;
      updated = true;
    }
    if (updated) {
      // console.log(`Saving: offset: ${customOffset}; level: ${customLevel}!`);
      // console.log('Updating song...');
      // console.log('oldSong: ', songInfo);
      // console.log('newSong: ', newSong);
      updateSong(newSong);
      closeModal();
    } else {
      window.alert('Nothing to update!');
      // console.log(`Saving: offset: ${customOffset}; level: ${customLevel}!`);
      // console.log('Nothing to update...');
      // console.log('oldSong: ', songInfo);
      // console.log('newSong: ', newSong);
    }
  }, [songInfo, updateSong, customLevel, customOffsetMain, customOffsetBoss, customBPMBoss, customBPMMain]);

  const revertSong = useCallback(() => {
    let didUpdate = false;
    const songToRevert = { ...songInfo };

    if (!songInfo.oldLevelName && !songInfo.MainMusic.oldBeatInputOffset) {
      console.log('resetting unset values; songInfo:', songInfo)
      setCustomLevel(songInfo.LevelName);
      setCustomOffsetMain(songInfo.MainMusic.BeatInputOffset);
      return;
    }
    if (songInfo.oldLevelName && songInfo.oldLevelName !== songInfo.LevelName) {
      songToRevert.LevelName = songInfo.oldLevelName;
      songToRevert.oldLevelName = undefined;
      didUpdate = true;
    }
    if (songInfo.MainMusic.oldBeatInputOffset && songInfo.MainMusic.oldBeatInputOffset !== songInfo.MainMusic.BeatInputOffset) {
      songToRevert.MainMusic.BeatInputOffset = songInfo.MainMusic.oldBeatInputOffset;
      songToRevert.MainMusic.oldBeatInputOffset = undefined;
      didUpdate = true;
    }
    if (songInfo.BossMusic.oldBeatInputOffset && songInfo.BossMusic.oldBeatInputOffset !== songInfo.BossMusic.BeatInputOffset) {
      songToRevert.BossMusic.BeatInputOffset = songInfo.BossMusic.oldBeatInputOffset;
      songToRevert.BossMusic.oldBeatInputOffset = undefined;
      didUpdate = true;
    }
    if (songInfo.MainMusic.oldBPM && songInfo.MainMusic.oldBPM !== songInfo.MainMusic.BPM) {
      songToRevert.MainMusic.BPM = songInfo.MainMusic.oldBPM;
      songToRevert.MainMusic.oldBPM = undefined;
      didUpdate = true;
    }
    if (songInfo.BossMusic.oldBPM && songInfo.BossMusic.oldBPM !== songInfo.BossMusic.BPM) {
      songToRevert.BossMusic.BPM = songInfo.BossMusic.oldBPM;
      songToRevert.BossMusic.oldBPM = undefined;
      didUpdate = true;
    }
    if (didUpdate) {
      updateSong(songToRevert)
    }
  }, [songInfo, updateSong, customLevel, customOffsetMain]);

  return (
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel={`Edit ${songInfo.MainMusic.Bank}`}
        ariaHideApp={false}
      >
        <div className="modal-content">
          <span className="clear-btn" onClick={closeModal}>X</span>
          <div className={`modal-editor ${customLevel.toLowerCase() || songInfo.LevelName.toLowerCase()}-background`}>
            <h1>Editing {songInfo.MainMusic.Bank}</h1>
            <div className="levelName-editor song-editor-item">
              <span className="levelName-label">Level: {songInfo.LevelName}</span>
              <span className="levelName-arrow right-arrow-green">→</span>
              <datalist id="levelName-editor">
                {levelNamesArr.map(levelName => <option value={levelName} key={levelName}/>)}
              </datalist>
              <input
                type="text"
                name="levelName"
                placeholder={`${songInfo.LevelName}`}
                list="levelName-editor"
                className="editor-input levelName-input"
                onChange={(e) => setCustomLevel(e.target.value)}
                onBlur={(e) => setCustomLevel(e.target.value)}
                onFocus={clearLevelInput}
                onClick={clearLevelInput}
                />
            </div>
            <div className="offset-editor song-editor-item">
              <span className="offset-label">MainMusic Beat Input Offset: {songInfo.MainMusic.BeatInputOffset}</span>
              <span className="offset-arrow right-arrow-green">→</span>
              <input className="editor-input offset-input" type="number" step="0.01" min='-5' max='5' value={customOffsetMain} onChange={(e) => { setCustomOffsetMain(Number(e.target.value)) }}/>
            </div>
            <div className="offset-editor song-editor-item">
              <span className="offset-label">BossMusic Beat Input Offset: {songInfo.MainMusic.BeatInputOffset}</span>
              <span className="offset-arrow right-arrow-green">→</span>
              <input className="editor-input offset-input" type="number" step="0.01" min='-5' max='5' value={customOffsetBoss} onChange={(e) => { setCustomOffsetBoss(Number(e.target.value)) }}/>
            </div>
            <div className="offset-editor song-editor-item">
              <span className="offset-label">MainMusic BPM: {songInfo.MainMusic.BPM}</span>
              <span className="offset-arrow right-arrow-green">→</span>
              <input className="editor-input offset-input" type="number" step="1" min='0' max='420' value={customBPMMain} onChange={(e) => { setCustomBPMMain(Number(e.target.value)) }}/>
            </div>
            <div className="offset-editor song-editor-item">
              <span className="offset-label">BossMusic BPM: {songInfo.BossMusic.BPM}</span>
              <span className="offset-arrow right-arrow-green">→</span>
              <input className="editor-input offset-input" type="number" step="1" min='0' max='420' value={customBPMBoss} onChange={(e) => { setCustomBPMBoss(Number(e.target.value)) }}/>
            </div>
            {(!!songInfo.oldLevelName || !!songInfo.MainMusic.oldBeatInputOffset) && (
              <button onClick={revertSong}>Revert to Default</button>
            )}
          </div>
          {/* <p>Boss Music: {songInfo.BossMusic.Bank}</p> */}
          <div className="modal-buttons">
            <div className="btn btn-background" onClick={doSave}><p>Save</p></div>
            <div className="btn btn-background" onClick={closeModal}><p>Cancel</p></div>
          </div>
        </div>
      </Modal>
  )
}