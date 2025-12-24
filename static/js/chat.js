document.addEventListener('DOMContentLoaded', function () {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const loadingIndicator = document.getElementById('loading-indicator');
    const micButton = document.getElementById('mic-button');
    const recordingIndicator = document.getElementById('recording-indicator');
    const recordingTimer = document.getElementById('recording-timer');
    const ttsAudio = document.getElementById('tts-audio');

    // Voice recording variables
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let recordingStartTime = null;
    let recordingTimerInterval = null;
    let ttsCache = {}; // Cache TTS responses to avoid duplicate API calls

    // --- Conversation Data Structure ---
    const conversationData = {
        sectors: [
            {
                id: 'civil_status',
                icon: 'fa-id-card',
                color: 'text-success',
                names: {
                    'العربية': 'الأحوال المدنية',
                    'English': 'Civil Status',
                    'हिंदी': 'नागरिक स्थिति',
                    'Filipino': 'Katayuang Sibil'
                },
                options: [
                    {
                        type: 'query',
                        names: { 'العربية': 'استفسارات عامة', 'English': 'General Inquiries', 'हिंदी': 'सामान्य पूछताछ', 'Filipino': 'Pangkalahatang Tanong' }
                    },
                    {
                        type: 'submenu',
                        names: { 'العربية': 'غرامات', 'English': 'Fines', 'हिंदी': 'जुर्माना', 'Filipino': 'Multa' },
                        items: [
                            { names: { 'العربية': 'غرامة انتهاء الهوية الوطنية', 'English': 'Expired National ID Fine', 'हिंदी': 'समाप्त राष्ट्रीय आईडी जुर्माना', 'Filipino': 'Multa sa Expired na ID' } },
                            { names: { 'العربية': 'غرامة فقدان الهوية', 'English': 'Lost ID Fine', 'हिंदी': 'खोया आईडी जुर्माना', 'Filipino': 'Multa sa Nawawalang ID' } },
                            { names: { 'العربية': 'غرامة عدم تجديد بطاقة العائلة', 'English': 'Family Card Non-renewal Fine', 'हिंदी': 'परिवार कार्ड नवीनीकरण न करने पर जुर्माना', 'Filipino': 'Multa sa Hindi Pag-renew ng Family Card' } }
                        ]
                    },
                    {
                        type: 'query',
                        names: { 'العربية': 'متطلبات الوثائق', 'English': 'Document Requirements', 'हिंदी': 'दस्तावेज़ आवश्यकताएँ', 'Filipino': 'Mga Kinakailangang Dokumento' }
                    }
                ]
            },
            {
                id: 'traffic',
                icon: 'fa-car',
                color: 'text-primary',
                names: {
                    'العربية': 'المرور',
                    'English': 'Traffic',
                    'हिंदी': 'यातायात',
                    'Filipino': 'Trapiko'
                },
                options: [
                    {
                        type: 'query',
                        names: { 'العربية': 'قوانين السير', 'English': 'Traffic Laws', 'हिंदी': 'यातायात नियम', 'Filipino': 'Batas Trapiko' }
                    },
                    {
                        type: 'submenu',
                        names: { 'العربية': 'قوانين المخالفات', 'English': 'Violation Fines', 'हिंदी': 'उल्लंघन जुर्माना', 'Filipino': 'Multa sa Paglabag' },
                        items: [
                            { names: { 'العربية': 'استخدام الجوال أثناء القيادة', 'English': 'Mobile Use While Driving', 'हिंदी': 'ड्राइविंग करते समय मोबाइल का उपयोग', 'Filipino': 'Paggamit ng Mobile Habang Nagmamaneho' } },
                            { names: { 'العربية': 'الوقوف الخاطئ', 'English': 'Wrong Parking', 'हिंदी': 'गलत पार्किंग', 'Filipino': 'Maling Paradahan' } },
                            { names: { 'العربية': 'عدم ربط الحزام', 'English': 'Not Wearing Seatbelt', 'हिंदी': 'सीटबेल्ट न पहनना', 'Filipino': 'Hindi Pagsusuot ng Seatbelt' } },
                            { names: { 'العربية': 'السرعة الزائدة', 'English': 'Speeding', 'हिंदी': 'तेज गति', 'Filipino': 'Mabilis na Pagpapatakbo' } }
                        ]
                    },
                    {
                        type: 'query',
                        names: { 'العربية': 'قوانين الرخص', 'English': 'License Laws', 'हिंदी': 'लाइसेंस नियम', 'Filipino': 'Batas sa Lisensya' }
                    }
                ]
            },
            {
                id: 'passports',
                icon: 'fa-passport',
                color: 'text-warning',
                names: {
                    'العربية': 'الجوازات',
                    'English': 'Passports',
                    'हिंदी': 'पासपोर्ट',
                    'Filipino': 'Pasaporte'
                },
                options: [
                    {
                        type: 'query',
                        names: { 'العربية': 'عقوبات التأشيرات', 'English': 'Visa Penalties', 'हिंदी': 'वीज़ा दंड', 'Filipino': 'Parusa sa Visa' }
                    },
                    {
                        type: 'submenu',
                        names: { 'العربية': 'عقوبات الإقامة', 'English': 'Residency Penalties', 'हिंदी': 'निवास दंड', 'Filipino': 'Parusa sa Residency' },
                        items: [
                            { names: { 'العربية': 'عدم تجديد الإقامة', 'English': 'Non-renewal of Residency', 'हिंदी': 'निवास का नवीनीकरण न करना', 'Filipino': 'Hindi Pag-renew ng Residency' } },
                            { names: { 'العربية': 'فقدان الإقامة', 'English': 'Lost Residency', 'हिंदी': 'निवास खोना', 'Filipino': 'Nawawalang Residency' } },
                            { names: { 'العربية': 'تشغيل عمالة مخالفة', 'English': 'Employing Illegal Labor', 'हिंदी': 'अवैध श्रम को रोजगार देना', 'Filipino': 'Pagtatrabaho ng Ilegal na Manggagawa' } }
                        ]
                    },
                    {
                        type: 'query',
                        names: { 'العربية': 'عقوبات السفر', 'English': 'Travel Bans', 'हिंदी': 'यात्रा प्रतिबंध', 'Filipino': 'Pagbabawal sa Paglalakbay' }
                    }
                ]
            },
            {
                id: 'cybercrime',
                icon: 'fa-laptop-code',
                color: 'text-danger',
                names: {
                    'العربية': 'الجرائم المعلوماتية',
                    'English': 'Cybercrime',
                    'हिंदी': 'साइबर अपराध',
                    'Filipino': 'Cybercrime'
                },
                options: [
                    {
                        type: 'query',
                        names: { 'العربية': 'استفسارات', 'English': 'Inquiries', 'हिंदी': 'पूछताछ', 'Filipino': 'Mga Tanong' }
                    },
                    {
                        type: 'submenu',
                        names: { 'العربية': 'عقوبات', 'English': 'Penalties', 'हिंदी': 'दंड', 'Filipino': 'Mga Parusa' },
                        items: [
                            { names: { 'العربية': 'نشر الإشاعات', 'English': 'Spreading Rumors', 'हिंदी': 'अफवाहें फैलाना', 'Filipino': 'Pagkakalat ng Tsismis' } },
                            { names: { 'العربية': 'الابتزاز الإلكتروني', 'English': 'Cyber Blackmail', 'हिंदी': 'साइबर ब्लैकमेल', 'Filipino': 'Cyber Blackmail' } },
                            { names: { 'العربية': 'اختراق الأنظمة', 'English': 'System Hacking', 'हिंदी': 'सिस्टम हैकिंग', 'Filipino': 'System Hacking' } },
                            { names: { 'العربية': 'التشهير', 'English': 'Defamation', 'हिंदी': 'मानहानि', 'Filipino': 'Paninirang-puri' } }
                        ]
                    },
                    {
                        type: 'query',
                        names: { 'العربية': 'تعريفات قانونية', 'English': 'Legal Definitions', 'हिंदी': 'कानूनी परिभाषाएँ', 'Filipino': 'Mga Legal na Kahulugan' }
                    }
                ]
            },
            {
                id: 'labor',
                icon: 'fa-users',
                color: 'text-info',
                names: {
                    'العربية': 'شؤون الوافدين',
                    'English': 'Expat Affairs',
                    'हिंदी': 'प्रवासी मामले',
                    'Filipino': 'Mga Usaping Expat'
                },
                options: [
                    {
                        type: 'query',
                        names: { 'العربية': 'حقوق العامل', 'English': 'Worker Rights', 'हिंदी': 'श्रमिक अधिकार', 'Filipino': 'Karapatan ng Manggagawa' }
                    },
                    {
                        type: 'submenu',
                        names: { 'العربية': 'غرامات العمالة', 'English': 'Labor Fines', 'हिंदी': 'श्रम जुर्माना', 'Filipino': 'Multa sa Paggawa' },
                        items: [
                            { names: { 'العربية': 'تشغيل عامل بدون إقامة', 'English': 'Employing Worker w/o Residency', 'हिंदी': 'बिना निवास के श्रमिक को रोजगार देना', 'Filipino': 'Pagtatrabaho ng Manggagawang Walang Residency' } },
                            { names: { 'العربية': 'ترك العامل يعمل لدى الغير', 'English': 'Letting Worker Work for Others', 'हिंदी': 'श्रमिक को दूसरों के लिए काम करने देना', 'Filipino': 'Pagpayag sa Manggagawa na Magtrabaho sa Iba' } },
                            { names: { 'العربية': 'عدم دفع رواتب العمال', 'English': 'Unpaid Salaries', 'हिंदी': 'वेतन न देना', 'Filipino': 'Hindi Pagbabayad ng Sahod' } }
                        ]
                    },
                    {
                        type: 'query',
                        names: { 'العربية': 'استفسارات عامة', 'English': 'General Inquiries', 'हिंदी': 'सामान्य पूछताछ', 'Filipino': 'Pangkalahatang Tanong' }
                    }
                ]
            }
        ]
    };

    // --- Translations ---
    const translations = {
        'العربية': {
            welcome_message: "مرحبا بك معك تبيّن مساعدك القانوني الذكي",
            services: "الخدمات",
            communication_channels: "قنوات التواصل",
            choose_sector_services: "اختر القطاع الذي ترغب بالاستفسار عنه:",
            choose_sector_contact: "التواصل مع القطاع اختر:",
            choose_inquiry: "اختر نوع الاستفسار:",
            please_choose: "من فضلك اختر:",
            sector_prefix: "قطاع",
            services_list: "قائمة الخدمات",
            placeholder: "اكتب رسالتك هنا...",
            contact_info: "معلومات التواصل مع"
        },
        'English': {
            welcome_message: "Welcome, I'm Tabayyun, your smart legal assistant",
            services: "Services",
            communication_channels: "Communication Channels",
            choose_sector_services: "Choose the sector you wish to inquire about:",
            choose_sector_contact: "Contact the sector, choose:",
            choose_inquiry: "Choose inquiry type:",
            please_choose: "Please choose:",
            sector_prefix: "Sector",
            services_list: "Services List",
            placeholder: "Type your message here...",
            contact_info: "Contact information for"
        },
        'हिंदी': {
            welcome_message: "स्वागत है, मैं तबय्युन हूं, आपका स्मार्ट कानूनी सहायक",
            services: "सेवाएं",
            communication_channels: "संचार चैनल",
            choose_sector_services: "वह क्षेत्र चुनें जिसके बारे में आप पूछताछ करना चाहते हैं:",
            choose_sector_contact: "क्षेत्र से संपर्क करें, चुनें:",
            choose_inquiry: "पूछताछ का प्रकार चुनें:",
            please_choose: "कृपया चुनें:",
            sector_prefix: "क्षेत्र",
            services_list: "सेवा सूची",
            placeholder: "अपना संदेश यहाँ टाइप करें...",
            contact_info: "संपर्क जानकारी"
        },
        'Filipino': {
            welcome_message: "Maligayang pagdating, ako si Tabayyun, ang iyong matalinong legal assistant",
            services: "Mga Serbisyo",
            communication_channels: "Mga Channel ng Komunikasyon",
            choose_sector_services: "Piliin ang sektor na nais mong itanong:",
            choose_sector_contact: "Makipag-ugnayan sa sektor, pumili:",
            choose_inquiry: "Piliin ang uri ng pagtatanong:",
            please_choose: "Mangyaring pumili:",
            sector_prefix: "Sektor",
            services_list: "Listahan ng Serbisyo",
            placeholder: "I-type ang iyong mensahe dito...",
            contact_info: "Impormasyon sa pakikipag-ugnayan para sa"
        }
    };

    // --- Initialization ---
    let currentLanguage = 'العربية';
    startConversation();

    function startConversation() {
        addBotMessage("السلام عليكم، أهلاً بك في تبيّن مساعدك القانوني أينما تكون.<br>فضلاً اختر اللغة:");
        renderOptions(['العربية', 'English', 'हिंदी', 'Filipino'], handleLanguageSelection);
    }

    function handleLanguageSelection(language) {
        currentLanguage = language;
        updateInputInterface(language);
        addUserMessage(language);
        showMainMenu();
    }

    function updateInputInterface(language) {
        const placeholderText = translations[language].placeholder;
        userInput.placeholder = placeholderText;

        if (language === 'العربية') {
            userInput.dir = 'rtl';
        } else {
            userInput.dir = 'ltr';
        }
    }

    function showMainMenu() {
        const msg = translations[currentLanguage].welcome_message;
        addBotMessage(msg);

        // Show two main options: Services and Communication Channels
        const mainOptions = [
            translations[currentLanguage].services,
            translations[currentLanguage].communication_channels
        ];
        renderOptions(mainOptions, handleMainOptionSelection);
    }

    function handleMainOptionSelection(option) {
        addUserMessage(option);

        const servicesText = translations[currentLanguage].services;
        const contactText = translations[currentLanguage].communication_channels;

        if (option === servicesText) {
            // Services flow
            setTimeout(() => {
                const msg = translations[currentLanguage].choose_sector_services;
                addBotMessage(msg);
                renderSectorGrid('services');
            }, 500);
        } else if (option === contactText) {
            // Communication channels flow
            setTimeout(() => {
                const msg = translations[currentLanguage].choose_sector_contact;
                addBotMessage(msg);
                renderSectorGrid('contact');
            }, 500);
        }
    }

    // --- Language Detection Helper ---
    function containsArabic(text) {
        const arabicRegex = /[\u0600-\u06FF]/;
        return arabicRegex.test(text);
    }

    function getDirectionClass(text, language = null) {
        // If language is explicitly provided
        if (language) {
            const rtlLanguages = ['ar', 'العربية'];
            if (rtlLanguages.includes(language)) {
                return 'rtl-message';
            }
            return 'ltr-message';
        }

        // Fallback to content detection
        return containsArabic(text) ? 'rtl-message' : 'ltr-message';
    }

    // --- Markdown Formatting ---
    function formatMarkdown(text) {
        let formatted = text;

        // Bold text
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');

        // Headers - enhanced with proper spacing
        formatted = formatted.replace(/^### (.+)$/gm, '<h6 class="fw-bold mt-3 mb-2 text-primary">$1</h6>');
        formatted = formatted.replace(/^## (.+)$/gm, '<h5 class="fw-bold mt-3 mb-2 text-primary">$1</h5>');
        formatted = formatted.replace(/^# (.+)$/gm, '<h4 class="fw-bold mt-3 mb-2 text-primary">$1</h4>');

        // Bullet points - improved list handling
        formatted = formatted.replace(/^\* (.+)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');

        // Wrap lists with better styling
        formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, function (match) {
            return '<ul class="mb-2" style="padding-left: 1.5rem; line-height: 1.8;">' + match + '</ul>';
        });

        // Enhance list items
        formatted = formatted.replace(/<li>(.+?)<\/li>/g, '<li style="margin-bottom: 0.5rem;">$1</li>');

        // Paragraphs - improved spacing
        formatted = formatted.replace(/\n\n/g, '</p><p class="mb-3">');
        formatted = '<p class="mb-2" style="line-height: 1.7;">' + formatted + '</p>';
        formatted = formatted.replace(/<p class="mb-[23]" style="line-height: 1.7;"><\/p>/g, '');

        // Add divider lines for visual separation
        formatted = formatted.replace(/^---$/gm, '<hr class="my-3" style="opacity: 0.3;">');

        return formatted;
    }

    // --- Rendering Functions ---
    const LEGAL_DISCLAIMER = `
        <div class="mt-3 p-2 rounded bg-light border border-secondary-subtle d-flex gap-2 align-items-start" dir="rtl">
            <i class="fa-solid fa-circle-info text-secondary mt-1"></i>
            <div class="small text-secondary" style="font-size: 0.75rem; line-height: 1.5;">
                <strong>ملاحظة:</strong> أنا "تبيّن" مساعدك القانوني. هذه ليست استشارة قانونية خاصة، وإنما مساعدة عامة تهدف لتقديم معلومات وإرشادات قانونية.
            </div>
        </div>`;

    function addBotMessage(content, language = null, footer = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'd-flex justify-content-end mb-3';

        const formattedContent = content.includes('<br>') ? content : formatMarkdown(content);

        // Determine direction based on language if provided, otherwise content
        const directionClass = getDirectionClass(content, language);

        messageDiv.innerHTML = `
            <div class="chat-bubble bot-bubble shadow-sm ${directionClass}">
                ${formattedContent}
                ${footer ? footer : ''}
            </div>
        `;
        chatMessages.appendChild(messageDiv);

        // Add TTS button for bot messages (except initial welcome messages)
        if (currentLanguage && !content.includes('اختر اللغة')) {
            // Extract text content without HTML tags for TTS
            const textOnly = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (textOnly.length > 0) {
                // Use the detected language for TTS button if available, otherwise current interface language
                addTTSButton(messageDiv, textOnly, language || currentLanguage);
            }
        }

        scrollToBottom();
    }

    function addUserMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'd-flex justify-content-start mb-3';

        const directionClass = getDirectionClass(content);

        messageDiv.innerHTML = `
            <div class="chat-bubble user-bubble shadow-sm ${directionClass}">
                ${content}
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function renderOptions(options, callback) {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'd-flex justify-content-end mb-3';

        const bubbleContent = document.createElement('div');
        bubbleContent.className = 'chat-bubble bot-bubble shadow-sm w-75';

        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.onclick = () => callback(option);
            bubbleContent.appendChild(btn);
        });

        optionsContainer.appendChild(bubbleContent);
        chatMessages.appendChild(optionsContainer);
        scrollToBottom();
    }

    function renderSectorGrid(flowType = 'services') {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'd-flex justify-content-end mb-3';

        const bubbleContent = document.createElement('div');
        bubbleContent.className = 'chat-bubble bot-bubble shadow-sm w-100';

        const grid = document.createElement('div');
        grid.className = 'sector-grid';

        conversationData.sectors.forEach(sector => {
            const card = document.createElement('div');
            card.className = 'sector-card-btn';
            const sectorName = sector.names[currentLanguage] || sector.names['العربية'];
            card.innerHTML = `
                <i class="fa-solid ${sector.icon}"></i>
                <span>${sectorName}</span>
            `;
            card.onclick = () => handleSectorSelection(sector, flowType);
            grid.appendChild(card);
        });

        bubbleContent.appendChild(grid);
        gridContainer.appendChild(bubbleContent);
        chatMessages.appendChild(gridContainer);
        scrollToBottom();
    }

    // --- Flow Logic ---
    function handleSectorSelection(sector, flowType = 'services') {
        const sectorName = sector.names[currentLanguage] || sector.names['العربية'];
        addUserMessage(sectorName);

        if (flowType === 'contact') {
            // Handle contact/communication flow
            handleContactFlow(sector);
        } else {
            // Handle services flow (original behavior)
            setTimeout(() => {
                const prefix = translations[currentLanguage].sector_prefix;
                const inquiryMsg = translations[currentLanguage].choose_inquiry;
                addBotMessage(`${prefix} ${sectorName} — ${inquiryMsg}`);

                const optionNames = sector.options.map(opt => opt.names[currentLanguage] || opt.names['العربية']);

                renderOptions(optionNames, (selectedOptionName) => {
                    const selectedOption = sector.options.find(opt =>
                        (opt.names[currentLanguage] || opt.names['العربية']) === selectedOptionName
                    );
                    handleOptionSelection(sector, selectedOption);
                });
            }, 500);
        }
    }

    function handleContactFlow(sector) {
        // Generate contact information query for Gemini
        const sectorNameArabic = sector.names['العربية'];
        const contactPrompt = `أريد معلومات التواصل الخاصة بقطاع ${sectorNameArabic}. أعطني أرقام الهواتف، البريد الإلكتروني، وأي قنوات تواصل رسمية متاحة.`;

        sendMessageToGemini(contactPrompt);
    }

    function handleOptionSelection(sector, option) {
        const optionName = option.names[currentLanguage] || option.names['العربية'];
        addUserMessage(optionName);

        if (option.type === 'submenu') {
            setTimeout(() => {
                const chooseMsg = translations[currentLanguage].please_choose;
                addBotMessage(chooseMsg);

                const subItemNames = option.items.map(item => item.names[currentLanguage] || item.names['العربية']);

                renderOptions(subItemNames, (selectedSubItemName) => {
                    handleFinalSelection(sector, option, selectedSubItemName);
                });
            }, 500);
        } else {
            handleFinalSelection(sector, option, null);
        }
    }

    function handleFinalSelection(sector, parentOption, subItemName) {
        if (subItemName) {
            addUserMessage(subItemName);
        }

        const sectorNameArabic = sector.names['العربية'];
        const optionNameArabic = parentOption.names['العربية'];

        let subItemNameArabic = subItemName;
        if (subItemName && parentOption.items) {
            const subItemObj = parentOption.items.find(item =>
                (item.names[currentLanguage] || item.names['العربية']) === subItemName
            );
            if (subItemObj) {
                subItemNameArabic = subItemObj.names['العربية'];
            }
        }

        let prompt = `أريد معلومات عن قطاع ${sectorNameArabic}. `;
        if (subItemNameArabic) {
            prompt += `تحديداً بخصوص "${subItemNameArabic}" ضمن "${optionNameArabic}". `;
        } else {
            prompt += `تحديداً بخصوص "${optionNameArabic}". `;
        }
        prompt += "اشرح لي التفاصيل القانونية والغرامات إن وجدت.";

        sendMessageToGemini(prompt);
    }

    // --- API Interaction ---
    async function sendMessageToGemini(message) {
        loadingIndicator.classList.remove('d-none');
        loadingIndicator.classList.add('d-flex');
        scrollToBottom();

        let finalMessage = message;
        if (currentLanguage !== 'العربية') {
            finalMessage += `\n\nIMPORTANT: Please respond in ${currentLanguage}.`;
        }

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: finalMessage }),
            });

            const data = await response.json();

            loadingIndicator.classList.add('d-none');
            loadingIndicator.classList.remove('d-flex');

            if (data.error) {
                addBotMessage('عذراً، حدث خطأ: ' + data.error, currentLanguage);
            } else {
                addBotMessage(data.response, currentLanguage, LEGAL_DISCLAIMER);
                showServicesButton();
            }

        } catch (error) {
            console.error('Error:', error);
            loadingIndicator.classList.add('d-none');
            loadingIndicator.classList.remove('d-flex');
            addBotMessage('عذراً، تعذر الاتصال بالخادم.');
        }
    }

    function showServicesButton() {
        const btnContainer = document.createElement('div');
        btnContainer.className = 'd-flex justify-content-center mb-3';

        const btn = document.createElement('button');
        btn.className = 'services-btn-main';
        const btnText = translations[currentLanguage].services_list;
        btn.textContent = btnText;
        btn.onclick = () => {
            addUserMessage(btnText);
            setTimeout(showMainMenu, 500);
        };

        btnContainer.appendChild(btn);
        chatMessages.appendChild(btnContainer);
        scrollToBottom();
    }

    function scrollToBottom() {
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // --- Manual Input Handling ---
    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        addUserMessage(message);
        userInput.value = '';
        sendMessageToGemini(message);
    });

    // --- Voice Recording Functions ---
    async function initializeMediaRecorder() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: mimeType });
                const blobSize = audioBlob.size;
                audioChunks = [];

                // Validate blob size (minimum 1KB)
                if (blobSize < 1024) {
                    console.warn('Audio blob too small:', blobSize, 'bytes');
                    const emptyMessages = {
                        'العربية': 'لم يتم تسجيل صوت. يرجى المحاولة مرة أخرى والتحدث بوضوح.',
                        'English': 'No audio recorded. Please try again and speak clearly.',
                        'हिंदी': 'कोई ऑडियो रिकॉर्ड नहीं हुआ। कृपया पुनः प्रयास करें और स्पष्ट रूप से बोलें।',
                        'Filipino': 'Walang naitala na audio. Pakisubukan muli at magsalita nang malinaw.'
                    };
                    addBotMessage(emptyMessages[currentLanguage] || emptyMessages['العربية']);
                    return;
                }

                console.log('Audio blob size:', blobSize, 'bytes');
                await transcribeAudio(audioBlob);
            };

            return true;
        } catch (error) {
            console.error('Error initializing media recorder:', error);
            const errorMessages = {
                'العربية': 'عذراً، لا يمكن الوصول إلى الميكروفون. يرجى التحقق من الأذونات.',
                'English': 'Sorry, cannot access microphone. Please check permissions.',
                'हिंदी': 'क्षमा करें, माइक्रोफ़ोन तक पहुंच नहीं है। कृपया अनुमतियाँ जांचें।',
                'Filipino': 'Paumanhin, hindi ma-access ang mikropono. Pakisuri ang mga pahintulot.'
            };
            addBotMessage(errorMessages[currentLanguage] || errorMessages['العربية']);
            return false;
        }
    }

    function startRecording() {
        if (isRecording || !mediaRecorder) return;

        audioChunks = [];
        isRecording = true;
        recordingStartTime = Date.now();

        // Start recording without timeslice to ensure valid header
        mediaRecorder.start();

        // Update UI
        micButton.classList.add('recording');
        recordingIndicator.classList.remove('d-none');

        // Start timer
        recordingTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            recordingTimer.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    function stopRecording() {
        if (!isRecording || !mediaRecorder) return;

        // Check minimum recording duration (500ms)
        const recordingDuration = Date.now() - recordingStartTime;
        if (recordingDuration < 500) {
            const tooShortMessages = {
                'العربية': 'التسجيل قصير جداً. يرجى الضغط باستمرار لمدة ثانية على الأقل.',
                'English': 'Recording too short. Please hold for at least 1 second.',
                'हिंदी': 'रिकॉर्डिंग बहुत छोटी है। कृपया कम से कम 1 सेकंड के लिए दबाए रखें।',
                'Filipino': 'Masyadong maikli ang recording. Mangyaring hawakan ng hindi bababa sa 1 segundo.'
            };
            addBotMessage(tooShortMessages[currentLanguage] || tooShortMessages['العربية']);

            // Reset
            isRecording = false;
            audioChunks = [];
            micButton.classList.remove('recording');
            recordingIndicator.classList.add('d-none');
            recordingTimer.textContent = '00:00';

            if (recordingTimerInterval) {
                clearInterval(recordingTimerInterval);
                recordingTimerInterval = null;
            }
            return;
        }

        isRecording = false;
        mediaRecorder.stop();

        // Clear timer
        if (recordingTimerInterval) {
            clearInterval(recordingTimerInterval);
            recordingTimerInterval = null;
        }

        // Reset UI
        micButton.classList.remove('recording');
        recordingIndicator.classList.add('d-none');
        recordingTimer.textContent = '00:00';
    }

    async function transcribeAudio(audioBlob) {
        const loadingMessages = {
            'العربية': 'جاري تحويل الصوت إلى نص...',
            'English': 'Converting speech to text...',
            'हिंदी': 'आवाज़ को टेक्स्ट में बदला जा रहा है...',
            'Filipino': 'Kinokomberte ang boses sa teksto...'
        };

        loadingIndicator.classList.remove('d-none');
        loadingIndicator.classList.add('d-flex');

        try {
            const formData = new FormData();
            // Determine extension based on blob type
            const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
            formData.append('audio', audioBlob, `recording.${extension}`);

            const response = await fetch('/voice-to-text', {
                method: 'POST',
                body: formData
            });

            loadingIndicator.classList.add('d-none');
            loadingIndicator.classList.remove('d-flex');

            // Check if response is audio (automatic TTS response)
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('audio')) {
                // Get transcription and response text from headers
                // Headers are base64 encoded to handle Arabic/Unicode text
                const encoding = response.headers.get('X-Encoding');
                let transcription = response.headers.get('X-Transcription');
                let responseText = response.headers.get('X-Response-Text');
                const language = response.headers.get('X-Language');

                // Decode base64 if encoding header is present
                if (encoding === 'base64') {
                    try {
                        transcription = decodeURIComponent(escape(atob(transcription)));
                        responseText = decodeURIComponent(escape(atob(responseText)));
                    } catch (e) {
                        console.error('Failed to decode headers:', e);
                    }
                }

                if (transcription) {
                    // Display user's transcribed message
                    addUserMessage(transcription);

                    // Get audio blob and play it
                    const audioBlob = await response.blob();
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Display bot's text response
                    if (responseText) {
                        addBotMessage(responseText, language, LEGAL_DISCLAIMER);

                        // Auto-play the TTS response
                        ttsAudio.src = audioUrl;
                        await ttsAudio.play();

                        // Show services button after response
                        showServicesButton();
                    }
                } else {
                    throw new Error('Missing transcription in response');
                }
            } else {
                // Fallback: handle JSON response (old format or error)
                const data = await response.json();

                if (data.success && data.transcription) {
                    const transcribedText = data.transcription.trim();
                    if (transcribedText) {
                        addUserMessage(transcribedText);

                        // If we have response text but no audio
                        if (data.response) {
                            addBotMessage(data.response, null, LEGAL_DISCLAIMER);
                            showServicesButton();
                        } else {
                            // Send to Gemini to get response
                            sendMessageToGemini(transcribedText);
                        }
                    } else {
                        const emptyMessages = {
                            'العربية': 'لم يتم اكتشاف أي كلام. يرجى المحاولة مرة أخرى.',
                            'English': 'No speech detected. Please try again.',
                            'हिंदी': 'कोई भाषण नहीं मिला। कृपया पुनः प्रयास करें।',
                            'Filipino': 'Walang nadetektang pananalita. Pakisubukan muli.'
                        };
                        addBotMessage(emptyMessages[currentLanguage] || emptyMessages['العربية']);
                    }
                } else {
                    throw new Error(data.error || 'Transcription failed');
                }
            }
        } catch (error) {
            console.error('Transcription error:', error);
            loadingIndicator.classList.add('d-none');
            loadingIndicator.classList.remove('d-flex');

            const errorMessages = {
                'العربية': 'عذراً، حدث خطأ أثناء تحويل الصوت. يرجى المحاولة مرة أخرى.',
                'English': 'Sorry, an error occurred during transcription. Please try again.',
                'हिंदी': 'क्षमा करें, ट्रांसक्रिप्शन के दौरान त्रुटि हुई। कृपया पुनः प्रयास करें।',
                'Filipino': 'Paumanhin, may error sa transcription. Pakisubukan muli.'
            };
            addBotMessage(errorMessages[currentLanguage] || errorMessages['العربية']);
        }
    }

    // --- Text-to-Speech Functions ---
    function addTTSButton(messageDiv, text) {
        // Check if we already have a speaker icon
        if (messageDiv.querySelector('.tts-speaker-icon')) return;

        const bubble = messageDiv.querySelector('.bot-bubble');
        if (!bubble) return;

        const speakerIcon = document.createElement('div');
        speakerIcon.className = 'tts-speaker-icon';
        speakerIcon.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        speakerIcon.title = 'استمع للرسالة';

        speakerIcon.addEventListener('click', async () => {
            if (speakerIcon.classList.contains('playing')) {
                // Stop playback
                ttsAudio.pause();
                ttsAudio.currentTime = 0;
                speakerIcon.classList.remove('playing');
                speakerIcon.querySelector('i').className = 'fa-solid fa-volume-high';
            } else {
                // Start playback
                await playTTS(text, speakerIcon);
            }
        });

        bubble.appendChild(speakerIcon);
    }

    async function playTTS(text, iconElement) {
        try {
            // Stop any currently playing audio
            ttsAudio.pause();
            ttsAudio.currentTime = 0;
            document.querySelectorAll('.tts-speaker-icon.playing').forEach(icon => {
                icon.classList.remove('playing');
                icon.querySelector('i').className = 'fa-solid fa-volume-high';
            });

            // Check cache
            const cacheKey = `${currentLanguage}_${text.substring(0, 100)}`;
            let audioUrl = ttsCache[cacheKey];

            if (!audioUrl) {
                // Generate TTS
                iconElement.classList.add('playing');
                iconElement.querySelector('i').className = 'fa-solid fa-spinner fa-spin';

                const response = await fetch('/text-to-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, language: currentLanguage })
                });

                if (!response.ok) {
                    throw new Error('TTS request failed');
                }

                const audioBlob = await response.blob();
                audioUrl = URL.createObjectURL(audioBlob);
                ttsCache[cacheKey] = audioUrl;
            }

            // Play audio
            ttsAudio.src = audioUrl;
            iconElement.classList.add('playing');
            iconElement.querySelector('i').className = 'fa-solid fa-pause';

            ttsAudio.onended = () => {
                iconElement.classList.remove('playing');
                iconElement.querySelector('i').className = 'fa-solid fa-volume-high';
            };

            await ttsAudio.play();
        } catch (error) {
            console.error('TTS error:', error);
            iconElement.classList.remove('playing');
            iconElement.querySelector('i').className = 'fa-solid fa-volume-high';

            const errorMessages = {
                'العربية': 'عذراً، حدث خطأ في تشغيل الصوت.',
                'English': 'Sorry, audio playback error.',
                'हिंदी': 'क्षमा करें, ऑडियो प्लेबैक त्रुटि।',
                'Filipino': 'Paumanhin, error sa audio playback.'
            };
            alert(errorMessages[currentLanguage] || errorMessages['العربية']);
        }
    }

    // --- Voice Event Listeners ---
    micButton.addEventListener('mousedown', async (e) => {
        e.preventDefault();
        if (!mediaRecorder) {
            const initialized = await initializeMediaRecorder();
            if (!initialized) return;
        }
        startRecording();
    });

    micButton.addEventListener('mouseup', (e) => {
        e.preventDefault();
        stopRecording();
    });

    micButton.addEventListener('mouseleave', (e) => {
        if (isRecording) {
            stopRecording();
        }
    });

    // Touch events for mobile
    micButton.addEventListener('touchstart', async (e) => {
        e.preventDefault();
        if (!mediaRecorder) {
            const initialized = await initializeMediaRecorder();
            if (!initialized) return;
        }
        startRecording();
    });

    micButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopRecording();
    });
});
