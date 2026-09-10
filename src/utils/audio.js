export const playButtonPress = () => { try { const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'); audio.volume = 0.2; audio.play().catch(()=>{}); } catch(e){} };
export const playSuccessSound = () => { try { const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'); audio.volume = 0.3; audio.play().catch(()=>{}); } catch(e){} };
export const playCheckoutSuccess = () => playSuccessSound();
export const playErrorSound = () => { try { const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2957/2957-preview.mp3'); audio.volume = 0.3; audio.play().catch(()=>{}); } catch(e){} };
