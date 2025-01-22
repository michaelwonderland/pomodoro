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

workSound.load(); // Ensure the audio is loaded

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
    minutesDisplay.contentEditable = true; // Make minutes editable
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
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
        // Add input field when timer is reset
        const currentDuration = isWorkTime ? WORK_TIME / 60 : BREAK_TIME / 60;
        modeText.innerHTML = `
            <div class="duration-setting">
                <input type="number" 
                    min="1" 
                    max="99" 
                    value="${currentDuration}" 
                    class="duration-input"
                > :00 minutes - ${isWorkTime ? 'Work' : 'Rest'}
            </div>
        `;
        
        // Add event listener to the new input
        const input = modeText.querySelector('.duration-input');
        if (input) {
            input.addEventListener('change', function() {
                let value = parseInt(this.value) || 25;
                if (value < 1) value = 1;
                if (value > 99) value = 99;
                this.value = value;
                
                if (isWorkTime) {
                    WORK_TIME = value * 60;
                    timeLeft = WORK_TIME;
                } else {
                    BREAK_TIME = value * 60;
                    timeLeft = BREAK_TIME;
                }
                updateDisplay(timeLeft);
            });
        }
    }
}

// Add CSS for the duration input
const style = document.createElement('style');
style.textContent = `
    .duration-setting {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }
    
    .duration-input {
        width: 40px;
        background: rgba(128, 128, 128, 0.1);
        border: none;
        border-radius: 4px;
        padding: 2px 4px;
        color: inherit;
        font-size: inherit;
        font-family: inherit;
        text-align: right;
    }
    
    .duration-input:hover {
        background: rgba(128, 128, 128, 0.2);
    }
    
    .duration-input:focus {
        background: rgba(128, 128, 128, 0.3);
        outline: none;
    }
    
    /* Hide spinner buttons */
    .duration-input::-webkit-inner-spin-button,
    .duration-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .duration-input[type=number] {
        -moz-appearance: textfield;
    }
`;
document.head.appendChild(style);

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

// Add input validation and handling
minutesDisplay.addEventListener('input', function(e) {
    let value = this.textContent.replace(/[^0-9]/g, ''); // Only allow numbers
    
    // Limit to 2 digits and reasonable time (1-99 minutes)
    if (value.length > 2) value = value.slice(0, 2);
    if (value === '') value = '25';
    if (parseInt(value) < 1) value = '01';
    if (parseInt(value) > 99) value = '99';
    
    this.textContent = value.padStart(2, '0');
    
    // Update the appropriate timer duration based on current mode
    const minutes = parseInt(value);
    if (isWorkTime) {
        WORK_TIME = minutes * 60;
        if (timeLeft === WORK_TIME || !timerId) timeLeft = WORK_TIME;
    } else {
        BREAK_TIME = minutes * 60;
        if (timeLeft === BREAK_TIME || !timerId) timeLeft = BREAK_TIME;
    }
});

// Prevent unwanted keystrokes
minutesDisplay.addEventListener('keydown', function(e) {
    // Allow: backspace, delete, tab, numbers, arrows
    if (!((e.keyCode >= 48 && e.keyCode <= 57) || // numbers
          (e.keyCode >= 96 && e.keyCode <= 105) || // numpad
          e.keyCode === 8 || // backspace
          e.keyCode === 9 || // tab
          e.keyCode === 46 || // delete
          e.keyCode === 37 || // left arrow
          e.keyCode === 39)) { // right arrow
        e.preventDefault();
    }
});

// Update minutes display when losing focus
minutesDisplay.addEventListener('blur', function() {
    this.style.backgroundColor = 'transparent';
    this.style.padding = '0';
    this.textContent = this.textContent.padStart(2, '0');
});

// Add this after the existing minutesDisplay event listeners
minutesDisplay.addEventListener('mouseover', function() {
    this.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';  // Subtle background
    this.style.cursor = 'text';  // Show text cursor
    this.title = 'Click to edit minutes';  // Tooltip
});

minutesDisplay.addEventListener('mouseout', function() {
    if (document.activeElement !== this) {  // Only remove background if not focused
        this.style.backgroundColor = 'transparent';
    }
});

minutesDisplay.addEventListener('focus', function() {
    this.style.backgroundColor = 'rgba(128, 128, 128, 0.2)';  // Slightly darker when focused
    this.style.outline = 'none';  // Remove default focus outline
    this.style.borderRadius = '4px';  // Rounded corners
    this.style.padding = '0 4px';  // Small padding
});

minutesDisplay.addEventListener('blur', function() {
    this.style.backgroundColor = 'transparent';
    this.style.padding = '0';
    this.textContent = this.textContent.padStart(2, '0');  // Keep the existing padding behavior
}); 