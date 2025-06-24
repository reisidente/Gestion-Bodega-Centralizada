import { useEffect, useState } from "react"
import { supabase } from "../../libs/supabase"

export interface Farmacia {
  id_farmacia: number
  nom_farma: string
}

export function useFarmacias() {
  const [farmacias, setFarmacias] = useState<Farmacia[]>([])
  useEffect(() => {
    supabase.from("farmacia").select("id_farmacia, nom_farma").then(({ data }) => {
      setFarmacias(data || [])
    })
  }, [])
  return farmacias
}
