// Point d'entrée unique de la couche données.
// Sélectionne l'adaptateur Supabase si les variables d'environnement sont
// présentes, sinon le backend local de démonstration. Les écrans et hooks
// n'importent jamais un adaptateur directement.

import { hasSupabase } from './client';
import * as local from './local';
import * as remote from './remote';

const impl = hasSupabase ? remote : local;

export const isDemoMode = !hasSupabase;
export const DEMO_OTP = local.DEMO_OTP;

// Authentification
export const sendOtp = impl.sendOtp;
export const verifyOtp = impl.verifyOtp;
export const getSession = impl.getSession;
export const signOut = impl.signOut;
export const updateProfile = impl.updateProfile;
export const registerSalle = impl.registerSalle;

// Salles
export const listSalles = impl.listSalles;
export const getSalle = impl.getSalle;
export const getSalleReviews = impl.getSalleReviews;
export const getAvailability = impl.getAvailability;

// Réservations client
export const createReservation = impl.createReservation;
export const listMyReservations = impl.listMyReservations;
export const getReservation = impl.getReservation;
export const cancelReservation = impl.cancelReservation;
export const declareDeposit = impl.declareDeposit;

// Favoris
export const listFavorites = impl.listFavorites;
export const listFavoriteIds = impl.listFavoriteIds;
export const toggleFavorite = impl.toggleFavorite;

// Pro — réservations & planning
export const proListReservations = impl.proListReservations;
export const proConfirmReservation = impl.proConfirmReservation;
export const proCancelReservation = impl.proCancelReservation;
export const proVerifyDeposit = impl.proVerifyDeposit;
export const proGetPlanning = impl.proGetPlanning;
export const proToggleBlockedDay = impl.proToggleBlockedDay;

// Pro — dashboard, stats, salle
export const proGetDashboard = impl.proGetDashboard;
export const proGetStats = impl.proGetStats;
export const proListSalles = impl.proListSalles;

// Codes promotionnels (§12 Phase 4)
export const checkPromoCode = impl.checkPromoCode;
export const proListPromoCodes = impl.proListPromoCodes;
export const proCreatePromoCode = impl.proCreatePromoCode;
export const proUpdatePromoCode = impl.proUpdatePromoCode;
export const proDeletePromoCode = impl.proDeletePromoCode;

// Parrainage (§12 Phase 4)
export const getReferralSummary = impl.getReferralSummary;
export const checkReferralCode = impl.checkReferralCode;
export const proGetSalle = impl.proGetSalle;
export const proUpdateSalle = impl.proUpdateSalle;
export const proUpdateTarifs = impl.proUpdateTarifs;

// Avis
export const createReview = impl.createReview;
export const proListPendingReviews = impl.proListPendingReviews;
export const proModerateReview = impl.proModerateReview;

// Messagerie
export const listConversations = impl.listConversations;
export const listMessages = impl.listMessages;
export const sendMessage = impl.sendMessage;

// Notifications
export const listNotifications = impl.listNotifications;
export const unreadCount = impl.unreadCount;
export const markAllNotificationsRead = impl.markAllNotificationsRead;
export const markNotificationRead = impl.markNotificationRead;
export const listSmsLog = impl.listSmsLog;

// Abonnement
export const getSubscription = impl.getSubscription;
export const setPaymentMethod = impl.setPaymentMethod;
export const listInvoices = impl.listInvoices;

// Démo
export const resetDemoData = impl.resetDemoData;

// Administration
export const adminGetOverview = impl.adminGetOverview;
export const adminListPendingSalles = impl.adminListPendingSalles;
export const adminReviewSalle = impl.adminReviewSalle;
export const adminListFlaggedReviews = impl.adminListFlaggedReviews;
export const adminResolveReview = impl.adminResolveReview;
