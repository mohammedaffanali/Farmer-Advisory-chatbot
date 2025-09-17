// Farmer Advisory Chatbot functionality
document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const sendButton = document.getElementById('send-button');
    const micButton = document.getElementById('mic-button');
    const cameraButton = document.getElementById('camera-button');
    const languageSelect = document.getElementById('language-select');
    
    // Check for image analysis result from server
    const imageAnalysisResult = document.getElementById('image-analysis-result');
    if (imageAnalysisResult && imageAnalysisResult.value) {
        addBotMessage(imageAnalysisResult.value);
    }
    
    // Default language
    let currentLanguage = 'en';
    
    // Translations for all UI elements
    const translations = {
        'en': {
            'appTitle': 'Digital Krishi Officer',
            'features': 'Features',
            'admin': 'Admin',
            'chatHeader': 'AI Farmer Assistant',
            'inputPlaceholder': 'Type your farming question here...',
            'sendButton': 'Send',
            'welcomeMessage': "Hello! I'm your AI Farming Assistant. How can I help with your agricultural questions today?",
            'languageChanged': "Language changed to English. How can I help you?",
            'listening': "Listening...",
            'speechError': "Sorry, I couldn't hear that. Please try again.",
            'speechNotSupported': "Speech recognition is not supported in your browser.",
            'uploadPrompt': "To analyze crop images, please upload a photo of your crop.",
            'analyzing': "Analyzing your image...",
            'analyzeError': "Sorry, there was an error analyzing your image.",
            'featuresTitle': "How I Can Help You",
            'featureCards': {
                'crop': {
                    'title': "Crop Management",
                    'description': "Get advice on crop selection, rotation, planting times, and management practices."
                },
                'disease': {
                    'title': "Disease Identification",
                    'description': "Describe symptoms to identify crop diseases and get treatment recommendations."
                },
                'weather': {
                    'title': "Weather Insights",
                    'description': "Ask about weather patterns and how they might affect your farming decisions."
                },
                'market': {
                    'title': "Market Information",
                    'description': "Get insights on current market trends and pricing for agricultural products."
                }
            },
            'footer': "© 2024 Digital Krishi Officer - AI-Based Farmer Query Support and Advisory System",
            'modalTitle': "Crop Image Analysis",
            'uploadLabel': "Upload a photo of your crop for disease identification and treatment recommendations:",
            'analyzeButton': "Analyze Image"
        },
        'ml': {
            'appTitle': 'ഡിജിറ്റൽ കൃഷി ഓഫീസർ',
            'features': 'സവിശേഷതകൾ',
            'admin': 'അഡ്മിൻ',
            'chatHeader': 'എഐ കർഷക സഹായി',
            'inputPlaceholder': 'നിങ്ങളുടെ കൃഷി ചോദ്യം ഇവിടെ ടൈപ്പ് ചെയ്യുക...',
            'sendButton': 'അയയ്ക്കുക',
            'welcomeMessage': "ഹലോ! ഞാൻ നിങ്ങളുടെ എഐ കൃഷി സഹായിയാണ്. ഇന്ന് നിങ്ങളുടെ കാർഷിക ചോദ്യങ്ങളിൽ എങ്ങനെ സഹായിക്കാം?",
            'languageChanged': "ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി. എങ്ങനെ സഹായിക്കാം?",
            'listening': "കേൾക്കുന്നു...",
            'speechError': "ക്ഷമിക്കണം, എനിക്ക് അത് കേൾക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.",
            'speechNotSupported': "നിങ്ങളുടെ ബ്രൗസറിൽ സ്പീച്ച് റെക്കഗ്നിഷൻ പിന്തുണയ്ക്കുന്നില്ല.",
            'uploadPrompt': "വിളകൾ വിശകലനം ചെയ്യാൻ, നിങ്ങളുടെ വിളയുടെ ഒരു ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക.",
            'analyzing': "നിങ്ങളുടെ ചിത്രം വിശകലനം ചെയ്യുന്നു...",
            'analyzeError': "ക്ഷമിക്കണം, നിങ്ങളുടെ ചിത്രം വിശകലനം ചെയ്യുന്നതിൽ ഒരു പിശക് ഉണ്ടായി.",
            'featuresTitle': "എനിക്ക് എങ്ങനെ സഹായിക്കാൻ കഴിയും",
            'featureCards': {
                'crop': {
                    'title': "വിള മാനേജ്മെന്റ്",
                    'description': "വിള തിരഞ്ഞെടുക്കൽ, റൊട്ടേഷൻ, നടീൽ സമയം, മാനേജ്മെന്റ് രീതികൾ എന്നിവയെക്കുറിച്ച് ഉപദേശം നേടുക."
                },
                'disease': {
                    'title': "രോഗ തിരിച്ചറിയൽ",
                    'description': "വിള രോഗങ്ങൾ തിരിച്ചറിയാനും ചികിത്സാ ശുപാർശകൾ നേടാനും ലക്ഷണങ്ങൾ വിവരിക്കുക."
                },
                'weather': {
                    'title': "കാലാവസ്ഥാ ഇൻസൈറ്റുകൾ",
                    'description': "കാലാവസ്ഥാ പാറ്റേണുകളെക്കുറിച്ചും അവ നിങ്ങളുടെ കൃഷി തീരുമാനങ്ങളെ എങ്ങനെ ബാധിക്കുമെന്നതിനെക്കുറിച്ചും ചോദിക്കുക."
                },
                'market': {
                    'title': "വിപണി വിവരങ്ങൾ",
                    'description': "കാർഷിക ഉൽപ്പന്നങ്ങൾക്കായുള്ള നിലവിലെ വിപണി പ്രവണതകളെയും വിലനിർണ്ണയത്തെയും കുറിച്ചുള്ള ഇൻസൈറ്റുകൾ നേടുക."
                }
            },
            'footer': "© 2024 ഡിജിറ്റൽ കൃഷി ഓഫീസർ - എഐ അധിഷ്ഠിത കർഷക ചോദ്യ പിന്തുണ, ഉപദേശക സംവിധാനം",
            'modalTitle': "വിള ചിത്ര വിശകലനം",
            'uploadLabel': "രോഗ തിരിച്ചറിയലിനും ചികിത്സാ ശുപാർശകൾക്കുമായി നിങ്ങളുടെ വിളയുടെ ഒരു ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക:",
            'analyzeButton': "ചിത്രം വിശകലനം ചെയ്യുക"
        },
        'hi': {
            'appTitle': 'डिजिटल कृषि अधिकारी',
            'features': 'विशेषताएँ',
            'admin': 'व्यवस्थापक',
            'chatHeader': 'एआई किसान सहायक',
            'inputPlaceholder': 'अपना कृषि प्रश्न यहां टाइप करें...',
            'sendButton': 'भेजें',
            'welcomeMessage': "नमस्ते! मैं आपका एआई कृषि सहायक हूँ। आज मैं आपके कृषि संबंधी प्रश्नों में कैसे मदद कर सकता हूँ?",
            'languageChanged': "भाषा हिंदी में बदली गई। मैं आपकी कैसे सहायता कर सकता हूँ?",
            'listening': "सुन रहा हूँ...",
            'speechError': "क्षमा करें, मैं वह नहीं सुन पाया। कृपया पुनः प्रयास करें।",
            'speechNotSupported': "आपके ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है।",
            'uploadPrompt': "फसल छवियों का विश्लेषण करने के लिए, कृपया अपनी फसल की एक तस्वीर अपलोड करें।",
            'analyzing': "आपकी छवि का विश्लेषण किया जा रहा है...",
            'analyzeError': "क्षमा करें, आपकी छवि का विश्लेषण करने में एक त्रुटि हुई।",
            'featuresTitle': "मैं आपकी कैसे मदद कर सकता हूँ",
            'featureCards': {
                'crop': {
                    'title': "फसल प्रबंधन",
                    'description': "फसल चयन, रोटेशन, रोपण समय और प्रबंधन प्रथाओं पर सलाह प्राप्त करें।"
                },
                'disease': {
                    'title': "रोग पहचान",
                    'description': "फसल रोगों की पहचान करने और उपचार सिफारिशें प्राप्त करने के लिए लक्षणों का वर्णन करें।"
                },
                'weather': {
                    'title': "मौसम अंतर्दृष्टि",
                    'description': "मौसम पैटर्न और वे आपके कृषि निर्णयों को कैसे प्रभावित कर सकते हैं, इसके बारे में पूछें।"
                },
                'market': {
                    'title': "बाजार जानकारी",
                    'description': "कृषि उत्पादों के लिए वर्तमान बाजार रुझानों और मूल्य निर्धारण पर अंतर्दृष्टि प्राप्त करें।"
                }
            },
            'footer': "© 2024 डिजिटल कृषि अधिकारी - एआई-आधारित किसान प्रश्न समर्थन और सलाहकार प्रणाली",
            'modalTitle': "फसल छवि विश्लेषण",
            'uploadLabel': "रोग पहचान और उपचार सिफारिशों के लिए अपनी फसल की एक तस्वीर अपलोड करें:",
            'analyzeButton': "छवि का विश्लेषण करें"
        },
        'ta': {
            'appTitle': 'டிஜிட்டல் விவசாய அதிகாரி',
            'features': 'அம்சங்கள்',
            'admin': 'நிர்வாகி',
            'chatHeader': 'AI விவசாய உதவியாளர்',
            'inputPlaceholder': 'உங்கள் விவசாய கேள்வியை இங்கே தட்டச்சு செய்யவும்...',
            'sendButton': 'அனுப்பு',
            'welcomeMessage': "வணக்கம்! நான் உங்கள் AI விவசாய உதவியாளர். இன்று உங்கள் விவசாய கேள்விகளுக்கு எவ்வாறு உதவ முடியும்?",
            'languageChanged': "மொழி தமிழுக்கு மாற்றப்பட்டது. நான் எப்படி உதவ முடியும்?",
            'listening': "கேட்கிறேன்...",
            'speechError': "மன்னிக்கவும், எனக்கு அது கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.",
            'speechNotSupported': "உங்கள் உலாவியில் பேச்சு அங்கீகாரம் ஆதரிக்கப்படவில்லை.",
            'uploadPrompt': "பயிர் படங்களை பகுப்பாய்வு செய்ய, உங்கள் பயிரின் புகைப்படத்தை பதிவேற்றவும்.",
            'analyzing': "உங்கள் படத்தை பகுப்பாய்வு செய்கிறது...",
            'analyzeError': "மன்னிக்கவும், உங்கள் படத்தை பகுப்பாய்வு செய்வதில் பிழை ஏற்பட்டது.",
            'featuresTitle': "நான் எப்படி உதவ முடியும்",
            'featureCards': {
                'crop': {
                    'title': "பயிர் மேலாண்மை",
                    'description': "பயிர் தேர்வு, சுழற்சி, நடவு நேரங்கள் மற்றும் மேலாண்மை நடைமுறைகள் குறித்த ஆலோசனைகளைப் பெறுங்கள்."
                },
                'disease': {
                    'title': "நோய் அடையாளம்",
                    'description': "பயிர் நோய்களை அடையாளம் காணவும், சிகிச்சை பரிந்துரைகளைப் பெறவும் அறிகுறிகளை விவரிக்கவும்."
                },
                'weather': {
                    'title': "வானிலை நுண்ணறிவுகள்",
                    'description': "வானிலை முறைகள் மற்றும் அவை உங்கள் விவசாய முடிவுகளை எவ்வாறு பாதிக்கலாம் என்பது பற்றி கேளுங்கள்."
                },
                'market': {
                    'title': "சந்தை தகவல்",
                    'description': "விவசாய பொருட்களுக்கான தற்போதைய சந்தை போக்குகள் மற்றும் விலை நிர்ணயம் பற்றிய நுண்ணறிவுகளைப் பெறுங்கள்."
                }
            },
            'footer': "© 2024 டிஜிட்டல் விவசாய அதிகாரி - AI அடிப்படையிலான விவசாயி கேள்வி ஆதரவு மற்றும் ஆலோசனை அமைப்பு",
            'modalTitle': "பயிர் படம் பகுப்பாய்வு",
            'uploadLabel': "நோய் அடையாளம் மற்றும் சிகிச்சை பரிந்துரைகளுக்கு உங்கள் பயிரின் புகைப்படத்தை பதிவேற்றவும்:",
            'analyzeButton': "படத்தை பகுப்பாய்வு செய்"
        },
        'te': {
            'appTitle': 'డిజిటల్ వ్యవసాయ అధికారి',
            'features': 'ఫీచర్లు',
            'admin': 'అడ్మిన్',
            'chatHeader': 'AI రైతు సహాయకుడు',
            'inputPlaceholder': 'మీ వ్యవసాయ ప్రశ్నను ఇక్కడ టైప్ చేయండి...',
            'sendButton': 'పంపు',
            'welcomeMessage': "హలో! నేను మీ AI వ్యవసాయ సహాయకుడిని. నేడు మీ వ్యవసాయ ప్రశ్నలతో నేను ఎలా సహాయపడగలను?",
            'languageChanged': "భాష తెలుగుకు మార్చబడింది. నేను మీకు ఎలా సహాయం చేయగలను?",
            'listening': "వింటున్నాను...",
            'speechError': "క్షమించండి, నేను అది వినలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.",
            'speechNotSupported': "మీ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ మద్దతు లేదు.",
            'uploadPrompt': "పంట చిత్రాలను విశ్లేషించడానికి, దయచేసి మీ పంట యొక్క ఫోటోను అప్‌లోడ్ చేయండి.",
            'analyzing': "మీ చిత్రాన్ని విశ్లేషిస్తోంది...",
            'analyzeError': "క్షమించండి, మీ చిత్రాన్ని విశ్లేషించడంలో లోపం ఉంది.",
            'featuresTitle': "నేను మీకు ఎలా సహాయపడగలను",
            'featureCards': {
                'crop': {
                    'title': "పంట నిర్వహణ",
                    'description': "పంట ఎంపిక, రొటేషన్, నాటడం సమయాలు మరియు నిర్వహణ పద్ధతులపై సలహా పొందండి."
                },
                'disease': {
                    'title': "వ్యాధి గుర్తింపు",
                    'description': "పంట వ్యాధులను గుర్తించడానికి మరియు చికిత్స సిఫార్సులను పొందడానికి లక్షణాలను వివరించండి."
                },
                'weather': {
                    'title': "వాతావరణ అంతర్దృష్టులు",
                    'description': "వాతావరణ నమూనాల గురించి మరియు అవి మీ వ్యవసాయ నిర్ణయాలను ఎలా ప్రభావితం చేయవచ్చో అడగండి."
                },
                'market': {
                    'title': "మార్కెట్ సమాచారం",
                    'description': "వ్యవసాయ ఉత్పత్తుల కోసం ప్రస్తుత మార్కెట్ ధోరణులు మరియు ధరల గురించి అంతర్దృష్టులను పొందండి."
                }
            },
            'footer': "© 2024 డిజిటల్ వ్యవసాయ అధికారి - AI ఆధారిత రైతు ప్రశ్న మద్దతు మరియు సలహా వ్యవస్థ",
            'modalTitle': "పంట చిత్రం విశ్లేషణ",
            'uploadLabel': "వ్యాధి గుర్తింపు మరియు చికిత్స సిఫార్సుల కోసం మీ పంట యొక్క ఫోటోను అప్‌లోడ్ చేయండి:",
            'analyzeButton': "చిత్రాన్ని విశ్లేషించండి"
        }
    };
    
    // Function to update all UI elements based on selected language
    function updatePageLanguage(lang) {
        if (!translations[lang]) lang = 'en';
        currentLanguage = lang;
        
        // Update navigation elements
        document.getElementById('app-title').textContent = translations[lang].appTitle;
        document.getElementById('nav-features').textContent = translations[lang].features;
        document.getElementById('nav-admin').textContent = translations[lang].admin;
        
        // Update chat header
        document.getElementById('chat-header-title').textContent = translations[lang].chatHeader;
        
        // Update input placeholder
        userInput.placeholder = translations[lang].inputPlaceholder;
        
        // Update send button (if it has text)
        const sendButtonText = sendButton.querySelector('span');
        if (sendButtonText) {
            sendButtonText.textContent = translations[lang].sendButton;
        }
        
        // Update features section
        document.getElementById('features-title').textContent = translations[lang].featuresTitle || "How I Can Help You";
        
        // Update feature cards
        document.getElementById('feature-crop-title').textContent = translations[lang].featureCards.crop.title || "Crop Management";
        document.getElementById('feature-crop-desc').textContent = translations[lang].featureCards.crop.description || "Get advice on crop selection, rotation, planting times, and management practices.";
        
        document.getElementById('feature-disease-title').textContent = translations[lang].featureCards.disease.title || "Disease Identification";
        document.getElementById('feature-disease-desc').textContent = translations[lang].featureCards.disease.description || "Describe symptoms to identify crop diseases and get treatment recommendations.";
        
        document.getElementById('feature-weather-title').textContent = translations[lang].featureCards.weather.title || "Weather Insights";
        document.getElementById('feature-weather-desc').textContent = translations[lang].featureCards.weather.description || "Ask about weather patterns and how they might affect your farming decisions.";
        
        document.getElementById('feature-market-title').textContent = translations[lang].featureCards.market.title || "Market Information";
        document.getElementById('feature-market-desc').textContent = translations[lang].featureCards.market.description || "Get insights on current market trends and pricing for agricultural products.";
        
        // Update footer
        document.getElementById('footer-text').textContent = translations[lang].footer || "© 2024 Digital Krishi Officer - AI-Based Farmer Query Support and Advisory System";
        
        // Update image upload modal
        const uploadModal = document.getElementById('image-upload-modal');
        if (uploadModal) {
            document.getElementById('modal-title').textContent = translations[lang].modalTitle || "Crop Image Analysis";
            const uploadLabel = document.getElementById('upload-label');
            if (uploadLabel) {
                uploadLabel.childNodes[0].nodeValue = translations[lang].uploadLabel || "Upload a photo of your crop for disease identification and treatment recommendations:";
            }
            document.getElementById('analyze-button').textContent = translations[lang].analyzeButton || "Analyze Image";
        }
        
        // Add language change message
        addBotMessage(translations[lang].languageChanged);
        return translations[lang].languageChanged;
    }
    
    // Handle language change
    languageSelect.addEventListener('change', function(e) {
        updatePageLanguage(e.target.value);
    });
    
    // Initialize page with default language
    updatePageLanguage('en');
    
    // Handle microphone button
    micButton.addEventListener('click', function() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = currentLanguage === 'en' ? 'en-US' : 
                              (currentLanguage === 'ml' ? 'ml-IN' : 
                              (currentLanguage === 'hi' ? 'hi-IN' : 
                              (currentLanguage === 'ta' ? 'ta-IN' : 'te-IN')));
            
            micButton.classList.add('recording');
            addBotMessage(translations[currentLanguage].listening);
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                userInput.value = transcript;
                micButton.classList.remove('recording');
            };
            
            recognition.onerror = function() {
                addBotMessage(translations[currentLanguage].speechError);
                micButton.classList.remove('recording');
            };
            
            recognition.start();
        } else {
            addBotMessage(translations[currentLanguage].speechNotSupported);
        }
    });
    
    // Handle camera button
    cameraButton.addEventListener('click', function() {
        addBotMessage(translations[currentLanguage].uploadPrompt);
        
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.capture = 'camera';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Add the change event listener before clicking
        fileInput.addEventListener('change', function handleFileChange() {
            if (fileInput.files && fileInput.files[0]) {
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);
                
                addBotMessage(translations[currentLanguage].analyzing);
                showTypingIndicator();
                
                // Send image to server for analysis
                fetch('/analyze_image', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    removeTypingIndicator();
                    addBotMessage(data.result || translations[currentLanguage].analyzeError);
                })
                .catch(error => {
                    console.error('Error:', error);
                    removeTypingIndicator();
                    addBotMessage(translations[currentLanguage].analyzeError);
                })
                .finally(() => {
                    // Remove the file input from the DOM
                    document.body.removeChild(fileInput);
                    // Remove the event listener to prevent multiple uploads
                    fileInput.removeEventListener('change', handleFileChange);
                });
            } else {
                // Remove the file input if no file was selected
                document.body.removeChild(fileInput);
            }
        });
        
        // Trigger the file selection dialog
        fileInput.click();
    });
    
    // Handle form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const message = userInput.value.trim();
        
        if (message) {
            // Add user message to chat
            addUserMessage(message);
            
            // Clear input field
            userInput.value = '';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Send message to server
            sendMessageToServer(message);
        }
    });
    
    // Function to add user message to chat
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${escapeHtml(message)}</p>
            </div>
        `;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }
    
    // Function to add bot message to chat
    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'message bot-message typing-indicator';
        typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingElement);
        scrollToBottom();
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Function to send message to server
    function sendMessageToServer(message) {
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response to chat
            addBotMessage(data.response);
        })
        .catch(error => {
            console.error('Error:', error);
            removeTypingIndicator();
            addBotMessage("Sorry, I encountered an error processing your request. Please try again.");
        });
    }
    
    // Function to scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});