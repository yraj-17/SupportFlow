import { useEffect, useRef, useState } from 'react'

export function useReveal(options = { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const { threshold = 0.12, rootMargin = '0px 0px -50px 0px' } = options

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(entry.target)
        }
      })
    }, { threshold, rootMargin })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, rootMargin])

  return [ref, visible]
}
