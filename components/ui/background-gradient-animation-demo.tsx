import React from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export function BackgroundGradientAnimationDemo() {
  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(16, 185, 129)"    // HeysMe emerald-500
      gradientBackgroundEnd="rgb(6, 182, 212)"       // HeysMe cyan-500
      firstColor="52, 211, 153"                       // emerald-400
      secondColor="45, 212, 191"                      // teal-400
      thirdColor="34, 211, 238"                       // cyan-400
      fourthColor="16, 185, 129"                      // emerald-500
      fifthColor="6, 182, 212"                        // cyan-500
      pointerColor="34, 211, 153"                     // emerald-400
      interactive={true}
      containerClassName="fixed inset-0 z-0"
    >
      <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl">
        <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
          HeysMe AI 驱动
        </p>
      </div>
    </BackgroundGradientAnimation>
  );
}