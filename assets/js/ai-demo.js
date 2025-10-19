(function () {
  const tabButtons = document.querySelectorAll('.ai-tabs__tab');
  const panels = document.querySelectorAll('.ai-panel');
  const promptChips = document.querySelectorAll('.prompt-chip');

  function activateTab(id) {
    tabButtons.forEach((btn) => {
      const isActive = btn.id === id;
      btn.setAttribute('aria-selected', isActive);
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) {
        if (isActive) {
          panel.hidden = false;
          panel.classList.add('is-active');
        } else {
          panel.hidden = true;
          panel.classList.remove('is-active');
        }
      }
    });
    updateContactDepartment();
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.id));
    btn.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const index = Array.from(tabButtons).indexOf(btn);
        const dir = event.key === 'ArrowRight' ? 1 : -1;
        let next = (index + dir + tabButtons.length) % tabButtons.length;
        tabButtons[next].focus();
        activateTab(tabButtons[next].id);
      }
    });
  });

  function typewriter(messageEl) {
    const text = messageEl.dataset.generated;
    if (!text) return;
    messageEl.textContent = '';
    let index = 0;
    function step() {
      messageEl.textContent += text[index];
      index += 1;
      if (index < text.length) {
        setTimeout(step, 20);
      }
    }
    step();
  }

  document.querySelectorAll('[data-typewriter] p').forEach((para) => {
    if (!para.dataset.generated) {
      para.dataset.generated = para.textContent.trim();
    }
    para.textContent = '';
    typewriter(para);
  });

  promptChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const panel = chip.closest('.ai-panel');
      if (!panel) return;
      const chat = panel.querySelector('.ai-chat');
      if (!chat) return;
      const botMessage = document.createElement('div');
      botMessage.className = 'ai-chat__message ai-chat__message--bot';
      const label = document.createElement('span');
      label.className = 'ai-chat__label';
      label.textContent = 'HF Assistant';
      const para = document.createElement('p');
      const response = `Processing “${chip.dataset.message}”. I’ll share cited guidance based on policy docs.`;
      para.dataset.generated = response;
      para.textContent = '';
      botMessage.append(label, para);
      chat.appendChild(botMessage);
      chat.scrollTop = chat.scrollHeight;
      typewriter(para);
    });
  });

  // Contact modal integration
  const contactTrigger = document.querySelector('[data-contact-modal]');
  function updateContactDepartment() {
    if (!contactTrigger) return;
    const activeTab = document.querySelector('.ai-tabs__tab[aria-selected="true"]');
    const dept = activeTab && activeTab.id === 'ai-tab-hospital' ? 'Hospitals - Empanelment & Support' : 'Customer Support';
    contactTrigger.setAttribute('data-department', dept);
  }
  updateContactDepartment();
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      updateContactDepartment();
    });
  });
  if (contactTrigger) {
    panels.forEach((panel) => {
      panel.addEventListener('focusin', (event) => {
        const select = event.target.closest('[data-department-select]');
        return select;
      });
    });
  }
})();
