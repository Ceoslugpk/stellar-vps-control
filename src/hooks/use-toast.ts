import * as React from "react"
import {
  type State,
  dispatch,
  listeners,
  memoryState,
  toast as toastFn, // Renamed to avoid conflict with the hook's return
} from "@/lib/toast"

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state]) // Removed `state` from dependencies as it causes re-subscription on every render

  return {
    ...state,
    toast: toastFn,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast }
// Do not export toastFn from here to avoid react-refresh warning
// Components should import toastFn from "@/lib/toast" if they need the function directly
// or use the toast function returned by useToast()
