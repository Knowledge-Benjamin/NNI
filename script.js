// Configuration: change launchDate to your real launch date (YYYY, M-1, D, H, m, s)
const launchDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // default 30 days from now

function updateCountdown() {
  const now = new Date();
  const diff = Math.max(0, launchDate - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById('days').textContent = days;
  document.getElementById('hours').textContent = String(hours).padStart(2,'0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2,'0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2,'0');
}

// Email subscribe handling (front-end only)
const form = document.getElementById('subscribeForm');
const emailInput = document.getElementById('email');
const message = document.getElementById('message');
const yearEl = document.getElementById('year');

yearEl.textContent = new Date().getFullYear();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  if(!validateEmail(email)){
    showMessage('Please enter a valid email address.', true);
    emailInput.focus();
    return;
  }
  // Simulate a network request. Replace with real API call when ready.
  try {
    saveEmail(email);
    showMessage('Thanks — we’ll let you know!', false);
    form.reset();
  } catch (err) {
    showMessage('Something went wrong. Try again later.', true);
  }
});

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(txt, isError){
  message.textContent = txt;
  message.style.color = isError ? '#ffb4b4' : '#b7f3d0';
}

function saveEmail(email){
  // save to localStorage as a temporary queue. Replace with POST to backend.
  const key = 'nni_subscribers_v1';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  if(!list.includes(email)) list.push(email);
  localStorage.setItem(key, JSON.stringify(list));
}

// Init countdown
updateCountdown();
setInterval(updateCountdown, 1000);

// Accessibility: focus outline for keyboard users
(function(){
  function handleFirstTab(e) {
    if (e.key === 'Tab') document.body.classList.add('user-is-tabbing');
    window.removeEventListener('keydown', handleFirstTab);
  }
  window.addEventListener('keydown', handleFirstTab);
})();
