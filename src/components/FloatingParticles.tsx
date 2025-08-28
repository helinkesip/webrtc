const FloatingParticles = () => {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: Math.random() * 40 + 20,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 6
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="floating-particle bg-gradient-to-r from-primary/20 to-accent/20"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;