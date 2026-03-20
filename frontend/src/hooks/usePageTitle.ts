import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/products':   'Produse',
  '/warehouses': 'Hale & Depozite',
  '/stock':      'Stoc Curent',
  '/movements':  'Mișcări Stoc',
  '/users':      'Utilizatori',
}

export const usePageTitle = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const base    = 'FurniStock'
    const matched = Object.entries(TITLES).find(([path]) => pathname.startsWith(path))
    document.title = matched ? `${matched[1]} — ${base}` : base
  }, [pathname])
}