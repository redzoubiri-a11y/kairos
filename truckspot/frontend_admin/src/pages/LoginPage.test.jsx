import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import LoginPage from './LoginPage';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/auth', () => ({ login: vi.fn(), fetchMe: vi.fn() }));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

async function submit(email, password) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/adresse e-mail/i), email);
  await user.type(screen.getByLabelText(/mot de passe/i), password);
  await user.click(screen.getByRole('button', { name: /se connecter/i }));
}

describe('LoginPage', () => {
  it('ouvre la session pour un administrateur', async () => {
    login.mockResolvedValue({
      token: 'jeton-admin',
      user: { id: 'u1', fullName: 'Admin TruckSpot', role: 'ADMIN' },
    });

    renderLogin();
    await submit('admin@truckspot.dz', 'Password123!');

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('jeton-admin');
    });
    expect(useAuthStore.getState().user.role).toBe('ADMIN');
  });

  // Le serveur accepte volontairement la connexion d'un client : c'est bien
  // cette garde cote console qui empeche l'acces, elle n'est pas decorative.
  it("refuse un compte non administrateur et ne stocke aucun jeton", async () => {
    login.mockResolvedValue({
      token: 'jeton-client',
      user: { id: 'u2', fullName: 'Karim Belkacem', role: 'CLIENT' },
    });

    renderLogin();
    await submit('client@truckspot.dz', 'Password123!');

    expect(await screen.findByText(/reservee aux administrateurs|réservée aux administrateurs/i)).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem('truckspot-admin-auth')).not.toContain('jeton-client');
  });

  it('refuse egalement un transporteur', async () => {
    login.mockResolvedValue({
      token: 'jeton-transporteur',
      user: { id: 'u3', fullName: 'Yacine Meddah', role: 'TRANSPORTER' },
    });

    renderLogin();
    await submit('transporteur@truckspot.dz', 'Password123!');

    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
  });

  it("affiche le message d'erreur renvoye par l'API", async () => {
    login.mockRejectedValue(new Error('Email ou mot de passe incorrect'));

    renderLogin();
    await submit('admin@truckspot.dz', 'mauvais');

    expect(await screen.findByText('Email ou mot de passe incorrect')).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('desactive la soumission tant que les deux champs ne sont pas remplis', async () => {
    const user = userEvent.setup();
    renderLogin();

    const button = screen.getByRole('button', { name: /se connecter/i });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'admin@truckspot.dz');
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/mot de passe/i), 'Password123!');
    expect(button).toBeEnabled();
  });
});
