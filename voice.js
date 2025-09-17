// Voice recording and processing functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const startRecordingBtn = document.getElementById('start-recording');
    const submitVoiceBtn = document.getElementById('submit-voice');
    let mediaRecorder;
    let audioChunks = [];
    
    if (startRecordingBtn && submitVoiceBtn) {
        startRecordingBtn.addEventListener('click', toggleRecording);
        submitVoiceBtn.addEventListener('click', submitRecording);
    }
    
    // Toggle recording state
    function toggleRecording() {
        if (startRecordingBtn.textContent === 'Start Recording') {
            startRecording();
        } else {
            stopRecording();
        }
    }
    
    // Start recording
    async function startRecording() {
        audioChunks = [];
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener('stop', () => {
                submitVoiceBtn.style.display = 'block';
            });
            
            mediaRecorder.start();
            startRecordingBtn.textContent = 'Stop Recording';
            startRecordingBtn.classList.add('recording');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check permissions.');
        }
    }
    
    // Stop recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            startRecordingBtn.textContent = 'Start Recording';
            startRecordingBtn.classList.remove('recording');
            
            // Stop all audio tracks
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }
    
    // Submit recording to server
    async function submitRecording(event) {
        event.preventDefault();
        
        if (audioChunks.length === 0) {
            alert('No recording available. Please record your voice first.');
            return;
        }
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        
        // Get translation preference
        const translateCheckbox = document.getElementById('translate-voice');
        const languageSelect = document.getElementById('voice-language');
        
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('request_type', 'voice_input');
        
        if (translateCheckbox && translateCheckbox.checked) {
            formData.append('translate', 'on');
            if (languageSelect) {
                formData.append('language', languageSelect.value);
            }
        }
        
        try {
            const response = await fetch('/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                // Reload page to show response
                window.location.reload();
            } else {
                alert('Error processing voice input. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting voice recording:', err);
            alert('Failed to submit recording. Please try again.');
        }
    }
});