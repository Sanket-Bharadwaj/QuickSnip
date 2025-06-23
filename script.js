class QuickSnip {
            constructor() {
                this.snippets = this.loadSnippets();
                this.initTheme();
                this.render();
                this.bindEvents();
            }

            initTheme() {
                const savedTheme = localStorage.getItem('quicksnip-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = savedTheme || (prefersDark ? 'dark' : 'light');
                document.body.setAttribute('data-theme', theme);
            }

            bindEvents() {
                document.getElementById('snippetForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addSnippet();
                });

                // Custom select events
                const customSelect = document.getElementById('customTagSelect');
                const selected = customSelect.querySelector('.selected');
                const optionsContainer = customSelect.querySelector('.options');
                const optionsList = optionsContainer.querySelectorAll('div');

                selected.addEventListener('click', () => {
                    optionsContainer.classList.toggle('active');
                });

                optionsList.forEach(option => {
                    option.addEventListener('click', (e) => {
                        const value = e.target.getAttribute('data-value');
                        const text = e.target.innerText;

                        document.getElementById('tag').value = value;
                        selected.innerText = text;
                        optionsContainer.classList.remove('active');
                    });
                });

                // Close options if clicked outside
                document.addEventListener('click', (e) => {
                    if (!customSelect.contains(e.target)) {
                        optionsContainer.classList.remove('active');
                    }
                });

                // Custom dropdown logic for language/tag
                document.addEventListener('DOMContentLoaded', function() {
                    const customSelect = document.getElementById('customTagSelect');
                    const selected = customSelect.querySelector('.selected');
                    const options = customSelect.querySelector('.options');
                    const hiddenInput = customSelect.querySelector('input[type="hidden"]');

                    // Open/close dropdown
                    selected.addEventListener('click', function(e) {
                        customSelect.classList.toggle('open');
                    });
                    selected.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            customSelect.classList.toggle('open');
                        }
                    });

                    // Select option
                    options.querySelectorAll('div').forEach(option => {
                        option.addEventListener('click', function() {
                            selected.textContent = this.textContent;
                            hiddenInput.value = this.getAttribute('data-value');
                            options.querySelectorAll('div').forEach(opt => opt.classList.remove('selected-option'));
                            this.classList.add('selected-option');
                            customSelect.classList.remove('open');
                        });
                    });

                    // Close dropdown on outside click
                    document.addEventListener('click', function(e) {
                        if (!customSelect.contains(e.target)) {
                            customSelect.classList.remove('open');
                        }
                    });
                });
            }

            loadSnippets() {
                try {
                    return JSON.parse(localStorage.getItem('quicksnip-snippets') || '[]');
                } catch {
                    return [];
                }
            }

            saveSnippets() {
                localStorage.setItem('quicksnip-snippets', JSON.stringify(this.snippets));
            }

            addSnippet() {
                const title = document.getElementById('title').value.trim();
                const code = document.getElementById('code').value.trim();
                const tag = document.getElementById('tag').value;

                if (!title || !code) {
                    this.showToast('Please fill in all fields', 'error');
                    return;
                }

                const snippet = {
                    id: Date.now(),
                    title,
                    code,
                    tag,
                    createdAt: new Date().toISOString()
                };

                this.snippets.unshift(snippet);
                this.saveSnippets();
                this.render();
                this.clearForm();
                this.showToast('Snippet saved successfully!', 'success');
            }

            deleteSnippet(id) {
                showDeleteConfirm(id);
            }
confirmDelete(id) {
    this.snippets = this.snippets.filter(s => s.id !== id);
    this.saveSnippets();
    this.render();
    this.showToast('Snippet deleted', 'success');
}
cancelDelete() {
    const toast = document.getElementById('toast');
    toast.classList.remove('show');
}

            copySnippet(code) {
                navigator.clipboard.writeText(code).then(() => {
                    this.showToast('Code copied to clipboard!', 'success');
                }).catch(() => {
                    this.showToast('Failed to copy code', 'error');
                });
            }

            copySnippetById(id) {
                const snippet = this.snippets.find(s => s.id === id);
                if (snippet) {
                    this.copySnippet(snippet.code);
                }
            }

            exportSnippet(snippet) {
                // If snippet is passed as a string (from HTML), parse it
                if (typeof snippet === "string") {
                    snippet = JSON.parse(snippet.replace(/&quot;/g, '"'));
                }
                const extensions = {
                    js: 'js', ts: 'ts', py: 'py', html: 'html', css: 'css', json: 'json',
                    sql: 'sql', bash: 'sh', php: 'php', swift: 'swift', kotlin: 'kt',
                    dart: 'dart', ruby: 'rb', cpp: 'cpp', csharp: 'cs', go: 'go', rust: 'rs', other: 'txt'
                };
                const extension = extensions[snippet.tag] || 'txt';
                const filename = `${snippet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
                this.downloadFile(snippet.code, `${filename}.${extension}`);
                this.showToast(`Exported as ${filename}.${extension}`, 'success');
            }

            exportAll() {
                if (this.snippets.length === 0) {
                    this.showToast('No snippets to export', 'error');
                    return;
                }
                // Disable button and show loading
                const exportBtn = document.querySelector('button[onclick="app.exportAll()"]');
                if (exportBtn) {
                    exportBtn.disabled = true;
                    exportBtn.innerHTML = '⏳ Exporting...';
                }
                setTimeout(() => {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    let y = 10;
                    this.snippets.forEach((snippet, idx) => {
                        doc.setFontSize(14);
                        doc.text(`${snippet.title} (${snippet.tag})`, 10, y);
                        y += 8;
                        doc.setFontSize(10);
                        const lines = doc.splitTextToSize(snippet.code, 180);
                        lines.forEach(line => {
                            if (y > 270) { doc.addPage(); y = 10; }
                            doc.text(line, 10, y);
                            y += 6;
                        });
                        y += 8;
                        if (y > 270 && idx !== this.snippets.length - 1) { doc.addPage(); y = 10; }
                    });
                    doc.save('quicksnip_export.pdf');
                    this.showToast('All snippets exported as PDF!', 'success');
                    // Restore button
                    if (exportBtn) {
                        exportBtn.disabled = false;
                        exportBtn.innerHTML = '📤 Export All Snippets';
                    }
                }, 300); // Simulate a short delay for UX
            }

            exportSnippetById(id) {
                const extensions = {
                    js: 'js', ts: 'ts', py: 'py', html: 'html', css: 'css', json: 'json',
                    sql: 'sql', bash: 'sh', php: 'php', swift: 'swift', kotlin: 'kt',
                    dart: 'dart', ruby: 'rb', cpp: 'cpp', csharp: 'cs', go: 'go', rust: 'rs', other: 'txt'
                };
                const snippet = this.snippets.find(s => s.id === id);
                if (!snippet) {
                    this.showToast('Snippet not found', 'error');
                    return;
                }
                const extension = extensions[snippet.tag] || 'txt';
                const filename = `${snippet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
                this.downloadFile(snippet.code, `${filename}.${extension}`);
                this.showToast(`Exported as ${filename}.${extension}`, 'success');
            }

            downloadFile(content, filename) {
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            clearForm() {
                document.getElementById('title').value = '';
                document.getElementById('code').value = '';
                document.getElementById('tag').value = 'js';
                document.querySelector('.custom-select .selected').innerText = 'JavaScript';
            }

            showToast(message, type = 'success') {
                const toast = document.getElementById('toast');
                toast.textContent = message;
                toast.className = `toast ${type}`;
                toast.classList.add('show');

                setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            }

            showDeleteConfirm(id) {
                const toast = document.getElementById('toast');
                toast.innerHTML = `
                    <span>Are you sure you want to delete?</span>
                    <button style="margin-left:1rem;padding:0.3rem 1rem;border-radius:8px;border:none;background:var(--danger-color);color:#fff;cursor:pointer;" onclick="app.confirmDelete(${id})">Delete</button>
                    <button style="margin-left:0.5rem;padding:0.3rem 1rem;border-radius:8px;border:none;background:rgba(255,255,255,0.12);color:#fff;cursor:pointer;" onclick="app.cancelDelete()">Cancel</button>
                `;
                toast.className = `toast error show`;
            }

            render() {
                const container = document.getElementById('snippetsList');
                
                if (this.snippets.length === 0) {
                    container.innerHTML = `
                        <div class="glass-card empty-state">
                            <h3>No snippets yet</h3>
                            <p>Create your first code snippet above!</p>
                        </div>
                    `;
                    return;
                }

                const exportAllBtn = `
    <div style="text-align: center; margin-bottom: 2.5rem;">
        <button id="exportAllBtn" class="btn btn-glassy btn-large" onclick="app.exportAll()" style="font-size:1.15rem;padding:0.9rem 2.2rem;border-radius:16px;display:inline-flex;align-items:center;gap:0.7em;">
            <span class="export-icon" style="font-size:1.3em;">📤</span>
            <span class="export-text">Export All Snippets</span>
        </button>
    </div>
`;

                const snippetsHTML = this.snippets.map(snippet => `
                    <div class="glass-card snippet-card">
                        <div class="snippet-header">
                            <h3 class="snippet-title">${this.escapeHtml(snippet.title)}</h3>
                            <span class="snippet-tag">${snippet.tag}</span>
                        </div>
                        <div class="snippet-code">${this.escapeHtml(snippet.code)}</div>
                        <div class="snippet-actions">
                            <button class="btn btn-small btn-secondary" onclick="app.copySnippetById(${snippet.id}); createRipple(event)">
                                📋 Copy
                            </button>
                            <button class="btn btn-small btn-secondary" onclick="app.exportSnippetById(${snippet.id}); createRipple(event)">
                                📤 Export
                            </button>
                            <button class="btn btn-small btn-danger" onclick="app.deleteSnippet(${snippet.id}); createRipple(event)">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `).join('');

                container.innerHTML = `
                    ${exportAllBtn}
                    <div class="snippets-grid">
                        ${snippetsHTML}
                    </div>
                `;
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                               div.textContent = text;
                return div.innerHTML;
            }
        }

        // Ripple effect
        function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    setTimeout(() => {
        ripple.remove();
    }, 600);
}


        // Theme toggle
        function toggleTheme() {
            const body = document.body;
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('quicksnip-theme', newTheme);
        }

        function toggleThemeSwitch(checkbox) {
            const newTheme = checkbox.checked ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('quicksnip-theme', newTheme);
        }
        window.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('quicksnip-theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme || (prefersDark ? 'dark' : 'light');
            document.body.setAttribute('data-theme', theme);
            const themeSwitch = document.getElementById('themeSwitch');
            if (themeSwitch) themeSwitch.checked = (theme === 'dark');
        });

        // Initialize app
        const app = new QuickSnip();

        // Place this outside the QuickSnip class
function showDeleteConfirm(id) {
    const toast = document.getElementById('toast');
    toast.innerHTML = `
        <span>Are you sure you want to delete?</span>
        <button style="margin-left:1rem;padding:0.3rem 1rem;border-radius:8px;border:none;background:var(--danger-color);color:#fff;cursor:pointer;" onclick="app.confirmDelete(${id})">Delete</button>
        <button style="margin-left:0.5rem;padding:0.3rem 1rem;border-radius:8px;border:none;background:rgba(255,255,255,0.12);color:#fff;cursor:pointer;" onclick="app.cancelDelete()">Cancel</button>
    `;
    toast.className = `toast error show`;
}

/* Track mouse movement for background effect */
document.addEventListener('mousemove', function(e) {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.body.style.setProperty('--mouse-x', `${x}%`);
    document.body.style.setProperty('--mouse-y', `${y}%`);
});