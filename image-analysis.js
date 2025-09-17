// Image analysis functionality
document.addEventListener('DOMContentLoaded', function() {
    const cropImageInput = document.getElementById('crop_image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const cameraButton = document.getElementById('camera-button');
    const imageUploadModal = document.getElementById('image-upload-modal');
    const imageUploadForm = document.getElementById('image-upload-form');
    
    // Open image upload modal when camera button is clicked
    if (cameraButton) {
        cameraButton.addEventListener('click', function() {
            imageUploadModal.showModal();
        });
    }
    
    // Preview image when file is selected
    if (cropImageInput) {
        cropImageInput.addEventListener('change', function() {
            previewImage(this);
        });
    }
    
    // Handle form submission
    if (imageUploadForm) {
        imageUploadForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            
            const formData = new FormData();
            const imageFile = cropImageInput.files[0];
            
            if (!imageFile) {
                addBotMessage("Please select an image first.");
                return;
            }
            
            formData.append('image', imageFile);
            
            // Add initial messages
            addBotMessage("Analyzing your crop image...");
            imageUploadModal.close(); // Close the modal
            
            // Send request to backend
            fetch('/analyze_image', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.result) {
                    addBotMessage(data.result);
                } else {
                    addBotMessage("Sorry, I couldn't analyze the image. Please try again.");
                }
            })
            .catch(error => {
                console.error('Error:', error);
                addBotMessage("Sorry, there was an error analyzing the image. Please try again.");
            });
        });
    }
    
    // Preview uploaded image
    function previewImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block';
            }
            
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    // Function to add bot message to chat
    function addBotMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        
        const textElement = document.createElement('p');
        textElement.textContent = message;
        
        contentElement.appendChild(textElement);
        messageElement.appendChild(contentElement);
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});