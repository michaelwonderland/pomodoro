let timeLeft;
let timerId = null;
let isWorkTime = true;
let notificationPermission = false;
let isDrumsEnabled = false;

const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');
const toggleButton = document.getElementById('toggle');
const modeText = document.getElementById('mode-text');
const themeButton = document.getElementById('themeButton');
const root = document.documentElement;
const dingSound = document.getElementById('dingSound');
const workSound = document.getElementById('workSound');
const drumToggle = document.getElementById('drumToggle');

// Check for saved theme preference or default to 'dark'
const savedTheme = localStorage.getItem('theme') || 'dark';
root.setAttribute('data-theme', savedTheme);

const WORK_TIME = 25 * 60; // 25 minutes in seconds
const BREAK_TIME = 5 * 60; // 5 minutes in seconds

dingSound.volume = 0.5; // Set volume to 50%
workSound.volume = 0.3; // Adjust volume as needed

toggleButton.textContent = 'Switch Mode';  // Set initial text

document.getElementById('enable-notifications').addEventListener('click', async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        notificationPermission = true;
        document.getElementById('notification-permission').style.display = 'none';
    }
});

// Check if notifications are supported and not yet granted
if ('Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        document.getElementById('notification-permission').style.display = 'flex';
    } else if (Notification.permission === 'granted') {
        notificationPermission = true;
    }
}

function updateDisplay(timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
}

function switchMode() {
    isWorkTime = !isWorkTime;
    timeLeft = isWorkTime ? WORK_TIME : BREAK_TIME;
    updateDisplay(timeLeft);
    updateModeText();
}

function playDing() {
    dingSound.currentTime = 0;  // Reset sound to start
    try {
        const playPromise = dingSound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Error playing sound:', error);
            });
        }
    } catch (error) {
        console.log('Error playing sound:', error);
    }
}

function startCountdown() {
    if (timeLeft > 0) {
        timeLeft--;
        updateDisplay(timeLeft);
        timerId = setTimeout(startCountdown, 1000);
    } else {
        playDing();
        workSound.pause(); // Stop the drum loop when timer ends
        
        if (notificationPermission) {
            const message = isWorkTime ? 
                "Time for a break! You've completed a work session." : 
                "Break's over! Time to get back to work.";
            
            new Notification("Pomodoro Timer", {
                body: message,
                icon: "/favicon-32x32.png"
            });
        }

        if (isWorkTime) {
            modeText.textContent = "Work session complete! Take a break?";
        } else {
            modeText.textContent = "Break time over! Ready to focus?";
        }
        startButton.textContent = "Start";
        timerId = null;
    }
}

function toggleMode() {
    const wasRunning = timerId !== null;
    
    if (wasRunning) {
        clearInterval(timerId);
        workSound.pause(); // Stop the drum loop when switching modes
    }
    
    switchMode();
    updateModeText();
    
    if (wasRunning) {
        startCountdown();
        startButton.textContent = 'Pause';
        // Restart drum loop if switching to work mode
        if (isWorkTime) {
            workSound.currentTime = 0;
            workSound.play().catch(error => console.log('Error playing work sound:', error));
        }
    }
}

function toggleDrums() {
    isDrumsEnabled = !isDrumsEnabled;
    drumToggle.textContent = isDrumsEnabled ? 'Drums On' : 'Drums Off';
    
    if (!isDrumsEnabled) {
        workSound.pause();
    } else if (isWorkTime && timerId !== null) {
        // Only play if we're in a work session and the timer is running
        workSound.play().catch(error => console.log('Error playing work sound:', error));
    }
}

function startTimer() {
    if (timerId !== null) {
        clearTimeout(timerId);
        startButton.textContent = 'Start';
        timerId = null;
        workSound.pause();
        updateModeText();
        return;
    }

    if (!timeLeft) {
        timeLeft = WORK_TIME;
    }

    if (timeLeft === WORK_TIME || timeLeft === BREAK_TIME) {
        playDing();
        // Only play drums if enabled and in work mode
        if (isWorkTime && isDrumsEnabled) {
            workSound.currentTime = 0;
            workSound.play().catch(error => console.log('Error playing work sound:', error));
        }
    }

    startButton.textContent = 'Pause';
    startCountdown();
    updateModeText();
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    isWorkTime = true;
    timeLeft = WORK_TIME;
    startButton.textContent = 'Start';
    workSound.pause(); // Stop the drum loop when resetting
    updateModeText();
    updateDisplay(timeLeft);
}

// Theme toggle function
function toggleTheme() {
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

themeButton.addEventListener('click', toggleTheme);

startButton.addEventListener('click', startTimer);
resetButton.addEventListener('click', resetTimer);
toggleButton.addEventListener('click', toggleMode);
drumToggle.addEventListener('click', toggleDrums);

// Initialize the display
timeLeft = WORK_TIME;
updateDisplay(timeLeft);

function updateModeText() {
    const isRunning = timerId !== null;
    const isPaused = !isRunning && timeLeft !== WORK_TIME && timeLeft !== BREAK_TIME;
    const isReset = !isRunning && (timeLeft === WORK_TIME || timeLeft === BREAK_TIME);
    
    if (isRunning) {
        modeText.textContent = isWorkTime ? 'Time for Deep Work' : 'Time to Rest';
    } else if (isPaused) {
        modeText.textContent = isWorkTime ? 'Resume Session - Work' : 'Resume Session - Rest';
    } else if (isReset) {
        modeText.textContent = isWorkTime ? 'Start a Session - Work' : 'Start a Session - Rest';
    }
}

// Initialize with correct text
updateModeText(); 