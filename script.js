const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const toast = (message) => {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => node.classList.remove('show'), 3200);
};

$$('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => $(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
});

const menuToggle = $('.menu-toggle');
const nav = $('.main-nav');
menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  nav.classList.toggle('mobile-open', !isOpen);
});

$$('.main-nav a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('mobile-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

const tabTitles = {
  advisor: 'اسأل عن نقطة قانونية',
  case: 'أنشئ ملف القضية',
  review: 'راجع المستند قبل اعتماده',
  editor: 'اكتب المسودة بمساعدة ذكية'
};
$$('.capability-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const id = tab.dataset.tab;
    $$('.capability-tab').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    $$('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${id}`));
    $('#preview-title').textContent = tabTitles[id];
  });
});

$('#advisor-send')?.addEventListener('click', () => {
  const input = $('#advisor-input');
  const question = input.value.trim();
  if (!question) {
    toast('اكتب سؤالًا قصيرًا لتظهر لك إجابة العرض.');
    input.focus();
    return;
  }
  const windowNode = $('.chat-window');
  const answer = document.createElement('div');
  answer.className = 'chat-ai new-answer';
  answer.innerHTML = `<span class="avatar ai-avatar">ر</span><div><div class="answer-top"><strong>راكان</strong><span>الآن · عرض تجريبي</span></div><p>سجّلنا سؤالك: «${question.replace(/[<>]/g, '')}». يحتاج هذا النوع من الأسئلة إلى مصدر رسمي وسياق مكتمل قبل أي استنتاج.</p><div class="source-chips"><span>بانتظار التحقق من المصدر</span><span>ليست مشورة قانونية</span></div></div>`;
  windowNode.append(answer);
  input.value = '';
  windowNode.scrollTop = windowNode.scrollHeight;
  toast('تمت إضافة السؤال إلى جلسة العرض.');
});

$('#advisor-input')?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') $('#advisor-send').click();
});

$('#save-case')?.addEventListener('click', () => {
  toast('حُفظت القضية ضمن بيانات العرض التجريبية.');
});

$('#run-analysis')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const stages = $$('.stage-item');
  button.disabled = true;
  button.innerHTML = 'جارٍ تشغيل المراحل <span>…</span>';
  stages.forEach((stage, index) => {
    setTimeout(() => {
      stage.classList.add('done');
      stage.classList.remove('active');
      const status = $('.stage-status', stage);
      status.textContent = 'مكتمل';
      if (index < stages.length - 1) {
        stages[index + 1].classList.add('active');
        $('.stage-status', stages[index + 1]).textContent = 'جاري';
      }
      if (index === stages.length - 1) {
        button.disabled = false;
        button.innerHTML = 'إعادة تشغيل العرض <span>↗</span>';
        toast('اكتملت مراحل التحليل التجريبية.');
      }
    }, (index + 1) * 420);
  });
});

const filters = $$('.filter');
const lawCards = $$('.law-card');
const emptyLibrary = $('#empty-library');
let activeFilter = 'all';
const refreshLibrary = () => {
  const query = ($('#library-search')?.value || '').trim().toLowerCase();
  let visible = 0;
  lawCards.forEach((card) => {
    const matchesFilter = activeFilter === 'all' || card.dataset.category === activeFilter;
    const matchesQuery = !query || `${card.dataset.search} ${card.textContent}`.toLowerCase().includes(query);
    const show = matchesFilter && matchesQuery;
    card.hidden = !show;
    if (show) visible += 1;
  });
  emptyLibrary.hidden = visible !== 0;
};
filters.forEach((filter) => filter.addEventListener('click', () => {
  filters.forEach((item) => item.classList.remove('active'));
  filter.classList.add('active');
  activeFilter = filter.dataset.filter;
  refreshLibrary();
}));
$('#library-search')?.addEventListener('input', refreshLibrary);

const modalBackdrop = $('#modal-backdrop');
const modalTitle = $('#modal-title');
const modalCopy = $('#modal-copy');
const demoForm = $('#demo-form');
const openModal = (type) => {
  const copy = {
    contact: ['تواصل مع فريق راكان', 'هذه نافذة عرضية لإظهار شكل قناة التواصل مع الفريق.'],
    demo: ['احجز جلسة تعريفية', 'اختر ما تريد رؤيته في جلسة العرض الأولى.'],
    case: ['خيارات ملف القضية', 'يمكن هنا مستقبلاً تصدير ملخص أو مشاركة الملف مع فريقك.'],
    invite: ['دعوة عضو إلى المساحة', 'أدخل بيانات العضو في النسخة الإنتاجية لإرسال دعوة حقيقية.'],
    article: ['دليل بناء السؤال القانوني', 'ابدأ بتحديد الواقعة، ثم الطلب، ثم المصدر الذي تريد التحقق منه.']
  }[type] || ['راكان', 'هذه نافذة تجريبية.'];
  modalTitle.textContent = copy[0];
  modalCopy.textContent = copy[1];
  demoForm.hidden = type === 'article' || type === 'case';
  $('.modal-success').hidden = true;
  modalBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
};
const closeModal = () => {
  modalBackdrop.hidden = true;
  document.body.style.overflow = '';
};
$$('[data-open-modal]').forEach((button) => button.addEventListener('click', () => openModal(button.dataset.openModal)));
$('.modal-close')?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', (event) => { if (event.target === modalBackdrop) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modalBackdrop.hidden) closeModal(); });
demoForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  demoForm.hidden = true;
  $('.modal-success').hidden = false;
  toast('تم حفظ طلب التواصل في النسخة التجريبية.');
});

$$('.faq-list details').forEach((detail) => detail.addEventListener('toggle', () => {
  if (detail.open) $$('.faq-list details').filter((other) => other !== detail).forEach((other) => { other.open = false; });
}));

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const caseForm = $('#case-analysis-form');
const caseText = $('#case-text');
const caseFile = $('#case-file');
const caseFileName = $('#case-file-name');
const caseResult = $('#case-result');
const analysisLoading = $('#analysis-loading');
const analysisOutput = $('#analysis-output');
const analyzeButton = $('#analyze-case-button');

caseFile?.addEventListener('change', async () => {
  const file = caseFile.files?.[0];
  if (!file) return;
  if (file.size > 60000) {
    caseFile.value = '';
    toast('الملف أكبر من الحد المسموح في نسخة العرض.');
    return;
  }
  const allowed = /\.(txt|md|json)$/i.test(file.name) || file.type === 'text/plain' || file.type === 'application/json';
  if (!allowed) {
    caseFile.value = '';
    toast('يمكن رفع ملفات TXT أو MD أو JSON فقط في هذه المرحلة.');
    return;
  }
  caseFileName.textContent = `تم اختيار: ${file.name}`;
  caseText.value = await file.text();
  toast('تم إدراج نص الملف داخل نموذج الدعوى.');
});

const bulletList = (items, empty = 'لا توجد ملاحظات كافية في المدخل الحالي.') => {
  if (!items?.length) return `<li class="empty-item">${empty}</li>`;
  return items.map((item) => {
    if (typeof item === 'string') return `<li>${escapeHTML(item)}</li>`;
    return `<li><b>${escapeHTML(item.point || item.title || '')}</b>${escapeHTML(item.reason || item.relevance || '')}</li>`;
  }).join('');
};

const renderAnalysis = (data, sources) => {
  const sourceMap = Object.fromEntries((sources || []).map((source) => [source.id, source]));
  const references = (data.legal_references || []).map((reference, index) => {
    const source = sourceMap[reference.source_id];
    if (!source) return '';
    return `<div class="source-reference"><span>${String(index + 1).padStart(2, '0')}</span><div><b>${escapeHTML(source.name)}</b><small>${escapeHTML(reference.relevance)}${reference.limitation ? ` · ${escapeHTML(reference.limitation)}` : ''}</small><a href="${escapeHTML(source.url)}" target="_blank" rel="noreferrer">فتح النص الرسمي ↗</a></div></div>`;
  }).join('') || '<p class="empty-item">لم يحدد التحليل مرجعًا كافيًا لهذه الوقائع.</p>';
  const precedents = (data.precedents || []).filter((precedent) => precedent.verified).map((precedent) => `<div class="source-reference"><span>ح</span><div><b>${escapeHTML(precedent.title)}</b><small>${escapeHTML(precedent.court_or_portal)} · ${escapeHTML(precedent.relevance)}</small><a href="${escapeHTML(precedent.url)}" target="_blank" rel="noreferrer">فتح الحكم/البوابة ↗</a></div></div>`).join('') || '<p class="empty-item">لم يُثبت التحليل حكمًا قضائيًا محددًا. استخدم بوابة وزارة العدل للبحث اليدوي والتحقق من رقم الحكم ووقائعه.</p>';
  analysisOutput.innerHTML = `<div class="analysis-topline"><div><span class="mini-label">تحليل بحثي أولي · راكان</span><h3>${escapeHTML(data.legal_issue || 'قراءة أولية للدعوى')}</h3></div><span class="confidence-badge">درجة الثقة: ${escapeHTML(data.confidence || 'منخفضة')}</span></div><p class="analysis-summary">${escapeHTML(data.case_summary || '')}</p><div class="result-box assessment-box"><h4>التقييم العملي للموقف</h4><p>${escapeHTML(data.assessment || 'لا يمكن ترجيح الموقف قبل استكمال الوقائع والمستندات.')}</p></div><div class="result-box strategy-box"><h4>الخطة القانونية المقترحة</h4><ol class="result-list">${bulletList(data.legal_strategy, 'استكمل المستندات ثم اطلب مراجعة مختص.')}</ol></div><div class="result-columns"><div class="result-box strengths"><h4>نقاط القوة المحتملة</h4><ul class="result-list">${bulletList(data.strengths)}</ul></div><div class="result-box weaknesses"><h4>نقاط الضعف والمخاطر</h4><ul class="result-list">${bulletList(data.weaknesses)}</ul></div></div><div class="result-box" style="margin-top:12px"><h4>الأنظمة والمراجع الرسمية</h4><div>${references}</div></div><div class="result-box" style="margin-top:12px"><h4>الأحكام أو السوابق القابلة للتحقق</h4><div>${precedents}</div></div><div class="result-columns"><div class="result-box"><h4>معلومات ناقصة</h4><ul class="result-list">${bulletList(data.missing_information, 'لم يحدد التحليل معلومات ناقصة.')}</ul></div><div class="result-box"><h4>خطوات تالية مقترحة</h4><ul class="result-list">${bulletList(data.next_steps, 'اطلب مراجعة مختص قبل اتخاذ الإجراء.')}</ul></div></div><div class="analysis-disclaimer"><b>تنبيه:</b> هذا تحليل بحثي مولد آليًا، لا يمثل حكمًا قضائيًا أو فتوى أو استشارة قانونية، ولا ينبغي الاعتماد عليه دون مراجعة النص الرسمي والمستندات ومحامٍ مرخص. ${(data.warnings || []).map(escapeHTML).join(' ')}</div>`;
  $('.result-empty', caseResult).hidden = true;
  analysisLoading.hidden = true;
  analysisOutput.hidden = false;
};

caseForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = caseText.value.trim();
  if (text.length < 40) {
    toast('أدخل وقائع الدعوى بتفصيل أكبر قبل التحليل.');
    caseText.focus();
    return;
  }
  analyzeButton.disabled = true;
  analyzeButton.innerHTML = 'جارٍ تحليل الدعوى <span>…</span>';
  $('.result-empty', caseResult).hidden = true;
  analysisOutput.hidden = true;
  analysisLoading.hidden = false;
  try {
    const response = await fetch('/api/analyze-case', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: $('#case-title').value.trim(), category: $('#case-category').value, text }), signal: AbortSignal.timeout(90000) });
    const payload = await response.json();
    if (!response.ok || payload.error) throw new Error(payload.error || 'تعذر إتمام التحليل.');
    renderAnalysis(payload.result, payload.sources);
    toast('اكتمل التحليل الأولي وربط المراجع الرسمية.');
    caseResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    analysisLoading.hidden = true;
    analysisOutput.innerHTML = `<div class="analysis-error"><b>تعذر إتمام التحليل.</b><br />${escapeHTML(error.message)}<br /><small>تأكد من تشغيل الخادم ثم أعد المحاولة. لم يتم حفظ نص الدعوى.</small></div>`;
    analysisOutput.hidden = false;
    toast('تعذر الاتصال بخدمة تحليل الدعوى.');
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.innerHTML = 'حلّل الدعوى بالمصادر الرسمية <span>←</span>';
  }
});
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
const additionalSystemsGrid = $('#additional-systems-grid');
fetch('/api/additional-systems').then((response) => response.json()).then(({ systems }) => {
  additionalSystemsGrid.innerHTML = systems.map((system, index) => `<article class="additional-system-card"><div class="law-meta"><span>${escapeHTML(system.category)}</span><b>${String(index + 13).padStart(2, '0')}</b></div><h3>${escapeHTML(system.name)}</h3><p>${escapeHTML(system.summary)}</p><div class="law-foot"><span>هيئة الخبراء · بحث رسمي</span><a class="official-link" href="${escapeHTML(system.url)}" target="_blank" rel="noreferrer">فتح النظام الرسمي ↗</a></div></article>`).join('');
}).catch(() => { additionalSystemsGrid.innerHTML = '<div class="precedent-loading">تعذر تحميل الحزمة. استخدم فهرس هيئة الخبراء الرسمي.</div>'; });

// Office workspace mode: a safe demo shell inspired by the supplied office-management flow.
const officeAuth = $('#office-auth');
const officeWorkspace = $('#office-workspace');
const enterOffice = () => {
  officeAuth?.setAttribute('hidden', '');
  if (officeWorkspace) officeWorkspace.hidden = false;
  document.body.classList.add('office-entered');
  officeWorkspace?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('مرحبًا بك في مساحة مكتب راكان التجريبية.');
};
$('#office-demo')?.addEventListener('click', enterOffice);
$('#office-login-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  enterOffice();
});
$('#office-logout')?.addEventListener('click', () => {
  officeWorkspace.hidden = true;
  officeAuth?.removeAttribute('hidden');
  document.body.classList.remove('office-entered');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('تم تسجيل الخروج من النسخة التجريبية.');
});
$$('.office-nav-item').forEach((item) => item.addEventListener('click', () => {
  $$('.office-nav-item').forEach((navItem) => navItem.classList.remove('active'));
  item.classList.add('active');
  const labels = { dashboard: 'صباح الخير، راكان', cases: 'القضايا والملفات', clients: 'الموكلون والأطراف', sessions: 'الجلسات والمواعيد', tasks: 'المهام المفتوحة', library: 'مكتبة الأنظمة', reports: 'التقارير' };
  const title = $('#office-view-title');
  if (title) title.textContent = labels[item.dataset.officeView] || 'مساحة مكتب راكان';
  if (item.dataset.officeView !== 'dashboard') toast(`قسم «${labels[item.dataset.officeView]}» جاهز للربط بقاعدة بيانات المكتب.`);
}));
$$('[data-office-view]').filter((item) => item.tagName === 'BUTTON' && !item.classList.contains('office-nav-item')).forEach((item) => item.addEventListener('click', () => toast('هذه نسخة عرضية؛ سيتم فتح القسم عند ربط قاعدة البيانات.')));
$$('[data-office-action]').forEach((item) => item.addEventListener('click', () => toast('تم فتح نموذج العرض. يمكن ربط الحفظ الفعلي بقاعدة البيانات لاحقًا.')));
