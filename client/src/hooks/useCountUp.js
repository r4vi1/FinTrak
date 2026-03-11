import { useState, useEffect } from "react";

export function useCountUp(endValue, duration = 1500) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (endValue === undefined || endValue === null) return;

        let startTime = null;
        let animationFrame;

        // Easing function for smooth deceleration
        const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

        const startValue = value; // Animate from current value if it changes
        const distance = endValue - startValue;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            setValue(Math.floor(startValue + distance * easeOutQuint(progress)));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setValue(endValue);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [endValue, duration]); // Intentionally not including 'value' to avoid re-triggering mid-animation

    return value;
}
