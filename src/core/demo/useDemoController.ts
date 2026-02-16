import { useEffect, useState } from "react";
import type { DemoStep } from "./demoScript";

export function useDemoController(steps: DemoStep[], enabled: boolean) {
    const [activeStep, setActiveStep] = useState<DemoStep | null>(null);

    useEffect(() => {
        if (!enabled) {
            setActiveStep(null);
            return;
        }

        let i = 0;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const run = () => {
            const step = steps[i];
            if (!step) return;

            setActiveStep(step);

            timer = setTimeout(() => {
                i += 1;
                run();
            }, step.durationMs);
        };

        run();

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [enabled, steps]);

    return activeStep;
}
