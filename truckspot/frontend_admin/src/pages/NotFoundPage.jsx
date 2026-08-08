import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFoundPage() {
  return (
    <div className="notfound">
      <div>
        <div className="notfound__code">404</div>
        <h1 className="page__title" style={{ marginTop: 10 }}>
          Page introuvable
        </h1>
        <p className="page__desc" style={{ marginBottom: 18 }}>
          La page demandée n'existe pas ou a été déplacée.
        </p>
        <Link to="/">
          <Button variant="primary">Retour au tableau de bord</Button>
        </Link>
      </div>
    </div>
  );
}
