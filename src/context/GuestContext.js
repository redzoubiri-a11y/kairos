import { createContext, useContext } from 'react';

export const GuestContext = createContext({ isGuest: false });
export const useGuestContext = () => useContext(GuestContext);
