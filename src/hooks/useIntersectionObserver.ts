import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook for detecting when an element enters the viewport
 * Replacement for react-intersection-observer
 */
export function useInView(options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      options
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [options])

  return { ref, inView }
}
