import AvatarCreator from '../AvatarCreator';

const AvatarCreateComponent: React.FC = () => {
  const handleAvatarCreated = (avatarUrl: string) => {
    console.log('Avatar URL:', avatarUrl);
    // Hand over to renderer or just use however you see fit
  };

  return (
    <div style={{ width: '800px', height: '600px' }}>
      <AvatarCreator onAvatarCreated={handleAvatarCreated} />
    </div>
  );
};

export default AvatarCreateComponent;