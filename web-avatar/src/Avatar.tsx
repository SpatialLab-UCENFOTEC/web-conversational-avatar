
type AvatarProps = {
  isSpeaking: boolean;
};

const Avatar = ({ isSpeaking }: AvatarProps) => {
  return (
    <div className={`avatar ${isSpeaking ? 'speaking' : 'idle'}`}>
      <img src="/avatar.png" alt="Avatar IA" />
    </div>
  );
};

export default Avatar;
