// Constants
const MAX_NOTES = 100; // Limit maximum number of notes
const DEBOUNCE_DELAY = 300; // ms
const STORAGE_KEY = '369_archive_notes';
const LOADING_DURATION = 10000; // 10 seconds loading screen

// Memory-efficient state management
let state = {
    notes: [],
    currentUser: null,
    audioPlayer: null,
    isLoading: false,
    isPlaying: false
};

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Efficient DOM updates using DocumentFragment
function renderNotes() {
    const notesDisplay = document.getElementById('notes-display');
    if (!notesDisplay) return;
    
    notesDisplay.innerHTML = '';
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.dataset.id = note.id;

        const controls = document.createElement('div');
        controls.className = 'note-controls';
        
        if (note.author === state.currentUser) {
            controls.innerHTML = `
                <button onclick="editNote('${note.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteNote('${note.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }

        const content = document.createElement('div');
        content.className = 'note-content';
        content.textContent = note.content;

        const footer = document.createElement('div');
        footer.className = 'note-footer';
        footer.innerHTML = `
            <span class="note-author">
                <i class="fas ${note.author === 'Ree' ? 'fa-crown' : 'fa-user'}"></i>
                ${note.author}
            </span>
            <span class="note-date">${new Date(note.timestamp).toLocaleString()}</span>
        `;

        noteElement.appendChild(controls);
        noteElement.appendChild(content);
        noteElement.appendChild(footer);
        notesDisplay.appendChild(noteElement);
    });
}

// Note Functions
function createNote() {
    const input = document.getElementById('note-input');
    if (!input || !input.value.trim() || !state.currentUser) return;

    const note = {
        id: Date.now().toString(),
        content: input.value.trim(),
        author: state.currentUser,
        timestamp: Date.now()
    };

    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    notes.unshift(note);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    
    input.value = '';
    renderNotes();
}

function editNote(noteId) {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const note = notes.find(n => n.id === noteId);
    
    if (!note || note.author !== state.currentUser) {
        alert('You can only edit your own notes!');
        return;
    }

    const noteContent = document.querySelector(`.note[data-id="${noteId}"] .note-content`);
    if (!noteContent) return;

    const currentText = noteContent.textContent;
    const textarea = document.createElement('textarea');
    textarea.value = currentText;
    textarea.className = 'edit-textarea';
    
    const saveEdit = () => {
        const newText = textarea.value.trim();
        if (newText && newText !== currentText) {
            note.content = newText;
            note.timestamp = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
            renderNotes();
        }
        noteContent.style.display = '';
        textarea.remove();
    };

    textarea.onblur = saveEdit;
    textarea.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        }
        if (e.key === 'Escape') {
            noteContent.style.display = '';
            textarea.remove();
        }
    };

    noteContent.style.display = 'none';
    noteContent.parentNode.insertBefore(textarea, noteContent);
    textarea.focus();
}

function deleteNote(noteId) {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const note = notes.find(n => n.id === noteId);
    
    if (!note || note.author !== state.currentUser) {
        alert('You can only delete your own notes!');
        return;
    }

    if (confirm('Are you sure you want to delete this note?')) {
        const updatedNotes = notes.filter(n => n.id !== noteId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
        renderNotes();
    }
}

// Get user theme color
function getUserColor(username) {
    switch(username) {
        case 'Kairo':
            return 'var(--primary-purple)';
        case 'Ree':
            return 'var(--primary-pink)';
        default:
            return 'var(--primary-mint)';
    }
}

// Optimized localStorage handling
function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
    renderNotes();
}

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    state.notes = notes;
    renderNotes();
}

function addNote(content) {
    if (!content.trim()) return;
    
    const note = {
        id: Date.now().toString(),
        content: content.trim(),
        timestamp: Date.now(),
        author: state.currentUser
    };

    state.notes.push(note);
    saveNotes();
}

// Profile Functions
function showProfileModal() {
    const modal = document.getElementById('profile-modal');
    const profileName = document.getElementById('profile-name');
    const noteCount = document.getElementById('note-count');
    const memberSince = document.getElementById('member-since');
    const calendarGrid = document.getElementById('calendar-grid');
    
    if (!state.currentUser) return;

    // Update profile information
    profileName.textContent = state.currentUser;
    
    // Count user's notes
    const userNotes = state.notes.filter(note => note.author === state.currentUser);
    noteCount.textContent = userNotes.length;
    
    // Set member since date
    const firstNote = userNotes.sort((a, b) => a.timestamp - b.timestamp)[0];
    const memberSinceDate = firstNote ? new Date(firstNote.timestamp) : new Date();
    memberSince.textContent = memberSinceDate.toLocaleDateString();
    
    // Generate activity calendar
    generateActivityCalendar(calendarGrid, userNotes);
    
    modal.style.display = 'flex';
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    modal.style.display = 'none';
}

function generateActivityCalendar(container, notes) {
    container.innerHTML = '';
    const days = 28; // Show 4 weeks of activity
    
    for (let i = 0; i < days; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        
        // Check if there are notes for this day
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        const hasNotes = notes.some(note => {
            const noteDate = new Date(note.timestamp);
            return noteDate.toDateString() === date.toDateString();
        });
        
        if (hasNotes) {
            day.classList.add('active');
        }
        
        container.appendChild(day);
    }
}

function changeAvatar() {
    // Simulate file input click
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('user-avatar').src = event.target.result;
                localStorage.setItem(`${state.currentUser}_avatar`, event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// Playlist Functions
function showPlaylistModal() {
    const modal = document.getElementById('playlist-modal');
    modal.style.display = 'flex';
}

function closePlaylistModal() {
    const modal = document.getElementById('playlist-modal');
    modal.style.display = 'none';
}

function togglePlayback() {
    if (!state.audioPlayer) return;
    
    const playButton = document.querySelector('.track-controls button i');
    if (state.audioPlayer.paused) {
        state.audioPlayer.play();
        playButton.className = 'fas fa-pause';
    } else {
        state.audioPlayer.pause();
        playButton.className = 'fas fa-play';
    }
}

// Loading sequence handling
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    const userModal = document.getElementById('user-select-modal');
    
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.style.opacity = '1';
    }
    
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    if (userModal) {
        userModal.style.display = 'none';
    }
    
    state.isLoading = true;
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            if (mainContent) {
                mainContent.style.display = 'block';
            }
        }, 300);
    }
    
    state.isLoading = false;
}

// User Selection
function selectUser(username) {
    state.currentUser = username;
    
    // Show loading screen first
    showLoadingScreen();
    
    // Update theme based on user
    updateThemeForUser(username);
    
    // Setup audio for the selected user
    setupAudioForUser(username);
    
    // Hide user selection modal
    const modal = document.getElementById('user-select-modal');
    modal.style.opacity = '0';
    modal.style.display = 'none';

    // After loading duration, show main content
    setTimeout(() => {
        hideLoadingScreen();
        loadNotes();
    }, LOADING_DURATION);
}

// Audio setup for user
function setupAudioForUser(username) {
    // Stop any existing audio
    if (state.audioPlayer) {
        state.audioPlayer.pause();
        state.audioPlayer.currentTime = 0;
    }

    // Create new audio player
    state.audioPlayer = new Audio();
    state.audioPlayer.loop = true;
    
    // Set user-specific music
    switch(username) {
        case 'Kairo':
            state.audioPlayer.src = 'assets/audio/kairo.mp3';
            break;
        case 'Ree':
            state.audioPlayer.src = 'assets/audio/ree.mp3';
            break;
        case 'Others':
            state.audioPlayer.src = 'assets/audio/others.mp3';
            break;
    }
    
    // Set initial volume from saved value
    const savedVolume = localStorage.getItem('369_archive_volume');
    state.audioPlayer.volume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;
    
    // Start playing
    state.audioPlayer.play();
    state.isPlaying = true;
    
    // Update music button state
    const musicBtn = document.getElementById('music-btn');
    if (musicBtn) {
        musicBtn.innerHTML = '<i class="fas fa-music"></i>';
    }
}

// Volume Control
function updateVolume(value) {
    const volume = value / 100;
    if (state.audioPlayer) {
        state.audioPlayer.volume = volume;
    }
    localStorage.setItem('369_archive_volume', volume);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Reset state
    state.currentUser = null;
    state.isPlaying = false;
    
    // Stop any existing audio
    if (state.audioPlayer) {
        state.audioPlayer.pause();
        state.audioPlayer = null;
    }
    state.isPlaying = false;
    
    // Hide main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    // Clear any stored user data
    localStorage.removeItem('currentUser');
    
    // Show user selection modal
    const userModal = document.getElementById('user-select-modal');
    if (userModal) {
        userModal.style.display = 'flex';
        userModal.style.opacity = '1';
    }
    
    // Setup volume control
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        // Get saved volume or default to 50%
        const savedVolume = localStorage.getItem('369_archive_volume');
        const initialVolume = savedVolume !== null ? savedVolume * 100 : 50;
        
        volumeSlider.value = initialVolume;
        volumeSlider.addEventListener('input', function() {
            updateVolume(this.value);
        });
    }
    
    // Load saved avatar if exists
    const savedAvatar = localStorage.getItem(`${state.currentUser}_avatar`);
    if (savedAvatar) {
        document.getElementById('user-avatar').src = savedAvatar;
    }
    
    // Setup playlist volume sync
    const playlistVolume = document.getElementById('playlist-volume');
    if (playlistVolume) {
        playlistVolume.addEventListener('input', function() {
            updateVolume(this.value);
        });
    }
});

// User data
const userData = {
    'Kairo': {
        name: 'KAIRO AKA WIS',
        theme: 'purple',
        musicSrc: 'assets/music/Kairo.mp3',
        startTime: 9
    },
    'Ree': {
        name: 'REE, THE GORGEOUS',
        theme: 'pink',
        musicSrc: 'assets/music/Ree.mp3',
        startTime: 30
    },
    'Others': {
        name: 'OTHERS',
        theme: 'mint',
        musicSrc: 'assets/music/Others.mp3',
        startTime: 0
    }
};

// Theme Management
function updateThemeForUser(username) {
    const root = document.documentElement;
    
    switch(username.toLowerCase()) {
        case 'kairo':
            root.style.setProperty('--primary-color', '#b266ff');
            root.style.setProperty('--primary-rgb', '178, 102, 255');
            break;
        case 'ree':
            root.style.setProperty('--primary-color', '#ff66b2');
            root.style.setProperty('--primary-rgb', '255, 102, 178');
            break;
        default:
            root.style.setProperty('--primary-color', '#66b2ff');
            root.style.setProperty('--primary-rgb', '102, 178, 255');
    }
}

// About modal functionality with optimized event handling
function showAboutModal() {
    const aboutModal = document.getElementById('about-modal');
    if (aboutModal) {
        aboutModal.style.display = 'flex';
    }
}

function closeAboutModal() {
    const aboutModal = document.getElementById('about-modal');
    if (aboutModal) {
        aboutModal.style.display = 'none';
    }
}

// Global variables
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let currentUser = null;

// DOM Elements
const userSelectModal = document.getElementById('user-select-modal');
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');
const archiveTitle = document.getElementById('archive-title');
const noteInput = document.getElementById('note-input');
const notesDisplay = document.getElementById('notes-display');
const musicBtn = document.getElementById('music-btn');
const volumeSlider = document.getElementById('volume-slider');
const backgroundMusic = document.getElementById('background-music');

// Load notes for current user
function loadNotes() {
    if (!currentUser) return;
    const userNotes = notes.filter(note => note.user === currentUser);
    displayNotes(userNotes);
}

// Display notes
function displayNotes(notes) {
    notesDisplay.innerHTML = '';
    notes.forEach((note, index) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.innerHTML = `
            <div class="note-content">${note.text}</div>
            <div class="note-controls">
                <button onclick="editNote(${index})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteNote(${index})">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;
        notesDisplay.appendChild(noteElement);
    });
}

// Save note
function saveNote() {
    const noteText = noteInput.value.trim();
    if (!noteText || !currentUser) return;

    const note = {
        id: Date.now(),
        text: noteText,
        user: currentUser
    };

    notes.push(note);
    localStorage.setItem('notes', JSON.stringify(notes));
    noteInput.value = '';
    loadNotes();
}

// Edit note
function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        noteInput.value = note.text;
        deleteNote(id);
    }
}

// Delete note
function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

// Music button click handler
musicBtn.addEventListener('click', () => {
    if (!backgroundMusic) return;

    try {
        if (backgroundMusic.paused) {
            backgroundMusic.play()
                .then(() => {
                    musicBtn.innerHTML = '<i class="fas fa-music"></i>';
                    musicBtn.classList.remove('muted');
                })
                .catch(error => console.error('Play failed:', error));
        } else {
            backgroundMusic.pause();
            musicBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            musicBtn.classList.add('muted');
        }
    } catch (error) {
        console.error('Error toggling music:', error);
    }
});

// Volume slider handler
volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    try {
        if (backgroundMusic) {
            backgroundMusic.volume = volume;
        }
        
        // Update button state
        if (volume === 0) {
            musicBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            musicBtn.classList.add('muted');
        } else {
            musicBtn.innerHTML = '<i class="fas fa-music"></i>';
            musicBtn.classList.remove('muted');
        }
    } catch (error) {
        console.error('Error updating volume:', error);
    }
});

// Set up event listeners after DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize app
    initializeApp();
    
    // About modal close handlers
    document.getElementById('about-modal').addEventListener('click', function(event) {
        if (event.target === this) {
            closeAboutModal();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAboutModal();
        }
    });
});

// Initialize app
function initializeApp() {
    // Show user selection modal first
    userSelectModal.style.display = 'flex';
    
    // Hide loading screen and main content initially
    loadingScreen.style.display = 'none';
    mainContent.style.display = 'none';
    
    // Set up audio element
    if (backgroundMusic) {
        backgroundMusic.volume = volumeSlider.value / 100;
        backgroundMusic.addEventListener('error', (e) => {
            console.error('Audio error:', e);
        });
    }
    
    // Check for saved user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && userData[savedUser]) {
        selectUser(savedUser);
    }
}

// Function to handle music playback
async function playMusic(user) {
    try {
        if (!backgroundMusic) return;
        
        backgroundMusic.src = userData[user].musicSrc;
        backgroundMusic.currentTime = userData[user].startTime;
        
        // Start playing the music
        await backgroundMusic.play();
        
        // Show loading screen after user selection
        loadingScreen.style.display = 'flex';
        userSelectModal.style.display = 'none';
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error playing music:', error);
        return Promise.reject(error);
    }
}

// User selection handler
async function selectUser(user) {
    try {
        currentUser = user;
        document.body.className = user.toLowerCase();
        
        // Style the vinyl label with user theme
        const vinylLabel = document.querySelector('.vinyl-label');
        if (vinylLabel) {
            vinylLabel.style.backgroundColor = userData[user].theme;
        }
        
        // Start loading sequence with music
        await playMusic(user);
        
        // Show main content after 10 seconds
        setTimeout(() => {
            showMainContent();
            
            // Update archive title - keeping it consistent as "369 ARCHIVE"
            archiveTitle.textContent = "369 ARCHIVE";
            archiveTitle.style.color = userData[user].theme;
            
            // Load notes
            loadNotes();
        }, 10000); // Full 10 seconds loading time
    } catch (error) {
        console.error('Error in selectUser:', error);
    }
}

// Function to show main content with transition
function showMainContent() {
    const mainContent = document.getElementById('main-content');
    loadingScreen.style.display = 'none';
    mainContent.style.display = 'block';
    
    // Trigger reflow
    void mainContent.offsetWidth;
    
    // Add visible class for transition
    mainContent.classList.add('visible');
}