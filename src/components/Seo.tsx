import { useEffect } from 'react'
import { SITE_URL } from '../data/site'

// Valeurs par défaut = celles d'index.html (restaurées au démontage de la page)
const DEFAULT_TITLE = 'MMA IQ — Ta semaine de MMA, avec un plan clair'
const DEFAULT_DESCRIPTION =
  "Découvre MMA IQ : entraînement, tutoriels et suivi de progression en MMA. Inscris-toi gratuitement pour être prévenu du lancement de l'application."
const DEFAULT_OG_DESCRIPTION =
  "Entraînement, tutoriels et suivi de progression. Découvre l'application MMA IQ en préparation et sois prévenu de son lancement."

const JSONLD_ATTR = 'data-seo-jsonld'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function Seo({
  title,
  description,
  canonicalPath,
  jsonLd,
}: {
  title: string
  description?: string
  canonicalPath?: string
  jsonLd?: object
}) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : undefined

  useEffect(() => {
    document.title = title

    const desc = description ?? DEFAULT_DESCRIPTION
    upsertMeta('name', 'description', desc)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description ?? DEFAULT_OG_DESCRIPTION)

    let canonical: HTMLLinkElement | null = null
    if (canonicalPath) {
      canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', `${SITE_URL}${canonicalPath}`)
    }

    let script: HTMLScriptElement | null = null
    if (jsonLdString) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute(JSONLD_ATTR, '')
      script.textContent = jsonLdString
      document.head.appendChild(script)
    }

    return () => {
      document.title = DEFAULT_TITLE
      upsertMeta('name', 'description', DEFAULT_DESCRIPTION)
      upsertMeta('property', 'og:title', DEFAULT_TITLE)
      upsertMeta('property', 'og:description', DEFAULT_OG_DESCRIPTION)
      canonical?.remove()
      script?.remove()
    }
  }, [title, description, canonicalPath, jsonLdString])

  return null
}
