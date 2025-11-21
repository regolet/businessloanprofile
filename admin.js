// Use relative URL for API calls (PHP version)
const API_URL = '/api';

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

// Toggle mobile menu
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const burgerMenu = document.getElementById('burgerMenu');
    const body = document.body;

    sidebar.classList.toggle('active');
    burgerMenu.classList.toggle('active');
    body.classList.toggle('menu-open');
}

// Close mobile menu when clicking a nav item
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const burgerMenu = document.getElementById('burgerMenu');
                const body = document.body;

                sidebar.classList.remove('active');
                burgerMenu.classList.remove('active');
                body.classList.remove('menu-open');
            }
        });
    });

    // Close menu when clicking overlay
    document.body.addEventListener('click', (e) => {
        if (e.target === document.body && document.body.classList.contains('menu-open')) {
            toggleMobileMenu();
        }
    });
});

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    const token = checkAuth();
    if (!token) return;

    loadLeads();
    loadQuestions();
    loadSettings();
    loadDynamicContent();
    setupQuestionForm();
    setupSettingsForm();
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
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('sectionTitle').textContent = 'Leads Management';
        document.getElementById('addNewBtn').style.display = 'none';
    } else if (section === 'questions') {
        document.getElementById('leadsSection').style.display = 'none';
        document.getElementById('questionsSection').style.display = 'block';
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('sectionTitle').textContent = 'Questions Management';
        document.getElementById('addNewBtn').style.display = 'block';
    } else if (section === 'settings') {
        document.getElementById('leadsSection').style.display = 'none';
        document.getElementById('questionsSection').style.display = 'none';
        document.getElementById('settingsSection').style.display = 'block';
        document.getElementById('sectionTitle').textContent = 'Site Settings';
        document.getElementById('addNewBtn').style.display = 'none';
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
        const response = await fetch(`${API_URL}/admin-leads.php`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            window.location.href = 'admin-login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('Invalid response format:', data);
            leads = [];
        } else {
            leads = data;
            // Sort by created_at descending by default
            leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

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
                const response = await fetch(`${API_URL}/admin-leads.php?id=${lead.id}`, {
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
                const response = await fetch(`${API_URL}/admin-leads.php?id=${lead.id}`, {
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
        const response = await fetch(`${API_URL}/admin-leads.php?id=${leadId}`, {
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
        const response = await fetch(`${API_URL}/questions.php`);
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
        const response = await fetch(`${API_URL}/admin-questions.php?id=${questionId}`, {
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
                response = await fetch(`${API_URL}/admin-questions.php?id=${questionId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(data)
                });
            } else {
                // Create new question
                response = await fetch(`${API_URL}/admin-questions.php`, {
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

// Settings Management

let siteSettings = {};

// Load settings
async function loadSettings() {
    try {
        const response = await fetch(`${API_URL}/admin-settings.php`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            window.location.href = 'admin-login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        siteSettings = await response.json();

        displaySettings();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Display settings in form
function displaySettings() {
    // Company settings
    if (siteSettings.company) {
        const companyName = document.getElementById('company_name');
        const companyEmail = document.getElementById('company_email');
        const companyPhone = document.getElementById('company_phone');
        const companyAddress = document.getElementById('company_address');

        if (companyName) companyName.value = siteSettings.company.name?.value || '';
        if (companyEmail) companyEmail.value = siteSettings.company.email?.value || '';
        if (companyPhone) companyPhone.value = siteSettings.company.phone?.value || '';
        if (companyAddress) companyAddress.value = siteSettings.company.address?.value || '';
    }

    // Hero section
    if (siteSettings.hero) {
        const heroTitle = document.getElementById('hero_title');
        const heroSubtitle = document.getElementById('hero_subtitle');
        const heroCtaText = document.getElementById('hero_cta_text');
        const heroNote = document.getElementById('hero_note');
        const heroImageUrl = document.getElementById('hero_image_url');

        if (heroTitle) heroTitle.value = siteSettings.hero.title?.value || '';
        if (heroSubtitle) heroSubtitle.value = siteSettings.hero.subtitle?.value || '';
        if (heroCtaText) heroCtaText.value = siteSettings.hero.cta_text?.value || '';
        if (heroNote) heroNote.value = siteSettings.hero.note?.value || '';
        if (heroImageUrl) heroImageUrl.value = siteSettings.hero.image_url?.value || '';
    }

    // Hero features
    if (siteSettings.hero_features) {
        const feature1 = document.getElementById('hero_features_feature1_text');
        const feature2 = document.getElementById('hero_features_feature2_text');
        const feature3 = document.getElementById('hero_features_feature3_text');

        if (feature1) feature1.value = siteSettings.hero_features.feature1_text?.value || '';
        if (feature2) feature2.value = siteSettings.hero_features.feature2_text?.value || '';
        if (feature3) feature3.value = siteSettings.hero_features.feature3_text?.value || '';
    }

    // Loan types
    if (siteSettings.loan_types) {
        const loanTypesTitle = document.getElementById('loan_types_section_title');
        const loanTypesSubtitle = document.getElementById('loan_types_section_subtitle');

        if (loanTypesTitle) loanTypesTitle.value = siteSettings.loan_types.section_title?.value || '';
        if (loanTypesSubtitle) loanTypesSubtitle.value = siteSettings.loan_types.section_subtitle?.value || '';
    }

    // How it works
    if (siteSettings.how_it_works) {
        const howItWorksTitle = document.getElementById('how_it_works_section_title');
        const howItWorksSubtitle = document.getElementById('how_it_works_section_subtitle');

        if (howItWorksTitle) howItWorksTitle.value = siteSettings.how_it_works.section_title?.value || '';
        if (howItWorksSubtitle) howItWorksSubtitle.value = siteSettings.how_it_works.section_subtitle?.value || '';
    }

    // FAQ
    if (siteSettings.faq) {
        for (let i = 1; i <= 4; i++) {
            const questionEl = document.getElementById(`faq_faq${i}_question`);
            const answerEl = document.getElementById(`faq_faq${i}_answer`);

            if (questionEl) questionEl.value = siteSettings.faq[`faq${i}_question`]?.value || '';
            if (answerEl) answerEl.value = siteSettings.faq[`faq${i}_answer`]?.value || '';
        }
    }
}

// Setup settings form submission
function setupSettingsForm() {
    const form = document.getElementById('settingsForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const settings = {
            company: {},
            hero: {},
            hero_features: {},
            loan_types: {},
            how_it_works: {},
            faq: {}
        };

        // Organize form data by category
        for (let [name, value] of formData.entries()) {
            const parts = name.split('_');
            const category = parts[0];
            
            if (category === 'hero' && parts[1] === 'features') {
                settings.hero_features[parts.slice(2).join('_')] = value;
            } else if (category === 'loan' && parts[1] === 'types') {
                settings.loan_types[parts.slice(2).join('_')] = value;
            } else if (category === 'how') {
                settings.how_it_works[parts.slice(3).join('_')] = value;
            } else {
                settings[category][parts.slice(1).join('_')] = value;
            }
        }

        try {
            const response = await fetch(`${API_URL}/admin-settings.php`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ settings })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Settings saved successfully!');
                loadSettings();
            } else {
                alert('Error saving settings: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. Please try again.');
        }
    });
}

// ============= SETTINGS TAB SWITCHING =============
let currentSettingsTab = 'company';

function switchSettingsTab(tabName) {
    currentSettingsTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const tabContentMap = {
        'company': 'companyTab',
        'hero': 'heroTab',
        'features': 'featuresTab',
        'loantypes': 'loantypesTab',
        'howitworks': 'howitworksTab',
        'faq': 'faqTab'
    };

    document.getElementById(tabContentMap[tabName])?.classList.add('active');
}

// ============= DYNAMIC CONTENT MANAGEMENT =============
let heroFeatures = [];
let loanTypes = [];
let howItWorksSteps = [];
let faqs = [];

async function loadDynamicContent() {
    await loadHeroFeatures();
    await loadLoanTypes();
    await loadHowItWorksSteps();
    await loadFAQs();
}

// ============= HERO FEATURES =============
async function loadHeroFeatures() {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=hero_features`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            window.location.href = 'admin-login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('Invalid response format:', data);
            heroFeatures = [];
        } else {
            heroFeatures = data;
        }

        displayHeroFeatures();
    } catch (error) {
        console.error('Error loading hero features:', error);
    }
}

function displayHeroFeatures() {
    const container = document.getElementById('heroFeaturesList');
    if (!container) return;

    container.innerHTML = heroFeatures.length === 0
        ? '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No features added yet. Click "Add Feature" to get started.</p>'
        : '';

    heroFeatures.forEach((feature, index) => {
        const featureDiv = document.createElement('div');
        featureDiv.className = 'dynamic-item';
        featureDiv.innerHTML = `
            <div class="dynamic-item-header">
                <h4>Feature ${index + 1}</h4>
                <div class="dynamic-item-actions">
                    <button type="button" class="btn-icon" onclick="editHeroFeature(${feature.id})" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button type="button" class="btn-icon danger" onclick="deleteHeroFeature(${feature.id})" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label>Feature Text</label>
                <input type="text" value="${feature.feature_text}" id="feature_${feature.id}" disabled>
            </div>
        `;
        container.appendChild(featureDiv);
    });
}

function addHeroFeature() {
    const text = prompt('Enter feature text:');
    if (!text) return;

    saveHeroFeature({ feature_text: text, order_index: heroFeatures.length + 1 });
}

function editHeroFeature(id) {
    const feature = heroFeatures.find(f => f.id === id);
    if (!feature) return;

    const newText = prompt('Edit feature text:', feature.feature_text);
    if (newText === null) return;

    updateHeroFeature(id, { feature_text: newText, order_index: feature.order_index });
}

async function saveHeroFeature(data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=hero_features`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadHeroFeatures();
        } else {
            alert('Error saving feature');
        }
    } catch (error) {
        console.error('Error saving feature:', error);
        alert('Error saving feature');
    }
}

async function updateHeroFeature(id, data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=hero_features&id=${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadHeroFeatures();
        } else {
            alert('Error updating feature');
        }
    } catch (error) {
        console.error('Error updating feature:', error);
        alert('Error updating feature');
    }
}

async function deleteHeroFeature(id) {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=hero_features&id=${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            await loadHeroFeatures();
        } else {
            alert('Error deleting feature');
        }
    } catch (error) {
        console.error('Error deleting feature:', error);
        alert('Error deleting feature');
    }
}

// ============= LOAN TYPES =============
async function loadLoanTypes() {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=loan_types`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            window.location.href = 'admin-login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('Invalid response format:', data);
            loanTypes = [];
        } else {
            loanTypes = data;
        }

        displayLoanTypes();
    } catch (error) {
        console.error('Error loading loan types:', error);
    }
}

function displayLoanTypes() {
    const container = document.getElementById('loanTypesList');
    if (!container) return;

    container.innerHTML = loanTypes.length === 0
        ? '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No loan types added yet. Click "Add Loan Type" to get started.</p>'
        : '';

    loanTypes.forEach((type, index) => {
        const typeDiv = document.createElement('div');
        typeDiv.className = 'dynamic-item';
        typeDiv.innerHTML = `
            <div class="dynamic-item-header">
                <h4>${type.title}</h4>
                <div class="dynamic-item-actions">
                    <button type="button" class="btn-icon" onclick="editLoanType(${type.id})" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button type="button" class="btn-icon danger" onclick="deleteLoanType(${type.id})" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" value="${type.title}" disabled>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea rows="2" disabled>${type.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Icon Name</label>
                <input type="text" value="${type.icon_name || ''}" disabled>
            </div>
        `;
        container.appendChild(typeDiv);
    });
}

function addLoanType() {
    const title = prompt('Enter loan type title:');
    if (!title) return;

    const description = prompt('Enter description:');
    const iconName = prompt('Enter icon name (optional):') || 'file-text';

    saveLoanType({
        title,
        description,
        icon_name: iconName,
        order_index: loanTypes.length + 1
    });
}

function editLoanType(id) {
    const type = loanTypes.find(t => t.id === id);
    if (!type) return;

    const title = prompt('Edit loan type title:', type.title);
    if (title === null) return;

    const description = prompt('Edit description:', type.description);
    if (description === null) return;

    const iconName = prompt('Edit icon name:', type.icon_name);
    if (iconName === null) return;

    updateLoanType(id, {
        title,
        description,
        icon_name: iconName,
        order_index: type.order_index
    });
}

async function saveLoanType(data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=loan_types`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadLoanTypes();
        } else {
            alert('Error saving loan type');
        }
    } catch (error) {
        console.error('Error saving loan type:', error);
        alert('Error saving loan type');
    }
}

async function updateLoanType(id, data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=loan_types&id=${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadLoanTypes();
        } else {
            alert('Error updating loan type');
        }
    } catch (error) {
        console.error('Error updating loan type:', error);
        alert('Error updating loan type');
    }
}

async function deleteLoanType(id) {
    if (!confirm('Are you sure you want to delete this loan type?')) return;

    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=loan_types&id=${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            await loadLoanTypes();
        } else {
            alert('Error deleting loan type');
        }
    } catch (error) {
        console.error('Error deleting loan type:', error);
        alert('Error deleting loan type');
    }
}

// ============= HOW IT WORKS STEPS =============
async function loadHowItWorksSteps() {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=how_it_works`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            window.location.href = 'admin-login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('Invalid response format:', data);
            howItWorksSteps = [];
        } else {
            howItWorksSteps = data;
        }

        displayHowItWorksSteps();
    } catch (error) {
        console.error('Error loading how it works steps:', error);
    }
}

function displayHowItWorksSteps() {
    const container = document.getElementById('howItWorksStepsList');
    if (!container) return;

    container.innerHTML = howItWorksSteps.length === 0
        ? '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No steps added yet. Click "Add Step" to get started.</p>'
        : '';

    howItWorksSteps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'dynamic-item';
        stepDiv.innerHTML = `
            <div class="dynamic-item-header">
                <h4>Step ${step.step_number}: ${step.title}</h4>
                <div class="dynamic-item-actions">
                    <button type="button" class="btn-icon" onclick="editHowItWorksStep(${step.id})" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button type="button" class="btn-icon danger" onclick="deleteHowItWorksStep(${step.id})" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label>Step Number</label>
                <input type="number" value="${step.step_number}" disabled>
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" value="${step.title}" disabled>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea rows="2" disabled>${step.description || ''}</textarea>
            </div>
        `;
        container.appendChild(stepDiv);
    });
}

function addHowItWorksStep() {
    const stepNumber = prompt('Enter step number:', howItWorksSteps.length + 1);
    if (!stepNumber) return;

    const title = prompt('Enter step title:');
    if (!title) return;

    const description = prompt('Enter description:');

    saveHowItWorksStep({
        step_number: parseInt(stepNumber),
        title,
        description,
        order_index: howItWorksSteps.length + 1
    });
}

function editHowItWorksStep(id) {
    const step = howItWorksSteps.find(s => s.id === id);
    if (!step) return;

    const stepNumber = prompt('Edit step number:', step.step_number);
    if (stepNumber === null) return;

    const title = prompt('Edit title:', step.title);
    if (title === null) return;

    const description = prompt('Edit description:', step.description);
    if (description === null) return;

    updateHowItWorksStep(id, {
        step_number: parseInt(stepNumber),
        title,
        description,
        order_index: step.order_index
    });
}

async function saveHowItWorksStep(data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=how_it_works`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadHowItWorksSteps();
        } else {
            alert('Error saving step');
        }
    } catch (error) {
        console.error('Error saving step:', error);
        alert('Error saving step');
    }
}

async function updateHowItWorksStep(id, data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=how_it_works&id=${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadHowItWorksSteps();
        } else {
            alert('Error updating step');
        }
    } catch (error) {
        console.error('Error updating step:', error);
        alert('Error updating step');
    }
}

async function deleteHowItWorksStep(id) {
    if (!confirm('Are you sure you want to delete this step?')) return;

    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=how_it_works&id=${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            await loadHowItWorksSteps();
        } else {
            alert('Error deleting step');
        }
    } catch (error) {
        console.error('Error deleting step:', error);
        alert('Error deleting step');
    }
}

// ============= FAQs =============
async function loadFAQs() {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=faqs`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            window.location.href = 'admin-login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('Invalid response format:', data);
            faqs = [];
        } else {
            faqs = data;
        }

        displayFAQs();
    } catch (error) {
        console.error('Error loading FAQs:', error);
    }
}

function displayFAQs() {
    const container = document.getElementById('faqList');
    if (!container) return;

    container.innerHTML = faqs.length === 0
        ? '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No FAQs added yet. Click "Add FAQ" to get started.</p>'
        : '';

    faqs.forEach((faq, index) => {
        const faqDiv = document.createElement('div');
        faqDiv.className = 'dynamic-item';
        faqDiv.innerHTML = `
            <div class="dynamic-item-header">
                <h4>FAQ ${index + 1}</h4>
                <div class="dynamic-item-actions">
                    <button type="button" class="btn-icon" onclick="editFAQ(${faq.id})" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button type="button" class="btn-icon danger" onclick="deleteFAQ(${faq.id})" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label>Question</label>
                <input type="text" value="${faq.question}" disabled>
            </div>
            <div class="form-group">
                <label>Answer</label>
                <textarea rows="3" disabled>${faq.answer}</textarea>
            </div>
        `;
        container.appendChild(faqDiv);
    });
}

function addFAQ() {
    const question = prompt('Enter FAQ question:');
    if (!question) return;

    const answer = prompt('Enter FAQ answer:');
    if (!answer) return;

    saveFAQ({
        question,
        answer,
        order_index: faqs.length + 1
    });
}

function editFAQ(id) {
    const faq = faqs.find(f => f.id === id);
    if (!faq) return;

    const question = prompt('Edit question:', faq.question);
    if (question === null) return;

    const answer = prompt('Edit answer:', faq.answer);
    if (answer === null) return;

    updateFAQ(id, {
        question,
        answer,
        order_index: faq.order_index
    });
}

async function saveFAQ(data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=faqs`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadFAQs();
        } else {
            alert('Error saving FAQ');
        }
    } catch (error) {
        console.error('Error saving FAQ:', error);
        alert('Error saving FAQ');
    }
}

async function updateFAQ(id, data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=faqs&id=${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadFAQs();
        } else {
            alert('Error updating FAQ');
        }
    } catch (error) {
        console.error('Error updating FAQ:', error);
        alert('Error updating FAQ');
    }
}

async function deleteFAQ(id) {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=faqs&id=${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            await loadFAQs();
        } else {
            alert('Error deleting FAQ');
        }
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        alert('Error deleting FAQ');
    }
}
