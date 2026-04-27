// --- ✨ ADVANCED AUDIO ENGINE (Reverb & Multi-Sounds) ✨ ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const bgmPlayer = new Audio();
bgmPlayer.crossOrigin = "anonymous";
bgmPlayer.loop = true;

const source = audioCtx.createMediaElementSource(bgmPlayer);
const gainNode = audioCtx.createGain();
const convolver = audioCtx.createConvolver();

function createReverbIR() {
    let sampleRate = audioCtx.sampleRate;
    let length = sampleRate * 2.5; 
    let impulse = audioCtx.createBuffer(2, length, sampleRate);
    for (let i = 0; i < 2; i++) {
        let channel = impulse.getChannelData(i);
        for (let j = 0; j < length; j++) {
            channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 3);
        }
    }
    return impulse;
}
convolver.buffer = createReverbIR();

const dryGain = audioCtx.createGain();
const wetGain = audioCtx.createGain();
source.connect(dryGain);
source.connect(convolver);
convolver.connect(wetGain);
dryGain.connect(gainNode);
wetGain.connect(gainNode);
gainNode.connect(audioCtx.destination);

let baseVol = localStorage.getItem('suleymanBgmVol') ? parseInt(localStorage.getItem('suleymanBgmVol')) / 100 : 0.4;
gainNode.gain.value = baseVol;
let isReverb = localStorage.getItem('suleymanReverb') === 'true';
function updateReverbMix() {
    if(isReverb) { dryGain.gain.value = 0.6; wetGain.gain.value = 1.0; } 
    else { dryGain.gain.value = 1.0; wetGain.gain.value = 0.0; }
}
updateReverbMix();

window.changeBGMVolume = function(val) {
    baseVol = val / 100;
    gainNode.gain.value = baseVol;
    localStorage.setItem('suleymanBgmVol', val);
}
window.toggleReverb = function(checked) {
    isReverb = checked;
    localStorage.setItem('suleymanReverb', checked);
    updateReverbMix();
}

function fadeOutBGM(callback) {
    let vol = gainNode.gain.value;
    let fade = setInterval(() => {
        if(vol > 0.05) { vol -= 0.05; gainNode.gain.value = vol; }
        else { clearInterval(fade); gainNode.gain.value = 0; bgmPlayer.pause(); if(callback) callback(); }
    }, 50);
}
function fadeInBGM(src) {
    bgmPlayer.src = src;
    bgmPlayer.play().catch(()=>{}); 
    let vol = 0; gainNode.gain.value = 0;
    let fade = setInterval(() => {
        if(vol < baseVol) { vol += 0.05; gainNode.gain.value = vol; } 
        else { clearInterval(fade); gainNode.gain.value = baseVol; }
    }, 100);
}
window.changeBGM = function(src, trackName) {
    document.getElementById('track-name').innerText = trackName || "System BGM";
    if(audioCtx.state === 'suspended') audioCtx.resume();
    if(bgmPlayer.src.includes(src)) return;
    if(!bgmPlayer.paused) { fadeOutBGM(() => fadeInBGM(src)); } else { fadeInBGM(src); }
}

// Updates music widget progress bar
bgmPlayer.addEventListener('timeupdate', () => {
    if(!bgmPlayer.duration) return;
    const percent = (bgmPlayer.currentTime / bgmPlayer.duration) * 100;
    document.getElementById('music-progress').style.width = percent + '%';
});

// Hook widget play button directly to WebAudio
window.toggleBGM = function() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const btnIcon = document.getElementById('play-icon');
    
    if (bgmPlayer.paused) {
        if(!bgmPlayer.src) {
            // Default track if none loaded
            bgmPlayer.src = 'Musics/bgm-main.mp3';
            document.getElementById('track-name').innerText = "Main Hub Theme";
        }
        bgmPlayer.play().catch(e => console.log("Audio blocked:", e));
        if(btnIcon) { btnIcon.className = 'fa-solid fa-pause'; btnIcon.style.marginLeft = '0'; }
    } else {
        bgmPlayer.pause();
        if(btnIcon) { btnIcon.className = 'fa-solid fa-play'; btnIcon.style.marginLeft = '3px'; }
    }
};

// Start context on first document click, but let the user hit the play button
document.body.addEventListener('click', () => {
    if(audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });


// --- ✨ UNIVERSAL MULTI-SOUNDS & BUTTON ANIMATIONS ✨ ---
const hoverSounds = [new Audio('Musics/hover1.mp3'), new Audio('Musics/hover2.mp3')];
const clickSounds = [new Audio('Musics/click1.mp3'), new Audio('Musics/click2.mp3')];
const swipeSound = new Audio('Musics/swipe.mp3');
hoverSounds.forEach(s => s.volume = 0.2); clickSounds.forEach(s => s.volume = 0.5); swipeSound.volume = 0.6;

document.addEventListener('mouseover', (e) => {
    if(document.body.classList.contains('potato-mode')) return;
    if(e.target.closest('button, .card, select, input, .aero-glass-btn, .category-btn')) {
        let sfx = hoverSounds[Math.floor(Math.random() * hoverSounds.length)];
        sfx.currentTime = 0; sfx.play().catch(() => {}); 
    }
});

document.addEventListener('mousedown', (e) => {
    let target = e.target.closest('button, .card, select, input, .aero-glass-btn, .category-btn');
    if(target) {
        let sfx = clickSounds[Math.floor(Math.random() * clickSounds.length)];
        sfx.currentTime = 0; sfx.play().catch(() => {});

        if(target.classList.contains('main-card') && !document.body.classList.contains('potato-mode')) {
            target.classList.remove('clicked-pulse');
            void target.offsetWidth; 
            target.classList.add('clicked-pulse');
            setTimeout(() => target.classList.remove('clicked-pulse'), 500);
        }
    }
});


// --- ✨ DIRECTIONAL SWIPE TRANSITION ✨ ---
window.triggerSwipeTransition = function(onMidpoint, direction = 'forward') {
    if(document.body.classList.contains('potato-mode')) { onMidpoint(); return; }
    swipeSound.currentTime = 0; swipeSound.play().catch(()=>{});
    
    const activeView = document.querySelector('.view:not([style*="display: none"])');
    const outX = direction === 'forward' ? '-100vw' : '100vw';
    const startX = direction === 'forward' ? '100vw' : '-100vw';

    if(activeView) {
        activeView.style.transition = 'transform 0.6s cubic-bezier(0.8, 0, 0.2, 1), opacity 0.5s';
        activeView.style.transform = `translateX(${outX})`;
        activeView.style.opacity = '0';
    }

    setTimeout(() => {
        onMidpoint();
        const newView = document.querySelector('.view:not([style*="display: none"])');
        if(newView) {
            newView.style.transition = 'none';
            newView.style.transform = `translateX(${startX})`;
            newView.style.opacity = '0';
            
            void newView.offsetHeight; 
            
            newView.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s';
            newView.style.transform = 'translateX(0)';
            newView.style.opacity = '1';
        }
    }, 500);
}

window.navigateWithSwipe = function(url, direction = 'forward') {
    triggerSwipeTransition(() => { window.location.href = url; }, direction);
}

// --- ✨ MASSIVE QUOTE LIBRARY ✨ ---
const typeQuotes = [
    "Pain is just proof you showed up.",
    "You don’t lose fights, you learn where you break.",
    "Every round you survive builds a new version of you.",
    "Your opponent isn’t the enemy—your limits are.",
    "You don’t need talent when you refuse to quit.",
    "Bruises fade. Weakness stays if you let it.",
    "Train like you’re already behind.",
    "Fear disappears the moment you move forward.",
    "Champions aren’t loud. They’re consistent.",
    "You either push or you get pushed.",
    "Discipline is doing it when motivation is dead.",
    "Your future is built on your worst days.",
    "If you wait to feel ready, you’ll stay average.",
    "Consistency beats intensity every time.",
    "You don’t need more time—you need less excuses.",
    "Control your habits or they control you.",
    "Comfort is the slowest way to fail.",
    "Small actions daily create violent change.",
    "You become what you repeat.",
    "No one is coming to fix your life.",
    "Move in silence. Let results speak.",
    "Not everyone deserves access to you.",
    "Silence filters fake people.",
    "You grow faster when you’re alone.",
    "They notice you when you stop noticing them.",
    "Being alone isn’t lonely if you’re building.",
    "Distance protects your energy.",
    "You don’t need approval to evolve.",
    "Respect is earned quietly.",
    "The less you explain, the stronger you look.",
    "You weren’t made to stay small.",
    "Work until your old life feels foreign.",
    "Dreams die without execution.",
    "If it’s easy, it’s not changing you.",
    "Your goals don’t care about your mood.",
    "Build something that outlives your excuses.",
    "The grind is lonely because success is rare.",
    "Every level demands a new version of you.",
    "You don’t chase success—you attract it by becoming better.",
    "If you’re not obsessed, you’re distracted.",
    "Pain either shapes you or destroys you.",
    "Growth hurts because you’re changing.",
    "Some lessons only come through suffering.",
    "What broke you can build you.",
    "You don’t heal by avoiding pain.",
    "Scars are reminders you survived.",
    "The hardest battles are silent.",
    "Strength is built in uncomfortable moments.",
    "You outgrow people who don’t grow.",
    "Healing isn’t pretty—but it’s powerful.",
    "Your mind decides before your body moves.",
    "Weak thoughts create weak actions.",
    "You can’t win if you quit mentally.",
    "Focus is your real superpower.",
    "Where attention goes, energy flows.",
    "Doubt kills more dreams than failure.",
    "Control your thoughts or they control you.",
    "Confidence comes from proof, not words.",
    "Train your mind like your body.",
    "Calm mind, dangerous results.",
    "Excuses sound best to the one making them.",
    "You either do it or you don’t—there’s no in-between.",
    "Results don’t care about your reasons.",
    "Hard work exposes lazy talk.",
    "You’re tired? Good. Keep going.",
    "If it was easy, everyone would win.",
    "No shortcuts. Just sacrifice.",
    "You wanted this—act like it.",
    "Stop negotiating with weakness.",
    "The work shows, even when you don’t.",
    "Life rewards action, not intention.",
    "You get what you tolerate.",
    "Time exposes everything.",
    "People change when they see you leveling up.",
    "Nothing stays the same—use that.",
    "You can restart anytime.",
    "Your environment shapes your mindset.",
    "What you ignore grows stronger.",
    "Not all losses are failures.",
    "Life gets better when you get stronger.",
    "You’re not there yet—but you’re closer than yesterday.",
    "Be the man you needed before.",
    "Your habits are your identity.",
    "Change your actions, change your life.",
    "You’re one decision away from a new path.",
    "Progress isn’t loud—but it’s real.",
    "You don’t find yourself—you build yourself.",
    "Your potential is waiting on your discipline.",
    "Every day is a vote for who you become.",
    "Become undeniable.",
    "No mercy for your excuses.",
    "Built, not born.",
    "Stay dangerous.",
    "Silence > talk.",
    "Pressure creates diamonds.",
    "Earn it daily.",
    "Hustle quietly.",
    "Win or learn.",
    "Adapt or break.",
    "Never soft."
];

let quoteIndex = 0; let charIndex = 0; let isDeleting = false;

function typeEffect() {
    const typewriterElem = document.getElementById('typewriter-text');
    if(!typewriterElem) return;
    const currentQuote = `"${typeQuotes[quoteIndex]}"`;
    
    if (isDeleting) { typewriterElem.innerText = currentQuote.substring(0, charIndex - 1); charIndex--; } 
    else { typewriterElem.innerText = currentQuote.substring(0, charIndex + 1); charIndex++; }
    
    let typingSpeed = isDeleting ? 25 : 60;
    if (!isDeleting && charIndex === currentQuote.length) { 
        typingSpeed = 3000; isDeleting = true; 
    } 
    else if (isDeleting && charIndex === 0) { 
        isDeleting = false; 
        quoteIndex = (quoteIndex + 1) % typeQuotes.length; 
        typingSpeed = 500; 
    }
    setTimeout(typeEffect, typingSpeed);
}

// --- ✨ MISC SYSTEM SETUP ✨ ---
const translations = {
    en: {
        "welcome": "Welcome, Suleyman", "watchlist-btn": "Library", "hub-btn": "Hub", "music-title": " Local Player",
        "cat-watching": "Watching", "cat-reading": "Reading", "cat-plan": "Plan to Watch", "cat-completed": "Completed",
        "add-entry-title": "Add New Entry", "type-anime": "Anime", "type-manga": "Manga", "type-film": "Film", "type-series": "Series", "type-book": "Book",
        "stat-watching": "Watching", "stat-reading": "Reading", "stat-plan": "Plan", "stat-completed": "Completed",
        "btn-cancel": "Cancel", "btn-add": "Add", "btn-save": "Save Changes", "settings-title": "System Settings",
        "btn-close": "Apply & Close"
    },
    de: {
        "welcome": "Willkommen, Suleyman", "watchlist-btn": "Bibliothek", "hub-btn": "Zentrale", "music-title": " Player",
        "cat-watching": "Zuschauen", "cat-reading": "Lesen", "cat-plan": "Geplant", "cat-completed": "Abgeschlossen",
        "add-entry-title": "Neu Hinzufügen", "type-anime": "Anime", "type-manga": "Manga", "type-film": "Film", "type-series": "Serie", "type-book": "Buch",
        "stat-watching": "Zuschauen", "stat-reading": "Lesen", "stat-plan": "Geplant", "stat-completed": "Abgeschlossen",
        "btn-cancel": "Abbrechen", "btn-add": "Hinzufügen", "btn-save": "Speichern", "settings-title": "Systemeinstellungen",
        "btn-close": "Schließen"
    }
};

let currentLang = 'en';

window.changeLanguage = function(lang) {
    currentLang = lang; localStorage.setItem('suleymanLang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            const icon = el.querySelector('i');
            el.innerText = translations[lang][key];
            if (icon) el.prepend(icon);
        }
    });
    if(typeof renderLibrary === 'function') renderLibrary(); 
}

function updateClock() {
    const now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    const clockEl = document.getElementById('digital-clock');
    if(clockEl) clockEl.innerText = `${hours}:${minutes}`;
}
setInterval(updateClock, 1000); updateClock();

function initBattery() {
    const levelEl = document.getElementById('battery-level');
    const iconEl = document.getElementById('battery-icon');
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            function updateAll() {
                let level = Math.round(battery.level * 100);
                if(levelEl) levelEl.innerText = level + '%';
                if(iconEl) {
                    if (battery.charging) iconEl.className = 'fa-solid fa-battery-bolt';
                    else if (level > 75) iconEl.className = 'fa-solid fa-battery-full';
                    else if (level > 50) iconEl.className = 'fa-solid fa-battery-three-quarters';
                    else if (level > 25) iconEl.className = 'fa-solid fa-battery-half';
                    else iconEl.className = 'fa-solid fa-battery-quarter';
                }
            }
            updateAll(); battery.addEventListener('levelchange', updateAll); battery.addEventListener('chargingchange', updateAll);
        }).catch(() => { if(levelEl) levelEl.innerText = "100%"; });
    } else { if(levelEl) levelEl.innerText = "100%"; }
}
initBattery();

window.changeWeather = function(weatherType) {
    localStorage.setItem('suleymanWeather', weatherType);
    const container = document.getElementById('weather-container');
    if(!container) return; container.innerHTML = ''; 
    if(document.body.classList.contains('potato-mode')) return;

    let intensityNum = parseInt(localStorage.getItem('suleymanWeatherIntensity') || '50') / 100;
    container.style.opacity = intensityNum; 

    if (weatherType === 'rain') {
        for(let i=0; i<30; i++) {
            let drop = document.createElement('div'); drop.className = 'rain-drop';
            drop.style.left = Math.random() * 100 + 'vw';
            drop.style.animationDelay = Math.random() * 2 + 's'; drop.style.animationDuration = 0.5 + Math.random() * 0.5 + 's';
            drop.style.height = 40 + Math.random() * 60 + 'px'; container.appendChild(drop);
        }
    } else if (weatherType === 'clouds') {
        for(let i=0; i<6; i++) {
            let cloud = document.createElement('div'); cloud.className = 'cloud-puff';
            cloud.style.top = Math.random() * 60 + 'vh'; cloud.style.width = 150 + Math.random() * 200 + 'px'; cloud.style.height = 50 + Math.random() * 80 + 'px';
            cloud.style.animationDelay = Math.random() * -20 + 's'; cloud.style.animationDuration = 20 + Math.random() * 20 + 's'; container.appendChild(cloud);
        }
    } else if (weatherType === 'sun') {
        let sun = document.createElement('div'); sun.className = 'sun-flare'; container.appendChild(sun);
    }
}
window.changeWeatherIntensity = function(val) { localStorage.setItem('suleymanWeatherIntensity', val); const weatherContainer = document.getElementById('weather-container'); if(weatherContainer) weatherContainer.style.opacity = val / 100; }

window.changeGlobalTheme = function(themeName) { document.body.setAttribute('data-theme', themeName); localStorage.setItem('suleymanGlobalTheme', themeName); }
window.openSettings = function() { const modal = document.getElementById('settings-modal'); modal.style.display = 'flex'; setTimeout(() => modal.classList.add('active'), 10); }
window.closeSettings = function() { const modal = document.getElementById('settings-modal'); modal.classList.remove('active'); setTimeout(() => { modal.style.display = 'none'; }, 300); }

window.togglePotatoMode = function(isPotato) {
    if(isPotato) document.body.classList.add('potato-mode'); else document.body.classList.remove('potato-mode');
    localStorage.setItem('suleymanPotatoMode', isPotato);
    const weatherSelect = document.getElementById('weather-select'); if(weatherSelect) changeWeather(weatherSelect.value); 
}

window.onload = () => {
    quoteIndex = Math.floor(Math.random() * typeQuotes.length);

    const isPotato = localStorage.getItem('suleymanPotatoMode') === 'true';
    const potatoToggle = document.getElementById('potato-toggle'); if(potatoToggle) potatoToggle.checked = isPotato;
    togglePotatoMode(isPotato);
    
    const savedLang = localStorage.getItem('suleymanLang') || 'en';
    const langSelect = document.getElementById('language-select'); if(langSelect) langSelect.value = savedLang;
    changeLanguage(savedLang);

    const savedGlobalTheme = localStorage.getItem('suleymanGlobalTheme') || 'default';
    document.body.setAttribute('data-theme', savedGlobalTheme);
    const themeSelect = document.getElementById('global-theme-select'); if(themeSelect) themeSelect.value = savedGlobalTheme;

    const intensity = localStorage.getItem('suleymanWeatherIntensity') || '50';
    const intensitySlider = document.getElementById('weather-intensity'); if(intensitySlider) intensitySlider.value = intensity;

    const savedWeather = localStorage.getItem('suleymanWeather') || 'none';
    const weatherSelect = document.getElementById('weather-select'); if(weatherSelect) weatherSelect.value = savedWeather;
    changeWeather(savedWeather);

    const savedVol = localStorage.getItem('suleymanBgmVol') || '40';
    const volSlider = document.getElementById('bgm-volume'); if(volSlider) volSlider.value = savedVol;
    const revToggle = document.getElementById('reverb-toggle'); if(revToggle) revToggle.checked = isReverb;

    // Ready the music without forcing it to play (prevents browser block). User clicks play.
    if(window.location.pathname.includes('school.html')) { bgmPlayer.src = 'Musics/bgm-school.mp3'; document.getElementById('track-name').innerText = "School OS Theme"; } 
    else { bgmPlayer.src = 'Musics/bgm-main.mp3'; document.getElementById('track-name').innerText = "Main Hub Theme"; }

    if(typeof renderLibrary === 'function') renderLibrary();
    typeEffect(); 
};