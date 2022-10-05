import React from 'react';
import { omit } from 'lodash';

export default function RawCustomsongsjson({ lastSavedSetlist = [], persistSetlist }) {
  const setlist = lastSavedSetlist.map(song => ({ ...song, randomID: undefined, isInstalled: undefined }));
  // const setlist = lastSavedSetlist.map(song => ({ ...song, isInstalled: undefined, randomID: undefined, bankPath: undefined}));
  // const customsongsjson = useMemo(() => JSON.stringify({ customLevelMusic: lastSavedSetlist}, null, 2), [check]);
const customsongsjson = JSON.stringify({ customLevelMusic: setlist.map(song => omit(song, [/*'BossMusic.bankPath', 'MainMusic.bankPath'*/]))}, null, 2);
  // console.log('??? lastSavedSetlist: ', lastSavedSetlist);
  return (
    <div className="customsongsjson-wrapper">
      <textarea readOnly value={customsongsjson} className="customsongsjson-output" style={{ minWidth: '100%', width: '100%', height: '500px'}}/>
      <div className="customsongsjson-buttons">
        <button className='btn btn-background' onClick={persistSetlist}>Save Setlist to Game Directory</button>
        &nbsp;
        <button className='btn btn-background' onClick={() => {navigator.clipboard.writeText(customsongsjson);}}>Copy customsongs.json to Clipboard</button>
      </div>
    </div>
  )
}