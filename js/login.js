/* ============================================
   login.js — Login screen
   ============================================ */

const Login = (() => {
  function init() {
    const screen = document.getElementById('screen-login');
    screen.innerHTML = `
      <h1 class="login-title">Request A Treat 🍰</h1>
      <p class="login-subtitle">Cassie's homemade desserts, just for you!</p>
      <div class="card login-card">
        <img src="images/pup-password.png" alt="Pup with TREATS sign" class="pup-image pup-password">
        <div class="login-input-group">
          <input type="password" id="login-password" placeholder="Type the secret word... 🤫" autocomplete="off">
        </div>
        <button class="btn btn-primary" id="login-btn">Let's Go! 🍰</button>
        <div class="login-error" id="login-error"></div>
      </div>
    `;

    const input = document.getElementById('login-password');
    const btn = document.getElementById('login-btn');
    const error = document.getElementById('login-error');

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });

    function attempt() {
      if (input.value.toLowerCase().trim() === 'treats') {
        Names.init();
        showScreen('names');
      } else {
        error.textContent = "Hmm, that's not it! Try again 🍪";
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
        input.value = '';
        input.focus();
      }
    }
  }

  return { init };
})();
