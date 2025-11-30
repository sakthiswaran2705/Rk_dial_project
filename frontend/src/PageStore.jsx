
import { createContext, useContext, useState } from "react";

const PageContext = createContext();

export function PageProvider({ children }) {
  const [valData, setValData] = useState(null);

  return (
    <PageContext.Provider value={{ valData, setValData }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageStore() {
  return useContext(PageContext);
}