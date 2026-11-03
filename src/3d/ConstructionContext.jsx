import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// Construction state for 3D components
// States: "hidden" | "revealing" | "active"
// - hidden: Initial state, 3D element is invisible/scaled down
// - revealing: Construction agent is building, 3D entry animation plays
// - active: Construction complete, full interactivity enabled

const ConstructionContext = createContext({
  layerStates: {},
  setLayerState: () => {},
  getLayerState: () => 'active',
  rawLayerState: () => undefined,
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
    // Default to 'active' to ensure content is visible if not managed by construction agent
    return layerStates[layerId] || 'active';
  }, [layerStates]);

  // Raw accessor: returns the EXPLICITLY-set state (undefined if the layer was
  // never touched by the construction engine). This lets a component stay truly
  // HIDDEN until its worker explicitly activates it — unlike getLayerState,
  // which defaults to 'active' so it can never report "not yet built".
  const rawLayerState = useCallback((layerId) => {
    return layerStates[layerId];
  }, [layerStates]);

  const value = useMemo(
    () => ({ layerStates, setLayerState, getLayerState, rawLayerState }),
    [layerStates, setLayerState, getLayerState, rawLayerState]
  );

  return (
    <ConstructionContext.Provider value={value}>
      {children}
    </ConstructionContext.Provider>
  );
}

export function useConstructionState(layerId) {
  const { getLayerState } = useContext(ConstructionContext);
  return getLayerState(layerId);
}

// Returns the explicitly-set construction state, or undefined if this layer has
// not yet been activated by a construction worker. Used to keep premium cards
// fully hidden until their assigned worker completes the build.
export function useRawConstructionState(layerId) {
  const { rawLayerState } = useContext(ConstructionContext);
  return rawLayerState(layerId);
}

export function useSetConstructionState() {
  const { setLayerState } = useContext(ConstructionContext);
  return setLayerState;
}

export default ConstructionContext;
