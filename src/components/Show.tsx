import React from 'react';

const Show: React.FC<{ if: boolean; children: any }> = (props) => {
  if (!props.if) {
    return null;
  }

  return props.children;
};

export default Show;
