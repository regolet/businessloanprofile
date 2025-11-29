// Use relative URL for API calls (PHP version)
const API_URL = '/api';

let questions = [];
let currentQuestionIndex = 0;
let answers = [];
let selectedFiles = [];
let appCurrencySymbol = '$'; // Default currency symbol

// Format currency with commas (for display)
function formatAmountWithCommas(amount) {
    if (!amount) return '';

    // Remove any existing currency symbols and non-numeric characters except decimal
    let numStr = amount.toString().replace(/[^0-9.]/g, '');

    // Parse the number
    const num = parseFloat(numStr);
    if (isNaN(num)) return amount;

    // Format with commas
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Load currency setting from server
async function loadCurrencySettings() {
    try {
        const response = await fetch(`${API_URL}/public-settings.php`);
        if (response.ok) {
            const settings = await response.json();
            if (settings.company?.currency?.value) {
                appCurrencySymbol = settings.company.currency.value;
                // Update the loan amount placeholder with the correct currency
                const loanAmountInput = document.getElementById('loanAmountInput');
                if (loanAmountInput) {
                    loanAmountInput.placeholder = `e.g., ${appCurrencySymbol}50,000`;
                }
            }
        }
    } catch (error) {
        console.error('Error loading currency settings:', error);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadCurrencySettings();
    loadQuestions();
    setupContactForm();
    setupFileUpload();
    setupLoanAmountInput();
});

// Setup loan amount input with formatting
function setupLoanAmountInput() {
    const loanAmountInput = document.getElementById('loanAmountInput');
    if (!loanAmountInput) return;

    // Format on blur (when user leaves the field)
    loanAmountInput.addEventListener('blur', function() {
        const value = this.value.replace(/[^0-9.]/g, '');
        if (value) {
            this.value = appCurrencySymbol + formatAmountWithCommas(value);
        }
    });

    // Clean up on focus (when user enters the field)
    loanAmountInput.addEventListener('focus', function() {
        const value = this.value.replace(/[^0-9.]/g, '');
        if (value) {
            this.value = value;
        }
    });

    // Allow only numbers and decimal point while typing
    loanAmountInput.addEventListener('input', function() {
        // Remove non-numeric characters except decimal point
        const cursorPos = this.selectionStart;
        const originalLength = this.value.length;
        this.value = this.value.replace(/[^0-9.]/g, '');
        const newLength = this.value.length;
        // Adjust cursor position
        this.setSelectionRange(cursorPos - (originalLength - newLength), cursorPos - (originalLength - newLength));
    });
}

// Scroll to apply section
function scrollToApply() {
    document.getElementById('apply').scrollIntoView({ behavior: 'smooth' });
}

// Load questions from API
async function loadQuestions() {
    try {
        const response = await fetch(`${API_URL}/questions.php`);
        questions = await response.json();

        if (questions.length > 0) {
            displayQuestion(0);
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('questionnaireContainer').innerHTML =
            '<p>Unable to load questions. Please try again later.</p>';
    }
}

// Display a question
function displayQuestion(index) {
    const container = document.getElementById('questionnaireContainer');

    // Fade out existing content
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
        if (index >= questions.length) {
            showContactForm();
            container.style.opacity = '1';
            return;
        }

        const question = questions[index];

        // Update progress
        const progress = ((index + 1) / (questions.length + 1)) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;

        let optionsHtml = '';

        if (question.question_type === 'multiple_choice' && question.options.length > 0) {
            optionsHtml = '<div class="options">';
            question.options.forEach(option => {
                optionsHtml += `
                    <button class="option-button" onclick="selectOption(${index}, '${escapeHtml(option.option_text)}')">
                        ${escapeHtml(option.option_text)}
                    </button>
                `;
            });
            optionsHtml += '</div>';
        } else if (question.question_type === 'text') {
            optionsHtml = `
                <textarea class="text-input" id="textAnswer${index}" rows="4"
                    placeholder="Type your answer here..."></textarea>
            `;
        }

        container.innerHTML = `
            <div class="question animate-fadeIn">
                <div class="question-number">Question ${index + 1} of ${questions.length}</div>
                <h3>${escapeHtml(question.question_text)}</h3>
                ${optionsHtml}
                <div class="question-buttons">
                    ${index > 0 ? '<button class="btn-secondary" onclick="previousQuestion()">Back</button>' : ''}
                    ${question.question_type === 'text' ?
                `<button class="btn-primary" onclick="nextQuestion(${index})">Next</button>` :
                ''}
                </div>
            </div>
        `;

        currentQuestionIndex = index;

        // Fade in new content
        container.style.opacity = '1';
    }, 300);
}

// Select an option (for multiple choice)
function selectOption(questionIndex, optionText) {
    // Remove previous selection
    const buttons = document.querySelectorAll('.option-button');
    buttons.forEach(btn => btn.classList.remove('selected'));

    // Add selection to clicked button
    event.target.classList.add('selected');

    // Store answer
    storeAnswer(questionIndex, optionText);

    // Auto-advance after a short delay
    setTimeout(() => {
        displayQuestion(questionIndex + 1);
    }, 300);
}

// Store answer
function storeAnswer(questionIndex, answerText) {
    const question = questions[questionIndex];

    // Check if answer already exists
    const existingIndex = answers.findIndex(a => a.question_id === question.id);

    if (existingIndex >= 0) {
        answers[existingIndex].answer_text = answerText;
    } else {
        answers.push({
            question_id: question.id,
            answer_text: answerText
        });
    }
}

// Next question (for text input)
function nextQuestion(questionIndex) {
    const textInput = document.getElementById(`textAnswer${questionIndex}`);

    if (textInput) {
        const answerText = textInput.value.trim();

        if (answerText === '') {
            alert('Please provide an answer before continuing.');
            return;
        }

        storeAnswer(questionIndex, answerText);
    }

    displayQuestion(questionIndex + 1);
}

// Previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        displayQuestion(currentQuestionIndex - 1);
    }
}

// Show contact form
function showContactForm() {
    document.getElementById('questionnaireContainer').style.display = 'none';
    document.getElementById('contactFormContainer').style.display = 'block';

    // Update progress to 90%
    document.getElementById('progressFill').style.width = '90%';
}

// Setup contact form submission
function setupContactForm() {
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';
        submitBtn.classList.add('loading');

        const formData = new FormData(form);
        const contactInfo = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            business_name: formData.get('business_name'),
            loan_amount: formData.get('loan_amount')
        };

        // Submit application
        try {
            const response = await fetch(`${API_URL}/submit.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contact_info: contactInfo,
                    answers: answers,
                    send_email: true
                })
            });

            if (response.ok) {
                const result = await response.json();
                const leadId = result.id;

                // Upload documents if any selected
                if (selectedFiles.length > 0 && leadId) {
                    submitBtn.innerHTML = '<span class="loading-spinner"></span> Uploading documents...';
                    await uploadDocuments(leadId);
                }

                // Update progress to 100%
                document.getElementById('progressFill').style.width = '100%';

                // Show thank you message
                document.getElementById('contactFormContainer').style.display = 'none';
                document.getElementById('thankYouMessage').style.display = 'block';

                // Reset for next submission
                answers = [];
                currentQuestionIndex = 0;
                selectedFiles = [];
            } else {
                alert('There was an error submitting your application. Please try again.');
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                submitBtn.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('There was an error submitting your application. Please try again.');
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            submitBtn.classList.remove('loading');
        }
    });
}

// Setup file upload functionality
function setupFileUpload() {
    const uploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('documentUpload');

    if (!uploadArea || !fileInput) return;

    // Handle file input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag and drop handlers
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });
}

// Handle selected files
function handleFiles(files) {
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (let file of files) {
        // Check if already at max files
        if (selectedFiles.length >= maxFiles) {
            alert(`Maximum ${maxFiles} files allowed.`);
            break;
        }

        // Check file type
        if (file.type !== 'application/pdf') {
            alert(`${file.name} is not a PDF file.`);
            continue;
        }

        // Check file size
        if (file.size > maxSize) {
            alert(`${file.name} exceeds 10MB limit.`);
            continue;
        }

        // Check for duplicates
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            continue;
        }

        selectedFiles.push(file);
    }

    renderSelectedFiles();
}

// Render selected files list
function renderSelectedFiles() {
    const container = document.getElementById('selectedFiles');
    if (!container) return;

    if (selectedFiles.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = selectedFiles.map((file, index) => `
        <div class="selected-file">
            <div class="file-info">
                <svg class="file-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8" fill="none" stroke="white" stroke-width="2"/>
                </svg>
                <span class="file-name">${escapeHtml(file.name)}</span>
            </div>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button type="button" class="remove-file" onclick="removeFile(${index})" title="Remove file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');
}

// Remove a file from selection
function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderSelectedFiles();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Upload documents to server
async function uploadDocuments(leadId) {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    formData.append('lead_id', leadId);

    selectedFiles.forEach(file => {
        formData.append('documents[]', file);
    });

    try {
        const response = await fetch(`${API_URL}/upload-documents.php`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            console.error('Document upload errors:', result.errors);
        }
    } catch (error) {
        console.error('Error uploading documents:', error);
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return text;
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}
