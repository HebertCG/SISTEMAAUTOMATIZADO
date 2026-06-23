import { sb } from './supabase.js';
import { $ } from './ui.js';

// Conecta el formulario de login y el botón de cerrar sesión.
// `onAuthChange(estaLogueado)` se llama cada vez que cambia la sesión.
export function setupAuth(onAuthChange) {
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginError').textContent = '';
    $('loginBtn').disabled = true;
    $('loginBtn').textContent = 'Ingresando…';

    const { error } = await sb.auth.signInWithPassword({
      email: $('email').value.trim(),
      password: $('password').value,
    });

    $('loginBtn').disabled = false;
    $('loginBtn').textContent = 'Ingresar';
    if (error) {
      $('loginError').textContent = 'Correo o contraseña incorrectos.';
      return;
    }
    onAuthChange(true);
  });

  $('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    onAuthChange(false);
  });
}

// Indica si hay una sesión activa al cargar la página.
export async function haySesion() {
  const { data } = await sb.auth.getSession();
  return Boolean(data.session);
}
