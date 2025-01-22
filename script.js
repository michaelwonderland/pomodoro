let timeLeft;
let timerId = null;
let isWorkTime = true;
let notificationPermission = false;
let isDrumsEnabled = true;

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

let WORK_TIME = 25 * 60; // 25 minutes in seconds
let BREAK_TIME = 5 * 60; // 5 minutes in seconds

dingSound.volume = 0.5; // Set volume to 50%
workSound.volume = 0.2;  // Set drums to 20%

// First, let's update the audio source
workSound.src = 'lo-fi-drum-break-her_82bpm.wav';
workSound.load(); // Reload the audio with new source

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
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update the timer display
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    
    // Update the document title
    if (timerId !== null) { // Only show time in title when timer is running
        document.title = `${timeString} - Pomodoro Timer - ML Wonderland`;
    } else {
        document.title = 'Pomodoro Timer - ML Wonderland';
    }
}

function switchMode() {
    isWorkTime = !isWorkTime;
    timeLeft = isWorkTime ? WORK_TIME : BREAK_TIME; // This will use current values
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

        // Switch modes and reset timer when session ends
        isWorkTime = !isWorkTime;
        timeLeft = isWorkTime ? WORK_TIME : BREAK_TIME;
        startButton.textContent = "Start";
        timerId = null;
        updateDisplay(timeLeft);
        updateModeText();
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
        // Pausing the timer
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

    // Starting a new session
    if (timeLeft === WORK_TIME) {
        playDing();
        // Only play drums if it's a work session start AND drums are enabled
        if (isWorkTime && isDrumsEnabled) {
            workSound.currentTime = 0;
            const playPromise = workSound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error playing drums:', error);
                });
            }
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
    timeLeft = WORK_TIME; // This will now use the current WORK_TIME value
    startButton.textContent = 'Start';
    workSound.pause();
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
        const workDuration = WORK_TIME / 60;
        const breakDuration = BREAK_TIME / 60;
        modeText.innerHTML = `
            <div class="duration-settings">
                <div class="duration-setting">
                    Set Work time - 
                    <input type="number" 
                        min="1" 
                        max="99" 
                        value="${workDuration}" 
                        class="duration-input"
                        data-mode="work"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        autocomplete="off"
                        step="1"
                    >:00
                </div>
                <div class="duration-setting">
                    Set Rest time - 
                    <input type="number" 
                        min="1" 
                        max="99" 
                        value="${breakDuration}" 
                        class="duration-input"
                        data-mode="rest"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        autocomplete="off"
                        step="1"
                    >:00
                </div>
            </div>
        `;
        
        // Add event listeners to both inputs
        const inputs = modeText.querySelectorAll('.duration-input');
        inputs.forEach(input => {
            input.setAttribute('inputmode', 'numeric');
            input.setAttribute('pattern', '[0-9]*');
            
            // Clear value on focus
            input.addEventListener('focus', function() {
                this.value = '';
            });
            
            // Handle input changes
            input.addEventListener('change', function() {
                let value = parseInt(this.value) || (this.dataset.mode === 'work' ? 25 : 5);
                if (value < 1) value = 1;
                if (value > 99) value = 99;
                this.value = value;
                
                if (this.dataset.mode === 'work') {
                    WORK_TIME = value * 60;
                    if (isWorkTime) timeLeft = WORK_TIME;
                } else {
                    BREAK_TIME = value * 60;
                    if (!isWorkTime) timeLeft = BREAK_TIME;
                }
                updateDisplay(timeLeft);
                this.blur(); // Remove focus after value is set
            });
        });
    }
}

// Initialize with correct text
updateModeText();

// Update the setupSmoothLoop function
function setupSmoothLoop() {
    workSound.load();
    
    workSound.addEventListener('timeupdate', function() {
        // Start transition earlier (0.3 seconds before end) for smoother overlap
        if (workSound.currentTime > workSound.duration - 0.3) {
            const fadeOut = setInterval(() => {
                if (workSound.volume > 0.05) {
                    workSound.volume -= 0.05;
                } else {
                    clearInterval(fadeOut);
                    workSound.currentTime = 0;
                    workSound.volume = 0.2;  // Reset to 20%
                }
            }, 20);
        }
    });
}

// Call this when the page loads
setupSmoothLoop(); 