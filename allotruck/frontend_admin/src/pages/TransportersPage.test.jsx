import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import TransportersPage from './TransportersPage';
import { listTransporters, verifyTransporter } from '../api/admin';

vi.mock('../api/admin', () => ({
  listTransporters: vi.fn(),
  verifyTransporter: vi.fn(),
}));

const PENDING = {
  id: 't-1',
  companyName: 'Est Fret Constantine',
  city: 'Constantine',
  verificationStatus: 'PENDING',
  createdAt: '2026-08-01T10:00:00.000Z',
  user: { id: 'u-1', fullName: 'Amine Bouzid', email: 'estfret@allotruck.dz', phone: '+213662222223' },
  documents: [{ id: 'd-1', type: 'RC', originalName: 'rc.png', mimeType: 'image/png', sizeBytes: 1000 }],
  _count: { trucks: 1, trips: 0, missions: 0 },
};

function page(items) {
  return { items, total: items.length, page: 1, limit: 20, pages: 1 };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TransportersPage />
    </MemoryRouter>
  );
}

async function openRejectModal() {
  const user = userEvent.setup();
  renderPage();
  await screen.findByText('Est Fret Constantine');
  await user.click(screen.getByRole('button', { name: /refuser/i }));
  return user;
}

describe('TransportersPage', () => {
  it('affiche la file de moderation', async () => {
    listTransporters.mockResolvedValue(page([PENDING]));
    renderPage();

    expect(await screen.findByText('Est Fret Constantine')).toBeInTheDocument();
    expect(screen.getByText('estfret@allotruck.dz')).toBeInTheDocument();
  });

  it("affiche un etat vide quand la file est vide", async () => {
    listTransporters.mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText('Aucun transporteur', { selector: '.empty__title' })).toBeInTheDocument();
  });

  it("affiche l'erreur quand l'API echoue", async () => {
    listTransporters.mockRejectedValue(new Error("Impossible de joindre l'API."));
    renderPage();

    expect(await screen.findByText(/impossible de joindre l'api/i)).toBeInTheDocument();
  });

  it('valide un dossier sans motif', async () => {
    listTransporters.mockResolvedValue(page([PENDING]));
    verifyTransporter.mockResolvedValue({ ...PENDING, verificationStatus: 'VERIFIED' });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Est Fret Constantine');
    await user.click(screen.getByRole('button', { name: /vérifier|verifier/i }));

    await waitFor(() =>
      expect(verifyTransporter).toHaveBeenCalledWith({
        transporterId: 't-1',
        status: 'VERIFIED',
        reason: undefined,
      })
    );
  });

  // Le serveur renvoie 400 sans motif : la modale doit l'imposer avant l'appel,
  // sinon l'administrateur recoit une erreur brute sans savoir quoi corriger.
  it("refuse d'envoyer un refus sans motif", async () => {
    listTransporters.mockResolvedValue(page([PENDING]));
    const user = await openRejectModal();

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /confirmer le refus/i }));

    expect(await screen.findByText(/motif est obligatoire/i)).toBeInTheDocument();
    expect(verifyTransporter).not.toHaveBeenCalled();
  });

  it("refuse egalement un motif fait uniquement d'espaces", async () => {
    listTransporters.mockResolvedValue(page([PENDING]));
    const user = await openRejectModal();

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/motif/i), '    ');
    await user.click(within(dialog).getByRole('button', { name: /confirmer le refus/i }));

    expect(await screen.findByText(/motif est obligatoire/i)).toBeInTheDocument();
    expect(verifyTransporter).not.toHaveBeenCalled();
  });

  it('transmet le motif saisi au serveur', async () => {
    listTransporters.mockResolvedValue(page([PENDING]));
    verifyTransporter.mockResolvedValue({ ...PENDING, verificationStatus: 'REJECTED' });

    const user = await openRejectModal();
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/motif/i), '  Registre de commerce illisible  ');
    await user.click(within(dialog).getByRole('button', { name: /confirmer le refus/i }));

    await waitFor(() =>
      expect(verifyTransporter).toHaveBeenCalledWith({
        transporterId: 't-1',
        status: 'REJECTED',
        reason: 'Registre de commerce illisible',
      })
    );
  });
});
