-- useClickCollect / useProOrders insèrent des notifications de type
-- 'new_order' et 'order_update', absentes de l'enum notification_type.
alter type notification_type add value if not exists 'new_order';
alter type notification_type add value if not exists 'order_update';
