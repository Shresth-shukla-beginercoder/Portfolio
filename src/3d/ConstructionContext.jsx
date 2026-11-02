import { createContext, useContext, useState, useCallback } from 'react';

// Construction state for 3D components
// States: "hidden" | "revealing" | "active"
// - hidden: Initial state, 3D element is invisible/scaled down
// - revealing: Construction agent is building, 3D entry animation plays
// - active: Construction complete, full interactivity enabled

const ConstructionContext = createContext({
  layerStates: {},
  setLayerState: () => {},
  getLayerState: () => 'hidden',
});

export function ConstructionProvider({ children }) {
  const [layerStates, setLayerStates] = useState({});

  const setLayerState = useCallback((layerId, state) => {
    setLayerStates(prev => ({
      ...prev,
      [layerId]: state,
    }));
  }, []);

  const getLayerState = useCallback((layerId) => {
    return layerStates[layerId] || 'hidden';
  }, [layerStates]);

  return (
    <ConstructionContext.Provider value={{ layerStates, setLayerState, getLayerState }}>
      {children}
    </ConstructionContext.Provider>
  );
}

export function useConstructionState(layerId) {
  const { getLayerState } = useContext(ConstructionContext);
  return getLayerState(layerId);
}

export function useSetConstructionState() {
  const { setLayerState } = useContext(ConstructionContext);
  return setLayerState;
}

export default ConstructionContext;
