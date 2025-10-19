(function () {
  const DEPT_EMAILS = {
    'Hospitals - Empanelment & Support': 'network_hospital@healthflo.in',
    'Customer Support': 'support@healthflo.in',
    'IT Support': 'it_support@healthflo.in',
    'Audit Team': 'teams_audit@healthflo.in',
    'Research & Development': 'research_development@healthflo.in',
    'Patient Protect': 'protect360@healthflo.in',
    'HR Support': 'hr_support@healthflo.in',
    'POSH Committee': 'posh@healthflo.in',
    Scrutiny: 'scrutiny@healthflo.in',
    'Stakeholders Relationship Committee': 'stake-holders-relationship-committee@healthflo.in',
    Info: 'info@healthflo.in',
    'Claims - Cashless': 'claims_cashless@healthflo.in',
    'Claims - Fetching': 'claims_fetching@healthflo.in',
    'Claims Portal': 'claims_portal@healthflo.in',
    'Claims Reimbursement': 'claims_reimbursement@healthflo.in',
    'Classroom & Training': 'classroom_teachers@healthflo.in',
    'Audit & Scrutiny': 'scrutiny@healthflo.in',
    'Townhall': 'townhall@healthflo.in',
    'Stakeholder Relations': 'stake-holders-relationship-committee@healthflo.in',
    'Quorum': 'quorum@healthflo.in',
    'Test Mail': 'testmail@healthflo.in',
    'Info Desk': 'info@healthflo.in',
    'General Support': 'support@healthflo.in'
  };

  function updateDeptEmail(selectEl) {
    const form = selectEl.closest('form');
    if (!form) return;
    const hidden = form.querySelector('[data-dept-target]');
    if (!hidden) return;
    const chosen = DEPT_EMAILS[selectEl.value] || 'network_hospital@healthflo.in';
    hidden.value = chosen;
  }

  document.querySelectorAll('[data-department-select]').forEach((select) => {
    updateDeptEmail(select);
    select.addEventListener('change', () => updateDeptEmail(select));
  });

  document.querySelectorAll('form[data-netlify="true"]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (!form.checkValidity()) return;
      event.preventDefault();
      const formData = new FormData(form);
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      })
        .then(() => {
          form.reset();
          form.querySelectorAll('[data-department-select]').forEach(updateDeptEmail);
          alert('Thanks! Our team will get back shortly.');
        })
        .catch(() => {
          const email = form.querySelector('[data-dept-target]')?.value || 'info@healthflo.in';
          window.location.href = `mailto:${email}`;
        });
    });
  });
})();
