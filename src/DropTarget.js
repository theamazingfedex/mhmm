import React, { useEffect, useState, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { GameTracks, levelNamesArr } from './constants';

export default function DropTarget({ title, className, warningToast, children}) {
  const [isHovering, setIsHovering] = useState(false);

  const [{ isOver }, drop] = useDrop({
    accept: Object.values(GameTracks),
    drop: () => ({name: title}),
    canDrop: (item, monitor) => {
      if (title === 'setlist') {
        const isDroppable = !children.some(child => child.props.songInfo.LevelName === item.type);
        const isFromSame = children.some(child => child.props.songInfo.randomID === item.randomID);
        // return !prevSong.isInstalled && (prevSong.MainMusic.Event === currentItem.name && prevSong.BossMusic.Event === currentItem.name);
        if (!isDroppable && !isFromSame) {
          warningToast(item.type);
        }
        // if (!isDroppable) {
        //   console.log('!!!item: ', item);
        // }
        return isDroppable;
      } else {
        return true;
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  }, [title, children]);

  useEffect(() => {
    setIsHovering(isOver);
  }, [isOver]);

  const childrenToRender = useMemo(() => {
    try {
      return children.sort((a, b) => levelNamesArr.indexOf(a.props.songInfo.LevelName) - levelNamesArr.indexOf(b.props.songInfo.LevelName));
    } catch (e) {
      return [];
    }
  }, [children])
  // console.log('drop options: ', { isOver});
  return (
    <div ref={drop} className={className + ' drop-target' + (isHovering ? ' hovering-drop-target' : '')}>
      {childrenToRender}
    </div>
  )
}