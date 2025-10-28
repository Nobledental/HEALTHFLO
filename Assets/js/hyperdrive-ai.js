/*
  HealthFlo HYPERDRIVE v12 — FREE‑AI+++ (client‑side only)
  - Transformers.js pipelines (embeddings, QA, sentiment) via CDN (no keys)
  - Voice in/out: Web Speech API when available
  - Lightweight RAG over visible page text
  - Demo generators for pre‑auth checklist & denial rebuttal
*/
(function(){
  const doc = document;
  const $ = (s, r = doc) => r.querySelector(s);
  const thread = $('.copilot-thread');
  const input = $('.copilot-input');
  const btnMic = $('.copilot-mic');
  const useLocal = $('#copilot-local-ai');
  const useEmbed = $('#copilot-embeddings');

  // ---- Voice (speech-to-text + text-to-speech)
  let rec; try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = false;
      btnMic?.addEventListener('click', () => { rec.start(); say('Listening'); });
      rec.addEventListener('result', (e) => {
        const text = Array.from(e.results).map(r => r[0].transcript).join(' ');
        add('user', text);
        ask(text);
      });
    } else {
      btnMic?.setAttribute('disabled','');
    }
  } catch {}

  function say(text){
    try { const u = new SpeechSynthesisUtterance(text); u.lang = 'en-IN'; speechSynthesis.speak(u); } catch {}
  }

  // ---- Page text collector for RAG
  function pageText(){
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        if (!n.nodeValue) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement; if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest('#hf-copilot')) return NodeFilter.FILTER_REJECT;
        if (p.matches('[aria-hidden="true"], [hidden]')) return NodeFilter.FILTER_REJECT;
        if (p.closest('[data-skip-rag]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const chunks = [];
    while (walker.nextNode()){
      const t = walker.currentNode.nodeValue.replace(/\s+/g, ' ').trim();
      if (t.length > 60) chunks.push(t);
    }
    return chunks.join('\n');
  }

  // ---- Transformers.js
  const HF = window.transformers;
  let embedder = null, qa = null, sentiment = null;

  async function ensurePipelines(){
    if (!HF) return null;
    if (!embedder && useEmbed?.checked) {
      embedder = await HF.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    if (!qa) {
      qa = await HF.pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad');
    }
    if (!sentiment) {
      sentiment = await HF.pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    }
    return { embedder, qa, sentiment };
  }

  // ---- Simple nearest-neighbour retrieval using embeddings
  async function retrieve(query){
    const text = pageText();
    const passages = text.split(/(?<=[.!?])\s+/).filter(s => s && s.length > 50).slice(0, 800);
    if (!embedder) return passages.slice(0, 12);
    const qv = await embedder(query, { pooling: 'mean', normalize: true });
    const qvec = Array.from(qv.data);
    const top = [];
    for (const p of passages){
      const pv = await embedder(p, { pooling: 'mean', normalize: true });
      const pvec = Array.from(pv.data);
      const sim = cosine(qvec, pvec);
      if (top.length < 10) top.push({ sim, p });
      else { top.sort((a,b)=>a.sim-b.sim); if (sim > top[0].sim) top[0] = { sim, p }; }
    }
    return top.sort((a,b)=>b.sim-a.sim).map(t=>t.p);
  }
  function cosine(a,b){ let s=0; for (let i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }

  // ---- QA orchestrator
  async function answer(q){
    try {
      await ensurePipelines();
      const contextParts = useEmbed?.checked ? await retrieve(q) : [pageText()];
      const context = contextParts.join('\n\n');
      const res = await qa({ question: q, context });
      let tag = '';
      try { const s = await sentiment(res.answer); tag = s?.[0]?.label === 'POSITIVE' ? ' ✅' : (s?.[0]?.label ? ` [${s[0].label}]` : ''); } catch {}
      return `${res.answer}${tag}`;
    } catch (err) {
      console.warn('AI failed, fallback rules used', err);
      return ruleFallback(q);
    }
  }

  // ---- Rule fallback (no models required)
  function ruleFallback(q){
    const t = q.toLowerCase();
    if (/cashless|pre-?auth|authorization/.test(t)) return 'Cashless Anywhere™: Share patient ID, policy & doctor advice. We pre-auth in ~30–90 mins (TPA dependent) and handle docs end-to-end. Want a checklist?';
    if (/denial|recovery|arrears|aging/.test(t)) return 'Denial Recovery: We triage by payer code & remark, auto-generate rebuttals, and escalate per SLA. Typical uplift: 8–15%. Want a sample rebuttal?';
    if (/empanel|panel|onboard|network/.test(t)) return 'Empanelment: We prepare forms, package tariffs, and compliance docs for each insurer/TPA. Average panel add: 2–6 weeks.';
    if (/package|price|tariff|estimate|cost/.test(t)) return 'Packages: Enter procedure + city → instant baseline, payer variance & inclusions. Finance options available (0% EMI).';
    if (/hello|hi|help|support|how/.test(t)) return 'Hi! Ask me about cashless, tariffs, denials, empanelment, or patient flows. I can also summarize this page.';
    return 'I couldn’t infer that yet. Try rephrasing or enable “Use embeddings” for a smarter lookup.';
  }

  // ---- Wire to Copilot events from core
  doc.addEventListener('hf:copilot:ask', async (e) => {
    const q = e.detail.q;
    add('assistant', 'Thinking…');
    const out = useLocal?.checked ? await answer(q) : ruleFallback(q);
    replaceLast(out);
    try { say(out); } catch {}
  });

  // ---- Render helpers
  function add(role, text){
    const el = doc.createElement('div');
    el.className = `msg msg-${role}`;
    el.textContent = text;
    thread.appendChild(el);
    thread.scrollTop = thread.scrollHeight;
  }
  function replaceLast(text){
    const last = thread.lastElementChild; if (!last) return add('assistant', text);
    last.textContent = text; thread.scrollTop = thread.scrollHeight;
  }

  // ---- Demo generators (no keys; local rules)
  const preBtn = $('#preauth-generate');
  const preOut = $('#preauth-output');
  const denialBtn = $('#denial-generate');
  const denialOut = $('#denial-output');

  preBtn?.addEventListener('click', () => {
    const proc = ($('#proc')?.value || 'Procedure').trim();
    const payer = ($('#payer')?.value || 'Payer/TPA').trim();
    const list = preauthChecklist(proc, payer);
    preOut.innerHTML = `<ol>${list.map(li=>`<li>${li}</li>`).join('')}</ol>`;
  });

  denialBtn?.addEventListener('click', () => {
    const remark = ($('#denial')?.value || '').trim();
    const draft = denialRebuttal(remark);
    denialOut.innerHTML = `<div class="reb">
      <p><strong>Summary</strong>: ${draft.summary}</p>
      <p><strong>Root cause</strong>: ${draft.root}</p>
      <p><strong>Attachments</strong>: ${draft.attachments.join(', ') || '—'}</p>
      <p><strong>Rebuttal points</strong>:</p>
      <ol>${draft.points.map(p=>`<li>${p}</li>`).join('')}</ol>
    </div>`;
  });

  function preauthChecklist(proc, payer){
    const base = [
      'Doctor’s advice / treatment plan',
      'Clinical notes & diagnosis',
      'Relevant investigation reports (lab / radiology)',
      'Patient ID (Aadhaar/PAN) & Insurance card',
      'Policy number & validity',
      'Treating consultant & speciality',
      'Estimated package / cost & length of stay',
      'Past medical / surgical history (if relevant)',
      'KYC & consent forms'
    ];
    const payerAdds = (/mediassist|fhpl|health india/i.test(payer)) ? ['Payer‑specific pre‑auth template'] : [];
    const procAdds = (/laparoscopic|cardiac|joint|neuro/i.test(proc)) ? ['Procedure‑specific imaging & anaesthesia evaluation'] : [];
    return [...base, ...payerAdds, ...procAdds];
  }

  function denialRebuttal(remark){
    const t = (remark || '').toLowerCase();
    const common = {
      summary: 'Request reconsideration with appended documentation and clarifications. Patient eligible per policy; services medically necessary.',
      root: 'Documentation gaps and/or pre‑auth variance addressed in attachments.',
      attachments: [ 'Consultation notes', 'Investigation reports', 'Pre‑auth / intimation proof', 'Discharge summary', 'Invoices & receipts' ],
      points: [
        'Policy eligibility & waiting periods validated; clause references attached.',
        'Medical necessity established with guideline references.',
        'Coding corrections applied (ICD/PCS/HCPCS) if applicable.',
        'All missing reports appended; signatures & stamps present.',
        'Request adjudication per SLA; contact POC provided.'
      ]
    };

    if (/pre.?auth/.test(t)) common.points.unshift('Pre‑auth obtained; attach approval ref. If not, intimation submitted with timestamp.');
    if (/missing|report|document/.test(t)) common.points.unshift('All listed documents appended; checklist cross‑verified.');
    if (/exclusion|waiting/.test(t)) common.points.unshift('Policy clause interpretation clarified; exception justification attached.');

    return common;
  }
})();
