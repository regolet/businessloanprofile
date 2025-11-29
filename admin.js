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
let currencySymbol = '$'; // Default currency symbol

// ============================================
// CURRENCY FORMATTING
// ============================================

// Format a number with commas and currency symbol
function formatCurrency(amount) {
    if (!amount) return '-';

    // Remove any existing currency symbols and non-numeric characters except decimal and comma
    let numStr = amount.toString().replace(/[^0-9.,]/g, '');

    // Replace commas with nothing for parsing
    numStr = numStr.replace(/,/g, '');

    // Parse the number
    const num = parseFloat(numStr);
    if (isNaN(num)) return amount; // Return original if not a valid number

    // Format with commas
    const formatted = num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    return currencySymbol + formatted;
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = notification.querySelector('.notification-icon');
    const messageEl = notification.querySelector('.notification-message');

    // Set icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };

    icon.textContent = icons[type] || icons.info;
    messageEl.textContent = message;

    // Remove all type classes
    notification.classList.remove('success', 'error', 'info');

    // Add current type class
    notification.classList.add(type);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Hide after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

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
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
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
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const token = checkAuth();
    if (!token) return;

    // Check super admin access and show/hide menu
    checkSuperAdminAccess();

    // Display logged in user info
    displayLoggedInUser();

    // Load settings first to get currency symbol before displaying leads
    await loadSettings();

    loadLeads();
    loadQuestions();
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

    // Hide all sections
    document.getElementById('leadsSection').style.display = 'none';
    document.getElementById('thinkingSection').style.display = 'none';
    document.getElementById('questionsSection').style.display = 'none';
    document.getElementById('settingsSection').style.display = 'none';
    const accountsSection = document.getElementById('accountsSection');
    if (accountsSection) accountsSection.style.display = 'none';

    // Show selected section and update title
    if (section === 'leads') {
        document.getElementById('leadsSection').style.display = 'block';
        document.getElementById('sectionTitle').textContent = 'Leads Management';
        document.getElementById('addNewBtn').style.display = 'none';
    } else if (section === 'thinking') {
        document.getElementById('thinkingSection').style.display = 'block';
        document.getElementById('sectionTitle').textContent = 'Schedule Your Funding';
        document.getElementById('addNewBtn').style.display = 'none';
        loadThinkingLeads();
    } else if (section === 'questions') {
        document.getElementById('questionsSection').style.display = 'block';
        document.getElementById('sectionTitle').textContent = 'Questions Management';
        document.getElementById('addNewBtn').style.display = 'block';
    } else if (section === 'settings') {
        document.getElementById('settingsSection').style.display = 'block';
        document.getElementById('sectionTitle').textContent = 'Page Settings';
        document.getElementById('addNewBtn').style.display = 'none';
    } else if (section === 'accounts') {
        if (accountsSection) accountsSection.style.display = 'block';
        document.getElementById('sectionTitle').textContent = 'Account Management';
        document.getElementById('addNewBtn').style.display = 'none';
        loadAccounts();
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
            window.location.href = 'login.html';
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
            <td>${formatCurrency(lead.loan_amount)}</td>
            <td>${lead.document_count > 0 ? `<span class="doc-badge" title="${lead.document_count} document(s)"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> ${lead.document_count}</span>` : '-'}</td>
            <td>${formatDate(lead.created_at)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn-icon" onclick="viewLead(${lead.id})" title="View Details">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="editLead(${lead.id})" title="Edit Lead">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteLead(${lead.id}, '${escapeHtml(lead.name || 'this lead').replace(/'/g, "\\'")}')\" title="Delete Lead">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
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
        showNotification('Error exporting to CSV. Please try again.', 'error');
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
        showNotification('Error exporting to JSON. Please try again.', 'error');
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
                    <div class="info-value">${formatCurrency(lead.loan_amount)}</div>
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

            <div class="documents-section">
                <h3>Uploaded Documents (Bank Statements)</h3>
                ${lead.documents && lead.documents.length > 0 ?
                `<div class="documents-list">
                    ${lead.documents.map(doc => `
                        <div class="document-item">
                            <div class="doc-info">
                                <svg class="doc-icon" width="20" height="20" viewBox="0 0 24 24" fill="#dc2626">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8" fill="none" stroke="white" stroke-width="2"/>
                                </svg>
                                <span class="doc-name">${escapeHtml(doc.original_filename)}</span>
                                <span class="doc-size">(${formatFileSize(doc.file_size)})</span>
                            </div>
                            <div class="doc-actions">
                                <button class="btn-preview" onclick="previewDocument(${doc.id}, '${escapeHtml(doc.original_filename).replace(/'/g, "\\'")}')\" title="Preview">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                                <a href="${API_URL}/upload-documents.php?download=${doc.id}" class="btn-download" title="Download">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>` :
                '<p>No documents uploaded</p>'
            }
            </div>
        `;

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading lead details:', error);
        showNotification('Error loading lead details', 'error');
    }
}

// Close lead modal
function closeLeadModal() {
    document.getElementById('leadModal').style.display = 'none';
}

// Edit lead - open edit modal
async function editLead(leadId) {
    try {
        const response = await fetch(`${API_URL}/admin-leads.php?id=${leadId}`, {
            headers: getAuthHeaders()
        });
        const lead = await response.json();

        const modal = document.getElementById('editLeadModal');
        document.getElementById('editLeadId').value = lead.id;
        document.getElementById('editLeadName').value = lead.name || '';
        document.getElementById('editLeadEmail').value = lead.email || '';
        document.getElementById('editLeadPhone').value = lead.phone || '';
        document.getElementById('editLeadBusiness').value = lead.business_name || '';
        document.getElementById('editLeadAmount').value = lead.loan_amount || '';

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading lead for edit:', error);
        showNotification('Error loading lead details', 'error');
    }
}

// Save lead edits
async function saveLeadEdit() {
    const leadId = document.getElementById('editLeadId').value;
    const leadData = {
        id: parseInt(leadId),
        name: document.getElementById('editLeadName').value,
        email: document.getElementById('editLeadEmail').value,
        phone: document.getElementById('editLeadPhone').value,
        business_name: document.getElementById('editLeadBusiness').value,
        loan_amount: document.getElementById('editLeadAmount').value
    };

    try {
        const response = await fetch(`${API_URL}/admin-leads-manage.php`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Lead updated successfully', 'success');
            closeEditLeadModal();
            loadLeads(); // Refresh the leads list
        } else {
            showNotification(result.error || 'Failed to update lead', 'error');
        }
    } catch (error) {
        console.error('Error updating lead:', error);
        showNotification('Error updating lead', 'error');
    }
}

// Close edit lead modal
function closeEditLeadModal() {
    document.getElementById('editLeadModal').style.display = 'none';
}

// Delete lead
async function deleteLead(leadId, leadName) {
    if (!confirm(`Are you sure you want to delete "${leadName}"?\n\nThis will also delete all associated answers and documents. This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin-leads-manage.php?id=${leadId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Lead deleted successfully', 'success');
            loadLeads(); // Refresh the leads list
        } else {
            showNotification(result.error || 'Failed to delete lead', 'error');
        }
    } catch (error) {
        console.error('Error deleting lead:', error);
        showNotification('Error deleting lead', 'error');
    }
}

// Preview document in modal
function previewDocument(docId, filename) {
    const previewUrl = `${API_URL}/upload-documents.php?preview=${docId}`;
    const modal = document.getElementById('documentPreviewModal');
    const iframe = document.getElementById('documentPreviewFrame');
    const title = document.getElementById('documentPreviewTitle');

    title.textContent = filename;
    iframe.src = previewUrl;
    modal.style.display = 'block';
}

// Close document preview modal
function closeDocumentPreview() {
    const modal = document.getElementById('documentPreviewModal');
    const iframe = document.getElementById('documentPreviewFrame');
    iframe.src = '';
    modal.style.display = 'none';
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
            showNotification('Question deleted successfully', 'success');
            loadQuestions();
        } else {
            showNotification('Error deleting question', 'error');
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        showNotification('Error deleting question', 'error');
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
                showNotification('Question saved successfully', 'success');
                closeQuestionModal();
                loadQuestions();
            } else {
                showNotification('Error saving question', 'error');
            }
        } catch (error) {
            console.error('Error saving question:', error);
            showNotification('Error saving question', 'error');
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

// Format file size
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Close modals when clicking outside
window.onclick = function (event) {
    const leadModal = document.getElementById('leadModal');
    const questionModal = document.getElementById('questionModal');
    const heroFeatureModal = document.getElementById('heroFeatureModal');
    const loanTypeModal = document.getElementById('loanTypeModal');
    const howItWorksModal = document.getElementById('howItWorksModal');
    const faqModal = document.getElementById('faqModal');

    if (event.target === leadModal) {
        closeLeadModal();
    }
    if (event.target === questionModal) {
        closeQuestionModal();
    }
    if (event.target === heroFeatureModal) {
        closeHeroFeatureModal();
    }
    if (event.target === loanTypeModal) {
        closeLoanTypeModal();
    }
    if (event.target === howItWorksModal) {
        closeHowItWorksModal();
    }
    if (event.target === faqModal) {
        closeFAQModal();
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
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        siteSettings = await response.json();

        // Set currency symbol for formatting
        if (siteSettings.company?.currency?.value) {
            currencySymbol = siteSettings.company.currency.value;
        }

        displaySettings();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Display settings in form
function displaySettings() {
    console.log('Displaying settings:', siteSettings);

    // System settings
    if (siteSettings.system) {
        const maintenanceMode = document.getElementById('maintenance_mode');
        const maintenanceValue = siteSettings.system.maintenance_mode?.value;
        console.log('Maintenance mode value from DB:', maintenanceValue);
        if (maintenanceMode) {
            maintenanceMode.checked = maintenanceValue === '1';
            console.log('Checkbox set to:', maintenanceMode.checked);
        }
    }

    // Company settings
    if (siteSettings.company) {
        const companyName = document.getElementById('company_name');
        const companyLogoUrl = document.getElementById('company_logo_url');
        const companyEmail = document.getElementById('company_email');
        const companyPhone = document.getElementById('company_phone');
        const companyAddress = document.getElementById('company_address');

        if (companyName) companyName.value = siteSettings.company.name?.value || '';
        if (companyLogoUrl) {
            companyLogoUrl.value = siteSettings.company.logo_url?.value || '';
            // Show preview if logo URL exists
            if (siteSettings.company.logo_url?.value) {
                updateLogoPreview(siteSettings.company.logo_url.value);
            }
        }
        if (companyEmail) companyEmail.value = siteSettings.company.email?.value || '';
        if (companyPhone) companyPhone.value = siteSettings.company.phone?.value || '';
        if (companyAddress) companyAddress.value = siteSettings.company.address?.value || '';

        const companyCurrency = document.getElementById('company_currency');
        if (companyCurrency) companyCurrency.value = siteSettings.company.currency?.value || '$';

        // Update edit lead modal placeholder with currency
        const editLeadAmount = document.getElementById('editLeadAmount');
        if (editLeadAmount) {
            editLeadAmount.placeholder = `e.g., ${currencySymbol}50,000`;
        }
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

    // About Us
    if (siteSettings.about_us) {
        const aboutTitle = document.getElementById('about_us_title');
        const aboutSubtitle = document.getElementById('about_us_subtitle');
        const aboutDescription = document.getElementById('about_us_description');
        const aboutImage = document.getElementById('about_us_image_url');
        const aboutFeature1Title = document.getElementById('about_us_feature1_title');
        const aboutFeature1Text = document.getElementById('about_us_feature1_text');
        const aboutFeature2Title = document.getElementById('about_us_feature2_title');
        const aboutFeature2Text = document.getElementById('about_us_feature2_text');
        const aboutFeature3Title = document.getElementById('about_us_feature3_title');
        const aboutFeature3Text = document.getElementById('about_us_feature3_text');

        if (aboutTitle) aboutTitle.value = siteSettings.about_us.title?.value || '';
        if (aboutSubtitle) aboutSubtitle.value = siteSettings.about_us.subtitle?.value || '';
        if (aboutDescription) aboutDescription.value = siteSettings.about_us.description?.value || '';
        if (aboutImage) aboutImage.value = siteSettings.about_us.image_url?.value || '';
        if (aboutFeature1Title) aboutFeature1Title.value = siteSettings.about_us.feature1_title?.value || '';
        if (aboutFeature1Text) aboutFeature1Text.value = siteSettings.about_us.feature1_text?.value || '';
        if (aboutFeature2Title) aboutFeature2Title.value = siteSettings.about_us.feature2_title?.value || '';
        if (aboutFeature2Text) aboutFeature2Text.value = siteSettings.about_us.feature2_text?.value || '';
        if (aboutFeature3Title) aboutFeature3Title.value = siteSettings.about_us.feature3_title?.value || '';
        if (aboutFeature3Text) aboutFeature3Text.value = siteSettings.about_us.feature3_text?.value || '';
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

    // Footer
    console.log('Loading footer settings:', siteSettings.footer);
    if (siteSettings.footer) {
        const footerCopyright = document.getElementById('footer_copyright_text');
        const footerTagline = document.getElementById('footer_tagline');

        console.log('Footer elements:', { footerCopyright, footerTagline });
        console.log('Footer data:', {
            copyright: siteSettings.footer.copyright_text,
            tagline: siteSettings.footer.tagline
        });

        if (footerCopyright) footerCopyright.value = siteSettings.footer.copyright_text?.value || '';
        if (footerTagline) footerTagline.value = siteSettings.footer.tagline?.value || '';
    } else {
        console.warn('No footer settings found in siteSettings');
    }
}

// Setup settings form submission
function setupSettingsForm() {
    const form = document.getElementById('settingsForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const settings = {
            system: {},
            company: {},
            hero: {},
            hero_features: {},
            about_us: {},
            loan_types: {},
            how_it_works: {},
            faq: {},
            footer: {}
        };

        // Handle maintenance mode checkbox separately
        const maintenanceCheckbox = document.getElementById('maintenance_mode');
        settings.system.maintenance_mode = maintenanceCheckbox.checked ? '1' : '0';

        console.log('Maintenance checkbox state:', maintenanceCheckbox.checked);
        console.log('Saving maintenance mode as:', settings.system.maintenance_mode);

        // Organize form data by category
        for (let [name, value] of formData.entries()) {
            if (name === 'maintenance_mode') continue; // Skip checkbox, handled above

            const parts = name.split('_');
            const category = parts[0];

            if (category === 'hero' && parts[1] === 'features') {
                settings.hero_features[parts.slice(2).join('_')] = value;
            } else if (category === 'about' && parts[1] === 'us') {
                settings.about_us[parts.slice(2).join('_')] = value;
            } else if (category === 'loan' && parts[1] === 'types') {
                settings.loan_types[parts.slice(2).join('_')] = value;
            } else if (category === 'how') {
                settings.how_it_works[parts.slice(3).join('_')] = value;
            } else {
                settings[category][parts.slice(1).join('_')] = value;
            }
        }

        try {
            console.log('Sending settings to API:', settings);

            const response = await fetch(`${API_URL}/admin-settings.php`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ settings })
            });

            const data = await response.json();
            console.log('API response:', data);

            if (response.ok) {
                showNotification('Settings saved successfully!', 'success');
                await loadSettings();
                console.log('Settings reloaded:', siteSettings);
            } else {
                showNotification('Error saving settings: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Error saving settings. Please try again.', 'error');
        }
    });

    // Add logo URL preview listener
    const logoUrlInput = document.getElementById('company_logo_url');
    if (logoUrlInput) {
        logoUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            if (url) {
                updateLogoPreview(url);
            } else {
                hideLogoPreview();
            }
        });
    }
}

// Update logo preview
function updateLogoPreview(url) {
    const preview = document.getElementById('logoPreview');
    const previewImg = document.getElementById('logoPreviewImg');

    if (preview && previewImg && url) {
        previewImg.src = url;
        previewImg.onerror = function() {
            hideLogoPreview();
        };
        previewImg.onload = function() {
            preview.style.display = 'block';
        };
    }
}

// Hide logo preview
function hideLogoPreview() {
    const preview = document.getElementById('logoPreview');
    if (preview) {
        preview.style.display = 'none';
    }
}

// Handle logo upload
async function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size must be less than 2MB', 'error');
        return;
    }

    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.textContent = 'Uploading...';
    uploadStatus.style.color = 'var(--primary-color)';

    try {
        const formData = new FormData();
        formData.append('logo', file);

        const response = await fetch(`${API_URL}/upload-logo.php`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('admin_token')
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            const logoUrl = result.url;
            document.getElementById('company_logo_url').value = logoUrl;
            updateLogoPreview(logoUrl);
            uploadStatus.textContent = '✓ Uploaded successfully';
            uploadStatus.style.color = '#10b981';
            showNotification('Logo uploaded successfully!', 'success');
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Error uploading logo:', error);
        uploadStatus.textContent = '✗ Upload failed';
        uploadStatus.style.color = '#ef4444';
        showNotification('Error uploading logo: ' + error.message, 'error');
    }
}

// Remove logo
async function removeLogo() {
    if (!confirm('Are you sure you want to remove the logo?')) return;

    document.getElementById('company_logo_url').value = '';
    hideLogoPreview();
    document.getElementById('uploadStatus').textContent = '';
    showNotification('Logo removed. Click Save Settings to apply changes.', 'info');
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
        'aboutus': 'aboutusTab',
        'loantypes': 'loantypesTab',
        'howitworks': 'howitworksTab',
        'faq': 'faqTab',
        'footer': 'footerTab',
        'thinking': 'thinkingTab'
    };

    document.getElementById(tabContentMap[tabName])?.classList.add('active');

    // Load data when switching to thinking tab
    if (tabName === 'thinking') {
        loadThinkingSubmissions();
    }
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
            window.location.href = 'login.html';
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

    heroFeatures.forEach((feature) => {
        const featureDiv = document.createElement('div');
        featureDiv.className = 'dynamic-item';

        const iconDisplay = feature.icon_name
            ? `<div class="form-group">
                <label>Icon</label>
                <input type="text" value="${escapeHtml(feature.icon_name)}" disabled>
               </div>`
            : '';

        featureDiv.innerHTML = `
            <div class="dynamic-item-header">
                <h4>${escapeHtml(feature.feature_text)}</h4>
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
                <input type="text" value="${escapeHtml(feature.feature_text)}" id="feature_${feature.id}" disabled>
            </div>
            ${iconDisplay}
        `;
        container.appendChild(featureDiv);
    });
}

function addHeroFeature() {
    document.getElementById('heroFeatureModalTitle').textContent = 'Add Hero Feature';
    document.getElementById('heroFeatureId').value = '';
    document.getElementById('heroFeatureText').value = '';
    document.getElementById('heroFeatureOrder').value = heroFeatures.length + 1;
    document.getElementById('heroFeatureModal').style.display = 'block';
}

function editHeroFeature(id) {
    console.log('Edit hero feature called with ID:', id, 'Type:', typeof id);
    console.log('Available features:', heroFeatures);
    console.log('Available IDs:', heroFeatures.map(f => ({ id: f.id, type: typeof f.id, text: f.feature_text })));

    // Convert id to number to ensure proper comparison
    const numId = typeof id === 'string' ? parseInt(id) : id;
    console.log('Searching for ID:', numId);

    // Use loose comparison (==) to handle string/number mismatches
    const feature = heroFeatures.find(f => f.id == numId);
    if (!feature) {
        console.error('Feature not found with ID:', numId);
        console.error('Available feature IDs:', heroFeatures.map(f => f.id));
        showNotification('Error: Feature not found. Please refresh the page and try again.', 'error');
        return;
    }

    console.log('Found feature:', feature);

    document.getElementById('heroFeatureModalTitle').textContent = 'Edit Hero Feature';
    document.getElementById('heroFeatureId').value = feature.id;
    document.getElementById('heroFeatureText').value = feature.feature_text;
    document.getElementById('heroFeatureIcon').value = feature.icon_name || '';
    document.getElementById('heroFeatureOrder').value = feature.order_index;
    document.getElementById('heroFeatureModal').style.display = 'block';

    console.log('Modal opened for editing');
}

function closeHeroFeatureModal() {
    document.getElementById('heroFeatureModal').style.display = 'none';
    document.getElementById('heroFeatureForm').reset();
}

async function saveHeroFeature(event) {
    event.preventDefault();

    const id = document.getElementById('heroFeatureId').value;
    const iconValue = document.getElementById('heroFeatureIcon').value;

    const data = {
        feature_text: document.getElementById('heroFeatureText').value,
        icon_name: iconValue || null,
        order_index: parseInt(document.getElementById('heroFeatureOrder').value)
    };

    try {
        let response;
        if (id) {
            // Update existing
            response = await fetch(`${API_URL}/admin-dynamic-content.php?type=hero_features&id=${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        } else {
            // Create new
            response = await fetch(`${API_URL}/admin-dynamic-content.php?type=hero_features`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (response.ok) {
            closeHeroFeatureModal();
            await loadHeroFeatures();
            showNotification(id ? 'Feature updated successfully!' : 'Feature added successfully!', 'success');
        } else {
            showNotification('Error saving feature: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving feature:', error);
        showNotification('Error saving feature: ' + error.message, 'error');
    }
}

async function updateHeroFeature(id, data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=hero_features&id=${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            await loadHeroFeatures();
            showNotification('Feature updated successfully!', 'success');
        } else {
            showNotification('Error updating feature: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error updating feature:', error);
        showNotification('Error updating feature: ' + error.message, 'error');
    }
}

async function deleteHeroFeature(id) {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=hero_features&id=${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (response.ok) {
            await loadHeroFeatures();
            showNotification('Feature deleted successfully!', 'success');
        } else {
            showNotification('Error deleting feature: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting feature:', error);
        showNotification('Error deleting feature: ' + error.message, 'error');
    }
}

// ============= LOAN TYPES =============
async function loadLoanTypes() {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=loan_types`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            window.location.href = 'login.html';
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

        let featuresHTML = '';
        if (type.features) {
            try {
                const features = JSON.parse(type.features);
                if (Array.isArray(features) && features.length > 0) {
                    featuresHTML = `
                        <div class="form-group">
                            <label>Features (Checklist)</label>
                            <ul style="list-style: none; padding-left: 0; margin: 0.5rem 0;">
                                ${features.map(f => `<li style="padding: 0.25rem 0; color: var(--text-muted);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 0.5rem;"><polyline points="20 6 9 17 4 12"/></svg>${escapeHtml(f)}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            } catch (e) {
                console.error('Error parsing features:', e);
            }
        }

        const featuredBadge = type.is_featured == 1 ? '<span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">FEATURED</span>' : '';

        typeDiv.innerHTML = `
            <div class="dynamic-item-header">
                <h4>${escapeHtml(type.title)}${featuredBadge}</h4>
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
                <input type="text" value="${escapeHtml(type.title)}" disabled>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea rows="2" disabled>${escapeHtml(type.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label>Icon Name</label>
                <input type="text" value="${escapeHtml(type.icon_name || '')}" disabled>
            </div>
            ${featuresHTML}
        `;
        container.appendChild(typeDiv);
    });
}

function addLoanType() {
    document.getElementById('loanTypeModalTitle').textContent = 'Add Loan Type';
    document.getElementById('loanTypeId').value = '';
    document.getElementById('loanTypeTitle').value = '';
    document.getElementById('loanTypeDescription').value = '';
    document.getElementById('loanTypeIcon').value = 'file-text';
    document.getElementById('loanTypeFeatures').value = '';
    document.getElementById('loanTypeIsFeatured').checked = false;
    document.getElementById('loanTypeOrder').value = loanTypes.length + 1;
    document.getElementById('loanTypeModal').style.display = 'block';
}

function editLoanType(id) {
    console.log('Edit loan type called with ID:', id, 'Type:', typeof id);
    console.log('Available loan types:', loanTypes);
    console.log('Available IDs:', loanTypes.map(t => ({ id: t.id, type: typeof t.id, title: t.title })));

    // Convert id to number to ensure proper comparison
    const numId = typeof id === 'string' ? parseInt(id) : id;
    console.log('Searching for ID:', numId);

    // Use loose comparison (==) to handle string/number mismatches
    const type = loanTypes.find(t => t.id == numId);
    if (!type) {
        console.error('Loan type not found with ID:', numId);
        console.error('Available loan type IDs:', loanTypes.map(t => t.id));
        showNotification('Error: Loan type not found. Please refresh the page and try again.', 'error');
        return;
    }

    console.log('Found loan type:', type);

    // Parse existing features
    let existingFeatures = [];
    if (type.features) {
        try {
            existingFeatures = JSON.parse(type.features);
            console.log('Parsed features:', existingFeatures);
        } catch (e) {
            console.error('Error parsing existing features:', e);
        }
    }

    document.getElementById('loanTypeModalTitle').textContent = 'Edit Loan Type';
    document.getElementById('loanTypeId').value = type.id;
    document.getElementById('loanTypeTitle').value = type.title;
    document.getElementById('loanTypeDescription').value = type.description || '';
    document.getElementById('loanTypeIcon').value = type.icon_name || 'file-text';
    document.getElementById('loanTypeFeatures').value = existingFeatures.join('\n');
    document.getElementById('loanTypeIsFeatured').checked = type.is_featured == 1;
    document.getElementById('loanTypeOrder').value = type.order_index;
    document.getElementById('loanTypeModal').style.display = 'block';

    console.log('Modal opened for editing');
}

function closeLoanTypeModal() {
    document.getElementById('loanTypeModal').style.display = 'none';
    document.getElementById('loanTypeForm').reset();
}

async function saveLoanType(event) {
    event.preventDefault();

    const id = document.getElementById('loanTypeId').value;
    const featuresText = document.getElementById('loanTypeFeatures').value;

    // Parse features from textarea (one per line)
    let features = [];
    if (featuresText.trim()) {
        features = featuresText.split('\n').map(f => f.trim()).filter(f => f.length > 0);
    }

    const data = {
        title: document.getElementById('loanTypeTitle').value,
        description: document.getElementById('loanTypeDescription').value,
        icon_name: document.getElementById('loanTypeIcon').value,
        features: features.length > 0 ? JSON.stringify(features) : null,
        is_featured: document.getElementById('loanTypeIsFeatured').checked ? 1 : 0,
        order_index: parseInt(document.getElementById('loanTypeOrder').value)
    };

    try {
        let response;
        if (id) {
            // Update existing
            response = await fetch(`${API_URL}/admin-dynamic-content.php?type=loan_types&id=${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        } else {
            // Create new
            response = await fetch(`${API_URL}/admin-dynamic-content.php?type=loan_types`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (response.ok) {
            closeLoanTypeModal();
            await loadLoanTypes();
            showNotification(id ? 'Loan type updated successfully!' : 'Loan type added successfully!', 'success');
        } else {
            showNotification('Error saving loan type: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving loan type:', error);
        showNotification('Error saving loan type: ' + error.message, 'error');
    }
}

async function updateLoanType(id, data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=loan_types&id=${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            await loadLoanTypes();
            showNotification('Loan type updated successfully!', 'success');
        } else {
            showNotification('Error updating loan type: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error updating loan type:', error);
        showNotification('Error updating loan type: ' + error.message, 'error');
    }
}

async function deleteLoanType(id) {
    if (!confirm('Are you sure you want to delete this loan type?')) return;

    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=loan_types&id=${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (response.ok) {
            await loadLoanTypes();
            showNotification('Loan type deleted successfully!', 'success');
        } else {
            showNotification('Error deleting loan type: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting loan type:', error);
        showNotification('Error deleting loan type: ' + error.message, 'error');
    }
}

// ============= HOW IT WORKS STEPS =============
async function loadHowItWorksSteps() {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=how_it_works`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            window.location.href = 'login.html';
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
                <h4>Step ${step.step_number}: ${escapeHtml(step.title)}</h4>
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
                <input type="text" value="${escapeHtml(step.title)}" disabled>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea rows="2" disabled>${escapeHtml(step.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label>Image URL</label>
                <input type="url" value="${escapeHtml(step.image_url || '')}" disabled>
            </div>
        `;
        container.appendChild(stepDiv);
    });
}

function addHowItWorksStep() {
    document.getElementById('howItWorksModalTitle').textContent = 'Add Step';
    document.getElementById('howItWorksId').value = '';
    document.getElementById('howItWorksStepNumber').value = howItWorksSteps.length + 1;
    document.getElementById('howItWorksTitle').value = '';
    document.getElementById('howItWorksDescription').value = '';
    document.getElementById('howItWorksImageUrl').value = '';
    document.getElementById('howItWorksOrder').value = howItWorksSteps.length + 1;
    document.getElementById('howItWorksModal').style.display = 'block';
}

function editHowItWorksStep(id) {
    console.log('Edit how it works step called with ID:', id, 'Type:', typeof id);
    console.log('Available steps:', howItWorksSteps);
    console.log('Available IDs:', howItWorksSteps.map(s => ({ id: s.id, type: typeof s.id, title: s.title })));

    // Convert id to number to ensure proper comparison
    const numId = typeof id === 'string' ? parseInt(id) : id;
    console.log('Searching for ID:', numId);

    // Use loose comparison (==) to handle string/number mismatches
    const step = howItWorksSteps.find(s => s.id == numId);
    if (!step) {
        console.error('Step not found with ID:', numId);
        console.error('Available step IDs:', howItWorksSteps.map(s => s.id));
        showNotification('Error: Step not found. Please refresh the page and try again.', 'error');
        return;
    }

    console.log('Found step:', step);

    document.getElementById('howItWorksModalTitle').textContent = 'Edit Step';
    document.getElementById('howItWorksId').value = step.id;
    document.getElementById('howItWorksStepNumber').value = step.step_number;
    document.getElementById('howItWorksTitle').value = step.title;
    document.getElementById('howItWorksDescription').value = step.description || '';
    document.getElementById('howItWorksImageUrl').value = step.image_url || '';
    document.getElementById('howItWorksOrder').value = step.order_index;
    document.getElementById('howItWorksModal').style.display = 'block';

    console.log('Modal opened for editing');
}

function closeHowItWorksModal() {
    document.getElementById('howItWorksModal').style.display = 'none';
    document.getElementById('howItWorksForm').reset();
}

async function saveHowItWorksStep(event) {
    event.preventDefault();

    const id = document.getElementById('howItWorksId').value;
    const data = {
        step_number: parseInt(document.getElementById('howItWorksStepNumber').value),
        title: document.getElementById('howItWorksTitle').value,
        description: document.getElementById('howItWorksDescription').value,
        image_url: document.getElementById('howItWorksImageUrl').value || null,
        order_index: parseInt(document.getElementById('howItWorksOrder').value)
    };

    try {
        let response;
        if (id) {
            // Update existing
            response = await fetch(`${API_URL}/admin-dynamic-content.php?type=how_it_works&id=${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        } else {
            // Create new
            response = await fetch(`${API_URL}/admin-dynamic-content.php?type=how_it_works`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (response.ok) {
            closeHowItWorksModal();
            await loadHowItWorksSteps();
            showNotification(id ? 'Step updated successfully!' : 'Step added successfully!', 'success');
        } else {
            showNotification('Error saving step: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving step:', error);
        showNotification('Error saving step: ' + error.message, 'error');
    }
}

async function updateHowItWorksStep(id, data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=how_it_works&id=${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            await loadHowItWorksSteps();
            showNotification('Step updated successfully!', 'success');
        } else {
            showNotification('Error updating step: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating step:', error);
        showNotification('Error updating step: ' + error.message, 'error');
    }
}

async function deleteHowItWorksStep(id) {
    if (!confirm('Are you sure you want to delete this step?')) return;

    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=how_it_works&id=${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (response.ok) {
            await loadHowItWorksSteps();
            showNotification('Step deleted successfully!', 'success');
        } else {
            showNotification('Error deleting step: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting step:', error);
        showNotification('Error deleting step: ' + error.message, 'error');
    }
}

// ============= FAQs =============
async function loadFAQs() {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=faqs`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            window.location.href = 'login.html';
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
    document.getElementById('faqModalTitle').textContent = 'Add FAQ';
    document.getElementById('faqId').value = '';
    document.getElementById('faqQuestion').value = '';
    document.getElementById('faqAnswer').value = '';
    document.getElementById('faqOrder').value = faqs.length + 1;
    document.getElementById('faqModal').style.display = 'block';
}

function editFAQ(id) {
    console.log('Edit FAQ called with ID:', id, 'Type:', typeof id);
    console.log('Available FAQs:', faqs);
    console.log('Available IDs:', faqs.map(f => ({ id: f.id, type: typeof f.id, question: f.question })));

    // Convert id to number to ensure proper comparison
    const numId = typeof id === 'string' ? parseInt(id) : id;
    console.log('Searching for ID:', numId);

    // Use loose comparison (==) to handle string/number mismatches
    const faq = faqs.find(f => f.id == numId);
    if (!faq) {
        console.error('FAQ not found with ID:', numId);
        console.error('Available FAQ IDs:', faqs.map(f => f.id));
        showNotification('Error: FAQ not found. Please refresh the page and try again.', 'error');
        return;
    }

    console.log('Found FAQ:', faq);

    document.getElementById('faqModalTitle').textContent = 'Edit FAQ';
    document.getElementById('faqId').value = faq.id;
    document.getElementById('faqQuestion').value = faq.question;
    document.getElementById('faqAnswer').value = faq.answer;
    document.getElementById('faqOrder').value = faq.order_index;
    document.getElementById('faqModal').style.display = 'block';

    console.log('Modal opened for editing');
}

function closeFAQModal() {
    document.getElementById('faqModal').style.display = 'none';
    document.getElementById('faqForm').reset();
}

async function saveFAQ(event) {
    event.preventDefault();

    const id = document.getElementById('faqId').value;
    const data = {
        question: document.getElementById('faqQuestion').value,
        answer: document.getElementById('faqAnswer').value,
        order_index: parseInt(document.getElementById('faqOrder').value)
    };

    try {
        let response;
        if (id) {
            // Update existing
            response = await fetch(`${API_URL}/admin-dynamic-content.php?type=faqs&id=${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        } else {
            // Create new
            response = await fetch(`${API_URL}/admin-dynamic-content.php?type=faqs`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (response.ok) {
            closeFAQModal();
            await loadFAQs();
            showNotification(id ? 'FAQ updated successfully!' : 'FAQ added successfully!', 'success');
        } else {
            showNotification('Error saving FAQ: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving FAQ:', error);
        showNotification('Error saving FAQ: ' + error.message, 'error');
    }
}

async function updateFAQ(id, data) {
    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=faqs&id=${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            await loadFAQs();
            showNotification('FAQ updated successfully!', 'success');
        } else {
            showNotification('Error updating FAQ: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating FAQ:', error);
        showNotification('Error updating FAQ: ' + error.message, 'error');
    }
}

async function deleteFAQ(id) {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
        const response = await fetch(`${API_URL}/admin-dynamic-content.php?type=faqs&id=${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (response.ok) {
            await loadFAQs();
            showNotification('FAQ deleted successfully!', 'success');
        } else {
            showNotification('Error deleting FAQ: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        showNotification('Error deleting FAQ: ' + error.message, 'error');
    }
}

// ==========================================
// THINKING ABOUT IT FUNCTIONS
// ==========================================

let thinkingSubmissions = [];

async function loadThinkingSubmissions() {
    try {
        const response = await fetch(`${API_BASE}/thinking-about-it.php`);
        if (!response.ok) throw new Error('Failed to load submissions');

        thinkingSubmissions = await response.json();
        console.log('Loaded thinking submissions:', thinkingSubmissions);
        renderThinkingSubmissions();
    } catch (error) {
        console.error('Error loading thinking submissions:', error);
    }
}

function renderThinkingSubmissions() {
    const container = document.getElementById('thinkingSubmissionsList');
    if (!container) return;

    if (thinkingSubmissions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No submissions yet.</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: var(--bg-body); border-bottom: 2px solid var(--border-light);">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-main);">Name</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-main);">Email</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-main);">Cell</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-main);">Ready Date</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-main);">Status</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-main);">Submitted</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text-main);">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${thinkingSubmissions.map(submission => `
                    <tr style="border-bottom: 1px solid var(--border-light);">
                        <td style="padding: 12px;">${escapeHtml(submission.name)}</td>
                        <td style="padding: 12px;">${escapeHtml(submission.email)}</td>
                        <td style="padding: 12px;">${escapeHtml(submission.cell)}</td>
                        <td style="padding: 12px;">${formatDate(submission.ready_date)}</td>
                        <td style="padding: 12px;">
                            <span style="padding: 4px 12px; border-radius: 12px; font-size: 0.875rem; font-weight: 500;
                                background: ${getStatusColor(submission.status)}20;
                                color: ${getStatusColor(submission.status)};">
                                ${submission.status}
                            </span>
                        </td>
                        <td style="padding: 12px; color: var(--text-muted); font-size: 0.875rem;">
                            ${formatDateTime(submission.created_at)}
                        </td>
                        <td style="padding: 12px; text-align: center;">
                            <button onclick="viewThinkingSubmission(${submission.id})"
                                    style="background: var(--primary-color); color: white; border: none; padding: 6px 12px;
                                           border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 0.875rem;">
                                View
                            </button>
                            <button onclick="deleteThinkingSubmission(${submission.id})"
                                    style="background: #ef4444; color: white; border: none; padding: 6px 12px;
                                           border-radius: 4px; cursor: pointer; font-size: 0.875rem;">
                                Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getStatusColor(status) {
    const colors = {
        'pending': '#f59e0b',
        'contacted': '#3b82f6',
        'scheduled': '#8b5cf6',
        'completed': '#10b981',
        'cancelled': '#6b7280'
    };
    return colors[status] || '#6b7280';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function viewThinkingSubmission(id) {
    const submission = thinkingSubmissions.find(s => s.id == id);
    if (!submission) {
        showNotification('Submission not found', 'error');
        return;
    }

    document.getElementById('thinkingId').value = submission.id;
    document.getElementById('thinkingName').value = submission.name;
    document.getElementById('thinkingCell').value = submission.cell;
    document.getElementById('thinkingEmail').value = submission.email;
    document.getElementById('thinkingReadyDate').value = submission.ready_date;
    document.getElementById('thinkingStatus').value = submission.status;
    document.getElementById('thinkingNotes').value = submission.notes || '';

    document.getElementById('thinkingModal').style.display = 'block';
}

function closeThinkingModal() {
    document.getElementById('thinkingModal').style.display = 'none';
}

async function saveThinkingSubmission(event) {
    event.preventDefault();

    const id = document.getElementById('thinkingId').value;
    const status = document.getElementById('thinkingStatus').value;
    const notes = document.getElementById('thinkingNotes').value;

    try {
        const response = await fetch(`${API_BASE}/thinking-about-it.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, notes })
        });

        const result = await response.json();

        if (response.ok) {
            await loadThinkingSubmissions();
            closeThinkingModal();
            showNotification('Updated successfully!', 'success');
        } else {
            showNotification('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating submission:', error);
        showNotification('Error updating submission: ' + error.message, 'error');
    }
}

async function deleteThinkingSubmission(id) {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
        const response = await fetch(`${API_BASE}/thinking-about-it.php?id=${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            await loadThinkingSubmissions();
            showNotification('Deleted successfully!', 'success');
        } else {
            showNotification('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting submission:', error);
        showNotification('Error deleting submission: ' + error.message, 'error');
    }
}

// ==========================================
// THINKING ABOUT IT - LEADS SECTION
// ==========================================

let allThinkingLeads = [];
let filteredThinkingLeads = [];

async function loadThinkingLeads() {
    try {
        const response = await fetch(`${API_URL}/thinking-about-it.php`);
        if (!response.ok) throw new Error('Failed to load submissions');

        allThinkingLeads = await response.json();
        filteredThinkingLeads = [...allThinkingLeads];
        console.log('Loaded thinking leads:', allThinkingLeads);
        renderThinkingLeads();
    } catch (error) {
        console.error('Error loading thinking leads:', error);
        document.getElementById('thinkingLeadsList').innerHTML =
            '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Error loading submissions. Please try again.</p>';
    }
}

function filterThinkingSubmissions() {
    const statusFilter = document.getElementById('thinkingStatusFilter').value;
    const searchTerm = document.getElementById('thinkingSearchInput').value.toLowerCase();

    filteredThinkingLeads = allThinkingLeads.filter(lead => {
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        const matchesSearch = !searchTerm ||
            lead.name.toLowerCase().includes(searchTerm) ||
            lead.email.toLowerCase().includes(searchTerm) ||
            lead.cell.toLowerCase().includes(searchTerm);

        return matchesStatus && matchesSearch;
    });

    renderThinkingLeads();
}

function renderThinkingLeads() {
    const container = document.getElementById('thinkingLeadsList');
    if (!container) return;

    if (filteredThinkingLeads.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No submissions found.</p>';
        return;
    }

    container.innerHTML = `
        <div class="table-container" style="background: white; border-radius: 12px; overflow-x: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <table class="data-table" style="width: 100%; border-collapse: collapse; min-width: 900px;">
                <thead>
                    <tr style="background: var(--bg-body); border-bottom: 2px solid var(--border-light);">
                        <th style="padding: 16px; text-align: left; font-weight: 600; color: var(--text-main); white-space: nowrap;">Name</th>
                        <th style="padding: 16px; text-align: left; font-weight: 600; color: var(--text-main); white-space: nowrap;">Email</th>
                        <th style="padding: 16px; text-align: left; font-weight: 600; color: var(--text-main); white-space: nowrap;">Phone</th>
                        <th style="padding: 16px; text-align: left; font-weight: 600; color: var(--text-main); white-space: nowrap;">Ready Date</th>
                        <th style="padding: 16px; text-align: left; font-weight: 600; color: var(--text-main); white-space: nowrap;">Status</th>
                        <th style="padding: 16px; text-align: left; font-weight: 600; color: var(--text-main); white-space: nowrap;">Submitted</th>
                        <th style="padding: 16px; text-align: center; font-weight: 600; color: var(--text-main); white-space: nowrap;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredThinkingLeads.map(lead => `
                        <tr style="border-bottom: 1px solid var(--border-light); transition: background 0.2s;"
                            onmouseover="this.style.background='var(--bg-body)'"
                            onmouseout="this.style.background='white'">
                            <td style="padding: 16px; font-weight: 500; white-space: nowrap;">${escapeHtml(lead.name)}</td>
                            <td style="padding: 16px; color: var(--text-muted); white-space: nowrap;">${escapeHtml(lead.email)}</td>
                            <td style="padding: 16px; color: var(--text-muted); white-space: nowrap;">${escapeHtml(lead.cell)}</td>
                            <td style="padding: 16px; white-space: nowrap;">
                                <span style="font-weight: 500; color: var(--text-main);">${formatDate(lead.ready_date)}</span>
                            </td>
                            <td style="padding: 16px; white-space: nowrap;">
                                <span style="padding: 6px 14px; border-radius: 20px; font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
                                    background: ${getStatusColor(lead.status)}20;
                                    color: ${getStatusColor(lead.status)};">
                                    ${lead.status}
                                </span>
                            </td>
                            <td style="padding: 16px; color: var(--text-muted); font-size: 0.875rem; white-space: nowrap;">
                                ${formatDateTime(lead.created_at)}
                            </td>
                            <td style="padding: 16px; text-align: center; white-space: nowrap;">
                                <button onclick="viewThinkingLead(${lead.id})" title="View"
                                        style="background: var(--primary-color); color: white; border: none; padding: 8px;
                                               border-radius: 6px; cursor: pointer; margin-right: 6px; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;"
                                        onmouseover="this.style.opacity='0.9'"
                                        onmouseout="this.style.opacity='1'">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                                <button onclick="deleteThinkingLead(${lead.id})" title="Delete"
                                        style="background: #ef4444; color: white; border: none; padding: 8px;
                                               border-radius: 6px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;"
                                        onmouseover="this.style.opacity='0.9'"
                                        onmouseout="this.style.opacity='1'">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 16px; color: var(--text-muted); font-size: 0.875rem;">
            Showing ${filteredThinkingLeads.length} of ${allThinkingLeads.length} submissions
        </div>
    `;
}

function viewThinkingLead(id) {
    const lead = allThinkingLeads.find(l => l.id == id);
    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }

    document.getElementById('thinkingId').value = lead.id;
    document.getElementById('thinkingName').value = lead.name;
    document.getElementById('thinkingCell').value = lead.cell;
    document.getElementById('thinkingEmail').value = lead.email;
    document.getElementById('thinkingReadyDate').value = lead.ready_date;
    document.getElementById('thinkingStatus').value = lead.status;
    document.getElementById('thinkingNotes').value = lead.notes || '';

    document.getElementById('thinkingModal').style.display = 'block';
}

async function deleteThinkingLead(id) {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
        const response = await fetch(`${API_URL}/thinking-about-it.php?id=${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            await loadThinkingLeads();
            showNotification('Deleted successfully!', 'success');
        } else {
            showNotification('Error: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting lead:', error);
        showNotification('Error deleting lead: ' + error.message, 'error');
    }
}

// ===========================
// ACCOUNT MANAGEMENT FUNCTIONS
// ===========================

let allAccounts = [];

async function loadAccounts() {
    try {
        const response = await fetch(`${API_URL}/accounts.php`);
        const data = await response.json();

        if (response.ok) {
            allAccounts = data;
            renderAccounts();
            updateAccountStats();
        } else {
            console.error('Error loading accounts:', data.error);
            // If access denied, hide the accounts menu item
            if (response.status === 403) {
                const accountsMenuItem = document.getElementById('accountsMenuItem');
                if (accountsMenuItem) {
                    accountsMenuItem.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

function renderAccounts() {
    const tbody = document.getElementById('accountsTableBody');

    if (allAccounts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                    </svg>
                    <p>No accounts found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allAccounts.map(account => {
        const lastLogin = account.last_login ? new Date(account.last_login).toLocaleString() : 'Never';
        const statusColor = account.is_active ? '#10b981' : '#ef4444';
        const billingColor = account.billing_status === 'active' ? '#10b981' :
                           account.billing_status === 'overdue' ? '#f59e0b' : '#ef4444';

        return `
            <tr>
                <td><strong>${account.username}</strong></td>
                <td>${account.email}</td>
                <td>
                    <span class="badge" style="background: ${account.role === 'super_admin' ? '#8b5cf6' : account.role === 'admin' ? '#3b82f6' : '#6b7280'};">
                        ${account.role.replace('_', ' ')}
                    </span>
                </td>
                <td>
                    <span class="badge" style="background: ${account.account_status === 'max' ? '#10b981' : account.account_status === 'pro' ? '#3b82f6' : '#6b7280'};">
                        ${account.account_status}
                    </span>
                </td>
                <td>
                    <span class="badge" style="background: ${billingColor};">
                        ${account.billing_status}
                    </span>
                </td>
                <td style="font-size: 0.875rem; color: var(--text-muted);">${lastLogin}</td>
                <td>
                    <button class="btn-icon" onclick="editAccount(${account.id})" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="deleteAccount(${account.id})" title="Delete" style="color: #ef4444;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateAccountStats() {
    const totalAccounts = allAccounts.length;
    const activeAccounts = allAccounts.filter(a => a.is_active === 1 || a.is_active === true).length;
    const superAdmins = allAccounts.filter(a => a.role === 'super_admin').length;

    document.getElementById('totalAccounts').textContent = totalAccounts;
    document.getElementById('activeAccounts').textContent = activeAccounts;
    document.getElementById('superAdmins').textContent = superAdmins;
}

function openAccountModal(accountId = null) {
    const modal = document.getElementById('accountModal');
    const title = document.getElementById('accountModalTitle');
    const form = document.getElementById('accountForm');
    const passwordField = document.getElementById('accountPassword');

    form.reset();
    document.getElementById('accountId').value = '';

    if (accountId) {
        title.textContent = 'Edit Account';
        const account = allAccounts.find(a => a.id == accountId);
        if (account) {
            document.getElementById('accountId').value = account.id;
            document.getElementById('accountUsername').value = account.username;
            document.getElementById('accountEmail').value = account.email;
            document.getElementById('accountFirstName').value = account.first_name || '';
            document.getElementById('accountLastName').value = account.last_name || '';
            document.getElementById('accountRole').value = account.role;
            document.getElementById('accountStatus').value = account.account_status;
            document.getElementById('billingStatus').value = account.billing_status;
            document.getElementById('accountIsActive').checked = account.is_active === 1 || account.is_active === true;
            passwordField.required = false;
        }
    } else {
        title.textContent = 'Add New Account';
        document.getElementById('accountIsActive').checked = true;
        passwordField.required = true;
    }

    modal.style.display = 'block';
}

function editAccount(id) {
    openAccountModal(id);
}

function closeAccountModal() {
    document.getElementById('accountModal').style.display = 'none';
    document.getElementById('accountForm').reset();
}

async function saveAccount(event) {
    event.preventDefault();

    const accountId = document.getElementById('accountId').value;
    const isEdit = accountId !== '';

    const accountData = {
        username: document.getElementById('accountUsername').value,
        email: document.getElementById('accountEmail').value,
        role: document.getElementById('accountRole').value,
        account_status: document.getElementById('accountStatus').value,
        billing_status: document.getElementById('billingStatus').value,
        first_name: document.getElementById('accountFirstName').value || null,
        last_name: document.getElementById('accountLastName').value || null,
        is_active: document.getElementById('accountIsActive').checked ? 1 : 0
    };

    const password = document.getElementById('accountPassword').value;
    if (password) {
        accountData.password = password;
    }

    if (isEdit) {
        accountData.id = accountId;
    }

    try {
        const response = await fetch(`${API_URL}/accounts.php`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData)
        });

        const result = await response.json();

        if (response.ok) {
            closeAccountModal();
            await loadAccounts();
            showNotification(isEdit ? 'Account updated successfully!' : 'Account created successfully!', 'success');
        } else {
            showNotification('Error: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving account:', error);
        showNotification('Error saving account: ' + error.message, 'error');
    }
}

async function deleteAccount(id) {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/accounts.php?id=${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            await loadAccounts();
            showNotification('Account deleted successfully!', 'success');
        } else {
            showNotification('Error: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Error deleting account: ' + error.message, 'error');
    }
}

// Check if user is super admin and show accounts menu
function checkSuperAdminAccess() {
    const userRole = localStorage.getItem('userRole');
    const accountsMenuItem = document.getElementById('accountsMenuItem');

    console.log('Checking super admin access:', { userRole, accountsMenuItem: !!accountsMenuItem });

    if (userRole === 'super_admin') {
        if (accountsMenuItem) {
            accountsMenuItem.style.display = 'flex';
            console.log('Account Management menu shown');
        }
    } else {
        if (accountsMenuItem) {
            accountsMenuItem.style.display = 'none';
            console.log('Account Management menu hidden');
        }
    }
}

// Get current user role
function getCurrentUserRole() {
    return localStorage.getItem('userRole') || 'user';
}

// Check if current user is super admin
function isSuperAdmin() {
    return getCurrentUserRole() === 'super_admin';
}

// Display logged in user info in sidebar
function displayLoggedInUser() {
    const userRole = localStorage.getItem('userRole') || 'user';
    const userEmail = localStorage.getItem('userEmail') || '';

    console.log('User info from localStorage:', { userRole, userEmail });

    const loggedInUserEl = document.getElementById('loggedInUser');
    if (loggedInUserEl) {
        const roleLabel = userRole.replace('_', ' ');
        loggedInUserEl.innerHTML = `
            <div style="padding: 1rem; border-top: 1px solid var(--border-light); margin-top: auto;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                        ${userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${userEmail || 'Admin'}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize;">
                            ${roleLabel}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
