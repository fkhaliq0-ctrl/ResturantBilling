export const playButtonPress = () => { try { const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); audio.volume = 0.3; audio.play().catch(e => {}); } catch(err) {} };
export const playSuccessSound = () => { try { const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'); audio.volume = 0.4; audio.play().catch(e => {}); } catch(err) {} };
export const playCheckoutSuccess = () => playSuccessSound();
export const playErrorSound = () => { try { const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2957/2957-preview.mp3'); audio.volume = 0.4; audio.play().catch(e => {}); } catch(err) {} };
export const playAddSound = () => playButtonPress();
export const playRemoveSound = () => playButtonPress();
export const playKeyPress = () => playButtonPress();
