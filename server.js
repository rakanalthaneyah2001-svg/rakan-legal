import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { officialPrecedents } from './precedents-data.js';
import { additionalSystems } from './additional-systems.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const apiBase = process.env.MANUS_API_URL;
const apiKey = process.env.MANUS_API_KEY;

const officialSources = [
  { id: 'civil', name: 'نظام المعاملات المدنية', category: 'مدني', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/655fdb42-8c96-422b-b8c4-b04f0095c94c/1', summary: 'الالتزامات والعقود والضرر والتعويض والحقوق الشخصية والعينية.' },
  { id: 'companies', name: 'نظام الشركات', category: 'تجاري', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/a8376aea-1bc3-49d4-9027-aed900b555af/1', summary: 'تأسيس الشركات وإدارتها وتحولها وانقضائها.' },
  { id: 'labor', name: 'نظام العمل', category: 'عمالي', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/08381293-6388-48e2-8ad2-a9a700f2aa94/1', summary: 'التوظيف والتدريب وعلاقات العمل وشروطه وحقوق أطرافه.' },
  { id: 'evidence', name: 'نظام الإثبات', category: 'إثبات', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/2716057c-c097-4bad-8e1e-ae1400c678d5/1', summary: 'الإقرار واستجواب الخصوم والمحررات الرسمية والعادية وطرق الإثبات.' },
  { id: 'commercial-courts', name: 'نظام المحاكم التجارية', category: 'إجرائي', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/38334008-3b70-4c6c-b3af-aba3016a8061/1', summary: 'اختصاص المحكمة التجارية والقواعد العامة للدعاوى التجارية.' },
  { id: 'execution', name: 'نظام التنفيذ', category: 'إجرائي', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/67dd54bc-c33a-48c8-8356-b44700a9ab55/1', summary: 'السند التنفيذي وإجراءات التنفيذ والإفصاح عن الأموال والحجز.' },
  { id: 'law-practice', name: 'نظام المحاماة', category: 'مهني', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/f42655be-79b0-4fd4-bb90-a9a700f26a3e/1', summary: 'تعريف مهنة المحاماة وشروط مزاولتها وحقوق وواجبات المحامين.' },
  { id: 'notarization', name: 'نظام التوثيق', category: 'توثيق', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/40754577-f250-47f6-8a5a-abf600af7d72/1', summary: 'إجراءات إثبات الحقوق وتوثيق العقود والإقرارات واختصاصات الموثقين.' },
  { id: 'civil-procedure', name: 'نظام المرافعات الشرعية', category: 'إجرائي', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/f0eaae46-9f84-40ee-815e-a9a700f268b3/1', summary: 'رفع الدعوى والتبليغ والجلسات والإثبات والأحكام وطرق الاعتراض.' },
  { id: 'cybercrime', name: 'نظام مكافحة جرائم المعلوماتية', category: 'رقمي', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/25df73d6-0f49-4dc5-b010-a9a700f2ec1d/1', summary: 'التعريف بالجرائم المعلوماتية والأفعال المحظورة والعقوبات.' },
  { id: 'ecommerce', name: 'نظام التجارة الإلكترونية', category: 'تجاري', url: 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/360de590-0286-4fa5-a243-aa9100c31979/1', summary: 'نشاط التجارة الإلكترونية وحقوق المستهلك والتزامات موفر الخدمة.' },
  { id: 'personal-data', name: 'نظام حماية البيانات الشخصية', category: 'بيانات', url: 'https://laws.boe.gov.sa/boelaws/laws/lawdetails/b7cfae89-828e-4994-b167-adaa00e37188/1', summary: 'حقوق صاحب البيانات وضوابط جمع ومعالجة البيانات والإفصاح عنها.' },
  { id: 'judgments-portal', name: 'البوابة القانونية لوزارة العدل', category: 'أحكام قضائية', url: 'https://laws.moj.gov.sa/', summary: 'بوابة رسمية للأنظمة العدلية والأحكام القضائية المنشورة. لا تُذكر سابقة محددة إلا إذا أمكن التحقق من بياناتها.' }
];
officialSources.push(...additionalSystems);

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const sendJson = (res, status, payload) => { res.writeHead(status, jsonHeaders); res.end(JSON.stringify(payload)); };

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 90000) { reject(new Error('حجم الدعوى أكبر من الحد المسموح.')); req.destroy(); }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const schema = {
  type: 'object',
  properties: {
    case_summary: { type: 'string' },
    legal_issue: { type: 'string' },
    assessment: { type: 'string' },
    legal_strategy: { type: 'array', items: { type: 'string' } },
    strengths: { type: 'array', items: { type: 'object', properties: { point: { type: 'string' }, reason: { type: 'string' }, source_ids: { type: 'array', items: { type: 'string' } } }, required: ['point', 'reason', 'source_ids'], additionalProperties: false } },
    weaknesses: { type: 'array', items: { type: 'object', properties: { point: { type: 'string' }, reason: { type: 'string' }, source_ids: { type: 'array', items: { type: 'string' } } }, required: ['point', 'reason', 'source_ids'], additionalProperties: false } },
    legal_references: { type: 'array', items: { type: 'object', properties: { source_id: { type: 'string' }, relevance: { type: 'string' }, limitation: { type: 'string' } }, required: ['source_id', 'relevance', 'limitation'], additionalProperties: false } },
    precedents: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, court_or_portal: { type: 'string' }, relevance: { type: 'string' }, url: { type: 'string' }, verified: { type: 'boolean' } }, required: ['title', 'court_or_portal', 'relevance', 'url', 'verified'], additionalProperties: false } },
    missing_information: { type: 'array', items: { type: 'string' } },
    next_steps: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['منخفضة', 'متوسطة', 'مرتفعة'] },
    warnings: { type: 'array', items: { type: 'string' } }
  },
  required: ['case_summary', 'legal_issue', 'assessment', 'legal_strategy', 'strengths', 'weaknesses', 'legal_references', 'precedents', 'missing_information', 'next_steps', 'confidence', 'warnings'],
  additionalProperties: false
};

function extractJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('لم يرجع التحليل في صيغة منظمة.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function analyzeCase(input) {
  if (!apiBase || !apiKey) throw new Error('خدمة التحليل غير مهيأة في الخادم.');
  const sourceText = officialSources.map(source => `${source.id} | ${source.name} | ${source.category} | ${source.summary} | ${source.url}`).join('\n');
  const system = `أنت مساعد بحث قانوني متخصص في الأنظمة السعودية. حلل الدعوى كمذكرة بحث أولية باللغة العربية، وقدم تقييماً عملياً للموقف وخطة قانونية مرتبة، ولا تدّعِ أنك تحل القضية بحكم ملزم ولا تقدم تمثيلاً أو مشورة نهائية. لا تختلق مواد أو أرقام أحكام أو سوابق أو روابط. استخدم فقط قائمة المصادر التي يرسلها النظام. إذا لم تكفِ المصادر، اذكر أن المعلومات غير كافية. لا تعتبر البوابة القانونية لوزارة العدل سابقة قضائية محددة؛ استخدمها فقط للإشارة إلى مكان البحث، وضع verified=false ما لم يرد في مدخلات المستخدم حكم محدد قابل للتحقق. اربط كل نقطة مصدرية بمعرف source_id من القائمة. يجب أن تكون الإجابة JSON فقط وفق المخطط التالي: ${JSON.stringify(schema)}\n\nالمصادر الرسمية المتاحة:\n${sourceText}`;
  const user = `عنوان الدعوى: ${input.title || 'غير محدد'}\nتصنيفها المختار: ${input.category || 'غير محدد'}\nنص الدعوى ووقائعها كما أدخلها المستخدم:\n${input.text}`;
  const response = await fetch(`${apiBase}/v1/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_completion_tokens: 3200,
      reasoning: { effort: 'low' },
      response_format: { type: 'json_schema', json_schema: { name: 'saudi_legal_case_analysis', strict: true, schema } }
    })
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error?.message || 'تعذر الاتصال بخدمة التحليل.');
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('لم تصل نتيجة تحليل قابلة للعرض.');
  return extractJson(content);
}

function safePath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split('?')[0]);
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = path.normalize(path.join(__dirname, requested));
  return file.startsWith(__dirname) ? file : null;
}

function serveStatic(req, res, urlPath) {
  const file = safePath(urlPath);
  if (!file) return sendJson(res, 403, { error: 'مسار غير مسموح.' });
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return sendJson(res, 404, { error: 'الصفحة غير موجودة.' });
    const ext = path.extname(file);
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'POST' && parsed.pathname === '/api/analyze-case') {
    try {
      const input = JSON.parse(await readBody(req));
      if (!input.text || input.text.trim().length < 40) return sendJson(res, 400, { error: 'أدخل وقائع الدعوى بتفصيل لا يقل عن 40 حرفًا.' });
      const result = await analyzeCase({ title: String(input.title || '').slice(0, 180), category: String(input.category || '').slice(0, 80), text: String(input.text).slice(0, 60000) });
      return sendJson(res, 200, { result, sources: officialSources });
    } catch (error) {
      console.error('[analysis]', error.message);
      return sendJson(res, 500, { error: error.message || 'تعذر إتمام التحليل.' });
    }
  }
  if (req.method === 'GET' && parsed.pathname === '/api/sources') return sendJson(res, 200, { sources: officialSources });
  if (req.method === 'GET' && parsed.pathname === '/api/additional-systems') return sendJson(res, 200, { systems: additionalSystems });
  if (req.method === 'GET' && parsed.pathname === '/api/precedents') return sendJson(res, 200, { precedents: officialPrecedents, portal: 'https://laws.moj.gov.sa/ar/JudicialDecisionsList/0?pageNumber=1&pageSize=12&viewType=grid&sortingBy=2' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'الطريقة غير مدعومة.' });
  return serveStatic(req, res, parsed.pathname);
});

server.listen(port, '0.0.0.0', () => console.log(`Rakan server listening on 0.0.0.0:${port}`));
