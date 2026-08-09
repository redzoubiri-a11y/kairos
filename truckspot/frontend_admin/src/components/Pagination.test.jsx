import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Pagination from './Pagination';

describe('Pagination', () => {
  it('decrit la tranche affichee', () => {
    render(<Pagination page={2} pages={5} total={95} limit={20} onPageChange={() => {}} />);
    expect(screen.getByText('21–40 sur 95 éléments')).toBeInTheDocument();
    expect(screen.getByText('Page 2 / 5')).toBeInTheDocument();
  });

  it('borne la tranche au total sur la derniere page', () => {
    render(<Pagination page={5} pages={5} total={95} limit={20} onPageChange={() => {}} />);
    expect(screen.getByText('81–95 sur 95 éléments')).toBeInTheDocument();
  });

  it('gere le cas vide sans afficher « 0–0 sur 0 »', () => {
    render(<Pagination page={1} pages={1} total={0} limit={20} onPageChange={() => {}} />);
    expect(screen.getByText('Aucun élément')).toBeInTheDocument();
  });

  it('accorde le pluriel', () => {
    render(<Pagination page={1} pages={1} total={1} limit={20} onPageChange={() => {}} />);
    expect(screen.getByText('1–1 sur 1 élément')).toBeInTheDocument();
  });

  it('desactive les bords pour empecher une page hors bornes', () => {
    const { unmount } = render(
      <Pagination page={1} pages={3} total={50} limit={20} onPageChange={() => {}} />
    );
    expect(screen.getByRole('button', { name: /précédent/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /suivant/i })).toBeEnabled();
    unmount();

    render(<Pagination page={3} pages={3} total={50} limit={20} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: /suivant/i })).toBeDisabled();
  });

  it('demande la page voisine', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} pages={5} total={95} limit={20} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /suivant/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: /précédent/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
