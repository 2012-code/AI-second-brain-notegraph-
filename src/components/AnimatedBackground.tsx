export default function AnimatedBackground() {
    return (
        <div className="animated-bg">
            {/* Base gradient */}
            <div className="bg-gradient-base" />

            {/* Floating orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            {/* Grid overlay */}
            <div className="bg-grid" />

            {/* Noise texture */}
            <div className="bg-noise" />
        </div>
    );
}
