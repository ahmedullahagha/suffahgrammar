document.getElementById('contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const field = (id) => document.getElementById(id).value.trim();
  const body = `Name: ${field('cf-name')}\nEmail: ${field('cf-email')}\n\n${field('cf-message')}`;
  window.location.href = 'mailto:contact@suffahgrammar.com?subject=' + encodeURIComponent(field('cf-subject')) + '&body=' + encodeURIComponent(body);
  document.getElementById('email-status').textContent = 'If your email app did not open, email contact@suffahgrammar.com directly. Your message is sent only when you press Send in your email app.';
});
