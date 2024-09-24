import React, { useState } from 'react';
import AvatarRenderer, { VisemeData } from '../AvatarRenderer';

const App: React.FC = () => {
  const [visemeData, setVisemeData] = useState<VisemeData | null>(null);
  const [playViseme, setPlayViseme] = useState(false);
  const [playAnimation, setPlayAnimation] = useState(false);
  const [animationUrl, setAnimationUrl] = useState<string | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const loadAvatar = () => {
    setAvatarUrl(
      'https://models.readyplayer.me/66ecc27e8812191462c3290f.glb?morphTargets=mouthOpen,Oculus Visemes'
    );
  };

  const handlePlayAnimation = () => {
    setAnimationUrl('/animations/dance/F_Dances_001.glb');
    setPlayAnimation((prev) => !prev); // Toggle to re-trigger useEffect
  };

  const handlePlayViseme = () => {
    fetch('/viseme/Viseme1.json')
      .then((response) => response.json())
      .then((data) => {
        setVisemeData(data);
        setPlayViseme(true);
      })
      .catch((error) => console.error('Error loading viseme data:', error));
  };

  return (
    <div style={{ width: '800px', height: '600px' }}>
      {avatarUrl ? (
        <AvatarRenderer
          avatarUrl={avatarUrl}
          animationUrl={animationUrl}
          visemeData={visemeData || undefined}
          playAnimation={playAnimation}
          playViseme={playViseme}
        />
      ) : (
        <button onClick={loadAvatar}>Load Avatar</button>
      )}
      <button onClick={handlePlayAnimation}>Play Animation</button>
      <button onClick={handlePlayViseme}>Play Viseme</button>
    </div>
  );
};

export default App;








// import React, { useState } from 'react';
// import AvatarRenderer, { VisemeData } from '../de_Couple/src/AvatarRenderer';

// interface AppProps {
//   visemes: VisemeData | null;
// }

// const App: React.FC<AppProps> = ({ visemes }) => {
//   const [playViseme, setPlayViseme] = useState(false);
//   const [playAnimation, setPlayAnimation] = useState(false);
//   const [animationUrl, setAnimationUrl] = useState<string | undefined>(undefined);
//   const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

//   const loadAvatar = () => {
//     setAvatarUrl(
//       'https://models.readyplayer.me/66ecc27e8812191462c3290f.glb?morphTargets=mouthOpen,Oculus Visemes'
//     );
//   };

//   const handlePlayAnimation = () => {
//     setAnimationUrl('/animations/dance/F_Dances_001.glb');
//     setPlayAnimation((prev) => !prev); // Toggle to re-trigger useEffect
//   };

//   return (
//     <div style={{ width: '800px', height: '600px' }}>
//       {avatarUrl ? (
//         <AvatarRenderer
//           avatarUrl={avatarUrl}
//           animationUrl={animationUrl}
//           visemeData={visemes || undefined}  // Pass visemes as a prop
//           playAnimation={playAnimation}
//           playViseme={playViseme}
//         />
//       ) : (
//         <button onClick={loadAvatar}>Load Avatar</button>
//       )}
//       <button onClick={handlePlayAnimation}>Play Animation</button>
//     </div>
//   );
// };

// export default App;
