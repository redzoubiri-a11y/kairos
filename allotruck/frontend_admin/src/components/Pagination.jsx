import Button from './Button';

export default function Pagination({ page, pages, total, limit, onPageChange }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span className="pagination__info">
        {total === 0
          ? 'Aucun élément'
          : `${from}–${to} sur ${total} élément${total > 1 ? 's' : ''}`}
      </span>
      <div className="pagination__controls">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          ← Précédent
        </Button>
        <span className="pagination__page">
          Page {page} / {pages || 1}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= (pages || 1)}
        >
          Suivant →
        </Button>
      </div>
    </div>
  );
}
