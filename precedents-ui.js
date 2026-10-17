const precedentsGrid = $('#precedents-grid');
const precedentSearch = $('#precedent-search');
const precedentCount = $('#precedent-count');
const systemNames = { civil: 'نظام المعاملات المدنية', companies: 'نظام الشركات', labor: 'نظام العمل', evidence: 'نظام الإثبات', 'commercial-courts': 'نظام المحاكم التجارية', execution: 'نظام التنفيذ', 'law-practice': 'نظام المحاماة', notarization: 'نظام التوثيق', 'civil-procedure': 'نظام المرافعات الشرعية', cybercrime: 'نظام مكافحة جرائم المعلوماتية', ecommerce: 'نظام التجارة الإلكترونية', 'personal-data': 'نظام حماية البيانات الشخصية' };
let precedentRecords = [];
const precedentStatus = (record) => record.status === 'verified' ? '<span class="verified-badge">تحقق رسمي</span>' : '<span class="unavailable-badge">بحث رسمي فقط</span>';
const renderPrecedents = () => {
  const query = (precedentSearch?.value || '').trim().toLowerCase();
  const filtered = precedentRecords.filter((record) => `${record.systemName} ${record.title || ''} ${record.number || ''} ${record.date || ''} ${record.court || ''} ${record.note || ''}`.toLowerCase().includes(query));
  if (precedentCount) precedentCount.textContent = `${filtered.length} سجل ظاهر · ${precedentRecords.filter((item) => item.status === 'verified').length} سجلات موثقة`;
  if (!filtered.length) { precedentsGrid.innerHTML = '<div class="precedent-loading">لا توجد نتائج في السجلات المحملة. جرّب رقم قضية أو اسم نظام.</div>'; return; }
  precedentsGrid.innerHTML = filtered.map((record) => record.status === 'verified'
    ? `<article class="precedent-card"><div class="precedent-card-top"><span class="precedent-system">${escapeHTML(record.systemName)}</span>${precedentStatus(record)}</div><h3>${escapeHTML(record.title)}</h3><div class="precedent-meta"><span>${escapeHTML(record.number)}</span><span>${escapeHTML(record.date)}</span><span>${escapeHTML(record.court)}</span></div><p>${escapeHTML(record.note)}</p><a class="official-link" href="${escapeHTML(record.url)}" target="_blank" rel="noreferrer">فتح الحكم الرسمي ↗</a></article>`
    : `<article class="precedent-card unavailable-card"><div class="precedent-card-top"><span class="precedent-system">${escapeHTML(record.systemName)}</span>${precedentStatus(record)}</div><h3>لا توجد سابقة مدرجة حاليًا</h3><p>${escapeHTML(record.note)}</p><a class="official-link" href="${escapeHTML(record.portal)}" target="_blank" rel="noreferrer">فتح البحث الرسمي ↗</a></article>`).join('');
};
fetch('/api/precedents').then((response) => response.json()).then(({ precedents }) => {
  precedentRecords = Object.entries(precedents).flatMap(([systemId, item]) => {
    const systemName = systemNames[systemId] || systemId;
    if (item.precedents.length) return item.precedents.map((precedent) => ({ ...precedent, systemId, systemName, status: item.status }));
    return [{ systemId, systemName, status: item.status, note: item.note, portal: item.portal }];
  });
  renderPrecedents();
}).catch(() => { precedentsGrid.innerHTML = '<div class="precedent-loading">تعذر تحميل السجلات. استخدم بوابة وزارة العدل الرسمية مباشرة.</div>'; });
precedentSearch?.addEventListener('input', renderPrecedents);
