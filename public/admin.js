// Use relative URL for API calls (works in both dev and production)
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

let leads = [];
let questions = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    loadLeads();
    loadQuestions();
    setupQuestionForm();
});

// Show section
function showSection(section) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    // Show/hide sections
    if (section === 'leads') {
        document.getElementById('leadsSection').style.display = 'block';
        document.getElementById('questionsSection').style.display = 'none';
        document.getElementById('sectionTitle').textContent = 'Leads Management';
        document.getElementById('addNewBtn').style.display = 'none';
    } else if (section === 'questions') {
        document.getElementById('leadsSection').style.display = 'none';
        document.getElementById('questionsSection').style.display = 'block';
        document.getElementById('sectionTitle').textContent = 'Questions Management';
        document.getElementById('addNewBtn').style.display = 'block';
    }
}

// Load leads
async function loadLeads() {
    try {
        const response = await fetch(`${API_URL}/admin/leads`);
        leads = await response.json();

        displayLeadsStats();
        displayLeadsTable();
    } catch (error) {
        console.error('Error loading leads:', error);
    }
}

// Display leads stats
function displayLeadsStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const todayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= today;
    }).length;

    const weekLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= weekAgo;
    }).length;

    document.getElementById('totalLeads').textContent = leads.length;
    document.getElementById('todayLeads').textContent = todayLeads;
    document.getElementById('weekLeads').textContent = weekLeads;
}

// Display leads table
function displayLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');

    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No leads found</td></tr>';
        return;
    }

    tbody.innerHTML = leads.map(lead => `
        <tr>
            <td>${lead.id}</td>
            <td>${lead.name || '-'}</td>
            <td>${lead.email || '-'}</td>
            <td>${lead.phone || '-'}</td>
            <td>${lead.business_name || '-'}</td>
            <td>${lead.loan_amount || '-'}</td>
            <td>${formatDate(lead.created_at)}</td>
            <td>
                <button class="btn-primary btn-small" onclick="viewLead(${lead.id})">View</button>
            </td>
        </tr>
    `).join('');
}

// View lead details
async function viewLead(leadId) {
    try {
        const response = await fetch(`${API_URL}/admin/leads/${leadId}`);
        const lead = await response.json();

        const modal = document.getElementById('leadModal');
        const body = document.getElementById('leadDetailBody');

        body.innerHTML = `
            <div class="lead-info">
                <div class="info-row">
                    <div class="info-label">Name:</div>
                    <div class="info-value">${lead.name || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${lead.email || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${lead.phone || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Business Name:</div>
                    <div class="info-value">${lead.business_name || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Loan Amount:</div>
                    <div class="info-value">${lead.loan_amount || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Submitted:</div>
                    <div class="info-value">${formatDate(lead.created_at)}</div>
                </div>
            </div>

            <div class="answers-section">
                <h3>Questionnaire Answers</h3>
                ${lead.answers && lead.answers.length > 0 ?
                    lead.answers.map(answer => `
                        <div class="answer-item">
                            <div class="answer-question">${answer.question_text}</div>
                            <div class="answer-text">${answer.answer_text}</div>
                        </div>
                    `).join('') :
                    '<p>No answers recorded</p>'
                }
            </div>
        `;

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading lead details:', error);
        alert('Error loading lead details');
    }
}

// Close lead modal
function closeLeadModal() {
    document.getElementById('leadModal').style.display = 'none';
}

// Load questions
async function loadQuestions() {
    try {
        const response = await fetch(`${API_URL}/questions`);
        questions = await response.json();

        displayQuestions();
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

// Display questions
function displayQuestions() {
    const container = document.getElementById('questionsList');

    if (questions.length === 0) {
        container.innerHTML = '<p class="loading">No questions found</p>';
        return;
    }

    container.innerHTML = questions.map(question => `
        <div class="question-card">
            <div class="question-header">
                <h3>${question.question_text}</h3>
                <div class="btn-group">
                    <button class="btn-secondary btn-small" onclick="editQuestion(${question.id})">Edit</button>
                    <button class="btn-danger btn-small" onclick="deleteQuestion(${question.id})">Delete</button>
                </div>
            </div>
            <div class="question-meta">
                <span class="question-badge">${question.question_type.replace('_', ' ').toUpperCase()}</span>
                <span>Order: ${question.order_index}</span>
            </div>
            ${question.options && question.options.length > 0 ? `
                <div class="question-options">
                    <strong>Options:</strong>
                    ${question.options.map(opt => `<p>• ${opt.option_text}</p>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Show add question modal
function showAddQuestionModal() {
    document.getElementById('questionModalTitle').textContent = 'Add New Question';
    document.getElementById('questionForm').reset();
    document.getElementById('questionId').value = '';
    document.getElementById('questionModal').style.display = 'block';
    toggleOptions();
}

// Edit question
function editQuestion(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    document.getElementById('questionModalTitle').textContent = 'Edit Question';
    document.getElementById('questionId').value = question.id;
    document.getElementById('questionText').value = question.question_text;
    document.getElementById('questionType').value = question.question_type;
    document.getElementById('orderIndex').value = question.order_index;

    if (question.options && question.options.length > 0) {
        document.getElementById('questionOptions').value =
            question.options.map(opt => opt.option_text).join('\n');
    } else {
        document.getElementById('questionOptions').value = '';
    }

    document.getElementById('questionModal').style.display = 'block';
    toggleOptions();
}

// Delete question
async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/questions/${questionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Question deleted successfully');
            loadQuestions();
        } else {
            alert('Error deleting question');
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question');
    }
}

// Toggle options visibility
function toggleOptions() {
    const type = document.getElementById('questionType').value;
    const optionsGroup = document.getElementById('optionsGroup');

    if (type === 'multiple_choice') {
        optionsGroup.style.display = 'block';
    } else {
        optionsGroup.style.display = 'none';
    }
}

// Setup question form submission
function setupQuestionForm() {
    const form = document.getElementById('questionForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const questionId = document.getElementById('questionId').value;
        const questionText = document.getElementById('questionText').value;
        const questionType = document.getElementById('questionType').value;
        const orderIndex = parseInt(document.getElementById('orderIndex').value);
        const optionsText = document.getElementById('questionOptions').value;

        const options = optionsText
            .split('\n')
            .map(opt => opt.trim())
            .filter(opt => opt !== '');

        const data = {
            question_text: questionText,
            question_type: questionType,
            order_index: orderIndex,
            options: options
        };

        try {
            let response;

            if (questionId) {
                // Update existing question
                response = await fetch(`${API_URL}/admin/questions/${questionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new question
                response = await fetch(`${API_URL}/admin/questions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (response.ok) {
                alert('Question saved successfully');
                closeQuestionModal();
                loadQuestions();
            } else {
                alert('Error saving question');
            }
        } catch (error) {
            console.error('Error saving question:', error);
            alert('Error saving question');
        }
    });
}

// Close question modal
function closeQuestionModal() {
    document.getElementById('questionModal').style.display = 'none';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Close modals when clicking outside
window.onclick = function(event) {
    const leadModal = document.getElementById('leadModal');
    const questionModal = document.getElementById('questionModal');

    if (event.target === leadModal) {
        closeLeadModal();
    }
    if (event.target === questionModal) {
        closeQuestionModal();
    }
}
