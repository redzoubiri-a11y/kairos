import Button from './Button';
import EmptyState from './EmptyState';
import Spinner from './Spinner';

/**
 * @param {{
 *   columns: { key: string, header: string, render?: (row: any) => any, align?: string, width?: string }[],
 *   rows: any[],
 *   rowKey?: (row: any) => string,
 *   loading?: boolean,
 *   error?: string | null,
 *   onRetry?: () => void,
 *   emptyTitle?: string,
 *   emptyDescription?: string,
 *   footer?: any
 * }} props
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'Aucun résultat',
  emptyDescription,
  footer,
}) {
  const showState = loading || error || rows.length === 0;

  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    textAlign: column.align || 'left',
                    width: column.width,
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showState ? (
              <tr>
                <td className="table-state" colSpan={columns.length}>
                  {loading && <Spinner size={24} label="Chargement des données…" />}

                  {!loading && error && (
                    <EmptyState
                      title="Impossible de charger les données"
                      description={error}
                      icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 8v5" strokeLinecap="round" />
                          <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
                          <path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinejoin="round" />
                        </svg>
                      }
                      action={
                        onRetry && (
                          <Button size="sm" onClick={onRetry} style={{ marginTop: 10 }}>
                            Réessayer
                          </Button>
                        )
                      }
                    />
                  )}

                  {!loading && !error && rows.length === 0 && (
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((column) => (
                    <td key={column.key} style={{ textAlign: column.align || 'left' }}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
