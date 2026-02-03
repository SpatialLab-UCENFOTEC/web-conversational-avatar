import React from 'react';

const Avatar = ({ isSpeaking }) => {
  return (
    <div className={`avatar ${isSpeaking ? 'speaking' : 'idle'}`}>
      <img src="/avatar.png" alt="Avatar IA" />
    </div>
  );
};

export default Avatar;


