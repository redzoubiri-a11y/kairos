-- Permet à un client de supprimer ses propres réservations passées
-- (historique) depuis l'app. Volontairement restreint aux réservations
-- passées ou déjà terminées/annulées : une réservation à venir doit
-- passer par le flux "Annuler" (notifie le restaurant), pas par une
-- suppression directe.
create policy reservations_user_delete_history
on reservations
for delete
using (
  user_id in (select id from users where auth_id = auth.uid())
  and (date < current_date or status in ('cancelled', 'no_show', 'arrived'))
);
