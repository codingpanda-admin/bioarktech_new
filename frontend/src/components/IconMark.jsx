import React from 'react';

function IconMark({ type }) {
  return (
    <span className={`icon-mark icon-${type}`} aria-hidden="true">
      <span />
    </span>
  );
}

export default IconMark;
