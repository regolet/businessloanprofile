// Use relative URL for API calls (works in both dev and production)
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

let leads = [];
let filteredLeads = [];
let questions = [];
let currentPage = 1;
let rowsPerPage = 20;
let sortColumn = 'created_at';
let sortDirection = 'desc';
let searchTerm = '';

// Check authentication
function checkAuth() {
    const sessionToken = localStorage.getItem('adminSession');
    if (!sessionToken) {
        window.location.href = 'login.html';
        return false;
    }
    return sessionToken;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminSession');
        window.location.href = 'login.html';
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    const token = checkAuth();
    if (!token) return;

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

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('adminSession');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Load leads
async function loadLeads() {
    try {
        const response = await fetch(`${API_URL}/admin/leads`, {
            headers: getAuthHeaders()
        });
        leads = await response.json();

        // Sort by created_at descending by default
        leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        filteredLeads = [...leads];
        displayLeadsStats();
        displayLeadsTable();
        updatePagination();
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

    const todayLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= today;
    }).length;

    const weekLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= weekAgo;
    }).length;

    document.getElementById('totalLeads').textContent = filteredLeads.length;
    document.getElementById('todayLeads').textContent = todayLeads;
    document.getElementById('weekLeads').textContent = weekLeads;
}

// Search function
function applySearch() {
    searchTerm = document.getElementById('searchInput').value.toLowerCase();
    applyFilters();
}

// Combined filter function
function applyFilters() {
    const fromDate = document.getElementById('filterDateFrom').value;
    const toDate = document.getElementById('filterDateTo').value;

    filteredLeads = leads.filter(lead => {
        // Search filter
        let matchesSearch = true;
        if (searchTerm) {
            const searchableText = [
                lead.name || '',
                lead.email || '',
                lead.phone || '',
                lead.business_name || '',
                lead.loan_amount || ''
            ].join(' ').toLowerCase();

            matchesSearch = searchableText.includes(searchTerm);
        }

        // Date filter
        let matchesDate = true;
        if (fromDate || toDate) {
            const leadDate = new Date(lead.created_at);
            leadDate.setHours(0, 0, 0, 0);

            if (fromDate && toDate) {
                const from = new Date(fromDate);
                const to = new Date(toDate);
                matchesDate = leadDate >= from && leadDate <= to;
            } else if (fromDate) {
                const from = new Date(fromDate);
                matchesDate = leadDate >= from;
            } else if (toDate) {
                const to = new Date(toDate);
                matchesDate = leadDate <= to;
            }
        }

        return matchesSearch && matchesDate;
    });

    currentPage = 1;
    displayLeadsStats();
    displayLeadsTable();
    updatePagination();
}

// Clear all filters
function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    searchTerm = '';
    filteredLeads = [...leads];
    currentPage = 1;
    displayLeadsStats();
    displayLeadsTable();
    updatePagination();
}

// Sort table
function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    filteredLeads.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';

        // Handle dates
        if (column === 'created_at') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }

        // Handle numbers
        if (column === 'id') {
            aVal = parseInt(aVal);
            bVal = parseInt(bVal);
        }

        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    displayLeadsTable();
    updateSortIcons();
}

function updateSortIcons() {
    document.querySelectorAll('.sortable').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        icon.style.opacity = '0.3';
        icon.style.transform = 'rotate(0deg)';
    });

    const activeColumn = Array.from(document.querySelectorAll('.sortable'))
        .find(th => th.textContent.trim().toLowerCase().includes(sortColumn.replace('_', ' ')));

    if (activeColumn) {
        const icon = activeColumn.querySelector('.sort-icon');
        icon.style.opacity = '1';
        if (sortDirection === 'asc') {
            icon.style.transform = 'rotate(180deg)';
        }
    }
}

// Display leads table with pagination
function displayLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');

    if (filteredLeads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No leads found</td></tr>';
        return;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredLeads.length);
    const pageLeads = filteredLeads.slice(startIndex, endIndex);

    tbody.innerHTML = pageLeads.map(lead => `
        <tr>
            <td>${lead.id}</td>
            <td>${escapeHtml(lead.name) || '-'}</td>
            <td>${escapeHtml(lead.email) || '-'}</td>
            <td>${escapeHtml(lead.phone) || '-'}</td>
            <td>${escapeHtml(lead.business_name) || '-'}</td>
            <td>${escapeHtml(lead.loan_amount) || '-'}</td>
            <td>${formatDate(lead.created_at)}</td>
            <td>
                <button class="btn-icon" onclick="viewLead(${lead.id})" title="View Details">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');

    updateSortIcons();
}

// Pagination functions
function updatePagination() {
    const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage + 1;
    const endIndex = Math.min(startIndex + rowsPerPage - 1, filteredLeads.length);

    document.getElementById('showingFrom').textContent = filteredLeads.length > 0 ? startIndex : 0;
    document.getElementById('showingTo').textContent = filteredLeads.length > 0 ? endIndex : 0;
    document.getElementById('totalRecords').textContent = filteredLeads.length;

    // Update page numbers
    const pageNumbers = document.getElementById('pageNumbers');
    let pagesHTML = '';

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pagesHTML += `<button class="btn-page ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    pageNumbers.innerHTML = pagesHTML;

    // Enable/disable buttons
    document.getElementById('firstPageBtn').disabled = currentPage === 1;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('lastPageBtn').disabled = currentPage === totalPages || totalPages === 0;
}

function goToPage(page) {
    currentPage = page;
    displayLeadsTable();
    updatePagination();
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayLeadsTable();
        updatePagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayLeadsTable();
        updatePagination();
    }
}

function goToLastPage() {
    const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
    currentPage = totalPages;
    displayLeadsTable();
    updatePagination();
}

function changeRowsPerPage() {
    rowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
    currentPage = 1;
    displayLeadsTable();
    updatePagination();
}

// Export functions
async function exportToCSV() {
    const btn = document.getElementById('exportCsvBtn');
    const originalText = btn.innerHTML;

    try {
        // Show loading state
        btn.disabled = true;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10"/>
            </svg>
            Exporting...
        `;

        // Fetch full lead details including answers for all filtered leads
        const leadsWithAnswers = await Promise.all(
            filteredLeads.map(async (lead) => {
                const response = await fetch(`${API_URL}/admin/leads/${lead.id}`, {
                    headers: getAuthHeaders()
                });
                return await response.json();
            })
        );

        // Get all unique questions from all leads
        const allQuestions = new Set();
        leadsWithAnswers.forEach(lead => {
            if (lead.answers) {
                lead.answers.forEach(answer => {
                    allQuestions.add(answer.question_text);
                });
            }
        });
        const questionsList = Array.from(allQuestions);

        // Create headers
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Business', 'Loan Amount', 'Date', ...questionsList];

        // Create rows with answers
        const rows = leadsWithAnswers.map(lead => {
            const baseData = [
                lead.id,
                `"${(lead.name || '').replace(/"/g, '""')}"`,
                `"${(lead.email || '').replace(/"/g, '""')}"`,
                `"${(lead.phone || '').replace(/"/g, '""')}"`,
                `"${(lead.business_name || '').replace(/"/g, '""')}"`,
                `"${(lead.loan_amount || '').replace(/"/g, '""')}"`,
                `"${formatDate(lead.created_at)}"`
            ];

            // Add answers in the same order as questions
            const answers = questionsList.map(question => {
                const answer = lead.answers?.find(a => a.question_text === question);
                return `"${(answer?.answer_text || '').replace(/"/g, '""')}"`;
            });

            return [...baseData, ...answers].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadFile(csvContent, 'leads-export.csv', 'text/csv');
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('Error exporting to CSV. Please try again.');
    } finally {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function exportToJSON() {
    const btn = document.getElementById('exportJsonBtn');
    const originalText = btn.innerHTML;

    try {
        // Show loading state
        btn.disabled = true;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10"/>
            </svg>
            Exporting...
        `;

        // Fetch full lead details including answers for all filtered leads
        const leadsWithAnswers = await Promise.all(
            filteredLeads.map(async (lead) => {
                const response = await fetch(`${API_URL}/admin/leads/${lead.id}`, {
                    headers: getAuthHeaders()
                });
                return await response.json();
            })
        );

        const jsonContent = JSON.stringify(leadsWithAnswers, null, 2);
        downloadFile(jsonContent, 'leads-export.json', 'application/json');
    } catch (error) {
        console.error('Error exporting to JSON:', error);
        alert('Error exporting to JSON. Please try again.');
    } finally {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// View lead details
async function viewLead(leadId) {
    try {
        const response = await fetch(`${API_URL}/admin/leads/${leadId}`, {
            headers: getAuthHeaders()
        });
        const lead = await response.json();

        const modal = document.getElementById('leadModal');
        const body = document.getElementById('leadDetailBody');

        body.innerHTML = `
            <div class="lead-info">
                <div class="info-row">
                    <div class="info-label">Name:</div>
                    <div class="info-value">${escapeHtml(lead.name) || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${escapeHtml(lead.email) || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${escapeHtml(lead.phone) || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Business Name:</div>
                    <div class="info-value">${escapeHtml(lead.business_name) || '-'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Loan Amount:</div>
                    <div class="info-value">${escapeHtml(lead.loan_amount) || '-'}</div>
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
                            <div class="answer-question">${escapeHtml(answer.question_text)}</div>
                            <div class="answer-text">${escapeHtml(answer.answer_text)}</div>
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
                <h3>${escapeHtml(question.question_text)}</h3>
                <div class="btn-group">
                    <button class="btn-icon" onclick="editQuestion(${question.id})" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-icon-danger" onclick="deleteQuestion(${question.id})" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="question-meta">
                <span class="question-badge">${question.question_type.replace('_', ' ').toUpperCase()}</span>
                <span>Order: ${question.order_index}</span>
            </div>
            ${question.options && question.options.length > 0 ? `
                <div class="question-options">
                    <strong>Options:</strong>
                    ${question.options.map(opt => `<p>• ${escapeHtml(opt.option_text)}</p>`).join('')}
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
            method: 'DELETE',
            headers: getAuthHeaders()
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
                    headers: getAuthHeaders(),
                    body: JSON.stringify(data)
                });
            } else {
                // Create new question
                response = await fetch(`${API_URL}/admin/questions`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
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
window.onclick = function (event) {
    const leadModal = document.getElementById('leadModal');
    const questionModal = document.getElementById('questionModal');

    if (event.target === leadModal) {
        closeLeadModal();
    }
    if (event.target === questionModal) {
        closeQuestionModal();
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
