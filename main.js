class VirtualPiano {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.volume = 0.8;
        this.octave = 4;
        this.activeOscillators = new Map();
        this.setupEventListeners();
        this.setupKeyboardMapping();
    }
    setupEventListeners() {
        // Piano key clicks
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('mousedown', (e) => this.playNote(e.target));
            key.addEventListener('mouseup', (e) => this.stopNote(e.target));
            key.addEventListener('mouseleave', (e) => this.stopNote(e.target));
        });
        // Volume control
        document.getElementById('volume').addEventListener('input', (e) => {
            this.volume = parseFloat(e.target.value);
        });
        // Octave control
        document.getElementById('octave').addEventListener('change', (e) => {
            this.octave = parseInt(e.target.value);
            this.updateFrequencies();
        });
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    setupKeyboardMapping() {
        this.keyMapping = {
            'a': 'C',
            'w': 'C#',
            's': 'D',
            'e': 'D#',
            'd': 'E',
            'f': 'F',
            't': 'F#',
            'g': 'G',
            'y': 'G#',
            'h': 'A',
            'u': 'A#',
            'j': 'B'
        };
    }
    updateFrequencies() {
        const baseFrequencies = {
            'C': 261.63,
            'C#': 277.18,
            'D': 293.66,
            'D#': 311.13,
            'E': 329.63,
            'F': 349.23,
            'F#': 369.99,
            'G': 392.00,
            'G#': 415.30,
            'A': 440.00,
            'A#': 466.16,
            'B': 493.88
        };
        const octaveMultiplier = Math.pow(2, this.octave - 4);
        document.querySelectorAll('.key').forEach(key => {
            const note = key.dataset.note;
            const newFreq = baseFrequencies[note] * octaveMultiplier;
            key.dataset.freq = newFreq.toFixed(2);
        });
    }
    createOscillator(frequency) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01)
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        return { oscillator, gainNode };
    }
    playNote(keyElement) {
        if (!keyElement || keyElement.classList.contains('active')) return;
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        const frequency = parseFloat(keyElement.dataset.freq);
        const note = keyElement.dataset.note;
        if (this.activeOscillators.has(note)) {
            this.stopNote(keyElement);
        }
        const { oscillator, gainNode } = this.createOscillator(frequency);
        
        oscillator.start();
        keyElement.classList.add('active');
        
        this.activeOscillators.set(note, { oscillator, gainNode, keyElement });
    }
    stopNote(keyElement) {
        if (!keyElement) return;
        const note = keyElement.dataset.note;
        const oscillatorData = this.activeOscillators.get(note);
        if (oscillatorData) {
            const { oscillator, gainNode } = oscillatorData;
            
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            oscillator.stop(this.audioContext.currentTime + 0.1);
            
            keyElement.classList.remove('active');
            this.activeOscillators.delete(note);
        }
    }
    handleKeyDown(event) {
        if (event.repeat) return;
        const key = event.key.toLowerCase();
        if (this.keyMapping[key]) {
            const note = this.keyMapping[key];
            const keyElement = document.querySelector(`[data-note="${note}"]`);
            if (keyElement) {
                this.playNote(keyElement);
            }
        }
    }
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        if (this.keyMapping[key]) {
            const note = this.keyMapping[key];
            const keyElement = document.querySelector(`[data-note="${note}"]`);
            if (keyElement) {
                this.stopNote(keyElement);
            }
        }
    }
}
// Initialize the piano when the page loads
window.addEventListener('load', () => {
    new VirtualPiano();
});