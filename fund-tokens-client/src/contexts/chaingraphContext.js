import { createContext, useContext } from "react";

export const ChanigraphContext = createContext();

export const useChaingraph = () => useContext(ChanigraphContext);