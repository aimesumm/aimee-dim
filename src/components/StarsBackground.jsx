import React, { useMemo } from 'react'

function rand(min, max) {
  return Math.random() * (max - min) + min
}

export default function StarsBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 56 }).map((_, i) => ({
        id: i,
        size: rand(1.5, 3.6),
        left: rand(0, 100),
        top: rand(0, 100),
        duration: rand(10, 24),
        delay: rand(0, 12),
        opacity: rand(0.25, 0.85),
      })),
    [],
  )

  return (
    <div className="stars-layer" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="star"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            opacity: star.opacity,
          }}
        />
      ))}
      <span className="shooting-star shooting-star-a" />
      <span className="shooting-star shooting-star-b" />
    </div>
  )
}
