import { useEffect, useRef } from 'react'

/**
 * Adds an `.in` class to any element with `.reveal` once it scrolls into view.
 * Returns a `ref` setter — attach to each element you want revealed.
 */
export function useReveal() {
  const refs = useRef<HTMLElement[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
          }
        })
      },
      { threshold: 0.12 }
    )

    refs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const addRef = (el: HTMLElement | null) => {
    if (el && !refs.current.includes(el)) {
      refs.current.push(el)
    }
  }

  return addRef
}
