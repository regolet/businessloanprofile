const API_URL = 'http://localhost:3000/api';

let questions = [];
let currentQuestionIndex = 0;
let answers = [];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
    setupContactForm();
});

// Scroll to apply section
function scrollToApply() {
    document.getElementById('apply').scrollIntoView({ behavior: 'smooth' });
}

// Load questions from API
async function loadQuestions() {
    try {
        const response = await fetch(`${API_URL}/questions`);
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
    if (index >= questions.length) {
        showContactForm();
        return;
    }

    const question = questions[index];
    const container = document.getElementById('questionnaireContainer');

    // Update progress
    const progress = ((index + 1) / (questions.length + 1)) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;

    let optionsHtml = '';

    if (question.question_type === 'multiple_choice' && question.options.length > 0) {
        optionsHtml = '<div class="options">';
        question.options.forEach(option => {
            optionsHtml += `
                <button class="option-button" onclick="selectOption(${index}, '${escapeHtml(option.option_text)}')">
                    ${option.option_text}
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
        <div class="question">
            <div class="question-number">Question ${index + 1} of ${questions.length}</div>
            <h3>${question.question_text}</h3>
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
            const response = await fetch(`${API_URL}/submit`, {
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
                // Update progress to 100%
                document.getElementById('progressFill').style.width = '100%';

                // Show thank you message
                document.getElementById('contactFormContainer').style.display = 'none';
                document.getElementById('thankYouMessage').style.display = 'block';

                // Reset for next submission
                answers = [];
                currentQuestionIndex = 0;
            } else {
                alert('There was an error submitting your application. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('There was an error submitting your application. Please try again.');
        }
    });
}

// Helper function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
