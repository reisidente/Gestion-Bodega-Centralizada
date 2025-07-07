import { useState } from "react"

export interface ModalState<T = any> {
  open: boolean
  data?: T
}

/**
 * Hook para manejar el estado de modales de forma consistente
 */
export function useModal<T = any>(initialState: ModalState<T> = { open: false }) {
  const [state, setState] = useState<ModalState<T>>(initialState)

  const openModal = (data?: T) => {
    setState({ open: true, data })
  }

  const closeModal = () => {
    setState({ open: false, data: undefined })
  }

  const updateData = (data: T) => {
    setState(prev => ({ ...prev, data }))
  }

  return {
    ...state,
    openModal,
    closeModal,
    updateData,
  }
}

/**
 * Hook para manejar múltiples modales
 */
export function useModals() {
  const modalEditar = useModal()
  const modalAjuste = useModal()
  const modalHistorial = useModal()
  const modalRegistrar = useModal<boolean>()
  const modalAgregarLote = useModal()
  const modalSeleccionarFarmaco = useModal<boolean>()

  return {
    modalEditar,
    modalAjuste,
    modalHistorial,
    modalRegistrar,
    modalAgregarLote,
    modalSeleccionarFarmaco,
  }
}
