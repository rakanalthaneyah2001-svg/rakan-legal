const additionalSystemsGrid = $('#additional-systems-grid');
fetch('/api/additional-systems').then((response) => response.json()).then(({ systems }) => {
  additionalSystemsGrid.innerHTML = systems.map((system, index) => `<article class="additional-system-card"><div class="law-meta"><span>${escapeHTML(system.category)}</span><b>${String(index + 13).padStart(2, '0')}</b></div><h3>${escapeHTML(system.name)}</h3><p>${escapeHTML(system.summary)}</p><div class="law-foot"><span>هيئة الخبراء · بحث رسمي</span><a class="official-link" href="${escapeHTML(system.url)}" target="_blank" rel="noreferrer">فتح النظام الرسمي ↗</a></div></article>`).join('');
}).catch(() => { additionalSystemsGrid.innerHTML = '<div class="precedent-loading">تعذر تحميل الحزمة. استخدم فهرس هيئة الخبراء الرسمي.</div>'; });
