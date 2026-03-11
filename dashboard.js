document.addEventListener('DOMContentLoaded', () => {
    let applicationsData = [];
    let currentRegion = 'US';
    let currentLang = 'en';

    // ── i18n ──────────────────────────────────────────────────────────────────

    const translations = {
        en: {
            appTitle:            'Application Tracker',
            tabUS:               'United States',
            tabTaiwan:           'Taiwan',
            searchPlaceholder:   'Search by company or position...',
            allIndustries:       'All Industries',
            allStatuses:         'All Statuses',
            addBtn:              'Add New',
            importBtn:           'Import Simplify',
            importSuccess:       (n, s) => `Imported ${n} new ${n === 1 ? 'entry' : 'entries'}${s > 0 ? `, skipped ${s} duplicate${s === 1 ? '' : 's'}` : ''}.`,
            importNone:          'No new entries to import (all duplicates or skipped).',
            importError:         (msg) => `Import failed: ${msg}`,
            importInvalidFile:   'Please select a valid Simplify CSV file.',
            // Stats
            statTotal:           'Total Tracked',
            statApplied:         'Applied',
            statWaiting:         'To Do / Waiting',
            statRejected:        'Rejected',
            statNotOffered:      'Not Offered',
            // Table headers
            thCompany:           'Company',
            thIndustry:          'Industry',
            thStatus:            'Status',
            thPosition:          'Position',
            thDate:              'Date',
            thLinks:             'Links',
            thActions:           'Actions',
            // Table content
            viewLink:            'View link',
            deleteBtn:           'Delete',
            emptyState:          'No applications found in this category.',
            // Modal
            modalTitle:          'Add Application',
            labelCompany:        'Company',
            labelIndustry:       'Industry',
            labelStatus:         'Status',
            labelPosition:       'Position',
            labelDate:           'Date',
            labelLink:           'Link',
            // Placeholders
            companyPlaceholder:  'e.g. Acme Corp',
            selectIndustry:      'Select industry...',
            positionPlaceholder: 'e.g. Software Engineer Intern',
            datePlaceholder:     'e.g. 10/24/25',
            // Buttons
            todayBtn:            'Today',
            cancelBtn:           'Cancel',
            saveBtn:             'Save',
            // Status labels
            statusApplied:       '✅ Applied',
            statusAwaiting:      '🟡 Awaiting Action',
            statusNotYet:        '🔘 Not Yet',
            statusRejected:      '❌ Rejected',
            statusNotOffered:    '🈚️ Not Offered',
            // Confirm dialogs
            confirmDelete1:      (company) => `Delete "${company}" from the list?`,
            confirmDelete2:      () => 'Are you sure? This will permanently remove it from the CSV.',
        },
        zh: {
            appTitle:            '求職申請追蹤',
            tabUS:               '美國',
            tabTaiwan:           '台灣',
            searchPlaceholder:   '搜尋公司或職位...',
            allIndustries:       '所有產業',
            allStatuses:         '所有狀態',
            addBtn:              '新增',
            importBtn:           '匯入 Simplify',
            importSuccess:       (n, s) => `已匯入 ${n} 筆新資料${s > 0 ? `，略過 ${s} 筆重複` : ''}。`,
            importNone:          '沒有新資料可匯入（全部重複或略過）。',
            importError:         (msg) => `匯入失敗：${msg}`,
            importInvalidFile:   '請選擇有效的 Simplify CSV 檔案。',
            // Stats
            statTotal:           '總追蹤數',
            statApplied:         '已申請',
            statWaiting:         '待辦 / 等待中',
            statRejected:        '已拒絕',
            statNotOffered:      '未提供職缺',
            // Table headers
            thCompany:           '公司',
            thIndustry:          '產業別',
            thStatus:            '狀態',
            thPosition:          '職位',
            thDate:              '日期',
            thLinks:             '連結',
            thActions:           '操作',
            // Table content
            viewLink:            '查看連結',
            deleteBtn:           '刪除',
            emptyState:          '此分類中找不到申請記錄。',
            // Modal
            modalTitle:          '新增資料',
            labelCompany:        '公司',
            labelIndustry:       '產業別',
            labelStatus:         '狀態',
            labelPosition:       '職位',
            labelDate:           '日期',
            labelLink:           '連結',
            // Placeholders
            companyPlaceholder:  '例：台積電',
            selectIndustry:      '選擇產業...',
            positionPlaceholder: '例：軟體工程師實習生',
            datePlaceholder:     '例：10/24/25',
            // Buttons
            todayBtn:            '今天',
            cancelBtn:           '取消',
            saveBtn:             '儲存',
            // Status labels (display only — values stored in CSV stay as English)
            statusApplied:       '✅ 已申請',
            statusAwaiting:      '🟡 等待回應',
            statusNotYet:        '🔘 尚未申請',
            statusRejected:      '❌ 已拒絕',
            statusNotOffered:    '🈚️ 未提供職缺',
            // Confirm dialogs
            confirmDelete1:      (company) => `確定要從列表中刪除「${company}」嗎？`,
            confirmDelete2:      () => '確定嗎？此操作將從 CSV 中永久刪除。',
        }
    };

    // Map from CSV value string → translation key (values must stay as English strings)
    const STATUS_KEY_MAP = {
        '✅ Applied':          'statusApplied',
        '🟡 Awaiting Action':  'statusAwaiting',
        '🔘 Not Yet':          'statusNotYet',
        '❌ Rejected':         'statusRejected',
        '🈚️ Not Offered':     'statusNotOffered',
    };

    function t(key) {
        const val = translations[currentLang][key];
        if (val !== undefined) return val;
        return translations.en[key] || key;
    }

    function applyTranslations() {
        document.documentElement.lang = currentLang === 'zh' ? 'zh-TW' : 'en';

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const val = t(el.dataset.i18n);
            if (typeof val === 'string') el.textContent = val;
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.dataset.i18nPlaceholder);
        });
    }

    function setupLangToggle() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.lang === currentLang) return;
                currentLang = btn.dataset.lang;

                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                applyTranslations();
                populateFilters();
                updateStats();
                if (window.filterData) window.filterData();
            });
        });
    }

    // ── Initialize UI ─────────────────────────────────────────────────────────

    applyTranslations();
    setupLangToggle();
    setupTabs();
    setupEventListeners();
    setupModal();
    setupSimplifyImport();

    // Load initial data
    loadDataForRegion(currentRegion);


    function loadDataForRegion(region) {
        function doLoad() {
            window.pywebview.api.read_csv(region)
                .then(csvText => {
                    if (!csvText) { processData([], region); return; }
                    Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: true,
                        complete: function(results) {
                            processData(results.data, region);
                        }
                    });
                })
                .catch(() => processData([], region));
        }

        if (window.pywebview) {
            doLoad();
        } else {
            window.addEventListener('pywebviewready', doLoad, { once: true });
        }
    }

    function processData(csvData, region) {
        let processedData = [];

        csvData.forEach((row, idx) => {
            const keys = Object.keys(row);
            const company = row["Company"];
            const type = row["Company Type"];

            if (!company || company.trim() === "") return;
            if (company.trim() === "(blank)") return;

            // Auto-detect status column
            let status = "";
            for (let k of keys) {
                if (row[k] && (row[k].includes("✅") || row[k].includes("❌") || row[k].includes("🔘") || row[k].includes("🟡") || row[k].includes("🈚️"))) {
                    status = row[k];
                    break;
                }
            }
            if (!status && Object.values(row).length > 3) {
                status = Object.values(row)[3] || "";
            }

            const position = row["Position"] || "";
            const applyDate = row["Application Date"] || "";
            const link = row["Link"] || "";

            if (!status || status.trim() === "") {
                status = "🔘 Not Yet";
            }

            status = status.trim().replace('Not offered', 'Not Offered');

            processedData.push({
                id: `csv_${idx}`,
                company: company.trim(),
                type: type ? type.trim() : "Other",
                status: status,
                position: position.trim(),
                applyDate: applyDate.trim(),
                link: link.trim()
            });
        });

        applicationsData = processedData;

        document.getElementById('search-input').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('status-filter').value = '';

        populateFilters();
        updateStats();
        renderTable(applicationsData);
    }

    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                currentRegion = btn.dataset.region;
                loadDataForRegion(currentRegion);
            });
        });
    }

    function populateFilters() {
        const types = [...new Set(applicationsData.map(d => d.type).filter(t => t))].sort();
        const typeSelect = document.getElementById('type-filter');
        typeSelect.innerHTML = `<option value="">${t('allIndustries')}</option>`;

        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });

        const statusSelect = document.getElementById('status-filter');
        statusSelect.innerHTML = `<option value="">${t('allStatuses')}</option>`;

        const statuses = [...new Set(applicationsData.map(d => d.status).filter(s => s))].sort();

        statuses.forEach(st => {
            if (!st) return;
            const option = document.createElement('option');
            option.value = st;
            const key = STATUS_KEY_MAP[st];
            option.textContent = key ? t(key) : st;
            statusSelect.appendChild(option);
        });
    }

    function updateStats() {
        const total      = applicationsData.length;
        const applied    = applicationsData.filter(d => d.status.includes('✅')).length;
        const rejected   = applicationsData.filter(d => d.status.includes('❌')).length;
        const waiting    = applicationsData.filter(d => d.status.includes('🟡') || d.status.includes('🔘')).length;
        const notOffered = applicationsData.filter(d => d.status.includes('🈚️')).length;

        document.getElementById('stats-container').innerHTML = `
            <div class="stat-card">
                <h3>${t('statTotal')}</h3>
                <div class="value">${total}</div>
            </div>
            <div class="stat-card">
                <h3>${t('statApplied')}</h3>
                <div class="value" style="color: var(--status-applied-text)">${applied}</div>
            </div>
            <div class="stat-card">
                <h3>${t('statWaiting')}</h3>
                <div class="value" style="color: var(--status-waiting-text)">${waiting}</div>
            </div>
            <div class="stat-card">
                <h3>${t('statRejected')}</h3>
                <div class="value" style="color: var(--status-rejected-text)">${rejected}</div>
            </div>
            <div class="stat-card">
                <h3>${t('statNotOffered')}</h3>
                <div class="value" style="color: var(--text-secondary)">${notOffered}</div>
            </div>
        `;
    }

    function renderTable(data) {
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${t('emptyState')}</td></tr>`;
            return;
        }

        const statusOptions = [
            "✅ Applied",
            "🟡 Awaiting Action",
            "🔘 Not Yet",
            "❌ Rejected",
            "🈚️ Not Offered"
        ];

        data.forEach(item => {
            if (!item.company && !item.position) return;

            const tr = document.createElement('tr');
            const statusClass = getStatusClass(item.status);

            let optionsHtml = '';
            statusOptions.forEach(opt => {
                const selected = item.status === opt ? 'selected' : '';
                const key = STATUS_KEY_MAP[opt];
                const label = key ? t(key) : opt;
                optionsHtml += `<option value="${opt}" ${selected}>${label}</option>`;
            });

            tr.innerHTML = `
                <td class="company-name">${escapeHTML(item.company)}</td>
                <td>${escapeHTML(item.type)}</td>
                <td>
                    <div class="status-badge ${statusClass}">
                        <select class="status-select" data-id="${item.id}" data-company="${escapeHTML(item.company)}" data-position="${escapeHTML(item.position)}">
                            ${optionsHtml}
                        </select>
                    </div>
                </td>
                <td>${escapeHTML(item.position) || '<span style="color: var(--text-secondary)">-</span>'}</td>
                <td>${escapeHTML(item.applyDate) || '-'}</td>
                <td>
                    <a href="${item.link ? escapeHTML(item.link) : '#'}"
                       target="_blank"
                       rel="noopener"
                       class="link-btn ${!item.link ? 'disabled' : ''}">
                       ${item.link ? t('viewLink') : '-'}
                    </a>
                </td>
                <td>
                    <button class="btn-danger delete-btn"
                        data-id="${item.id}"
                        data-company="${escapeHTML(item.company)}"
                        data-position="${escapeHTML(item.position)}">${t('deleteBtn')}</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Attach delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const company  = e.target.dataset.company;
                const position = e.target.dataset.position;

                const confirmFn1 = t('confirmDelete1');
                const confirmFn2 = t('confirmDelete2');
                if (!confirm(typeof confirmFn1 === 'function' ? confirmFn1(company) : confirmFn1)) return;
                if (!confirm(typeof confirmFn2 === 'function' ? confirmFn2() : confirmFn2)) return;

                try {
                    const result = await window.pywebview.api.delete_entry(currentRegion, company, position);
                    if (!result.success) throw new Error(result.error);
                } catch (err) {
                    alert('Failed to delete: ' + err.message);
                    return;
                }
                loadDataForRegion(currentRegion);
            });
        });

        // Attach status change listeners
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const company   = e.target.dataset.company;
                const position  = e.target.dataset.position;
                const newStatus = e.target.value;
                const id        = e.target.dataset.id;

                const badge = e.target.closest('.status-badge');
                badge.className = 'status-badge ' + getStatusClass(newStatus);

                try {
                    const result = await window.pywebview.api.update_status(currentRegion, company, position, newStatus);
                    if (!result.success) throw new Error(result.error || 'Failed to update CSV');
                } catch (error) {
                    console.error('Error updating status:', error);
                    alert('Failed to save status. Make sure you opened the app via app.py.');
                    loadDataForRegion(currentRegion);
                    return;
                }

                const dataItem = applicationsData.find(d => d.id === id);
                if (dataItem) dataItem.status = newStatus;
                updateStats();
                if (window.filterData) window.filterData();
            });
        });
    }

    function getStatusClass(status) {
        if (status.includes('✅')) return 'applied';
        if (status.includes('❌')) return 'rejected';
        if (status.includes('🟡') || status.includes('🔘')) return 'waiting';
        return 'none';
    }

    function setupEventListeners() {
        document.getElementById('search-input').addEventListener('input', () => window.filterData());
        document.getElementById('type-filter').addEventListener('change', () => window.filterData());
        document.getElementById('status-filter').addEventListener('change', () => window.filterData());
    }

    window.filterData = function() {
        const query  = document.getElementById('search-input').value.toLowerCase();
        const type   = document.getElementById('type-filter').value;
        const status = document.getElementById('status-filter').value;

        const filtered = applicationsData.filter(item => {
            const matchesSearch = item.company.toLowerCase().includes(query) || item.position.toLowerCase().includes(query);
            const matchesType   = type   ? item.type   === type   : true;
            const matchesStatus = status ? item.status === status : true;
            return matchesSearch && matchesType && matchesStatus;
        });

        renderTable(filtered);
    };

    function setupModal() {
        const modal     = document.getElementById('add-modal');
        const addBtn    = document.getElementById('add-btn');
        const closeBtn  = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const form      = document.getElementById('add-form');

        function populateTypeDropdown() {
            const select  = document.getElementById('new-type');
            const current = select.value;
            select.innerHTML = `<option value="" disabled selected>${t('selectIndustry')}</option>`;
            const types = [...new Set(applicationsData.map(d => d.type).filter(t => t))].sort();
            types.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                if (type === current) opt.selected = true;
                select.appendChild(opt);
            });
        }

        // --- Autocomplete ---
        const companyInput   = document.getElementById('new-company');
        const suggestionsList = document.getElementById('company-suggestions');
        let activeIdx = -1;

        function getUniqueCandidates(query) {
            const q = query.toLowerCase();
            const seen = new Set();
            return applicationsData
                .filter(d => d.company.toLowerCase().includes(q))
                .filter(d => { if (seen.has(d.company)) return false; seen.add(d.company); return true; })
                .slice(0, 8);
        }

        function renderSuggestions(candidates) {
            suggestionsList.innerHTML = '';
            activeIdx = -1;
            if (candidates.length === 0) { suggestionsList.classList.remove('open'); return; }
            candidates.forEach((c) => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.innerHTML = `<span>${escapeHTML(c.company)}</span><span class="ac-type">${escapeHTML(c.type)}</span>`;
                item.addEventListener('mousedown', (e) => { e.preventDefault(); applyCandidate(c); });
                suggestionsList.appendChild(item);
            });
            suggestionsList.classList.add('open');
        }

        function applyCandidate(c) {
            companyInput.value = c.company;
            const typeSelect = document.getElementById('new-type');
            for (let opt of typeSelect.options) {
                if (opt.value === c.type) { opt.selected = true; break; }
            }
            suggestionsList.classList.remove('open');
        }

        companyInput.addEventListener('input', () => {
            const q = companyInput.value.trim();
            if (q.length < 1) { suggestionsList.classList.remove('open'); return; }
            renderSuggestions(getUniqueCandidates(q));
        });

        companyInput.addEventListener('keydown', (e) => {
            const items = suggestionsList.querySelectorAll('.autocomplete-item');
            if (!items.length) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIdx = Math.min(activeIdx + 1, items.length - 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIdx = Math.max(activeIdx - 1, 0);
            } else if (e.key === 'Enter' && activeIdx >= 0) {
                e.preventDefault();
                items[activeIdx].dispatchEvent(new Event('mousedown'));
                return;
            } else if (e.key === 'Escape') {
                suggestionsList.classList.remove('open');
                return;
            }
            items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
        });

        companyInput.addEventListener('blur', () => {
            setTimeout(() => suggestionsList.classList.remove('open'), 150);
        });

        // --- Today button ---
        document.getElementById('today-btn').addEventListener('click', () => {
            const now = new Date();
            const mm  = String(now.getMonth() + 1).padStart(2, '0');
            const dd  = String(now.getDate()).padStart(2, '0');
            const yy  = String(now.getFullYear()).slice(-2);
            document.getElementById('new-date').value = `${mm}/${dd}/${yy}`;
        });

        function openModal() {
            populateTypeDropdown();
            modal.classList.add('active');
            companyInput.focus();
        }

        function closeModal() {
            modal.classList.remove('active');
            form.reset();
            suggestionsList.classList.remove('open');
        }

        addBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const company   = document.getElementById('new-company').value;
            const type      = document.getElementById('new-type').value;
            const status    = document.getElementById('new-status').value;
            const position  = document.getElementById('new-position').value;
            const applyDate = document.getElementById('new-date').value;
            const link      = document.getElementById('new-link').value;

            try {
                const result = await window.pywebview.api.add_entry(
                    currentRegion, company, type, status, position, applyDate, link
                );
                if (!result.success) throw new Error(result.error);
            } catch (err) {
                alert('Failed to save entry: ' + err.message);
                return;
            }

            closeModal();
            loadDataForRegion(currentRegion);
        });
    }

    // ── Simplify Import ───────────────────────────────────────────────────────

    const SIMPLIFY_STATUS_MAP = {
        'APPLIED':   '✅ Applied',
        'SAVED':     '🔘 Not Yet',
        'WITHDRAWN': '🟡 Awaiting Action',
        'INTERVIEWING': '🟡 Awaiting Action',
        'OFFERED':   '✅ Applied',
        'REJECTED':  '❌ Rejected',
    };

    // Required Simplify columns
    const SIMPLIFY_REQUIRED_COLS = ['Job Title', 'Company Name', 'Job URL', 'Status', 'Archived'];

    function convertSimplifyDate(dateStr) {
        if (!dateStr || dateStr === 'N/A') return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return '';
        const [year, month, day] = parts;
        const yy = year.slice(-2);
        return `${parseInt(month, 10)}/${parseInt(day, 10)}/${yy}`;
    }

    function isValidSimplifyCSV(fields) {
        return SIMPLIFY_REQUIRED_COLS.every(col => fields.includes(col));
    }

    function getTypeForCompany(companyName) {
        const match = applicationsData.find(
            d => d.company.toLowerCase() === companyName.toLowerCase()
        );
        return match ? match.type : 'Other';
    }

    function showImportToast(message, isError) {
        const toast = document.getElementById('import-toast');
        toast.textContent = message;
        toast.className = 'import-toast show' + (isError ? ' error' : '');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.className = 'import-toast'; }, 4000);
    }

    function setupSimplifyImport() {
        const importBtn  = document.getElementById('import-simplify-btn');
        const fileInput  = document.getElementById('simplify-file-input');

        importBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            fileInput.value = '';   // reset so same file can be re-imported after a fix
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const csvText = e.target.result;
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        const fields = results.meta.fields || [];

                        if (!isValidSimplifyCSV(fields)) {
                            const invalidMsg = t('importInvalidFile');
                            showImportToast(typeof invalidMsg === 'function' ? invalidMsg() : invalidMsg, true);
                            return;
                        }

                        // Filter and map rows
                        const entries = [];
                        for (const row of results.data) {
                            // Skip archived entries and tutorial/chrome-extension rows
                            if ((row['Archived'] || '').trim().toLowerCase() === 'yes') continue;
                            const jobUrl = (row['Job URL'] || '').trim();
                            if (jobUrl.startsWith('chrome-extension://')) continue;

                            const companyName = (row['Company Name'] || '').trim();
                            const jobTitle    = (row['Job Title']    || '').trim();
                            if (!companyName) continue;
                            // Skip Simplify's own tutorial entry
                            if (companyName.toLowerCase() === 'simplify') continue;

                            const simplifyStatus = (row['Status'] || '').trim().toUpperCase();
                            const mappedStatus   = SIMPLIFY_STATUS_MAP[simplifyStatus] || '🔘 Not Yet';
                            const applyDate      = convertSimplifyDate((row['Applied Date'] || '').trim());
                            const companyType    = getTypeForCompany(companyName);

                            entries.push({
                                company:      companyName,
                                company_type: companyType,
                                status:       mappedStatus,
                                position:     jobTitle,
                                apply_date:   applyDate,
                                link:         jobUrl,
                            });
                        }

                        if (entries.length === 0) {
                            const noneMsg = t('importNone');
                            showImportToast(typeof noneMsg === 'function' ? noneMsg() : noneMsg, false);
                            return;
                        }

                        try {
                            const result = await window.pywebview.api.import_entries(currentRegion, entries);
                            if (!result.success) throw new Error(result.error);

                            const successFn = t('importSuccess');
                            showImportToast(
                                typeof successFn === 'function'
                                    ? successFn(result.imported, result.skipped)
                                    : successFn,
                                false
                            );

                            if (result.imported > 0) loadDataForRegion(currentRegion);
                        } catch (err) {
                            const errorFn = t('importError');
                            showImportToast(
                                typeof errorFn === 'function' ? errorFn(err.message) : errorFn,
                                true
                            );
                        }
                    }
                });
            };
            reader.readAsText(file);
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g,
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
});
